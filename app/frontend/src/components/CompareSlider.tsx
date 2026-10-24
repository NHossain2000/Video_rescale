// CompareSlider.tsx — Accessible before/after video wipe comparison slider
import React, { useState, useRef, useEffect } from 'react';
import styles from './CompareSlider.module.css';
import { COPY } from '../copy';

interface CompareSliderProps {
  originalUrl: string | null;
  compressedUrl: string | null;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  originalUrl,
  compressedUrl
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hasCompressedError, setHasCompressedError] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const origVideoRef = useRef<HTMLVideoElement>(null);
  const compVideoRef = useRef<HTMLVideoElement>(null);

  // Sync video play/pause
  const togglePlay = () => {
    if (!origVideoRef.current || !compVideoRef.current) return;
    if (origVideoRef.current.paused) {
      origVideoRef.current.play().catch(() => {});
      compVideoRef.current.play().catch(() => {});
    } else {
      origVideoRef.current.pause();
      compVideoRef.current.pause();
    }
  };

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const handleMouseDown = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      updatePosition(e.touches[0].clientX);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSliderPos((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSliderPos((prev) => Math.min(100, prev + 5));
    }
  };

  useEffect(() => {
    setHasCompressedError(false);
  }, [compressedUrl]);

  // If neither URL is provided, honestly do not render
  if (!originalUrl || !compressedUrl) {
    return null;
  }

  return (
    <div className={styles.compareWrapper}>
      <div className={styles.headerRow}>
        <span className={styles.compareTitle}>{COPY.done.compareTitle}</span>
        <span className={styles.compareCaption}>{COPY.done.compareCaption}</span>
      </div>

      <div
        ref={containerRef}
        className={styles.stage}
        onClick={togglePlay}
        onTouchMove={handleTouchMove}
      >
        {/* Compressed / After Video (Full layer) */}
        <div className={styles.afterLayer}>
          {!hasCompressedError ? (
            <video
              ref={compVideoRef}
              src={compressedUrl}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setHasCompressedError(true)}
              className={styles.videoPlayer}
            />
          ) : (
            <div className={styles.unsupportedMsg}>
              <p>Inline preview unavailable in this browser.</p>
              <p className={styles.unsupportedSub}>
                Click "Download video" below to play the compressed file in your favorite player!
              </p>
            </div>
          )}
          <span className={`${styles.badge} ${styles.badgeAfter}`}>
            {COPY.done.tuckedLabel}
          </span>
        </div>

        {/* Original / Before Video (Clipped layer) */}
        <div
          className={styles.beforeLayer}
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <video
            ref={origVideoRef}
            src={originalUrl}
            autoPlay
            loop
            muted
            playsInline
            className={styles.videoPlayer}
          />
          <span className={`${styles.badge} ${styles.badgeBefore}`}>
            {COPY.done.originalLabel}
          </span>
        </div>

        {/* Draggable Divider Handle */}
        <div
          className={styles.sliderHandle}
          style={{ left: `${sliderPos}%` }}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="slider"
          aria-valuenow={Math.round(sliderPos)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Before and after comparison slider"
        >
          <div className={styles.handleLine} />
          <div className={styles.handleButton}>
            <span>◀</span>
            <span>▶</span>
          </div>
        </div>
      </div>
    </div>
  );
};
