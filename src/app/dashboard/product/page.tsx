'use client'

import { useState } from 'react'
import { ProductContextForm } from './ProductContextForm'
import { KnowledgeBaseView } from './KnowledgeBaseView'

export default function ProductPage() {
  const [view, setView] = useState<'form' | 'kb'>('form')
  const [savedContext, setSavedContext] = useState<Record<string, unknown> | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Product context</h1>
          <p className="text-sm text-gray-400 mt-1">
            Tell Claude about Hatch — products, ICP, proof points. It uses this to write every email.
          </p>
        </div>
        {savedContext && (
          <div className="flex gap-2">
            <button
              onClick={() => setView('form')}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${view === 'form' ? 'bg-[#13294b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              Edit
            </button>
            <button
              onClick={() => setView('kb')}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${view === 'kb' ? 'bg-[#13294b] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              View knowledge base
            </button>
          </div>
        )}
      </div>

      {view === 'form' || !savedContext ? (
        <ProductContextForm
          onSaved={(kb) => {
            setSavedContext(kb)
            setView('kb')
          }}
        />
      ) : (
        <KnowledgeBaseView kb={savedContext} onEdit={() => setView('form')} />
      )}
    </div>
  )
}
