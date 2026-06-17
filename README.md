# Hatch Outbound Engine

AI-powered outbound email system built for Hatch — the sleep wellness company behind Restore 3, Hatch Baby, and Hatch Go.

**Goal:** 10+ positive replies per week at 0.5–1% reply rate.

## Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 14 + TypeScript + Tailwind |
| Database | Supabase (Postgres) + Prisma |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Enrichment | Apollo.io |
| Sending | Instantly or Lemlist |
| Deploy | Vercel |

## Local setup

```bash
# 1. Install
npm install

# 2. Copy env
cp .env.example .env.local
# Fill in your keys

# 3. Push DB schema
npx prisma generate
npx prisma db push

# 4. Run
npm run dev
```

## Build phases

| # | Commit | Status |
|---|---|---|
| 1 | Scaffold + DB schema | ✅ Done |
| 2 | Product brain (context upload + Claude extraction) | 🔜 |
| 3 | Prospect CSV upload | 🔜 |
| 4 | Apollo enrichment | 🔜 |
| 5 | AI sequence generator (single, then bulk) | 🔜 |
| 6 | A/B variants | 🔜 |
| 7 | Dynamic landing pages | 🔜 |
| 8 | Instantly export | 🔜 |
| 9 | Reply webhook + Claude classification | 🔜 |
| 10 | A/B scoring + winner promotion | 🔜 |
| 11 | Analytics dashboard | 🔜 |
| 12 | Apollo auto-pull cron | 🔜 |

## Buyer segments targeted

- **HR / Benefits leaders** — Hatch Restore as employee wellness perk
- **Pediatricians / OBGYNs** — Hatch Baby referral channel
- **Maternity registries** — Babylist, Buy Buy Baby partnerships
- **Hospitality procurement** — sleep-focused hotel room amenity
- **Sleep consultants / doulas** — trusted referrer channel
