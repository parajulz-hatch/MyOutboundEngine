'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Stats {
  total: number; enriched: number; sent: number
  positiveReplies: number; replyRate: string; positiveReplyRate: string
  weeklyTarget: number; weeklyProgress: number
  meetingSet: number
}

const EMPTY: Stats = {
  total: 0, enriched: 0, sent: 0,
  positiveReplies: 0, replyRate: '0.00', positiveReplyRate: '0.00',
  weeklyTarget: 10, weeklyProgress: 0, meetingSet: 0,
}

const steps = [
  { href: '/dashboard/product',   icon: '🧠', title: 'Add product context',    desc: 'Upload Hatch\'s positioning so Claude knows what to sell.', cta: 'Set up →' },
  { href: '/dashboard/prospects', icon: '👥', title: 'Import & enrich prospects', desc: 'CSV upload → Apollo enrichment → Claude OKR inference.',      cta: 'Import →' },
  { href: '/dashboard/sequences', icon: '✉️', title: 'Generate sequences',       desc: '4-step personalised emails with 3 A/B subject variants each.', cta: 'Generate →' },
  { href: '/dashboard/sequences/export', icon: '⬇', title: 'Export to Instantly', desc: 'Download campaign JSON and import in one click.',            cta: 'Export →' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(EMPTY)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((d) => setStats({ ...EMPTY, ...(d.stats ?? {}) }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const progressPct = Math.min(100, Math.round((stats.weeklyProgress / stats.weeklyTarget) * 100))

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Hatch outbound engine · target: 10+ meetings/week at 0.5–1% reply rate</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Prospects',        value: loading ? '…' : stats.total,           sub: `${stats.enriched} enriched` },
          { label: 'Emails sent',      value: loading ? '…' : stats.sent,            sub: `${stats.replyRate}% reply rate` },
          { label: 'Positive replies', value: loading ? '…' : stats.positiveReplies, sub: `${stats.positiveReplyRate}% of sent` },
          { label: 'Meetings set',     value: loading ? '…' : stats.meetingSet,      sub: 'status: MEETING_SET' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-xs font-medium text-gray-600 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Weekly goal */}
      <div className="bg-[#13294b] rounded-2xl p-6 text-white">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-sm text-white/60">Weekly meeting target</p>
            <p className="text-3xl font-bold mt-1">
              {loading ? '…' : stats.weeklyProgress}
              <span className="text-white/30 text-xl font-normal"> / {stats.weeklyTarget}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">positive reply rate</p>
            <p className="text-2xl font-semibold">{loading ? '…' : `${stats.positiveReplyRate}%`}</p>
            <p className="text-xs text-white/40">goal: 0.5–1%</p>
          </div>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, background: progressPct >= 100 ? '#4ade80' : 'white' }}
          />
        </div>
      </div>

      {/* Setup checklist */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Setup checklist</p>
        <div className="grid grid-cols-2 gap-3">
          {steps.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group bg-white border border-gray-100 hover:border-[#13294b]/20 rounded-xl p-5 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{s.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
              <p className="text-xs font-medium text-[#13294b] group-hover:underline">{s.cta}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
