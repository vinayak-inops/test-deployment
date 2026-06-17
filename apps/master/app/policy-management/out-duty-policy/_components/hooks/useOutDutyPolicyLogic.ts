"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type OutDutySearchField =
  | "subsidiary.subsidiaryName"
  | "location.locationName"
  | "designation.designationName"

export interface OutDutyPolicyRow {
  _id: string
  // subsidiary
  subsidiaryCode: string
  subsidiaryName: string
  // location
  locationCode: string
  locationName: string
  // designation
  designationCode: string
  designationName: string
  // employee categories
  employeeCategory: string[]
  // policy flags
  sandwichHolidayAsOutDuty: boolean
  sandwichWeekOffAsOutDuty: boolean
  isAllowedInNoticePeriod:  boolean
  allowStartOrEndOnHoliday: boolean
  allowStartOrEndOnWeekOff: boolean
  autoApprovalAllowed:      boolean
  // limits
  minimumMinutesPerApplication: number
  maximumMinutesPerApplication: number
  minimumDaysPerApplication:    number
  maximumDaysPerApplication:    number
  updatedOn: string
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<OutDutySearchField, string> = {
  "subsidiary.subsidiaryName":   "Subsidiary",
  "location.locationName":       "Location",
  "designation.designationName": "Designation",
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOutDutyPolicyLogic() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tenantCode   = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows]               = useState<OutDutyPolicyRow[]>([])
  const [searchField, setSearchField] = useState<OutDutySearchField>("subsidiary.subsidiaryName")
  const [searchTerm, setSearchTerm]   = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount]   = useState(0)
  const [viewMode, setViewMode]       = useState(false)
  const [editMode, setEditMode]       = useState(false)
  const [addMode, setAddMode]         = useState(false)
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
      screenName:  "outduty",
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
    url:    "outDutyPolicy/count",
    method: "POST",
    data:   apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load outDutyPolicy count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url:    `outDutyPolicy/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data:   apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter(
        (item: any) => item?.isDeleted !== true
      )
      const mapped: OutDutyPolicyRow[] = list.map((item: any) => ({
        _id:            item?._id?.$oid || item?._id || "",
        subsidiaryCode: item?.subsidiary?.subsidiaryCode || "-",
        subsidiaryName: item?.subsidiary?.subsidiaryName || "-",
        locationCode:   item?.location?.locationCode     || "-",
        locationName:   item?.location?.locationName     || "-",
        designationCode: item?.designation?.designationCode || "-",
        designationName: item?.designation?.designationName || "-",
        employeeCategory: Array.isArray(item?.employeeCategory)
          ? item.employeeCategory
          : [],
        sandwichHolidayAsOutDuty: item?.policy?.sandwichHolidayAsOutDuty ?? false,
        sandwichWeekOffAsOutDuty:  item?.policy?.sandwichWeekOffAsOutDuty  ?? false,
        isAllowedInNoticePeriod:   item?.policy?.isAllowedInNoticePeriod   ?? false,
        allowStartOrEndOnHoliday:  item?.policy?.allowStartOrEndOnHoliday  ?? false,
        allowStartOrEndOnWeekOff:  item?.policy?.allowStartOrEndOnWeekOff  ?? false,
        autoApprovalAllowed:       item?.policy?.autoApproval?.autoApprovalAllowed ?? false,
        minimumMinutesPerApplication: item?.policy?.hourlyPolicy?.minimumMinutesPerApplication ?? 0,
        maximumMinutesPerApplication: item?.policy?.hourlyPolicy?.maximumMinutesPerApplication ?? 0,
        minimumDaysPerApplication:    item?.policy?.dailyPolicy?.minimumDaysPerApplication    ?? 0,
        maximumDaysPerApplication:    item?.policy?.dailyPolicy?.maximumDaysPerApplication    ?? 0,
        updatedOn: item?.updatedOn || "-",
        raw:       item,
      }))
      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading outDutyPolicy data:", error)
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
