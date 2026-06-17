import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a B2B sales intelligence expert. Given raw product/company context, extract a structured knowledge base that a sales AI will use to write highly personalized outbound emails.

Return ONLY valid JSON — no markdown, no backticks, no explanation. The JSON must match this exact shape:

{
  "icp": {
    "titles": ["array of job titles that buy this"],
    "industries": ["array of target industries"],
    "companySizes": ["e.g. 50-500 employees", "Enterprise 1000+"],
    "painPoints": ["specific pains this product solves"],
    "goals": ["what buyers are trying to achieve"],
    "buyingTriggers": ["events that make someone buy now"]
  },
  "valueProps": [
    { "title": "short value prop name", "description": "1-2 sentence explanation", "metric": "quantified impact if available" }
  ],
  "objections": [
    { "objection": "exact objection they raise", "rebuttal": "sharp, specific rebuttal" }
  ],
  "proofPoints": [
    { "type": "stat|case_study|testimonial|award", "title": "short title", "description": "detail", "metric": "number if applicable" }
  ],
  "segments": [
    {
      "name": "segment name e.g. HR Benefits Leaders",
      "titles": ["VP People", "Chief People Officer"],
      "painPoints": ["pain specific to this segment"],
      "hook": "one sentence opening hook tailored to this segment"
    }
  ],
  "competitors": [
    { "name": "competitor name", "weakness": "their main weakness", "ourEdge": "our advantage vs them" }
  ]
}`

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
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Extract the knowledge base from this product context:\n\n${content}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let kb
    try {
      kb = JSON.parse(raw)
    } catch {
      // Try to extract JSON if Claude wrapped it
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        kb = JSON.parse(match[0])
      } else {
        throw new Error('Claude returned invalid JSON')
      }
    }

    return NextResponse.json({ name, rawContent: content, kb })
  } catch (e) {
    console.error('Extract error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Extraction failed' },
      { status: 500 }
    )
  }
}
