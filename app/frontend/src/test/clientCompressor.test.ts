import { describe, it, expect } from 'vitest';
import { getTargetRatio, appReducer, INITIAL_STATE } from '../state/machine';
import { probeVideoElement, getDeviceCapabilities } from '../services/clientCompressor';

describe('clientCompressor and state integration', () => {
  it('calculates correct target ratios for all compression stops', () => {
    // 40% compression -> 60% of original size
    expect(getTargetRatio('light')).toBe(0.60);

    // 55% compression -> 45% of original size
    expect(getTargetRatio('regular')).toBe(0.45);

    // 70% compression -> 30% of original size
    expect(getTargetRatio('marathon')).toBe(0.30);
  });

  it('handles client-side compression success and preserves downloadUrl', () => {
    let state = appReducer(INITIAL_STATE, { type: 'START_PROCESSING' });
    expect(state.status).toBe('processing');

    const fakeBlobUrl = 'blob:http://localhost:5173/compressed-video-uuid';
    state = appReducer(state, {
      type: 'PROCESSING_SUCCESS',
      outputSizeMb: 12.5,
      outputFilename: 'test_compressed.mp4',
      downloadUrl: fakeBlobUrl
    });

    expect(state.status).toBe('done');
    expect(state.outputSizeMb).toBe(12.5);
    expect(state.outputFilename).toBe('test_compressed.mp4');
    expect(state.downloadUrl).toBe(fakeBlobUrl);
  });

  it('probeVideoElement extracts or falls back safely in DOM environment', async () => {
    const dummyFile = new File(['fake content'], 'clip.mp4', { type: 'video/mp4' });
    const metadata = await probeVideoElement(dummyFile);
    expect(metadata.duration).toBeGreaterThan(0);
    expect(metadata.width).toBeGreaterThan(0);
    expect(metadata.height).toBeGreaterThan(0);
  });

  it('determines safe device capabilities for memory and threading', () => {
    const caps = getDeviceCapabilities();
    expect(typeof caps.isMobile).toBe('boolean');
    expect(caps.maxThreads).toBeGreaterThanOrEqual(1);
    expect(caps.maxThreads).toBeLessThanOrEqual(8);
    expect(caps.maxDimension).toBeGreaterThanOrEqual(720);
    expect(caps.maxSafeFileSizeBytes).toBeGreaterThan(0);
    expect(caps.maxSafeFileSizeMb).toBeGreaterThanOrEqual(200);
  });
});
