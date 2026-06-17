"use client"

import { useMemo, useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@repo/ui/components/ui/button"
import { AlertTriangle, CalendarDays } from "lucide-react"
import ActionDataTable, {
  type ActionTableColumn,
  type ActionTableSearchField,
} from "@/components/common/action-data-table"
import DefaultWeekOffsFormPopup, {
  type DefaultWeekOffItem,
} from "./default-week-offs-form-popup"

const DAY_NAMES: Record<number, string> = {
  1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun",
}

type Props = {
  rows: DefaultWeekOffItem[]
  isViewMode: boolean
  onChange: (rows: DefaultWeekOffItem[]) => void
  rowId?: string | null
  tenantCode?: string
}

export default function DefaultWeekOffsTab({ rows, isViewMode, onChange, rowId, tenantCode }: Props) {
  const [open, setOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const initialValue = useMemo(
    () => (editIndex !== null ? (rows[editIndex] ?? null) : null),
    [editIndex, rows],
  )

  const usedWeeks = useMemo(
    () =>
      rows
        .filter((_, idx) => idx !== editIndex)
        .map((r) => r.week),
    [rows, editIndex],
  )

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.week - b.week),
    [rows],
  )

  const columns = useMemo<ActionTableColumn<DefaultWeekOffItem>[]>(
    () => [
      { key: "slNo", label: "SL", render: (_row, index) => index + 1 },
      { key: "week", label: "Week", render: (row) => `Week ${row.week}` },
      {
        key: "weekOff",
        label: "Off Days",
        render: (row) =>
          row.weekOff.length > 0
            ? row.weekOff
                .sort((a, b) => a - b)
                .map((d) => DAY_NAMES[d] ?? d)
                .join(", ")
            : "—",
      },
    ],
    [],
  )

  const searchFields = useMemo<ActionTableSearchField<DefaultWeekOffItem>[]>(
    () => [
      { value: "week", label: "Week", getValue: (row) => `Week ${row.week}` },
    ],
    [],
  )

  const canAddMore = rows.length < 4

  const handleAdd = () => {
    if (!canAddMore) {
      toast.info("All 4 weeks are already configured. Edit or remove an existing entry.")
      return
    }
    setEditIndex(null)
    setOpen(true)
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <CalendarDays className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Default Week Offs ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Configure default week-off days for each week of the month.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<DefaultWeekOffItem>
          rows={sortedRows}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField="week"
          isViewMode={isViewMode}
          onAdd={!isViewMode ? handleAdd : undefined}
          addButtonLabel="Add Week"
          onEdit={
            !isViewMode
              ? (index) => {
                  const sorted = [...rows].sort((a, b) => a.week - b.week)
                  const originalIndex = rows.findIndex((r) => r.parseID === sorted[index]?.parseID)
                  setEditIndex(originalIndex)
                  setOpen(true)
                }
              : undefined
          }
          onDelete={
            !isViewMode
              ? (index) => {
                  const sorted = [...rows].sort((a, b) => a.week - b.week)
                  const originalIndex = rows.findIndex((r) => r.parseID === sorted[index]?.parseID)
                  setDeleteIndex(originalIndex)
                }
              : undefined
          }
          getRowKey={(row, index) => `${row.parseID || "weekoff"}-${index}`}
          emptyTitle="No week offs configured"
          emptyDescription='Use "Add Week" to configure week-off days for each week.'
        />
      </div>

      <DefaultWeekOffsFormPopup
        open={open && !isViewMode}
        isViewMode={isViewMode}
        initialItem={initialValue}
        usedWeeks={usedWeeks}
        tenantCode={tenantCode}
        rowId={rowId}
        onClose={() => { setEditIndex(null); setOpen(false) }}
        onSubmit={(item) => {
          const nextRows =
            editIndex !== null
              ? rows.map((x, idx) => (idx === editIndex ? item : x))
              : [...rows, item]
          onChange(nextRows)
          setEditIndex(null)
          setOpen(false)
        }}
      />

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
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>Cancel</Button>
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
