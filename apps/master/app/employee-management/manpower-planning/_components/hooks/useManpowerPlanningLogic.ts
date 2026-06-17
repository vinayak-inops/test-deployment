"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ManpowerSearchField =
  | "subsidiary.subsidiaryName"
  | "division.divisionName"
  | "location.locationName"
  | "department.departmentName"
  | "shiftGroupCode"
  | "shiftCode"

export interface ManpowerEntry {
  subsidiary: {
    subsidiaryCode: string
    subsidiaryName: string
  }
  division: {
    divisionCode: string
    divisionName: string
  }
  location: {
    locationCode: string
    locationName: string
  }
  department: {
    departmentCode: string
    departmentName: string
  }
  fromDate: string
  toDate: string
  shiftGroupCode: string
  shiftCode: string
  manpower: {
    planned: number
    rotaPlanned: number
    bench: number
    iedRequired: number
  }
}

export interface ManpowerPlanningRow {
  _id: string
  subsidiaryCode: string
  subsidiaryName: string
  divisionCode: string
  divisionName: string
  locationCode: string
  locationName: string
  departmentCode: string
  departmentName: string
  fromDate: string
  toDate: string
  shiftGroupCode: string
  shiftCode: string
  planned: number
  rotaPlanned: number
  bench: number
  iedRequired: number
  totalManpower: number
  updatedOn: string
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<ManpowerSearchField, string> = {
  "subsidiary.subsidiaryName": "Subsidiary",
  "division.divisionName": "Division",
  "location.locationName": "Location",
  "department.departmentName": "Department",
  "shiftGroupCode": "Shift Group",
  "shiftCode": "Shift",
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function calculateTotalManpower(manpower: ManpowerEntry["manpower"]): number {
  return manpower.planned + manpower.rotaPlanned + manpower.bench + manpower.iedRequired
}

function formatDateForDisplay(dateStr: string): string {
  if (!dateStr || dateStr === "-") return "-"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useManpowerPlanningLogic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows] = useState<ManpowerPlanningRow[]>([])
  const [searchField, setSearchField] = useState<ManpowerSearchField>("subsidiary.subsidiaryName")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [viewMode, setViewMode] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [stableRolePermissions, setStableRolePermissions] = useState<Record<string, boolean> | null>(null)

  // ── Route / mode params ────────────────────────────────────────────────────

  const modeParam = searchParams.get("mode")
  const mode: "add" | "edit" | "view" | null =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : null
  const isFormMode = mode !== null
  const rowId = searchParams.get("id")

  // ── Permissions ────────────────────────────────────────────────────────────

  const { responseData: rolePermissions, loading: permissionsLoading } = useRolePermissions({
    serviceName: "employeeManagement",
    screenName: "manpowerPlanning",
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
      { field: "updatedOn", operator: "desc", value: "" },
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
    url: "manpowerPlanning/count",
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load manpower planning count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url: `manpowerPlanning/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)

      const mapped: ManpowerPlanningRow[] = list.map((item: any) => {
        const manpowerData = item?.manpower || {}
        return {
          _id: item?._id?.$oid || item?._id || "",
          subsidiaryCode: item?.subsidiary?.subsidiaryCode || "-",
          subsidiaryName: item?.subsidiary?.subsidiaryName || "-",
          divisionCode: item?.division?.divisionCode || "-",
          divisionName: item?.division?.divisionName || "-",
          locationCode: item?.location?.locationCode || "-",
          locationName: item?.location?.locationName || "-",
          departmentCode: item?.department?.departmentCode || "-",
          departmentName: item?.department?.departmentName || "-",
          fromDate: formatDateForDisplay(item?.fromDate),
          toDate: formatDateForDisplay(item?.toDate),
          shiftGroupCode: item?.shiftGroupCode || "-",
          shiftCode: item?.shiftCode || "-",
          planned: manpowerData?.planned ?? 0,
          rotaPlanned: manpowerData?.rotaPlanned ?? 0,
          bench: manpowerData?.bench ?? 0,
          iedRequired: manpowerData?.iedRequired ?? 0,
          totalManpower: calculateTotalManpower(manpowerData),
          updatedOn: item?.updatedOn || "-",
          raw: item,
        }
      })

      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading manpower planning data:", error)
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