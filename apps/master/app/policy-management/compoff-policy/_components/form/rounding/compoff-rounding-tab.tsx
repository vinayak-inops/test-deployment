"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { AlertTriangle, RotateCcw } from "lucide-react"
import ActionDataTable, {
  type ActionTableColumn,
  type ActionTableSearchField,
} from "@/components/common/action-data-table"
import CompOffRoundingFormPopup, { type CompOffRoundingItem } from "./compoff-rounding-form-popup"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

type Props = {
  value: CompOffRoundingItem[]
  isViewMode: boolean
  error?: string
  onChange: (rows: CompOffRoundingItem[]) => void
  mode?: "add" | "edit" | "view"
  rowId?: string | null
  tenantCode?: string
}

export default function CompOffRoundingTab({
  value,
  isViewMode,
  error,
  onChange,
  mode = "add",
  rowId = null,
  tenantCode: propTenantCode,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode

  const [open, setOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [rows, setRows] = useState<CompOffRoundingItem[]>(() => Array.isArray(value) ? value : [])

  const canFetch = Boolean(rowId) && mode !== "add"

  const searchCriteria = useMemo(() => {
    if (!canFetch) return []
    const criteria: Array<{ field: string; operator: string; value: any }> = [
      { field: "_id", operator: "eq", value: rowId },
    ]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "eq", value: tenantCode })
    return criteria
  }, [canFetch, rowId, tenantCode])

  const { loading, refetch } = useRequest<any[]>({
    url: "compoff_policy/search",
    method: "POST",
    data: searchCriteria,
    dependencies: [searchCriteria],
    enabled: canFetch,
    onSuccess: (data: any[]) => {
      const record = Array.isArray(data) && data.length > 0 ? data[0] : null
      const rounding = Array.isArray(record?.compOffPolicy?.rounding) ? record.compOffPolicy.rounding : []
      const normalized = rounding.map((item: any, index: number) => ({
        parseID: item?.parseID || `compoff-rounding-${index}`,
        from: Number(item?.from ?? 0),
        to: Number(item?.to ?? 0),
        roundOffTo: Number(item?.roundOffTo ?? 0),
      }))
      setRows(normalized)
      onChange(normalized)
    },
  })

  useEffect(() => {
    if (canFetch) void refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, tenantCode])

  useEffect(() => {
    if (canFetch) return
    setRows(Array.isArray(value) ? value : [])
  }, [canFetch, value])

  const initialItem = useMemo(
    () => (editIndex !== null ? (rows[editIndex] ?? null) : null),
    [editIndex, rows],
  )

  const columns = useMemo<ActionTableColumn<CompOffRoundingItem>[]>(
    () => [
      { key: "slNo", label: "SL", render: (_row, index) => index + 1 },
      { key: "from", label: "From", render: (row) => row.from },
      { key: "to", label: "To", render: (row) => row.to },
      { key: "roundOffTo", label: "Round Off To", render: (row) => row.roundOffTo },
    ],
    [],
  )

  const searchFields = useMemo<ActionTableSearchField<CompOffRoundingItem>[]>(
    () => [
      { value: "from", label: "From", getValue: (row) => String(row.from ?? "") },
      { value: "to", label: "To", getValue: (row) => String(row.to ?? "") },
      {
        value: "roundOffTo",
        label: "Round Off To",
        getValue: (row) => String(row.roundOffTo ?? ""),
      },
    ],
    [],
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <RotateCcw className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Comp-Off Rounding ({rows?.length ?? 0})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or update rounding configuration.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-600">Loading rounding data...</div>
        ) : (
          <ActionDataTable<CompOffRoundingItem>
            rows={rows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField="from"
            isViewMode={isViewMode}
            onAdd={!isViewMode ? () => { setEditIndex(null); setOpen(true) } : undefined}
            addButtonLabel="Add Row"
            onEdit={!isViewMode ? (index) => { setEditIndex(index); setOpen(true) } : undefined}
            onDelete={!isViewMode ? setDeleteIndex : undefined}
            getRowKey={(row, index) => `${row.parseID || "rounding"}-${index}`}
            emptyTitle="No rounding configured"
            emptyDescription='Use "Add Row" to set from, to, and round off to values.'
          />
        )}
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>

      <CompOffRoundingFormPopup
        open={open && !isViewMode}
        isViewMode={isViewMode}
        initialItem={initialItem}
        tenantCode={tenantCode}
        rowId={rowId}
        onClose={() => { setEditIndex(null); setOpen(false) }}
        onSubmit={(item) => {
          const nextRows =
            editIndex !== null
              ? rows.map((x, idx) => (idx === editIndex ? item : x))
              : [...rows, item]
          setRows(nextRows)
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
                <h3 className="text-sm font-semibold text-red-900">Remove rounding row</h3>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Are you sure you want to remove this row?
                </p>
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
                  const nextRows = rows.filter((_, idx) => idx !== deleteIndex)
                  setRows(nextRows)
                  onChange(nextRows)
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
