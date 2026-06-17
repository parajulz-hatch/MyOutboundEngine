import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Apollo person lookup ───────────────────────────────────────────────────────
async function lookupApollo(email: string): Promise<ApolloData | null> {
  const apiKey = process.env.APOLLO_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        email,
        reveal_personal_emails: false,
        reveal_phone_number: false,
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    const person = data.person
    if (!person) return null

    return {
      firstName: person.first_name,
      lastName: person.last_name,
      title: person.title,
      seniority: person.seniority,
      linkedinUrl: person.linkedin_url,
      company: person.organization?.name,
      industry: person.organization?.industry,
      companySize: employeeRangeLabel(person.organization?.estimated_num_employees),
      techStack: (person.organization?.current_technologies ?? [])
        .slice(0, 8)
        .map((t: { name: string }) => t.name),
      recentNews: (person.organization?.latest_funding_round_date
        ? [`Recent funding: ${person.organization.latest_funding_round_date}`]
        : []),
      apolloId: person.id,
    }
  } catch {
    return null
  }
}

function employeeRangeLabel(n?: number): string {
  if (!n) return ''
  if (n < 10) return '1–10'
  if (n < 50) return '10–50'
  if (n < 200) return '50–200'
  if (n < 500) return '200–500'
  if (n < 1000) return '500–1000'
  if (n < 5000) return '1000–5000'
  return '5000+'
}

interface ApolloData {
  firstName?: string
  lastName?: string
  title?: string
  seniority?: string
  linkedinUrl?: string
  company?: string
  industry?: string
  companySize?: string
  techStack?: string[]
  recentNews?: string[]
  apolloId?: string
}

// ── OKR inference via Claude ───────────────────────────────────────────────────
async function inferOKRs(prospect: {
  firstName?: string
  title?: string
  company?: string
  industry?: string
  companySize?: string
  seniority?: string
}): Promise<string[]> {
  const prompt = `You are a B2B sales researcher. Based on this person's role, infer their top 3–5 professional OKRs (Objectives and Key Results) for this year.

Person:
- Name: ${prospect.firstName ?? 'Unknown'}
- Title: ${prospect.title ?? 'Unknown'}
- Company industry: ${prospect.industry ?? 'Unknown'}
- Company size: ${prospect.companySize ?? 'Unknown'}
- Seniority: ${prospect.seniority ?? 'Unknown'}

Context: We sell Hatch sleep wellness products (Hatch Restore for adults, Hatch Baby for new parents). We're reaching out because sleep deprivation directly impacts the outcomes this person is responsible for.

Return ONLY a JSON array of 3–5 short OKR strings (no preamble, no markdown). Each OKR should be specific to their role and actionable. Example format:
["Reduce employee burnout and absenteeism by 20%", "Improve benefits NPS score", "Launch 3 new wellness initiatives this year"]`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]'
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return []
  }
}

// ── Route handlers ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { prospectIds }: { prospectIds?: string[] } = await req.json()

    if (!prisma) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 })
    }

    const db = prisma as {
      prospect: {
        findMany: (a: unknown) => Promise<ProspectRecord[]>
        update: (a: unknown) => Promise<unknown>
      }
    }

    // Find prospects to enrich
    const toEnrich = await db.prospect.findMany({
      where: prospectIds?.length
        ? { id: { in: prospectIds } }
        : { enriched: false, status: 'PENDING' },
      take: 25, // Process in batches of 25
    })

    if (toEnrich.length === 0) {
      return NextResponse.json({ enriched: 0, message: 'No prospects to enrich' })
    }

    const results = { enriched: 0, failed: 0, total: toEnrich.length }

    for (const prospect of toEnrich) {
      try {
        // Mark as enriching
        await db.prospect.update({
          where: { id: prospect.id },
          data: { status: 'ENRICHING' },
        })

        // Try Apollo first
        const apollo = await lookupApollo(prospect.email)

        // Infer OKRs using Claude regardless of Apollo result
        const enrichedData = {
          firstName: apollo?.firstName ?? prospect.firstName ?? undefined,
          title: apollo?.title ?? prospect.title ?? undefined,
          company: apollo?.company ?? prospect.company ?? undefined,
          industry: apollo?.industry,
          companySize: apollo?.companySize,
          seniority: apollo?.seniority,
        }

        const okrs = await inferOKRs(enrichedData)

        // Save enriched data
        await db.prospect.update({
          where: { id: prospect.id },
          data: {
            ...(apollo?.firstName && { firstName: apollo.firstName }),
            ...(apollo?.lastName && { lastName: apollo.lastName }),
            ...(apollo?.title && { title: apollo.title }),
            ...(apollo?.seniority && { seniority: apollo.seniority }),
            ...(apollo?.linkedinUrl && { linkedinUrl: apollo.linkedinUrl }),
            ...(apollo?.company && { company: apollo.company }),
            ...(apollo?.industry && { industry: apollo.industry }),
            ...(apollo?.companySize && { companySize: apollo.companySize }),
            ...(apollo?.techStack && { techStack: apollo.techStack }),
            ...(apollo?.recentNews && { recentNews: apollo.recentNews }),
            ...(apollo?.apolloId && { apolloId: apollo.apolloId }),
            inferredOkrs: okrs,
            enriched: true,
            enrichedAt: new Date(),
            status: 'READY',
          },
        })

        results.enriched++
      } catch (e) {
        console.error(`Failed to enrich ${prospect.email}:`, e)
        await db.prospect.update({
          where: { id: prospect.id },
          data: { status: 'PENDING' },
        })
        results.failed++
      }
    }

    return NextResponse.json(results)
  } catch (e) {
    console.error('enrich error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Enrichment failed' },
      { status: 500 }
    )
  }
}

interface ProspectRecord {
  id: string
  email: string
  firstName?: string | null
  title?: string | null
  company?: string | null
  status: string
}
