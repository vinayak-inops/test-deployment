"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { AlertTriangle, FileText } from "lucide-react"
import type { SalaryHeadItem } from "../../schemas/salary-head.schema"
import SalaryHeadsFormPopup from "./salary-heads-form-popup"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

interface SalaryHeadsSectionTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  wageSalaryHeadId?: string | null
}

export default function SalaryHeadsSectionTable({
  addMode,
  editMode,
  deleteMode,
  wageSalaryHeadId,
}: SalaryHeadsSectionTableProps) {
  const tenantCode = useGetTenantCode()
  const [rows, setRows] = useState<SalaryHeadItem[]>([])
  const [open, setOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const pendingDeleteRowsRef = useRef<SalaryHeadItem[] | null>(null)

  const canFetch = Boolean(tenantCode && wageSalaryHeadId)

  const criteriaRequests = useMemo(() => {
    if (!wageSalaryHeadId) return []
    const criteria: any[] = [{ field: "_id", operator: "eq", value: wageSalaryHeadId }]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "eq", value: tenantCode })
    return criteria
  }, [wageSalaryHeadId, tenantCode])

  const { arrayData: fetchedRows, loading, refetch } = useAggregateArrayFetch<any>({
    collection: "wageSalaryTemplates",
    criteriaRequests,
    arrayField: "independentSalaryHeads",
    enabled: canFetch,
    defaultValue: [],
  })

  const { post: postDelete, loading: deleteLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async () => {
      if (pendingDeleteRowsRef.current) {
        setRows(pendingDeleteRowsRef.current)
        pendingDeleteRowsRef.current = null
      }
      setDeleteIndex(null)
      toast.success("Salary head removed successfully")
      await refetch()
    },
    onError: () => {
      pendingDeleteRowsRef.current = null
      toast.error("Failed to remove salary head")
    },
  })

  useEffect(() => {
    if (!canFetch) return
    void refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, tenantCode, wageSalaryHeadId])

  useEffect(() => {
    if (!Array.isArray(fetchedRows)) return
    setRows(fetchedRows)
  }, [fetchedRows])

  const initialValue = useMemo(
    () => (editIndex !== null ? rows[editIndex] ?? null : null),
    [editIndex, rows],
  )

  const columns = useMemo<ActionTableColumn<SalaryHeadItem>[]>(
    () => [
      { key: "salaryHeadCode", label: "Salary Head Code", render: (row) => row.salaryHeadCode || "-" },
      { key: "salaryHeadName", label: "Salary Head Name", render: (row) => row.salaryHeadName || "-" },
      {
        key: "amount",
        label: "Amount",
        render: (row) => <Badge className="bg-blue-100 text-blue-800">Rs {row.amount ?? 0}</Badge>,
      },
    ],
    [],
  )

  const searchFields = useMemo<ActionTableSearchField<SalaryHeadItem>[]>(
    () => [
      { value: "salaryHeadCode", label: "Code", getValue: (row) => row.salaryHeadCode || "" },
      { value: "salaryHeadName", label: "Name", getValue: (row) => row.salaryHeadName || "" },
    ],
    [],
  )

  const persistDelete = (nextRows: SalaryHeadItem[]) => {
    pendingDeleteRowsRef.current = nextRows
    postDelete?.({
      tenant: tenantCode,
      action: "update",
      id: wageSalaryHeadId,
      collectionName: "wageSalaryHeads",
      event: "validate",
      ruleId: "independentSalaryHeadsValidator",
      data: {
        independentSalaryHeads: nextRows,
      },
    })
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Independent Salary Heads ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete independent salary head records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading salary heads...</div>
        ) : (
          <ActionDataTable<SalaryHeadItem>
            rows={rows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField="salaryHeadCode"
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? () => { setEditIndex(null); setOpen(true) } : undefined}
            addButtonLabel="Add Salary Head"
            onEdit={editMode ? (index) => { setEditIndex(index); setOpen(true) } : undefined}
            onDelete={deleteMode ? setDeleteIndex : undefined}
            getRowKey={(row, index) => `${row.parseID || row.salaryHeadCode || "salary"}-${index}`}
            emptyTitle="No salary heads added yet."
            emptyDescription="Use Add Salary Head to create records."
          />
        )}
      </div>

      <SalaryHeadsFormPopup
        open={open}
        initialValue={initialValue}
        wageSalaryHeadId={wageSalaryHeadId}
        tenantCode={tenantCode}
        existingRows={rows}
        editIndex={editIndex}
        refetchRows={refetch}
        onClose={() => {
          setEditIndex(null)
          setOpen(false)
        }}
        onSubmit={(item) => {
          const nextRows =
            editIndex !== null
              ? rows.map((r, i) => (i === editIndex ? item : r))
              : [...rows, item]
          setRows(nextRows)
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
                <h3 className="text-sm font-semibold text-red-900">Remove salary head</h3>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Are you sure you want to remove this salary head?
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
                disabled={deleteLoading}
                onClick={() => {
                  persistDelete(rows.filter((_, i) => i !== deleteIndex))
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
