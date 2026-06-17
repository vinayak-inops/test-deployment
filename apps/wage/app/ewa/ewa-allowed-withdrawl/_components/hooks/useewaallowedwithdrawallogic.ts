"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters"

// ─── Types ────────────────────────────────────────────────────────────────────

export type EWAAllowedWithdrawalSearchField =
  | "employeeID"

export type EWAAllowedWithdrawalRow = {
  _id: string
  employeeID: string
  limit: number | string
  withdrawn: number | string
  available: number | string
  version: number | string
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<EWAAllowedWithdrawalSearchField, string> = {
  employeeID: "Employee ID",
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEWAAllowedWithdrawalLogic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters)

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows] = useState<EWAAllowedWithdrawalRow[]>([])
  const [searchField, setSearchField] = useState<EWAAllowedWithdrawalSearchField>("employeeID")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSelections] = useState({
    subsidiaries: [],
    divisions: [],
    departments: [],
    locations: [],
    contractors: [],
    workOrderNumbers: [],
    employeeID: "",
  })
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
    serviceName: "ewa",
    screenName: "EWAAllowedWithdrawal",
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
    ]

    const query = searchTerm.trim()
    if (query) {
      criteria.push({ field: searchField, operator: "like", value: query })
    }

    return criteria
  }, [tenantCode, searchField, searchTerm])

  const hierarchyFilters = useHierarchyFilters(filterSelections)

  const requestData = useMemo(
    () => ({
      hierarchyFilters,
      criteriaRequests: apiCriteria,
      userEntitlement,
    }),
    [hierarchyFilters, apiCriteria, userEntitlement],
  )

  // ── Pagination ─────────────────────────────────────────────────────────────

  const offset = useMemo(() => (currentPage - 1) * PAGE_SIZE, [currentPage])

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalCount)

  // ── API: count ─────────────────────────────────────────────────────────────

  const { loading: countLoading, refetch: refetchCount } = useRequest<any>({
    url: "EWA_allowed_withdrawl/count/searchWithHierarchy",
    method: "POST",
    data: requestData,
    dependencies: [tenantCode, searchField, searchTerm, userEntitlement],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load EWA allowed withdrawal count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url: `EWA_allowed_withdrawl/searchWithHierarchy?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data: requestData,
    dependencies: [tenantCode, currentPage, searchField, searchTerm, userEntitlement],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)

      const mapped: EWAAllowedWithdrawalRow[] = list.map((item: any) => ({
        _id: item?._id?.$oid || item?._id || "",
        employeeID: item?.employeeID || "-",
        limit: item?.limit != null ? item.limit : "-",
        withdrawn: item?.withdrawn != null ? item.withdrawn : "-",
        available: item?.available != null ? item.available : "-",
        version: item?.version != null ? item.version : "-",
        raw: item,
      }))

      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading EWA allowed withdrawal data:", error)
      setRows([])
    },
  })

  // ── Refetch on dependency change ───────────────────────────────────────────

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
    router.push(`/ewa/ewa-allowed-withdrawl?mode=edit&id=${encodeURIComponent(id)}`)

  const navigateToView = (id: string) =>
    router.push(`/ewa/ewa-allowed-withdrawl?mode=view&id=${encodeURIComponent(id)}`)

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
    refetch,
    refetchCount,
  }
}
