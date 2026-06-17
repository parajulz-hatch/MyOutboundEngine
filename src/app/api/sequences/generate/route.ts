import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface ProspectData {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  title?: string | null
  company?: string | null
  industry?: string | null
  companySize?: string | null
  seniority?: string | null
  inferredOkrs?: unknown
}

interface ProductContext {
  name: string
  icp?: unknown
  valueProps?: unknown
  proofPoints?: unknown
  objections?: unknown
  segments?: unknown
}

interface EmailVariantDraft {
  variantLetter: string
  subject: string
  bodyText: string
  cta: string
}

interface StepDraft {
  stepNumber: number
  stepType: 'INTRO' | 'VALUE' | 'PROOF' | 'BREAKUP'
  delayDays: number
  variants: EmailVariantDraft[]
}

function buildPrompt(prospect: ProspectData, product: ProductContext): string {
  const okrs = Array.isArray(prospect.inferredOkrs) ? prospect.inferredOkrs : []
  const valueProps = Array.isArray(product.valueProps) ? product.valueProps : []
  const proofPoints = Array.isArray(product.proofPoints) ? product.proofPoints : []
  const segments = Array.isArray(product.segments) ? product.segments : []

  const relevantSegment = segments.find((s: { name?: string }) =>
    s.name?.toLowerCase().includes(prospect.industry?.toLowerCase() ?? '') ||
    s.name?.toLowerCase().includes(prospect.title?.toLowerCase() ?? '')
  ) as { name?: string; description?: string } | undefined

  return `You are a world-class B2B sales copywriter writing cold email sequences for Hatch, a sleep wellness company.

PRODUCT CONTEXT:
${product.name}

Value propositions:
${valueProps.map((v: { title?: string; description?: string }) => `- ${v.title}: ${v.description}`).join('\n')}

Proof points:
${proofPoints.map((p: { title?: string; description?: string }) => `- ${p.title}: ${p.description}`).join('\n')}

${relevantSegment ? `Most relevant buyer segment: ${relevantSegment.name} — ${relevantSegment.description}` : ''}

PROSPECT:
- Name: ${prospect.firstName ?? 'there'}
- Title: ${prospect.title ?? 'Unknown'}
- Company: ${prospect.company ?? 'their company'}
- Industry: ${prospect.industry ?? 'Unknown'}
- Company size: ${prospect.companySize ?? 'Unknown'}
- Seniority: ${prospect.seniority ?? 'Unknown'}
- Their likely OKRs this year:
${okrs.map((o: string) => `  • ${o}`).join('\n')}

TASK: Write a 4-step cold email sequence. Each step needs 3 subject line variants (A/B/C).

SEQUENCE STRUCTURE:
- Step 1 (INTRO, day 0): Hook with their specific pain point. Reference their role/OKRs. Short, under 100 words. No pitch yet.
- Step 2 (VALUE, day 3): Connect Hatch directly to their top OKR with one concrete proof point. 100-150 words.
- Step 3 (PROOF, day 7): A short proof story — real customer outcome. 100-150 words. Include: {{LANDING_PAGE_URL}}
- Step 4 (BREAKUP, day 14): Lightweight breakup. Assume they're busy. Leave the door open. Under 80 words.

WRITING RULES:
- Write as a human, not a marketer. No buzzwords. No "I hope this finds you well."
- First line of every email must be about THEM, not Hatch.
- Always tie back to their OKRs — make it feel like you did your homework.
- CTAs must be low-friction: "worth a 15-min chat?" not "Schedule a demo"
- Subject lines: one punchy (under 6 words), one question, one pattern-interrupt
- Use their first name (${prospect.firstName ?? 'Hi'}) naturally once
- Sign off as "The Hatch team"

Return ONLY valid JSON, no preamble, no markdown fences:
{
  "steps": [
    {
      "stepNumber": 1,
      "stepType": "INTRO",
      "delayDays": 0,
      "variants": [
        { "variantLetter": "A", "subject": "string", "bodyText": "string", "cta": "string" },
        { "variantLetter": "B", "subject": "string", "bodyText": "string", "cta": "string" },
        { "variantLetter": "C", "subject": "string", "bodyText": "string", "cta": "string" }
      ]
    },
    { "stepNumber": 2, "stepType": "VALUE", "delayDays": 3, "variants": [...] },
    { "stepNumber": 3, "stepType": "PROOF", "delayDays": 7, "variants": [...] },
    { "stepNumber": 4, "stepType": "BREAKUP", "delayDays": 14, "variants": [...] }
  ]
}`
}

export async function POST(req: NextRequest) {
  try {
    const { prospectId, productContextId } = await req.json()
    if (!prospectId) return NextResponse.json({ error: 'prospectId required' }, { status: 400 })
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

    let prospect: ProspectData | null = null
    let product: ProductContext | null = null

    if (prisma) {
      const db = prisma as {
        prospect: { findUnique: (a: unknown) => Promise<ProspectData | null> }
        productContext: { findUnique: (a: unknown) => Promise<ProductContext | null> }
        sequence: { create: (a: unknown) => Promise<{ id: string }> }
        sequenceStep: { create: (a: unknown) => Promise<{ id: string }> }
        emailVariant: { createMany: (a: unknown) => Promise<unknown> }
      }
      prospect = await db.prospect.findUnique({ where: { id: prospectId } })
      product = await db.productContext.findUnique({ where: { id: productContextId ?? 'default' } })
    }

    if (!prospect) prospect = { id: prospectId, email: 'unknown@example.com' }
    if (!product) {
      product = {
        name: 'Hatch sleep wellness — Restore 3 ($169), Hatch Baby ($99), Hatch Go',
        valueProps: [
          { title: 'All-in-one sleep system', description: 'Light + sound + sunrise alarm + curated content in one device' },
          { title: 'Full family coverage', description: 'One brand from newborn (Hatch Baby) through adult (Restore 3)' },
          { title: 'Phone-free bedside', description: 'Removes the phone from bedtime — science-backed routines instead' },
        ],
        proofPoints: [
          { title: '500k+ families', description: 'Over half a million families sleep better with Hatch every night' },
          { title: '3,700+ five-star reviews', description: 'Customers praise the gentle sunrise wake-up and sound quality' },
          { title: 'Shark Tank alumni', description: 'Featured on Shark Tank in 2016, trusted brand for nearly a decade' },
        ],
        segments: [],
      }
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: buildPrompt(prospect, product) }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
    const generated: { steps: StepDraft[] } = JSON.parse(cleaned)

    let sequenceId: string | null = null

    if (prisma) {
      const db = prisma as {
        prospect: { findUnique: (a: unknown) => Promise<ProspectData | null> }
        productContext: { findUnique: (a: unknown) => Promise<ProductContext | null> }
        sequence: { create: (a: unknown) => Promise<{ id: string }> }
        sequenceStep: { create: (a: unknown) => Promise<{ id: string }> }
        emailVariant: { createMany: (a: unknown) => Promise<unknown> }
      }

      const seq = await db.sequence.create({
        data: {
          name: `${prospect.firstName ?? prospect.email} — ${prospect.company ?? 'Prospect'}`,
          productContextId: productContextId ?? 'default',
          status: 'DRAFT',
        },
      })
      sequenceId = seq.id

      for (const step of generated.steps) {
        const dbStep = await db.sequenceStep.create({
          data: { sequenceId: seq.id, stepNumber: step.stepNumber, stepType: step.stepType, delayDays: step.delayDays },
        })
        await db.emailVariant.createMany({
          data: step.variants.map((v) => ({
            stepId: dbStep.id,
            prospectId,
            variantLetter: v.variantLetter,
            subject: v.subject,
            bodyText: v.bodyText,
            bodyHtml: textToHtml(v.bodyText),
            cta: v.cta,
            bodyLength: bodyLength(v.bodyText),
          })),
        })
      }
    }

    return NextResponse.json({
      sequenceId,
      steps: generated.steps,
      prospect: {
        name: [prospect.firstName, prospect.lastName].filter(Boolean).join(' ') || prospect.email,
        title: prospect.title,
        company: prospect.company,
      },
    })
  } catch (e) {
    console.error('generate error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Generation failed' }, { status: 500 })
  }
}

function textToHtml(text: string): string {
  return text.split('\n\n').map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('\n')
}

function bodyLength(text: string): 'SHORT' | 'MEDIUM' | 'LONG' {
  const words = text.split(/\s+/).length
  if (words < 80) return 'SHORT'
  if (words < 150) return 'MEDIUM'
  return 'LONG'
}
