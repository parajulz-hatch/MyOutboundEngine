import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXTRACTION_PROMPT = `You are a sales intelligence analyst. Extract a structured knowledge base from the product context below.

Return ONLY valid JSON with exactly this shape — no preamble, no markdown fences:

{
  "icp": {
    "titles": ["string"],
    "industries": ["string"],
    "companySizes": ["string"],
    "painPoints": ["string"],
    "goals": ["string"],
    "buyingTriggers": ["string"]
  },
  "valueProps": [
    { "title": "string", "description": "string", "metric": "string or null" }
  ],
  "objections": [
    { "objection": "string", "rebuttal": "string" }
  ],
  "proofPoints": [
    { "type": "stat|case_study|testimonial|award", "title": "string", "description": "string" }
  ],
  "segments": [
    { "name": "string", "description": "string", "product": "string", "okrs": ["string"] }
  ],
  "competitors": [
    { "name": "string", "weaknesses": ["string"], "ourAdvantage": "string" }
  ]
}

Rules:
- Extract ONLY what is stated or clearly implied — do not invent
- valueProps: 4–8 items, each grounded in a real feature or outcome
- objections: include every objection mentioned, with a sharp rebuttal
- segments: one entry per buyer type with their likely OKRs
- proofPoints: pull every stat, social proof, and credential mentioned
- Be specific — avoid vague marketing language`

export async function POST(req: NextRequest) {
  try {
    const { name, content } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\n---\n\nPRODUCT CONTEXT:\n${content}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let knowledgeBase: Record<string, unknown>
    try {
      knowledgeBase = JSON.parse(raw)
    } catch {
      // Try stripping markdown fences if Claude added them
      const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
      knowledgeBase = JSON.parse(cleaned)
    }

    // Persist to DB if Prisma is available
    if (prisma) {
      await (prisma as {
        productContext: {
          upsert: (args: unknown) => Promise<unknown>
        }
      }).productContext.upsert({
        where: { id: 'default' },
        update: {
          name,
          rawContent: content,
          icp: knowledgeBase.icp as object,
          valueProps: knowledgeBase.valueProps as object,
          objections: knowledgeBase.objections as object,
          proofPoints: knowledgeBase.proofPoints as object,
          segments: knowledgeBase.segments as object,
        },
        create: {
          id: 'default',
          name,
          rawContent: content,
          icp: knowledgeBase.icp as object,
          valueProps: knowledgeBase.valueProps as object,
          objections: knowledgeBase.objections as object,
          proofPoints: knowledgeBase.proofPoints as object,
          segments: knowledgeBase.segments as object,
        },
      })
    }

    return NextResponse.json({ knowledgeBase })
  } catch (e) {
    console.error('product-context error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to process context' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ context: null })

    const context = await (prisma as {
      productContext: { findUnique: (args: unknown) => Promise<unknown> }
    }).productContext.findUnique({ where: { id: 'default' } })

    return NextResponse.json({ context })
  } catch (e) {
    console.error('GET product-context error:', e)
    return NextResponse.json({ context: null })
  }
}
