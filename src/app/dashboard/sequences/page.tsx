'use client'

import { useState, useEffect } from 'react'
import { SequenceGenerator } from './SequenceGenerator'
import { SequenceViewer } from './SequenceViewer'

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

interface GeneratedSequence {
  sequenceId: string | null
  prospect: { name: string; title?: string | null; company?: string | null }
  steps: StepData[]
}

export interface StepData {
  stepNumber: number
  stepType: string
  delayDays: number
  variants: VariantData[]
}

export interface VariantData {
  variantLetter: string
  subject: string
  bodyText: string
  cta: string
}

export default function SequencesPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [generated, setGenerated] = useState<GeneratedSequence | null>(null)

  useEffect(() => {
    fetch('/api/prospects')
      .then((r) => r.json())
      .then((d) => setProspects(d.prospects ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const readyProspects = prospects.filter((p) => p.status === 'READY' || p.enriched)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sequences</h1>
          <p className="text-sm text-gray-400 mt-1">
            Generate personalised 4-step sequences with 3 A/B subject variants each
          </p>
        </div>
        {generated && (
          <button
            onClick={() => setGenerated(null)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Generate another
          </button>
        )}
      </div>

      {!generated ? (
        <SequenceGenerator
          prospects={readyProspects}
          loadingProspects={loading}
          onGenerated={setGenerated}
        />
      ) : (
        <SequenceViewer sequence={generated} onBack={() => setGenerated(null)} />
      )}
    </div>
  )
}
