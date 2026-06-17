'use client'

import { useState } from 'react'

interface Campaign {
  name: string
  sequences: Array<{ steps: Step[] }>
  settings: Record<string, unknown>
}

interface Step {
  type: string
  delay: number
  subject: string
  body: string
  variants?: Array<{ subject: string; body: string }>
}

export default function ExportPage() {
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isMock, setIsMock] = useState(false)

  async function buildExport() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sequences/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Export failed')
      setCampaigns(data.campaigns)
      setIsMock(data.mock ?? false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function download() {
    if (!campaigns) return
    const json = JSON.stringify(campaigns, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hatch-outbound-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyJSON() {
    if (!campaigns) return
    navigator.clipboard.writeText(JSON.stringify(campaigns, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalSteps = campaigns?.[0]?.sequences[0]?.steps.length ?? 0
  const totalVariants = campaigns?.[0]?.sequences[0]?.steps.reduce(
    (acc, s) => acc + 1 + (s.variants?.length ?? 0), 0
  ) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Export to Instantly</h1>
        <p className="text-sm text-gray-400 mt-1">
          Download your sequences in Instantly&apos;s campaign format — ready to import in one click
        </p>
      </div>

      {!campaigns ? (
        <div className="space-y-5">
          {/* What gets exported */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-700 mb-4">What&apos;s included in the export</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '✉️', label: '4 sequence steps', desc: 'Intro → Value → Proof → Breakup' },
                { icon: '🔀', label: 'A/B/C variants', desc: 'Subject line variants per step, ready to test' },
                { icon: '🔗', label: 'Landing page URLs', desc: 'Personalised UTM-tracked links per prospect' },
                { icon: '⚙️', label: 'Campaign settings', desc: 'Stop on reply, 40/day limit, open + click tracking' },
              ].map((item) => (
                <div key={item.label} className="flex gap-3">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to import */}
          <div className="bg-[#13294b]/5 border border-[#13294b]/10 rounded-xl p-5">
            <p className="text-sm font-medium text-[#13294b] mb-3">How to import into Instantly</p>
            <ol className="space-y-2">
              {[
                'Click "Build export" below — downloads a .json file',
                'Open Instantly → Campaigns → New Campaign',
                'Click "Import" and select the downloaded .json file',
                'Review the sequence, assign sender accounts, and launch',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#13294b]/80">
                  <span className="w-5 h-5 rounded-full bg-[#13294b]/10 text-[#13294b] text-xs flex items-center justify-center flex-shrink-0 font-medium mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={buildExport}
            disabled={loading}
            className="w-full bg-[#13294b] text-white font-medium py-3 rounded-xl hover:bg-[#13294b]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><span className="animate-spin inline-block">⟳</span> Building export…</>
              : '⬇ Build export'}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Mock notice */}
          {isMock && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 text-sm text-blue-800 flex gap-3">
              <span>ℹ</span>
              <span>
                <strong>Demo export</strong> — this is a sample campaign. Connect your database and generate a real sequence to export live data.
              </span>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white border border-green-100 rounded-xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-lg font-semibold text-gray-900">{campaigns.length}</p>
                <p className="text-xs text-gray-400">campaign{campaigns.length !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{totalSteps}</p>
                <p className="text-xs text-gray-400">steps</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{totalVariants}</p>
                <p className="text-xs text-gray-400">total variants</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyJSON}
                className="text-sm border border-gray-200 px-4 py-2 rounded-xl hover:border-gray-300 transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy JSON'}
              </button>
              <button
                onClick={download}
                className="text-sm bg-[#13294b] text-white px-4 py-2 rounded-xl hover:bg-[#13294b]/90 transition-colors"
              >
                ⬇ Download .json
              </button>
            </div>
          </div>

          {/* Campaign preview */}
          {campaigns.map((campaign, ci) => (
            <div key={ci} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">{campaign.name}</p>
                <span className="text-xs text-gray-400">
                  {campaign.sequences[0]?.steps.length} steps · stop on reply
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {campaign.sequences[0]?.steps.map((step, si) => (
                  <div key={si} className="px-5 py-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 w-6">
                          {si + 1}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {si === 0 ? 'Day 0' : `+${step.delay}d`}
                        </span>
                      </div>
                      {step.variants && (
                        <span className="text-xs text-blue-500">
                          +{step.variants.length} variants
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 pl-8">{step.subject}</p>
                    <p className="text-xs text-gray-400 mt-1 pl-8 line-clamp-2"
                       dangerouslySetInnerHTML={{ __html: step.body.replace(/<[^>]*>/g, ' ').slice(0, 120) + '…' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-3">
            <button
              onClick={() => setCampaigns(null)}
              className="text-sm border border-gray-200 px-5 py-2.5 rounded-xl hover:border-gray-300 transition-colors"
            >
              ← Rebuild
            </button>
            <button
              onClick={download}
              className="flex-1 text-sm bg-[#13294b] text-white py-2.5 rounded-xl hover:bg-[#13294b]/90 transition-colors text-center"
            >
              ⬇ Download and import into Instantly
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
