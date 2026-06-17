"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type EwaContractorOutstandingSearchField =
  | "contractorCode"
  | "month"
  | "year"
  | "paid"

export interface EwaContractorOutstandingRow {
  _id:              string
  contractorCode:   string
  month:            number
  year:             number
  totalOutstanding: number
  paid:             boolean
  paidOn:           string | null
  updatedOn:        string
  raw:              any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<EwaContractorOutstandingSearchField, string> = {
  contractorCode: "Contractor Code",
  month:          "Month",
  year:           "Year",
  paid:           "Paid Status",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style:    "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDateForDisplay(dateStr: string | null): string {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString("en-IN", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEwaContractorOutstandingLogic() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tenantCode   = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows]               = useState<EwaContractorOutstandingRow[]>([])
  const [searchField, setSearchField] = useState<EwaContractorOutstandingSearchField>("contractorCode")
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
      serviceName: "ewa",
      screenName:  "ewaContractorOutstanding",
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
    url:    "EWA_contractor_outstanding/count",
    method: "POST",
    data:   apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load EWA contractor outstanding count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url:    `EWA_contractor_outstanding/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data:   apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter(
        (item: any) => item?.isDeleted !== true
      )
      const mapped: EwaContractorOutstandingRow[] = list.map((item: any) => ({
        _id:              item?._id?.$oid || item?._id || "",
        contractorCode:   item?.contractorCode || "-",
        month:            typeof item?.month === "number" ? item.month : 0,
        year:             typeof item?.year  === "number" ? item.year  : 0,
        totalOutstanding: typeof item?.totalOutstanding === "number"
          ? item.totalOutstanding
          : 0,
        paid:    !!item?.paid,
        paidOn:  formatDateForDisplay(item?.paidOn ?? null),
        updatedOn: item?.updatedOn || "-",
        raw:     item,
      }))
      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading EWA contractor outstanding data:", error)
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