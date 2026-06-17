'use client'

import { useState } from 'react'

interface Prospect {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  title?: string | null
  company?: string | null
  industry?: string | null
  companySize?: string | null
  seniority?: string | null
  techStack?: string[] | null
  inferredOkrs?: string[] | null
  enriched: boolean
  status: string
}

interface Props {
  prospects: Prospect[]
  onRefresh: () => void
}

export function EnrichmentPanel({ prospects, onRefresh }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ enriched: number; failed: number; total: number } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const ready = prospects.filter((p) => p.enriched)
  const pending = prospects.filter((p) => !p.enriched)

  async function runEnrichment() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/prospects/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setResult(data)
      if (data.enriched > 0) onRefresh()
    } catch {
      setResult({ enriched: 0, failed: pending.length, total: pending.length })
    } finally {
      setLoading(false)
    }
  }

  const selectedProspect = selected ? prospects.find((p) => p.id === selected) : null

  return (
    <div className="space-y-5">
      {/* Status bar */}
      <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-lg font-semibold text-gray-900">{prospects.length}</p>
            <p className="text-xs text-gray-400">total prospects</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-green-600">{ready.length}</p>
            <p className="text-xs text-gray-400">enriched</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-orange-500">{pending.length}</p>
            <p className="text-xs text-gray-400">pending enrichment</p>
          </div>
        </div>

        {pending.length > 0 && (
          <button
            onClick={runEnrichment}
            disabled={loading}
            className="bg-[#13294b] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#13294b]/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading
              ? <><span className="animate-spin inline-block">⟳</span> Enriching...</>
              : `✦ Enrich ${pending.length} prospects`}
          </button>
        )}
      </div>

      {/* Result flash */}
      {result && (
        <div className={`rounded-xl px-5 py-3 text-sm flex items-center gap-3 ${
          result.failed === 0
            ? 'bg-green-50 border border-green-100 text-green-800'
            : 'bg-orange-50 border border-orange-100 text-orange-800'
        }`}>
          <span>{result.failed === 0 ? '✓' : '⚠'}</span>
          <span>
            {result.enriched} enriched
            {result.failed > 0 && `, ${result.failed} failed`}
            {' '}— OKRs inferred by Claude for each
          </span>
        </div>
      )}

      {/* No Apollo key notice */}
      {!process.env.NEXT_PUBLIC_HAS_APOLLO && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-sm text-blue-800 flex gap-3">
          <span>ℹ</span>
          <span>
            <strong>No Apollo key yet?</strong> Enrichment will still run — Claude infers OKRs from title + company. Apollo adds industry, company size, and tech stack. Add <code className="bg-blue-100 px-1 rounded">APOLLO_API_KEY</code> to Vercel when ready.
          </span>
        </div>
      )}

      {/* Prospect list */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Prospect</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Industry</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">OKRs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {prospects.map((p) => (
              <tr
                key={p.id}
                onClick={() => setSelected(selected === p.id ? null : p.id)}
                className="hover:bg-gray-50/60 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">
                    {[p.firstName, p.lastName].filter(Boolean).join(' ') || p.email}
                  </p>
                  <p className="text-xs text-gray-400">{p.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs max-w-[160px]">
                  {p.title ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {p.industry ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {p.companySize ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {p.inferredOkrs && Array.isArray(p.inferredOkrs) && p.inferredOkrs.length > 0
                    ? <span className="text-green-600">✓ {p.inferredOkrs.length} OKRs</span>
                    : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded OKR view */}
      {selectedProspect && (
        <div className="bg-white border border-[#13294b]/20 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {[selectedProspect.firstName, selectedProspect.lastName].filter(Boolean).join(' ') || selectedProspect.email}
              </p>
              <p className="text-sm text-gray-500">{selectedProspect.title} · {selectedProspect.company}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
          </div>

          {selectedProspect.inferredOkrs && Array.isArray(selectedProspect.inferredOkrs) && selectedProspect.inferredOkrs.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Inferred OKRs (used to personalise emails)</p>
              <ul className="space-y-1.5">
                {(selectedProspect.inferredOkrs as string[]).map((okr: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-[#13294b]/40 mt-0.5">→</span>
                    {okr}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedProspect.techStack && Array.isArray(selectedProspect.techStack) && selectedProspect.techStack.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Tech stack (from Apollo)</p>
              <div className="flex flex-wrap gap-1.5">
                {(selectedProspect.techStack as string[]).map((t: string) => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING:    { label: 'Pending',    cls: 'bg-gray-100 text-gray-500' },
    ENRICHING:  { label: 'Enriching…', cls: 'bg-blue-50 text-blue-600' },
    READY:      { label: 'Ready',      cls: 'bg-green-50 text-green-700' },
    ENROLLED:   { label: 'Enrolled',   cls: 'bg-purple-50 text-purple-700' },
    REPLIED_POSITIVE: { label: 'Replied ✓', cls: 'bg-green-100 text-green-800' },
    REPLIED_NEGATIVE: { label: 'Replied ✗', cls: 'bg-red-50 text-red-600' },
    MEETING_SET: { label: 'Meeting 🎉', cls: 'bg-yellow-50 text-yellow-700' },
    UNSUBSCRIBED: { label: 'Unsub',    cls: 'bg-gray-50 text-gray-400' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  )
}
