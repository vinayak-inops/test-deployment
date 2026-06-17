"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Calendar, X, ChevronLeft, ChevronRight } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { getCurrentTimeIST } from "@/utils/time/time-control"
import {
  weekOffApplicationSchema,
  type WeekOffItem,
  type WeekOffApplication,
} from "../../schemas/week-off-application-schema"

// 1 = Monday, 2 = Tuesday, ... 7 = Sunday
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

const DAY_NUM_FROM_JS = [7, 1, 2, 3, 4, 5, 6] as const

function parseLocalDate(value: string) {
  if (!value) return null
  const [y, m, d] = value.split("-").map((v) => Number(v))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toDateLabel(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function buildDateRange(from: string, to: string) {
  const fromDate = parseLocalDate(from)
  const toDate = parseLocalDate(to)
  if (!fromDate || !toDate || toDate < fromDate) return []
  const out: { iso: string; dayName: string; dayNum: number }[] = []
  const cur = new Date(fromDate)
  const end = new Date(toDate)
  while (cur <= end) {
    const dayNum = DAY_NUM_FROM_JS[cur.getDay()]
    out.push({ iso: toDateLabel(cur), dayName: DAY_NAMES[dayNum - 1], dayNum })
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

function buildMonthSection(month: number, year: number, from: string, to: string) {
  const start = parseLocalDate(from)
  const end = parseLocalDate(to)
  if (!start || !end || end < start) return null
  const label = `${MONTH_NAMES[month]} ${year}`
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayJs = new Date(year, month, 1).getDay()
  const firstDayIndex = (firstDayJs + 6) % 7 // Monday=0

  const cells: Array<{ iso: string; day: number; dayName: string; inRange: boolean } | null> = []
  for (let i = 0; i < firstDayIndex; i += 1) cells.push(null)

  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(year, month, day)
    const iso = toDateLabel(d)
    const inRange = d >= start && d <= end
    const dayNum = DAY_NUM_FROM_JS[d.getDay()]
    const dayName = DAY_SHORT[dayNum - 1]
    cells.push({ iso, day, dayName, inRange })
  }

  return { label, year, month, cells }
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

interface WeekOffFormPopupProps {
  open: boolean
  onClose: () => void
  /** null = Add mode, otherwise Edit mode with this week off */
  initialWeekOff: WeekOffItem | null
  existingWeekOffs?: WeekOffItem[]
  onSubmit: (payload: WeekOffApplication) => void
  fromDate?: string | null
  toDate?: string | null
  employeeId?: string | null
}

export function WeekOffFormPopup({
  open,
  onClose,
  initialWeekOff,
  existingWeekOffs = [],
  onSubmit,
  fromDate,
  toDate,
  employeeId,
}: WeekOffFormPopupProps) {
  const [formFromDate, setFormFromDate] = useState("")
  const [formToDate, setFormToDate] = useState("")
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [popupShowErrors, setPopupShowErrors] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number } | null>(null)

  useEffect(() => {
    if (open) {
      if (initialWeekOff) {
        setFormFromDate(fromDate ?? "")
        setFormToDate(toDate ?? "")
      } else {
        setFormFromDate("")
        setFormToDate("")
      }
      setSelectedDates([])
      setPopupShowErrors(false)
    }
  }, [open, initialWeekOff, fromDate, toDate])

  const dateItems = useMemo(
    () => buildDateRange(formFromDate.trim(), formToDate.trim()),
    [formFromDate, formToDate],
  )
  const activeMonth = useMemo(() => {
    if (!currentMonth) return null
    return buildMonthSection(currentMonth.month, currentMonth.year, formFromDate.trim(), formToDate.trim())
  }, [currentMonth, formFromDate, formToDate])
  const dateItemsByIso = useMemo(() => {
    const map = new Map<string, { iso: string; dayName: string; dayNum: number }>()
    dateItems.forEach((d) => map.set(d.iso, d))
    return map
  }, [dateItems])

  useEffect(() => {
    if (!dateItems.length) return
    if (!existingWeekOffs.length) return
    const next: string[] = []
    let weekNum = 1
    let segStart = 0
    for (let i = 0; i < dateItems.length; i += 1) {
      if (dateItems[i].dayNum === 7 || i === dateItems.length - 1) {
        const segEnd = i
        const segment = dateItems.slice(segStart, segEnd + 1)
        const weekEntry = existingWeekOffs.find((w) => w.week === weekNum)
        if (weekEntry) {
          segment.forEach((d) => {
            if (weekEntry.weekOff.includes(d.dayNum)) {
              next.push(d.iso)
            }
          })
        }
        segStart = i + 1
        weekNum += 1
      }
    }
    setSelectedDates(next)
  }, [dateItems, existingWeekOffs])

  useEffect(() => {
    if (!initialWeekOff) {
      setSelectedDates([])
    }
  }, [formFromDate, formToDate, initialWeekOff])

  useEffect(() => {
    if (!formFromDate || !formToDate) {
      setCurrentMonth(null)
      return
    }
    const start = parseLocalDate(formFromDate)
    if (!start) return
    setCurrentMonth({ year: start.getFullYear(), month: start.getMonth() })
  }, [formFromDate, formToDate])


  const toggleDate = (iso: string) => {
    if (!dateItemsByIso.has(iso)) return
    setSelectedDates((prev) => {
      const isSelected = prev.includes(iso)
      const next = isSelected ? prev.filter((d) => d !== iso) : [...prev, iso]
      return next
    })
  }

  const handleSubmit = () => {
    // Build weekOffs based on selected dates grouped by week segments
    // If a week already exists, update it instead of creating a duplicate.
    const baseMap = new Map<number, WeekOffItem>()
    const existingByWeek = new Map<number, WeekOffItem>()
    existingWeekOffs.forEach((w) => {
      if (!w?.week) return
      existingByWeek.set(w.week, w)
    })
    let weekNum = 1
    let segStart = 0
    for (let i = 0; i < dateItems.length; i += 1) {
      if (dateItems[i].dayNum === 7 || i === dateItems.length - 1) {
        const segEnd = i
        const segment = dateItems.slice(segStart, segEnd + 1)
        const dayNums = segment
          .filter((d) => selectedDates.includes(d.iso))
          .map((d) => d.dayNum)
        if (dayNums.length > 0) {
          baseMap.set(weekNum, {
            ...(existingByWeek.get(weekNum) ?? {}),
            week: weekNum,
            weekOff: Array.from(new Set(dayNums)).sort((a, b) => a - b),
          })
        } else {
          // If no days selected for this week, remove it
          baseMap.delete(weekNum)
        }
        segStart = i + 1
        weekNum += 1
      }
    }

    const mergedWeekOffs = Array.from(baseMap.values()).sort((a, b) => a.week - b.week)

    const result = weekOffApplicationSchema.safeParse({
      employeeID: employeeId ?? "",
      fromDate: formFromDate,
      toDate: formToDate,
      weekOffs: mergedWeekOffs,
      ...(initialWeekOff === null
        ? {
            createdBy: employeeId ?? "",
            createdOn: getCurrentTimeIST(),
          }
        : {}),
    })
    if (!result.success) {
      setPopupShowErrors(true)
      return
    }
    onSubmit(result.data)
    onClose()
  }

  const handleClose = () => {
    setPopupShowErrors(false)
    onClose()
  }

  const formValidation = weekOffApplicationSchema.safeParse({
    employeeID: employeeId ?? "",
    fromDate: formFromDate,
    toDate: formToDate,
    weekOffs: [],
  })
  const formErrors = formValidation.success ? {} : formValidation.error.flatten().fieldErrors
  const canSelectDays = Boolean(formFromDate.trim()) && Boolean(formToDate.trim())

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialWeekOff !== null ? "Edit Week Off" : "Add Week Off"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Set week number and select off days.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-3">
            <SubFormTitle title="Date Range" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  From Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formFromDate}
                  onChange={(e) => setFormFromDate(e.target.value)}
                  max={formToDate || undefined}
                  className={`${INPUT_CLASS} ${popupShowErrors && formErrors.fromDate ? "border-red-500" : ""}`}
                />
                {popupShowErrors && formErrors.fromDate && (
                  <p className="text-red-500 text-xs" role="alert">
                    {(formErrors.fromDate as string[])[0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  To Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formToDate}
                  onChange={(e) => setFormToDate(e.target.value)}
                  min={formFromDate || undefined}
                  className={`${INPUT_CLASS} ${popupShowErrors && formErrors.toDate ? "border-red-500" : ""}`}
                />
                {popupShowErrors && formErrors.toDate && (
                  <p className="text-red-500 text-xs" role="alert">
                    {(formErrors.toDate as string[])[0]}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <SubFormTitle title="Off Days" />
            <p className="text-gray-500 text-xs">Select the dates that are off for this week.</p>
            {!canSelectDays && (
              <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-4 text-center">
                <div className="mx-auto w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-gray-600" />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-800">Select from and to date first</p>
                <p className="mt-1 text-xs text-gray-500">
                  Choose the date range in Employee Info to enable week-off selection.
                </p>
              </div>
            )}
            {canSelectDays && activeMonth && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg">
                  <div className="px-3 py-2 border-b border-gray-100 text-sm font-semibold text-gray-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentMonth) return
                        const prev = new Date(currentMonth.year, currentMonth.month - 1, 1)
                        const start = parseLocalDate(formFromDate)
                        if (start && (isSameMonth(prev, start) || prev >= start)) {
                          setCurrentMonth({ year: prev.getFullYear(), month: prev.getMonth() })
                        }
                      }}
                      disabled={
                        !currentMonth ||
                        (parseLocalDate(formFromDate)
                          ? new Date(currentMonth.year, currentMonth.month - 1, 1) <
                            new Date(parseLocalDate(formFromDate)!.getFullYear(), parseLocalDate(formFromDate)!.getMonth(), 1)
                          : true)
                      }
                      className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div>{activeMonth.label}</div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentMonth) return
                        const next = new Date(currentMonth.year, currentMonth.month + 1, 1)
                        const end = parseLocalDate(formToDate)
                        if (end && (isSameMonth(next, end) || next <= end)) {
                          setCurrentMonth({ year: next.getFullYear(), month: next.getMonth() })
                        }
                      }}
                      disabled={
                        !currentMonth ||
                        (parseLocalDate(formToDate)
                          ? new Date(currentMonth.year, currentMonth.month + 1, 1) >
                            new Date(parseLocalDate(formToDate)!.getFullYear(), parseLocalDate(formToDate)!.getMonth(), 1)
                          : true)
                      }
                      className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 text-[11px] text-gray-500 px-2 py-2">
                    {DAY_SHORT.map((d) => (
                      <div key={d} className="text-center font-medium">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 px-2 pb-2">
                    {activeMonth.cells.map((cell, idx) => {
                      if (!cell) return <div key={`empty-${idx}`} />
                      const checked = selectedDates.includes(cell.iso)
                      const disabled = !cell.inRange
                      return (
                        <button
                          key={cell.iso}
                          type="button"
                          onClick={() => toggleDate(cell.iso)}
                          disabled={disabled}
                          className={[
                            "h-12 rounded-md border text-left px-2 py-1 transition-colors",
                            disabled ? "border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed" : "border-gray-200 hover:bg-gray-50",
                            checked ? "border-blue-500 bg-blue-50/60 text-blue-700" : "",
                          ].join(" ")}
                        >
                          <div className="text-sm font-semibold leading-none">{cell.day}</div>
                          <div className="text-[10px] text-gray-500">{cell.dayName}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
          >
            {initialWeekOff !== null ? "Save" : "Add Row"}
          </Button>
        </div>
      </div>
    </div>
  )
}
