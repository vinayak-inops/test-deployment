"use client"

import { useMemo, useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailTemplateSearchField =
  | "templateName"
  | "subject"
  | "createdBy"

export type EmailTemplateRow = {
  _id: string
  templateName: string
  subject: string
  createdBy: string
  createdOn: string
  updatedOn: string
  isActive: boolean
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<EmailTemplateSearchField, string> = {
  templateName: "Template Name",
  subject: "Subject",
  createdBy: "Created By",
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEmailTemplateLogic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows] = useState<EmailTemplateRow[]>([])
  const [searchField, setSearchField] = useState<EmailTemplateSearchField>("templateName")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [viewMode, setViewMode] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [stableRolePermissions, setStableRolePermissions] = useState<Record<string, boolean> | null>(null)
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const [isDraftPopupOpen, setIsDraftPopupOpen] = useState(false)

  // ── Route / mode params ────────────────────────────────────────────────────

  const modeParam = searchParams.get("mode")
  const mode: "add" | "edit" | "view" | null =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : null
  const isFormMode = mode !== null
  const rowId = searchParams.get("id")

  // ── Permissions ────────────────────────────────────────────────────────────

  const { responseData: rolePermissions, loading: permissionsLoading } = useRolePermissions({
    serviceName: "setting",
    screenName: "emailTemplates",
  })

  useEffect(() => {
    if (rolePermissions) setStableRolePermissions(rolePermissions)
  }, [rolePermissions])

  const effectivePermissions = stableRolePermissions ?? rolePermissions

  useEffect(() => {
    setViewMode(!!effectivePermissions?.view)
    setEditMode(!!effectivePermissions?.edit)
    setAddMode(!!effectivePermissions?.add)
  }, [effectivePermissions])

  // ── API criteria ───────────────────────────────────────────────────────────

  const apiCriteria = useMemo(() => {
    const criteria: Array<{ field: string; operator: string; value: any }> = [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "createdOn", operator: "desc", value: "" },
    ]

    const query = searchTerm.trim()
    if (query) {
      criteria.push({ field: searchField, operator: "like", value: query })
    }

    return criteria
  }, [tenantCode, searchField, searchTerm])

  // ── Pagination ─────────────────────────────────────────────────────────────

  const offset = useMemo(() => (currentPage - 1) * PAGE_SIZE, [currentPage])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalCount)

  // ── API: count ─────────────────────────────────────────────────────────────

  const { loading: countLoading, refetch: refetchCount } = useRequest<any>({
    url: "email_templates/count",
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load email template count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch, loading: listLoading } = useRequest<any[]>({
    url: `email_templates/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)

      const mapped: EmailTemplateRow[] = list.map((item: any) => ({
        _id: item?._id?.$oid || item?._id || "",
        templateName: item?.templateName || "-",
        subject: item?.subject || "-",
        createdBy: item?.createdBy || "-",
        createdOn: item?.createdOn ? formatDate(item.createdOn) : "-",
        updatedOn: item?.updatedOn ? formatDate(item.updatedOn) : "-",
        isActive: item?.isActive ?? false,
        raw: item,
      }))

      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading email template data:", error)
      setRows([])
    },
  })

  // ── Refresh data function ──────────────────────────────────────────────────

  const refreshData = useCallback(async () => {
    if (!tenantCode) return
    refetchCount(), 
    refetch()
  }, [tenantCode])

  // ── Refetch on dependency change ───────────────────────────────────────────

  useEffect(() => {
    if (!tenantCode) return
    void refreshData()
  }, [tenantCode, currentPage, searchField, searchTerm, mode, refreshData])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchField, searchTerm])

  
  // ── Derived flags ──────────────────────────────────────────────────────────

  const hasAnyPermission = viewMode || editMode || addMode

  return {
    rows,
    totalCount,
    totalPages,
    safePage,
    startIndex,
    endIndex,
    searchField,
    setSearchField,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    loading,
    countLoading,
    viewMode,
    editMode,
    addMode,
    hasAnyPermission,
    effectivePermissions,
    permissionsLoading,
    isAddPopupOpen,
    setIsAddPopupOpen,
    isDraftPopupOpen,
    setIsDraftPopupOpen,
    mode,
    isFormMode,
    rowId,
    refreshData, // Export refreshData function
    listLoading, // Export list loading state if needed
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}