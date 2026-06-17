"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Shield } from "lucide-react"
import DocumentPreview from "@/components/popup/document-preview"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { type PoliceVerification } from "../../schemas/police-verification-form-schema"
import { PoliceVerificationPopup } from "./police-verification-popup"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "description" | "verificationDate" | "policeStationDetail" | "policeStationPinCode"

interface PoliceVerificationFormProps {
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  formData?: any
  onFormDataChange?: (data: any) => void
  onPreviousTab?: () => void
  onNextTab?: () => void
  mode?: "add" | "edit" | "view"
  auditStatus?: any
  auditStatusFormData?: any
  setAuditStatus?: (data: any) => void
  setAuditStatusFormData?: (data: any) => void
  activeTab?: string
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

export function PoliceVerificationForm({
  employeeRecordId = null,
  employeeSearchUrl = "contract_employee/search",
  onPreviousTab: _onPreviousTab,
  onNextTab: _onNextTab,
  mode = "add",
  employeeCollectionUrl = "contract_employee",
  onSubmit,
}: PoliceVerificationFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [policeVerifications, setPoliceVerifications] = useState<PoliceVerification[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})
  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const canFetchPoliceVerifications = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { uploadFile: uploadDocument } = useFileUpload({ uploadPath: "contract_employee" })
  const { post: postPoliceVerification, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Police verification records saved successfully!")
      void refetchPoliceVerifications()
    },
    onError: (error) => {
      console.error("Error saving police verification records:", error)
    },
  })

  const policeCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteriaRequests: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      criteriaRequests.push({ field: "tenantCode", operator: "eq", value: tenantCode })
    }
    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedPoliceVerifications, refetch: refetchPoliceVerifications } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests: policeCriteriaRequests,
    arrayField: "policeVerification",
    enabled: canFetchPoliceVerifications,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchPoliceVerifications) return
    void refetchPoliceVerifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchPoliceVerifications, tenantCode])

  useEffect(() => {
    if (!canFetchPoliceVerifications) return
    if (Array.isArray(fetchedPoliceVerifications)) {
      setPoliceVerifications(fetchedPoliceVerifications as PoliceVerification[])
    }
  }, [canFetchPoliceVerifications, fetchedPoliceVerifications])

  useEffect(() => {
    if (currentMode === "add") {
      setPoliceVerifications([])
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

  const handlePopupSubmit = (next: PoliceVerification[]) => {
    setPoliceVerifications(next)
    onSubmit?.({ policeVerification: next })
    closeForm()
  }

  const removeVerification = (index: number) => {
    const next = policeVerifications.filter((_, i) => i !== index)
    const shouldUpdate = Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: shouldUpdate ? "update" : "insert",
      ...(shouldUpdate ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        policeVerification: next,
      },
      audit: auditPayload,
    }
    postPoliceVerification(payload)
    setPoliceVerifications(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<PoliceVerification>[]>(
    () => [
      {
        key: "verificationDate",
        label: "Verification Date",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.verificationDate || "-",
      },
      {
        key: "nextVerificationDate",
        label: "Expiry Date",
        render: (row) => row.nextVerificationDate || "-",
      },
      {
        key: "description",
        label: "Description",
        render: (row) => row.description || "-",
      },
      {
        key: "policeStationDetail",
        label: "Police Jurisdiction",
        render: (row) => row.policeStationDetail || "-",
      },
      {
        key: "policeStationPinCode",
        label: "Pin Code",
        render: (row) => row.policeStationPinCode || "-",
      },
      {
        key: "isActive",
        label: "Status",
        render: (row) =>
          row.isActive ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">
              Inactive
            </span>
          ),
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
                  title: "Police Verification Document",
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

  const searchFields = useMemo<ActionTableSearchField<PoliceVerification>[]>(
    () => [
      { value: "description", label: "Description", getValue: (row) => row.description || "" },
      { value: "verificationDate", label: "Verification Date", getValue: (row) => row.verificationDate || "" },
      { value: "policeStationDetail", label: "Police Jurisdiction", getValue: (row) => row.policeStationDetail || "" },
      { value: "policeStationPinCode", label: "Pin Code", getValue: (row) => row.policeStationPinCode || "" },
    ],
    []
  )

  const initialValue =
    editIndex !== null && policeVerifications[editIndex] ? policeVerifications[editIndex] : null
  const displayedPoliceVerifications = useMemo(() => [...policeVerifications].reverse(), [policeVerifications])
  const toOriginalIndex = (displayIndex: number) => policeVerifications.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Shield className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Police Verification ({policeVerifications.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit police verification details in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<PoliceVerification>
          rows={displayedPoliceVerifications}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"description" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Verification"
          onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.verificationDate || "police"}-${toOriginalIndex(index)}`}
          emptyTitle="No police verification records added yet."
          emptyDescription="Use Add Verification to add details."
        />
      </div>

      <PoliceVerificationPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        onSubmit={handlePopupSubmit}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        policeVerifications={policeVerifications}
        editIndex={editIndex}
        refetchPoliceVerifications={refetchPoliceVerifications}
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
                <Shield className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove police verification</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this record?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>Cancel</Button>
              <Button
                size="sm"
                disabled={postLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removeVerification(deleteIndex)}
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

export default function PoliceVerificationFormWithPreview(props: any) {
  return <PoliceVerificationForm {...props} />
}
