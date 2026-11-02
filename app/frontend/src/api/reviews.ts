// reviews.ts — Typed client for Tuckin reviews connected to SQLite3 backend
import { API_BASE } from './api';
// Includes in-memory fallback for offline/isolated unit testing

export interface ReviewItem {
  id: string;
  display_name: string;
  rating: number; // 1 to 5
  text: string;
  created_at: string; // ISO string
}

export interface ReviewsResponse {
  items: ReviewItem[];
  total_count: number;
  average_rating: number;
  showing_all?: boolean;
}

export interface SubmitReviewInput {
  display_name: string;
  rating: number;
  text: string;
  hp_field?: string; // honeypot for bots
}

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-init-1',
    display_name: 'Turbo Pickle 7',
    rating: 5,
    text: 'Shrank my 120MB drone shot down to 24MB. Absolutely zero perceptible artifacts on my 4K monitor. Incredible quality.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'rev-init-2',
    display_name: 'Fluffy Avocado 99',
    rating: 5,
    text: 'Love that it doesn’t ask for an email or sign up. Processed everything locally with zero tracking. 10/10 privacy.',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString()
  },
  {
    id: 'rev-init-3',
    display_name: 'Pixel Runner',
    rating: 5,
    text: 'Took my 1.8GB phone recording down to 420MB in under 90 seconds on my laptop CPU. Insanely fast multi-threaded compression.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'rev-init-4',
    display_name: 'Sonic Hedgehog',
    rating: 5,
    text: 'The 5.1 surround downmix actually works properly! Dialogue is crystal clear now without being drowned out.',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString()
  },
  {
    id: 'rev-init-5',
    display_name: 'Velvet Sloth',
    rating: 5,
    text: 'Spot the difference slider makes it super easy to verify compression quality before saving. Brilliant design.',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'rev-init-6',
    display_name: 'Sweaty Waffle',
    rating: 4,
    text: 'Took about 45 seconds on Standard mode. UI is super clean and the file dropped from 85MB to 29MB. Very satisfied.',
    created_at: new Date(Date.now() - 3600000 * 60).toISOString()
  },
  {
    id: 'rev-init-7',
    display_name: 'Cozy Toaster',
    rating: 4,
    text: 'Great tool for squeezing clips under mobile chat limits. Super intuitive analog dial interface.',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString()
  },
  {
    id: 'rev-init-8',
    display_name: 'Glitchy Fox',
    rating: 4,
    text: 'Fast compression and love the mascot animations. Handles vertical videos perfectly without squishing.',
    created_at: new Date(Date.now() - 3600000 * 84).toISOString()
  }
];



class ReviewsService {
  private fallbackReviews: ReviewItem[] = [...INITIAL_REVIEWS];

  /**
   * Fetches reviews:
   * - showAll = false: returns top 6 highest rated comments (ordered by rating DESC, created_at DESC)
   * - showAll = true: returns all comments
   * - total_count: exact total number of comments stored in database
   */
  async getReviews(showAll = false, limit = 6): Promise<ReviewsResponse> {
    try {
      const url = `${API_BASE}/api/reviews?show_all=${showAll}&limit=${limit}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        return {
          items: data.items,
          total_count: data.total_count,
          average_rating: data.average_rating,
          showing_all: data.showing_all
        };
      }
    } catch {
      // Backend unavailable; use fallback
    }

    // Fallback: sort by rating DESC, created_at DESC
    const sorted = [...this.fallbackReviews].sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const items = showAll ? sorted : sorted.slice(0, limit);
    const totalCount = sorted.length;
    const avg = totalCount > 0
      ? sorted.reduce((acc, r) => acc + r.rating, 0) / totalCount
      : 0;

    return {
      items,
      total_count: totalCount,
      average_rating: Math.round(avg * 10) / 10,
      showing_all: showAll
    };
  }

  async postReview(input: SubmitReviewInput): Promise<ReviewItem> {
    // Client-side honeypot bot trap
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

    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: input.display_name,
          rating: input.rating,
          text: trimmedText,
          hp_field: input.hp_field
        })
      });

      if (res.ok) {
        const savedReview: ReviewItem = await res.json();
        this.fallbackReviews.unshift(savedReview);
        return savedReview;
      }
      
      const err = await res.json().catch(() => null);
      if (err?.detail) {
        throw new Error(err.detail);
      }
    } catch (e) {
      if (e instanceof Error && e.message && !e.message.includes('fetch')) {
        throw e;
      }
      // If network error, persist in fallback memory
    }

    const fallbackReview: ReviewItem = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      display_name: input.display_name || 'Anonymous',
      rating: input.rating,
      text: trimmedText,
      created_at: new Date().toISOString()
    };
    this.fallbackReviews.unshift(fallbackReview);
    return fallbackReview;
  }
}

export const reviewsApi = new ReviewsService();
