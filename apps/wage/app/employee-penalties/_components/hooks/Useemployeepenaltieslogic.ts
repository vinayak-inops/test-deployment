"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmployeePenaltySearchField =
  | "employeeID"
  | "witnessEmployeeID"
  | "witnessName"
  | "actionTaken"
  | "offenceDescription"
  | "adjustmentMonth"
  | "adjustmentYear"

export type EmployeePenaltyRow = {
  _id: string
  employeeID: string
  dateOfOffence: string
  actionTaken: string
  fineImposed: number | string
  fineRealisedDate: string
  adjustmentMonth: number | string
  adjustmentYear: number | string
  witnessEmployeeID: string
  witnessName: string
  offenceDescription: string
  isCauseShownAgainstFine: boolean
  isAdjusted: boolean
  isIncludedInPayroll: boolean
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<EmployeePenaltySearchField, string> = {
  employeeID: "Employee ID",
  witnessEmployeeID: "Witness Employee ID",
  witnessName: "Witness Name",
  actionTaken: "Action Taken",
  offenceDescription: "Offence Description",
  adjustmentMonth: "Adjustment Month",
  adjustmentYear: "Adjustment Year",
}

type UseEmployeePenaltiesLogicReturn = {
  rows: EmployeePenaltyRow[]
  totalCount: number
  totalPages: number
  safePage: number
  startIndex: number
  endIndex: number
  searchField: EmployeePenaltySearchField
  setSearchField: (v: EmployeePenaltySearchField) => void
  searchTerm: string
  setSearchTerm: (v: string) => void
  currentPage: number
  setCurrentPage: (v: number) => void
  loading: boolean
  countLoading: boolean
  viewMode: boolean
  editMode: boolean
  addMode: boolean
  hasAnyPermission: boolean
  effectivePermissions: Record<string, boolean> | null | undefined
  permissionsLoading: boolean
  isAddPopupOpen: boolean
  setIsAddPopupOpen: (v: boolean) => void
  isDraftPopupOpen: boolean
  setIsDraftPopupOpen: (v: boolean) => void
  mode: "add" | "edit" | "view" | null
  isFormMode: boolean
  rowId: string | null
  navigateToEdit: (id: string) => void
  navigateToView: (id: string) => void
  refetch: () => Promise<any>
  refetchCount: () => Promise<any>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useEmployeePenaltiesLogic(): UseEmployeePenaltiesLogicReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows] = useState<EmployeePenaltyRow[]>([])
  const [searchField, setSearchField] = useState<EmployeePenaltySearchField>("employeeID")
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
    serviceName: "wage",
    screenName: "employeePenalties",
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
      { field: "dateOfOffence", operator: "desc", value: "" },
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
    url: "employee_penalties/count",
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load employee penalties count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url: `employee_penalties/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)

      const mapped: EmployeePenaltyRow[] = list.map((item: any) => ({
        _id: item?._id?.$oid || item?._id || "",
        employeeID: item?.employeeID || "-",
        dateOfOffence: item?.dateOfOffence ? formatDate(item.dateOfOffence) : "-",
        actionTaken: item?.actionTaken || "-",
        fineImposed: item?.fineImposed != null ? item.fineImposed : "-",
        fineRealisedDate: item?.fineRealisedDate ? formatDate(item.fineRealisedDate) : "-",
        adjustmentMonth: item?.adjustmentMonth ?? "-",
        adjustmentYear: item?.adjustmentYear ?? "-",
        witnessEmployeeID: item?.witnessEmployeeID || "-",
        witnessName: item?.witnessName || "-",
        offenceDescription: item?.offenceDescription || "-",
        isCauseShownAgainstFine: item?.isCauseShownAgainstFine ?? false,
        isAdjusted: item?.isAdjusted ?? false,
        isIncludedInPayroll: item?.isIncludedInPayroll ?? false,
        raw: item,
      }))

      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading employee penalties data:", error)
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
    router.push(`/employee-penalties?mode=edit&id=${encodeURIComponent(id)}`)

  const navigateToView = (id: string) =>
    router.push(`/employee-penalties?mode=view&id=${encodeURIComponent(id)}`)

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
