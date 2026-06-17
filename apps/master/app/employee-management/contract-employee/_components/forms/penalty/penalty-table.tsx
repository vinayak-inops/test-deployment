"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { AlertTriangle, FileText } from "lucide-react"
import { type PenaltyItem } from "../../schemas/penalty-form-schema"
import PenaltySectionForm from "./penalty-form"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "dateOfOffence" | "offenceDescription"

interface PenaltyFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

export function PenaltyForm({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  onSubmit,
}: PenaltyFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [penalties, setPenalties] = useState<PenaltyItem[]>([])
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const tenantCode = useGetTenantCode()
  const canFetchPenalties = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { post: postPenalty, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Penalties saved successfully!")
      void refetchPenalties()
    },
    onError: (error) => {
      console.error("Error saving penalties:", error)
    },
  })

  const penaltyCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []

    const criteriaRequests: Array<{ field: string; operator: string; value: string }> = [
      { field: "_id", operator: "eq", value: employeeRecordId },
    ]

    if (tenantCode) {
      criteriaRequests.push({ field: "tenantCode", operator: "eq", value: tenantCode })
    }
    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedPenalties, refetch: refetchPenalties } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests: penaltyCriteriaRequests,
    arrayField: "penalty",
    enabled: canFetchPenalties,
    defaultValue: [],
    onError: (error: any) => {
      if (employeeRecordId) {
        console.error("Error fetching contract employee penalties:", error)
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

  const handlePopupSubmit = (next: PenaltyItem[]) => {
    setPenalties(next)
    onSubmit?.({ penalty: next })
    closeForm()
  }

  const removePenalty = (index: number) => {
    const next = penalties.filter((_, i) => i !== index)
    const shouldUpdate = Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: shouldUpdate ? "update" : "insert",
      ...(shouldUpdate ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        penalty: next,
      },
    }
    postPenalty(payload)
    setPenalties(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<PenaltyItem>[]>(
    () => [
      {
        key: "dateOfOffence",
        label: "Date of Offence",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.dateOfOffence || "-",
      },
      {
        key: "fineImposed",
        label: "Fine Amount",
        render: (row) => <Badge className="bg-red-100 text-red-800">Rs {row.fineImposed ?? 0}</Badge>,
      },
      {
        key: "month",
        label: "Month",
        render: (row) => row.month || "-",
      },
      {
        key: "offenceDescription",
        label: "Offence Description",
        render: (row) => row.offenceDescription || "-",
      },
      {
        key: "actionTaken",
        label: "Action Taken",
        render: (row) => row.actionTaken || "-",
      },
      {
        key: "witnessName",
        label: "Witness Name",
        render: (row) => row.witnessName || "-",
      },
      {
        key: "fineRealisedDate",
        label: "Fine Realised Date",
        render: (row) => row.fineRealisedDate || "-",
      },
      {
        key: "isCauseShownAgainstFine",
        label: "Cause Shown",
        render: (row) => (
          <Badge className={row.isCauseShownAgainstFine ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
            {row.isCauseShownAgainstFine ? "Yes" : "No"}
          </Badge>
        ),
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<PenaltyItem>[]>(
    () => [
      { value: "dateOfOffence", label: "Date of Offence", getValue: (row) => row.dateOfOffence || "" },
      { value: "offenceDescription", label: "Offence Description", getValue: (row) => row.offenceDescription || "" },
    ],
    []
  )

  useEffect(() => {
    if (!canFetchPenalties) return
    void refetchPenalties()
  }, [canFetchPenalties, tenantCode, refetchPenalties])

  useEffect(() => {
    if (!canFetchPenalties) return
    if (Array.isArray(fetchedPenalties)) {
      setPenalties(fetchedPenalties as PenaltyItem[])
    }
  }, [canFetchPenalties, fetchedPenalties])

  useEffect(() => {
    if (currentMode === "add") {
      setPenalties([])
    }
  }, [currentMode])

  const initialValue = editIndex !== null && penalties[editIndex] ? penalties[editIndex] : null
  const displayedPenalties = useMemo(() => [...penalties].reverse(), [penalties])
  const toOriginalIndex = (displayIndex: number) => penalties.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Penalties ({penalties.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit penalties in the popup.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<PenaltyItem>
          rows={displayedPenalties}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"dateOfOffence" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Penalty"
          onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.dateOfOffence || "penalty"}-${toOriginalIndex(index)}`}
          emptyTitle="No penalties added yet."
          emptyDescription="Use Add Penalty to add details."
        />
      </div>

      <PenaltySectionForm
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        onSubmit={handlePopupSubmit}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        penalties={penalties}
        editIndex={editIndex}
        refetchPenalties={refetchPenalties}
        isViewMode={isViewMode || postLoading}
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
                <h3 className="text-sm font-semibold text-red-900">Remove penalty</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this penalty entry?</p>
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
                onClick={() => removePenalty(deleteIndex)}
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

export default PenaltyForm
