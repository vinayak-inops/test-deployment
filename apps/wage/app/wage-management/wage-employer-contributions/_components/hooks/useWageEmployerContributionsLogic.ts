"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type WageSearchField =
  | "pf.enabled"
  | "esi.enabled"
  | "pf.maxWageLimit"
  | "esi.maxGrossSalaryLimit"

export interface WageEmployerContributionsRow {
  _id: string
  organizationCode: string
  pfEnabled: boolean
  pfMaxWageLimit: number
  pfEmployerRate: number
  esiEnabled: boolean
  esiMaxGrossSalaryLimit: number
  esiEmployerRate: number
  lwfStateCount: number
  lwfStates: string[]
  updatedOn: string
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<WageSearchField, string> = {
  "pf.enabled": "PF Status",
  "esi.enabled": "ESI Status",
  "pf.maxWageLimit": "PF Max Wage Limit",
  "esi.maxGrossSalaryLimit": "ESI Max Salary Limit",
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function extractLWFStates(lwf: any): string[] {
  const states = new Set<string>()
  if (lwf?.employer) {
    lwf.employer.forEach((config: any) => {
      if (config.state) states.add(config.state)
    })
  }
  if (lwf?.employee) {
    lwf.employee.forEach((config: any) => {
      if (config.state) states.add(config.state)
    })
  }
  return Array.from(states)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWageEmployerContributionsLogic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows] = useState<WageEmployerContributionsRow[]>([])
  const [searchField, setSearchField] = useState<WageSearchField>("pf.enabled")
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
    screenName: "wageEmployerContributions",
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
      let field = searchField
      let value: any = query
      
      // Handle boolean search for enabled fields
      if (searchField === "pf.enabled" || searchField === "esi.enabled") {
        value = query.toLowerCase() === "true" || query.toLowerCase() === "enabled"
      } else if (searchField === "pf.maxWageLimit" || searchField === "esi.maxGrossSalaryLimit") {
        // Handle numeric search
        value = parseInt(query)
        if (isNaN(value)) return criteria
      }
      
      criteria.push({ field, operator: "like", value })
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
    url: "wageEmployerContributions/count",
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load wage employer contributions count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url: `wageEmployerContributions/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)

      const mapped: WageEmployerContributionsRow[] = list.map((item: any) => {
        const lwfStates = extractLWFStates(item?.lwf)
        
        return {
          _id: item?._id?.$oid || item?._id || "",
          organizationCode: item?.organizationCode || "-",
          pfEnabled: item?.pf?.enabled ?? false,
          pfMaxWageLimit: item?.pf?.maxWageLimit ?? 0,
          pfEmployerRate: item?.pf?.employer?.totalContributionRate ?? 0,
          esiEnabled: item?.esi?.enabled ?? false,
          esiMaxGrossSalaryLimit: item?.esi?.maxGrossSalaryLimit ?? 0,
          esiEmployerRate: item?.esi?.employer?.contributionRate ?? 0,
          lwfStateCount: lwfStates.length,
          lwfStates: lwfStates,
          updatedOn: item?.updatedOn || "-",
          raw: item,
        }
      })

      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading wage employer contributions data:", error)
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

  const closeForm = () => router.push("/wage-management/wage-employer-contributions")

  const refreshData = async () => {
    await refetchCounter()
    await refetch()
  }

  // ── Derived flags ──────────────────────────────────────────────────────────

  const hasAnyPermission = viewMode || editMode || addMode

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
    isFormMode: mode === "edit" || mode === "view",
    rowId,

    // navigation
    navigateToEdit,
    navigateToView,
    closeForm,
    refreshData,
  }
}
