"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { GraduationCap } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { type Education } from "../../schemas/education-form-schema"
import { EducationFormPopup } from "./education-form"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "educationTitle" | "college"

interface EducationsSectionFormProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

export function EducationsSectionForm({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  onSubmit,
}: EducationsSectionFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [educations, setEducations] = useState<Education[]>([])
  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchEducations = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { post: postEducations, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Education data saved successfully!")
      void refetchEducations()
    },
    onError: (error) => {
      console.error("Error saving education data:", error)
    },
  })

  const educationCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteriaRequests: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      criteriaRequests.push({ field: "tenantCode", operator: "is", value: tenantCode })
    }
    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedEducations, refetch: refetchEducations } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests: educationCriteriaRequests,
    arrayField: "educations",
    enabled: canFetchEducations,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchEducations) return
    void refetchEducations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchEducations, tenantCode])

  useEffect(() => {
    if (!canFetchEducations) return
    if (Array.isArray(fetchedEducations)) {
      setEducations(fetchedEducations as Education[])
    }
  }, [canFetchEducations, fetchedEducations])

  useEffect(() => {
    if (currentMode === "add") {
      setEducations([])
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

  const handlePopupSubmit = (next: Education[]) => {
    setEducations(next)
    onSubmit?.({ educations: next })
    closeForm()
  }

  const removeEducation = (index: number) => {
    const next = educations.filter((_, i) => i !== index)
    const isEditMode = currentMode === "edit" && Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        educations: next,
      },
    }
    postEducations(payload)
    setEducations(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<Education>[]>(
    () => [
      {
        key: "educationTitle",
        label: "Education",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.educationTitle || "-",
      },
      {
        key: "courseTitle",
        label: "Course",
        render: (row) => row.courseTitle || "-",
      },
      {
        key: "stream",
        label: "Stream",
        render: (row) => row.stream || "-",
      },
      {
        key: "college",
        label: "College",
        render: (row) => row.college || "-",
      },
      {
        key: "yearOfPassing",
        label: "Year",
        render: (row) => row.yearOfPassing || "-",
      },
      {
        key: "monthOfPassing",
        label: "Month",
        render: (row) => row.monthOfPassing || "-",
      },
      {
        key: "percentage",
        label: "Percentage/CGPA",
        render: (row) => row.percentage || "-",
      },
      {
        key: "isVerified",
        label: "Verified",
        render: (row) => (
          <Badge className={row.isVerified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
            {row.isVerified ? "Yes" : "No"}
          </Badge>
        ),
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<Education>[]>(
    () => [
      { value: "educationTitle", label: "Education Title", getValue: (row) => row.educationTitle || "" },
      { value: "college", label: "College", getValue: (row) => row.college || "" },
    ],
    []
  )

  const initialValue = editIndex !== null && educations[editIndex] ? educations[editIndex] : null
  const displayedEducations = useMemo(() => [...educations].reverse(), [educations])
  const toOriginalIndex = (displayIndex: number) => educations.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <GraduationCap className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Education ({educations.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit education details in the popup.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<Education>
          rows={displayedEducations}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"educationTitle" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Education"
          onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.educationTitle || "education"}-${toOriginalIndex(index)}`}
          emptyTitle="No education added yet."
          emptyDescription="Use Add Education to add details."
        />
      </div>

      <EducationFormPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        onSubmit={handlePopupSubmit}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        educations={educations}
        editIndex={editIndex}
        refetchEducations={refetchEducations}
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
                <GraduationCap className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove education</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this education?</p>
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
                onClick={() => removeEducation(deleteIndex)}
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
