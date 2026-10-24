// FaceRating.tsx — 5 Tuck expressions from exhausted to proud
import React from 'react';
import styles from './FaceRating.module.css';
import { COPY } from '../copy';

interface FaceRatingProps {
  rating: number; // 1 to 5
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export const FaceRating: React.FC<FaceRatingProps> = ({
  rating,
  onChange,
  disabled = false
}) => {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.min(5, index + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.max(1, index - 1));
    }
  };

  const renderFaceSvg = (idx: number, isFilled: boolean) => {
    // 1: Exhausted, 2: Panting, 3: Good workout, 4: Strong, 5: Machine
    return (
      <svg viewBox="0 0 40 40" className={styles.faceSvg}>
        {/* Head Base */}
        <rect
          x="3"
          y="3"
          width="34"
          height="34"
          rx="10"
          fill={isFilled ? '#FFD84D' : '#FFFDF8'}
          stroke="#1B1A17"
          strokeWidth="2"
        />

        {/* Eyes */}
        <circle cx="14" cy="15" r="2.2" fill="#1B1A17" />
        <circle cx="26" cy="15" r="2.2" fill="#1B1A17" />

        {/* Cheeks */}
        <circle cx="9" cy="20" r="2.5" fill="#FF5A36" opacity={isFilled ? 1 : 0.4} />
        <circle cx="31" cy="20" r="2.5" fill="#FF5A36" opacity={isFilled ? 1 : 0.4} />

        {/* Expressions */}
        {idx === 1 && (
          // Drooping mouth, exhausted
          <path d="M 15 26 Q 20 21 25 26" fill="none" stroke="#1B1A17" strokeWidth="2" strokeLinecap="round" />
        )}
        {idx === 2 && (
          // Heavy panting mouth
          <circle cx="20" cy="24" r="3" fill="#1B1A17" />
        )}
        {idx === 3 && (
          // Determined line
          <line x1="16" y1="24" x2="24" y2="24" stroke="#1B1A17" strokeWidth="2" strokeLinecap="round" />
        )}
        {idx === 4 && (
          // Good smile
          <path d="M 15 22 Q 20 28 25 22" fill="none" stroke="#1B1A17" strokeWidth="2" strokeLinecap="round" />
        )}
        {idx === 5 && (
          // Victorious sunglasses!
          <g>
            <rect x="10" y="11" width="8" height="6" rx="2" fill="#1B1A17" />
            <rect x="22" y="11" width="8" height="6" rx="2" fill="#1B1A17" />
            <line x1="18" y1="13" x2="22" y2="13" stroke="#1B1A17" strokeWidth="2" />
            <path d="M 14 23 Q 20 29 26 23" fill="none" stroke="#1B1A17" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div
      className={styles.facesRow}
      role="radiogroup"
      aria-label="Rating from 1 to 5 Tuck faces"
    >
      {[1, 2, 3, 4, 5].map((score) => {
        const isSelected = rating >= score;
        const label = COPY.reviews.ratingLabels[score - 1] || `${score} out of 5`;

        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={rating === score}
            aria-label={label}
            disabled={disabled}
            className={`${styles.faceBtn} ${isSelected ? styles.selected : ''}`}
            onClick={() => onChange(score)}
            onKeyDown={(e) => handleKeyDown(e, score)}
          >
            {renderFaceSvg(score, isSelected)}
          </button>
        );
      })}
    </div>
  );
};
