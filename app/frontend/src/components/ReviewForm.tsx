// ReviewForm.tsx — Inline sticker-style review submission form
import React, { useState, useEffect } from 'react';
import styles from './ReviewForm.module.css';
import { NameTag } from './NameTag';
import { FaceRating } from './FaceRating';
import { generateFunkyName } from '../lib/funkyNames';
import { reviewsApi, type ReviewItem } from '../api/reviews';
import { COPY } from '../copy';

interface ReviewFormProps {
  onSuccess?: (newReview: ReviewItem) => void;
  className?: string;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ onSuccess, className = '' }) => {
  const [alias, setAlias] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize random alias on mount
  useEffect(() => {
    setAlias(generateFunkyName());
  }, []);

  const handleReroll = () => {
    setAlias(generateFunkyName());
  };

  const charCount = text.trim().length;
  const isTooShort = charCount > 0 && charCount < 10;
  const isTooLong = charCount > 280;
  const isValid = charCount >= 10 && charCount <= 280;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const review = await reviewsApi.postReview({
        display_name: alias,
        rating,
        text,
        hp_field: honeypot
      });
      setSubmitted(true);
      if (onSuccess) onSuccess(review);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`${styles.successCard} ${className}`}>
        <div className={styles.thumbsUpIcon} aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 44 44">
            <rect x="2" y="2" width="40" height="40" rx="12" fill="#9FE3BF" stroke="#1B1A17" strokeWidth="2" />
            <path
              d="M 12 24 L 20 32 L 32 14"
              fill="none"
              stroke="#1B1A17"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h4 className={styles.successTitle}>{COPY.reviews.submittedTitle}</h4>
        <p className={styles.successSub}>{COPY.reviews.submittedSubtitle}</p>
      </div>
    );
  }

  return (
    <form className={`${styles.formCard} ${className}`} onSubmit={handleSubmit}>
      {/* Honeypot field for bot detection (hidden from human users) */}
      <input
        type="text"
        name="hp_field"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className={styles.honeypot}
        aria-hidden="true"
      />

      {/* Row 1: Alias Tag and Rating */}
      <div className={styles.topRow}>
        <div className={styles.aliasCol}>
          <span className={styles.fieldLabel}>{COPY.reviews.nameTagLabel}</span>
          <NameTag name={alias} onReroll={handleReroll} />
        </div>
        <div className={styles.ratingCol}>
          <span className={styles.fieldLabel}>Rating</span>
          <FaceRating rating={rating} onChange={setRating} disabled={isSubmitting} />
        </div>
      </div>

      {/* Row 2: Textarea with counter */}
      <div className={styles.textareaGroup}>
        <div className={styles.textareaHeader}>
          <label htmlFor="review-text" className={styles.fieldLabel}>
            {COPY.reviews.textareaLabel}
          </label>
          <span
            className={`${styles.charCounter} ${isTooLong ? styles.counterError : ''}`}
            aria-live="polite"
          >
            {charCount}/280 {COPY.reviews.charCount}
          </span>
        </div>
        <textarea
          id="review-text"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={COPY.reviews.textareaPlaceholder}
          disabled={isSubmitting}
          className={`${styles.textarea} ${isTooShort || isTooLong ? styles.textareaInvalid : ''}`}
        />
        {isTooShort && (
          <span className={styles.validationNote}>Needs at least 10 characters ({10 - charCount} more).</span>
        )}
      </div>

      {/* Error Notice */}
      {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

      {/* Actions and Disclaimer */}
      <div className={styles.bottomRow}>
        <span className={styles.disclaimer}>{COPY.reviews.disclaimer}</span>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className={styles.submitBtn}
        >
          {isSubmitting ? COPY.reviews.submitting : COPY.reviews.submit}
        </button>
      </div>
    </form>
  );
};
