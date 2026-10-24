import { describe, it, expect } from 'vitest';
import {
  appReducer,
  INITIAL_STATE,
  getVisualScreen,
  getCompressionParams
} from '../state/machine';
import type { UploadResponse } from '../api/types';

describe('state machine reducer', () => {
  const dummyFile = new File(['fake-video-content'], 'sample.mp4', { type: 'video/mp4' });

  it('handles file selection and removal', () => {
    const state1 = appReducer(INITIAL_STATE, {
      type: 'SELECT_FILE',
      file: dummyFile,
      fileUrl: 'blob:test-file'
    });
    expect(state1.status).toBe('file-selected');
    expect(state1.file).toBe(dummyFile);
    expect(getVisualScreen(state1.status)).toBe('drop');

    const state2 = appReducer(state1, { type: 'REMOVE_FILE' });
    expect(state2.status).toBe('idle');
    expect(state2.file).toBeNull();
  });

  it('cycles through compression lifecycle to done', () => {
    // 1. Uploading
    let state = appReducer(INITIAL_STATE, { type: 'START_UPLOAD' });
    expect(state.status).toBe('uploading');
    expect(getVisualScreen(state.status)).toBe('squeezing');

    // 2. Upload progress
    state = appReducer(state, { type: 'UPLOAD_PROGRESS', progress: 0.6 });
    expect(state.uploadProgress).toBe(0.6);

    // 3. Upload success
    const mockUploadResponse: UploadResponse = {
      job_id: 'job-123',
      probe: {
        duration: 30,
        file_size: 10485760,
        file_size_mb: 10,
        width: 1920,
        height: 1080,
        codec: 'h264',
        fps: 30
      },
      output_filename: 'sample_compressed.mp4'
    };
    state = appReducer(state, { type: 'UPLOAD_SUCCESS', response: mockUploadResponse });
    expect(state.jobId).toBe('job-123');
    expect(state.probe?.file_size_mb).toBe(10);

    // 4. Start processing
    state = appReducer(state, { type: 'START_PROCESSING' });
    expect(state.status).toBe('processing');
    expect(getVisualScreen(state.status)).toBe('squeezing');

    // 5. Processing progress
    state = appReducer(state, {
      type: 'PROCESSING_PROGRESS',
      progress: 0.75,
      message: 'Encoding pass 2...'
    });
    expect(state.processingProgress).toBe(0.75);
    expect(state.statusMessage).toBe('Encoding pass 2...');

    // 6. Processing success
    state = appReducer(state, {
      type: 'PROCESSING_SUCCESS',
      outputSizeMb: 3.2,
      outputFilename: 'sample_compressed.mp4'
    });
    expect(state.status).toBe('done');
    expect(state.outputSizeMb).toBe(3.2);
    expect(getVisualScreen(state.status)).toBe('done');
  });

  it('calculates dial compression parameters accurately', () => {
    const originalMb = 100;

    // Light (40% compression) -> 60MB target (saves 40%)
    const light = getCompressionParams('light', originalMb);
    expect(light.mode).toBe('targeted');
    expect(light.targetMaxMb).toBe(60);

    // Regular (55% compression) -> 45MB target (saves 55%)
    const regular = getCompressionParams('regular', originalMb);
    expect(regular.mode).toBe('targeted');
    expect(regular.targetMaxMb).toBe(45);

    // Marathon (70% compression) -> 30MB target (saves 70%)
    const marathon = getCompressionParams('marathon', originalMb);
    expect(marathon.mode).toBe('targeted');
    expect(marathon.targetMaxMb).toBe(30);
  });
});
