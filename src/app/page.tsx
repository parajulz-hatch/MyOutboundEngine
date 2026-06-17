import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#13294b] text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">🌙</div>
      <h1 className="text-4xl font-semibold mb-3">Hatch Outbound Engine</h1>
      <p className="text-white/60 text-lg mb-10 max-w-md">
        AI-powered outbound sequences that get Hatch into more bedrooms.
      </p>
      <Link
        href="/dashboard"
        className="bg-white text-[#13294b] font-medium px-8 py-3 rounded-xl hover:bg-white/90 transition-colors"
      >
        Open dashboard →
      </Link>
    </main>
  )
}
