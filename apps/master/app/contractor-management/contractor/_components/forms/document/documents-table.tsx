"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { FileText, AlertTriangle, Eye } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import DocumentPreview from "@/components/popup/document-preview"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { type Document } from "../../schemas/document-form-schema"
import { DocumentFormPopup } from "./document-form-popup"

interface DocumentsTableProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  onSaved?: () => void
}

function getFileNameFromPath(path?: string): string {
  if (!path) return ""
  const normalized = path.replace(/\\/g, "/")
  const parts = normalized.split("/")
  return parts[parts.length - 1] || path
}

function guessMimeFromPath(path: string): string {
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

function toInputDocument(row: any): Document {
  return {
    parseID: row?.parseID || undefined,
    documentCategory: {
      documentCategoryCode: row?.documentCategory?.documentCategoryCode || "",
      documentCategoryTitle: row?.documentCategory?.documentCategoryTitle || "",
    },
    documentType: {
      documentTypeCode: row?.documentType?.documentTypeCode || "",
      documentTypeTitle: row?.documentType?.documentTypeTitle || "",
    },
    documentPath: row?.documentPath || "",
    identificationNumber: row?.identificationNumber || "",
  }
}

export function DocumentsTable({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  onSaved,
}: DocumentsTableProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})

  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchDocuments = Boolean(employeeRecordId) && currentMode !== "add"

  const criteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteria: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "is", value: tenantCode })
    return criteria
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedDocuments, refetch: refetchDocuments } = useAggregateArrayFetch<any>({
    collection: employeeSearchUrl !== "contractor/search" ? "draft/contractor" : "contractor",
    criteriaRequests,
    arrayField: "uploadedDocuments",
    enabled: canFetchDocuments,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchDocuments) return
    void refetchDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchDocuments, tenantCode])

  useEffect(() => {
    if (!canFetchDocuments) return
    if (Array.isArray(fetchedDocuments)) {
      setDocuments(fetchedDocuments.map(toInputDocument))
    }
  }, [canFetchDocuments, fetchedDocuments])

  useEffect(() => {
    if (currentMode === "add") setDocuments([])
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

  const handlePopupSubmit = (next: Document[]) => {
    setDocuments(next)
  }

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index))
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<Document>[]>(
    () => [
      {
        key: "documentCategory",
        label: "Document Category",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.documentCategory?.documentCategoryTitle || row.documentCategory?.documentCategoryCode || "-",
      },
      {
        key: "documentType",
        label: "Document Type",
        render: (row) => row.documentType?.documentTypeTitle || row.documentType?.documentTypeCode || "-",
      },
      {
        key: "identificationNumber",
        label: "ID Number",
        render: (row) => row.identificationNumber || "-",
      },
      {
        key: "documentPath",
        label: "Document",
        render: (row) =>
          row.documentPath ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-800 truncate max-w-[150px]">{getFileNameFromPath(row.documentPath)}</span>
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
                <Eye className="h-3.5 w-3.5 mr-1" />
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

  const searchFields = useMemo<ActionTableSearchField<Document>[]>(
    () => [
      {
        value: "documentCategory",
        label: "Category",
        getValue: (row) => row.documentCategory?.documentCategoryTitle || row.documentCategory?.documentCategoryCode || "",
      },
      {
        value: "documentType",
        label: "Type",
        getValue: (row) => row.documentType?.documentTypeTitle || row.documentType?.documentTypeCode || "",
      },
      { value: "identificationNumber", label: "ID Number", getValue: (row) => row.identificationNumber || "" },
      { value: "documentPath", label: "Document", getValue: (row) => row.documentPath || "" },
    ],
    []
  )

  const initialValue = editIndex !== null && documents[editIndex] ? documents[editIndex] : null
  const displayedDocuments = useMemo(() => [...documents].reverse(), [documents])
  const toOriginalIndex = (displayIndex: number) => documents.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Documents & Compliance ({documents.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit documents in the popup.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<Document>
          rows={displayedDocuments}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField="documentType"
          isViewMode={isViewMode}
          onAdd={!isViewMode ? openAdd : undefined}
          addButtonLabel="Add Document"
          onEdit={!isViewMode ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.documentType?.documentTypeCode || "document"}-${toOriginalIndex(index)}`}
          emptyTitle="No documents added yet."
          emptyDescription="Use Add Document to add details."
        />
      </div>

      <DocumentFormPopup
        open={isFormOpen && !isViewMode}
        onClose={closeForm}
        initialDocument={initialValue}
        onSaved={onSaved}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        contractorCollectionUrl={contractorCollectionUrl}
        documents={documents}
        editIndex={editIndex}
        refetchDocuments={refetchDocuments}
        onSubmit={handlePopupSubmit}
        disabled={isViewMode}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove document</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this document?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => removeDocument(deleteIndex)}>
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
