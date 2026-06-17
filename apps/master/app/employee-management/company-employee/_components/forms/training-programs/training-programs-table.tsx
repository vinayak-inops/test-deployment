"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { GraduationCap, FileText } from "lucide-react"
import DocumentPreview from "@/components/popup/document-preview"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { TrainingProgramsFormPopup } from "./training-programs-form"
import { type TrainingProgramItem } from "../../schemas/training-programs-form-schema"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

interface TrainingProgramsSectionFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

type SearchField = "programCode" | "programTitle"

export function TrainingProgramsSectionForm({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  onSubmit,
}: TrainingProgramsSectionFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})
  const [trainings, setTrainings] = useState<TrainingProgramItem[]>([])
  const { uploadFile: uploadDocument } = useFileUpload({ uploadPath: "contract_employee" })
  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchTrainings = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { post: postTrainings, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Training programs saved successfully!")
      void refetchTrainings()
    },
    onError: (error) => {
      console.error("Error saving training programs:", error)
    },
  })

  const trainingCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteriaRequests: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      criteriaRequests.push({ field: "tenantCode", operator: "is", value: tenantCode })
    }
    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedTrainings, refetch: refetchTrainings } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests: trainingCriteriaRequests,
    arrayField: "trainings",
    enabled: canFetchTrainings,
    defaultValue: [],
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

  const handlePopupSubmit = (next: TrainingProgramItem[]) => {
    setTrainings(next)
    onSubmit?.({ trainings: next })
    closeForm()
  }

  const removeTraining = (index: number) => {
    const next = trainings.filter((_, i) => i !== index)
    const isEditMode = currentMode === "edit" && Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        trainings: next,
      },
    }
    postTrainings(payload)
    setTrainings(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<TrainingProgramItem>[]>(
    () => [
      {
        key: "programCode",
        label: "Program Code",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.trainingProgram?.trainingProgramCode || "-",
      },
      {
        key: "programTitle",
        label: "Program Title",
        render: (row) => row.trainingProgram?.trainingProgramTitle || "-",
      },
      {
        key: "duration",
        label: "Duration",
        render: (row) => `${row.fromDate || "-"} ${row.toDate ? `to ${row.toDate}` : ""}`.trim(),
      },
      {
        key: "file",
        label: "File",
        render: (row) =>
          row.filePath ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">Uploaded</Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setPreviewDoc({
                    path: row.filePath,
                    mime: guessMimeFromPath(row.filePath || ""),
                    title: row.trainingProgram?.trainingProgramTitle || "Training Certificate",
                  })
                  setPreviewOpen(true)
                }}
              >
                Preview
              </Button>
            </div>
          ) : (
            "-"
          ),
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<TrainingProgramItem>[]>(
    () => [
      {
        value: "programCode",
        label: "Program Code",
        getValue: (row) => row.trainingProgram?.trainingProgramCode || "",
      },
      {
        value: "programTitle",
        label: "Program Title",
        getValue: (row) => row.trainingProgram?.trainingProgramTitle || "",
      },
    ],
    []
  )

  useEffect(() => {
    if (!canFetchTrainings) return
    void refetchTrainings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchTrainings, tenantCode])

  useEffect(() => {
    if (!canFetchTrainings) return
    if (Array.isArray(fetchedTrainings)) {
      setTrainings(fetchedTrainings as TrainingProgramItem[])
    }
  }, [canFetchTrainings, fetchedTrainings])

  useEffect(() => {
    if (currentMode === "add") {
      setTrainings([])
    }
  }, [currentMode])

  const initialValue = editIndex !== null && trainings[editIndex] ? trainings[editIndex] : null

  const guessMimeFromPath = (path: string): string => {
    const lower = (path || "").toLowerCase()
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
    if (lower.endsWith(".png")) return "image/png"
    if (lower.endsWith(".gif")) return "image/gif"
    if (lower.endsWith(".webp")) return "image/webp"
    if (lower.endsWith(".pdf")) return "application/pdf"
    if (lower.endsWith(".doc")) return "application/msword"
    if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return "application/octet-stream"
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <GraduationCap className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Training Programs ({trainings.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit training programs in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<TrainingProgramItem>
          rows={trainings}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"programCode" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Training"
          onEdit={!isViewMode && !postLoading ? openEdit : undefined}
          onDelete={!isViewMode && !postLoading ? setDeleteIndex : undefined}
          getRowKey={(row, index) => `${row.trainingProgram?.trainingProgramCode || "training"}-${index}`}
          emptyTitle="No training programs added yet."
          emptyDescription="Use Add Training to add details."
        />
      </div>

      <TrainingProgramsFormPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        onSubmit={handlePopupSubmit}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeCollectionUrl={employeeCollectionUrl}
        trainings={trainings}
        editIndex={editIndex}
        refetchTrainings={refetchTrainings}
        isViewMode={isViewMode || postLoading}
        employeeID={employeeRecordId || undefined}
        uploadDocument={uploadDocument}
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
                <h3 className="text-sm font-semibold text-red-900">Remove training program</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this training entry?</p>
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
                onClick={() => removeTraining(deleteIndex)}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      <DocumentPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentPath={previewDoc.path}
        mimeType={previewDoc.mime}
        title={previewDoc.title}
      />
    </div>
  )
}
