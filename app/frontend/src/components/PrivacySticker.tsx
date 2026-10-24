// PrivacySticker.tsx — Mint badge, hand-drawn ink stamp, and verified privacy disclosure
import React, { useState } from 'react';
import styles from './PrivacySticker.module.css';
import { COPY } from '../copy';

export const PrivacySticker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      {/* Pinned Mint Sticker Button */}
      <button
        type="button"
        className={styles.stickerBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="View Tuckin privacy and data deletion guarantee"
      >
        {/* Custom padlock + slashed eye icon */}
        <svg
          className={styles.icon}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Padlock Body */}
          <rect x="4" y="11" width="16" height="10" rx="3" fill="#9FE3BF" />
          {/* Shackle */}
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          {/* Eye slash diagonal */}
          <line x1="2" y1="2" x2="22" y2="22" stroke="#1B1A17" strokeWidth="2.5" />
        </svg>
        <span className={styles.badgeText}>{COPY.privacy.badge}</span>
      </button>

      {/* Hand-drawn SVG Stamp */}
      <div className={styles.stampRotated} aria-hidden="true">
        <svg width="78" height="28" viewBox="0 0 90 32">
          <rect
            x="2"
            y="2"
            width="86"
            height="28"
            rx="6"
            fill="none"
            stroke="#1B1A17"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
          <text
            x="45"
            y="20"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="10"
            fontWeight="700"
            fill="#1B1A17"
          >
            {COPY.privacy.stamp}
          </text>
        </svg>
      </div>

      {/* Expanded Disclosure Card */}
      {isOpen && (
        <div className={styles.popover} role="dialog" aria-modal="false">
          <div className={styles.popoverHeader}>
            <span className={styles.popoverTitle}>Honest Privacy Policy</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close privacy notice"
            >
              ✕
            </button>
          </div>
          <p className={styles.statementText}>{COPY.privacy.fullStatement}</p>
        </div>
      )}
    </div>
  );
};
