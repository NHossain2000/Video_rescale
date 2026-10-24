import os
import sys
import subprocess
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add app/backend to sys.path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from main import app, jobs, WORK_DIR

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(scope="session")
def sample_video_path(tmp_path_factory):
    """Generate a tiny 1-second 320x240 MP4 test video with ffmpeg."""
    tmp_dir = tmp_path_factory.mktemp("test_media")
    video_path = tmp_dir / "test_sample.mp4"
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "testsrc=duration=1:size=320x240:rate=24",
        "-f", "lavfi", "-i", "sine=frequency=1000:duration=1",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "64k",
        str(video_path)
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return str(video_path)
