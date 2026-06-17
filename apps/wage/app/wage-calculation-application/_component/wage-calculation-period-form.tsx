"use client"

import { useMemo } from "react"
import { FileText, ChevronsUpDown } from "lucide-react"

interface WageCalculationPeriodFormProps {
  month: string
  year: string
  onMonthChange: (value: string) => void
  onYearChange: (value: string) => void
  errors?: {
    month?: string
    year?: string
  }
}

export default function WageCalculationPeriodForm({
  month,
  year,
  onMonthChange,
  onYearChange,
  errors = {}
}: WageCalculationPeriodFormProps) {
  // Generate month options
  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1
      const date = new Date(2000, i, 1)
      return {
        value: String(monthNum).padStart(2, '0'),
        label: date.toLocaleString('en-US', { month: 'long' })
      }
    })
  }, [])

  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
        <div className="flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Wage Calculation Period</h3>
          <p className="text-sm text-gray-500">Select the period for wage calculation</p>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <label className="block text-sm font-semibold text-gray-700">
            Month <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
            <select
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
              className="relative w-full h-9 rounded-md border border-gray-300 bg-white px-3 py-1.5 pl-10 pr-10 text-left text-sm transition focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 appearance-none cursor-pointer"
            >
              <option value="">Search by name or ID</option>
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.month && (
            <p className="text-sm text-red-600 mt-1">{errors.month}</p>
          )}
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <label className="block text-sm font-semibold text-gray-700">
            Year <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
            <input
              id="year"
              type="number"
              value={year}
              onChange={(e) => onYearChange(e.target.value)}
              placeholder="Search by name or ID"
              min="2000"
              max="2100"
              className="relative w-full h-9 rounded-md border border-gray-300 bg-white px-3 py-1.5 pl-10 pr-10 text-left text-sm transition focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
            <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.year && (
            <p className="text-sm text-red-600 mt-1">{errors.year}</p>
          )}
        </div>
      </div>
    </div>
  )
}

