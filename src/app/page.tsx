import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#13294b] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
        🌙
      </div>
      <h1 className="text-4xl font-semibold mb-3 text-white">
        Hatch Outbound Engine
      </h1>
      <p className="text-white/60 text-lg mb-10 max-w-md">
        AI-powered outbound sequences that get Hatch into more bedrooms.
      </p>
      <Link
        href="/dashboard"
        className="bg-white text-[#13294b] font-semibold px-10 py-4 rounded-xl text-lg hover:bg-white/90 transition-colors"
      >
        Open dashboard →
      </Link>
    </main>
  )
}
