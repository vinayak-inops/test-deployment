"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { FileText } from "lucide-react"
import type { SalaryHeadItem } from "../../schemas/salary-head.schema"
import SalaryHeadsFormPopup from "./salary-heads-form-popup"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"

type Props = {
  value: SalaryHeadItem[]
  isViewMode: boolean
  error?: string
  onChange: (next: SalaryHeadItem[]) => void
  mode?: "add" | "edit" | "view"
  rowId?: string | null
  tenantCode?: string
}

export default function SalaryHeadsSectionTable({
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
  const [rows, setRows] = useState<SalaryHeadItem[]>(value || [])

  const canFetchSalaryHeads = Boolean(rowId) && mode !== "add"
  const criteriaRequests = useMemo(() => {
    if (!rowId) return []
    const criteria: any[] = [{ field: "_id", operator: "eq", value: rowId }]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "is", value: tenantCode })
    return criteria
  }, [rowId, tenantCode])

  const { arrayData: fetchedSalaryHeads, loading, refetch } = useAggregateArrayFetch<any>({
    collection: "wageMinimumWages",
    criteriaRequests,
    arrayField: "salaryHeads",
    enabled: canFetchSalaryHeads,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchSalaryHeads) return
    void refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchSalaryHeads, tenantCode])

  useEffect(() => {
    if (!canFetchSalaryHeads) return
    if (!Array.isArray(fetchedSalaryHeads)) return
    const normalized = fetchedSalaryHeads.map((item: any, index: number) => ({
      parseID: item?.parseID || `salary-head-${index}`,
      salaryHeadCode: item?.salaryHeadCode || "",
      salaryHeadName: item?.salaryHeadName || "",
      amount: Number(item?.amount || 0),
    }))
    setRows(normalized)
    onChange(normalized)
  }, [canFetchSalaryHeads, fetchedSalaryHeads, onChange])

  useEffect(() => {
    if (canFetchSalaryHeads) return
    setRows(value || [])
  }, [canFetchSalaryHeads, value])

  const initialValue = useMemo(() => (editIndex !== null ? rows[editIndex] ?? null : null), [editIndex, rows])
  const columns = useMemo<ActionTableColumn<SalaryHeadItem>[]>(() => [
    { key: "salaryHeadCode", label: "Salary Head Code", render: (row) => row.salaryHeadCode || "-" },
    { key: "salaryHeadName", label: "Salary Head Name", render: (row) => row.salaryHeadName || "-" },
    { key: "amount", label: "Amount", render: (row) => <Badge className="bg-blue-100 text-blue-800">Rs {row.amount ?? 0}</Badge> },
  ], [])
  const searchFields = useMemo<ActionTableSearchField<SalaryHeadItem>[]>(() => [
    { value: "salaryHeadCode", label: "Salary Head Code", getValue: (row) => row.salaryHeadCode || "" },
    { value: "salaryHeadName", label: "Salary Head Name", getValue: (row) => row.salaryHeadName || "" },
  ], [])
  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg"><FileText className="h-4 w-4 text-blue-600" /></div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Salary Heads ({rows.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit salary heads in the popup.</p>
        </div>
      </div>
      <div className="px-6 py-4 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-600">Loading salary heads...</div>
        ) : (
          <ActionDataTable<SalaryHeadItem>
            rows={rows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"salaryHeadCode"}
            isViewMode={isViewMode}
            onAdd={!isViewMode ? () => { setEditIndex(null); setOpen(true) } : undefined}
            addButtonLabel="Add Salary Head"
            onEdit={!isViewMode ? (index) => { setEditIndex(index); setOpen(true) } : undefined}
            onDelete={!isViewMode ? setDeleteIndex : undefined}
            getRowKey={(row, index) => `${row.parseID || "salary-head"}-${index}`}
            emptyTitle="No salary heads added yet."
            emptyDescription="Use Add Salary Head to add details."
          />
        )}
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
      <SalaryHeadsFormPopup
        open={open}
        isViewMode={isViewMode}
        initialValue={initialValue}
        tenantCode={tenantCode}
        rowId={rowId}
        onClose={() => setOpen(false)}
        onSubmit={(item) => {
          const nextRows = editIndex !== null ? rows.map((x, idx) => (idx === editIndex ? item : x)) : [...rows, item]
          setRows(nextRows)
          onChange(nextRows)
          setOpen(false)
        }}
      />
      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg"><FileText className="h-4 w-4 text-red-600" /></div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove salary head</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this salary head?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>Cancel</Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { const nextRows = rows.filter((_, idx) => idx !== deleteIndex); setRows(nextRows); onChange(nextRows); setDeleteIndex(null) }}>Remove</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
