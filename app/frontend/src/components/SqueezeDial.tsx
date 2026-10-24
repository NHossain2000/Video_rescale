// SqueezeDial.tsx — Accessible 3-stop squeeze intensity selector
import React from 'react';
import type { SqueezeDialStop } from '../api/types';
import { COPY } from '../copy';
import styles from './SqueezeDial.module.css';

interface SqueezeDialProps {
  value: SqueezeDialStop;
  onChange: (stop: SqueezeDialStop) => void;
  disabled?: boolean;
}

const STOPS: Array<{ id: SqueezeDialStop; label: string; desc: string }> = [
  {
    id: 'light',
    label: COPY.dial.options.light.label,
    desc: COPY.dial.options.light.desc
  },
  {
    id: 'regular',
    label: COPY.dial.options.regular.label,
    desc: COPY.dial.options.regular.desc
  },
  {
    id: 'marathon',
    label: COPY.dial.options.marathon.label,
    desc: COPY.dial.options.marathon.desc
  }
];

export const SqueezeDial: React.FC<SqueezeDialProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const currentIndex = STOPS.findIndex((s) => s.id === value);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(currentIndex + 1, STOPS.length - 1);
      onChange(STOPS[nextIndex].id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(currentIndex - 1, 0);
      onChange(STOPS[prevIndex].id);
    }
  };

  return (
    <div className={styles.dialCard}>
      <div className={styles.dialHeader}>
        <span className={styles.dialTitle}>{COPY.dial.title}</span>
        <span className={styles.dialBadge}>
          {value === 'regular' ? COPY.dial.recommendedBadge : value === 'light' ? '40% TRIM' : '70% MAX'}
        </span>
      </div>

      {/* 3-stop Segmented Pill Control */}
      <div
        className={styles.segmentedTrack}
        role="radiogroup"
        aria-label="Compression intensity"
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
      >
        {STOPS.map((stop) => {
          const isSelected = stop.id === value;
          return (
            <button
              key={stop.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              className={`${styles.segmentBtn} ${isSelected ? styles.segmentSelected : ''}`}
              onClick={() => onChange(stop.id)}
            >
              <span className={styles.segmentDot} />
              <span className={styles.segmentLabel}>{stop.label}</span>
            </button>
          );
        })}
      </div>

      {/* Description of current mode */}
      <p className={styles.dialDesc}>{STOPS[currentIndex]?.desc}</p>
    </div>
  );
};
