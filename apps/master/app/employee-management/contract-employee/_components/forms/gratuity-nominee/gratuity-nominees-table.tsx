"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Heart } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { type GratuityNominee } from "../../schemas/gratuity-nominee-form-schema"
import { GratuityNomineeFormPopup } from "./gratuity-nominee-form"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "memberName" | "relation"

interface GratuityNomineesSectionFormProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

export function GratuityNomineesSectionForm({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  onSubmit,
}: GratuityNomineesSectionFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [gratuityNominees, setGratuityNominees] = useState<GratuityNominee[]>([])
  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchGratuityNominees = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { post: postGratuityNominees, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Gratuity nominees saved successfully!")
      void refetchGratuityNominees()
    },
    onError: (error) => {
      console.error("Error saving gratuity nominees:", error)
    },
  })

  const gratuityCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteriaRequests: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      criteriaRequests.push({ field: "tenantCode", operator: "is", value: tenantCode })
    }
    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedGratuityNominees, refetch: refetchGratuityNominees } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests: gratuityCriteriaRequests,
    arrayField: "gratuityNominee",
    enabled: canFetchGratuityNominees,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchGratuityNominees) return
    void refetchGratuityNominees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchGratuityNominees, tenantCode])

  useEffect(() => {
    if (!canFetchGratuityNominees) return
    if (Array.isArray(fetchedGratuityNominees)) {
      setGratuityNominees(fetchedGratuityNominees as GratuityNominee[])
    }
  }, [canFetchGratuityNominees, fetchedGratuityNominees])

  useEffect(() => {
    if (currentMode === "add") {
      setGratuityNominees([])
    }
  }, [currentMode])

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

  const handlePopupSubmit = (next: GratuityNominee[]) => {
    setGratuityNominees(next)
    onSubmit?.({ gratuityNominee: next })
    closeForm()
  }

  const removeNominee = (index: number) => {
    const next = gratuityNominees.filter((_, i) => i !== index)
    const isEditMode = currentMode === "edit" && Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        gratuityNominee: next,
      },
    }
    postGratuityNominees(payload)
    setGratuityNominees(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<GratuityNominee>[]>(
    () => [
      {
        key: "memberName",
        label: "Nominee Name",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.memberName || "-",
      },
      {
        key: "relation",
        label: "Relation",
        render: (row) => row.relation || "-",
      },
      {
        key: "birthDate",
        label: "Birth Date",
        render: (row) => row.birthDate || "-",
      },
      {
        key: "percentage",
        label: "Percentage",
        render: (row) => row.percentage || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<GratuityNominee>[]>(
    () => [
      { value: "memberName", label: "Nominee Name", getValue: (row) => row.memberName || "" },
      { value: "relation", label: "Relation", getValue: (row) => row.relation || "" },
    ],
    []
  )

  const initialValue =
    editIndex !== null && gratuityNominees[editIndex] ? gratuityNominees[editIndex] : null
  const displayedGratuityNominees = useMemo(() => [...gratuityNominees].reverse(), [gratuityNominees])
  const toOriginalIndex = (displayIndex: number) => gratuityNominees.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Heart className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Gratuity Nominee ({gratuityNominees.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit gratuity nominees in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<GratuityNominee>
          rows={displayedGratuityNominees}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"memberName" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Gratuity Nominee"
          onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.memberName || "gratuity"}-${toOriginalIndex(index)}`}
          emptyTitle="No gratuity nominees added yet."
          emptyDescription="Use Add Gratuity Nominee to add details."
        />
      </div>

      <GratuityNomineeFormPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        onSubmit={handlePopupSubmit}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        gratuityNominees={gratuityNominees}
        editIndex={editIndex}
        refetchGratuityNominees={refetchGratuityNominees}
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
                <Heart className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove gratuity nominee</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this nominee?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>Cancel</Button>
              <Button
                size="sm"
                disabled={postLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removeNominee(deleteIndex)}
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
