// FilmStrip.tsx — Film-strip progress bar with sprocket holes and cell fill
import React from 'react';
import styles from './FilmStrip.module.css';

interface FilmStripProps {
  progress: number; // 0.0 to 1.0
  stage: 'uploading' | 'processing';
  statusMessage?: string;
  uploadTelemetry?: {
    loadedMb: number;
    totalMb: number;
    speedMb: number;
    etaSeconds: number;
  } | null;
}

const TOTAL_CELLS = 10;

export const FilmStrip: React.FC<FilmStripProps> = ({
  progress,
  stage,
  statusMessage,
  uploadTelemetry
}) => {
  const p = Math.max(0, Math.min(1, progress));
  const activeCells = Math.round(p * TOTAL_CELLS);
  const percentage = Math.round(p * 100);

  return (
    <div
      className={styles.stripWrapper}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${stage === 'uploading' ? 'Upload' : 'Compression'} progress: ${percentage}%`}
    >
      {/* Header Info */}
      <div className={styles.header}>
        <span className={styles.stageTag}>
          {stage === 'uploading' ? 'STAGE 1: UPLOAD' : 'STAGE 2: COMPRESSING'}
        </span>
        <span className={styles.percentText}>{percentage}%</span>
      </div>

      {/* Film Strip Body */}
      <div className={styles.filmBody}>
        {/* Top Sprocket Holes */}
        <div className={styles.sprocketRow} aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={`sprocket-top-${i}`} className={styles.sprocketHole} />
          ))}
        </div>

        {/* Frames Row */}
        <div className={styles.cellsRow}>
          {Array.from({ length: TOTAL_CELLS }).map((_, i) => {
            const isFilled = i < activeCells;
            const isCurrent = i === activeCells - 1;
            return (
              <div
                key={`cell-${i}`}
                className={`${styles.cell} ${isFilled ? styles.cellFilled : ''} ${
                  isCurrent ? styles.cellActive : ''
                }`}
              >
                <span className={styles.cellIndex}>{i + 1}</span>
              </div>
            );
          })}
        </div>

        {/* Bottom Sprocket Holes */}
        <div className={styles.sprocketRow} aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={`sprocket-bot-${i}`} className={styles.sprocketHole} />
          ))}
        </div>
      </div>

      {/* Upload Telemetry Badge: Live MB, Speed & ETA */}
      {stage === 'uploading' && uploadTelemetry && uploadTelemetry.totalMb > 0 && (
        <div className={styles.telemetryStrip} aria-live="polite">
          <span className={styles.telemetryMetric}>
            {uploadTelemetry.loadedMb.toFixed(1)} / {uploadTelemetry.totalMb.toFixed(1)} MB
          </span>
          <span className={styles.telemetryDivider}>•</span>
          <span className={styles.telemetryMetric}>
            {uploadTelemetry.speedMb.toFixed(1)} MB/s
          </span>
          {uploadTelemetry.etaSeconds > 0 && (
            <>
              <span className={styles.telemetryDivider}>•</span>
              <span className={styles.telemetryMetric}>
                ~{uploadTelemetry.etaSeconds}s left
              </span>
            </>
          )}
        </div>
      )}

      {/* Real-time Status message */}
      {statusMessage && (
        <div className={styles.statusLine} aria-live="polite">
          {statusMessage}
        </div>
      )}
    </div>
  );
};
