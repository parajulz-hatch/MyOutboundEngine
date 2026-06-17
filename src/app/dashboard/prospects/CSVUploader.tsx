'use client'

import { useRef, useState } from 'react'
import Papa from 'papaparse'
import { ParsedRow } from './page'

interface Props {
  onParsed: (headers: string[], rows: ParsedRow[]) => void
}

const SAMPLE_CSV = `email,first_name,last_name,title,company,linkedin_url
sarah.chen@acmecorp.com,Sarah,Chen,VP of People,Acme Corp,linkedin.com/in/sarahchen
mike.rodriguez@techflow.io,Mike,Rodriguez,Head of HR,TechFlow,linkedin.com/in/mikerod
jessica.park@brightworks.com,Jessica,Park,Chief People Officer,BrightWorks,linkedin.com/in/jesspark
dr.emily.wu@pediatrics-sf.com,Emily,Wu,Pediatrician,SF Pediatrics Group,linkedin.com/in/emilywu
tom.hassan@boutique-hotel.com,Tom,Hassan,Director of Rooms,The Grand Hotel,linkedin.com/in/tomhassan`

export function CSVUploader({ onParsed }: Props) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function parseFile(file: File) {
    setError('')
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a .csv file')
      return
    }

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        if (results.data.length === 0) {
          setError('CSV is empty — add at least one row')
          return
        }
        const headers = results.meta.fields ?? []
        if (headers.length === 0) {
          setError('Could not read CSV headers')
          return
        }
        onParsed(headers, results.data)
      },
      error(err) {
        setError(`Could not parse CSV: ${err.message}`)
      },
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  function loadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const file = new File([blob], 'sample-prospects.csv', { type: 'text/csv' })
    parseFile(file)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-[#13294b] bg-[#13294b]/5'
            : 'border-gray-200 hover:border-gray-300 bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
        />
        <div className="text-4xl mb-4">📄</div>
        <p className="text-sm font-medium text-gray-700">Drop your CSV here, or click to browse</p>
        <p className="text-xs text-gray-400 mt-2">
          Must include an <code className="bg-gray-100 px-1 py-0.5 rounded">email</code> column — everything else is optional
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Expected columns */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <p className="text-xs font-medium text-gray-600 mb-3">Recognised column names</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
          {[
            ['email', 'Required'],
            ['first_name / firstName', 'Optional'],
            ['last_name / lastName', 'Optional'],
            ['title / job_title', 'Optional'],
            ['company / company_name', 'Optional'],
            ['linkedin_url', 'Optional'],
          ].map(([col, req]) => (
            <div key={col} className="flex items-center justify-between">
              <code className="text-xs text-[#13294b] bg-[#13294b]/5 px-2 py-0.5 rounded">{col}</code>
              <span className={`text-xs ${req === 'Required' ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>{req}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sample */}
      <div className="text-center">
        <p className="text-xs text-gray-400 mb-2">Don&apos;t have a CSV yet?</p>
        <button
          onClick={loadSample}
          className="text-sm text-[#13294b] hover:underline font-medium"
        >
          Load sample prospects →
        </button>
      </div>
    </div>
  )
}
