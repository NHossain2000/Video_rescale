// reviews.ts — Typed client and mock adapter for Tuckin reviews
// Written so that swapping from Mock to Real API only requires changing the adapter

export interface ReviewItem {
  id: string;
  display_name: string;
  rating: number; // 1 to 5
  text: string;
  created_at: string; // ISO string
}

export interface ReviewsResponse {
  items: ReviewItem[];
  next_cursor?: string;
  total_count: number;
  average_rating: number;
}

export interface SubmitReviewInput {
  display_name: string;
  rating: number;
  text: string;
  hp_field?: string; // honeypot for bots
}

// Dummy sample reviews displayed on the review wall
export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    display_name: 'Turbo Pickle 7',
    rating: 5,
    text: 'Shrank my 120MB drone shot down to 24MB. Absolutely zero perceptible artifacts on my 4K monitor. Incredible quality.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'rev-2',
    display_name: 'Sweaty Waffle',
    rating: 4,
    text: 'Took about 45 seconds on Standard mode. UI is super clean and the file dropped from 85MB to 29MB. Very satisfied.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'rev-3',
    display_name: 'Fluffy Avocado 99',
    rating: 5,
    text: 'Love that it doesn’t ask for an email or sign up. Processed everything locally with zero tracking. 10/10 privacy.',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

class MockReviewsService {
  private reviews: ReviewItem[] = [...INITIAL_REVIEWS];

  async getReviews(cursor?: string, limit = 6): Promise<ReviewsResponse> {
    // Simulate slight network delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    const startIndex = cursor ? this.reviews.findIndex((r) => r.id === cursor) + 1 : 0;
    const pageItems = this.reviews.slice(startIndex, startIndex + limit);
    const nextCursor = startIndex + limit < this.reviews.length
      ? pageItems[pageItems.length - 1]?.id
      : undefined;

    const totalCount = this.reviews.length;
    const avg = totalCount > 0
      ? this.reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount
      : 0;

    return {
      items: pageItems,
      next_cursor: nextCursor,
      total_count: totalCount,
      average_rating: Math.round(avg * 10) / 10
    };
  }

  async postReview(input: SubmitReviewInput): Promise<ReviewItem> {
    // Honeypot bot trap
    if (input.hp_field && input.hp_field.trim().length > 0) {
      throw new Error('Spam check triggered.');
    }

    if (!input.rating || input.rating < 1 || input.rating > 5) {
      throw new Error('Rating must be between 1 and 5.');
    }

    const trimmedText = (input.text || '').trim();
    if (trimmedText.length < 10) {
      throw new Error('Review text must be at least 10 characters.');
    }
    if (trimmedText.length > 280) {
      throw new Error('Review text cannot exceed 280 characters.');
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 350));

    const newReview: ReviewItem = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      display_name: input.display_name,
      rating: input.rating,
      text: trimmedText,
      created_at: new Date().toISOString()
    };

    // Prepend (newest first as per honesty rule)
    this.reviews.unshift(newReview);

    return newReview;
  }
}

// Singleton review service instance
export const reviewsApi = new MockReviewsService();
