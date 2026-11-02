import type {
  UploadResponse,
  CompressionMode,
  SSEStatusPayload,
  SingleStatusResponse
} from './types';

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://tuckin-backend.onrender.com' : 'http://localhost:8000')
).replace(/\/$/, '');

export function uploadVideoDirect(
  file: File,
  onProgress?: (progressFraction: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${API_BASE}/api/upload`;

    xhr.open('POST', url, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress(event.loaded / event.total);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Invalid JSON response from server'));
        }
      } else {
        let msg = `Upload failed with status ${xhr.status}`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err.detail) msg = err.detail;
        } catch {
          // fallback
        }
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload. Please check your connection.'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

export async function startCompression(
  jobId: string,
  mode: CompressionMode,
  targetMaxMb?: number
): Promise<{ job_id: string; status: string }> {
  const formData = new FormData();
  formData.append('mode', mode);
  if (mode === 'targeted' && targetMaxMb !== undefined) {
    formData.append('target_max_mb', targetMaxMb.toString());
  }

  const res = await fetch(`${API_BASE}/api/compress/${encodeURIComponent(jobId)}`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    let msg = `Compression request failed (${res.status})`;
    try {
      const err = await res.json();
      if (err.detail) msg = err.detail;
    } catch {
      // fallback
    }
    throw new Error(msg);
  }

  return res.json();
}

export function streamProgress(
  jobId: string,
  onMessage: (payload: SSEStatusPayload) => void,
  onError: (err: Error) => void
): () => void {
  const url = `${API_BASE}/api/stream/${encodeURIComponent(jobId)}`;
  const eventSource = new EventSource(url);

  eventSource.addEventListener('status', (event: MessageEvent) => {
    try {
      const data: SSEStatusPayload = JSON.parse(event.data);
      onMessage(data);
      if (data.status === 'done' || data.status === 'error' || data.status === 'not_found') {
        eventSource.close();
      }
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Failed to parse SSE payload'));
    }
  });

  eventSource.onerror = () => {
    eventSource.close();
    onError(new Error('Progress connection dropped.'));
  };

  return () => {
    eventSource.close();
  };
}

export async function fetchJobStatus(jobId: string): Promise<SingleStatusResponse> {
  const res = await fetch(`${API_BASE}/api/status/${encodeURIComponent(jobId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch job status (${res.status})`);
  }
  return res.json();
}

export function getDownloadUrl(jobId: string, filename?: string): string {
  const name = filename || `${jobId}_compressed.mp4`;
  const safeName = name.endsWith('.mp4') ? name : `${name}.mp4`;
  return `${API_BASE}/api/download/${encodeURIComponent(jobId)}/${encodeURIComponent(safeName)}`;
}

export function getPreviewUrl(jobId: string, filename?: string): string {
  const name = filename || `${jobId}_compressed.mp4`;
  const safeName = name.endsWith('.mp4') ? name : `${name}.mp4`;
  return `${API_BASE}/api/preview/${encodeURIComponent(jobId)}/${encodeURIComponent(safeName)}`;
}

// Delete job endpoint
export async function deleteJob(jobId: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/job/${encodeURIComponent(jobId)}`, {
      method: 'DELETE',
      keepalive: true
    });
  } catch {
    // ignore
  }
}
