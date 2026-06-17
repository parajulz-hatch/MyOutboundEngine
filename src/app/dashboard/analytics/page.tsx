'use client'

import { useEffect, useState } from 'react'

interface Stats {
  total: number; enriched: number; enrolled: number
  sent: number; opened: number; clicked: number; replied: number
  positiveReplies: number; repliedNeg: number; meetingSet: number
  openRate: number; clickRate: number; replyRate: string; positiveReplyRate: string
  weeklyTarget: number; weeklyProgress: number
}

const EMPTY: Stats = {
  total: 0, enriched: 0, enrolled: 0,
  sent: 0, opened: 0, clicked: 0, replied: 0,
  positiveReplies: 0, repliedNeg: 0, meetingSet: 0,
  openRate: 0, clickRate: 0, replyRate: '0.00', positiveReplyRate: '0.00',
  weeklyTarget: 10, weeklyProgress: 0,
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [webhookCopied, setWebhookCopied] = useState(false)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const webhookUrl = `${appUrl}/api/webhook`

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setStats(d.stats ?? EMPTY))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl)
    setWebhookCopied(true)
    setTimeout(() => setWebhookCopied(false), 2000)
  }

  const progressPct = Math.min(100, Math.round((stats.weeklyProgress / stats.weeklyTarget) * 100))
  const atTarget = parseFloat(stats.positiveReplyRate) >= 0.5

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Live reply tracking · A/B performance · weekly target</p>
      </div>

      {/* Weekly goal */}
      <div className="bg-[#13294b] rounded-2xl p-6 text-white">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-sm text-white/60">Positive replies this week</p>
            <p className="text-4xl font-bold mt-1">
              {loading ? '…' : stats.weeklyProgress}
              <span className="text-white/30 text-2xl font-normal"> / {stats.weeklyTarget}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">positive reply rate</p>
            <p className={`text-2xl font-semibold ${atTarget ? 'text-green-400' : 'text-white'}`}>
              {loading ? '…' : `${stats.positiveReplyRate}%`}
            </p>
            <p className="text-xs text-white/40">target: 0.5–1%</p>
          </div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: progressPct >= 100 ? '#4ade80' : 'white',
            }}
          />
        </div>
        {progressPct >= 100 && (
          <p className="text-sm text-green-400 mt-2 font-medium">🎉 Weekly target hit!</p>
        )}
      </div>

      {/* Funnel */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Outbound funnel</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Prospects', value: stats.total, sub: `${stats.enriched} enriched`, color: 'border-gray-200' },
            { label: 'Emails sent', value: stats.sent, sub: `${stats.openRate}% open rate`, color: 'border-blue-100' },
            { label: 'Replies', value: stats.replied, sub: `${stats.replyRate}% reply rate`, color: 'border-purple-100' },
            { label: 'Positive replies', value: stats.positiveReplies, sub: `${stats.positiveReplyRate}% of sent`, color: 'border-green-200' },
          ].map((item) => (
            <div key={item.label} className={`bg-white border ${item.color} rounded-xl p-4`}>
              <p className="text-2xl font-semibold text-gray-900">{loading ? '…' : item.value}</p>
              <p className="text-xs font-medium text-gray-600 mt-0.5">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{loading ? '' : item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Meetings set', value: stats.meetingSet, icon: '🎉' },
          { label: 'Clicked link', value: stats.clicked, icon: '🔗' },
          { label: 'Negative / unsubscribed', value: stats.repliedNeg, icon: '🚫' },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-xl font-semibold text-gray-900">{loading ? '…' : item.value}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Webhook setup */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Instantly webhook URL</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Add this to Instantly → Settings → Integrations → Webhooks to track opens, clicks, and replies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 font-mono truncate">
            {webhookUrl}
          </code>
          <button
            onClick={copyWebhook}
            className="text-sm border border-gray-200 px-4 py-2.5 rounded-lg hover:border-gray-300 transition-colors flex-shrink-0"
          >
            {webhookCopied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { event: 'email_opened', label: 'Email opened', supported: true },
            { event: 'email_clicked', label: 'Link clicked', supported: true },
            { event: 'email_replied', label: 'Reply received', supported: true },
            { event: 'email_bounced', label: 'Email bounced', supported: true },
          ].map((e) => (
            <div key={e.event} className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${e.supported ? 'bg-green-400' : 'bg-gray-200'}`} />
              <code className="text-xs text-gray-500">{e.event}</code>
              <span className="text-xs text-gray-400">→ {e.label}</span>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-800">
          <strong>Reply classification:</strong> Every reply is automatically classified by Claude as Positive / Negative / OOO / Neutral. Positive replies flip the prospect to <code className="bg-amber-100 px-1 rounded">REPLIED_POSITIVE</code> and flag the winning variant.
        </div>
      </div>

      {/* Empty state guidance */}
      {!loading && stats.sent === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm mb-1">No emails sent yet</p>
          <p className="text-xs text-gray-300 mb-5">Complete setup: generate sequences → export to Instantly → launch campaign → add webhook URL above</p>
          <div className="flex gap-3 justify-center">
            <a href="/dashboard/prospects" className="text-xs border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-300 transition-colors">
              Import prospects
            </a>
            <a href="/dashboard/sequences" className="text-xs bg-[#13294b] text-white px-4 py-2 rounded-lg hover:bg-[#13294b]/90 transition-colors">
              Generate sequences →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
