"use client"

import { useEffect, useMemo, useState } from "react"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import PageNotFound from "@/components/page-notfound"
import TableHeader from "@/components/header/table-header"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import MailGroupAssociationFilterBar, { type MailGroupSearchField } from "./mail-group-association-filter-bar"
import MailGroupAssociationTable from "./mail-group-association-table"
import MailGroupCodePopup from "./mail-group-code-popup"
import MailGroupAssociationForm from "./mail-group-association-from"
import { useRouter, useSearchParams } from "next/navigation"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"

const pageSize = 10

export default function MailGroupAssociationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeParam = searchParams.get("mode")
  const rowId = searchParams.get("id")
  const selectedMailGroupCodeFromQuery = searchParams.get("mailGroupCode")
  const mode: "add" | "edit" | "view" | null =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : null
  const isFormMode = mode !== null

  const [fullRows, setFullRows] = useState<any[]>([])
  const [searchField, setSearchField] = useState<MailGroupSearchField>("mailGroup")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isMailGroupPopupOpen, setIsMailGroupPopupOpen] = useState(false)
  const [selectedMailGroupCode, setSelectedMailGroupCode] = useState<string | null>(null)
  const [pendingMailGroupCode, setPendingMailGroupCode] = useState<string | null>(null)
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()

  const formatDateTime = (value: any) => {
    if (!value) return ""
    const date = new Date(value)
    if (isNaN(date.getTime())) return String(value)
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const [viewMode, setViewMode] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [addMode, setAddMode] = useState(false)

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "setting",
    screenName: "mailGroupAssociation",
  })

  useEffect(() => {
    setViewMode(!!rolePermissions?.view)
    setEditMode(!!rolePermissions?.edit)
    setAddMode(!!rolePermissions?.add)
  }, [rolePermissions])

  useEffect(() => {
    setSelectedMailGroupCode(selectedMailGroupCodeFromQuery || null)
  }, [selectedMailGroupCodeFromQuery])

  const apiCriteria = useMemo(() => {
    const criteria: Array<{ field: string; operator: string; value: string }> = [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "createdOn", operator: "desc", value: "" },
    ]
    const q = searchTerm.trim()
    if (q) {
      criteria.push({ field: searchField, operator: "like", value: q })
    }
    return criteria
  }, [tenantCode, searchField, searchTerm])

  const extractRecordId = (response: any) =>
    response?._id?.$oid ||
    response?._id ||
    response?.id ||
    response?.data?._id?.$oid ||
    response?.data?._id ||
    response?.data?.id

  const { post: createAssociationFromCode } = usePostRequest<any>({
    url: "mailGroupAssociation",
    onSuccess: (response) => {
      const createdId = extractRecordId(response)
      if (createdId) {
        setIsMailGroupPopupOpen(false)
        router.push(`/settings/mail-group-association?mode=edit&id=${encodeURIComponent(String(createdId))}`)
        return
      }
      if (pendingMailGroupCode) {
        setIsMailGroupPopupOpen(false)
        router.push(`/settings/mail-group-association?mode=add&mailGroupCode=${encodeURIComponent(pendingMailGroupCode)}`)
      }
    },
  })

  const handleSelectMailGroupCode = (item: { mailGroupCode: string }) => {
    const selectedCode = item.mailGroupCode
    setPendingMailGroupCode(selectedCode)
    void createAssociationFromCode({
      tenant: tenantCode,
      action: "insert",
      collectionName: "mailGroupAssociation",
      data: {
        tenantCode,
        organizationCode: tenantCode,
        mailGroup: selectedCode,
        primaryEmail: [],
        ccEmail: [],
        createdOn: formatDateTime(new Date()),
        createdBy: employeeId,
      },
    })
  }

  const offset = useMemo(() => (currentPage - 1) * pageSize, [currentPage])
  const limit = pageSize

  const { loading: countLoading, refetch: refetchCount } = useRequest<any>({
    url: "mailGroupAssociation/count",
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load association count", e)
      setTotalCount(0)
    },
  })

  const { loading, refetch } = useRequest<any[]>({
    url: `mailGroupAssociation/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const active = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)
      setFullRows(active)
    },
    onError: (e) => {
      console.error("Failed to load associations", e)
      setFullRows([])
    },
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchCount()
    void refetch()
  }, [tenantCode, currentPage, searchField, searchTerm])

  const mappedRows = useMemo(
    () =>
      [...fullRows].map((r: any) => ({
          _id: r?._id?.$oid || r?._id || "",
          mailGroup: r?.mailGroup || "-",
          primaryEmail: Array.isArray(r?.primaryEmail) ? r.primaryEmail.join(", ") : "-",
          ccEmail: Array.isArray(r?.ccEmail) ? r.ccEmail.join(", ") : "-",
          createdOn: formatDateTime(r?.createdOn),
          createdBy: r?.createdBy || "-",
          raw: r,
        })),
    [fullRows]
  )

  const totalItems = totalCount
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentSafePage = Math.min(currentPage, totalPages)
  const startIndex = (currentSafePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const pageRows = mappedRows

  useEffect(() => {
    setCurrentPage(1)
  }, [searchField, searchTerm])

  const openAddForm = () => {
    if (!addMode) return
    setIsMailGroupPopupOpen(true)
  }

  const canAccessRequestedMode =
    (mode === "view" && viewMode) ||
    (mode === "edit" && editMode) ||
    (mode === "add" && addMode)

  if (!(viewMode || editMode || addMode)) {
    return <PageNotFound />
  }

  if (isFormMode) {
    if (!canAccessRequestedMode) return <PageNotFound />
    if ((mode === "edit" || mode === "view") && !rowId) return <PageNotFound />

    return (
      <>
        <MailGroupAssociationForm
          open={true}
          setOpen={((_: any) => {}) as any}
          layout="page"
          onBack={() => {
            router.push("/settings/mail-group-association")
          }}
          recordId={rowId}
          isEditMode={mode === "edit"}
          isViewMode={mode === "view"}
        />

        <MailGroupCodePopup
          open={isMailGroupPopupOpen}
          onClose={() => setIsMailGroupPopupOpen(false)}
          onSelect={handleSelectMailGroupCode}
        />
      </>
    )
  }

  return (
    <>
      <div>
        <TableHeader
          title="Mail Group Association"
          description={
            loading || countLoading
              ? "Associate mail groups with primary and CC recipients | Loading..."
              : `Associate mail groups with primary and CC recipients | ${totalItems} associations`
          }
          canAdd={addMode}
          onAddNew={() => openAddForm()}
          addButtonText="Add New Mail Group"
        />

        <MailGroupAssociationFilterBar
          searchField={searchField}
          setSearchField={setSearchField}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          canAdd={addMode}
          onAdd={() => openAddForm()}
        />

        <MailGroupAssociationTable
          loading={loading || countLoading}
          rows={pageRows}
          startIndex={startIndex}
          totalItems={totalItems}
          endIndex={endIndex}
          currentPage={currentSafePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          canEdit={editMode}
          canView={viewMode}
          onEdit={(raw) => {
            const id = raw?._id?.$oid || raw?._id
            if (!id) return
            router.push(`/settings/mail-group-association?mode=edit&id=${encodeURIComponent(String(id))}`)
          }}
          onView={(raw) => {
            const id = raw?._id?.$oid || raw?._id
            if (!id) return
            router.push(`/settings/mail-group-association?mode=view&id=${encodeURIComponent(String(id))}`)
          }}
        />
      </div>

      <MailGroupCodePopup
        open={isMailGroupPopupOpen}
        onClose={() => setIsMailGroupPopupOpen(false)}
        onSelect={handleSelectMailGroupCode}
      />
    </>
  )
}
