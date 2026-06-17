"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

export type EmpCategorySettingSearchField =
  | "employeeCategoryCode"
  | "sourceEmailAddess"

export interface EmpCategorySettingRow {
  _id: string
  employeeCategoryCode: string
  sourceEmailAddess: string
  allowMobileApp: boolean
  includeHolidayInPresentDays: boolean
  autoMarkPresent: boolean
  temporaryEmployee: boolean
  graceIn: number
  graceOut: number
  lateInAllowedTime: number
  earlyOutAllowedTime: number
  outAheadMargin: number
  createdOn: string
  createdBy: string
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<EmpCategorySettingSearchField, string> = {
  employeeCategoryCode: "Category Code",
  sourceEmailAddess: "Source Email",
}

function safeStr(value: any, fallback = "-") {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value || fallback
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return fallback
}

function formatDateTime(value: any) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return safeStr(value)
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

export function useEmployeeCategorySettingLogic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()

  const [rows, setRows] = useState<EmpCategorySettingRow[]>([])
  const [searchField, setSearchField] = useState<EmpCategorySettingSearchField>("employeeCategoryCode")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [viewMode, setViewMode] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [addMode, setAddMode] = useState(false)
  const [stableRolePermissions, setStableRolePermissions] = useState<Record<string, boolean> | null>(null)

  const modeParam = searchParams.get("mode")
  const mode: "add" | "edit" | "view" | null =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : null
  const isFormMode = mode !== null
  const rowId = searchParams.get("id")

  const { responseData: rolePermissions, loading: permissionsLoading } = useRolePermissions({
    serviceName: "setting",
    screenName: "employeeCategorySetting",
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

  const url = useMemo(() => {
    const params = new URLSearchParams()
    if (tenantCode) params.set("tenantCode", tenantCode)
    const query = searchTerm.trim()
    if (query) params.set(searchField, query)
    return `map/employee_category_setting/search?${params.toString()}`
  }, [tenantCode, searchField, searchTerm])

  const { loading, refetch } = useRequest<any[]>({
    url,
    method: "GET",
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)
      const mapped = list.map((item: any) => ({
        _id: item?._id?.$oid || item?._id || "",
        employeeCategoryCode: safeStr(item.employeeCategoryCode || item.employeeCategory),
        sourceEmailAddess: safeStr(item.sourceEmailAddess),
        allowMobileApp: !!item.genericSettings?.allowMobileApp,
        includeHolidayInPresentDays: !!item.genericSettings?.includeHolidayInPresentDays,
        autoMarkPresent: !!item.genericSettings?.autoMarkPresent,
        temporaryEmployee: !!item.genericSettings?.temporaryEmployee,
        graceIn: Number(item.shiftGraceSettings?.graceIn ?? 0),
        graceOut: Number(item.shiftGraceSettings?.graceOut ?? 0),
        lateInAllowedTime: Number(item.shiftGraceSettings?.lateInAllowedTime ?? 0),
        earlyOutAllowedTime: Number(item.shiftGraceSettings?.earlyOutAllowedTime ?? 0),
        outAheadMargin: Number(item.shiftGraceSettings?.outAheadMargin ?? 0),
        createdOn: formatDateTime(item.createdOn),
        createdBy: safeStr(item.createdBy, ""),
        raw: item,
      }))
      setRows(mapped)
      setTotalCount(mapped.length)
    },
    onError: () => {
      setRows([])
      setTotalCount(0)
    },
  })

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalCount)
  const pagedRows = rows.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchField, searchTerm])

  useEffect(() => {
    if (!tenantCode) return
    void refetch()
  }, [tenantCode, searchField, searchTerm, mode])

  const navigateToEdit = (id: string) => router.push(`?mode=edit&id=${encodeURIComponent(id)}`)
  const navigateToView = (id: string) => router.push(`?mode=view&id=${encodeURIComponent(id)}`)
  const navigateToAdd = () => router.push("?mode=add")
  const closeForm = () => router.push("?")

  const refreshData = async () => {
    await refetch()
  }

  const hasAnyPermission = viewMode || editMode || addMode

  return {
    rows: pagedRows,
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
    countLoading: false,
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
