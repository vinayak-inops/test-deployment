"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Label } from "@repo/ui/components/ui/label"
import { X, CalendarDays } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import SingleSelectField from "@/components/fields/single-select-field"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"

export type DefaultWeekOffItem = {
  parseID?: string
  week: number
  weekOff: number[]
}

const WEEK_OPTIONS = [
  { value: "1", label: "Week 1" },
  { value: "2", label: "Week 2" },
  { value: "3", label: "Week 3" },
  { value: "4", label: "Week 4" },
]

const DAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
]

type Props = {
  open: boolean
  isViewMode?: boolean
  initialItem: DefaultWeekOffItem | null
  usedWeeks: number[]
  onClose: () => void
  onSubmit: (item: DefaultWeekOffItem) => void
  tenantCode?: string
  rowId?: string | null
}

export default function DefaultWeekOffsFormPopup({
  open,
  isViewMode,
  initialItem,
  usedWeeks,
  onClose,
  onSubmit,
  tenantCode: propTenantCode,
  rowId,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode
  const pendingItemRef = useRef<DefaultWeekOffItem | null>(null)

  const [week, setWeek] = useState<number>(1)
  const [weekOff, setWeekOff] = useState<number[]>([])
  const [weekError, setWeekError] = useState("")

  const { post: postWeekOff, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          if (fieldName === "week" || fieldName.toLowerCase().includes("week")) {
            setWeekError(message)
          }
        })
        return
      }
      if (pendingItemRef.current) {
        onSubmit(pendingItemRef.current)
        pendingItemRef.current = null
      }
    },
    onError: () => {
      toast.error("Week off submission failed!")
    },
  })

  useEffect(() => {
    if (!open) return
    if (initialItem) {
      setWeek(initialItem.week)
      setWeekOff(initialItem.weekOff)
    } else {
      const firstAvailable = [1, 2, 3, 4].find((w) => !usedWeeks.includes(w)) ?? 1
      setWeek(firstAvailable)
      setWeekOff([])
    }
    setWeekError("")
  }, [open, initialItem, usedWeeks])

  if (!open) return null

  const toggleDay = (day: number) => {
    if (isViewMode) return
    setWeekOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const availableWeekOptions = initialItem
    ? WEEK_OPTIONS
    : WEEK_OPTIONS.filter((o) => !usedWeeks.includes(Number(o.value)))

  const handleSubmit = () => {
    if (!week) { setWeekError("Please select a week"); return }
    setWeekError("")

    const item: DefaultWeekOffItem = {
      parseID: initialItem?.parseID || crypto.randomUUID(),
      week,
      weekOff: [...weekOff].sort((a, b) => a - b),
    }
    pendingItemRef.current = item

    const { parseID: _parseID, ...payloadWithoutParseID } = item
    const serverPayload = initialItem ? item : payloadWithoutParseID

    postWeekOff({
      tenant: tenantCode,
      action: "update",
      collectionName: "employee_category_setting",
      event: "validate",
      id: rowId,
      ruleId: "employeeCategorySettingDefaultWeekOffsValidator",
      data: {
        defaultWeekOffs: [serverPayload],
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialItem ? "Edit Week Off" : "Add Week Off"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Configure weekly off days.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          <SubFormTitle title="Week Off Configuration" />

          <div className="space-y-2">
            <SingleSelectField
              label="Week"
              placeholder="Select Week"
              value={String(week)}
              onChange={(v) => { setWeek(Number(v)); setWeekError("") }}
              options={availableWeekOptions}
              required
              disabled={isViewMode || Boolean(initialItem)}
            />
            {weekError && <p className="text-red-500 text-xs">{weekError}</p>}
          </div>

          <div className="space-y-2">
            <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
              Off Days
            </Label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {DAY_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-md border ${
                    weekOff.includes(value)
                      ? "border-blue-300 bg-blue-50 text-blue-800"
                      : "border-gray-200 bg-white"
                  } ${isViewMode ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:border-blue-200 hover:bg-blue-50/50"}`}
                >
                  <input
                    type="checkbox"
                    checked={weekOff.includes(value)}
                    onChange={() => toggleDay(value)}
                    disabled={isViewMode}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            onClick={onClose}
            disabled={postLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={Boolean(isViewMode) || postLoading}
            onClick={handleSubmit}
          >
            {postLoading ? "Saving..." : initialItem ? "Save" : "Add Row"}
          </Button>
        </div>
      </div>
    </div>
  )
}
