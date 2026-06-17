"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmployeeWageSearchField =
  | "employeeID"
  | "effectiveFrom"
  | "effectiveTo"

export interface EmployeeWageTemplateRow {
  _id: string
  employeeID: string
  effectiveFrom: string
  effectiveTo: string
  remark: string
  dependentSalaryHeads: string[]
  independentSalaryHeadsCount: number
  updatedOn: string
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<EmployeeWageSearchField, string> = {
  employeeID: "Employee ID",
  effectiveFrom: "Effective From",
  effectiveTo: "Effective To",
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEmployeeWageTemplateLogic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows] = useState<EmployeeWageTemplateRow[]>([])
  const [searchField, setSearchField] = useState<EmployeeWageSearchField>("employeeID")
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
  const rowId = searchParams.get("id")

  // ── Permissions ────────────────────────────────────────────────────────────

  const { responseData: rolePermissions, loading: permissionsLoading } = useRolePermissions({
    serviceName: "wage",
    screenName: "employeeWageTemplate",
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
    url: "employeeWageTemplate/count",
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load employee wage template count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url: `employeeWageTemplate/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)

      const mapped: EmployeeWageTemplateRow[] = list.map((item: any) => ({
        _id: item?._id?.$oid || item?._id || "",
        employeeID: item?.employeeID || "-",
        effectiveFrom: item?.effectiveFrom || "-",
        effectiveTo: item?.effectiveTo || "-",
        remark: item?.remark || "",
        dependentSalaryHeads: Array.isArray(item?.dependentSalaryHeads) ? item.dependentSalaryHeads : [],
        independentSalaryHeadsCount: Array.isArray(item?.independentSalaryHeads)
          ? item.independentSalaryHeads.length
          : 0,
        updatedOn: item?.updatedOn || "-",
        raw: item,
      }))

      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading employee wage template data:", error)
      setRows([])
    },
  })

  // ── Refetch on dependency change ───────────────────────────────────────────

  useEffect(() => {
    if (!tenantCode) return
    void refetchCounter()
    void refetch()
  }, [tenantCode, currentPage, searchField, searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchField, searchTerm])

  // ── Navigation helpers ─────────────────────────────────────────────────────

  const navigateToEdit = (id: string) =>
    router.push(`?mode=edit&id=${encodeURIComponent(id)}`)

  const navigateToView = (id: string) =>
    router.push(`?mode=view&id=${encodeURIComponent(id)}`)

  const closeForm = () => router.push("/wage-management/employee-wage-template")

  const refreshData = async () => {
    await refetchCounter()
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

    mode,
    isFormMode: mode === "edit" || mode === "view",
    rowId,

    navigateToEdit,
    navigateToView,
    closeForm,
    refreshData,
  }
}
