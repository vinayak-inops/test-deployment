"use client"

import { useState } from "react"

const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

interface RemarksFormProps {
  remarks: string
  onRemarksChange: (value: string) => void
  error?: string
}

export default function RemarksForm({
  remarks,
  onRemarksChange,
  error
}: RemarksFormProps) {
  const [charError, setCharError] = useState<string>("")

  const handleChange = (value: string) => {
    if (value && !hasNoScriptContent(value)) {
      setCharError("Remarks must not contain code or script content")
    } else {
      setCharError("")
    }
    onRemarksChange(value)
  }

  const displayError = charError || error

  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Remarks</h3>
        <p className="text-sm text-gray-500">Additional notes or comments (optional)</p>
      </div>
      <div className="space-y-2">
        <textarea
          id="remarks"
          value={remarks}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm resize-none transition hover:border-blue-400"
          placeholder="Additional notes or comments..."
          rows={4}
        />
        {displayError && (
          <p className="text-sm text-red-600 mt-1">{displayError}</p>
        )}
      </div>
    </div>
  )
}
