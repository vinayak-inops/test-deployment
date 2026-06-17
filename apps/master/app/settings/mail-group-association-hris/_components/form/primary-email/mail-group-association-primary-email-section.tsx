"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useSession } from "next-auth/react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { AlertTriangle, Trash2 } from "lucide-react"
import MailGroupAssociationPrimarySelectedTable from "./mail-group-association-primary-selected-table"
import MailGroupAssociationPrimarySelectorPopup from "./mail-group-association-primary-selector-popup"

type Mode = "add" | "edit" | "view"

interface Props {
  mode: Mode
  recordId?: string | null
}

export default function MailGroupAssociationPrimaryEmailSection({ mode, recordId }: Props) {
  const viewMode = mode === "view"
  const isEditMode = mode === "edit"
  const tenantCode = useGetTenantCode()
  const { data: session } = useSession()

  const [primaryEmails, setPrimaryEmails] = useState<string[]>([])
  const [ccEmails, setCcEmails] = useState<string[]>([])
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [recordData, setRecordData] = useState<any[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const normalizeEmailList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    }
    return []
  }

  const apiCriteria = useMemo(() => {
    const criteria = [{ field: "tenantCode", operator: "eq", value: tenantCode || "" }]
    if (recordId) {
      criteria.push({ field: "_id", operator: "eq", value: String(recordId) })
    }
    return criteria
  }, [recordId, tenantCode])

  const {
    data: mailGroupAssociationResponse,
    loading: isLoadingRecord,
    error: mailGroupAssociationError,
    refetch: refetchMailGroupAssociation,
  } = useRequest<any>({
    url: "mailGroupAssociation/search",
    method: "POST",
    data: apiCriteria,
    dependencies: [recordId, tenantCode],
    onSuccess: (data) => {
      const records = Array.isArray(data)
        ? data
        : Array.isArray((data as { data?: unknown[] })?.data)
          ? ((data as { data: unknown[] }).data as any[])
          : []
      const active = records.filter((item: any) => item?.isDeleted !== true)
      setRecordData(active)
    },
    onError: (fetchError) => {
      console.error("Error fetching mail group association data:", fetchError)
      setRecordData([])
    },
  })

  const { post: postAssociation } = usePostRequest<any>({
    url: "mailGroupAssociation",
  })

  useEffect(() => {
    if (!recordId || mode === "add") {
      setRecordData([])
      setPrimaryEmails([])
      setCcEmails([])
      return
    }
    void refetchMailGroupAssociation()
  }, [recordId, mode, tenantCode, refetchMailGroupAssociation])

  useEffect(() => {
    if (mailGroupAssociationError) {
      console.error("Mail group association fetch error:", mailGroupAssociationError)
    }
  }, [mailGroupAssociationError])

  useEffect(() => {
    if (mailGroupAssociationResponse && !Array.isArray(mailGroupAssociationResponse)) {
      setRecordData([])
    }
  }, [mailGroupAssociationResponse])

  useEffect(() => {
    if (isLoadingRecord) return
    if (!recordId || mode === "add") return
    if (!Array.isArray(recordData) || recordData.length === 0) {
      setPrimaryEmails([])
      setCcEmails([])
      return
    }
    const initialData = recordData[0]
    setPrimaryEmails(normalizeEmailList(initialData?.primaryEmail ?? initialData?.primaryEmails))
    setCcEmails(normalizeEmailList(initialData?.ccEmail ?? initialData?.ccEmails))
  }, [recordId, mode, recordData, isLoadingRecord])
  const selectedRows = useMemo(() => primaryEmails.map((email) => ({ email })), [primaryEmails])
  const selectedRowsLatestFirst = useMemo(() => [...selectedRows].reverse(), [selectedRows])
  const columns: ActionTableColumn<{ email: string }>[] = [
    { key: "slNo", label: "Sl No", render: (_row, index) => index + 1 },
    { key: "email", label: "Email", render: (row) => row.email },
    {
      key: "action",
      label: "Action",
      render: (row) =>
        viewMode ? null : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-slate-100"
            title="Remove"
            aria-label="Remove email"
            onClick={() => {
              setDeleteTarget(row.email)
              setShowDeleteConfirm(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
    },
  ]
  const searchFields: ActionTableSearchField<{ email: string }>[] = [{ value: "email", label: "Email", getValue: (row) => row.email }]
  return (
    <div className="space-y-4">
      <MailGroupAssociationPrimarySelectedTable
        rows={selectedRowsLatestFirst}
        columns={columns}
        searchFields={searchFields}
        viewMode={viewMode}
        onAdd={() => setIsSelectorOpen(true)}
      />

      <MailGroupAssociationPrimarySelectorPopup
        open={isSelectorOpen && !viewMode}
        onClose={() => setIsSelectorOpen(false)}
        selectedEmailIds={primaryEmails}
        onSelectedEmailIdsChange={setPrimaryEmails}
      />

      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove Primary Email</h3>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Are you sure you want to remove this email?
                </p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-xs text-gray-700">
                Email: <span className="font-mono font-semibold">{deleteTarget}</span>
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteTarget(null)
                  }}
                  className="px-3 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const updatedEmails = primaryEmails.filter((e) => e !== deleteTarget)
                    const payload = {
                      tenant: tenantCode,
                      action: isEditMode && recordId ? "update" : "insert",
                      ...(isEditMode && recordId ? { id: recordId } : {}),
                      collectionName: "mailGroupAssociation",
                      data: {
                        primaryEmail: updatedEmails,
                      },
                    }
                    await postAssociation(payload)
                    setPrimaryEmails(updatedEmails)
                    setShowDeleteConfirm(false)
                    setDeleteTarget(null)
                  }}
                  className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
