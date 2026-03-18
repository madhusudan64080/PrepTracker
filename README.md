# PrepTrack — Study Tracker Application

A full-stack learning tracker with AI-generated content, spaced repetition, and progress tracking.

## Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Zustand, Socket.io-client
- **Backend**: Express.js, MongoDB (Mongoose), Redis (BullMQ), Socket.io
- **AI**: OpenRouter API (Gemini / GPT-4o-mini)
- **Deployment**: Vercel (frontend) + Render (backend)

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Redis Cloud) — optional but recommended

### Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in MONGO_URI, JWT secrets, OPENROUTER_API_KEY
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
```

---

## Deployment

### Backend → Render

1. Push to GitHub
2. Create new **Web Service** on Render
3. Connect your repo, set root directory to `backend/`
4. Build: `npm install && npm run build`
5. Start: `node dist/server.js`
6. Add environment variables from `backend/.env.example`

### Frontend → Vercel

1. Import repo in Vercel dashboard
2. Set root directory to `frontend/`
3. Add `NEXT_PUBLIC_API_URL` pointing to your Render URL
4. Add `NEXT_PUBLIC_WS_URL` (same URL)
5. Deploy

---

## Fixes Applied (v1.1)

| # | Issue | Fix |
|---|-------|-----|
| 1 | Auto-logout bug | Fixed `authStore` hydration — `isLoading` stays `true` until session is validated |
| 2 | IndexedDB cache miss | Fixed `keyPath` mismatch — per-method caching now works correctly |
| 3 | Learning method duplicate AI calls | `generateWithMethod` checks IndexedDB → server → AI in order; no duplicate calls |
| 4 | Today's Goals duplicates | `generatePendingTasks` now excludes `taskType:"pending"` to prevent pending-of-pending |
| 5 | Redis crash on startup | Server gracefully skips queue/reminders when Redis is unavailable |
| 6 | Unused `cacheKey` variable | Removed dead code in `content.service.ts` |
| 7 | LearningMethodModal state reset | Modal pre-selects current method on re-open; closes after selection |
| 8 | Performance | Added gzip compression middleware to Express |
| 9 | Delay notifications | New `SmartDelayMonitor` — in-app + browser alerts for overdue tasks |
| 10 | Security | Added `Permissions-Policy` header to Vercel config |

---

## New Feature: Smart Delay Notifications

When a scheduled topic is not completed on time, the system now:
- Checks for overdue tasks every 30 minutes (background interval)
- Shows an **in-app banner** at the top of the dashboard
- Shows a **browser notification** (if permission granted)
- Displays how many minutes/hours late the task is
- Provides a "reschedule" link

The system runs automatically when the user is logged in and stops on logout.
