"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { AlertTriangle, FileText } from "lucide-react"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import DocumentPreview from "@/components/popup/document-preview"
import { type DisciplinaryActionItem } from "../../schemas/disciplinary-action-form-schema"
import DisciplinaryActionSectionForm from "./disciplinary-action-form"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "issueReportedOn" | "issuedescription"

interface DisciplinaryActionTableProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
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

export function DisciplinaryActionTable({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: DisciplinaryActionTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryActionItem[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const { uploadFile: uploadDocument } = useFileUpload({ uploadPath: "contract_employee" })
  const tenantCode = useGetTenantCode()
  const canFetchDisciplinaryActions = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { post: postDisciplinaryActions, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Disciplinary actions saved successfully!")
      void refetchDisciplinaryActions()
    },
    onError: (error) => {
      console.error("Error saving disciplinary actions:", error)
    },
  })

  const criteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const requests: Array<{ field: string; operator: string; value: string }> = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      requests.push({ field: "tenantCode", operator: "eq", value: tenantCode })
    }
    return requests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedDisciplinaryActions, refetch: refetchDisciplinaryActions } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests,
    arrayField: "disciplinaryAction",
    enabled: canFetchDisciplinaryActions,
    defaultValue: [],
    onError: (error: any) => {
      if (employeeRecordId) {
        console.error("Error fetching contract employee disciplinary actions:", error)
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

  const handlePopupSubmit = (next: DisciplinaryActionItem[]) => {
    setDisciplinaryActions(next)
    closeForm()
  }

  const removeDisciplinaryAction = (index: number) => {
    const next = disciplinaryActions.filter((_, i) => i !== index)
    const shouldUpdate = Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: shouldUpdate ? "update" : "insert",
      ...(shouldUpdate ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        disciplinaryAction: next,
      },
    }
    postDisciplinaryActions(payload)
    setDisciplinaryActions(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<DisciplinaryActionItem>[]>(
    () => [
      {
        key: "issueReportedOn",
        label: "Issue Reported On",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.issueReportedOn || "-",
      },
      {
        key: "actionTakenOn",
        label: "Action Taken On",
        render: (row) => row.actionTakenOn || "-",
      },
      {
        key: "status",
        label: "Status",
        render: (row) => (
          <Badge className={row.status === "Closed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
            {row.status || "Open"}
          </Badge>
        ),
      },
      {
        key: "issuedescription",
        label: "Issue Description",
        render: (row) => row.issuedescription || "-",
      },
      {
        key: "actionDescription",
        label: "Action Description",
        render: (row) => row.actionDescription || "-",
      },
      {
        key: "remark",
        label: "Remark",
        render: (row) => row.remark || "-",
      },
      {
        key: "document",
        label: "Document",
        render: (row) =>
          row.documentPath ? (
            <div className="flex items-center gap-2">
              <span>Uploaded</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setPreviewDoc({
                    path: row.documentPath,
                    mime: guessMimeFromPath(row.documentPath),
                    title: "Disciplinary Document",
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

  const searchFields = useMemo<ActionTableSearchField<DisciplinaryActionItem>[]>(
    () => [
      { value: "issueReportedOn", label: "Issue Reported On", getValue: (row) => row.issueReportedOn || "" },
      { value: "issuedescription", label: "Issue Description", getValue: (row) => row.issuedescription || "" },
    ],
    []
  )

  useEffect(() => {
    if (!canFetchDisciplinaryActions) return
    void refetchDisciplinaryActions()
  }, [canFetchDisciplinaryActions, tenantCode, refetchDisciplinaryActions])

  useEffect(() => {
    if (!canFetchDisciplinaryActions) return
    if (Array.isArray(fetchedDisciplinaryActions)) {
      setDisciplinaryActions(fetchedDisciplinaryActions as DisciplinaryActionItem[])
    }
  }, [canFetchDisciplinaryActions, fetchedDisciplinaryActions])

  useEffect(() => {
    if (currentMode === "add") {
      setDisciplinaryActions([])
    }
  }, [currentMode])

  const initialValue = editIndex !== null && disciplinaryActions[editIndex] ? disciplinaryActions[editIndex] : null
  const displayedDisciplinaryActions = useMemo(() => [...disciplinaryActions].reverse(), [disciplinaryActions])
  const toOriginalIndex = (displayIndex: number) => disciplinaryActions.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Disciplinary Actions ({disciplinaryActions.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit disciplinary actions in the popup.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<DisciplinaryActionItem>
          rows={displayedDisciplinaryActions}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"issueReportedOn" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Action"
          onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.issueReportedOn || "disciplinary"}-${toOriginalIndex(index)}`}
          emptyTitle="No disciplinary actions added yet."
          emptyDescription="Use Add Action to add details."
        />
      </div>

      <DisciplinaryActionSectionForm
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        disciplinaryActions={disciplinaryActions}
        editIndex={editIndex}
        refetchDisciplinaryActions={refetchDisciplinaryActions}
        onSubmit={handlePopupSubmit}
        isViewMode={isViewMode || postLoading}
        uploadDocument={uploadDocument}
        employeeID={employeeRecordId || undefined}
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
                <h3 className="text-sm font-semibold text-red-900">Remove disciplinary action</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this disciplinary entry?</p>
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
                onClick={() => removeDisciplinaryAction(deleteIndex)}
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

export default DisciplinaryActionTable
