'use client'

import { useState } from 'react'
import { StepData, VariantData } from './page'

interface Sequence {
  sequenceId: string | null
  prospect: { name: string; title?: string | null; company?: string | null }
  steps: StepData[]
}

interface Props {
  sequence: Sequence
  onBack: () => void
}

const STEP_META: Record<string, { color: string; bg: string; day: string }> = {
  INTRO:   { color: 'text-blue-700',   bg: 'bg-blue-50',   day: 'Day 0' },
  VALUE:   { color: 'text-purple-700', bg: 'bg-purple-50', day: 'Day 3' },
  PROOF:   { color: 'text-green-700',  bg: 'bg-green-50',  day: 'Day 7' },
  BREAKUP: { color: 'text-orange-700', bg: 'bg-orange-50', day: 'Day 14' },
}

export function SequenceViewer({ sequence, onBack }: Props) {
  const [activeStep, setActiveStep] = useState(0)
  const [activeVariant, setActiveVariant] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const step = sequence.steps[activeStep]
  const variantLetter = activeVariant[activeStep] ?? 'A'
  const variant = step?.variants.find((v) => v.variantLetter === variantLetter) ?? step?.variants[0]

  function copyAll() {
    const text = sequence.steps
      .map((s) => {
        const v = s.variants[0]
        const meta = STEP_META[s.stepType]
        return `=== Step ${s.stepNumber}: ${s.stepType} (${meta.day}) ===\nSubject: ${v.subject}\n\n${v.bodyText}`
      })
      .join('\n\n---\n\n')

    navigator.clipboard.writeText(text)
    setCopied('all')
    setTimeout(() => setCopied(null), 2000)
  }

  function copyVariant() {
    if (!variant) return
    navigator.clipboard.writeText(`Subject: ${variant.subject}\n\n${variant.bodyText}`)
    setCopied(variant.variantLetter)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{sequence.prospect.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {[sequence.prospect.title, sequence.prospect.company].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyAll}
            className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-300 transition-colors"
          >
            {copied === 'all' ? '✓ Copied!' : 'Copy all'}
          </button>
          <a
            href="/dashboard/sequences/export"
            className="text-xs bg-[#13294b] text-white px-3 py-1.5 rounded-lg hover:bg-[#13294b]/90 transition-colors"
          >
            Export to Instantly →
          </a>
        </div>
      </div>

      {/* Step tabs */}
      <div className="flex gap-2">
        {sequence.steps.map((s, i) => {
          const meta = STEP_META[s.stepType]
          return (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`flex-1 text-xs font-medium py-2.5 px-3 rounded-xl border transition-colors ${
                activeStep === i
                  ? `${meta.bg} ${meta.color} border-transparent`
                  : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
              }`}
            >
              <span className="block text-[10px] opacity-60 mb-0.5">{meta.day}</span>
              {s.stepType}
            </button>
          )
        })}
      </div>

      {step && variant && (
        <div className="space-y-4">
          {/* Variant selector */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">Subject line variants</p>
              <span className="text-xs text-gray-400">A/B/C test these</span>
            </div>
            <div className="space-y-2">
              {step.variants.map((v) => (
                <button
                  key={v.variantLetter}
                  onClick={() => setActiveVariant((prev) => ({ ...prev, [activeStep]: v.variantLetter }))}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                    variantLetter === v.variantLetter
                      ? 'border-[#13294b]/30 bg-[#13294b]/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    variantLetter === v.variantLetter ? 'bg-[#13294b] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {v.variantLetter}
                  </span>
                  <span className="text-sm text-gray-800">{v.subject}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Email body */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STEP_META[step.stepType].bg} ${STEP_META[step.stepType].color}`}>
                  {step.stepType}
                </span>
                <span className="text-xs text-gray-400">
                  Send on day {step.delayDays} · Variant {variantLetter}
                </span>
              </div>
              <button
                onClick={copyVariant}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {copied === variantLetter ? '✓ Copied!' : 'Copy email'}
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Subject</p>
                <p className="text-sm font-medium text-gray-900">{variant.subject}</p>
              </div>
              <div className="border-t border-gray-50 pt-3">
                <p className="text-xs text-gray-400 mb-2">Body</p>
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {variant.bodyText}
                </div>
              </div>
              {variant.cta && (
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-xs text-gray-400 mb-1">CTA</p>
                  <p className="text-sm text-[#13294b] font-medium">{variant.cta}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="text-sm text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
            >
              ← Previous step
            </button>
            <button
              onClick={() => setActiveStep(Math.min(sequence.steps.length - 1, activeStep + 1))}
              disabled={activeStep === sequence.steps.length - 1}
              className="text-sm text-[#13294b] hover:text-[#13294b]/70 disabled:opacity-30 transition-colors"
            >
              Next step →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
