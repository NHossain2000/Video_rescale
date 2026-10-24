// ReviewWall.tsx — Honest review wall with summary strip and cursor pagination
import React, { useState, useEffect } from 'react';
import { reviewsApi, type ReviewItem } from '../api/reviews';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { COPY } from '../copy';
import styles from './ReviewWall.module.css';

export const ReviewWall: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadInitialReviews = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await reviewsApi.getReviews(undefined, 6);
      setReviews(res.items);
      setNextCursor(res.next_cursor);
      setTotalCount(res.total_count);
      setAverageRating(res.average_rating);
    } catch {
      setErrorMsg('Could not load reviews. Click to retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialReviews();
  }, []);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await reviewsApi.getReviews(nextCursor, 6);
      setReviews((prev) => [...prev, ...res.items]);
      setNextCursor(res.next_cursor);
    } catch {
      // Keep previous reviews
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleReviewCreated = (newReview: ReviewItem) => {
    setReviews((prev) => [newReview, ...prev]);
    setTotalCount((prev) => prev + 1);
    // Recalculate average
    setReviews((currentList) => {
      const sum = currentList.reduce((acc, r) => acc + r.rating, 0);
      setAverageRating(Math.round((sum / currentList.length) * 10) / 10);
      return currentList;
    });
    setShowForm(false);
  };

  return (
    <section id="reviews" className={styles.section}>
      {/* Header & Stats Banner */}
      <div className={styles.sectionHeader}>
        <div className={styles.titleCol}>
          <h2 className={styles.title}>{COPY.reviews.wallTitle}</h2>
          <p className={styles.subtitle}>{COPY.reviews.wallSubtitle}</p>
        </div>

        {/* Real Summary Strip */}
        <div className={styles.summaryStrip}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryNum}>{totalCount}</span>
            <span className={styles.summaryLabel}>Reviews</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryNum}>
              {totalCount > 0 ? averageRating.toFixed(1) : '—'}
            </span>
            <span className={styles.summaryLabel}>Avg Score</span>
          </div>
          <button
            type="button"
            className={styles.writeReviewBtn}
            onClick={() => setShowForm(!showForm)}
            aria-expanded={showForm}
          >
            {showForm ? 'Close form' : '+ Leave note'}
          </button>
        </div>
      </div>

      {/* Inline Review Form */}
      {showForm && (
        <div className={styles.formContainer}>
          <ReviewForm onSuccess={handleReviewCreated} />
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className={styles.errorBox}>
          <span>{errorMsg}</span>
          <button type="button" className={styles.retryBtn} onClick={loadInitialReviews}>
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`skel-${i}`} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Honest Empty State */}
      {!isLoading && !errorMsg && reviews.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">
            🌱
          </div>
          <p className={styles.emptyText}>{COPY.reviews.empty}</p>
          <button
            type="button"
            className={styles.emptyCta}
            onClick={() => setShowForm(true)}
          >
            Be the first to review
          </button>
        </div>
      )}

      {/* Reviews Grid */}
      {!isLoading && reviews.length > 0 && (
        <div className={styles.grid}>
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {/* Pagination: Show More */}
      {nextCursor && !isLoading && (
        <div className={styles.loadMoreRow}>
          <button
            type="button"
            disabled={isLoadingMore}
            className={styles.loadMoreBtn}
            onClick={handleLoadMore}
          >
            {isLoadingMore ? 'Loading notes...' : COPY.reviews.showMore}
          </button>
        </div>
      )}
    </section>
  );
};
