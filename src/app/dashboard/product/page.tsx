'use client'

import { useState } from 'react'

type KnowledgeBase = {
  icp: {
    titles: string[]
    industries: string[]
    companySizes: string[]
    painPoints: string[]
    goals: string[]
    buyingTriggers: string[]
  }
  valueProps: { title: string; description: string; metric?: string }[]
  objections: { objection: string; rebuttal: string }[]
  proofPoints: { type: string; title: string; description: string; metric?: string }[]
  segments: { name: string; titles: string[]; painPoints: string[]; hook: string }[]
  competitors: { name: string; weakness: string; ourEdge: string }[]
}

type ExtractResult = {
  name: string
  rawContent: string
  kb: KnowledgeBase
}

const HATCH_PREFILL = `Hatch is a sleep wellness company that helps the whole family sleep better.

Products:
- Hatch Restore 3 ($169.99): Smart bedside sleep clock for adults. Sunrise alarm, sound machine, phone-free controls, customizable wind-down/wake-up routines. Pairs with Hatch+ subscription. 30-night bedside trial, 1-year warranty.
- Hatch Baby ($99.99): Smart baby sleep device + expert sleep coaching. Launched Sept 2025. Includes 6 months free Hatch+, then $4.99/mo or $49.99/yr. Grows with the baby, expert-backed sleep chat.
- Hatch Go: Portable sound machine for travel. 10 soothing sounds, no wifi needed.
- Hatch+: Subscription unlocking premium content — meditations, sleep stories, wind-down channels, morning content. $4.99/mo or $49.99/yr.

Key differentiators:
- Science-backed circadian rhythm approach — not just a noise machine
- Builds sleep routines, not just masks noise
- Trusted by 500,000+ families
- Featured on Shark Tank (2016)
- Phone-free controls (Restore 3) — removes the #1 sleep disruptor
- Expert sleep coaches accessible via app (Hatch Baby)
- 30-night bedside trial — risk-free

Target buyers:
- Adults who struggle with sleep quality, wind-down, or waking up groggy
- New and expecting parents overwhelmed by baby sleep
- HR/Benefits leaders looking for employee wellness perks that reduce burnout
- Pediatricians and OBGYNs who recommend sleep products to new parents
- Hospitality/hotel procurement for sleep-focused room amenities
- Sleep consultants and postpartum doulas as a referral channel

Proof points:
- 500,000+ families trust Hatch
- Users report improved sleep quality, waking more rested, enjoying mornings more
- Restore 3 rated best sunrise alarm clock by multiple publications (Tom's Guide, NBC Select)
- 3,749+ reviews on Restore 3
- Sleep deprivation costs US employers ~$400B/year

Common objections:
- "Too expensive" -> 30-night trial, free returns, one device replaces white noise machine + alarm clock + night light
- "I already have a phone alarm" -> phone is the #1 sleep disruptor; Restore removes it from the bedside
- "We don't have budget" -> for HR: sleep deprivation costs US employers ~$400B/year; a $170 device is a rounding error vs. burnout costs
- "I don't know if it'll work for my baby" -> Hatch Baby includes expert sleep coaching from night one, not just hardware`

export default function ProductPage() {
  const [content, setContent] = useState(HATCH_PREFILL)
  const [name, setName] = useState('Hatch Sleep Products')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtractResult | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleExtract() {
    if (!content.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setSaved(false)

    try {
      const res = await fetch('/api/product/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Extraction failed')
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!result) return
    setSaved(false)
    try {
      const res = await fetch('/api/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Product context</h1>
        <p className="text-sm text-gray-400 mt-1">
          Give Claude everything it needs to write like your best sales rep. The more detail, the better the emails.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-5">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Context name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#13294b]/40"
            placeholder="e.g. Hatch Sleep Products"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-2">Product context</label>
          <p className="text-xs text-gray-400 mb-3">
            Paste your pitch deck content, product descriptions, case studies, competitive positioning. Pre-filled with Hatch context — edit or extend it.
          </p>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={18}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#13294b]/40 font-mono leading-relaxed resize-none"
            placeholder="Paste your product context here..."
          />
          <p className="text-xs text-gray-400 mt-1.5">{content.length.toLocaleString()} characters</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <button
          onClick={handleExtract}
          disabled={loading || !content.trim()}
          className="bg-[#13294b] text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-[#13294b]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              Claude is extracting knowledge base...
            </>
          ) : (
            'Extract knowledge base with Claude'
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Extracted knowledge base — review before saving</h2>
            <button
              onClick={handleSave}
              className="bg-green-600 text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-green-500 transition-colors"
            >
              {saved ? 'Saved' : 'Save to database'}
            </button>
          </div>

          <Section title="Ideal customer profile">
            <div className="grid grid-cols-2 gap-4">
              <KBList label="Titles" items={result.kb.icp.titles} />
              <KBList label="Industries" items={result.kb.icp.industries} />
              <KBList label="Company sizes" items={result.kb.icp.companySizes} />
              <KBList label="Pain points" items={result.kb.icp.painPoints} />
              <KBList label="Goals" items={result.kb.icp.goals} />
              <KBList label="Buying triggers" items={result.kb.icp.buyingTriggers} />
            </div>
          </Section>

          <Section title="Value propositions">
            <div className="space-y-3">
              {result.kb.valueProps.map((vp, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">{vp.title}</p>
                    {vp.metric && (
                      <span className="text-xs bg-[#13294b]/10 text-[#13294b] px-2 py-0.5 rounded-full whitespace-nowrap">{vp.metric}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{vp.description}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Buyer segments">
            <div className="space-y-3">
              {result.kb.segments.map((seg, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{seg.name}</p>
                  <p className="text-xs text-[#13294b] mb-2 italic">"{seg.hook}"</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {seg.titles.map((t, j) => (
                      <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                  <ul className="space-y-0.5">
                    {seg.painPoints.map((p, j) => (
                      <li key={j} className="text-xs text-gray-500">- {p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Objections and rebuttals">
            <div className="space-y-3">
              {result.kb.objections.map((obj, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-600 mb-1">"{obj.objection}"</p>
                  <p className="text-sm text-gray-600">- {obj.rebuttal}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Proof points">
            <div className="grid grid-cols-2 gap-3">
              {result.kb.proofPoints.map((pp, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">{pp.type}</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">{pp.title}</p>
                  {pp.metric && <p className="text-sm font-bold text-[#13294b]">{pp.metric}</p>}
                  <p className="text-xs text-gray-500 mt-1">{pp.description}</p>
                </div>
              ))}
            </div>
          </Section>

          {result.kb.competitors?.length > 0 && (
            <Section title="Competitive positioning">
              <div className="space-y-3">
                {result.kb.competitors.map((comp, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{comp.name}</p>
                    <p className="text-xs text-gray-500">Weakness: {comp.weakness}</p>
                    <p className="text-xs text-[#13294b] mt-0.5">Our edge: {comp.ourEdge}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function KBList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-1.5">{label}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
            <span className="text-gray-300 mt-0.5">-</span>{item}
          </li>
        ))}
      </ul>
    </div>
  )
}
