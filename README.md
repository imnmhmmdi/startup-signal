# Startup Signal

Hiring intelligence for senior Product Managers — track French tech startups, funding events, and hiring signals.

## Product focus

**Company** is the primary entity. Every feature supports PM job discovery:

- **Overview** — hiring intelligence KPIs and top opportunities
- **Companies** — funded French tech startups ranked by PM fit
- **Funding** — recent funding events (hiring triggers)
- **Pipeline** — application workflow (New → Contacted → Applied → Interview → Offer)
- **Company profiles** — funding, hiring snapshot, scores, company briefs

## Stack

Next.js 16 · TypeScript · Tailwind · shadcn/ui · Supabase · Drizzle ORM · Vercel Cron · Anthropic SDK

## Database schema

Schema is managed with **Drizzle ORM**. Migration SQL lives in `drizzle/0000_init.sql`.

**Tables used by the app:**

| Table | Purpose |
|-------|---------|
| `companies` | Primary entity — funding, hiring, scores |
| `company_briefs` | LLM-generated company briefs |
| `saved_companies` | User pipeline / watchlist (status workflow) |
| `ingestion_runs` | Cron job run history |
| `raw_funding_items` | Raw RSS feed items before normalization |

Users are managed by **Supabase Auth** (`auth.users`). There are no separate `users`, `profiles`, `funding`, or `pipeline` tables — those are UI routes backed by the tables above.

## Setup

```bash
git clone https://github.com/imnmhmmdi/startup-signal.git
cd startup-signal
npm install
cp .env.example .env.local
# Set DATABASE_URL to your Supabase direct Postgres URL (port 5432)
npm run db:bootstrap   # applies migrations + seeds if empty
npm run dev
```

## Information architecture

```
/                 Overview — stats, top PM fit, hiring signals, recent funding
/companies        Company directory with filters
/companies/[id]   Company profile — brief, scores, application workflow
/funding          Funding events timeline
/pipeline         Application pipeline
/login            Auth
```

Legacy routes from the old idea-browser app redirect automatically (`/dashboard`, `/signal-hunter`, etc.).

## Deploy

Push to `main` on GitHub → Vercel auto-deploys.

**Required Vercel environment variables:**

- `DATABASE_URL` — Supabase **direct** Postgres connection string (port 5432)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `CRON_SECRET`
- `ANTHROPIC_API_KEY` (optional, for company briefs)

Migrations run automatically at server startup via `instrumentation.ts`. If the `companies` table is empty, seed data is loaded automatically (`SEED_ON_DEPLOY=true` by default).

Verify deployment: `GET /api/health` returns `"database": { "ready": true, "companyCount": 59 }`.
