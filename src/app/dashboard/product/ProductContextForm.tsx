'use client'

import { useState } from 'react'

const HATCH_PREFILL = `Hatch is a sleep wellness company that helps the whole family sleep better.

PRODUCTS:
- Hatch Restore 3 ($169.99): Smart bedside sleep clock for adults. Sunrise alarm, sound machine, phone-free controls, customizable wind-down and wake-up routines. Pairs with Hatch+ subscription.
- Hatch Baby ($99.99): Smart baby sleep device + expert sleep coaching. Soothing sounds, calming lights, age-based routines. 6 months free Hatch+ included, then $4.99/mo.
- Hatch Go: Portable sound machine for travel. 10 sounds, no wifi needed.
- Hatch+ subscription: Premium content layer — meditations, curated sounds, stories, wind-down channels.

MISSION: Help humans of all ages develop and maintain natural, healthy sleep habits.

PROOF POINTS:
- Trusted by over 500,000 families
- Featured on Shark Tank (2016)
- Restore 3 has 3,700+ reviews, customers praise gentle wake-up and light quality
- Customer research shows Restore users report improved sleep quality and more energized mornings
- Science-backed circadian rhythm approach

DIFFERENTIATORS vs. competitors (Philips SmartSleep, Loftie, basic white noise machines):
- All-in-one: light + sound + alarm + content in one device
- Full family ecosystem: one brand from newborn through adult
- Subscription content layer keeps the product fresh
- Phone-free controls (Restore 3) — no doom scrolling before bed
- Expert-backed sleep routines, not just noise

BUYER SEGMENTS:
1. HR / Benefits leaders at 200–2000 person companies — Restore as employee wellness perk. Sleep deprivation costs US employers ~$411B/year.
2. Pediatricians, OBGYNs, midwives, maternity practices — Hatch Baby as a recommended product for new parents
3. Baby registry platforms (Babylist, Buy Buy Baby buyers) — wholesale/partnership
4. Boutique hotels and wellness resorts — sleep-focused room amenity
5. Postpartum doulas and infant sleep consultants — trusted referrer channel

COMMON OBJECTIONS:
- "We already have a white noise machine" → Hatch is not a white noise machine. It's a complete sleep routine system with light, content, and expert-backed scheduling.
- "Too expensive" → $169 one-time vs. years of poor sleep and productivity loss. For corporate: pennies per employee per night.
- "We don't have budget for wellness hardware" → Hatch Baby is FSA/HSA eligible. Restore often fits in wellness stipends.
- "Our employees won't use it" → 500k+ families already do. Average user runs a routine every night within the first week.`

interface Props {
  onSaved: (kb: Record<string, unknown>) => void
}

export function ProductContextForm({ onSaved }: Props) {
  const [content, setContent] = useState(HATCH_PREFILL)
  const [contextName, setContextName] = useState('Hatch — Full product context')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  async function handleSubmit() {
    if (!content.trim()) return
    setLoading(true)
    setError('')
    setProgress('Sending to Claude...')

    try {
      const res = await fetch('/api/product-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contextName, content }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to process')

      setProgress('Done!')
      onSaved(data.knowledgeBase)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <div className="space-y-5">
      {/* Tips */}
      <div className="bg-[#13294b]/5 border border-[#13294b]/10 rounded-xl p-4">
        <p className="text-xs font-medium text-[#13294b] mb-2">What to include for best results</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {[
            'Products, pricing, and key features',
            'Who you sell to (titles, company sizes, industries)',
            'Why customers buy — their pain points and goals',
            'Proof points: stats, case studies, reviews',
            'Common objections and your rebuttals',
            'How you differ from competitors',
          ].map((tip) => (
            <p key={tip} className="text-xs text-[#13294b]/70 flex items-start gap-1.5">
              <span className="mt-0.5 text-[#13294b]/40">✓</span> {tip}
            </p>
          ))}
        </div>
      </div>

      {/* Context name */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1.5">Context name</label>
        <input
          value={contextName}
          onChange={(e) => setContextName(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#13294b]/40 transition-colors"
          placeholder="e.g. Hatch — HR benefits pitch"
        />
      </div>

      {/* Main textarea */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1.5">
          Product context{' '}
          <span className="text-gray-400 font-normal">— paste your positioning, pitch deck notes, or anything relevant</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={22}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 focus:outline-none focus:border-[#13294b]/40 transition-colors resize-none leading-relaxed"
          placeholder="Paste your product description, ICP, proof points, objections..."
        />
        <p className="text-xs text-gray-400 mt-1">{content.length.toLocaleString()} characters</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !content.trim()}
        className="w-full bg-[#13294b] text-white font-medium py-3 rounded-xl hover:bg-[#13294b]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⟳</span>
            {progress || 'Processing...'}
          </>
        ) : (
          '🧠 Extract knowledge base with Claude →'
        )}
      </button>
    </div>
  )
}
