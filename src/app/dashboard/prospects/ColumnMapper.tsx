'use client'

import { useState } from 'react'
import { ParsedRow } from './page'

// Fields we care about
const TARGET_FIELDS = [
  { key: 'email', label: 'Email', required: true },
  { key: 'firstName', label: 'First name', required: false },
  { key: 'lastName', label: 'Last name', required: false },
  { key: 'title', label: 'Job title', required: false },
  { key: 'company', label: 'Company', required: false },
  { key: 'linkedinUrl', label: 'LinkedIn URL', required: false },
]

// Common aliases to auto-detect
const ALIASES: Record<string, string[]> = {
  email: ['email', 'email_address', 'e-mail', 'mail'],
  firstName: ['first_name', 'firstname', 'first', 'given_name', 'fname'],
  lastName: ['last_name', 'lastname', 'last', 'surname', 'lname', 'family_name'],
  title: ['title', 'job_title', 'position', 'role', 'job_role', 'jobtitle'],
  company: ['company', 'company_name', 'organization', 'org', 'employer', 'account'],
  linkedinUrl: ['linkedin_url', 'linkedin', 'linkedin_profile', 'profile_url'],
}

function autoDetect(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  for (const [field, aliases] of Object.entries(ALIASES)) {
    const match = headers.find((h) =>
      aliases.includes(h.toLowerCase().trim().replace(/\s+/g, '_'))
    )
    if (match) mapping[field] = match
  }
  return mapping
}

interface Props {
  headers: string[]
  rows: ParsedRow[]
  onMapped: (mapping: Record<string, string>) => void
}

export function ColumnMapper({ headers, rows, onMapped }: Props) {
  const [mapping, setMapping] = useState<Record<string, string>>(autoDetect(headers))

  const hasEmail = !!mapping.email
  const mappedCount = Object.values(mapping).filter(Boolean).length

  function handleSubmit() {
    if (!hasEmail) return
    onMapped(mapping)
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-2 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Our field</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Your CSV column</p>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50">
          {TARGET_FIELDS.map((field) => (
            <div key={field.key} className="grid grid-cols-2 gap-4 px-5 py-3.5 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{field.label}</span>
                {field.required && (
                  <span className="text-xs text-orange-500 font-medium">required</span>
                )}
              </div>
              <select
                value={mapping[field.key] ?? ''}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                className={`border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors ${
                  mapping[field.key]
                    ? 'border-green-200 bg-green-50 text-green-800 focus:border-green-300'
                    : 'border-gray-200 text-gray-500 focus:border-[#13294b]/30'
                }`}
              >
                <option value="">— skip —</option>
                {headers.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && mapping.email && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Preview — first 3 rows
          </p>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {TARGET_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                    <th key={f.key} className="px-4 py-2.5 text-left font-medium text-gray-500">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.slice(0, 3).map((row, i) => (
                  <tr key={i}>
                    {TARGET_FIELDS.filter((f) => mapping[f.key]).map((f) => (
                      <td key={f.key} className="px-4 py-2.5 text-gray-700 max-w-[180px] truncate">
                        {row[mapping[f.key]] || <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {rows.length} rows · {mappedCount} fields mapped
        </p>
        <button
          onClick={handleSubmit}
          disabled={!hasEmail}
          className="bg-[#13294b] text-white text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-[#13294b]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Preview prospects →
        </button>
      </div>

      {!hasEmail && (
        <p className="text-xs text-orange-500 text-center">Map the Email field to continue</p>
      )}
    </div>
  )
}
