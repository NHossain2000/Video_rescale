import pytest
from compressor import get_adaptive_scale, probe_video

def test_get_adaptive_scale():
    # High bitrate: long side capped to 1920 symmetrically
    scale_high = get_adaptive_scale(3000)
    assert "1920" in scale_high

    # Medium bitrate: long side capped to 1280 symmetrically
    scale_med = get_adaptive_scale(1500)
    assert "1280" in scale_med

    # Low bitrate: long side capped to 960 symmetrically
    scale_low = get_adaptive_scale(500)
    assert "960" in scale_low


def test_probe_valid_video(sample_video_path):
    info = probe_video(sample_video_path)
    assert info["width"] == 320
    assert info["height"] == 240
    assert info["duration"] > 0.8
    assert info["file_size_mb"] >= 0
    assert info["codec"] in ("h264", "libx264")

def test_probe_invalid_video(tmp_path):
    fake_video = tmp_path / "corrupt.mp4"
    fake_video.write_text("This is plain text pretending to be an mp4 video file.")
    with pytest.raises(RuntimeError):
        probe_video(str(fake_video))
