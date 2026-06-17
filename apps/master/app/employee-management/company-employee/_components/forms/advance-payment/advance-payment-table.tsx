"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { DollarSign, FileText } from "lucide-react"
import { type AdvancePaymentItem } from "../../schemas/advance-payment-form-schema"
import AdvancePaymentSectionForm from "./advance-payment-form"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "date" | "bonusDescription"

interface AdvancePaymentFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

export function AdvancePaymentForm({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: AdvancePaymentFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [advances, setAdvances] = useState<AdvancePaymentItem[]>([])
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const tenantCode = useGetTenantCode()
  const canFetchAdvances = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { post: postAdvancePayments, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Advance payments saved successfully!")
      void refetchAdvancePayments()
    },
    onError: (error) => {
      console.error("Error saving advance payments:", error)
    },
  })

  const advanceCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []

    const criteriaRequests: Array<{ field: string; operator: string; value: string }> = [
      {
        field: "_id",
        operator: "eq",
        value: employeeRecordId,
      },
    ]

    if (tenantCode) {
      criteriaRequests.push({
        field: "tenantCode",
        operator: "eq",
        value: tenantCode,
      })
    }

    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedAdvancePayments, refetch: refetchAdvancePayments } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests: advanceCriteriaRequests,
    arrayField: "advance",
    enabled: canFetchAdvances,
    defaultValue: [],
    onError: (error: any) => {
      if (employeeRecordId) {
        console.error("Error fetching contract employee advance payments:", error)
      }
    },
  })

  const openAdd = () => {
    setEditIndex(null)
    setIsFormOpen(true)
  }

  const openEdit = (index: number) => {
    setEditIndex(index)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditIndex(null)
  }

  const handlePopupSubmit = (next: AdvancePaymentItem[]) => {
    setAdvances(next)
    closeForm()
  }

  const removeAdvance = (index: number) => {
    const next = advances.filter((_, i) => i !== index)
    const shouldUpdate = Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: shouldUpdate ? "update" : "insert",
      ...(shouldUpdate ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        advance: next,
      },
    }
    postAdvancePayments(payload)
    setAdvances(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<AdvancePaymentItem>[]>(
    () => [
      {
        key: "date",
        label: "Date",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.date || "-",
      },
      {
        key: "monthYear",
        label: "Month / Year",
        render: (row) => `${row.month || "-"} / ${row.year || "-"}`,
      },
      {
        key: "amount",
        label: "Amount",
        render: (row) => <Badge className="bg-green-100 text-green-800">Rs {row.amount ?? 0}</Badge>,
      },
      {
        key: "bonusDescription",
        label: "Description",
        render: (row) => row.bonusDescription || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<AdvancePaymentItem>[]>(
    () => [
      { value: "date", label: "Date", getValue: (row) => row.date || "" },
      { value: "bonusDescription", label: "Description", getValue: (row) => row.bonusDescription || "" },
    ],
    []
  )

  useEffect(() => {
    if (!canFetchAdvances) return
    void refetchAdvancePayments()
  }, [canFetchAdvances, tenantCode, refetchAdvancePayments])

  useEffect(() => {
    if (!canFetchAdvances) return
    if (Array.isArray(fetchedAdvancePayments)) {
      setAdvances(fetchedAdvancePayments as AdvancePaymentItem[])
    }
  }, [canFetchAdvances, fetchedAdvancePayments])

  useEffect(() => {
    if (currentMode === "add") {
      setAdvances([])
    }
  }, [currentMode])

  const initialValue = editIndex !== null && advances[editIndex] ? advances[editIndex] : null
  const displayedAdvances = useMemo(() => [...advances].reverse(), [advances])
  const toOriginalIndex = (displayIndex: number) => advances.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <DollarSign className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Advance Payments ({advances.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit advance payments in the popup.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<AdvancePaymentItem>
          rows={displayedAdvances}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"date" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Advance"
          onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.date || "advance"}-${toOriginalIndex(index)}`}
          emptyTitle="No advance payments added yet."
          emptyDescription="Use Add Advance to add details."
        />
      </div>

      <AdvancePaymentSectionForm
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        advances={advances}
        editIndex={editIndex}
        refetchAdvancePayments={refetchAdvancePayments}
        onSubmit={handlePopupSubmit}
        disabled={isViewMode || postLoading}
      />

      {postLoading && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Saving permissions...</span>
          </div>
        </div>
      )}

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <FileText className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove advance payment</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this advance entry?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={postLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removeAdvance(deleteIndex)}
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

export default AdvancePaymentForm
