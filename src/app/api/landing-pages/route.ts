import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface ProspectRecord {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  title: string | null
  company: string | null
  industry: string | null
  companySize: string | null
  seniority: string | null
  inferredOkrs: unknown
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
}

async function generatePageContent(prospect: ProspectRecord): Promise<LandingPageContent> {
  const okrs = Array.isArray(prospect.inferredOkrs) ? prospect.inferredOkrs as string[] : []
  const firstName = prospect.firstName ?? 'there'
  const company = prospect.company ?? 'your company'
  const title = prospect.title ?? 'your role'

  // Parse company size for ROI calculation
  const sizeStr = prospect.companySize ?? '200'
  const sizeNum = parseInt(sizeStr.replace(/[^0-9]/g, '')) || 200

  if (!process.env.ANTHROPIC_API_KEY) {
    return buildFallbackContent(prospect, sizeNum)
  }

  const prompt = `You are writing a personalised landing page for a cold outreach campaign for Hatch sleep products.

PROSPECT:
- First name: ${firstName}
- Title: ${title}
- Company: ${company}
- Industry: ${prospect.industry ?? 'technology'}
- Company size: ~${sizeNum} employees
- Their OKRs: ${okrs.slice(0, 3).join(', ') || 'improve team performance and wellbeing'}

HATCH PRODUCTS:
- Hatch Restore 3 ($169.99): Adult smart sleep clock — sunrise alarm, sound machine, wind-down routines, phone-free controls
- Hatch Baby ($99.99): Baby sleep device + 6 months expert coaching
- Hatch+: Subscription for premium content ($4.99/mo)
- 500k+ families. Shark Tank alumni. 3,700+ five-star reviews.

TASK: Write landing page content that feels like it was made specifically for ${firstName} at ${company}.

Return ONLY valid JSON:
{
  "headline": "string — personalised headline mentioning their company or role (max 12 words)",
  "subheadline": "string — one sentence connecting sleep to their specific OKR (max 20 words)",
  "painPoints": [
    { "stat": "string — a real or plausible stat", "label": "string — what it means for them" }
  ],
  "roiSection": {
    "title": "string — e.g. 'What better sleep could mean for ${company}'",
    "metrics": [
      { "value": "string — e.g. '$340k'", "label": "string — what it represents", "basis": "string — how we calculated it" }
    ]
  },
  "productHighlight": {
    "product": "Hatch Restore 3 or Hatch Baby — pick the most relevant one",
    "why": "string — one sentence why THIS product for THIS person"
  },
  "testimonialPull": "string — a real-feeling testimonial from a similar role/industry (can be illustrative)",
  "ctaText": "string — CTA button text, low friction",
  "ctaSubtext": "string — one line under the CTA reducing friction"
}

Rules:
- painPoints: exactly 3 items, each with a real-ish stat specific to their industry
- roiSection metrics: exactly 3 numbers, calculated from ~${sizeNum} employees
- Make everything feel earned and specific — not generic wellness copy
- The ROI numbers should use the $411B/year sleep deprivation cost as a base (that's ~$3,156 per US employee/year in lost productivity)`

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(cleaned)
}

function buildFallbackContent(prospect: ProspectRecord, employees: number): LandingPageContent {
  const company = prospect.company ?? 'your company'
  const annualCost = Math.round(employees * 3156 / 1000) * 1000
  return {
    headline: `Better sleep for ${company}'s team`,
    subheadline: 'Sleep deprivation costs US employers $411B/year. Here\'s what that means for you.',
    painPoints: [
      { stat: '$3,156', label: 'lost per employee per year to poor sleep (Rand Corp)' },
      { stat: '2.7×', label: 'more likely to report low engagement when sleep-deprived' },
      { stat: '11 days', label: 'of productivity lost per employee annually to poor sleep' },
    ],
    roiSection: {
      title: `What better sleep could mean for ${company}`,
      metrics: [
        { value: `$${(annualCost / 1000).toFixed(0)}k`, label: 'annual productivity cost of poor sleep', basis: `${employees} employees × $3,156/yr` },
        { value: `${Math.round(employees * 0.68)}`, label: 'employees likely to activate a Hatch device', basis: '68% activation rate in wellness programs' },
        { value: `$${Math.round(employees * 169 * 0.68 / 1000)}k`, label: 'total cost to outfit your whole team', basis: `${Math.round(employees * 0.68)} devices × $169` },
      ],
    },
    productHighlight: {
      product: 'Hatch Restore 3',
      why: 'Designed for adults who need to wind down after high-pressure days — builds a phone-free sleep routine in 21 days.',
    },
    testimonialPull: '"I was skeptical, but after two weeks I stopped reaching for my phone before bed. I wake up actually rested." — VP of Engineering, SaaS company',
    ctaText: 'Let\'s talk sleep',
    ctaSubtext: '15 minutes. No pitch deck.',
  }
}

interface PainPoint { stat: string; label: string }
interface ROIMetric { value: string; label: string; basis: string }
interface LandingPageContent {
  headline: string
  subheadline: string
  painPoints: PainPoint[]
  roiSection: { title: string; metrics: ROIMetric[] }
  productHighlight: { product: string; why: string }
  testimonialPull: string
  ctaText: string
  ctaSubtext: string
}

export async function POST(req: NextRequest) {
  try {
    const { prospectId, calendarUrl } = await req.json()
    if (!prospectId) return NextResponse.json({ error: 'prospectId required' }, { status: 400 })

    let prospect: ProspectRecord | null = null

    if (prisma) {
      const db = prisma as { prospect: { findUnique: (a: unknown) => Promise<ProspectRecord | null> } }
      prospect = await db.prospect.findUnique({ where: { id: prospectId } })
    }

    if (!prospect) {
      // Demo mode — generate with placeholder data
      prospect = {
        id: prospectId,
        email: 'demo@example.com',
        firstName: 'Sarah',
        lastName: 'Chen',
        title: 'VP of People',
        company: 'Acme Corp',
        industry: 'Technology',
        companySize: '420',
        seniority: 'vp',
        inferredOkrs: ['Reduce employee burnout by 20%', 'Improve benefits NPS', 'Launch 3 wellness initiatives'],
      }
    }

    const content = await generatePageContent(prospect)
    const slug = slugify(`hatch-${prospect.firstName ?? 'prospect'}-${prospect.company ?? 'co'}-${Date.now().toString(36)}`)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-app.vercel.app'
    const pageUrl = `${appUrl}/p/${slug}`

    if (prisma) {
      const db = prisma as {
        landingPage: { create: (a: unknown) => Promise<unknown> }
        enrollment: { updateMany: (a: unknown) => Promise<unknown> }
      }
      await db.landingPage.create({
        data: {
          slug,
          prospectEmail: prospect.email,
          headline: content.headline,
          subheadline: content.subheadline,
          painPoints: content.painPoints,
          demoContent: {
            roiSection: content.roiSection,
            productHighlight: content.productHighlight,
            testimonialPull: content.testimonialPull,
            calendarUrl: calendarUrl ?? null,
          },
          ctaText: content.ctaText,
          ctaUrl: calendarUrl ?? `mailto:hello@hatch.co?subject=Sleep conversation`,
        },
      })
      await db.enrollment.updateMany({
        where: { prospectId: prospect.id },
        data: { landingPageSlug: slug },
      })
    }

    return NextResponse.json({ slug, pageUrl, content })
  } catch (e) {
    console.error('landing page error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to generate' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
  if (!prisma) return NextResponse.json({ page: null })

  try {
    const db = prisma as { landingPage: { findUnique: (a: unknown) => Promise<unknown> } }
    const page = await db.landingPage.findUnique({ where: { slug } })
    return NextResponse.json({ page })
  } catch (e) {
    return NextResponse.json({ page: null })
  }
}
