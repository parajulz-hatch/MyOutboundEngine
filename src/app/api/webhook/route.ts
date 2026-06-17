import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── Types ─────────────────────────────────────────────────────────────────────

type ReplyType = 'POSITIVE' | 'NEGATIVE' | 'OUT_OF_OFFICE' | 'NEUTRAL'

interface WebhookEvent {
  type: 'email_opened' | 'email_clicked' | 'email_replied' | 'email_bounced' | 'email_sent'
  email?: string          // prospect email
  campaign_id?: string
  subsequence_id?: string
  step?: number
  timestamp?: string
  // Reply-specific
  reply_text?: string
  reply_subject?: string
  // Instantly-specific field names
  prospect_email?: string
  event_type?: string     // Instantly uses event_type instead of type
  // Lemlist-specific
  campaignId?: string
  leadEmail?: string
  text?: string
}

interface DB {
  prospect: {
    findFirst: (a: unknown) => Promise<ProspectRecord | null>
    update: (a: unknown) => Promise<unknown>
  }
  sentEmail: {
    findFirst: (a: unknown) => Promise<{ id: string } | null>
    update: (a: unknown) => Promise<unknown>
    create: (a: unknown) => Promise<unknown>
  }
  emailVariant: {
    update: (a: unknown) => Promise<unknown>
    findFirst: (a: unknown) => Promise<{ id: string } | null>
  }
}

interface ProspectRecord {
  id: string
  email: string
  firstName: string | null
  status: string
}

// ── Signature verification ─────────────────────────────────────────────────────

function verifyInstantlySignature(body: string, signature: string): boolean {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) return true // Skip verification if no secret set
  const expected = createHmac('sha256', secret).update(body).digest('hex')
  return expected === signature
}

// ── Reply classifier ───────────────────────────────────────────────────────────

async function classifyReply(replyText: string, prospectTitle?: string): Promise<{
  type: ReplyType
  summary: string
  sentiment: number // -1 to 1
}> {
  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback: simple keyword matching
    const lower = replyText.toLowerCase()
    if (/out of office|ooo|on vacation|away|maternity|paternity|leave/i.test(lower)) {
      return { type: 'OUT_OF_OFFICE', summary: 'Auto-detected OOO', sentiment: 0 }
    }
    if (/not interested|unsubscribe|remove|stop|don't|do not/i.test(lower)) {
      return { type: 'NEGATIVE', summary: 'Likely negative', sentiment: -0.8 }
    }
    if (/yes|sure|interested|tell me more|let's|chat|call|time|available|sounds good/i.test(lower)) {
      return { type: 'POSITIVE', summary: 'Likely positive', sentiment: 0.8 }
    }
    return { type: 'NEUTRAL', summary: 'Neutral reply', sentiment: 0 }
  }

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Classify this cold email reply for a Hatch sleep product outreach.
${prospectTitle ? `The prospect is a ${prospectTitle}.` : ''}

Reply text:
"""
${replyText.slice(0, 1000)}
"""

Return ONLY valid JSON:
{
  "type": "POSITIVE" | "NEGATIVE" | "OUT_OF_OFFICE" | "NEUTRAL",
  "summary": "one sentence summary of what they said",
  "sentiment": number between -1 (very negative) and 1 (very positive)
}

POSITIVE = wants to chat, asked a question, showed interest
NEGATIVE = not interested, unsubscribe, wrong person, rude
OUT_OF_OFFICE = auto-reply, vacation, leave, away message
NEUTRAL = vague, asked to follow up later, non-committal`
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'
  const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(cleaned)
}

// ── Event handlers ─────────────────────────────────────────────────────────────

async function handleReply(db: DB, email: string, replyText: string, replySubject?: string) {
  const prospect = await db.prospect.findFirst({ where: { email: email.toLowerCase() } })
  if (!prospect) return { status: 'prospect_not_found', email }

  // Classify the reply
  const classification = await classifyReply(replyText, prospect.firstName ?? undefined)

  // Update prospect status based on reply type
  const statusMap: Record<ReplyType, string> = {
    POSITIVE: 'REPLIED_POSITIVE',
    NEGATIVE: 'REPLIED_NEGATIVE',
    OUT_OF_OFFICE: prospect.status, // Keep current status for OOO
    NEUTRAL: 'ENROLLED',
  }

  await db.prospect.update({
    where: { id: prospect.id },
    data: { status: statusMap[classification.type] },
  })

  // Find the most recent sent email for this prospect and update it
  const sentEmail = await db.sentEmail.findFirst({
    where: { enrollment: { prospectId: prospect.id } } as unknown as Record<string, unknown>,
    orderBy: { createdAt: 'desc' } as unknown as Record<string, unknown>,
  })

  if (sentEmail) {
    await db.sentEmail.update({
      where: { id: sentEmail.id },
      data: {
        repliedAt: new Date(),
        replyType: classification.type,
        replyText: replyText.slice(0, 2000),
      },
    })

    // If positive, update variant win count
    if (classification.type === 'POSITIVE') {
      const sent = sentEmail as unknown as { variantId: string }
      await db.emailVariant.update({
        where: { id: sent.variantId },
        data: { isWinner: true },
      })
    }
  }

  return {
    status: 'processed',
    prospectId: prospect.id,
    replyType: classification.type,
    summary: classification.summary,
    sentiment: classification.sentiment,
  }
}

async function handleOpen(db: DB, email: string) {
  const sentEmail = await db.sentEmail.findFirst({
    where: {
      openedAt: null,
      enrollment: { prospect: { email: email.toLowerCase() } } as unknown as Record<string, unknown>,
    },
    orderBy: { createdAt: 'desc' } as unknown as Record<string, unknown>,
  })
  if (sentEmail) {
    await db.sentEmail.update({ where: { id: sentEmail.id }, data: { openedAt: new Date() } })
  }
  return { status: 'open_tracked', email }
}

async function handleClick(db: DB, email: string) {
  const sentEmail = await db.sentEmail.findFirst({
    where: {
      clickedAt: null,
      enrollment: { prospect: { email: email.toLowerCase() } } as unknown as Record<string, unknown>,
    },
    orderBy: { createdAt: 'desc' } as unknown as Record<string, unknown>,
  })
  if (sentEmail) {
    await db.sentEmail.update({ where: { id: sentEmail.id }, data: { clickedAt: new Date() } })
  }
  return { status: 'click_tracked', email }
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // Verify signature if present (Instantly sends X-Instantly-Signature)
    const sig = req.headers.get('x-instantly-signature') ?? ''
    if (sig && !verifyInstantlySignature(rawBody, sig)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: WebhookEvent = JSON.parse(rawBody)

    // Normalise field names across Instantly / Lemlist
    const eventType = event.type ?? event.event_type ?? ''
    const prospectEmail = (
      event.email ?? event.prospect_email ?? event.leadEmail ?? ''
    ).toLowerCase()
    const replyText = event.reply_text ?? event.text ?? ''

    if (!prospectEmail) {
      return NextResponse.json({ error: 'No prospect email in payload' }, { status: 400 })
    }

    if (!prisma) {
      // Simulate classification so webhook can be tested without DB
      if (eventType === 'email_replied' && replyText) {
        const classification = await classifyReply(replyText)
        return NextResponse.json({ status: 'no_db_simulated', classification })
      }
      return NextResponse.json({ status: 'no_db_acknowledged' })
    }

    const db = prisma as unknown as DB

    let result: Record<string, unknown> = { status: 'unhandled', eventType }

    switch (eventType) {
      case 'email_replied':
        result = await handleReply(db, prospectEmail, replyText, event.reply_subject)
        break
      case 'email_opened':
        result = await handleOpen(db, prospectEmail)
        break
      case 'email_clicked':
        result = await handleClick(db, prospectEmail)
        break
      case 'email_bounced':
        await db.prospect.update({
          where: { email: prospectEmail } as unknown as Record<string, unknown>,
          data: { status: 'UNSUBSCRIBED' },
        })
        result = { status: 'bounced_marked', email: prospectEmail }
        break
      case 'email_sent':
        result = { status: 'send_acknowledged', email: prospectEmail }
        break
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('webhook error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// GET — health check for webhook URL verification (Instantly pings it on setup)
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'hatch-outbound-webhook' })
}
