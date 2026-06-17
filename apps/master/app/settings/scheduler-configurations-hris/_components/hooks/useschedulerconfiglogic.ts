"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type SchedulerSearchField =
  | "scheduler_name"
  | "scheduler_type"
  | "task"
  | "description"
  | "frequency.type"

export type SchedulerRow = {
  _id: string
  schedulerName: string
  schedulerType: string
  task: string
  description: string
  frequencyType: string
  cronExpression: string
  timezone: string
  startDate: string
  endDate: string
  isActive: boolean
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<SchedulerSearchField, string> = {
  scheduler_name: "Scheduler Name",
  scheduler_type: "Scheduler Type",
  task: "Task",
  description: "Description",
  "frequency.type": "Frequency Type",
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSchedulerConfigLogic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows] = useState<SchedulerRow[]>([])
  const [searchField, setSearchField] = useState<SchedulerSearchField>("scheduler_name")
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
    screenName: "schedulerConfigurationsHris",
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
      { field: "audit.created_at", operator: "desc", value: "" },
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

  const { loading: countLoading, refetch: refetchCounter } = useRequest<any>({
    url: "scheduler_configurations/count",
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load scheduler count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url: `scheduler_configurations/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)

      const mapped: SchedulerRow[] = list.map((item: any) => ({
        _id: item?._id?.$oid || item?._id || "",
        schedulerName: item?.scheduler_name || "-",
        schedulerType: item?.scheduler_type || "-",
        task: item?.task || "-",
        description: item?.description || "-",
        frequencyType: item?.frequency?.type || "-",
        cronExpression: item?.frequency?.cron_expression || "-",
        timezone: item?.frequency?.timezone || "-",
        startDate: item?.schedule_window?.start_date || "-",
        endDate: item?.schedule_window?.end_date || "-",
        isActive: item?.isActive ?? false,
        raw: item,
      }))

      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading scheduler data:", error)
      setRows([])
    },
  })

  // ── Refetch on dependency change ───────────────────────────────────────────

  useEffect(() => {
    if (!tenantCode) return
    void refetchCounter()
    void refetch()
  }, [tenantCode, currentPage, searchField, searchTerm, mode])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchField, searchTerm])

  // ── Navigation helpers ─────────────────────────────────────────────────────

  const navigateToEdit = (id: string) =>
    router.push(`?mode=edit&id=${encodeURIComponent(id)}`)

  const navigateToView = (id: string) =>
    router.push(`?mode=view&id=${encodeURIComponent(id)}`)

  const navigateToAdd = () => router.push("?mode=add")

  const closeForm = () => router.push("?")

  // ── Derived flags ──────────────────────────────────────────────────────────

  const hasAnyPermission = viewMode || editMode || addMode
  const refreshData = async () => {
    await refetchCounter()
    await refetch()
  }

  return {
    // data
    rows,
    totalCount,
    totalPages,
    safePage,
    startIndex,
    endIndex,

    // search
    searchField,
    setSearchField,
    searchTerm,
    setSearchTerm,

    // pagination
    currentPage,
    setCurrentPage,

    // loading
    loading,
    countLoading,

    // permissions
    viewMode,
    editMode,
    addMode,
    hasAnyPermission,
    effectivePermissions,
    permissionsLoading,

    // popup state
    isAddPopupOpen,
    setIsAddPopupOpen,
    isDraftPopupOpen,
    setIsDraftPopupOpen,

    // route
    mode,
    isFormMode,
    rowId,

    // navigation
    navigateToEdit,
    navigateToView,
    navigateToAdd,
    closeForm,
    refreshData,
  }
}
