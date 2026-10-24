import type { UploadResponse, SqueezeDialStop, CompressionMode } from '../api/types';

export type AppStateStatus =
  | 'idle'
  | 'file-selected'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'error'
  | 'cancelled';

export type VisualScreen = 'drop' | 'squeezing' | 'done';

export interface AppState {
  status: AppStateStatus;
  file: File | null;
  fileUrl: string | null;
  downloadUrl: string | null;
  probe: UploadResponse['probe'] | null;
  jobId: string | null;
  dial: SqueezeDialStop;
  uploadProgress: number;
  processingProgress: number;
  statusMessage: string;
  outputSizeMb: number | null;
  outputFilename: string | null;
  errorMessage: string | null;
}

export const INITIAL_STATE: AppState = {
  status: 'idle',
  file: null,
  fileUrl: null,
  downloadUrl: null,
  probe: null,
  jobId: null,
  dial: 'regular',
  uploadProgress: 0,
  processingProgress: 0,
  statusMessage: '',
  outputSizeMb: null,
  outputFilename: null,
  errorMessage: null
};

export type AppAction =
  | { type: 'SELECT_FILE'; file: File; fileUrl: string }
  | { type: 'REMOVE_FILE' }
  | { type: 'SET_DIAL'; dial: SqueezeDialStop }
  | { type: 'START_UPLOAD' }
  | { type: 'UPLOAD_PROGRESS'; progress: number }
  | { type: 'UPLOAD_SUCCESS'; response: UploadResponse }
  | { type: 'START_PROCESSING' }
  | { type: 'PROCESSING_PROGRESS'; progress: number; message: string }
  | { type: 'PROCESSING_SUCCESS'; outputSizeMb: number; outputFilename: string; downloadUrl?: string }
  | { type: 'SET_ERROR'; message: string }
  | { type: 'CANCEL' }
  | { type: 'RESET' };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SELECT_FILE':
      return {
        ...INITIAL_STATE,
        dial: state.dial,
        status: 'file-selected',
        file: action.file,
        fileUrl: action.fileUrl
      };

    case 'REMOVE_FILE':
      if (state.fileUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(state.fileUrl);
      }
      if (state.downloadUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(state.downloadUrl);
      }
      return INITIAL_STATE;

    case 'SET_DIAL':
      return {
        ...state,
        dial: action.dial
      };

    case 'START_UPLOAD':
      return {
        ...state,
        status: 'uploading',
        uploadProgress: 0,
        processingProgress: 0,
        statusMessage: 'Preparing video file...'
      };

    case 'UPLOAD_PROGRESS':
      return {
        ...state,
        uploadProgress: Math.min(Math.max(action.progress, 0), 1)
      };

    case 'UPLOAD_SUCCESS':
      return {
        ...state,
        jobId: action.response.job_id,
        probe: action.response.probe,
        outputFilename: action.response.output_filename,
        uploadProgress: 1.0,
        statusMessage: 'Video loaded. Preparing compression...'
      };

    case 'START_PROCESSING':
      return {
        ...state,
        status: 'processing',
        processingProgress: 0,
        statusMessage: 'Starting compression...'
      };

    case 'PROCESSING_PROGRESS':
      return {
        ...state,
        processingProgress: Math.min(Math.max(action.progress, 0), 1),
        statusMessage: action.message || state.statusMessage
      };

    case 'PROCESSING_SUCCESS':
      return {
        ...state,
        status: 'done',
        processingProgress: 1.0,
        outputSizeMb: action.outputSizeMb,
        outputFilename: action.outputFilename,
        downloadUrl: action.downloadUrl || state.downloadUrl,
        statusMessage: 'Compression complete!'
      };

    case 'SET_ERROR':
      return {
        ...state,
        status: 'error',
        errorMessage: action.message
      };

    case 'CANCEL':
      return {
        ...state,
        status: 'cancelled',
        statusMessage: 'Squeeze cancelled.'
      };

    case 'RESET':
      if (state.fileUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(state.fileUrl);
      }
      if (state.downloadUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(state.downloadUrl);
      }
      return INITIAL_STATE;

    default:
      return state;
  }
}

export function getVisualScreen(status: AppStateStatus): VisualScreen {
  switch (status) {
    case 'uploading':
    case 'processing':
      return 'squeezing';
    case 'done':
      return 'done';
    case 'idle':
    case 'file-selected':
    case 'error':
    case 'cancelled':
    default:
      return 'drop';
  }
}

export function getCompressionParams(
  dial: SqueezeDialStop,
  originalSizeMb: number
): { mode: CompressionMode; targetMaxMb?: number } {
  switch (dial) {
    case 'light':
      // 40% compression -> target is 60% of original file size
      return {
        mode: 'targeted',
        targetMaxMb: Math.max(0.5, Math.round(originalSizeMb * 0.60 * 10) / 10)
      };
    case 'marathon':
      // 70% compression -> target is 30% of original file size
      return {
        mode: 'targeted',
        targetMaxMb: Math.max(0.5, Math.round(originalSizeMb * 0.30 * 10) / 10)
      };
    case 'regular':
    default:
      // 55% compression -> target is 45% of original file size
      return {
        mode: 'targeted',
        targetMaxMb: Math.max(0.5, Math.round(originalSizeMb * 0.45 * 10) / 10)
      };
  }
}

export function getTargetRatio(dial: SqueezeDialStop): number {
  switch (dial) {
    case 'light':
      return 0.60; // 40% compression
    case 'marathon':
      return 0.30; // 70% compression
    case 'regular':
    default:
      return 0.45; // 55% compression
  }
}
