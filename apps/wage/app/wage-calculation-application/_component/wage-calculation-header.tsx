"use client"

import { useMemo } from "react"
import { Calculator, MoreVertical } from "lucide-react"

interface WageCalculationHeaderProps {
  title?: string
  description?: string
  month?: string | number
  year?: string | number
}

export default function WageCalculationHeader({
  title = "Wage Calculation Application",
  description = "Manage and track wage calculation applications",
  month,
  year,
}: WageCalculationHeaderProps) {
  // Format month and year for display
  const periodDisplay = useMemo(() => {
    if (!month || !year) return null
    
    const monthNum = typeof month === 'string' ? parseInt(month, 10) : month
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return null
    
    const date = new Date(2000, monthNum - 1, 1)
    const monthName = date.toLocaleString('en-US', { month: 'long' })
    const yearStr = String(year)
    
    return `${monthName} ${yearStr}`
  }, [month, year])

  return (
    <div className="backdrop-blur border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            {periodDisplay && (
              <span className="text-sm font-medium text-slate-600 px-2 py-1 bg-slate-100 rounded-md">
                {periodDisplay}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-800 hover:bg-slate-50 transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

