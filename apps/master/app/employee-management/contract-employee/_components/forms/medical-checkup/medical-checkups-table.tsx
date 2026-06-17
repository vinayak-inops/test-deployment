"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { FileText } from "lucide-react"
import DocumentPreview from "@/components/popup/document-preview"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { type MedicalCheckup } from "../../schemas/medical-checkup-form-schema"
import { MedicalCheckupFormPopup } from "./medical-checkup-form"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "description" | "checkupDate"

interface MedicalCheckupsSectionFormProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

function guessMimeFromPath(path?: string): string {
  if (!path) return "application/octet-stream"
  const lower = path.toLowerCase()
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".pdf")) return "application/pdf"
  if (lower.endsWith(".doc")) return "application/msword"
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  return "application/octet-stream"
}

export function MedicalCheckupsSectionForm({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  onSubmit,
}: MedicalCheckupsSectionFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [medicalCheckups, setMedicalCheckups] = useState<MedicalCheckup[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})
  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchMedicalCheckups = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { uploadFile: uploadDocument } = useFileUpload({ uploadPath: "contract_employee" })
  const { post: postMedicalCheckups, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Medical checkups saved successfully!")
      void refetchMedicalCheckups()
    },
    onError: (error) => {
      console.error("Error saving medical checkups:", error)
    },
  })

  const medicalCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteriaRequests: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      criteriaRequests.push({ field: "tenantCode", operator: "is", value: tenantCode })
    }
    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedMedicalCheckups, refetch: refetchMedicalCheckups } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests: medicalCriteriaRequests,
    arrayField: "medicalCheckup",
    enabled: canFetchMedicalCheckups,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchMedicalCheckups) return
    void refetchMedicalCheckups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchMedicalCheckups, tenantCode])

  useEffect(() => {
    if (!canFetchMedicalCheckups) return
    if (Array.isArray(fetchedMedicalCheckups)) {
      setMedicalCheckups(fetchedMedicalCheckups as MedicalCheckup[])
    }
  }, [canFetchMedicalCheckups, fetchedMedicalCheckups])

  useEffect(() => {
    if (currentMode === "add") {
      setMedicalCheckups([])
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

  const handlePopupSubmit = (next: MedicalCheckup[]) => {
    setMedicalCheckups(next)
    onSubmit?.({ medicalCheckup: next })
    closeForm()
  }

  const removeCheckup = (index: number) => {
    const next = medicalCheckups.filter((_, i) => i !== index)
    const isEditMode = currentMode === "edit" && Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        medicalCheckup: next,
      },
    }
    postMedicalCheckups(payload)
    setMedicalCheckups(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<MedicalCheckup>[]>(
    () => [
      {
        key: "checkupDate",
        label: "Checkup Date",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.checkupDate || "-",
      },
      {
        key: "nextCheckupDate",
        label: "Next Checkup",
        render: (row) => row.nextCheckupDate || "-",
      },
      {
        key: "description",
        label: "Description",
        render: (row) => row.description || "-",
      },
      {
        key: "document",
        label: "Document",
        render: (row) =>
          row.documentPath ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setPreviewDoc({
                  path: row.documentPath,
                  mime: guessMimeFromPath(row.documentPath),
                  title: "Medical Checkup Document",
                })
                setPreviewOpen(true)
              }}
            >
              Preview
            </Button>
          ) : (
            "-"
          ),
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<MedicalCheckup>[]>(
    () => [
      { value: "description", label: "Description", getValue: (row) => row.description || "" },
      { value: "checkupDate", label: "Checkup Date", getValue: (row) => row.checkupDate || "" },
    ],
    []
  )

  const initialValue =
    editIndex !== null && medicalCheckups[editIndex] ? medicalCheckups[editIndex] : null
  const displayedMedicalCheckups = useMemo(() => [...medicalCheckups].reverse(), [medicalCheckups])
  const toOriginalIndex = (displayIndex: number) => medicalCheckups.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Medical Checkups ({medicalCheckups.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit medical checkups in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<MedicalCheckup>
          rows={displayedMedicalCheckups}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"description" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Checkup"
          onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.checkupDate || "checkup"}-${toOriginalIndex(index)}`}
          emptyTitle="No medical checkups added yet."
          emptyDescription="Use Add Checkup to add details."
        />
      </div>

      <MedicalCheckupFormPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        onSubmit={handlePopupSubmit}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        medicalCheckups={medicalCheckups}
        editIndex={editIndex}
        refetchMedicalCheckups={refetchMedicalCheckups}
        disabled={isViewMode || postLoading}
        uploadDocument={uploadDocument}
        employeeID={employeeRecordId || "unknown"}
        onPreviewDocument={(doc) => {
          setPreviewDoc(doc)
          setPreviewOpen(true)
        }}
      />

      <DocumentPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentPath={previewDoc.path}
        mimeType={previewDoc.mime}
        title={previewDoc.title}
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
                <h3 className="text-sm font-semibold text-red-900">Remove medical checkup</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this checkup?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>Cancel</Button>
              <Button
                size="sm"
                disabled={postLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removeCheckup(deleteIndex)}
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
