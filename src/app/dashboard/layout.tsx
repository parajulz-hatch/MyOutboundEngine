import Link from 'next/link'

const nav = [
  { href: '/dashboard', label: 'Overview', icon: '◎' },
  { href: '/dashboard/product', label: 'Product context', icon: '🧠' },
  { href: '/dashboard/prospects', label: 'Prospects', icon: '👥' },
  { href: '/dashboard/sequences', label: 'Sequences', icon: '✉️' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📊' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-100 flex flex-col fixed h-full">
        <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-2">
          <span className="text-lg">🌙</span>
          <span className="text-sm font-semibold text-[#13294b]">Hatch Outbound</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="bg-[#13294b]/5 rounded-lg p-3">
            <p className="text-xs font-medium text-[#13294b]">Weekly target</p>
            <p className="text-xs text-gray-500 mt-0.5">0 / 10 meetings</p>
            <div className="mt-1.5 h-1 bg-gray-200 rounded-full">
              <div className="h-1 bg-[#13294b] rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-52 p-8 max-w-5xl">
        {children}
      </main>
    </div>
  )
}
