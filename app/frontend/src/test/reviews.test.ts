import { describe, it, expect } from 'vitest';
import { reviewsApi } from '../api/reviews';

describe('reviews API mock client', () => {
  it('rejects submissions with honeypot filled', async () => {
    await expect(
      reviewsApi.postReview({
        display_name: 'Turbo Pickle 7',
        rating: 5,
        text: 'This is a genuine test review text!',
        hp_field: 'I am a spambot'
      })
    ).rejects.toThrow('Spam check triggered.');
  });

  it('enforces character length limits (10 to 280)', async () => {
    // Too short (< 10)
    await expect(
      reviewsApi.postReview({
        display_name: 'Turbo Pickle 7',
        rating: 5,
        text: 'Too short'
      })
    ).rejects.toThrow('at least 10 characters');

    // Valid length
    const review = await reviewsApi.postReview({
      display_name: 'Turbo Pickle 7',
      rating: 5,
      text: 'This is an awesome video compressor, shrunk my file easily.'
    });
    expect(review.id).toBeDefined();
    expect(review.display_name).toBe('Turbo Pickle 7');
    expect(review.rating).toBe(5);
  });

  it('fetches reviews with metrics', async () => {
    const res = await reviewsApi.getReviews(undefined, 5);
    expect(res.total_count).toBeGreaterThan(0);
    expect(res.average_rating).toBeGreaterThan(0);
    expect(Array.isArray(res.items)).toBe(true);
  });
});
