"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContinuousDaysBlockingSearchField =
  | "subsidiaries.subsidiaryCode"
  | "tenantCode"
  | "organizationCode"

export type ContinuousDaysBlockingRow = {
  _id: string
  subsidiaryCodes: string
  subsidiaryCount: number
  daysForContinuousPresentBlocking: number | string
  daysForContinuousAbsentBlocking: number | string
  considerDaysAsPresent: string
  notificationEnabled: boolean
  blockingEnabled: boolean
  isActive: boolean
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<ContinuousDaysBlockingSearchField, string> = {
  "subsidiaries.subsidiaryCode": "Subsidiary Code",
  tenantCode: "Tenant Code",
  organizationCode: "Organization Code",
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useContinuousDaysBlockingLogic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows] = useState<ContinuousDaysBlockingRow[]>([])
  const [searchField, setSearchField] = useState<ContinuousDaysBlockingSearchField>(
    "subsidiaries.subsidiaryCode"
  )
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
    screenName: "continuousDaysBlocking",
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
  // IMPORTANT: Remove the "desc" sort if not supported by your API
  const apiCriteria = useMemo(() => {
    const criteria: Array<{ field: string; operator: string; value: any }> = [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
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
    url: "continuousDaysBlocking/count",
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load continuous days blocking count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url: `continuousDaysBlocking/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)

      const mapped: ContinuousDaysBlockingRow[] = list.map((item: any) => {
        const subsidiaries = Array.isArray(item?.subsidiaries) ? item.subsidiaries : []

        const subsidiaryCodes =
          subsidiaries.map((s: any) => s?.subsidiaryCode).filter(Boolean).join(", ") || "-"

        const considerDays = Array.isArray(item?.considerDaysAsPresent)
          ? item.considerDaysAsPresent.join(", ")
          : "-"

        return {
          _id: item?._id?.$oid || item?._id || "",
          subsidiaryCodes,
          subsidiaryCount: subsidiaries.length,
          daysForContinuousPresentBlocking: item?.daysForContinuousPresentBlocking ?? "-",
          daysForContinuousAbsentBlocking: item?.daysForContinuousAbsentBlocking ?? "-",
          considerDaysAsPresent: considerDays,
          notificationEnabled: item?.notificationEnabled ?? false,
          blockingEnabled: item?.blockingEnabled ?? false,
          isActive: item?.isActive ?? false,
          raw: item,
        }
      })

      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading continuous days blocking data:", error)
      setRows([])
    },
  })

  // ── Refetch on dependency change ───────────────────────────────────────────
  // IMPORTANT: Add mode to dependencies to refetch when modal closes
  useEffect(() => {
    if (!tenantCode) return
    void refetchCount()
    void refetch()
  }, [tenantCode, currentPage, searchField, searchTerm, mode])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchField, searchTerm])

  // ── Navigation helpers ─────────────────────────────────────────────────────

  const navigateToEdit = (id: string) =>
    router.push(
      `/settings/continuous-days-blocking?mode=edit&id=${encodeURIComponent(id)}`
    )

  const navigateToView = (id: string) =>
    router.push(
      `/settings/continuous-days-blocking?mode=view&id=${encodeURIComponent(id)}`
    )

  const navigateToAdd = () => router.push("/settings/continuous-days-blocking?mode=add")
  
  const closeForm = () => router.push("/settings/continuous-days-blocking")
  
  const refreshData = async () => {
    await refetchCount()
    await refetch()
  }

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
    navigateToEdit,
    navigateToView,
    navigateToAdd,
    closeForm,
    refreshData,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}