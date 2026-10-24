// NameTag.tsx — Name tag sticker with dice button for alias re-rolling
import React, { useState } from 'react';
import styles from './NameTag.module.css';
import { COPY } from '../copy';

interface NameTagProps {
  name: string;
  onReroll: () => void;
}

export const NameTag: React.FC<NameTagProps> = ({ name, onReroll }) => {
  const [isWobbling, setIsWobbling] = useState(false);

  const handleReroll = () => {
    setIsWobbling(true);
    onReroll();
    setTimeout(() => setIsWobbling(false), 350);
  };

  return (
    <div className={`${styles.tagCard} ${isWobbling ? styles.wobble : ''}`}>
      <div className={styles.tagHeader} aria-hidden="true">
        <span>HELLO</span>
        <span className={styles.tagSubtitle}>MY ALIAS IS</span>
      </div>

      <div className={styles.nameRow}>
        <span className={styles.nameText}>{name}</span>
        <button
          type="button"
          className={styles.diceBtn}
          onClick={handleReroll}
          aria-label={COPY.reviews.rerollName}
          title={COPY.reviews.rerollName}
        >
          {/* Die SVG icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="3" width="18" height="18" rx="4" fill="#FFD84D" />
            <circle cx="8" cy="8" r="1.5" fill="#1B1A17" />
            <circle cx="16" cy="16" r="1.5" fill="#1B1A17" />
            <circle cx="12" cy="12" r="1.5" fill="#1B1A17" />
            <circle cx="8" cy="16" r="1.5" fill="#1B1A17" />
            <circle cx="16" cy="8" r="1.5" fill="#1B1A17" />
          </svg>
        </button>
      </div>
    </div>
  );
};
