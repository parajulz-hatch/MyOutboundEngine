import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ── Instantly campaign format ─────────────────────────────────────────────────
// Docs: https://developer.instantly.ai/campaign

interface InstantlyStep {
  type: 'email'
  delay: number // days after previous step (0 = same day as previous, use sequence_delay for first)
  subject: string
  body: string
  variants?: Array<{ subject: string; body: string }>
}

interface InstantlyCampaign {
  name: string
  sequences: Array<{
    steps: InstantlyStep[]
  }>
  settings: {
    track_opens: boolean
    track_clicks: boolean
    stop_on_reply: boolean
    daily_limit: number
    email_gap_minutes: number
    timezone: string
  }
}

// ── DB types ──────────────────────────────────────────────────────────────────

interface DBVariant {
  variantLetter: string
  subject: string
  bodyText: string
  bodyHtml: string
  cta: string | null
}

interface DBStep {
  stepNumber: number
  stepType: string
  delayDays: number
  variants: DBVariant[]
}

interface DBSequence {
  id: string
  name: string
  steps: DBStep[]
}

interface DBEnrollment {
  id: string
  landingPageSlug: string | null
  prospect: {
    email: string
    firstName: string | null
    lastName: string | null
    company: string | null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

function landingPageUrl(slug: string, appUrl: string): string {
  return `${appUrl}/p/${slug}?utm_source=outbound&utm_medium=email&utm_campaign=hatch-outbound`
}

function injectLandingPage(body: string, url: string): string {
  return body.replace('{{LANDING_PAGE_URL}}', url)
}

function formatBodyForInstantly(text: string): string {
  // Instantly expects HTML-ish body with <br> line breaks
  return text
    .split('\n\n')
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { sequenceId, prospectIds } = await req.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-app.vercel.app'

    if (!prisma) {
      // Return mock export when DB not connected so UI flow is testable
      return NextResponse.json({
        campaigns: [buildMockCampaign(appUrl)],
        count: 1,
        mock: true,
      })
    }

    const db = prisma as {
      sequence: {
        findUnique: (a: unknown) => Promise<DBSequence | null>
        findMany: (a: unknown) => Promise<DBSequence[]>
      }
      enrollment: {
        findMany: (a: unknown) => Promise<DBEnrollment[]>
        upsert: (a: unknown) => Promise<DBEnrollment>
      }
      prospect: {
        findMany: (a: unknown) => Promise<Array<{
          id: string
          email: string
          firstName: string | null
          lastName: string | null
          company: string | null
        }>>
      }
    }

    // Fetch sequence(s)
    let sequences: DBSequence[] = []
    if (sequenceId) {
      const seq = await db.sequence.findUnique({
        where: { id: sequenceId },

        include: { steps: { include: { variants: true }, orderBy: { stepNumber: 'asc' } } },
      })
      if (seq) sequences = [seq]
    } else {
      sequences = await db.sequence.findMany({
        where: { status: 'DRAFT' },

        include: { steps: { include: { variants: true }, orderBy: { stepNumber: 'asc' } } },
        take: 50,
      })
    }

    if (sequences.length === 0) {
      return NextResponse.json({ error: 'No sequences found' }, { status: 404 })
    }

    // Build one Instantly campaign per sequence
    const campaigns: InstantlyCampaign[] = []

    for (const seq of sequences) {
      // Get or create enrollment to get landing page slug
      const prospectId = prospectIds?.[0]
      let slug = ''

      if (prospectId) {
        const enrollment = await db.enrollment.upsert({
          where: { id: `${seq.id}-${prospectId}` },
          update: {},
          create: {
            id: `${seq.id}-${prospectId}`,
            prospectId,
            sequenceId: seq.id,
            landingPageSlug: slugify(`hatch-${prospectId}-${Date.now()}`),
          },
  
          include: { prospect: true },
        })
        slug = enrollment.landingPageSlug ?? ''
      }

      const lpUrl = slug ? landingPageUrl(slug, appUrl) : `${appUrl}/p/your-slug`

      const steps: InstantlyStep[] = seq.steps.map((step, idx) => {
        // Primary variant is A; B and C become Instantly variants
        const variantA = step.variants.find((v) => v.variantLetter === 'A') ?? step.variants[0]
        const otherVariants = step.variants
          .filter((v) => v.variantLetter !== 'A')
          .map((v) => ({
            subject: v.subject,
            body: formatBodyForInstantly(injectLandingPage(v.bodyText, lpUrl)),
          }))

        return {
          type: 'email',
          // Instantly uses delay from previous step; first step delay = 0
          delay: idx === 0 ? 0 : step.delayDays - (seq.steps[idx - 1]?.delayDays ?? 0),
          subject: variantA.subject,
          body: formatBodyForInstantly(injectLandingPage(variantA.bodyText, lpUrl)),
          ...(otherVariants.length > 0 && { variants: otherVariants }),
        }
      })

      campaigns.push({
        name: seq.name,
        sequences: [{ steps }],
        settings: {
          track_opens: true,
          track_clicks: true,
          stop_on_reply: true,
          daily_limit: 40,
          email_gap_minutes: 10,
          timezone: 'America/New_York',
        },
      })
    }

    return NextResponse.json({ campaigns, count: campaigns.length })
  } catch (e) {
    console.error('export error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Export failed' },
      { status: 500 }
    )
  }
}

function buildMockCampaign(appUrl: string): InstantlyCampaign {
  const lpUrl = `${appUrl}/p/demo-prospect?utm_source=outbound&utm_medium=email`
  return {
    name: 'Hatch — Sample sequence (Sarah Chen, VP People @ Acme)',
    sequences: [{
      steps: [
        {
          type: 'email',
          delay: 0,
          subject: 'the $411B problem on your desk',
          body: formatBodyForInstantly(
            `Sarah,\n\nVP of People at a 400-person company means sleep deprivation is quietly costing you ~$340k/year in lost productivity — and it's invisible on any dashboard.\n\nWorth a 15-min chat?`
          ),
          variants: [
            { subject: 'quick question about your benefits stack', body: '<p>Most HR leaders I talk to have a robust wellness program — and still can\'t crack burnout. Curious if sleep is on your radar.</p><p>Worth a quick chat?</p>' },
            { subject: 'your employees\' worst habit', body: '<p>Sarah — the average employee checks their phone 96 times a day. 47% of those happen in the hour before bed. That\'s not a wellness problem. It\'s a sleep problem.</p><p>15 min to talk through it?</p>' },
          ],
        },
        {
          type: 'email',
          delay: 3,
          subject: 'what Hatch does for HR teams',
          body: formatBodyForInstantly(
            `Sarah,\n\nYou're trying to hit retention and benefits satisfaction goals. Sleep deprivation makes both harder — employees who sleep poorly are 2.7x more likely to report low engagement.\n\nHatch Restore is a $169 bedside device that builds a phone-free sleep routine. We've helped 500k+ families sleep better. Companies like yours are adding it to wellness stipends.\n\nWorth exploring?`
          ),
        },
        {
          type: 'email',
          delay: 4,
          subject: 'what this looked like for one HR team',
          body: formatBodyForInstantly(
            `Sarah,\n\nOne benefits director added Hatch Restore to their $200 annual wellness stipend last year. 68% of employees activated it within 30 days.\n\nI put together a quick page that shows what this might look like for Acme — ${lpUrl}\n\nHappy to walk through it.`
          ),
        },
        {
          type: 'email',
          delay: 7,
          subject: 'closing the loop',
          body: formatBodyForInstantly(
            `Sarah,\n\nNo worries if the timing isn't right. I'll leave you with this: if sleep ever becomes a priority for Acme's wellness program, we're at hatch.co.\n\nHope the rest of Q2 treats you well.`
          ),
        },
      ],
    }],
    settings: {
      track_opens: true,
      track_clicks: true,
      stop_on_reply: true,
      daily_limit: 40,
      email_gap_minutes: 10,
      timezone: 'America/New_York',
    },
  }
}

