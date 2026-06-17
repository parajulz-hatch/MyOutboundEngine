import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ProspectInput {
  email: string
  firstName?: string
  lastName?: string
  title?: string
  company?: string
  linkedinUrl?: string
}

export async function POST(req: NextRequest) {
  try {
    const { prospects }: { prospects: ProspectInput[] } = await req.json()

    if (!prospects?.length) {
      return NextResponse.json({ error: 'No prospects provided' }, { status: 400 })
    }

    // Deduplicate by email within the upload
    const seen = new Set<string>()
    const unique = prospects.filter((p) => {
      const key = p.email.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    if (!prisma) {
      // DB not connected — return mock success so UI flow works
      return NextResponse.json({
        saved: unique.length,
        skipped: 0,
        message: 'DB not connected — configure DATABASE_URL to persist',
      })
    }

    // Upsert each prospect (update if email already exists)
    let saved = 0
    let skipped = 0

    for (const p of unique) {
      try {
        await (prisma as {
          prospect: {
            upsert: (args: unknown) => Promise<unknown>
          }
        }).prospect.upsert({
          where: { email: p.email.toLowerCase().trim() },
          update: {
            firstName: p.firstName ?? undefined,
            lastName: p.lastName ?? undefined,
            title: p.title ?? undefined,
            company: p.company ?? undefined,
            linkedinUrl: p.linkedinUrl ?? undefined,
          },
          create: {
            email: p.email.toLowerCase().trim(),
            firstName: p.firstName ?? undefined,
            lastName: p.lastName ?? undefined,
            title: p.title ?? undefined,
            company: p.company ?? undefined,
            linkedinUrl: p.linkedinUrl ?? undefined,
            status: 'PENDING',
          },
        })
        saved++
      } catch {
        skipped++
      }
    }

    return NextResponse.json({ saved, skipped })
  } catch (e) {
    console.error('prospects POST error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to save prospects' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ prospects: [], total: 0 })

    const prospects = await (prisma as {
      prospect: {
        findMany: (args: unknown) => Promise<unknown[]>
        count: () => Promise<number>
      }
    }).prospect.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const total = await (prisma as {
      prospect: { count: () => Promise<number> }
    }).prospect.count()

    return NextResponse.json({ prospects, total })
  } catch (e) {
    console.error('prospects GET error:', e)
    return NextResponse.json({ prospects: [], total: 0 })
  }
}
