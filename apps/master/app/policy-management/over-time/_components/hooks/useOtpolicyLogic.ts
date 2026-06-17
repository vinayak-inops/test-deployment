"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// ─── Types ────────────────────────────────────────────────────────────────────

export type OtPolicySearchField =
  | "subsidiary.subsidiaryName"
  | "location.locationName"
  | "otPolicy.otPolicyCode"
  | "otPolicy.otPolicyName"
  | "otPolicy.calculateOnTheBasisOf"
  | "otPolicy.status"

export interface OtPolicyRow {
  _id:                string
  // subsidiary
  subsidiaryCode:     string
  subsidiaryName:     string
  // location
  locationCode:       string
  locationName:       string
  // employee category
  employeeCategory:   string[]
  // ot policy detail
  otPolicyCode:                       string
  otPolicyName:                       string
  calculateOnTheBasisOf:              string
  multiplierForWorkingDay:            number
  multiplierForNationalHoliday:       number
  multiplierForHoliday:               number
  multiplierForWeeklyOff:             number
  dailyMaximumAllowedHours:           number
  weeklyMaximumAllowedHours:          number
  monthlyMaximumAllowedHours:         number
  quaterlyMaximumAllowedHours:        number
  yearlyMaximumAllowedHours:          number
  maximumHoursOnHoliday:              number
  maximumHoursOnWeekend:              number
  maximumHoursOnWeekday:              number
  minimumExtraMinutesConsideredForOT: number
  roundingEnabled:                    boolean
  afterRoundingOff:                   boolean
  beforeRoundingOff:                  boolean
  doThisWhenCrossedAllocatedLimit:    string
  approvalRequired:                   boolean
  minimumFixedMinutesToAllowOvertime: number
  status:                             string
  remark:                             string
  isConsideredForHoliday:             boolean
  isConsideredForNationalHoliday:     boolean
  isConsideredForWeeklyOff:           boolean
  isConsideredForWorkingDay:          boolean
  isConsideredBeforeShift:            boolean
  isConsideredAfterShift:             boolean
  perHourRate:                        number
  updatedOn:                          string
  raw:                                any
}

export const PAGE_SIZE = 10

export const FIELD_LABELS: Record<OtPolicySearchField, string> = {
  "subsidiary.subsidiaryName":        "Subsidiary",
  "location.locationName":            "Location",
  "otPolicy.otPolicyCode":            "Policy Code",
  "otPolicy.otPolicyName":            "Policy Name",
  "otPolicy.calculateOnTheBasisOf":   "Calculate On",
  "otPolicy.status":                  "Status",
}

// ─── Safe string extractor ────────────────────────────────────────────────────
// Guards against the API returning a field as an object e.g. { calculationBasis: "Hourly" }
function safeStr(value: any, fallback = "-"): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value || fallback
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (typeof value === "object") {
    const first = Object.values(value).find((v) => typeof v === "string")
    return (first as string) || fallback
  }
  return fallback
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOtPolicyLogic() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tenantCode   = useGetTenantCode()

  // ── State ──────────────────────────────────────────────────────────────────

  const [rows, setRows]               = useState<OtPolicyRow[]>([])
  const [searchField, setSearchField] = useState<OtPolicySearchField>("otPolicy.otPolicyName")
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
      screenName:  "overTime",
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
      { field: "updatedOn",  operator: "desc", value: "" },
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
    url:    "ot_policy/count",
    method: "POST",
    data:   apiCriteria,
    dependencies: [tenantCode, searchField, searchTerm],
    onSuccess: (count) => {
      setTotalCount(typeof count === "number" ? count : Number(count) || 0)
    },
    onError: (e) => {
      console.error("Failed to load OT policy count", e)
      setTotalCount(0)
    },
  })

  // ── API: list ──────────────────────────────────────────────────────────────

  const { loading, refetch } = useRequest<any[]>({
    url:    `ot_policy/search?offset=${offset}&limit=${PAGE_SIZE}`,
    method: "POST",
    data:   apiCriteria,
    dependencies: [tenantCode, currentPage, searchField, searchTerm],
    onSuccess: (data) => {
      const list = (Array.isArray(data) ? data : []).filter(
        (item: any) => item?.isDeleted !== true
      )
      const mapped: OtPolicyRow[] = list.map((item: any) => {
        const p = item?.otPolicy ?? {}
        return {
          _id:                            item?._id?.$oid || item?._id || "",
          subsidiaryCode:                 safeStr(item?.subsidiary?.subsidiaryCode),
          subsidiaryName:                 safeStr(item?.subsidiary?.subsidiaryName),
          locationCode:                   safeStr(item?.location?.locationCode),
          locationName:                   safeStr(item?.location?.locationName),
          employeeCategory:               Array.isArray(item?.employeeCategory) ? item.employeeCategory.map((c: any) => safeStr(c)) : [],
          otPolicyCode:                   safeStr(p.otPolicyCode),
          otPolicyName:                   safeStr(p.otPolicyName),
          calculateOnTheBasisOf:          safeStr(p.calculateOnTheBasisOf),
          multiplierForWorkingDay:        typeof p.multiplierForWorkingDay === "number" ? p.multiplierForWorkingDay : parseFloat(p.multiplierForWorkingDay) || 0,
          multiplierForNationalHoliday:   typeof p.multiplierForNationalHoliday === "number" ? p.multiplierForNationalHoliday : parseFloat(p.multiplierForNationalHoliday) || 0,
          multiplierForHoliday:           typeof p.multiplierForHoliday === "number" ? p.multiplierForHoliday : parseFloat(p.multiplierForHoliday) || 0,
          multiplierForWeeklyOff:         typeof p.multiplierForWeeklyOff === "number" ? p.multiplierForWeeklyOff : parseFloat(p.multiplierForWeeklyOff) || 0,
          dailyMaximumAllowedHours:       typeof p.dailyMaximumAllowedHours === "number" ? p.dailyMaximumAllowedHours : parseFloat(p.dailyMaximumAllowedHours) || 0,
          weeklyMaximumAllowedHours:      typeof p.weeklyMaximumAllowedHours === "number" ? p.weeklyMaximumAllowedHours : parseFloat(p.weeklyMaximumAllowedHours) || 0,
          monthlyMaximumAllowedHours:     typeof p.monthlyMaximumAllowedHours === "number" ? p.monthlyMaximumAllowedHours : parseFloat(p.monthlyMaximumAllowedHours) || 0,
          quaterlyMaximumAllowedHours:    typeof p.quaterlyMaximumAllowedHours === "number" ? p.quaterlyMaximumAllowedHours : parseFloat(p.quaterlyMaximumAllowedHours) || 0,
          yearlyMaximumAllowedHours:      typeof p.yearlyMaximumAllowedHours === "number" ? p.yearlyMaximumAllowedHours : parseFloat(p.yearlyMaximumAllowedHours) || 0,
          maximumHoursOnHoliday:          typeof p.maximumHoursOnHoliday === "number" ? p.maximumHoursOnHoliday : parseFloat(p.maximumHoursOnHoliday) || 0,
          maximumHoursOnWeekend:          typeof p.maximumHoursOnWeekend === "number" ? p.maximumHoursOnWeekend : parseFloat(p.maximumHoursOnWeekend) || 0,
          maximumHoursOnWeekday:          typeof p.maximumHoursOnWeekday === "number" ? p.maximumHoursOnWeekday : parseFloat(p.maximumHoursOnWeekday) || 0,
          minimumExtraMinutesConsideredForOT: typeof p.minimumExtraMinutesConsideredForOT === "number" ? p.minimumExtraMinutesConsideredForOT : parseFloat(p.minimumExtraMinutesConsideredForOT) || 0,
          roundingEnabled:                Boolean(p.roundingEnabled),
          afterRoundingOff:               Boolean(p.afterRoundingOff),
          beforeRoundingOff:              Boolean(p.beforeRoundingOff),
          doThisWhenCrossedAllocatedLimit: safeStr(p.doThisWhenCrossedAllocatedLimit),
          approvalRequired:               Boolean(p.approvalRequired),
          minimumFixedMinutesToAllowOvertime: typeof p.minimumFixedMinutesToAllowOvertime === "number" ? p.minimumFixedMinutesToAllowOvertime : parseFloat(p.minimumFixedMinutesToAllowOvertime) || 0,
          status:                         safeStr(p.status),
          remark:                         safeStr(p.remark),
          isConsideredForHoliday:         Boolean(p.isConsideredForHoliday),
          isConsideredForNationalHoliday: Boolean(p.isConsideredForNationalHoliday),
          isConsideredForWeeklyOff:       Boolean(p.isConsideredForWeeklyOff),
          isConsideredForWorkingDay:      Boolean(p.isConsideredForWorkingDay),
          isConsideredBeforeShift:        Boolean(p.isConsideredBeforeShift),
          isConsideredAfterShift:         Boolean(p.isConsideredAfterShift),
          perHourRate:                    typeof p.perHourRate === "number" ? p.perHourRate : parseFloat(p.perHourRate) || 0,
          updatedOn:                      safeStr(item?.updatedOn),
          raw:                            item,
        }
      })
      setRows(mapped)
    },
    onError: (error) => {
      console.error("Error loading OT policy data:", error)
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