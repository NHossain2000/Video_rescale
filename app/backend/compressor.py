import json
import os
import shutil
import subprocess
import threading
from pathlib import Path
from typing import Callable, Optional

# Long-side cap for default 720p tier: caps whichever edge is longest to 1280
_SCALE_CPU = (
    "scale='if(gte(iw,ih),min(1280\\,iw),-2)'"
    ":'if(gte(iw,ih),-2,min(1280\\,ih))'"
)

_SCALE_GPU = (
    "scale_cuda='if(gte(iw,ih),min(1280\\,iw),-2)'"
    ":'if(gte(iw,ih),-2,min(1280\\,ih))'"
)


def get_adaptive_scale(video_kbps: int) -> str:
    """Select the best max resolution for a given bitrate budget to prevent macroblocking.
    Guarantees long-side capping symmetrically for landscape and portrait orientations."""
    if video_kbps >= 2200:
        return "scale='if(gte(iw,ih),min(1920\\,iw),-2)':'if(gte(iw,ih),-2,min(1920\\,ih))'"
    elif video_kbps >= 800:
        return "scale='if(gte(iw,ih),min(1280\\,iw),-2)':'if(gte(iw,ih),-2,min(1280\\,ih))'"
    else:
        return "scale='if(gte(iw,ih),min(960\\,iw),-2)':'if(gte(iw,ih),-2,min(960\\,ih))'"


def probe_video(input_path: str) -> dict:
    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_streams", "-show_format",
        input_path,
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {result.stderr.decode(errors='replace')}")

    data = json.loads(result.stdout)
    video_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), None)
    if not video_stream:
        raise RuntimeError("No readable video stream found in file.")

    audio_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "audio"), None)
    has_audio = audio_stream is not None

    fmt = data.get("format", {})

    duration = float(fmt.get("duration", 0) or 0)
    file_size = int(fmt.get("size", 0) or 0)
    width = int(video_stream.get("width", 0)) if video_stream else 0
    height = int(video_stream.get("height", 0)) if video_stream else 0
    codec = video_stream.get("codec_name", "unknown") if video_stream else "unknown"

    fps = 0.0
    try:
        num, den = (video_stream or {}).get("r_frame_rate", "0/1").split("/")
        fps = round(float(num) / float(den), 2) if float(den) else 0.0
    except Exception:
        pass

    return {
        "duration": duration,
        "file_size": file_size,
        "file_size_mb": max(round(file_size / (1024 * 1024), 2), 0.01),
        "width": width,
        "height": height,
        "codec": codec,
        "fps": fps,
        "has_audio": has_audio,
    }


def validate_output_mp4(file_path: str) -> bool:
    """Validates that the output file exists, is non-empty, and ffprobe reads it cleanly."""
    if not os.path.exists(file_path) or os.path.getsize(file_path) < 32:
        return False
    cmd = ["ffprobe", "-v", "error", file_path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return res.returncode == 0


def _run_ffmpeg(
    command: list,
    duration: float,
    progress_callback: Optional[Callable[[float], None]] = None,
    pass_offset: float = 0.0,
    pass_scale: float = 1.0,
    proc_callback: Optional[Callable[[subprocess.Popen], None]] = None,
    cwd: Optional[str] = None,
) -> None:
    # Run with -nostdin to prevent hanging in non-interactive / background worker environments
    cmd = [command[0], "-nostdin", "-progress", "pipe:1", "-nostats"] + command[1:]
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=cwd
    )
    if proc_callback:
        proc_callback(proc)

    stderr_lines: list = []

    def _drain_stderr():
        try:
            if proc.stderr:
                for line in proc.stderr:
                    stderr_lines.append(line)
        except Exception:
            pass

    stderr_thread = threading.Thread(target=_drain_stderr, daemon=True)
    stderr_thread.start()

    try:
        if proc.stdout:
            for raw_line in proc.stdout:
                line = raw_line.decode(errors="replace").strip()
                if line.startswith("out_time_us=") and progress_callback and duration > 0:
                    try:
                        us = int(line.split("=", 1)[1])
                        if us >= 0:
                            pct = min(us / 1_000_000 / duration, 1.0)
                            progress_callback(pass_offset + pct * pass_scale)
                    except (ValueError, IndexError):
                        pass

        proc.wait()
        stderr_thread.join(timeout=10)
    finally:
        if proc.poll() is None:
            try:
                proc.kill()
            except Exception:
                pass
        try:
            if proc.stdout:
                proc.stdout.close()
            if proc.stderr:
                proc.stderr.close()
        except Exception:
            pass

    if proc.returncode != 0:
        stderr_text = b"".join(stderr_lines).decode(errors="replace")
        raise RuntimeError(f"FFmpeg failed (exit {proc.returncode}):\n{stderr_text[-3000:]}")


def _gpu_default_cmd(input_path: str, output_path: str) -> list:
    return [
        "ffmpeg", "-y",
        "-hwaccel", "cuda",
        "-hwaccel_output_format", "cuda",
        "-i", input_path,
        "-map", "0:v:0",
        "-map", "0:a:0?",
        "-c:v", "hevc_nvenc",
        "-preset", "p4",
        "-rc", "vbr",
        "-cq", "28",
        "-b:v", "0",
        "-vf", _SCALE_GPU,
        "-c:a", "aac",
        "-b:a", "128k",
        "-ac", "2",
        "-movflags", "+faststart",
        "-tag:v", "hvc1",
        output_path,
    ]


def _cpu_default_cmd(input_path: str, output_path: str) -> list:
    return [
        "ffmpeg", "-y",
        "-i", input_path,
        "-map", "0:v:0",
        "-map", "0:a:0?",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        "-bf", "3",
        "-vf", _SCALE_CPU,
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-ac", "2",
        "-movflags", "+faststart",
        output_path,
    ]


def compress_default(
    input_path: str,
    output_path: str,
    duration: float,
    progress_callback: Optional[Callable[[float], None]] = None,
    proc_callback: Optional[Callable[[subprocess.Popen], None]] = None,
    cancel_check: Optional[Callable[[], bool]] = None,
) -> None:
    temp_part = f"{output_path}.part.mp4"
    if os.path.exists(temp_part):
        try:
            os.remove(temp_part)
        except OSError:
            pass

    gpu_failed = False
    try:
        cmd_gpu = _gpu_default_cmd(input_path, temp_part)
        cmd_gpu.insert(-1, "-f")
        cmd_gpu.insert(-1, "mp4")
        _run_ffmpeg(
            cmd_gpu,
            duration,
            progress_callback,
            proc_callback=proc_callback,
        )
    except Exception as exc:
        gpu_failed = True
        if cancel_check and cancel_check():
            if os.path.exists(temp_part):
                try:
                    os.remove(temp_part)
                except OSError:
                    pass
            raise RuntimeError("Compression was cancelled.") from exc

        # GPU failed or unavailable — clean up partial file before CPU fallback
        if os.path.exists(temp_part):
            try:
                os.remove(temp_part)
            except OSError:
                pass

    if gpu_failed:
        if cancel_check and cancel_check():
            raise RuntimeError("Compression was cancelled.")
        cmd_cpu = _cpu_default_cmd(input_path, temp_part)
        cmd_cpu.insert(-1, "-f")
        cmd_cpu.insert(-1, "mp4")
        _run_ffmpeg(
            cmd_cpu,
            duration,
            progress_callback,
            proc_callback=proc_callback,
        )

    # Validate output atomicity
    if not validate_output_mp4(temp_part):
        if os.path.exists(temp_part):
            try:
                os.remove(temp_part)
            except OSError:
                pass
        raise RuntimeError("Validation failed: Output file is not a valid MP4 container.")

    # Atomic rename from .part.mp4 to final output_path
    os.replace(temp_part, output_path)


def compress_targeted(
    input_path: str,
    output_path: str,
    target_size_mb: float,
    duration: float,
    progress_callback: Optional[Callable[[float], None]] = None,
    proc_callback: Optional[Callable[[subprocess.Popen], None]] = None,
    has_audio: bool = True,
    cancel_check: Optional[Callable[[], bool]] = None,
) -> None:
    if duration <= 0:
        raise ValueError("Cannot target size for a video with unknown duration.")

    # Apply an 8% safety margin so container muxing overhead (moov/mdat) doesn't overshoot
    effective_target_mb = target_size_mb * 0.92
    total_bits = effective_target_mb * 1024 * 1024 * 8
    total_kbps = total_bits / duration / 1000

    min_required_kbps = 80 if duration >= 60 else 32
    min_possible_mb = max(round((min_required_kbps * 1000 * duration) / (8 * 1024 * 1024 * 0.92), 2), 0.05)
    if total_kbps < min_required_kbps:
        raise ValueError(
            f"Target size of {target_size_mb:.1f} MB is impossible for a {duration:.0f}s video. "
            f"Minimum achievable size without extreme artifacting is ~{min_possible_mb:.1f} MB."
        )

    if has_audio and total_kbps > 64:
        audio_kbps = 128 if total_kbps >= 600 else (96 if total_kbps >= 250 else 48)
        audio_bits = audio_kbps * 1000 * duration
        video_bits = max(total_bits - audio_bits, 0)
        video_kbps = max(int(video_bits / duration / 1000), 64)
        audio_args = ["-c:a", "aac", "-b:a", f"{audio_kbps}k", "-ac", "2"]
    else:
        video_kbps = max(int(total_bits / duration / 1000), 48)
        audio_args = ["-an"]

    scale_filter = get_adaptive_scale(video_kbps)
    work_dir = Path(output_path).parent

    temp_part = f"{output_path}.part.mp4"
    if os.path.exists(temp_part):
        try:
            os.remove(temp_part)
        except OSError:
            pass

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-map", "0:v:0",
    ]
    if has_audio and "-an" not in audio_args:
        cmd += ["-map", "0:a:0?"]
    cmd += [
        "-c:v", "libx264",
        "-b:v", f"{video_kbps}k",
        "-maxrate", f"{video_kbps}k",
        "-bufsize", f"{int(video_kbps * 1.2)}k",
        "-preset", "fast",
        "-bf", "3",
        "-vf", scale_filter,
        "-pix_fmt", "yuv420p",
    ] + audio_args + [
        "-movflags", "+faststart",
        "-f", "mp4",
        temp_part,
    ]

    try:
        _run_ffmpeg(cmd, duration, progress_callback, proc_callback=proc_callback, cwd=str(work_dir))
    except Exception as exc:
        if os.path.exists(temp_part):
            try:
                os.remove(temp_part)
            except OSError:
                pass
        raise exc

    # Post-check: safety margin post-check ensures no overshoot
    if os.path.exists(temp_part) and os.path.getsize(temp_part) > target_size_mb * 1024 * 1024:
        overshoot_ratio = os.path.getsize(temp_part) / (target_size_mb * 1024 * 1024)
        corrected_kbps = int(video_kbps / (overshoot_ratio * 1.08))
        cmd_re = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-map", "0:v:0",
        ]
        if has_audio and "-an" not in audio_args:
            cmd_re += ["-map", "0:a:0?"]
        cmd_re += [
            "-c:v", "libx264",
            "-b:v", f"{corrected_kbps}k",
            "-maxrate", f"{corrected_kbps}k",
            "-bufsize", f"{int(corrected_kbps * 1.0)}k",
            "-preset", "fast",
            "-bf", "3",
            "-vf", scale_filter,
            "-pix_fmt", "yuv420p",
        ] + audio_args + [
            "-movflags", "+faststart",
            "-f", "mp4",
            temp_part,
        ]
        _run_ffmpeg(cmd_re, duration, progress_callback, proc_callback=proc_callback, cwd=str(work_dir))

    if not validate_output_mp4(temp_part):
        if os.path.exists(temp_part):
            try:
                os.remove(temp_part)
            except OSError:
                pass
        raise RuntimeError("Validation failed: Output file is not a valid MP4 container.")

    os.replace(temp_part, output_path)


