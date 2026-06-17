"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { FileText } from "lucide-react"
import DocumentPreview from "@/components/popup/document-preview"
import { UploadedDocumentsFormPopup } from "./uploaded-documents-form"
import { type UploadedDocumentItem } from "../../schemas/uploaded-documents-form-schema"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

interface UploadedDocumentsSectionFormProps {
  value?: UploadedDocumentItem[]
  onChange?: (docs: UploadedDocumentItem[]) => void
  isViewMode?: boolean
  employeeID?: string
  uploadDocument: (file: File, fileName?: string) => Promise<any>
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

type SearchField = "category" | "type" | "identification"

export function UploadedDocumentsSectionForm({
  value,
  onChange,
  isViewMode = false,
  employeeID,
  uploadDocument,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  onSubmit,
}: UploadedDocumentsSectionFormProps) {
  const [localDocuments, setLocalDocuments] = useState<UploadedDocumentItem[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})
  const tenantCode = useGetTenantCode()
  const searchParams = useSearchParams()
  const modeParam = searchParams.get("mode")
  const currentMode = modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : "add"
  const resolvedEmployeeRecordId = employeeID || null
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"

  const isControlled = Array.isArray(value) && typeof onChange === "function"
  const docs = isControlled ? (value as UploadedDocumentItem[]) : localDocuments
  const { post: postUploadedDocuments, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Uploaded documents saved successfully!")
      void refetchUploadedDocuments()
    },
    onError: (error) => {
      console.error("Error saving uploaded documents:", error)
    },
  })

  const uploadedDocsCriteriaRequests = [
    ...(employeeID ? [{ field: "_id", operator: "eq", value: employeeID }] : []),
    ...(tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
  ]

  const canFetchUploadedDocuments = !isControlled && Boolean(employeeID)
  const { arrayData: fetchedUploadedDocuments, refetch: refetchUploadedDocuments } = useAggregateArrayFetch<UploadedDocumentItem>({
    collection: targetCollectionName,
    criteriaRequests: uploadedDocsCriteriaRequests,
    arrayField: "uploadedDocuments",
    enabled: canFetchUploadedDocuments,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchUploadedDocuments) return
    void refetchUploadedDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchUploadedDocuments, tenantCode])

  useEffect(() => {
    if (!canFetchUploadedDocuments) return
    setLocalDocuments(Array.isArray(fetchedUploadedDocuments) ? fetchedUploadedDocuments : [])
  }, [canFetchUploadedDocuments, fetchedUploadedDocuments])

  const setDocs = (next: UploadedDocumentItem[]) => {
    if (isControlled) {
      onChange?.(next)
      return
    }
    setLocalDocuments(next)
  }

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

  const handlePopupSubmit = (next: UploadedDocumentItem[]) => {
    setDocs(next)
    onSubmit?.({ uploadedDocuments: next })
    closeForm()
  }

  const removeDoc = (index: number) => {
    const next = docs.filter((_, i) => i !== index)
    const isEditMode = currentMode === "edit" && Boolean(resolvedEmployeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        uploadedDocuments: next,
      },
    }
    postUploadedDocuments(payload)
    setDocs(next)
    setDeleteIndex(null)
  }

  const initialValue = editIndex !== null && docs[editIndex] ? docs[editIndex] : null
  const displayedDocs = useMemo(() => [...docs].reverse(), [docs])
  const toOriginalIndex = (displayIndex: number) => docs.length - 1 - displayIndex

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

  const columns = useMemo<ActionTableColumn<UploadedDocumentItem>[]>(
    () => [
      {
        key: "category",
        label: "Category",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.documentCategory?.documentCategoryTitle || "-",
      },
      {
        key: "type",
        label: "Type",
        render: (row) => row.documentType?.documentTypeTitle || "-",
      },
      {
        key: "identification",
        label: "Identification",
        render: (row) => row.identificationNumber || "-",
      },
      {
        key: "file",
        label: "File",
        render: (row) =>
          row.documentPath ? (
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">Uploaded</Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setPreviewDoc({
                    path: row.documentPath,
                    mime: guessMimeFromPath(row.documentPath || ""),
                    title: row.documentType?.documentTypeTitle || "Document",
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

  const searchFields = useMemo<ActionTableSearchField<UploadedDocumentItem>[]>(
    () => [
      { value: "category", label: "Category", getValue: (row) => row.documentCategory?.documentCategoryTitle || "" },
      { value: "type", label: "Type", getValue: (row) => row.documentType?.documentTypeTitle || "" },
      { value: "identification", label: "Identification", getValue: (row) => row.identificationNumber || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Uploaded Documents ({docs.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit uploaded documents in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<UploadedDocumentItem>
          rows={displayedDocs}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"category" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Document"
          onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.documentType?.documentTypeCode || "doc"}-${toOriginalIndex(index)}`}
          emptyTitle="No uploaded documents added yet."
          emptyDescription="Use Add Document to add details."
        />
      </div>

      <UploadedDocumentsFormPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        onSubmit={handlePopupSubmit}
        mode={currentMode}
        employeeRecordId={resolvedEmployeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        uploadedDocuments={docs}
        editIndex={editIndex}
        refetchUploadedDocuments={refetchUploadedDocuments}
        isViewMode={isViewMode || postLoading}
        employeeID={employeeID}
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
                <h3 className="text-sm font-semibold text-red-900">Remove uploaded document</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this document?</p>
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
                onClick={() => removeDoc(deleteIndex)}
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
