// ReviewCard.tsx — Sticky note review card with seeded rotation and plain text escaping
import React from 'react';
import type { ReviewItem } from '../api/reviews';
import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  review: ReviewItem;
}

// Deterministic seed for card rotation and background color based on review ID
function getCardStyle(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  // Rotation: -2deg to 2deg
  const rotation = ((absHash % 40) - 20) / 10;

  // Background fill: cream (50%), butter (30%), sky (20%) — NEVER tomato or mint
  const colorPicker = absHash % 10;
  let bgVar = 'var(--cream)';
  if (colorPicker >= 5 && colorPicker < 8) {
    bgVar = 'var(--butter)';
  } else if (colorPicker >= 8) {
    bgVar = 'var(--sky)';
  }

  return {
    transform: `rotate(${rotation}deg)`,
    backgroundColor: bgVar
  };
}

function formatRelativeTime(isoDate: string): string {
  try {
    const diffSec = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  } catch {
    return 'recently';
  }
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const cardStyle = getCardStyle(review.id);
  const timeAgo = formatRelativeTime(review.created_at);

  return (
    <article className={styles.card} style={cardStyle}>
      {/* Top Meta */}
      <div className={styles.cardHeader}>
        <span className={styles.displayName}>{review.display_name}</span>
        <span className={styles.timeAgo}>{timeAgo}</span>
      </div>

      {/* Rating score badge */}
      <div className={styles.ratingRow} aria-label={`Rating: ${review.rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`${styles.ratingDot} ${i < review.rating ? styles.ratingDotFilled : ''}`}
            aria-hidden="true"
          />
        ))}
        <span className={styles.ratingNum}>{review.rating}/5</span>
      </div>

      {/* Escaped plain text review body */}
      <p className={styles.reviewText}>{review.text}</p>
    </article>
  );
};
