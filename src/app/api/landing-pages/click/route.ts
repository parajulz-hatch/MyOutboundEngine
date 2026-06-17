import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const slug = new URL(req.url).searchParams.get('slug')
  if (!slug || !prisma) return NextResponse.json({ ok: true })

  try {
    const db = prisma as { landingPage: { update: (a: unknown) => Promise<unknown> } }
    await db.landingPage.update({ where: { slug }, data: { ctaClicks: { increment: 1 } } })
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true })
}
