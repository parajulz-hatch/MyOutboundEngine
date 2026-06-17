'use client'

interface ICP {
  titles?: string[]
  industries?: string[]
  companySizes?: string[]
  painPoints?: string[]
  goals?: string[]
  buyingTriggers?: string[]
}
interface ValueProp { title: string; description: string; metric?: string }
interface Objection { objection: string; rebuttal: string }
interface ProofPoint { type: string; title: string; description: string }
interface Segment { name: string; description: string; product?: string; okrs?: string[] }

interface KB {
  icp?: ICP
  valueProps?: ValueProp[]
  objections?: Objection[]
  proofPoints?: ProofPoint[]
  segments?: Segment[]
}

interface Props {
  kb: Record<string, unknown>
  onEdit: () => void
}

function Tag({ children }: { children: string }) {
  return (
    <span className="inline-block bg-[#13294b]/8 text-[#13294b] text-xs px-2.5 py-1 rounded-full mr-1.5 mb-1.5">
      {children}
    </span>
  )
}

export function KnowledgeBaseView({ kb, onEdit }: Props) {
  const typed = kb as KB
  const { icp, valueProps, objections, proofPoints, segments } = typed

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="bg-green-50 border border-green-100 rounded-xl px-5 py-4 flex items-center gap-3">
        <span className="text-green-500 text-xl">✓</span>
        <div>
          <p className="text-sm font-medium text-green-900">Knowledge base extracted</p>
          <p className="text-xs text-green-700 mt-0.5">Claude has processed your context. This powers every email sequence.</p>
        </div>
        <button onClick={onEdit} className="ml-auto text-xs text-green-700 hover:underline flex-shrink-0">
          Edit source →
        </button>
      </div>

      {/* ICP */}
      {icp && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Ideal customer profile</h2>
          <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
            {icp.titles && icp.titles.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Target titles</p>
                <div>{icp.titles.map((t, i) => <Tag key={i}>{t}</Tag>)}</div>
              </div>
            )}
            {icp.industries && icp.industries.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Industries</p>
                <div>{icp.industries.map((t, i) => <Tag key={i}>{t}</Tag>)}</div>
              </div>
            )}
            {icp.companySizes && icp.companySizes.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Company sizes</p>
                <div>{icp.companySizes.map((t, i) => <Tag key={i}>{t}</Tag>)}</div>
              </div>
            )}
            {icp.painPoints && icp.painPoints.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Pain points</p>
                <ul className="space-y-1">
                  {icp.painPoints.map((p, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-gray-300 mt-0.5">•</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {icp.buyingTriggers && icp.buyingTriggers.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Buying triggers</p>
                <ul className="space-y-1">
                  {icp.buyingTriggers.map((t, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-gray-300 mt-0.5">→</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Buyer segments */}
      {segments && segments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Buyer segments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {segments.map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.description}</p>
                {s.product && <p className="text-xs text-[#13294b] mt-2 font-medium">→ {s.product}</p>}
                {s.okrs && s.okrs.length > 0 && (
                  <div className="mt-2">
                    {s.okrs.map((o, j) => <Tag key={j}>{o}</Tag>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Value props */}
      {valueProps && valueProps.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Value propositions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {valueProps.map((vp, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-1">{vp.title}</p>
                <p className="text-sm text-gray-800 leading-relaxed">{vp.description}</p>
                {vp.metric && <p className="text-xs text-[#13294b] font-medium mt-2">{vp.metric}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Objections */}
      {objections && objections.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Objections + rebuttals</h2>
          <div className="space-y-3">
            {objections.map((o, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-red-400 mb-1">Objection</p>
                <p className="text-sm text-gray-800 mb-3">&ldquo;{o.objection}&rdquo;</p>
                <p className="text-xs text-green-500 mb-1">Rebuttal</p>
                <p className="text-sm text-gray-700 leading-relaxed">{o.rebuttal}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Proof points */}
      {proofPoints && proofPoints.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Proof points</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {proofPoints.map((p, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-3">
                <span className="text-lg flex-shrink-0">
                  {p.type === 'stat' ? '📊' : p.type === 'case_study' ? '📋' : p.type === 'testimonial' ? '💬' : '🏆'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
