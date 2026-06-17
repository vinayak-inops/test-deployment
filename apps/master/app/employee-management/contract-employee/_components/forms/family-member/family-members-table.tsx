"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Users } from "lucide-react"
import DocumentPreview from "@/components/popup/document-preview"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { type FamilyMember } from "../../schemas/family-member-form-schema"
import { FamilyMemberFormPopup } from "./family-member-form"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "memberName" | "relation"

interface FamilyMembersSectionFormProps {
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

export function FamilyMembersSectionForm({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  onSubmit,
}: FamilyMembersSectionFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})
  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchFamilyMembers = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { uploadFile: uploadDocument } = useFileUpload({ uploadPath: "contract_employee" })
  const { post: postFamilyMembers, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Family members saved successfully!")
      void refetchFamilyMembers()
    },
    onError: (error) => {
      console.error("Error saving family members:", error)
    },
  })

  const familyCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteriaRequests: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      criteriaRequests.push({ field: "tenantCode", operator: "is", value: tenantCode })
    }
    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedFamilyMembers, refetch: refetchFamilyMembers } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests: familyCriteriaRequests,
    arrayField: "familyMember",
    enabled: canFetchFamilyMembers,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchFamilyMembers) return
    void refetchFamilyMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchFamilyMembers, tenantCode])

  useEffect(() => {
    if (!canFetchFamilyMembers) return
    if (Array.isArray(fetchedFamilyMembers)) {
      setFamilyMembers(fetchedFamilyMembers as FamilyMember[])
    }
  }, [canFetchFamilyMembers, fetchedFamilyMembers])

  useEffect(() => {
    if (currentMode === "add") {
      setFamilyMembers([])
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

  const handlePopupSubmit = (next: FamilyMember[]) => {
    setFamilyMembers(next)
    onSubmit?.({ familyMember: next })
    closeForm()
  }

  const removeMember = (index: number) => {
    const next = familyMembers.filter((_, i) => i !== index)
    const isEditMode = currentMode === "edit" && Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        familyMember: next,
      },
    }
    postFamilyMembers(payload)
    setFamilyMembers(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<FamilyMember>[]>(
    () => [
      {
        key: "memberName",
        label: "Member Name",
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
        key: "gender",
        label: "Gender",
        render: (row) => row.gender || "-",
      },
      {
        key: "birthDate",
        label: "Birth Date",
        render: (row) => row.birthDate || "-",
      },
      {
        key: "aadhar",
        label: "Aadhar Number",
        render: (row) => row.aadharCard?.aadharCardNumber || "-",
      },
      {
        key: "electionCard",
        label: "Election Card",
        render: (row) => row.electionCard?.electionCardNumber || "-",
      },
      {
        key: "panCard",
        label: "PAN Card",
        render: (row) => row.panCard?.panCardNumber || "-",
      },
      {
        key: "isDependent",
        label: "Dependent",
        render: (row) => (row.isDependent ? "Yes" : "No"),
      },
      {
        key: "remark",
        label: "Remark",
        render: (row) => row.remark || "-",
      },
      {
        key: "aadharDocument",
        label: "Aadhar Document",
        render: (row) =>
          row.aadharCard?.aadharCardPath ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setPreviewDoc({
                  path: row.aadharCard?.aadharCardPath,
                  mime: guessMimeFromPath(row.aadharCard?.aadharCardPath),
                  title: "Aadhar Document",
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
      {
        key: "electionDocument",
        label: "Election Document",
        render: (row) =>
          row.electionCard?.electionCardPath ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setPreviewDoc({
                  path: row.electionCard?.electionCardPath,
                  mime: guessMimeFromPath(row.electionCard?.electionCardPath),
                  title: "Election Card Document",
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
      {
        key: "panDocument",
        label: "PAN Document",
        render: (row) =>
          row.panCard?.panCardPath ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setPreviewDoc({
                  path: row.panCard?.panCardPath,
                  mime: guessMimeFromPath(row.panCard?.panCardPath),
                  title: "PAN Card Document",
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

  const searchFields = useMemo<ActionTableSearchField<FamilyMember>[]>(
    () => [
      { value: "memberName", label: "Member Name", getValue: (row) => row.memberName || "" },
      { value: "relation", label: "Relation", getValue: (row) => row.relation || "" },
    ],
    []
  )

  const initialValue =
    editIndex !== null && familyMembers[editIndex] ? familyMembers[editIndex] : null
  const displayedFamilyMembers = useMemo(() => [...familyMembers].reverse(), [familyMembers])
  const toOriginalIndex = (displayIndex: number) => familyMembers.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Family Members ({familyMembers.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit family members and documents in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<FamilyMember>
          rows={displayedFamilyMembers}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"memberName" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Family Member"
          onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.memberName || "member"}-${toOriginalIndex(index)}`}
          emptyTitle="No family members added yet."
          emptyDescription="Use Add Family Member to add details."
        />
      </div>

      <FamilyMemberFormPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        onSubmit={handlePopupSubmit}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        familyMembers={familyMembers}
        editIndex={editIndex}
        refetchFamilyMembers={refetchFamilyMembers}
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
                <Users className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove family member</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this family member?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>Cancel</Button>
              <Button
                size="sm"
                disabled={postLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removeMember(deleteIndex)}
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
