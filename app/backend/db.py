# db.py — In-house SQLite3 database for Tuckin reviews
import sqlite3
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any

DB_DIR = Path(__file__).resolve().parent / "data"
DB_PATH = DB_DIR / "reviews.db"

INITIAL_REVIEWS = [
    {
        "id": "rev-init-1",
        "display_name": "Turbo Pickle 7",
        "rating": 5,
        "text": "Shrank my 120MB drone shot down to 24MB. Absolutely zero perceptible artifacts on my 4K monitor. Incredible quality.",
        "created_at": "2026-10-24T18:00:00Z"
    },
    {
        "id": "rev-init-2",
        "display_name": "Fluffy Avocado 99",
        "rating": 5,
        "text": "Love that it doesn’t ask for an email or sign up. Processed everything locally with zero tracking. 10/10 privacy.",
        "created_at": "2026-10-24T14:30:00Z"
    },
    {
        "id": "rev-init-3",
        "display_name": "Pixel Runner",
        "rating": 5,
        "text": "Took my 1.8GB phone recording down to 420MB in under 90 seconds on my laptop CPU. Insanely fast multi-threaded compression.",
        "created_at": "2026-10-24T11:15:00Z"
    },
    {
        "id": "rev-init-4",
        "display_name": "Sonic Hedgehog",
        "rating": 5,
        "text": "The 5.1 surround downmix actually works properly! Dialogue is crystal clear now without being drowned out.",
        "created_at": "2026-10-23T20:45:00Z"
    },
    {
        "id": "rev-init-5",
        "display_name": "Velvet Sloth",
        "rating": 5,
        "text": "Spot the difference slider makes it super easy to verify compression quality before saving. Brilliant design.",
        "created_at": "2026-10-23T16:20:00Z"
    },
    {
        "id": "rev-init-6",
        "display_name": "Sweaty Waffle",
        "rating": 4,
        "text": "Took about 45 seconds on Standard mode. UI is super clean and the file dropped from 85MB to 29MB. Very satisfied.",
        "created_at": "2026-10-23T09:00:00Z"
    },
    {
        "id": "rev-init-7",
        "display_name": "Cozy Toaster",
        "rating": 4,
        "text": "Great tool for squeezing clips under mobile chat limits. Super intuitive analog dial interface.",
        "created_at": "2026-10-22T19:30:00Z"
    },
    {
        "id": "rev-init-8",
        "display_name": "Glitchy Fox",
        "rating": 4,
        "text": "Fast compression and love the mascot animations. Handles vertical videos perfectly without squishing.",
        "created_at": "2026-10-22T12:00:00Z"
    }
]


def get_db_connection() -> sqlite3.Connection:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize SQLite database table and seed initial data if empty."""
    conn = get_db_connection()
    try:
        with conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS reviews (
                    id TEXT PRIMARY KEY,
                    display_name TEXT NOT NULL,
                    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                    text TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            # Create an index for fast retrieval of top-rated comments
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_reviews_rating_date
                ON reviews(rating DESC, created_at DESC)
                """
            )
            
            cur = conn.execute("SELECT COUNT(*) as count FROM reviews")
            count = cur.fetchone()["count"]
            if count == 0:
                for rev in INITIAL_REVIEWS:
                    conn.execute(
                        """
                        INSERT INTO reviews (id, display_name, rating, text, created_at)
                        VALUES (?, ?, ?, ?, ?)
                        """,
                        (rev["id"], rev["display_name"], rev["rating"], rev["text"], rev["created_at"])
                    )
    finally:
        conn.close()


def get_reviews_summary(show_all: bool = False, limit: int = 6) -> Dict[str, Any]:
    """
    Returns reviews from SQLite database:
    - By default (show_all=False): returns up to top 6 highest rated comments (ordered by rating DESC, created_at DESC).
    - If show_all=True: returns all comments.
    - Always returns total_count (total number of reviews in database) and average_rating.
    """
    conn = get_db_connection()
    try:
        # Get total count and overall average rating
        summary_row = conn.execute("SELECT COUNT(*) as total, AVG(rating) as avg_rating FROM reviews").fetchone()
        total_count = summary_row["total"] or 0
        avg_rating = round(summary_row["avg_rating"] or 0.0, 1)

        if show_all:
            query = "SELECT id, display_name, rating, text, created_at FROM reviews ORDER BY rating DESC, created_at DESC"
            rows = conn.execute(query).fetchall()
        else:
            query = "SELECT id, display_name, rating, text, created_at FROM reviews ORDER BY rating DESC, created_at DESC LIMIT ?"
            rows = conn.execute(query, (limit,)).fetchall()

        items = [
            {
                "id": r["id"],
                "display_name": r["display_name"],
                "rating": r["rating"],
                "text": r["text"],
                "created_at": r["created_at"]
            }
            for r in rows
        ]

        return {
            "items": items,
            "total_count": total_count,
            "average_rating": avg_rating,
            "showing_all": show_all,
            "limit": limit
        }
    finally:
        conn.close()


def insert_review(display_name: str, rating: int, text: str) -> Dict[str, Any]:
    """Inserts a new user review into SQLite database."""
    clean_name = (display_name or "Anonymous").strip()[:50]
    clean_text = (text or "").strip()
    
    if rating < 1 or rating > 5:
        raise ValueError("Rating must be between 1 and 5.")
    if len(clean_text) < 10:
        raise ValueError("Review text must be at least 10 characters.")
    if len(clean_text) > 280:
        raise ValueError("Review text cannot exceed 280 characters.")

    review_id = f"rev-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO reviews (id, display_name, rating, text, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (review_id, clean_name, rating, clean_text, now_iso)
            )
        return {
            "id": review_id,
            "display_name": clean_name,
            "rating": rating,
            "text": clean_text,
            "created_at": now_iso
        }
    finally:
        conn.close()
