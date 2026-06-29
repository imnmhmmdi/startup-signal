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

## Setup

```bash
git clone https://github.com/imnmhmmdi/startup-signal.git
cd startup-signal
npm install
cp .env.example .env.local
npm run db:push   # or run drizzle/0000_init.sql in Supabase
npm run seed
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

Push to `main` on GitHub → Vercel auto-deploys. Set env vars in Vercel dashboard. Promote latest deployment to production if needed.
