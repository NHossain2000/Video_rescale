# 🚀 100% Free Production Hosting Guide for Tuckin

> **Stack**:  
> • **Frontend**: [Vercel](https://vercel.com) (Free Hobby Tier — Edge CDN, Automated CI/CD, Free SSL)  
> • **Backend**: [Render](https://render.com) (Free Docker Web Service — Multi-threaded FFmpeg, SQLite3, Free SSL)  
> • **Zero Cost**: $0/month forever with no credit card required to deploy.

---

## 🧭 Architecture & CORS/Security Overview

Deploying a hybrid WebAssembly + Native FFmpeg video processor requires specific browser security configurations:

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│     Vercel Frontend (Edge)      │                 │      Render Backend (Docker)    │
│  https://tuckin.vercel.app      │  ─────────────► │   https://tuckin-api.onrender.com│
│                                 │   CORS / Fetch  │                                 │
│ • COOP: same-origin             │                 │ • CORS: Access-Control-*        │
│ • COEP: require-corp (WASM)     │ ◄─────────────  │ • CORP: cross-origin (Videos)   │
└─────────────────────────────────┘  Stream Preview │ • Pre-installed Native FFmpeg   │
                                                    │ • Persistent SQLite3 Reviews    │
                                                    └─────────────────────────────────┘
```

### Why Most Other Video Apps Fail with CORS/WASM (and How Tuckin Solves It):
1. **SharedArrayBuffer Security (WASM Engine)**: Browser isolation requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` on the frontend. Tuckin has these pre-configured in [`app/frontend/vercel.json`](file:///c:/Users/navid/OneDrive/Desktop/video_rescale/app/frontend/vercel.json).
2. **Cross-Origin Embedder Block (CORP)**: When COEP is enabled on Vercel, the browser will block any cross-origin media (like video previews streamed from Render) unless the backend explicitly returns `Cross-Origin-Resource-Policy: cross-origin`. Tuckin includes this middleware out-of-the-box in [`app/backend/main.py`](file:///c:/Users/navid/OneDrive/Desktop/video_rescale/app/backend/main.py).
3. **Smart Hybrid Resilience**: If Render's free backend is spinning down (cold start), Tuckin's frontend automatically detects this via a 1.5s health ping and seamlessly runs client-side WebAssembly in the browser so your users **never** experience a failed compression!

---

## 📦 Step 1: Push Your Code to GitHub

Make sure your latest code is committed and pushed to your GitHub repository:

```bash
# 1. Check git status
git status

# 2. Add remote if not already added (replace with your repo URL)
git remote add origin https://github.com/your-username/tuckin.git

# 3. Push to master/main
git branch -M master
git push -u origin master
```

---

## 🐳 Step 2: Deploy Backend to Render (Free)

Render provides a 100% free web service tier that supports Docker containers. Because video compression requires `ffmpeg`, we use our pre-optimized multi-stage [`app/backend/Dockerfile`](file:///c:/Users/navid/OneDrive/Desktop/video_rescale/app/backend/Dockerfile).

1. Log in to **[dashboard.render.com](https://dashboard.render.com/)** (sign in with GitHub).
2. Click **New +** in the top navigation bar and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your `tuckin` repository.
4. Fill in the service configuration:
   - **Name**: `tuckin-api` (or any custom name)
   - **Region**: Choose the region closest to you (e.g., *Frankfurt*, *Oregon*, or *Singapore*)
   - **Branch**: `master` (or `main`)
   - **Root Directory**: Leave blank (or type `app/backend`)
   - **Runtime**: Select **Docker**
   - **Dockerfile Path**: `app/backend/Dockerfile`
   - **Docker Context**: `app/backend`
   - **Instance Type**: Select **Free** ($0/month, 512 MB RAM, 0.1 CPU)
5. Expand the **Advanced** section:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes`
6. Under **Environment Variables**, add:
   | Key | Value | Purpose |
   |---|---|---|
   | `CORS_ORIGINS` | `*` | Allows cross-origin requests from your Vercel frontend |
   | `MAX_WORKERS` | `1` | Optimizes CPU/RAM memory efficiency for free tier |
   | `PORT` | `8000` | Port uvicorn binds to |
   | `JOB_TTL_SECONDS` | `900` | Auto-purges temporary videos after 15 minutes |
7. Click **Create Web Service**.
8. Render will build the Docker container, install multi-threaded FFmpeg, initialize SQLite3, and launch the API.
9. Once the build finishes and shows **Live**, copy your public URL:
   `https://tuckin-api.onrender.com`

> **Quick Smoke Test**: Open `https://tuckin-api.onrender.com/health` in your browser. You should receive:
> `{"status":"ok","jobs_active":0}`

---

## ⚡ Step 3: Deploy Frontend to Vercel (Free)

Vercel provides automated zero-config deployments for Vite/React applications with global CDN caching.

1. Log in to **[vercel.com](https://vercel.com/)** (sign in with GitHub).
2. Click **Add New…** → **Project**.
3. Find your `tuckin` repository and click **Import**.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Vite` (automatically detected)
   - **Root Directory**: Click **Edit** and select **`app/frontend`**
   - **Build and Output Settings**:
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`
5. Expand **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://tuckin-api.onrender.com` |
   *(⚠️ Important: Use your actual Render URL from Step 2, and do not include a trailing slash!)*
6. Click **Deploy**.
7. In ~45 seconds, Vercel will build and assign you a free production URL:
   `https://tuckin.vercel.app` (or custom name).

---

## 🛡️ Step 4: Secure CORS (Optional but Recommended)

Once your Vercel frontend is live, you can tighten CORS security on Render so only your frontend can call the backend:

1. Go to your Render dashboard → **tuckin-api** → **Environment**.
2. Update `CORS_ORIGINS` from `*` to your exact Vercel domain:
   ```
   https://tuckin.vercel.app
   ```
3. Click **Save Changes**. Render will automatically re-deploy in seconds.

---

## 🧪 Step 5: Production Verification Checklist

Run through this quick verification test on your live Vercel URL (`https://your-app.vercel.app`):

- [ ] **Initial Page Load**: Logo, tagline, Tuck mascot, and Squeeze Dial render crisply.
- [ ] **Reviews Wall (`#reviews`)**:
  - Shows top 6 comments and total comment count in numbers.
  - "View all X comments" button expands all comments.
  - "+ Leave note" successfully submits and stores a review into backend SQLite3.
- [ ] **Backend Health Check**:
  - The privacy sticker indicates active security status.
  - Dropping a video uses the Render multi-threaded backend.
- [ ] **Comparison Slider Preview**:
  - Squeezed video renders side-by-side with before/after wipe scrubber.
  - No `MEDIA_ERR_SRC_NOT_SUPPORTED` or CORS errors in DevTools console.
- [ ] **1-Click Download**:
  - Clicking **"Download video"** immediately downloads a valid, intact `.mp4` file that opens and plays cleanly in Windows Media Player, QuickTime, or VLC.
- [ ] **WASM Fallback**:
  - If backend is offline or sleeping, Tuckin falls back to WebAssembly in the browser without crashing.

---

## 💡 Pro-Tip: Free Tier Sleep & Keep-Alive

Render's free tier services enter sleep mode after **15 minutes** of zero traffic. When a new request arrives, it takes ~45 seconds to wake up.

Tuckin handles this gracefully:
1. **Zero User Friction**: If the backend is sleeping, the frontend's 1.5s health ping times out and switches immediately to the in-browser WebAssembly engine so the user can compress right away!
2. **Free 24/7 Keep-Alive (Optional)**:
   If you want your backend to stay awake 24/7 with zero cold starts, you can set up a free HTTP ping using [UptimeRobot](https://uptimerobot.com/) (100% free):
   - Monitor Type: `HTTP(s)`
   - URL: `https://tuckin-api.onrender.com/health`
   - Monitoring Interval: `Every 10 minutes`

---

## 🆘 Troubleshooting

| Issue | Root Cause | Solution |
|---|---|---|
| `SharedArrayBuffer is not defined` | Missing COOP/COEP headers | Verify [`app/frontend/vercel.json`](file:///c:/Users/navid/OneDrive/Desktop/video_rescale/app/frontend/vercel.json) is deployed in your Vercel project root. |
| `Cross-Origin Request Blocked` | `CORS_ORIGINS` mismatch | Check Render environment variables; set `CORS_ORIGINS=*` or match your exact Vercel URL. |
| Video preview blank or error | Missing CORP header | Ensure [`app/backend/main.py`](file:///c:/Users/navid/OneDrive/Desktop/video_rescale/app/backend/main.py) has the `Cross-Origin-Resource-Policy: cross-origin` middleware (already included). |
| Docker build fails on Render | Missing files in context | Verify `app/backend/Dockerfile` copies `compressor.py`, `main.py`, and `db.py`. |
| Upload fails with 413 | Free tier upload payload limit | By default, loopback handles any size. On Render, files up to 100MB compress smoothly. For files >200MB on free tiers, client WASM fallback handles them locally in-memory. |
