"use client"

import { useState } from "react"
import { Calendar, Info, FileText } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Textarea } from "@repo/ui/components/ui/textarea"

interface BasicInformationProps {
  extension: string
  fromDate: string
  toDate: string
  period: string
  reportTitle: string
  reportDescription: string
  onExtensionChange: (value: string) => void
  onFromDateChange: (value: string) => void
  onToDateChange: (value: string) => void
  onPeriodChange: (value: string) => void
  onReportTitleChange: (value: string) => void
  onReportDescriptionChange: (value: string) => void
  onSubmit: () => void
  isSubmitting?: boolean
}

export function BasicInformation({
  extension,
  fromDate,
  toDate,
  period,
  reportTitle,
  reportDescription,
  onExtensionChange,
  onFromDateChange,
  onToDateChange,
  onPeriodChange,
  onReportTitleChange,
  onReportDescriptionChange,
  onSubmit,
  isSubmitting = false,
}: BasicInformationProps) {
  // Error states for validation
  const [errors, setErrors] = useState({
    extension: "",
    fromDate: "",
    toDate: "",
    dateRange: "",
    period: "",
    reportTitle: "",
    reportDescription: "",
  })

  const periodOptions = [
    "This Week",
    "Last Week",
    "This Month",
    "Last Month",
    "This Quarter",
    "Last Quarter",
    "This Year",
    "Last Year",
    "Custom",
  ]

  const extensionOptions = [
    { value: "excel", label: "Excel (.xlsx)" },
    { value: "pdf", label: "PDF (.pdf)" }
  ]

  // Format local date (avoid timezone shifting with toISOString)
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Handle period change and auto-fill dates
  const handlePeriodChange = (value: string) => {
    onPeriodChange(value)
    
    // Clear period error if exists
    if (errors.period) {
      setErrors(prev => ({ ...prev, period: "" }))
    }

    // Auto-fill dates based on selection
    const rawToday = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let from = new Date(today)
    let to = new Date(today)

    switch(value) {
      case "This Week":
        // Start of current week (Sunday)
        const startOfWeekRaw = new Date(rawToday)
        startOfWeekRaw.setDate(rawToday.getDate() - rawToday.getDay())
        from = startOfWeekRaw
        to = rawToday
        // Use ISO format for week (matching reference behavior)
        onFromDateChange(from.toISOString().split('T')[0])
        onToDateChange(to.toISOString().split('T')[0])
        break
      case "Last Week":
        // Start of last week (Sunday)
        const lastWeekStart = new Date(rawToday)
        lastWeekStart.setDate(rawToday.getDate() - rawToday.getDay() - 7)
        from = lastWeekStart
        // End of last week (Saturday)
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6)
        to = lastWeekEnd
        onFromDateChange(formatLocalDate(from))
        onToDateChange(formatLocalDate(to))
        break
      case "This Month":
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        to = today
        onFromDateChange(formatLocalDate(from))
        onToDateChange(formatLocalDate(to))
        break
      case "Last Month":
        // First day of last month
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        // Last day of last month
        to = new Date(today.getFullYear(), today.getMonth(), 0)
        onFromDateChange(formatLocalDate(from))
        onToDateChange(formatLocalDate(to))
        break
      case "This Quarter":
        const quarter = Math.floor(today.getMonth() / 3)
        from = new Date(today.getFullYear(), quarter * 3, 1)
        to = today
        onFromDateChange(formatLocalDate(from))
        onToDateChange(formatLocalDate(to))
        break
      case "Last Quarter":
        const currentQuarter = Math.floor(today.getMonth() / 3)
        const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1
        const lastQuarterYear = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear()
        from = new Date(lastQuarterYear, lastQuarter * 3, 1)
        // Last day of last quarter
        to = new Date(lastQuarterYear, (lastQuarter + 1) * 3, 0)
        onFromDateChange(formatLocalDate(from))
        onToDateChange(formatLocalDate(to))
        break
      case "This Year":
        from = new Date(today.getFullYear(), 0, 1)
        to = today
        onFromDateChange(formatLocalDate(from))
        onToDateChange(formatLocalDate(to))
        break
      case "Last Year":
        from = new Date(today.getFullYear() - 1, 0, 1)
        to = new Date(today.getFullYear() - 1, 11, 31)
        onFromDateChange(formatLocalDate(from))
        onToDateChange(formatLocalDate(to))
        break
      case "Custom":
        // Keep existing dates or clear them - don't auto-fill
        break
    }
  }

  const validateForm = () => {
    // Clear previous errors
    setErrors({
      extension: "",
      fromDate: "",
      toDate: "",
      dateRange: "",
      period: "",
      reportTitle: "",
      reportDescription: "",
    })

    let hasErrors = false
    const newErrors = {
      extension: "",
      fromDate: "",
      toDate: "",
      dateRange: "",
      period: "",
      reportTitle: "",
      reportDescription: "",
    }

    // Validate required fields
    if (!extension) {
      newErrors.extension = "File extension is required"
      hasErrors = true
    }

    if (!fromDate) {
      newErrors.fromDate = "From date is required"
      hasErrors = true
    }

    if (!toDate) {
      newErrors.toDate = "To date is required"
      hasErrors = true
    }

    if (!period) {
      newErrors.period = "Period is required"
      hasErrors = true
    }

    if (!reportTitle || reportTitle.trim() === "") {
      newErrors.reportTitle = "Report title is required"
      hasErrors = true
    }

    // Validate date range
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      newErrors.dateRange = "From date cannot be later than to date"
      hasErrors = true
    }

    // Validate future dates (using local date format to avoid timezone issues)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = formatLocalDate(today)

    if (fromDate && fromDate > todayStr) {
      newErrors.fromDate = "From date cannot be in the future"
      hasErrors = true
    }

    if (toDate && toDate > todayStr) {
      newErrors.toDate = "To date cannot be in the future"
      hasErrors = true
    }

    if (hasErrors) {
      setErrors(newErrors)
      return false
    }

    return true
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit()
    }
  }

  const isFormValid = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = formatLocalDate(today)
    
    return (
      extension &&
      fromDate &&
      toDate &&
      period &&
      reportTitle &&
      new Date(fromDate) <= new Date(toDate) &&
      fromDate <= todayStr &&
      toDate <= todayStr
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto space-y-6 mt-6 pb-6">
          {/* Unified Form: Report Information */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-0">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Report Information</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Complete report details including date range, format, and description
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 space-y-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            {/* 1. Date Range Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Date Range</h3>
                <p className="text-sm text-gray-500 mt-1">Select the time period for the report generation</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Period */}
                <div className="space-y-2">
                  <Label htmlFor="period" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Period <span className="text-red-500 normal-case">*</span>
                  </Label>
                  <Select 
                    value={period} 
                    onValueChange={handlePeriodChange}
                  >
                    <SelectTrigger 
                      id="period" 
                      className={`h-9 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition ${
                        errors.period 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border border-gray-200 bg-white">
                      {periodOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.period ? (
                    <p className="text-red-500 text-xs mt-1">{errors.period}</p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1">(Required)</p>
                  )}
                </div>

                {/* From Date */}
                <div className="space-y-2">
                  <Label htmlFor="fromDate" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    From Date <span className="text-red-500 normal-case">*</span>
                  </Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      onFromDateChange(e.target.value)
                      if (errors.fromDate) {
                        setErrors(prev => ({ ...prev, fromDate: "" }))
                      }
                      if (errors.dateRange) {
                        setErrors(prev => ({ ...prev, dateRange: "" }))
                      }
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    className={`h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition ${
                      errors.fromDate 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                        : ""
                    }`}
                  />
                  {errors.fromDate ? (
                    <p className="text-red-500 text-xs mt-1">{errors.fromDate}</p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1">Format: YYYY-MM-DD (e.g., 2025-12-30)</p>
                  )}
                </div>

                {/* To Date */}
                <div className="space-y-2">
                  <Label htmlFor="toDate" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    To Date <span className="text-red-500 normal-case">*</span>
                  </Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      onToDateChange(e.target.value)
                      if (errors.toDate) {
                        setErrors(prev => ({ ...prev, toDate: "" }))
                      }
                      if (errors.dateRange) {
                        setErrors(prev => ({ ...prev, dateRange: "" }))
                      }
                    }}
                    min={fromDate || undefined}
                    max={new Date().toISOString().split('T')[0]}
                    className={`h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition ${
                      errors.toDate 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                        : ""
                    }`}
                  />
                  {errors.toDate ? (
                    <p className="text-red-500 text-xs mt-1">{errors.toDate}</p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1">Format: YYYY-MM-DD (e.g., 2025-12-30)</p>
                  )}
                </div>
              </div>

              {/* Date Range Error */}
              {errors.dateRange && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <Info className="h-4 w-4" />
                  {errors.dateRange}
                </div>
              )}
              
              {/* Info Message for Date Fields */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Info className="h-4 w-4" />
                Future dates are not allowed for these fields.
              </div>
            </div>

            {/* 2. Report Details Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Report Details</h3>
                <p className="text-sm text-gray-500 mt-1">Report title, format, and description information</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Report Title */}
                <div className="space-y-2">
                  <Label htmlFor="reportTitle" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Report Title <span className="text-red-500 normal-case">*</span>
                  </Label>
                  <Input
                    id="reportTitle"
                    type="text"
                    value={reportTitle}
                    onChange={(e) => {
                      onReportTitleChange(e.target.value)
                      if (errors.reportTitle) {
                        setErrors(prev => ({ ...prev, reportTitle: "" }))
                      }
                    }}
                    placeholder="Enter report title"
                    className={`h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition ${
                      errors.reportTitle 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                        : ""
                    }`}
                  />
                  {errors.reportTitle ? (
                    <p className="text-red-500 text-xs mt-1">{errors.reportTitle}</p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1">(Required)</p>
                  )}
                </div>

                {/* Extension */}
                <div className="space-y-2">
                  <Label htmlFor="extension" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Extension <span className="text-red-500 normal-case">*</span>
                  </Label>
                  <Select 
                    value={extension} 
                    onValueChange={(value) => {
                      onExtensionChange(value)
                      if (errors.extension) {
                        setErrors(prev => ({ ...prev, extension: "" }))
                      }
                    }}
                  >
                    <SelectTrigger 
                      id="extension" 
                      className={`h-9 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition ${
                        errors.extension 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select extension" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border border-gray-200 bg-white">
                      {extensionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.extension ? (
                    <p className="text-red-500 text-xs mt-1">{errors.extension}</p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1">(Required)</p>
                  )}
                </div>
              </div>

              {/* Report Description Field - Full Width */}
              <div className="space-y-2">
                <Label htmlFor="reportDescription" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Report Description
                </Label>
                <Textarea
                  id="reportDescription"
                  placeholder="Enter report description (optional)"
                  value={reportDescription}
                  onChange={(e) => {
                    onReportDescriptionChange(e.target.value)
                    if (errors.reportDescription) {
                      setErrors(prev => ({ ...prev, reportDescription: "" }))
                    }
                  }}
                  className={`w-full border border-gray-300 px-3 py-2 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 resize-none transition ${
                    errors.reportDescription 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                      : ""
                  }`}
                  rows={3}
                />
                {errors.reportDescription ? (
                  <p className="text-red-500 text-xs mt-1">{errors.reportDescription}</p>
                ) : (
                  <p className="text-gray-500 text-xs mt-1">(Optional)</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
        </div>
      </div>

      {/* Unified Save Button - Sticky to bottom */}
      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 shadow-lg p-6 z-50 mt-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              className="w-[71%] h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

