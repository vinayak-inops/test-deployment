"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Users } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { type ChildrenAdmission } from "../../schemas/children-admission-form-schema"
import { ChildrenAdmissionFormPopup } from "./children-admission-form"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "name" | "nameOfSchool"

interface ChildrenAdmissionsSectionFormProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

export function ChildrenAdmissionsSectionForm({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: ChildrenAdmissionsSectionFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [childrenAdmission, setChildrenAdmission] = useState<ChildrenAdmission[]>([])
  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchChildrenAdmissions = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { post: postChildrenAdmissions, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Children admission data saved successfully!")
      void refetchChildrenAdmissions()
    },
    onError: (error) => {
      console.error("Error saving children admission data:", error)
    },
  })

  const childrenCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteriaRequests: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      criteriaRequests.push({ field: "tenantCode", operator: "is", value: tenantCode })
    }
    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedChildrenAdmissions, refetch: refetchChildrenAdmissions } = useAggregateArrayFetch<any>({
    collection: employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee",
    criteriaRequests: childrenCriteriaRequests,
    arrayField: "childrenAdmission",
    enabled: canFetchChildrenAdmissions,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchChildrenAdmissions) return
    void refetchChildrenAdmissions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchChildrenAdmissions, tenantCode])

  useEffect(() => {
    if (!canFetchChildrenAdmissions) return
    if (Array.isArray(fetchedChildrenAdmissions)) {
      setChildrenAdmission(fetchedChildrenAdmissions as ChildrenAdmission[])
    }
  }, [canFetchChildrenAdmissions, fetchedChildrenAdmissions])

  useEffect(() => {
    if (currentMode === "add") {
      setChildrenAdmission([])
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

  const handlePopupSubmit = (next: ChildrenAdmission[]) => {
    setChildrenAdmission(next)
    closeForm()
  }

  const removeChild = (index: number) => {
    const next = childrenAdmission.filter((_, i) => i !== index)
    const isEditMode = currentMode === "edit" && Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        childrenAdmission: next,
      },
    }
    postChildrenAdmissions(payload)
    setChildrenAdmission(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<ChildrenAdmission>[]>(
    () => [
      {
        key: "name",
        label: "Child Name",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.name || "-",
      },
      {
        key: "gender",
        label: "Gender",
        render: (row) => row.gender || "-",
      },
      {
        key: "dateOfBirth",
        label: "Date of Birth",
        render: (row) => row.dateOfBirth || "-",
      },
      {
        key: "dateOfAdmission",
        label: "Date of Admission",
        render: (row) => row.dateOfAdmission || "-",
      },
      {
        key: "nameOfSchool",
        label: "School Name",
        render: (row) => row.nameOfSchool || "-",
      },
      {
        key: "schoolAddress",
        label: "School Address",
        render: (row) => row.schoolAddress || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<ChildrenAdmission>[]>(
    () => [
      { value: "name", label: "Child Name", getValue: (row) => row.name || "" },
      { value: "nameOfSchool", label: "School Name", getValue: (row) => row.nameOfSchool || "" },
    ],
    []
  )

  const initialValue = editIndex !== null && childrenAdmission[editIndex] ? childrenAdmission[editIndex] : null
  const displayedChildrenAdmissions = useMemo(() => [...childrenAdmission].reverse(), [childrenAdmission])
  const toOriginalIndex = (displayIndex: number) => childrenAdmission.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Children Admission ({childrenAdmission.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit child admission details in the popup.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<ChildrenAdmission>
          rows={displayedChildrenAdmissions}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"name" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Child"
          onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.name || "child"}-${toOriginalIndex(index)}`}
          emptyTitle="No child admissions added yet."
          emptyDescription="Use Add Child to add details."
        />
      </div>

      <ChildrenAdmissionFormPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        childrenAdmissions={childrenAdmission}
        editIndex={editIndex}
        refetchChildrenAdmissions={refetchChildrenAdmissions}
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
                <Users className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove child admission</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this child?</p>
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
                onClick={() => removeChild(deleteIndex)}
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
