'use client'

import { useState } from 'react'
import { ParsedRow } from './page'

interface Props {
  rows: ParsedRow[]
  mapping: Record<string, string>
  onSaved: (count: number) => void
}

interface MappedProspect {
  email: string
  firstName?: string
  lastName?: string
  title?: string
  company?: string
  linkedinUrl?: string
}

function mapRows(rows: ParsedRow[], mapping: Record<string, string>): MappedProspect[] {
  return rows
    .map((row) => ({
      email: row[mapping.email]?.trim() ?? '',
      firstName: mapping.firstName ? row[mapping.firstName]?.trim() : undefined,
      lastName: mapping.lastName ? row[mapping.lastName]?.trim() : undefined,
      title: mapping.title ? row[mapping.title]?.trim() : undefined,
      company: mapping.company ? row[mapping.company]?.trim() : undefined,
      linkedinUrl: mapping.linkedinUrl ? row[mapping.linkedinUrl]?.trim() : undefined,
    }))
    .filter((p) => p.email && p.email.includes('@'))
}

export function ProspectTable({ rows, mapping, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const prospects = mapRows(rows, mapping)

  const skipped = rows.length - prospects.length

  async function handleSave() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospects }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      onSaved(data.saved)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-lg font-semibold text-gray-900">{prospects.length}</p>
            <p className="text-xs text-gray-400">valid prospects</p>
          </div>
          {skipped > 0 && (
            <div>
              <p className="text-lg font-semibold text-orange-500">{skipped}</p>
              <p className="text-xs text-gray-400">skipped (no email)</p>
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {prospects.filter((p) => p.company).length}
            </p>
            <p className="text-xs text-gray-400">with company</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {prospects.filter((p) => p.title).length}
            </p>
            <p className="text-xs text-gray-400">with title</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#13294b]/60">
          <span>🔜</span> Apollo enrichment runs after save
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">LinkedIn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {prospects.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-300 font-mono">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">{p.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {[p.firstName, p.lastName].filter(Boolean).join(' ') || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                    {p.title || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.company || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.linkedinUrl
                      ? <span className="text-xs text-blue-500 truncate block max-w-[140px]">✓ linked</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading || prospects.length === 0}
          className="bg-[#13294b] text-white font-medium text-sm px-8 py-3 rounded-xl hover:bg-[#13294b]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin">⟳</span> Saving...</>
          ) : (
            `Save ${prospects.length} prospects →`
          )}
        </button>
      </div>
    </div>
  )
}
