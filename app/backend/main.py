import asyncio
import concurrent.futures
import json
import os
import shutil
import time
import uuid
import subprocess
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sse_starlette.sse import EventSourceResponse

from compressor import compress_default, compress_targeted, probe_video

import tempfile
import threading

MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "0"))
MAX_UPLOAD_BYTES: int = MAX_UPLOAD_MB * 1024 * 1024 if MAX_UPLOAD_MB > 0 else 0
JOB_TTL_SECONDS: int = int(os.getenv("JOB_TTL_SECONDS", "1800"))
MAX_WORKERS: int = int(os.getenv("MAX_WORKERS", "2"))
DEFAULT_WORK_DIR = Path(tempfile.gettempdir()) / "videopress_jobs"
WORK_DIR = Path(os.getenv("WORK_DIR", str(DEFAULT_WORK_DIR)))
WORK_DIR.mkdir(parents=True, exist_ok=True)
CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "*").split(",")

jobs: dict[str, dict] = {}
_jobs_lock = threading.Lock()
_active_workers_lock = threading.Lock()
_active_workers = 0
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS)


async def _cleanup_loop() -> None:
    while True:
        await asyncio.sleep(300)
        now = time.time()
        with _jobs_lock:
            expired = [jid for jid, j in list(jobs.items()) if now - j["created_at"] > JOB_TTL_SECONDS]
        for jid in expired:
            _purge_job(jid)

        # Clean up any orphaned directories left on disk from past sessions or crashes
        try:
            for p in WORK_DIR.iterdir():
                if p.is_dir() and p.name not in jobs:
                    try:
                        if now - p.stat().st_mtime > JOB_TTL_SECONDS:
                            shutil.rmtree(p, ignore_errors=True)
                    except Exception:
                        pass
        except Exception:
            pass


def _purge_job(job_id: str) -> None:
    with _jobs_lock:
        job = jobs.pop(job_id, None)
    if job:
        job["_cancelled"] = True
        proc = job.get("_proc")
        if proc and proc.poll() is None:
            try:
                proc.kill()
                proc.wait(timeout=2)
            except Exception:
                pass
    job_dir = WORK_DIR / job_id
    if job_dir.exists():
        shutil.rmtree(job_dir, ignore_errors=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_cleanup_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="Tuckin API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


def _get_job(job_id: str) -> dict:
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found or expired")
    return jobs[job_id]


import urllib.parse

def _safe_filename(name: str) -> str:
    cleaned = Path(name).name.replace("\x00", "").strip()
    return cleaned or "video.mp4"


SUPPORTED_VIDEO_EXTENSIONS = {
    ".mp4", ".mov", ".mkv", ".webm", ".avi", ".flv", ".wmv", ".m4v",
    ".ts", ".mts", ".m2ts", ".3gp", ".3g2", ".ogv", ".ogg", ".vob",
    ".asf", ".rm", ".rmvb", ".divx", ".f4v", ".mpg", ".mpeg", ".mpe"
}


@app.get("/health")
def health():
    return {"status": "ok", "jobs_active": len(jobs)}


@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    ct = (file.content_type or "").lower()
    ext = Path(file.filename or "").suffix.lower()

    is_video_mime = ct.startswith("video/") or ct in (
        "application/octet-stream",
        "application/x-matroska",
        "application/ogg",
        "application/vnd.rn-realmedia",
    )
    is_video_ext = ext in SUPPORTED_VIDEO_EXTENSIONS

    if not is_video_mime and not is_video_ext:
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid video file (MP4, MKV, MOV, WebM, AVI, etc.).",
        )

    # Free disk space check: verify at least 200 MB free space
    free_bytes = shutil.disk_usage(WORK_DIR).free
    if free_bytes < 200 * 1024 * 1024:
        raise HTTPException(
            status_code=507,
            detail="Insufficient server storage to accept upload.",
        )

    job_id = str(uuid.uuid4())
    job_dir = WORK_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    original_name = _safe_filename(file.filename or "video.mp4")
    input_path = str(job_dir / f"input_{original_name}")

    total_bytes = 0
    try:
        async with aiofiles.open(input_path, "wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if MAX_UPLOAD_MB > 0 and total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds the {MAX_UPLOAD_MB} MB upload limit.",
                    )
                await out.write(chunk)
    except HTTPException:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise
    except Exception as exc:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}") from exc

    if total_bytes == 0:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    try:
        probe = probe_video(input_path)
    except Exception as exc:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(
            status_code=422,
            detail=f"Could not read video file. Is it a valid video? ({exc})",
        ) from exc

    stem = Path(original_name).stem
    output_filename = f"{stem}_compressed.mp4"
    output_path = str(job_dir / output_filename)

    jobs[job_id] = {
        "status": "pending",
        "progress": 0.0,
        "message": "Upload complete. Ready to compress.",
        "error": None,
        "input_path": input_path,
        "output_path": output_path,
        "output_filename": output_filename,
        "output_size_mb": None,
        "probe": probe,
        "created_at": time.time(),
        "_future": None,
    }

    return {
        "job_id": job_id,
        "probe": probe,
        "output_filename": output_filename,
    }


@app.post("/api/compress/{job_id}")
async def start_compression(
    job_id: str,
    mode: str = Form(...),
    target_max_mb: Optional[float] = Form(None),
):
    job = _get_job(job_id)

    if job["status"] == "compressing":
        raise HTTPException(status_code=409, detail="Job is already running.")
    if job["status"] == "done":
        raise HTTPException(status_code=409, detail="Job already completed. Download or delete it.")
    if mode not in ("default", "targeted"):
        raise HTTPException(status_code=400, detail="mode must be 'default' or 'targeted'.")

    if mode == "targeted":
        if target_max_mb is None:
            raise HTTPException(status_code=400, detail="target_max_mb is required for targeted mode.")
        if target_max_mb <= 0:
            raise HTTPException(status_code=400, detail="target_max_mb must be greater than 0.")
        input_mb = job["probe"]["file_size_mb"]
        if target_max_mb >= input_mb:
            raise HTTPException(
                status_code=400,
                detail=f"target_max_mb ({target_max_mb} MB) must be smaller than the input file ({input_mb:.1f} MB).",
            )

    job["_proc"] = None
    with _active_workers_lock:
        if _active_workers >= MAX_WORKERS:
            job["status"] = "queued"
            job["message"] = "In queue — waiting for available compression slot…"
        else:
            job["status"] = "compressing"
            job["message"] = (
                "Starting compression (best quality)…"
                if mode == "default"
                else f"Starting 2-pass compression targeting ≤{target_max_mb:.1f} MB…"
            )
    job["progress"] = 0.0
    job["error"] = None

    input_path = job["input_path"]
    output_path = job["output_path"]
    duration = job["probe"]["duration"]

    def _run():
        global _active_workers
        with _active_workers_lock:
            _active_workers += 1
            job["status"] = "compressing"

        try:
            def on_progress(p: float):
                job["progress"] = round(p, 4)

            def on_proc(p: subprocess.Popen):
                job["_proc"] = p

            cancel_check = lambda: job.get("_cancelled", False)
            has_audio = job["probe"].get("has_audio", True)

            if mode == "default":
                job["message"] = "Encoding…"
                compress_default(
                    input_path,
                    output_path,
                    duration,
                    on_progress,
                    proc_callback=on_proc,
                    cancel_check=cancel_check,
                )
            else:
                def on_progress_targeted(p: float):
                    job["progress"] = round(p, 4)
                    job["message"] = f"Encoding targeted… ({int(p * 100)}%)"

                compress_targeted(
                    input_path,
                    output_path,
                    target_max_mb,
                    duration,
                    on_progress_targeted,
                    proc_callback=on_proc,
                    has_audio=has_audio,
                    cancel_check=cancel_check,
                )

            if cancel_check():
                return

            out_size = os.path.getsize(output_path)
            in_size = os.path.getsize(input_path) if os.path.exists(input_path) else job["probe"]["file_size"]

            # Keep original stream ONLY IF input was already standard web-compatible H.264 yuv420p,
            # within the 1280 resolution ceiling, and has even dimensions
            probe_fmt = job["probe"].get("codec", "")
            probe_w = job["probe"].get("width", 0)
            probe_h = job["probe"].get("height", 0)
            is_odd = (probe_w % 2 != 0 or probe_h % 2 != 0)
            is_within_res_cap = max(probe_w, probe_h) <= 1280
            is_compatible = (probe_fmt in ("h264", "libx264") and not is_odd and is_within_res_cap)

            if is_compatible and out_size >= in_size and os.path.exists(input_path):
                shutil.copy2(input_path, output_path)
                out_size = os.path.getsize(output_path)
                job["message"] = "Input was already optimally compressed. Kept original stream."
            else:
                job["message"] = "Compression complete! Ready to download."


            job["output_size_mb"] = round(out_size / (1024 * 1024), 2)
            job["status"] = "done"
            job["progress"] = 1.0

            try:
                os.remove(input_path)
            except OSError:
                pass

        except Exception as exc:
            if job.get("_cancelled"):
                return
            job["status"] = "error"
            job["error"] = str(exc)
            job["message"] = f"Compression failed: {exc}"
        finally:
            with _active_workers_lock:
                _active_workers -= 1
            job["_proc"] = None

    loop = asyncio.get_running_loop()
    job["_future"] = loop.run_in_executor(_executor, _run)

    return {"job_id": job_id, "status": job["status"]}


@app.get("/api/stream/{job_id}")
async def stream_progress(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found.")

    async def _generator():
        while True:
            job = jobs.get(job_id)
            if not job:
                yield {"event": "status", "data": json.dumps({"status": "not_found"})}
                break

            payload = {
                "status": job["status"],
                "progress": job["progress"],
                "message": job["message"],
                "error": job.get("error"),
                "output_size_mb": job.get("output_size_mb"),
                "output_filename": job.get("output_filename"),
            }
            yield {"event": "status", "data": json.dumps(payload)}

            if job["status"] in ("done", "error"):
                break

            await asyncio.sleep(0.5)

    return EventSourceResponse(_generator())


@app.get("/api/status/{job_id}")
def get_status(job_id: str):
    job = _get_job(job_id)
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "message": job["message"],
        "error": job.get("error"),
        "output_size_mb": job.get("output_size_mb"),
        "output_filename": job.get("output_filename"),
        "probe": job.get("probe"),
    }


@app.get("/api/download/{job_id}")
@app.get("/api/download/{job_id}/{filename}")
def download_file(job_id: str, filename: Optional[str] = None):
    job = _get_job(job_id)
    if job["status"] != "done":
        raise HTTPException(status_code=409, detail="Compression is not complete yet.")

    output_path = job["output_path"]
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Output file not found — it may have expired.")

    download_name = filename or job.get("output_filename") or f"{job_id}_compressed.mp4"
    if not download_name.lower().endswith(".mp4"):
        download_name += ".mp4"

    # RFC 5987 encoded Content-Disposition for unicode, spaces and emoji support
    safe_ascii = download_name.encode("ascii", "ignore").decode("ascii") or "video.mp4"
    encoded_filename = urllib.parse.quote(download_name)
    cd_header = f'attachment; filename="{safe_ascii}"; filename*=UTF-8\'\'{encoded_filename}'

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=download_name,
        headers={"Content-Disposition": cd_header},
    )



@app.get("/api/preview/{job_id}")
@app.get("/api/preview/{job_id}/{filename}")
def preview_file(job_id: str, filename: Optional[str] = None):
    job = _get_job(job_id)
    if job["status"] != "done":
        raise HTTPException(status_code=409, detail="Compression is not complete yet.")

    output_path = job["output_path"]
    if not os.path.exists(output_path):
        raise HTTPException(status_code=404, detail="Output file not found — it may have expired.")

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        headers={"Content-Disposition": "inline", "Accept-Ranges": "bytes"},
    )


@app.delete("/api/job/{job_id}")
def delete_job(job_id: str):
    _purge_job(job_id)
    return {"deleted": job_id}
