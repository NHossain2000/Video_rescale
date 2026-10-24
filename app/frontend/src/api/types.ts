// types.ts — Direct mapping to FastAPI backend models & state structures

export interface ProbeMetadata {
  duration: number;
  file_size: number;
  file_size_mb: number;
  width: number;
  height: number;
  codec: string;
  fps: number;
}

export interface UploadResponse {
  job_id: string;
  probe: ProbeMetadata;
  output_filename: string;
}

export type CompressionMode = 'default' | 'targeted';

export type SqueezeDialStop = 'light' | 'regular' | 'marathon';

export interface StartCompressParams {
  jobId: string;
  mode: CompressionMode;
  targetMaxMb?: number;
}

export type JobStatusType = 'pending' | 'compressing' | 'queued' | 'done' | 'error' | 'not_found';

export interface SSEStatusPayload {
  status: JobStatusType;
  progress: number;
  message: string;
  error?: string | null;
  output_size_mb?: number | null;
  output_filename?: string | null;
}

export interface SingleStatusResponse extends SSEStatusPayload {
  job_id: string;
  probe?: ProbeMetadata;
}
