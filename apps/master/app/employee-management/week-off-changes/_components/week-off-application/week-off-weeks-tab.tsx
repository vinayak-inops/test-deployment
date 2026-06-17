"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Label } from "@repo/ui/components/ui/label"
import { AlertTriangle, CalendarDays, X } from "lucide-react"
import ActionDataTable, {
  type ActionTableColumn,
  type ActionTableSearchField,
} from "@/components/common/action-data-table"
import SingleSelectField from "@/components/fields/single-select-field"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"
import type { WeekOffItem } from "../schemas/week-off-application-schema"

const DAY_LABELS: Record<number, string> = {
  1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun",
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
] as const

type Props = {
  rows: WeekOffItem[]
  isViewMode: boolean
  onChange: (rows: WeekOffItem[]) => void
  rowId?: string | null
  tenantCode?: string
}

export default function WeekOffWeeksTab({ rows, isViewMode, onChange, rowId, tenantCode: propTenantCode }: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode

  const [open, setOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const [week, setWeek] = useState<number>(1)
  const [weekOff, setWeekOff] = useState<number[]>([])
  const [weekError, setWeekError] = useState("")

  const pendingNextRowsRef = useRef<WeekOffItem[] | null>(null)

  const sortedRows = useMemo(() => [...rows].sort((a, b) => a.week - b.week), [rows])

  const usedWeeks = useMemo(
    () => rows.filter((_, idx) => idx !== editIndex).map((r) => r.week),
    [rows, editIndex],
  )

  const availableWeekOptions =
    editIndex !== null
      ? WEEK_OPTIONS
      : WEEK_OPTIONS.filter((o) => !usedWeeks.includes(Number(o.value)))

  const columns = useMemo<ActionTableColumn<WeekOffItem>[]>(
    () => [
      { key: "slNo", label: "SL", render: (_row, index) => index + 1 },
      { key: "week", label: "Week", render: (row) => `Week ${row.week}` },
      {
        key: "weekOff",
        label: "Off Days",
        render: (row) =>
          row.weekOff.length > 0
            ? row.weekOff
                .slice()
                .sort((a, b) => a - b)
                .map((d) => DAY_LABELS[d] ?? d)
                .join(", ")
            : "—",
      },
    ],
    [],
  )

  const searchFields = useMemo<ActionTableSearchField<WeekOffItem>[]>(
    () => [{ value: "week", label: "Week", getValue: (row) => `Week ${row.week}` }],
    [],
  )

  // ── POST / server validation ───────────────────────────────────────────────

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
      if (pendingNextRowsRef.current) {
        onChange(pendingNextRowsRef.current)
        pendingNextRowsRef.current = null
      }
      closePopup()
    },
    onError: () => {
      toast.error("Week off validation failed")
    },
  })

  const openAdd = () => {
    const firstAvailable = [1, 2, 3, 4].find((w) => !rows.map((r) => r.week).includes(w)) ?? 1
    setWeek(firstAvailable)
    setWeekOff([])
    setWeekError("")
    setEditIndex(null)
    setOpen(true)
  }

  const openEdit = (sortedIdx: number) => {
    const item = sortedRows[sortedIdx]
    if (!item) return
    const origIdx = item.parseID
      ? rows.findIndex((r) => r.parseID === item.parseID)
      : rows.findIndex((r) => r.week === item.week)
    setWeek(item.week)
    setWeekOff(item.weekOff ?? [])
    setWeekError("")
    setEditIndex(origIdx)
    setOpen(true)
  }

  const closePopup = () => {
    setOpen(false)
    setEditIndex(null)
    setWeekError("")
  }

  const toggleDay = (day: number) => {
    setWeekOff((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handlePopupSubmit = () => {
    if (!week) { setWeekError("Please select a week"); return }
    setWeekError("")

    const existingParseID = editIndex !== null ? rows[editIndex]?.parseID : undefined
    const item: WeekOffItem = {
      parseID: existingParseID || crypto.randomUUID(),
      week,
      weekOff: [...weekOff].sort((a, b) => a - b),
    }

    const nextRows =
      editIndex !== null
        ? rows.map((x, idx) => (idx === editIndex ? item : x))
        : [...rows, item]

    // Edit replaces an existing week — skip duplicate-check validation and apply directly
    if (editIndex !== null) {
      onChange(nextRows)
      closePopup()
      return
    }

    pendingNextRowsRef.current = nextRows

    const { parseID: _parseID, ...payloadWithoutParseID } = item

    postWeekOff({
      tenant:         tenantCode,
      action:         "update",
      collectionName: "weekOffChanges",
      event:          "validate",
      id:             rowId,
      ruleId:         "weekOffChangesWeekOffsValidator",
      data: {
        weekOffs: [payloadWithoutParseID],
      },
    })
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <CalendarDays className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Week Offs ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Configure week-off days for each week.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<WeekOffItem>
          rows={sortedRows}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField="week"
          isViewMode={isViewMode}
          onAdd={!isViewMode && rows.length < 4 ? openAdd : undefined}
          addButtonLabel="Add Week"
          onEdit={!isViewMode ? openEdit : undefined}
          onDelete={
            !isViewMode
              ? (sortedIdx) => {
                  const item = sortedRows[sortedIdx]
                  if (!item) return
                  const origIdx = item.parseID
                    ? rows.findIndex((r) => r.parseID === item.parseID)
                    : rows.findIndex((r) => r.week === item.week)
                  setDeleteIndex(origIdx)
                }
              : undefined
          }
          getRowKey={(row, index) => `week-${row.week}-${index}`}
          emptyTitle="No week offs configured"
          emptyDescription='Use "Add Week" to add week-off days.'
        />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {editIndex !== null ? "Edit Week Off" : "Add Week Off"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">Configure weekly off days.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePopup}
                disabled={postLoading}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-2">
                <SingleSelectField
                  label="Week"
                  placeholder="Select Week"
                  value={String(week)}
                  onChange={(v) => { setWeek(Number(v)); setWeekError("") }}
                  options={availableWeekOptions}
                  required
                  disabled={editIndex !== null}
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
                      className={`flex items-center gap-2 text-sm text-gray-700 px-3 py-2 rounded-md border cursor-pointer ${
                        weekOff.includes(value)
                          ? "border-blue-300 bg-blue-50 text-blue-800"
                          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={weekOff.includes(value)}
                        onChange={() => toggleDay(value)}
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
                disabled={postLoading}
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                onClick={closePopup}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={postLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handlePopupSubmit}
              >
                {postLoading ? "Validating..." : editIndex !== null ? "Save" : "Add Row"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove week off</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this row?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  onChange(rows.filter((_, idx) => idx !== deleteIndex))
                  setDeleteIndex(null)
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
