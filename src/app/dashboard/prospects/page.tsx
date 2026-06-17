'use client'

import { useState, useEffect } from 'react'
import { CSVUploader } from './CSVUploader'
import { ColumnMapper } from './ColumnMapper'
import { ProspectTable } from './ProspectTable'
import { EnrichmentPanel } from './EnrichmentPanel'

export type UploadStage = 'upload' | 'map' | 'preview' | 'saved'

export interface ParsedRow {
  [key: string]: string
}

interface SavedProspect {
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

export default function ProspectsPage() {
  const [stage, setStage] = useState<UploadStage>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [savedProspects, setSavedProspects] = useState<SavedProspect[]>([])
  const [loadingProspects, setLoadingProspects] = useState(true)

  // Load existing prospects on mount
  useEffect(() => {
    fetchProspects()
  }, [])

  async function fetchProspects() {
    setLoadingProspects(true)
    try {
      const res = await fetch('/api/prospects')
      const data = await res.json()
      setSavedProspects(data.prospects ?? [])
    } catch {
      // DB not connected yet — fine
    } finally {
      setLoadingProspects(false)
    }
  }

  function handleParsed(h: string[], r: ParsedRow[]) {
    setHeaders(h); setRows(r); setStage('map')
  }

  function handleMapped(m: Record<string, string>) {
    setMapping(m); setStage('preview')
  }

  async function handleSaved(count: number) {
    await fetchProspects()
    setStage('saved')
    void count
  }

  const hasProspects = savedProspects.length > 0
  const showEnrichment = hasProspects && (stage === 'upload' || stage === 'saved')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prospects</h1>
          <p className="text-sm text-gray-400 mt-1">
            Upload targets · enrich with Apollo · infer OKRs with Claude
          </p>
        </div>
        {stage !== 'upload' && stage !== 'saved' && (
          <button
            onClick={() => { setStage('upload'); setRows([]); setHeaders([]) }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </button>
        )}
        {showEnrichment && (
          <button
            onClick={() => setStage('upload')}
            className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-300 transition-colors"
          >
            + Upload more
          </button>
        )}
      </div>

      {/* Upload flow — only shown when no prospects yet, or explicitly uploading */}
      {(!hasProspects || (!showEnrichment && stage !== 'saved')) && (
        <>
          {/* Progress steps */}
          {!hasProspects && (
            <div className="flex items-center gap-2">
              {(['upload', 'map', 'preview'] as const).map((s, i) => {
                const labels = ['Upload CSV', 'Map columns', 'Review & save']
                const active = stage === s
                const done = ['upload', 'map', 'preview'].indexOf(stage) > i
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                      active ? 'bg-[#13294b] text-white'
                      : done ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                    }`}>
                      {done && !active ? '✓ ' : `${i + 1}. `}{labels[i]}
                    </div>
                    {i < 2 && <span className="text-gray-200">→</span>}
                  </div>
                )
              })}
            </div>
          )}

          {stage === 'upload' && <CSVUploader onParsed={handleParsed} />}
          {stage === 'map' && <ColumnMapper headers={headers} rows={rows} onMapped={handleMapped} />}
          {stage === 'preview' && <ProspectTable rows={rows} mapping={mapping} onSaved={handleSaved} />}
        </>
      )}

      {/* Enrichment panel — shown once prospects exist */}
      {showEnrichment && !loadingProspects && (
        <EnrichmentPanel prospects={savedProspects} onRefresh={fetchProspects} />
      )}

      {loadingProspects && (
        <div className="text-center py-16 text-gray-400 text-sm">Loading prospects…</div>
      )}
    </div>
  )
}
