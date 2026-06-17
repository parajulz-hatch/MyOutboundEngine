'use client'

import { useState } from 'react'
import { CSVUploader } from './CSVUploader'
import { ColumnMapper } from './ColumnMapper'
import { ProspectTable } from './ProspectTable'

export type UploadStage = 'upload' | 'map' | 'preview' | 'saved'

export interface ParsedRow {
  [key: string]: string
}

export default function ProspectsPage() {
  const [stage, setStage] = useState<UploadStage>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [savedCount, setSavedCount] = useState(0)

  function handleParsed(h: string[], r: ParsedRow[]) {
    setHeaders(h)
    setRows(r)
    setStage('map')
  }

  function handleMapped(m: Record<string, string>) {
    setMapping(m)
    setStage('preview')
  }

  function handleSaved(count: number) {
    setSavedCount(count)
    setStage('saved')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Prospects</h1>
          <p className="text-sm text-gray-400 mt-1">
            Upload a CSV of targets. Each row will be enriched with title, industry, company size, and inferred OKRs.
          </p>
        </div>
        {stage !== 'upload' && stage !== 'saved' && (
          <button
            onClick={() => { setStage('upload'); setRows([]); setHeaders([]) }}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Start over
          </button>
        )}
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {(['upload', 'map', 'preview', 'saved'] as UploadStage[]).map((s, i) => {
          const labels = ['Upload CSV', 'Map columns', 'Review & save', 'Done']
          const active = stage === s
          const done = ['upload','map','preview','saved'].indexOf(stage) > i
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                active ? 'bg-[#13294b] text-white' :
                done ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-400'
              }`}>
                {done && !active ? '✓ ' : `${i + 1}. `}{labels[i]}
              </div>
              {i < 3 && <span className="text-gray-200">→</span>}
            </div>
          )
        })}
      </div>

      {stage === 'upload' && <CSVUploader onParsed={handleParsed} />}
      {stage === 'map' && <ColumnMapper headers={headers} rows={rows} onMapped={handleMapped} />}
      {stage === 'preview' && (
        <ProspectTable rows={rows} mapping={mapping} onSaved={handleSaved} />
      )}
      {stage === 'saved' && <SavedConfirmation count={savedCount} onMore={() => setStage('upload')} />}
    </div>
  )
}

function SavedConfirmation({ count, onMore }: { count: number; onMore: () => void }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
      <div className="text-4xl mb-4">✓</div>
      <p className="text-lg font-semibold text-gray-900">{count} prospects saved</p>
      <p className="text-sm text-gray-400 mt-2 mb-8">
        Ready for Apollo enrichment in Phase 4. Each prospect will get title, industry, company size, and inferred OKRs.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onMore}
          className="text-sm border border-gray-200 px-5 py-2.5 rounded-xl hover:border-gray-300 transition-colors"
        >
          Upload another CSV
        </button>
        <a
          href="/dashboard/sequences"
          className="text-sm bg-[#13294b] text-white px-5 py-2.5 rounded-xl hover:bg-[#13294b]/90 transition-colors"
        >
          Generate sequences →
        </a>
      </div>
    </div>
  )
}
