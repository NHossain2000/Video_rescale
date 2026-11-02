// App.tsx — Tuckin Video Compressor
import React, { useReducer, useEffect, useState, useRef } from 'react';
import {
  compressVideoClient
} from './services/clientCompressor';
import {
  API_BASE,
  uploadVideoDirect,
  startCompression,
  streamProgress,
  getDownloadUrl,
  getPreviewUrl,
  deleteJob

} from './api/api';
import {
  appReducer,
  INITIAL_STATE,
  getVisualScreen,
  getTargetRatio
} from './state/machine';
import { DropZone } from './components/DropZone';
import { SqueezeDial } from './components/SqueezeDial';
import { TvFrame } from './components/TvFrame';
import { MascotSlot } from './components/MascotSlot';
import { FilmStrip } from './components/FilmStrip';
import { CompareSlider } from './components/CompareSlider';
import { PrivacySticker } from './components/PrivacySticker';
import { ReviewPrompt } from './components/ReviewPrompt';
import { ReviewWall } from './components/ReviewWall';
import { TuckSvg } from './components/TuckSvg';
import { COPY } from './copy';
import styles from './App.module.css';

async function checkBackendOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(4000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
  const [statusLineIndex, setStatusLineIndex] = useState(0);
  const cancelStreamRef = useRef<(() => void) | null>(null);
  const activeJobIdRef = useRef<string | null>(null);

  const visualScreen = getVisualScreen(state.status);

  // Rotating status message every ~3s during squeezing
  useEffect(() => {
    if (visualScreen !== 'squeezing') return;

    const interval = setInterval(() => {
      setStatusLineIndex((prev) => (prev + 1) % COPY.squeezing.statusLines.length);
    }, 3200);

    return () => clearInterval(interval);
  }, [visualScreen]);

  // ─── File selection handler ───────────────────────────────────────────────
  const handleFileSelect = (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    dispatch({ type: 'SELECT_FILE', file, fileUrl });
  };

  const handleFileRemove = () => {
    dispatch({ type: 'REMOVE_FILE' });
  };

  // ─── Main compression workflow (High-Speed Native Engine with Wasm Fallback) ──
  const handleStartCompression = async () => {
    if (!state.file) return;

    try {
      const isNativeOnline = await checkBackendOnline();

      if (isNativeOnline) {
        // 🚀 Native Engine: loopback localhost upload in ~1s, multi-core native FFmpeg (H.264 + faststart)
        dispatch({ type: 'START_UPLOAD' });

        const uploadRes = await uploadVideoDirect(state.file, (fraction) => {
          dispatch({ type: 'UPLOAD_PROGRESS', progress: fraction });
        });

        activeJobIdRef.current = uploadRes.job_id;
        dispatch({ type: 'UPLOAD_SUCCESS', response: uploadRes });
        dispatch({ type: 'START_PROCESSING' });

        const targetRatio = getTargetRatio(state.dial);
        const originalMb = state.file.size / (1024 * 1024);
        const targetMaxMb = Math.max(0.5, Math.round(originalMb * targetRatio * 10) / 10);

        await startCompression(uploadRes.job_id, 'targeted', targetMaxMb);

        const closeStream = streamProgress(
          uploadRes.job_id,
          (payload) => {
            if (payload.status === 'compressing' || payload.status === 'queued') {
              dispatch({
                type: 'PROCESSING_PROGRESS',
                progress: payload.progress,
                message: payload.message || 'Compressing with high-speed cloud engine…'
              });
            } else if (payload.status === 'done') {
              const baseName = state.file!.name.replace(/\.[^/.]+$/, '');
              const outFilename = payload.output_filename ?? `${baseName}_compressed.mp4`;
              const safeName = outFilename.endsWith('.mp4') ? outFilename : `${outFilename}.mp4`;
              const httpDownloadUrl = getDownloadUrl(uploadRes.job_id, safeName);
              const httpPreviewUrl = getPreviewUrl(uploadRes.job_id, safeName);

              // Pre-fetch local blob for zero-latency, cross-origin-safe preview and downloads
              (async () => {
                let activeDownloadUrl = httpDownloadUrl;
                try {
                  const previewRes = await fetch(httpPreviewUrl);
                  if (previewRes.ok) {
                    const blob = await previewRes.blob();
                    activeDownloadUrl = URL.createObjectURL(blob);
                  }
                } catch {
                  // fallback to direct HTTP URL
                }

                dispatch({
                  type: 'PROCESSING_SUCCESS',
                  outputSizeMb: payload.output_size_mb ?? targetMaxMb,
                  outputFilename: safeName,
                  downloadUrl: activeDownloadUrl
                });
              })();
              closeStream();
            } else if (payload.status === 'error') {
              dispatch({
                type: 'SET_ERROR',
                message: payload.error || COPY.errors.compressionFailed
              });
              closeStream();
            }
          },
          (err) => {
            dispatch({
              type: 'SET_ERROR',
              message: err.message || COPY.errors.generic
            });
          }
        );
        cancelStreamRef.current = closeStream;
      } else {
        // In-Browser WebAssembly fallback
        dispatch({ type: 'START_PROCESSING' });

        const targetRatio = getTargetRatio(state.dial);

        const result = await compressVideoClient(
          state.file,
          targetRatio,
          (progress, message) => {
            dispatch({
              type: 'PROCESSING_PROGRESS',
              progress,
              message
            });
          }
        );

        dispatch({
          type: 'PROCESSING_SUCCESS',
          outputSizeMb: result.sizeMb,
          outputFilename: result.outputFilename,
          downloadUrl: result.downloadUrl
        });
      }
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        message: err instanceof Error ? err.message : COPY.errors.generic
      });
    }
  };

  // ─── Cancel handler ───────────────────────────────────────────────────────
  const handleCancel = () => {
    if (cancelStreamRef.current) {
      cancelStreamRef.current();
      cancelStreamRef.current = null;
    }
    if (activeJobIdRef.current) {
      deleteJob(activeJobIdRef.current);
      activeJobIdRef.current = null;
    }
    dispatch({ type: 'CANCEL' });
  };

  // ─── Reset to drop screen ─────────────────────────────────────────────────
  const handleReset = () => {
    if (cancelStreamRef.current) {
      cancelStreamRef.current();
      cancelStreamRef.current = null;
    }
    if (activeJobIdRef.current) {
      deleteJob(activeJobIdRef.current);
      activeJobIdRef.current = null;
    }
    dispatch({ type: 'RESET' });
  };

  // Reduction calculations for Done screen
  const originalMb = state.file ? state.file.size / (1024 * 1024) : 0;
  const compressedMb = state.outputSizeMb ?? (originalMb * 0.45);
  const reductionPct = originalMb > 0
    ? Math.max(0, Math.round(((originalMb - compressedMb) / originalMb) * 100))
    : 0;

  const currentDownloadUrl = state.downloadUrl || '#';

  return (
    <div className={styles.appRoot} data-state={visualScreen}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <div className={styles.logoBadge} aria-label="Tuckin Logo">
            <span className={styles.logoTuck}>Tuck</span>
            <span className={styles.logoIn}>in</span>
          </div>
        </div>

        <nav className={styles.navActions}>
          <a href="#reviews" className={styles.navLink}>
            {COPY.brand.navReviews}
          </a>
          <PrivacySticker />
        </nav>
      </header>

      {/* ─── Main Hero Area (Asymmetric Notebook Layout) ──────────────────── */}
      <main className={styles.mainContainer}>
        {/* Left Column: Asymmetric Typography & Story */}
        <div className={styles.headlineCol}>
          <div className={styles.badgePill}>{COPY.brand.tagline}</div>
          <h1 className={styles.mainTitle}>
            Same video.
            <br />
            <span className={styles.accentUnderline}>Way less weight.</span>
          </h1>
          <p className={styles.subTitle}>{COPY.brand.subline}</p>

          <div className={styles.tuckIntroCard}>
            <div className={styles.tuckThumb} aria-hidden="true">
              <TuckSvg variant="stretching" />
            </div>
            <div className={styles.tuckIntroText}>
              <strong className={styles.tuckIntroName}>{COPY.hero.cardTitle}</strong>
              <p className={styles.tuckIntroDesc}>
                Shrinks video files without crushing quality.
                <br />
                Isolated container, zero tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Tool Card ─────────────────────────────────── */}
        <div className={styles.toolCard}>
          {/* Error Banner */}
          {state.status === 'error' && state.errorMessage && (
            <div className={styles.errorBanner} role="alert">
              <span>{state.errorMessage}</span>
              <button
                type="button"
                className={styles.errorDismissBtn}
                onClick={handleReset}
              >
                Try again
              </button>
            </div>
          )}

          {/* Cancelled Banner */}
          {state.status === 'cancelled' && (
            <div className={styles.cancelledBanner}>
              <span>{COPY.squeezing.cancelled}</span>
              <button
                type="button"
                className={styles.errorDismissBtn}
                onClick={handleReset}
              >
                Back to start
              </button>
            </div>
          )}

          {/* ─── SCREEN 1: DROP ────────────────────────────────────────────── */}
          {visualScreen === 'drop' && (
            <div className={styles.screenDrop}>
              <DropZone
                selectedFile={state.file}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                onError={(msg) => dispatch({ type: 'SET_ERROR', message: msg })}
              />

              {/* Squeeze Dial */}
              <SqueezeDial
                value={state.dial}
                onChange={(stop) => dispatch({ type: 'SET_DIAL', dial: stop })}
              />

              {/* Single Tomato Primary CTA */}
              <button
                type="button"
                disabled={!state.file}
                className={styles.primaryTomatoBtn}
                onClick={handleStartCompression}
              >
                {COPY.drop.cta}
              </button>
            </div>
          )}

          {/* ─── SCREEN 2: SQUEEZING (The Wait) ────────────────────────────── */}
          {visualScreen === 'squeezing' && (
            <div className={styles.screenSqueezing}>
              {/* Tilted Retro TV Frame with Tuck running on treadmill */}
              <TvFrame>
                <MascotSlot
                  variant="treadmill"
                  progress={
                    state.status === 'uploading'
                      ? state.uploadProgress * 0.2
                      : 0.2 + state.processingProgress * 0.8
                  }
                />
              </TvFrame>

              {/* Film-strip Progress Bar */}
              <FilmStrip
                stage={state.status === 'uploading' ? 'uploading' : 'processing'}
                progress={
                  state.status === 'uploading'
                    ? state.uploadProgress
                    : state.processingProgress
                }
                statusMessage={state.statusMessage}
              />

              {/* Rotating friendly status lines */}
              <div className={styles.rotatingStatus} aria-live="polite">
                "{COPY.squeezing.statusLines[statusLineIndex]}"
              </div>

              {/* Quiet Cancel Link */}
              <button
                type="button"
                className={styles.cancelLink}
                onClick={handleCancel}
              >
                {COPY.squeezing.cancel}
              </button>
            </div>
          )}

          {/* ─── SCREEN 3: DONE ────────────────────────────────────────────── */}
          {visualScreen === 'done' && (
            <div className={styles.screenDone}>
              {/* Trophy Mascot */}
              <div className={styles.doneTrophyHeader}>
                <div className={styles.trophyWrapper}>
                  <MascotSlot variant="trophy" />
                </div>
                <div className={styles.doneHeadlineBox}>
                  <h2 className={styles.doneHeadline}>{COPY.done.headline}</h2>
                  <p className={styles.doneSubhead}>{COPY.done.subhead}</p>
                </div>
              </div>

              {/* Giant DM Mono Countdown & Burst Sticker */}
              <div className={styles.metricsRow}>
                <div className={styles.sizeMetric}>
                  <span className={styles.sizeLabel}>{COPY.done.originalLabel}</span>
                  <span className={styles.sizeValueOld}>
                    {originalMb.toFixed(1)} <small>MB</small>
                  </span>
                </div>

                <div className={styles.sizeArrow} aria-hidden="true">
                  →
                </div>

                <div className={styles.sizeMetric}>
                  <span className={styles.sizeLabel}>{COPY.done.tuckedLabel}</span>
                  <span className={styles.sizeValueNew}>
                    {compressedMb.toFixed(1)} <small>MB</small>
                  </span>
                </div>

                {/* Butter-yellow "-NN%" burst sticker */}
                <div className={styles.burstSticker}>
                  <span className={styles.burstPct}>-{reductionPct}%</span>
                  <span className={styles.burstLabel}>{COPY.done.reductionSuffix}</span>
                </div>
              </div>

              {/* Spot The Difference Draggable Wipe Slider */}
              <CompareSlider
                originalUrl={state.fileUrl}
                compressedUrl={
                  (state.downloadUrl && state.downloadUrl.startsWith('blob:'))
                    ? state.downloadUrl
                    : (state.jobId
                        ? getPreviewUrl(state.jobId, state.outputFilename || undefined)
                        : currentDownloadUrl)
                }
              />

              {/* Single Tomato Action: Download */}
              <div className={styles.doneActionsRow}>
                <button
                  type="button"
                  className={styles.primaryTomatoBtn}
                  onClick={async () => {
                    const filename = state.outputFilename?.endsWith('.mp4')
                      ? state.outputFilename
                      : `${state.outputFilename || 'compressed_video'}.mp4`;

                    // 1. Direct blob download
                    if (state.downloadUrl && state.downloadUrl.startsWith('blob:')) {
                      const tempA = document.createElement('a');
                      tempA.href = state.downloadUrl;
                      tempA.download = filename;
                      document.body.appendChild(tempA);
                      tempA.click();
                      document.body.removeChild(tempA);
                      return;
                    }

                    // 2. HTTP download — fetch as blob to bypass cross-origin browser download restrictions
                    try {
                      const targetUrl = state.downloadUrl && state.downloadUrl !== '#'
                        ? state.downloadUrl
                        : (state.jobId ? getDownloadUrl(state.jobId, filename) : '');
                      if (!targetUrl) return;

                      const res = await fetch(targetUrl);
                      if (!res.ok) throw new Error(`Download request failed (${res.status})`);
                      const blob = await res.blob();
                      const blobUrl = URL.createObjectURL(blob);
                      const tempA = document.createElement('a');
                      tempA.href = blobUrl;
                      tempA.download = filename;
                      document.body.appendChild(tempA);
                      tempA.click();
                      document.body.removeChild(tempA);
                      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
                    } catch {
                      // 3. Fallback
                      const fallbackUrl = state.jobId ? getDownloadUrl(state.jobId, filename) : currentDownloadUrl;
                      window.open(fallbackUrl, '_blank');
                    }
                  }}
                >
                  {COPY.done.download}
                </button>

                <button
                  type="button"
                  className={styles.tuckAnotherBtn}
                  onClick={handleReset}
                >
                  {COPY.done.tuckAnother}
                </button>
              </div>

              <p className={styles.expiryNote}>{COPY.done.expiredWarning}</p>

              {/* Collapsible Honest Review Prompt below Download */}
              <ReviewPrompt />
            </div>
          )}
        </div>
      </main>

      {/* ─── Review Wall Section ──────────────────────────────────────────── */}
      <ReviewWall />

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <p className={styles.footerPrivacyStatement}>{COPY.privacy.fullStatement}</p>
        <p className={styles.footerTagline}>
          Tuckin • {COPY.brand.tagline} • Designed with care for privacy.
        </p>
      </footer>
    </div>
  );
};