// ReviewWall.tsx — Honest review wall with SQLite top-6 highest rated comments and View All toggle
import React, { useState, useEffect } from 'react';
import { reviewsApi, type ReviewItem } from '../api/reviews';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { COPY } from '../copy';
import styles from './ReviewWall.module.css';

export const ReviewWall: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [isShowingAll, setIsShowingAll] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingToggle, setIsLoadingToggle] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReviews = async (showAll: boolean) => {
    try {
      const res = await reviewsApi.getReviews(showAll, 6);
      setReviews(res.items);
      setTotalCount(res.total_count);
      setAverageRating(res.average_rating);
      setIsShowingAll(showAll);
    } catch {
      setErrorMsg('Could not load reviews from database. Click to retry.');
    }
  };

  const loadInitial = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    await fetchReviews(false);
    setIsLoading(false);
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const handleToggleViewAll = async () => {
    setIsLoadingToggle(true);
    await fetchReviews(!isShowingAll);
    setIsLoadingToggle(false);
  };

  const handleReviewCreated = async () => {
    // Re-fetch to get updated rankings and exact database count
    await fetchReviews(isShowingAll);
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

        {/* Real Summary Strip — Total comments count in numbers */}
        <div className={styles.summaryStrip}>
          <div className={styles.summaryItem} title="Total verified user reviews stored in database">
            <span className={styles.summaryNum}>{totalCount}</span>
            <span className={styles.summaryLabel}>Comments</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem} title="Average rating across all comments">
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

      {/* Filter indicator */}
      {!isLoading && reviews.length > 0 && (
        <div className={styles.filterRow}>
          <span className={styles.filterPill}>
            {isShowingAll
              ? `Showing all ${totalCount} comments`
              : `Showing top ${reviews.length} highest rated comments (out of ${totalCount} total)`}
          </span>
        </div>
      )}

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
          <button type="button" className={styles.retryBtn} onClick={loadInitial}>
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

      {/* Reviews Grid (Top 6 or All) */}
      {!isLoading && reviews.length > 0 && (
        <div className={styles.grid}>
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}

      {/* View All Button Toggle */}
      {!isLoading && totalCount > 6 && (
        <div className={styles.viewAllRow}>
          <button
            type="button"
            disabled={isLoadingToggle}
            className={styles.viewAllBtn}
            onClick={handleToggleViewAll}
          >
            {isLoadingToggle
              ? 'Loading comments...'
              : isShowingAll
              ? '↑ Show top 6 comments only'
              : `↓ View all ${totalCount} comments`}
          </button>
        </div>
      )}
    </section>
  );
};
