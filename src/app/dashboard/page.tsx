import Link from 'next/link'

const steps = [
  {
    step: '01',
    href: '/dashboard/product',
    title: 'Add product context',
    desc: 'Upload Hatch\'s positioning, products, and ICP so Claude can write like your best sales rep.',
    status: 'todo',
  },
  {
    step: '02',
    href: '/dashboard/prospects',
    title: 'Import prospects',
    desc: 'Upload a CSV of targets. Each row is enriched with title, industry, company size, and inferred OKRs.',
    status: 'locked',
  },
  {
    step: '03',
    href: '/dashboard/sequences',
    title: 'Generate sequences',
    desc: 'Claude writes a personalized 4-step sequence per prospect with 3 A/B subject variants each.',
    status: 'locked',
  },
  {
    step: '04',
    href: '/dashboard/sequences',
    title: 'Export to Instantly',
    desc: 'One-click export in Instantly\'s campaign format. Includes UTM-linked landing pages per prospect.',
    status: 'locked',
  },
]

const stats = [
  { label: 'Prospects ready', value: '0' },
  { label: 'Sequences generated', value: '0' },
  { label: 'Emails sent', value: '0' },
  { label: 'Positive replies', value: '0' },
  { label: 'Reply rate', value: '—' },
  { label: 'Meetings set', value: '0' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Target: 10+ positive replies per week at 0.5–1% reply rate</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <div className="text-xl font-semibold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Setup checklist */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Setup checklist</h2>
        <div className="space-y-3">
          {steps.map((s) => (
            <Link
              key={s.step}
              href={s.href}
              className={`flex items-start gap-4 bg-white border rounded-xl p-5 transition-colors group ${
                s.status === 'locked'
                  ? 'border-gray-100 opacity-50 pointer-events-none'
                  : 'border-gray-200 hover:border-[#13294b]/30'
              }`}
            >
              <div className="text-xs font-mono text-[#13294b]/50 mt-0.5 w-6 flex-shrink-0">{s.step}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{s.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
              {s.status !== 'locked' && (
                <span className="text-xs bg-[#13294b] text-white px-2.5 py-1 rounded-full mt-0.5">Start →</span>
              )}
              {s.status === 'locked' && (
                <span className="text-xs text-gray-300 mt-0.5">🔒</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Weekly goal */}
      <div className="bg-[#13294b] rounded-2xl p-6 text-white">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-sm text-white/60">This week's meeting target</p>
            <p className="text-3xl font-semibold mt-1">0 <span className="text-white/40 text-lg font-normal">/ 10</span></p>
          </div>
          <p className="text-xs text-white/40 text-right">Goal: 0.5–1%<br/>positive reply rate</p>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full">
          <div className="h-1.5 bg-white rounded-full transition-all" style={{ width: '0%' }} />
        </div>
      </div>
    </div>
  )
}
