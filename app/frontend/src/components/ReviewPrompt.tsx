// ReviewPrompt.tsx — Collapsible prompt on Done screen
import React, { useState } from 'react';
import styles from './ReviewPrompt.module.css';
import { ReviewForm } from './ReviewForm';
import { COPY } from '../copy';

export const ReviewPrompt: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.promptBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={styles.btnIcon}>💬</span>
        <span className={styles.btnText}>{COPY.reviews.promptTitle}</span>
        <span className={styles.btnArrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.expandedForm}>
          <ReviewForm />
        </div>
      )}
    </div>
  );
};
