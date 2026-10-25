# 🚀 100% Free Production Hosting Guide for Tuckin
## The "Zero-Cold-Start" Free Stack: Vercel + Render + UptimeRobot

> **The Ultimate $0/Month Video Studio Stack**:  
> • **Frontend**: [Vercel](https://vercel.com) (Free Edge CDN, Automated CI/CD, Free SSL)  
> • **Backend**: [Render](https://render.com) (Free Docker Container, Native Multi-threaded FFmpeg, SQLite3)  
> • **Keep-Alive Bot**: [UptimeRobot](https://uptimerobot.com) (Free HTTP Ping, Prevents Sleep, **Zero Cold Starts**)  
> • **Total Cost**: **$0.00 / month forever — No credit card required!**

---

## 🧭 System Architecture & Security Flow

Deploying a hybrid WebAssembly + Native multi-threaded FFmpeg video compressor across distributed domains requires a tight security handshake:

```
                                  ┌───────────────────────────┐
                                  │   UptimeRobot Keep-Alive  │
                                  │ (Pings /health every 10m) │
                                  └─────────────┬─────────────┘
                                                │ Keeps 24/7 Awake
                                                ▼
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

### Why Most Video Apps Fail with CORS & WebAssembly (and How Tuckin Solves It):
1. **WebAssembly Isolation (Vercel)**: Browser security requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` on the frontend to enable `SharedArrayBuffer` for client-side WASM encoding. Tuckin includes these pre-configured in [`app/frontend/vercel.json`](app/frontend/vercel.json).
2. **Cross-Origin Video Streaming (Render Backend)**: When Vercel enforces `require-corp`, Chrome and Safari block any cross-origin video streams (like before/after comparison previews from Render) unless the backend explicitly returns `Cross-Origin-Resource-Policy: cross-origin`. Tuckin has this middleware built-in in [`app/backend/main.py`](app/backend/main.py).
3. **Zero Cold-Start Keep-Alive**: Render's free tier normally sleeps after 15 minutes of inactivity. By connecting a free UptimeRobot monitor to ping `/health` every 10 minutes, **your backend never sleeps**, ensuring instant native compression on demand!
4. **Smart Hybrid Safety Net**: If the backend ever temporarily restarts or experiences network downtime, Tuckin's frontend automatically detects it within 1.5 seconds and seamlessly switches to the in-browser WebAssembly engine so your users never experience a failed compression!

---

## 📦 Step 1: Push Your Code to GitHub

Make sure your latest codebase is committed and pushed to your GitHub repository:

```bash
# 1. Verify clean git state
git status

# 2. Add remote if not already linked (replace with your repo URL)
git remote add origin https://github.com/your-username/tuckin.git

# 3. Push to master or main
git branch -M master
git push -u origin master
```

---

## 🐳 Step 2: Deploy Backend to Render (100% Free)

Render provides a 100% free web service tier that supports Docker containers. Because native video compression requires `ffmpeg`, we use our pre-optimized multi-stage [`app/backend/Dockerfile`](app/backend/Dockerfile).

1. Log in to **[dashboard.render.com](https://dashboard.render.com/)** (Sign in with GitHub).
2. Click **New +** in the top navigation bar and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your `tuckin` repository.
4. Fill in the service configuration:
   - **Name**: `tuckin-api` (or any custom name)
   - **Region**: Choose the region closest to your target audience (e.g., *Frankfurt*, *Oregon*, or *Singapore*)
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
   | `MAX_WORKERS` | `1` | Optimizes CPU and memory efficiency for free tier |
   | `PORT` | `8000` | Port uvicorn binds to inside the container |
   | `JOB_TTL_SECONDS` | `900` | Auto-purges temporary video buffers after 15 minutes |
7. Click **Create Web Service**.
8. Render will build the Docker container, install multi-threaded FFmpeg, initialize SQLite3, and launch the API.
9. Once the build finishes and displays **Live**, copy your public URL:
   ```
   https://tuckin-api.onrender.com
   ```

> **Quick Smoke Test**: Open `https://tuckin-api.onrender.com/health` in your browser. You should receive:
> `{"status":"ok","jobs_active":0}`

---

## 🤖 Step 3: Setup UptimeRobot Free Keep-Alive Bot (Zero Cold Starts)

Render's free tier services enter sleep mode after **15 minutes** of inactivity, which causes a 45-second delay ("cold start") on the next visit.

By setting up a free HTTP health check bot on **UptimeRobot**, your backend receives a lightweight ping every 10 minutes, keeping it **awake 24/7 with zero cold starts**!

1. Go to **[uptimerobot.com](https://uptimerobot.com/)** and click **Register for FREE** (no credit card needed).
2. Once in your dashboard, click the **+ Add New Monitor** button.
3. Fill in the monitor settings:
   - **Monitor Type**: Select **`HTTP(s)`**
   - **Friendly Name**: `Tuckin Backend Keep-Alive`
   - **URL (or IP)**: `https://tuckin-api.onrender.com/health` *(use your actual Render URL from Step 2)*
   - **Monitoring Interval**: Select **`Every 10 minutes`** *(Render sleeps after 15m, so 10m guarantees it never sleeps!)*
   - **Monitor Timeout**: `30 seconds`
   - **HTTP Method**: `HEAD` (or `GET`) — our backend supports lightweight `HEAD` requests on `/health` consuming almost 0 bandwidth!
4. Click **Create Monitor**.

🎉 **Done!** Your Render backend will now stay awake 24/7/365 at $0 cost!

---

## ⚡ Step 4: Deploy Frontend to Vercel (100% Free)

Vercel provides automated zero-config deployments for Vite/React applications with edge CDN caching and free HTTPS.

1. Log in to **[vercel.com](https://vercel.com/)** (Sign in with GitHub).
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
   ```
   https://tuckin.vercel.app
   ```

---

## 🛡️ Step 5: Lock Down CORS (Recommended Production Step)

Once your Vercel frontend is live, you can restrict CORS on Render so only your own frontend domain can communicate with the backend:

1. Go to your Render dashboard → **tuckin-api** → **Environment**.
2. Update `CORS_ORIGINS` from `*` to your exact Vercel domain:
   ```
   https://tuckin.vercel.app
   ```
3. Click **Save Changes**. Render will automatically apply the change in seconds.

---

## 🚂 Alternative: 1-Click Railway Deployment ($5/mo)

If you prefer an all-in-one platform without needing a separate keep-alive bot, Tuckin is also **100% pre-configured for Railway** via [`railway.toml`](railway.toml).

*(Note: Railway offers a free 30-day trial with $5 credit, after which it is $5/month).*

1. Log in to **[railway.com](https://railway.com/)** with GitHub.
2. Click **New Project** → **Deploy from GitHub repo** → select `tuckin`.
3. Railway reads [`railway.toml`](railway.toml) automatically and builds [`app/backend/Dockerfile`](app/backend/Dockerfile).
4. In the service **Variables** tab, add:
   - `CORS_ORIGINS`: `*` (or your Vercel URL)
   - `PORT`: `8000`
5. In **Settings** → **Networking** → Click **Generate Domain** (gives you `https://tuckin-production.up.railway.app`).
6. Paste that URL into your Vercel `VITE_API_BASE_URL`.

---

## 🧪 Production Verification Checklist

Run through this quick verification test on your live Vercel URL (`https://your-app.vercel.app`):

- [ ] **Initial Page Load**: Logo, tagline, Tuck mascot, and Squeeze Dial render crisply.
- [ ] **Reviews Wall (`#reviews`)**:
  - Shows top 6 comments and total comment count in numbers.
  - "View all X comments" button expands all comments.
  - "+ Leave note" successfully submits and stores a review into backend SQLite3.
- [ ] **Backend Health Check**:
  - The privacy sticker indicates active security status.
  - Dropping a video connects to the Render multi-threaded backend without cold start delay (thanks to UptimeRobot!).
- [ ] **Comparison Slider Preview**:
  - Squeezed video renders side-by-side with before/after wipe scrubber.
  - No `MEDIA_ERR_SRC_NOT_SUPPORTED` or CORS errors in DevTools console.
- [ ] **1-Click Download**:
  - Clicking **"Download video"** immediately downloads a valid, intact `.mp4` file that opens and plays cleanly in Windows Media Player, QuickTime, or VLC.
- [ ] **WASM Fallback**:
  - If backend is ever offline, Tuckin falls back to WebAssembly in the browser without crashing.

---

## 🆘 Troubleshooting & Common Gotchas

| Issue | Root Cause | Solution |
|---|---|---|
| `SharedArrayBuffer is not defined` | Missing COOP/COEP headers | Verify [`app/frontend/vercel.json`](app/frontend/vercel.json) is deployed in your Vercel project root. |
| `Cross-Origin Request Blocked` | `CORS_ORIGINS` mismatch | Check Render environment variables; set `CORS_ORIGINS=*` or match your exact Vercel URL. |
| Video preview blank or error | Missing CORP header | Ensure [`app/backend/main.py`](app/backend/main.py) has the `Cross-Origin-Resource-Policy: cross-origin` middleware (already pre-configured). |
| Docker build fails on Render | Missing files in context | Verify `app/backend/Dockerfile` copies `compressor.py`, `main.py`, and `db.py`. |
| Backend sleeps despite UptimeRobot | Wrong monitoring interval | Verify your monitor is set to **Every 10 minutes** (Render sleeps at 15 minutes). |
| Upload fails with 413 | Free tier upload payload limit | On Render free tier, files up to 100MB compress smoothly. For files >200MB, client-side WebAssembly handles them locally in-memory. |
