"use client"

import { useEffect, useMemo, useState } from "react"
import { Link2 } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import DependentSalaryHeadsFormPopup from "./dependent-salary-heads-form-popup"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type Mode = "add" | "edit" | "view"
type SearchField = "value"

type DependentSalaryHeadRow = {
  value: string
}

interface DependentSalaryHeadsSectionTableProps {
  mode: Mode
  rowId?: string | null
  tenantCode?: string
  onSaved?: () => Promise<void> | void
}

export default function DependentSalaryHeadsSectionTable({
  mode,
  rowId,
  tenantCode: propTenantCode,
  onSaved,
}: DependentSalaryHeadsSectionTableProps) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode

  const isViewMode = mode === "view"
  const canEdit = mode === "edit"
  const canAdd = mode === "edit"
  const canDelete = mode === "edit"

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [initialValue, setInitialValue] = useState<string | null>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [dependentHeads, setDependentHeads] = useState<string[]>([])

  const criteriaRequests = useMemo(
    () =>
      tenantCode && rowId
        ? [
            { field: "tenantCode", operator: "eq", value: tenantCode },
            { field: "_id", operator: "eq", value: rowId },
          ]
        : [],
    [tenantCode, rowId],
  )

  const {
    arrayData: dependentHeadsArray,
    loading: dependentHeadsLoading,
    refetch: refetchDependentHeads,
  } = useAggregateArrayFetch<string>({
    collection: "employeeWageTemplate",
    criteriaRequests,
    arrayField: "dependentSalaryHeads",
    enabled: Boolean(tenantCode && rowId),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode || !rowId) return
    void refetchDependentHeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode, rowId])

  useEffect(() => {
    if (!Array.isArray(dependentHeadsArray)) return
    setDependentHeads(dependentHeadsArray)
  }, [dependentHeadsArray])

  const { post: postDelete } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        toast.error("Failed to delete dependent salary head")
        return
      }
      toast.success("Dependent salary head deleted successfully!")
      await refetchDependentHeads()
      await onSaved?.()
    },
    onError: () => {
      toast.error("Failed to delete dependent salary head!")
    },
  })

  const displayedRows = useMemo<DependentSalaryHeadRow[]>(
    () => [...dependentHeads].reverse().map((value) => ({ value })),
    [dependentHeads],
  )
  const toOriginalIndex = (displayIndex: number) => dependentHeads.length - 1 - displayIndex

  const openAdd = () => {
    setInitialValue(null)
    setEditIndex(null)
    setIsDrawerOpen(true)
  }

  const columns = useMemo<ActionTableColumn<DependentSalaryHeadRow>[]>(
    () => [
      {
        key: "value",
        label: "Dependent Salary Head",
        render: (row) => row.value || "-",
      },
    ],
    [],
  )

  const searchFields = useMemo<ActionTableSearchField<DependentSalaryHeadRow>[]>(
    () => [{ value: "value", label: "Name", getValue: (row) => row.value || "" }],
    [],
  )

  const handleDelete = (rowIndex: number) => {
    const originalIndex = toOriginalIndex(rowIndex)
    const nextRows = dependentHeads.filter((_, i) => i !== originalIndex)
    postDelete({
      tenant: tenantCode,
      action: "update",
      id: rowId,
      collectionName: "employeeWageTemplate",
      event: "validate",
      ruleId: "employeeWageTemplateDependentSalaryHeadsValidator",
      data: {
        dependentSalaryHeads: nextRows,
      },
    })
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Link2 className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Dependent Salary Heads ({dependentHeads.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete dependent salary head records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {dependentHeadsLoading && dependentHeads.length === 0 ? (
          <div className="text-sm text-gray-500">Loading dependent salary heads...</div>
        ) : (
          <ActionDataTable<DependentSalaryHeadRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"value" as SearchField}
            pageSize={10}
            isViewMode={isViewMode}
            onAdd={canAdd ? openAdd : undefined}
            addButtonLabel="Add Dependent Salary Head"
            onEdit={
              canEdit
                ? (rowIndex) => {
                    const originalIndex = toOriginalIndex(rowIndex)
                    setInitialValue(dependentHeads[originalIndex])
                    setEditIndex(originalIndex)
                    setIsDrawerOpen(true)
                  }
                : undefined
            }
            onDelete={canDelete ? handleDelete : undefined}
            getRowKey={(row, index) => `${row.value || "dependent"}-${toOriginalIndex(index)}`}
            emptyTitle="No dependent salary heads added yet."
            emptyDescription="Use Add Dependent Salary Head to create records."
          />
        )}
      </div>

      {isDrawerOpen && (
        <DependentSalaryHeadsFormPopup
          key={`dependent-${initialValue ? "edit" : "add"}-${initialValue || "new"}`}
          open={isDrawerOpen}
          initialValue={initialValue}
          rowId={rowId}
          tenantCode={tenantCode}
          existingRows={dependentHeads}
          editIndex={editIndex}
          refetchRows={async () => {
            await refetchDependentHeads()
            await onSaved?.()
          }}
          onClose={() => {
            setIsDrawerOpen(false)
            setInitialValue(null)
            setEditIndex(null)
          }}
          onSubmit={() => {
            setIsDrawerOpen(false)
            setInitialValue(null)
            setEditIndex(null)
          }}
        />
      )}
    </div>
  )
}
