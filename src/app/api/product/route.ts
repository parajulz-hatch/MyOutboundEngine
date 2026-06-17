import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/product — save extracted knowledge base
export async function POST(req: NextRequest) {
  try {
    const { name, rawContent, kb } = await req.json()

    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured. Run: npx prisma generate && npx prisma db push' }, { status: 503 })
    }

    const record = await (prisma as any).productContext.upsert({
      where: { id: 'default' },
      update: {
        name,
        rawContent,
        icp: kb.icp,
        valueProps: kb.valueProps,
        objections: kb.objections,
        proofPoints: kb.proofPoints,
        segments: kb.segments,
      },
      create: {
        id: 'default',
        name,
        rawContent,
        icp: kb.icp,
        valueProps: kb.valueProps,
        objections: kb.objections,
        proofPoints: kb.proofPoints,
        segments: kb.segments,
      },
    })

    return NextResponse.json({ success: true, id: record.id })
  } catch (e) {
    console.error('Save error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Save failed' },
      { status: 500 }
    )
  }
}

// GET /api/product — load saved knowledge base
export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({ data: null })
    }

    const record = await (prisma as any).productContext.findUnique({
      where: { id: 'default' },
    })

    return NextResponse.json({ data: record })
  } catch (e) {
    return NextResponse.json({ data: null })
  }
}
