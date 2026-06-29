# Startup Signal

Discover European AI startups that recently raised funding and are likely to hire Product Managers.

Built for experienced PMs who want to decide where to apply next — not a generic startup directory.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind + shadcn/ui
- **Supabase** Postgres + Auth
- **Drizzle ORM**
- **Anthropic SDK** for LLM company briefs
- **Vercel Cron** for daily background jobs

## Features

- **Dashboard** — sortable table with AI Hiring Score and PM Fit Score
- **Filters** — country, funding round, AI category, score thresholds
- **Company profiles** — funding summary, hiring snapshot, score breakdown, AI career brief
- **Saved companies** — notes and application status tracking
- **Daily jobs** — RSS ingestion from Sifted, Tech.eu, EU-Startups, Crunchbase News

## Setup

### 1. Clone and install

```bash
git clone https://github.com/imnmhmmdi/startup-signal.git
cd startup-signal
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:
- `DATABASE_URL` — Supabase Postgres connection string
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` — optional, fallback briefs used without it
- `CRON_SECRET` — for Vercel cron authentication

### 3. Run database migration

Apply the SQL migration in Supabase SQL Editor or via Drizzle:

```bash
npm run db:push
```

Or paste `drizzle/0000_init.sql` into the Supabase SQL editor.

### 4. Seed data

```bash
npm run seed
```

Loads 55+ European AI startups with funding data from the last 6 months.

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Daily Jobs (Vercel Cron)

| Job | Schedule | Route |
|-----|----------|-------|
| Ingest funding news | 06:00 UTC | `/api/cron/ingest-funding-news` |
| Enrich company data | 07:00 UTC | `/api/cron/enrich-company-data` |
| Refresh hiring data | 08:00 UTC | `/api/cron/refresh-hiring-data` |
| Compute scores | 09:00 UTC | `/api/cron/compute-scores` |
| Generate briefs | 10:00 UTC | `/api/cron/generate-company-briefs` |

Trigger manually in development:

```bash
curl http://localhost:3000/api/cron/ingest-funding-news
curl http://localhost:3000/api/cron/compute-scores
```

## Scoring

Edit weights in `src/config/scoring.ts`:

- **AI Hiring Score** (0–100): funding recency, amount, open roles, AI focus, category bonus
- **PM Fit Score** (0–100): personalized for Iman — senior PM roles, B2B SaaS, healthcare AI, agentic AI, etc.

## Architecture

```
src/
├── config/          # Scoring weights, PM profile
├── db/              # Drizzle schema + client
├── lib/
│   ├── ingestion/   # Source-agnostic adapters (Sifted, Tech.eu, etc.)
│   ├── scoring/     # AI Hiring + PM Fit score computation
│   ├── llm/         # Anthropic company brief generation
│   └── queries/     # Dashboard query layer
├── app/
│   ├── page.tsx     # Dashboard
│   ├── companies/   # Company profile
│   ├── saved/       # Saved companies
│   └── api/cron/    # Background jobs
└── components/      # UI components
```

## Deploy to Vercel

1. Push to GitHub (`startup-signal`)
2. Import in Vercel as project `startup-signal`
3. Set environment variables
4. Cron jobs activate automatically via `vercel.json`
