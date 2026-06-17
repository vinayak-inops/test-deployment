"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type HolidaySearchField =
  | "subsidiary.subsidiaryName"
  | "location.locationName"
  | "holiday.holidayName"
  | "holiday.holidayType"
  | "holiday.holidayDate"

export interface HolidayRow {
  _id: string
  organizationCode: string
  employeeCategory: string[]
  // subsidiary
  subsidiaryCode: string
  subsidiaryName: string
  // location
  locationCode: string
  locationName: string
  // holiday detail
  holidayType: string
  holidayName: string
  holidayDate: string
  updatedOn: string
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<HolidaySearchField, string> = {
  "subsidiary.subsidiaryName": "Subsidiary",
  "location.locationName":     "Location",
  "holiday.holidayName":       "Holiday Name",
  "holiday.holidayType":       "Holiday Type",
  "holiday.holidayDate":       "Holiday Date",
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDateForDisplay(dateStr: string): string {
  if (!dateStr || dateStr === "-") return "-"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHolidayLogic() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tenantCode   = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows]             = useState<HolidayRow[]>([])
  const [searchField, setSearchField] = useState<HolidaySearchField>("holiday.holidayName")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [viewMode, setViewMode]     = useState(false)
  const [editMode, setEditMode]     = useState(false)
  const [addMode, setAddMode]       = useState(false)
  const [stableRolePermissions, setStableRolePermissions] =
    useState<Record<string, boolean> | null>(null)

  // ── Route params ───────────────────────────────────────────────────────────

  const modeParam = searchParams.get("mode")
  const mode: "add" | "edit" | "view" | null =
    modeParam === "add" || modeParam === "edit" || modeParam === "view"
      ? modeParam
      : null
  const isFormMode = mode !== null
  const rowId      = searchParams.get("id")

  // ── Permissions ────────────────────────────────────────────────────────────

  const { responseData: rolePermissions, loading: permissionsLoading } =
    useRolePermissions({
      serviceName: "policy",
      screenName:  "holiday",
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
      { field: "tenantCode", operator: "eq",   value: tenantCode || "" },
      { field: "updatedOn",  operator: "desc",  value: "" },
    ]
    const query = searchTerm.trim()
    if (query) {
      criteria.push({ field: searchField, operator: "like", value: query })
    }
    return criteria
  }, [tenantCode, searchField, searchTerm])

  // ── Pagination ─────────────────────────────────────────────────────────────

  const offset     = useMemo(() => (currentPage - 1) * PAGE_SIZE, [currentPage])
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage   = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex   = Math.min(startIndex + PAGE_SIZE, totalCount)

  // ── API: count ─────────────────────────────────────────────────────────────

  const { loading: countLoading, refetch: refetchCounter } = useRequest<any>({
    url:    "holiday/count",
    method: "POST",
    data:   apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load holiday count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url:    `holiday/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data:   apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter(
        (item: any) => item?.isDeleted !== true
      )
      const mapped: HolidayRow[] = list.map((item: any) => ({
        _id:              item?._id?.$oid || item?._id || "",
        organizationCode: item?.organizationCode || "-",
        employeeCategory: Array.isArray(item?.employeeCategory)
          ? item.employeeCategory
          : [],
        subsidiaryCode: item?.subsidiary?.subsidiaryCode || "-",
        subsidiaryName: item?.subsidiary?.subsidiaryName || "-",
        locationCode:   item?.location?.locationCode || "-",
        locationName:   item?.location?.locationName || "-",
        holidayType:    item?.holiday?.holidayType || "-",
        holidayName:    item?.holiday?.holidayName || "-",
        holidayDate:    formatDateForDisplay(item?.holiday?.holidayDate),
        updatedOn:      item?.updatedOn || "-",
        raw:            item,
      }))
      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading holiday data:", error)
      setRows([])
    },
  })

  // ── Refetch triggers ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!tenantCode) return
    void refetchCounter()
    void refetch()
  }, [tenantCode, currentPage, searchField, searchTerm, mode])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchField, searchTerm])

  // ── Navigation ─────────────────────────────────────────────────────────────

  const navigateToEdit = (id: string) =>
    router.push(`?mode=edit&id=${encodeURIComponent(id)}`)

  const navigateToView = (id: string) =>
    router.push(`?mode=view&id=${encodeURIComponent(id)}`)

  const navigateToAdd = () => router.push("?mode=add")

  const closeForm = () => router.push("?")

  // ── Derived ────────────────────────────────────────────────────────────────

  const hasAnyPermission = viewMode || editMode || addMode

  const refreshData = async () => {
    await refetchCounter()
    await refetch()
  }

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