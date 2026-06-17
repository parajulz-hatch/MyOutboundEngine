'use client'

import { useState } from 'react'

interface PainPoint { stat: string; label: string }
interface ROIMetric { value: string; label: string; basis: string }
interface DemoContent {
  roiSection?: { title: string; metrics: ROIMetric[] }
  productHighlight?: { product: string; why: string }
  testimonialPull?: string
  calendarUrl?: string | null
}

interface LandingPage {
  slug: string
  headline: string
  subheadline: string | null
  painPoints: unknown
  demoContent: unknown
  ctaText: string
  ctaUrl: string
}

interface Props { page: LandingPage }

export function LandingPageClient({ page }: Props) {
  const [ctaClicked, setCtaClicked] = useState(false)

  const painPoints = (page.painPoints as PainPoint[]) ?? []
  const demo = (page.demoContent as DemoContent) ?? {}
  const roi = demo.roiSection
  const product = demo.productHighlight
  const testimonial = demo.testimonialPull
  const calendarUrl = demo.calendarUrl

  function handleCTA() {
    setCtaClicked(true)
    // Track click
    fetch(`/api/landing-pages/click?slug=${page.slug}`, { method: 'POST' }).catch(() => {})
    setTimeout(() => {
      window.location.href = calendarUrl ?? page.ctaUrl
    }, 300)
  }

  return (
    <div className="min-h-screen bg-[#f9f8f6]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌙</span>
          <span className="font-semibold text-[#13294b]">Hatch</span>
        </div>
        <button
          onClick={handleCTA}
          className="text-sm bg-[#13294b] text-white px-5 py-2 rounded-xl hover:bg-[#13294b]/90 transition-colors"
        >
          {page.ctaText}
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#13294b]/8 text-[#13294b] text-xs font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#13294b] opacity-60" />
          Made for you
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold text-[#13294b] leading-tight mb-5">
          {page.headline}
        </h1>
        {page.subheadline && (
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed mb-10">
            {page.subheadline}
          </p>
        )}
        <button
          onClick={handleCTA}
          className={`inline-flex items-center gap-2 bg-[#13294b] text-white font-medium text-lg px-10 py-4 rounded-2xl transition-all ${
            ctaClicked ? 'opacity-80 scale-95' : 'hover:bg-[#13294b]/90 hover:scale-105'
          }`}
        >
          {ctaClicked ? '✓ On our way…' : page.ctaText}
        </button>
        <p className="text-xs text-gray-400 mt-3">
          {demo.calendarUrl ? 'Pick a time that works for you' : '15 minutes. No pitch deck.'}
        </p>
      </section>

      {/* Pain points */}
      {painPoints.length > 0 && (
        <section className="bg-white border-y border-gray-100 py-14">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest text-center mb-10">
              The sleep deprivation problem
            </p>
            <div className="grid grid-cols-3 gap-8">
              {painPoints.map((p, i) => (
                <div key={i} className="text-center">
                  <p className="text-4xl font-bold text-[#13294b] mb-2">{p.stat}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{p.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ROI section */}
      {roi && (
        <section className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-semibold text-[#13294b] text-center mb-10">{roi.title}</h2>
          <div className="grid grid-cols-3 gap-4">
            {roi.metrics.map((m, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
                <p className="text-3xl font-bold text-[#13294b] mb-1">{m.value}</p>
                <p className="text-sm font-medium text-gray-700 mb-2">{m.label}</p>
                <p className="text-xs text-gray-400">{m.basis}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            Based on Rand Corporation research ($411B annual US employer cost of sleep deprivation)
          </p>
        </section>
      )}

      {/* Product highlight */}
      {product && (
        <section className="bg-[#13294b] py-16">
          <div className="max-w-3xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-3xl bg-white/10 flex items-center justify-center flex-shrink-0 text-5xl">
                🌙
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Our recommendation</p>
                <h3 className="text-2xl font-semibold text-white mb-3">{product.product}</h3>
                <p className="text-white/70 leading-relaxed mb-4">{product.why}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {['Sunrise alarm', 'Sound machine', 'Wind-down routines', 'Phone-free'].map((f) => (
                    <span key={f} className="text-xs bg-white/10 text-white/80 px-3 py-1 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonial */}
      {testimonial && (
        <section className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-400 text-4xl mb-4">&ldquo;</p>
          <p className="text-lg text-gray-600 leading-relaxed italic mb-6">
            {testimonial.replace(/^"|"$/g, '')}
          </p>
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-semibold text-[#13294b] mb-3">Ready to talk?</h2>
          <p className="text-gray-500 mb-8 text-sm">
            We can walk through what a sleep wellness program looks like for your team — no commitment required.
          </p>
          <button
            onClick={handleCTA}
            className="w-full sm:w-auto bg-[#13294b] text-white font-medium text-lg px-12 py-4 rounded-2xl hover:bg-[#13294b]/90 transition-colors"
          >
            {page.ctaText}
          </button>
          <p className="text-xs text-gray-400 mt-3">
            {demo.calendarUrl ? 'Pick a time — 15 min, no prep needed' : '15 minutes. No pitch deck.'}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-gray-300">
          © Hatch · <a href="https://hatch.co" className="hover:underline">hatch.co</a> · Trusted by 500k+ families
        </p>
      </footer>
    </div>
  )
}
