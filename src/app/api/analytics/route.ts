import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  if (!prisma) {
    // Return zeroed-out stats when DB not connected
    return NextResponse.json({ stats: mockStats(), variants: [], recentReplies: [] })
  }

  try {
    const db = prisma as {
      prospect: { count: (a?: unknown) => Promise<number> }
      sentEmail: {
        count: (a?: unknown) => Promise<number>
        findMany: (a: unknown) => Promise<ReplyRecord[]>
      }
      emailVariant: { findMany: (a: unknown) => Promise<VariantRecord[]> }
    }

    const [total, enriched, enrolled, repliedPos, repliedNeg, meetingSet] = await Promise.all([
      db.prospect.count(),
      db.prospect.count({ where: { enriched: true } }),
      db.prospect.count({ where: { status: 'ENROLLED' } }),
      db.prospect.count({ where: { status: 'REPLIED_POSITIVE' } }),
      db.prospect.count({ where: { status: 'REPLIED_NEGATIVE' } }),
      db.prospect.count({ where: { status: 'MEETING_SET' } }),
    ])

    const [sent, opened, clicked, replied] = await Promise.all([
      db.sentEmail.count(),
      db.sentEmail.count({ where: { openedAt: { not: null } } }),
      db.sentEmail.count({ where: { clickedAt: { not: null } } }),
      db.sentEmail.count({ where: { repliedAt: { not: null } } }),
    ])

    const positiveReplies = repliedPos
    const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0
    const clickRate = sent > 0 ? Math.round((clicked / sent) * 100) : 0
    const replyRate = sent > 0 ? ((replied / sent) * 100).toFixed(2) : '0.00'
    const positiveReplyRate = sent > 0 ? ((positiveReplies / sent) * 100).toFixed(2) : '0.00'

    // Variant performance
    const variants = await db.emailVariant.findMany({
      where: { sentEmails: { some: {} } } as unknown as Record<string, unknown>,
      orderBy: { createdAt: 'desc' } as unknown as Record<string, unknown>,
      take: 20,
    })

    // Recent positive replies
    const recentReplies = await db.sentEmail.findMany({
      where: { replyType: 'POSITIVE' },
      orderBy: { repliedAt: 'desc' } as unknown as Record<string, unknown>,
      take: 10,
    })

    return NextResponse.json({
      stats: {
        total, enriched, enrolled,
        sent, opened, clicked, replied,
        positiveReplies, repliedNeg, meetingSet,
        openRate, clickRate, replyRate, positiveReplyRate,
        weeklyTarget: 10,
        weeklyProgress: positiveReplies,
      },
      variants,
      recentReplies,
    })
  } catch (e) {
    console.error('analytics error:', e)
    return NextResponse.json({ stats: mockStats(), variants: [], recentReplies: [] })
  }
}

function mockStats() {
  return {
    total: 0, enriched: 0, enrolled: 0,
    sent: 0, opened: 0, clicked: 0, replied: 0,
    positiveReplies: 0, repliedNeg: 0, meetingSet: 0,
    openRate: 0, clickRate: 0, replyRate: '0.00', positiveReplyRate: '0.00',
    weeklyTarget: 10, weeklyProgress: 0,
  }
}

interface ReplyRecord {
  id: string
  repliedAt: Date | null
  replyType: string | null
  replyText: string | null
}

interface VariantRecord {
  id: string
  variantLetter: string
  subject: string
  isWinner: boolean
}
