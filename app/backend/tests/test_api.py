import time
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

def test_health_check(client: TestClient):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "jobs_active" in data

def test_upload_invalid_file_type(client: TestClient, tmp_path):
    text_file = tmp_path / "document.txt"
    text_file.write_text("hello world")
    with open(text_file, "rb") as f:
        res = client.post("/api/upload", files={"file": ("document.txt", f, "text/plain")})
    assert res.status_code == 400
    assert "Please upload a valid video file" in res.json()["detail"]

def test_upload_corrupt_video(client: TestClient, tmp_path):
    fake_mp4 = tmp_path / "fake.mp4"
    fake_mp4.write_bytes(b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00corrupteddata")
    with open(fake_mp4, "rb") as f:
        res = client.post("/api/upload", files={"file": ("fake.mp4", f, "video/mp4")})
    assert res.status_code == 422
    assert "Could not read video file" in res.json()["detail"]

def test_full_video_lifecycle_and_compression(client: TestClient, sample_video_path):
    # 1. Upload valid video
    with open(sample_video_path, "rb") as f:
        upload_res = client.post("/api/upload", files={"file": ("sample.mp4", f, "video/mp4")})
    assert upload_res.status_code == 200
    upload_data = upload_res.json()
    job_id = upload_data["job_id"]
    probe = upload_data["probe"]
    assert probe["width"] == 320
    assert probe["height"] == 240
    assert upload_data["output_filename"] == "sample_compressed.mp4"

    # 2. Check initial status
    status_res = client.get(f"/api/status/{job_id}")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "pending"

    # 3. Test validation errors on compression
    # Missing required target_max_mb in targeted mode
    bad_req1 = client.post(f"/api/compress/{job_id}", data={"mode": "targeted"})
    assert bad_req1.status_code == 400

    # target_max_mb >= input file size
    bad_req2 = client.post(
        f"/api/compress/{job_id}",
        data={"mode": "targeted", "target_max_mb": probe["file_size_mb"] + 10}
    )
    assert bad_req2.status_code == 400

    # 4. Start valid compression (55% compression mode)
    target_mb = round(probe["file_size_mb"] * 0.45, 4)
    comp_res = client.post(
        f"/api/compress/{job_id}",
        data={"mode": "targeted", "target_max_mb": target_mb}
    )
    res_data = comp_res.json()
    if res_data["status"] == "error":
        status_info = client.get(f"/api/status/{job_id}").json()
        pytest.fail(f"Job failed immediately: {status_info}")
    assert res_data["status"] in ("compressing", "queued")

    # 5. Wait for compression to complete
    max_wait = 30
    start_time = time.time()
    final_status = None
    while time.time() - start_time < max_wait:
        poll_res = client.get(f"/api/status/{job_id}")
        data = poll_res.json()
        if data["status"] in ("done", "error"):
            final_status = data
            break
        time.sleep(0.5)

    assert final_status is not None, "Compression timed out"
    assert final_status["status"] == "done", f"Compression failed with: {final_status.get('error')}"
    assert final_status["progress"] == 1.0

    # 6. Download compressed file
    download_res = client.get(f"/api/download/{job_id}")
    assert download_res.status_code == 200
    assert len(download_res.content) > 0
    assert download_res.headers["content-type"] == "video/mp4"

    # 7. Delete job and verify cleanup
    del_res = client.delete(f"/api/job/{job_id}")
    assert del_res.status_code == 200

    # Status should now be 404
    after_del = client.get(f"/api/status/{job_id}")
    assert after_del.status_code == 404


def test_concurrent_multi_user_jobs(client: TestClient, sample_video_path):
    """Simulate multiple users compressing videos concurrently to verify worker pool and isolation."""
    job_ids = []
    # Upload 3 videos (user A, user B, user C)
    for i in range(3):
        with open(sample_video_path, "rb") as f:
            res = client.post("/api/upload", files={"file": (f"user_{i}.mp4", f, "video/mp4")})
        assert res.status_code == 200
        job_ids.append(res.json()["job_id"])

    # Start compression for all 3 concurrently
    for jid in job_ids:
        res = client.post(
            f"/api/compress/{jid}",
            data={"mode": "default"}
        )
        assert res.status_code == 200
        assert res.json()["status"] in ("compressing", "queued")

    # Wait for all 3 jobs to complete
    max_wait = 30
    start_time = time.time()
    pending = set(job_ids)
    while pending and time.time() - start_time < max_wait:
        for jid in list(pending):
            data = client.get(f"/api/status/{jid}").json()
            if data["status"] == "done":
                pending.remove(jid)
            elif data["status"] == "error":
                pytest.fail(f"Concurrent job {jid} failed: {data.get('error')}")
        if pending:
            time.sleep(0.5)

    assert len(pending) == 0, f"Jobs did not complete in time: {pending}"

    # Verify each job generated independent non-empty download
    for jid in job_ids:
        dl = client.get(f"/api/download/{jid}")
        assert dl.status_code == 200
        assert len(dl.content) > 0
        client.delete(f"/api/job/{jid}")


def test_job_cancellation_and_process_termination(client: TestClient, sample_video_path):
    """Verify that deleting a running job halts the subprocess and purges files cleanly."""
    with open(sample_video_path, "rb") as f:
        res = client.post("/api/upload", files={"file": ("cancel_test.mp4", f, "video/mp4")})
    assert res.status_code == 200
    jid = res.json()["job_id"]

    # Start compression
    comp_res = client.post(f"/api/compress/{jid}", data={"mode": "default"})
    assert comp_res.status_code == 200

    # Immediately delete / cancel the job
    del_res = client.delete(f"/api/job/{jid}")
    assert del_res.status_code == 200
    assert del_res.json() == {"deleted": jid}

    # Verify job is gone from status
    status_res = client.get(f"/api/status/{jid}")
    assert status_res.status_code == 404
