<p align="center">
  <img src="public/icon-256.png" width="96" alt="Family Planner icon" />
</p>

<h1 align="center">Family Planner</h1>

<p align="center">A private family planning app for scheduling, meals, training and body tracking.</p>

---

## What it does

Family Planner is a React/TypeScript web app built for a single family. Each family member has their own profile with features that can be individually enabled:

- **Schedule** — weekly calendar with per-person colour coding and event tags (school, gym, rest)
- **Training** — AI-generated weekly training plans with progressive overload, drag-and-drop reordering and gym split tracking
- **Meals** — AI meal suggestions aware of training days, macro targets and pantry contents
- **Pantry** — inventory management with barcode scanning, AI photo parsing and expiry tracking
- **Body tracking** — weight, measurements, body fat and progress photos with trend charts
- **Withings sync** — automatic weight sync from a Withings smart scale via OAuth

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| AI | Claude claude-haiku-4-5-20251001 (direct browser calls) |
| Auth | Google, Spotify (Supabase OAuth) |
| Deploy | Netlify (frontend), Supabase (edge functions) |
| CI | GitHub Actions (typecheck + build) |

## Local setup

### Prerequisites

- Node 24+
- A Supabase project
- A Withings developer app (optional, for scale sync)

### 1. Clone and install

```bash
git clone https://github.com/dimelords/family-plan.git
cd family-plan
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_WITHINGS_CLIENT_ID=your-withings-client-id   # optional
```

### 3. Run

```bash
npm run dev
```

## Supabase setup

Run the migrations in `supabase/migrations/` against your project, or apply them via the Supabase dashboard.

Deploy the edge functions:

```bash
supabase functions deploy withings-callback
supabase functions deploy withings-sync
```

Set the edge function secrets:

```bash
supabase secrets set WITHINGS_CLIENT_ID=your-id
supabase secrets set WITHINGS_CLIENT_SECRET=your-secret
```

## Withings integration

The Withings OAuth flow runs entirely server-side through two edge functions:

1. `withings-callback` — receives the OAuth redirect, exchanges the code for tokens, fetches the latest weight and stores it. Register `https://your-project.supabase.co/functions/v1/withings-callback` as the callback URL in your Withings developer app.
2. `withings-sync` — manual re-sync triggered from Settings, refreshes tokens automatically when near expiry.

## Deployment

Push to `main` — Netlify auto-deploys the frontend. Make sure these environment variables are set in Netlify:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_WITHINGS_CLIENT_ID
```

CI runs on every push via GitHub Actions (`.github/workflows/typecheck.yml`) and requires matching secrets set in the repository settings.
