"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type SalaryTemplateSearchField =
  | "name"
  | "code"
  | "state"
  | "zone"
  | "country"
  | "subsidiary.subsidiaryName"
  | "designation.designationName"
  | "grade.gradeName"
  | "category.categoryName"

export interface SalaryHead {
  salaryHeadCode: string
  salaryHeadName: string
  amount: number
  parseID: string
}

export interface WageSalaryTemplateRow {
  _id: string
  name: string
  code: string
  state: string
  zone: string
  country: string
  subsidiaryCode: string
  subsidiaryName: string
  locationCode: string
  locationName: string
  designationCode: string
  designationName: string
  gradeCode: string
  gradeName: string
  categoryCode: string
  categoryName: string
  skilledLevelTitle: string
  skilledLevelDescription: string
  effectiveFrom: string
  effectiveTo: string
  salaryHeads: SalaryHead[]
  independentSalaryHeads: SalaryHead[]
  dependentSalaryHeads: string[]
  asPerMinimumWages: boolean
  remark: string
  updatedOn: string
  raw: any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<SalaryTemplateSearchField, string> = {
  name: "Name",
  code: "Code",
  state: "State",
  zone: "Zone",
  country: "Country",
  "subsidiary.subsidiaryName": "Subsidiary",
  "designation.designationName": "Designation",
  "grade.gradeName": "Grade",
  "category.categoryName": "Category",
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWageSalaryTemplatesLogic() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows] = useState<WageSalaryTemplateRow[]>([])
  const [searchField, setSearchField] = useState<SalaryTemplateSearchField>("name")
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
    serviceName: "wage",
    screenName: "wageSalaryTemplates",
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
    url: "wageSalaryTemplates/count",
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load salary templates count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url: `wageSalaryTemplates/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data: apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)

      const mapped: WageSalaryTemplateRow[] = list.map((item: any) => ({
        _id: item?._id?.$oid || item?._id || "",
        name: item?.name || "-",
        code: item?.code || "-",
        state: item?.state || "-",
        zone: item?.zone || "-",
        country: item?.country || "-",
        subsidiaryCode: item?.subsidiary?.subsidiaryCode || "-",
        subsidiaryName: item?.subsidiary?.subsidiaryName || "-",
        locationCode: item?.location?.locationCode || "-",
        locationName: item?.location?.locationName || "-",
        designationCode: item?.designation?.designationCode || "-",
        designationName: item?.designation?.designationName || "-",
        gradeCode: item?.grade?.gradeCode || "-",
        gradeName: item?.grade?.gradeName || "-",
        categoryCode: item?.category?.categoryCode || "-",
        categoryName: item?.category?.categoryName || "-",
        skilledLevelTitle: item?.skillLevel?.skilledLevelTitle || "-",
        skilledLevelDescription: item?.skillLevel?.skilledLevelDescription || "-",
        effectiveFrom: item?.effectiveFrom || "-",
        effectiveTo: item?.effectiveTo || "-",
        salaryHeads: Array.isArray(item?.salaryHeads)
          ? item.salaryHeads.map((h: any) => ({
              salaryHeadCode: h?.salaryHeadCode || "",
              salaryHeadName: h?.salaryHeadName || "",
              amount: h?.amount ?? 0,
              parseID: h?.parseID || "",
            }))
          : [],
        independentSalaryHeads: Array.isArray(item?.independentSalaryHeads)
          ? item.independentSalaryHeads.map((h: any) => ({
              salaryHeadCode: h?.salaryHeadCode || "",
              salaryHeadName: h?.salaryHeadName || "",
              amount: h?.amount ?? 0,
              parseID: h?.parseID || "",
            }))
          : [],
        dependentSalaryHeads: Array.isArray(item?.dependentSalaryHeads)
          ? item.dependentSalaryHeads
          : [],
        asPerMinimumWages: item?.asPerMinimumWages ?? false,
        remark: item?.remark || "",
        updatedOn: item?.updatedOn || "-",
        raw: item,
      }))

      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading salary templates data:", error)
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