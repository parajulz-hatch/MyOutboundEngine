import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LandingPageClient } from './LandingPageClient'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ utm_source?: string; utm_medium?: string; utm_campaign?: string }>
}

interface DBLandingPage {
  slug: string
  prospectEmail: string
  headline: string
  subheadline: string | null
  painPoints: unknown
  demoContent: unknown
  ctaText: string
  ctaUrl: string
  visits: number
}

async function getPage(slug: string): Promise<DBLandingPage | null> {
  if (!prisma) return getDemoPage(slug)

  try {
    const db = prisma as {
      landingPage: {
        findUnique: (a: unknown) => Promise<DBLandingPage | null>
        update: (a: unknown) => Promise<unknown>
      }
    }
    const page = await db.landingPage.findUnique({ where: { slug } })
    if (!page) return null

    // Increment visit count (fire-and-forget)
    db.landingPage.update({ where: { slug }, data: { visits: { increment: 1 } } }).catch(() => {})

    return page
  } catch {
    return getDemoPage(slug)
  }
}

function getDemoPage(slug: string): DBLandingPage {
  return {
    slug,
    prospectEmail: 'demo@example.com',
    headline: "Better sleep for Acme Corp's team",
    subheadline: "Sleep deprivation costs your team ~$340k/year in lost productivity. Here's how Hatch fixes that.",
    painPoints: [
      { stat: '$3,156', label: 'lost per employee per year to poor sleep (Rand Corp)' },
      { stat: '2.7×', label: 'more likely to report low engagement when sleep-deprived' },
      { stat: '11 days', label: 'of productivity lost per employee annually' },
    ],
    demoContent: {
      roiSection: {
        title: "What better sleep could mean for Acme Corp",
        metrics: [
          { value: '$1.3M', label: 'annual productivity cost of poor sleep', basis: '420 employees × $3,156/yr' },
          { value: '286', label: 'employees likely to activate a Hatch device', basis: '68% activation rate in wellness programs' },
          { value: '$48k', label: 'total cost to outfit your whole team', basis: '286 devices × $169' },
        ],
      },
      productHighlight: {
        product: 'Hatch Restore 3',
        why: 'Designed for adults who need to wind down after high-pressure days — builds a phone-free sleep routine in 21 days.',
      },
      testimonialPull: '"I was skeptical, but after two weeks I stopped reaching for my phone before bed. I wake up actually rested." — VP of Engineering, SaaS company',
      calendarUrl: null,
    },
    ctaText: "Let's talk sleep",
    ctaUrl: 'mailto:hello@hatch.co?subject=Sleep%20conversation',
    visits: 0,
  }
}

export default async function LandingPage({ params }: PageProps) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()
  return <LandingPageClient page={page} />
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  return {
    title: 'Hatch — Better sleep starts here',
    description: 'A personalised look at how Hatch sleep products could help your team.',
    robots: 'noindex', // Don't index personalised pages
  }
}
