'use client'

import { useState } from 'react'
import { StepData, VariantData } from './page'

interface Prospect {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  title?: string | null
  company?: string | null
  status: string
  enriched: boolean
}

interface Props {
  prospects: Prospect[]
  loadingProspects: boolean
  onGenerated: (result: {
    sequenceId: string | null
    prospect: { name: string; title?: string | null; company?: string | null }
    steps: StepData[]
  }) => void
}

const STEP_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  INTRO:   { label: 'Intro',   color: 'bg-blue-50 text-blue-700',   desc: 'Day 0 — hook with their pain point' },
  VALUE:   { label: 'Value',   color: 'bg-purple-50 text-purple-700', desc: 'Day 3 — connect to their OKR' },
  PROOF:   { label: 'Proof',   color: 'bg-green-50 text-green-700',  desc: 'Day 7 — proof story + landing page' },
  BREAKUP: { label: 'Breakup', color: 'bg-orange-50 text-orange-700', desc: 'Day 14 — lightweight goodbye' },
}

export function SequenceGenerator({ prospects, loadingProspects, onGenerated }: Props) {
  const [selectedId, setSelectedId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  const selected = prospects.find((p) => p.id === selectedId)

  async function generate() {
    if (!selectedId) return
    setLoading(true)
    setError('')
    setProgress('Claude is writing your sequence...')

    try {
      const res = await fetch('/api/sequences/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setProgress('')
      onGenerated(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  if (loadingProspects) {
    return <div className="text-center py-16 text-sm text-gray-400">Loading prospects…</div>
  }

  if (prospects.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
        <p className="text-gray-400 text-sm mb-4">No enriched prospects yet.</p>
        <a
          href="/dashboard/prospects"
          className="text-sm bg-[#13294b] text-white px-5 py-2.5 rounded-xl hover:bg-[#13294b]/90 transition-colors"
        >
          Go enrich prospects first →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* What you'll get */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(STEP_LABELS).map(([type, info]) => (
          <div key={type} className="bg-white border border-gray-100 rounded-xl p-4">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.color}`}>
              {info.label}
            </span>
            <p className="text-xs text-gray-400 mt-2">{info.desc}</p>
            <p className="text-xs text-gray-300 mt-1">× 3 subject variants</p>
          </div>
        ))}
      </div>

      {/* Prospect picker */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <p className="text-sm font-medium text-gray-700">Select a prospect</p>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {prospects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                selectedId === p.id
                  ? 'border-[#13294b] bg-[#13294b]/5'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                p.enriched ? 'bg-green-400' : 'bg-orange-300'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {[p.firstName, p.lastName].filter(Boolean).join(' ') || p.email}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {[p.title, p.company].filter(Boolean).join(' · ') || p.email}
                </p>
              </div>
              {p.enriched && <span className="text-xs text-green-600 flex-shrink-0">OKRs ready</span>}
            </button>
          ))}
        </div>

        {selected && (
          <div className="bg-[#13294b]/5 rounded-xl px-4 py-3 text-sm">
            <p className="font-medium text-[#13294b]">
              {[selected.firstName, selected.lastName].filter(Boolean).join(' ') || selected.email}
            </p>
            <p className="text-xs text-[#13294b]/70 mt-0.5">
              {[selected.title, selected.company].filter(Boolean).join(' at ')}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={generate}
          disabled={!selectedId || loading}
          className="w-full bg-[#13294b] text-white font-medium py-3 rounded-xl hover:bg-[#13294b]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin inline-block">⟳</span> {progress}</>
          ) : (
            '✦ Generate sequence with Claude →'
          )}
        </button>

        <p className="text-xs text-center text-gray-400">
          Takes ~15 seconds · Uses ANTHROPIC_API_KEY
        </p>
      </div>
    </div>
  )
}
