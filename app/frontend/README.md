# Tuckin — Frontend

> **Same video. Way less weight.**  
> Built with Vite, React 18, TypeScript, and self-hosted fonts. Neo-brutalist "The Squeeze" design system on warm paper.

---

## 🏃 Features

- **Direct-to-Backend Uploads**: Streams files directly to the FastAPI/FFmpeg backend using `XMLHttpRequest` for honest 0–100% upload progress (bypasses Vercel free-tier body limits).
- **Real-Time SSE Progress**: Subscribes to Server-Sent Events (`/api/stream/{job_id}`) to update frame cells on the film-strip and adjust Tuck's treadmill pace.
- **Squeeze Dial**: Accessible 3-stop compression intensity control (Light jog / Gym regular / Marathon) mapped directly to backend quality & bitrate modes.
- **Tuck Mascot & Retro TV**: Inline SVG and CSS animations driven by `--progress` with fallback slots for custom WebM/MP4 loops in `/public/mascot/`.
- **Spot the Difference Comparison**: Draggable, accessible before/after video wipe slider comparing original and compressed files.
- **Honest Reviews & Funky Name Generator**: Pure `crypto.getRandomValues` pseudonym generator, 5-face Tuck rating system, bot honeypot, and cursor-paginated review wall.
- **Ultra-lightweight**: **~62 KB gzipped JavaScript** (target was < 150 KB). Zero external runtime UI kits or tracking scripts.

---

## 🛠️ Local Development

### 1. Prerequisites
- Node.js 18+ and npm
- Tuckin FastAPI backend running locally (default: `http://localhost:8000`)

### 2. Install & Start
```bash
# Navigate to the frontend folder
cd app/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

App runs on `http://localhost:5173`.

---

## 🧪 Tests

Run the focused Vitest test suite (state machine, funky names, reviews API):
```bash
npm test
```

---

## ⚙️ Environment Variables

Create a `.env` file or set in Vercel:

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the deployed FastAPI backend | `http://localhost:8000` |

See `.env.example` for reference.

---

## 🚀 Deploying to Vercel (Free Tier)

1. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
   - Select your GitHub repository.
   - Set **Root Directory** to: `app/frontend`.
2. **Build Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables**:
   - Add `VITE_API_BASE_URL` with your live Railway backend URL:  
     `https://your-backend-production.up.railway.app`
4. **Deploy**:
   - Click **Deploy**. Vercel will build and serve your static single-page app globally with instant edge caching.

---

## ⚠️ Important Backend CORS Requirement

When deploying to Vercel:
1. Note your Vercel deployment URL (e.g. `https://tuckin.vercel.app`).
2. In your Railway dashboard for the backend service, set the environment variable:
   ```env
   CORS_ORIGINS=https://tuckin.vercel.app
   ```
   *(By default the backend allows `*`, but setting your explicit Vercel domain in production is recommended for security).*
