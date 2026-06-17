# 🌙 Hatch Outbound Engine

**Live app: [my-outbound-engine-omega.vercel.app](https://my-outbound-engine-omega.vercel.app)**

AI-powered outbound email system built for [Hatch](https://hatch.co) — the sleep wellness company behind Restore 3, Hatch Baby, and Hatch Go.

**Goal:** 10+ positive replies per week at 0.5–1% reply rate.

---

## What it does

1. **Learns your product** — paste your positioning, pitch deck, or any context. Claude extracts a structured knowledge base: ICP, value props, objections, proof points, and buyer segments.

2. **Ingests prospects** — upload a CSV of targets. Each row is enriched via Apollo.io (title, industry, company size, tech stack) and Claude infers their likely OKRs.

3. **Writes personalised sequences** — Claude writes a 4-step email sequence per prospect (Intro → Value → Proof → Breakup) with 3 A/B subject line variants per step, tied directly to their role and OKRs.

4. **Generates landing pages** — each prospect gets a personalised `/p/[slug]` page with a Claude-generated ROI section (e.g. "what better sleep could mean for Acme Corp's 420 employees").

5. **Exports to Instantly** — one-click download of campaign JSON ready to import into Instantly or Lemlist, with UTM-tracked landing page links embedded.

6. **Tracks replies** — webhook endpoint receives open/click/reply events. Every reply is classified by Claude (Positive / Negative / OOO / Neutral) and updates the prospect's status automatically.

7. **Live analytics** — funnel view from prospects → sent → replied → positive replies → meetings set, with weekly progress toward the 10 meetings/week target.

---

## Buyer segments targeted

| Segment | Product | Hook |
|---|---|---|
| HR / Benefits leaders (200–2000 person companies) | Hatch Restore 3 | Sleep deprivation costs US employers $411B/year |
| Pediatricians / OBGYNs / maternity practices | Hatch Baby | Recommended product for new parents |
| Baby registry platforms (Babylist, Buy Buy Baby) | Hatch Baby | Wholesale / partnership channel |
| Boutique hotels & wellness resorts | Hatch Restore 3 | Sleep-focused room amenity |
| Postpartum doulas & infant sleep consultants | Hatch Baby | Trusted referrer channel |

---

## Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Database | Supabase (PostgreSQL) + Prisma ORM v5 |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Enrichment | Apollo.io |
| Sending | Instantly or Lemlist |
| Deploy | Vercel |

---

## Local setup

```bash
# 1. Clone
git clone https://github.com/parajulz-hatch/MyOutboundEngine.git
cd MyOutboundEngine

# 2. Install (must use Prisma 5)
npm install prisma@5 @prisma/client@5 --save
npm install

# 3. Configure environment
cp .env.example .env
# Fill in your values (see below)

# 4. Push database schema
npx prisma db push

# 5. Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Connect → Transaction pooler URI (port 6543) |
| `DIRECT_URL` | Supabase → Connect → Session pooler URI (port 5432 or 6543) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API Keys → Publishable key |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `APOLLO_API_KEY` | [app.apollo.io](https://app.apollo.io) → Settings → Integrations → API |
| `INSTANTLY_API_KEY` | [app.instantly.ai](https://app.instantly.ai) → Settings → API Keys |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL |
| `WEBHOOK_SECRET` | Any random string |

> **Note:** The `#` character in passwords must be URL-encoded as `%23` in connection strings.

---

## Webhook setup (reply tracking)

1. Go to `/dashboard/analytics` → copy the webhook URL
2. In Instantly: Settings → Integrations → Webhooks → Add webhook
3. Enable: `email_opened`, `email_clicked`, `email_replied`, `email_bounced`

Every reply is automatically classified by Claude and updates the prospect's status in real time.

---

## Build history

| Phase | Description |
|---|---|
| 1 | Scaffold, DB schema (11 tables), dashboard shell |
| 2 | Product brain — context upload + Claude KB extraction |
| 3 | Prospect CSV upload — drag-drop, column mapper, preview |
| 4 | Apollo enrichment + Claude OKR inference per prospect |
| 5 | AI sequence generator — 4 steps, 3 A/B variants each |
| 6 | Instantly export — campaign JSON, UTM links, download |
| 7 | Reply webhook + Claude classifier + analytics dashboard |
| 8 | Personalised landing pages — ROI calculator, `/p/[slug]` |

---

## Deploying to Vercel

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables
4. Deploy

Auto-deploys on every push to `main`.

---

Built with Claude · Powered by Anthropic
