"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { FileText, Search, ChevronsUpDown, Users, Clock } from "lucide-react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { toast } from "react-toastify"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import {
  useEmployeeShiftGraphql,
  type FetchedEmployee,
  type ShiftGroupOption,
  type ShiftOption,
} from "@/hooks/api/useEmployeeShiftGraphql"
import { validateBasicEmployeeInformationForm } from "../schemas/basic-employee-information-form.schema"

export interface BasicEmployeeInformationValues {
  shiftGroupCode: string
  shiftGroupName: string
  shiftCode: string
  shiftName: string
  /** Full selected shift object (may include nested grace) – final output for backend */
  shift?: Record<string, unknown>
  /** Root-level grace settings (e.g. minimumDurationForPresent, allowNormalComputation) */
  grace?: Record<string, unknown>
  fromDate: string
  toDate: string
  isAutomatic: boolean
  isActive: boolean
  isRotational: boolean
  isFixedShift: boolean
}

export const defaultBasicEmployeeInformationValues: BasicEmployeeInformationValues = {
  shiftGroupCode: "",
  shiftGroupName: "",
  shiftCode: "",
  shiftName: "",
  fromDate: "",
  toDate: "",
  isAutomatic: false,
  isActive: true,
  isRotational: false,
  isFixedShift: false,

}

interface BasicEmployeeInformationFormProps {
  /** Employee ID for display only */
  employeeId?: string
  /** When set (edit/view), form fetches record from API and populates */
  recordId?: string | null
  disabled?: boolean
  /** Used to force refetch when parent tab changes */
  tabChangeKey?: number
  employeeSearchUrl?: string
}

/** Only these shift keys are shown in the details block (no internal or grace fields) */
const SHIFT_DISPLAY_KEYS = new Set([
  "shiftCode", "shiftName", "shiftStart", "shiftEnd",
  "firstHalfStart", "firstHalfEnd", "secondHalfStart", "secondHalfEnd",
  "lunchStart", "lunchEnd", "duration", "crossDay", "flexible",
  "flexiFullDayDuration", "flexiHalfDayDuration",
  "minimumDurationForFullDay", "minimumDurationForHalfDay",
])

/** Only these grace keys are shown in the details block */
const GRACE_DISPLAY_KEYS = new Set([
  "inAheadMargin", "inAboveMargin", "outAheadMargin", "outAboveMargin",
  "lateInAllowedTime", "earlyOutAllowedTime", "graceIn", "graceOut",
  "minimumDurationForPresent", "allowNormalComputation",
])

export function BasicEmployeeInformationForm({
  employeeId,
  recordId,
  disabled = false,
  tabChangeKey,
  employeeSearchUrl = "employee_shift",
}: BasicEmployeeInformationFormProps) {
  const router = useRouter()
  const {
    watch,
    setValue,
    getValues,
    reset,
    formState: { isDirty },
  } = useForm<BasicEmployeeInformationValues>({
    defaultValues: defaultBasicEmployeeInformationValues,
  })
  const lastHydratedSignatureRef = useRef<string>("")
  const formValues = watch()
  const [shiftGroupPopoverOpen, setShiftGroupPopoverOpen] = useState(false)
  const [shiftPopoverOpen, setShiftPopoverOpen] = useState(false)
  const [shiftGroupSearch, setShiftGroupSearch] = useState("")
  const [shiftSearch, setShiftSearch] = useState("")
  const [debouncedShiftGroupSearch, setDebouncedShiftGroupSearch] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({})
  const [generalError, setGeneralError] = useState<string>("")
  const [activeConfirmPending, setActiveConfirmPending] = useState(false)
  const shiftGroupDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters)
  const toIdString = (value: unknown): string | null => {
    if (typeof value === "string") {
      const trimmed = value.trim()
      return trimmed ? trimmed : null
    }
    if (value && typeof value === "object" && "$oid" in (value as Record<string, unknown>)) {
      const oid = (value as { $oid?: unknown }).$oid
      if (typeof oid === "string" && oid.trim()) return oid.trim()
    }
    if (value == null) return null
    const str = String(value).trim()
    return str && str !== "[object Object]" ? str : null
  }
  const normalizedRecordId = toIdString(recordId)

  const hierarchyFiltersForHook = useMemo(() => {
    if (!empHierarchyFilters) return undefined
    const withCategories = empHierarchyFilters as { categories?: string[] }
    return {
      subsidiaries: empHierarchyFilters.subsidiaries,
      locations: empHierarchyFilters.locations,
      categories: withCategories.categories,
    }
  }, [empHierarchyFilters])

  const {
    fetchedEmployee,
    shiftGroups,
    shiftGroupsLoading,
    shiftGroupsError,
    shiftOptions,
  } = useEmployeeShiftGraphql({
    tenantCode,
    employeeId,
    shiftGroupCode: formValues.shiftGroupCode,
    shiftGroupSearch: debouncedShiftGroupSearch
  })

  const shouldFetchRecord = Boolean(normalizedRecordId)
  const getFetchRecordRequestData = () => {
  if (!shouldFetchRecord) return null

  const criteriaRequests: Array<{ field: string; operator: "eq"; value: string }> = [
    { field: "tenantCode", operator: "eq", value: tenantCode || "" },
    { field: "_id", operator: "eq", value: normalizedRecordId! },
  ]

  return {
    hierarchyFilters: empHierarchyFilters ?? {},
    criteriaRequests,
    userEntitlement,
  }
}
  const { data: fetchedRecord, refetch: refetchRecord } = useRequest<any[]>({
    url: `employee_shift/searchWithHierarchy?offset=0&limit=1`,
    method: "POST",
    data: getFetchRecordRequestData(),
    onSuccess(data){
    },
    onError(error) {
      console.error("Error fetching record:", error)
    }
  })

 
  const serverFieldMap: Record<string, string> = {
    employeeID:     "employeeId",
    shiftGroupCode: "shiftGroupCode",
    shiftGroupName: "shiftGroupName",
    shiftCode:      "shiftCode",
    shiftName:      "shiftName",
    fromDate:       "fromDate",
    toDate:         "toDate",
    isAutomatic:    "isAutomatic",
    isActive:       "isActive",
    isRotational:   "isRotational",
    isFixedShift:   "isFixedShift",
  }

  const isEditMode = Boolean(normalizedRecordId)

  const { post: postEmployeeShift, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const nextErrors: Partial<Record<string, string>> = {}
        const unmappedMessages: string[] = []
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const localKey =
            serverFieldMap[fieldName] ??
            serverFieldMap[fieldName.split(".").pop() || ""]
          if (!localKey) {
            unmappedMessages.push(message)
            return
          }
          nextErrors[localKey] = message
        })
        setFieldErrors((prev) => ({ ...prev, ...nextErrors }))
        setGeneralError(unmappedMessages.join(" • "))
        return
      }

      setGeneralError("")
      toast.success(`Employee shift ${isEditMode ? "updated" : "created"} successfully!`)
      const createdId =
        response?._id?.$oid ||
        response?._id ||
        response?.id ||
        response?.data?._id?.$oid ||
        response?.data?._id ||
        response?.data?.id

      if (!normalizedRecordId && createdId) {
        router.push(`/employee-management/employee-shift?mode=edit&id=${encodeURIComponent(String(createdId))}`)
        return
      }
      if (normalizedRecordId) {
        void refetchRecord()
      }
    },
    onError: (error) => {
      console.error("Error saving employee shift:", error)
      toast.error(`Failed to ${isEditMode ? "update" : "create"} employee shift`)
    },
  })

  useEffect(() => {
    const record = Array.isArray(fetchedRecord) ? fetchedRecord[0] : undefined
    if (!record) return
    const recordShift = record.shift && typeof record.shift === "object" && Object.keys(record.shift).length > 0 && "shiftCode" in record.shift ? record.shift : undefined
    const nextValues: BasicEmployeeInformationValues = {
      ...defaultBasicEmployeeInformationValues,
      shiftGroupCode: record.shiftGroupCode ?? "",
      shiftGroupName: record.shiftGroupName ?? "",
      shiftCode: (recordShift as { shiftCode?: string })?.shiftCode ?? record.shiftCode ?? "",
      shiftName: (recordShift as { shiftName?: string })?.shiftName ?? record.shiftName ?? "",
      shift: record.shift ?? undefined,
      grace: record.grace ?? undefined,
      fromDate: record.fromDate ?? "",
      toDate: record.toDate ?? "",
      isAutomatic: record.isAutomatic ?? false,
      isActive: record.isActive ?? true,
      isRotational: record.isRotational ?? false,
      isFixedShift: record.isFixedShift ?? false,
    }
    const signature = JSON.stringify({
      id: record?._id ?? normalizedRecordId ?? "",
      updatedOn: record?.updatedOn ?? "",
      values: nextValues,
    })

    // Prevent background refetches from wiping in-progress edits.
    if (isDirty && lastHydratedSignatureRef.current) return
    if (lastHydratedSignatureRef.current === signature) return

    reset(nextValues)
    lastHydratedSignatureRef.current = signature
  }, [fetchedRecord, reset, isDirty, normalizedRecordId])

  useEffect(() => {
    if (shouldFetchRecord) return
    reset(defaultBasicEmployeeInformationValues)
    lastHydratedSignatureRef.current = ""
  }, [shouldFetchRecord, reset])

  // Force refetch from server (bypassing cache) whenever the parent tab changes,
  // so the form always shows the latest saved data from other steps.
  useEffect(() => {
    if (!shouldFetchRecord) return
    void refetchRecord()
  }, [tenantCode,normalizedRecordId])

  // Debounce shift group search (e.g. 350ms) then query with "like" operator
  useEffect(() => {
    if (shiftGroupDebounceRef.current) {
      clearTimeout(shiftGroupDebounceRef.current)
      shiftGroupDebounceRef.current = null
    }
    shiftGroupDebounceRef.current = setTimeout(() => {
      setDebouncedShiftGroupSearch(shiftGroupSearch.trim())
      shiftGroupDebounceRef.current = null
    }, 350)
    return () => {
      if (shiftGroupDebounceRef.current) {
        clearTimeout(shiftGroupDebounceRef.current)
        shiftGroupDebounceRef.current = null
      }
    }
  }, [shiftGroupSearch])

  const filteredShiftOptions = useMemo(() => {
    const q = shiftSearch.trim().toLowerCase()
    if (!q) return shiftOptions
    return shiftOptions.filter(
      (s) =>
        (s.shiftCode || "").toLowerCase().includes(q) ||
        (s.shiftName || "").toLowerCase().includes(q)
    )
  }, [shiftOptions, shiftSearch])

  const displayShiftGroup =
    formValues.shiftGroupCode || formValues.shiftGroupName
      ? `${formValues.shiftGroupName || formValues.shiftGroupCode} (${formValues.shiftGroupCode || formValues.shiftGroupName})`
      : ""

  const displayShift =
    formValues.shiftCode || formValues.shiftName
      ? `${formValues.shiftName || formValues.shiftCode} (${formValues.shiftCode || formValues.shiftName})`
      : ""

  const handleShiftGroupSelect = (sg: ShiftGroupOption) => {
    setValue("shiftGroupCode", sg.shiftGroupCode, { shouldDirty: true })
    setValue("shiftGroupName", sg.shiftGroupName, { shouldDirty: true })
    setValue("shiftCode", "", { shouldDirty: true })
    setValue("shiftName", "", { shouldDirty: true })
    setValue("shift", undefined, { shouldDirty: true })
    setValue("grace", undefined, { shouldDirty: true })
    setFieldErrors((prev) => ({ ...prev, shiftGroupCode: undefined, shiftCode: undefined }))
    setShiftGroupPopoverOpen(false)
    setShiftGroupSearch("")
    setShiftSearch("")
  }

  const handleShiftSelect = (opt: ShiftOption) => {
    setValue("shiftCode", opt.shiftCode, { shouldDirty: true })
    setValue("shiftName", opt.shiftName, { shouldDirty: true })
    setValue("shift", opt.shift, { shouldDirty: true })
    setValue("grace", opt.grace, { shouldDirty: true })
    setFieldErrors((prev) => ({ ...prev, shiftCode: undefined }))
    setShiftPopoverOpen(false)
    setShiftSearch("")
  }

  const formatEmployeeName = (emp: FetchedEmployee | null) => {
    if (!emp) return ""
    const parts = [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).map(String)
    return parts.join(" ").trim() || emp.employeeID || ""
  }
  const safeDeploy = (emp: FetchedEmployee | null) => emp?.deployment ?? {}
  const gradeDisplay = (emp: FetchedEmployee | null) => {
    const g = safeDeploy(emp).grade
    return g?.gradeName ?? g?.gradeCode ?? ""
  }
  const designationDisplay = (emp: FetchedEmployee | null) => {
    const d = safeDeploy(emp).designation
    return d?.designationName ?? d?.designationCode ?? ""
  }
  const categoryDisplay = (emp: FetchedEmployee | null) => {
    const c = safeDeploy(emp).employeeCategory
    return c?.employeeCategoryName ?? c?.employeeCategoryCode ?? ""
  }

  const handleSave = async () => {
    const values = getValues()
    const validation = validateBasicEmployeeInformationForm(values)
    if (!validation.success && validation.errors) {
      setFieldErrors(validation.errors)
      return
    }
    setFieldErrors({})
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: normalizedRecordId } : {}),
      collectionName: "employee_shift",
      event:          "validate",
      ruleId:         "employeeShift",
      data: {
        ...(employeeId ? { employeeID: employeeId } : {}),
        shiftGroupCode: values.shiftGroupCode,
        shiftGroupName: values.shiftGroupName,
        shiftCode: values.shiftCode,
        shiftName: values.shiftName,
        shift: values.shift ?? {},
        grace: values.grace ?? {},
        fromDate: values.fromDate,
        toDate: values.toDate,
        isAutomatic: values.isAutomatic,
        isActive: values.isActive,
        isRotational: values.isRotational,
        isFixedShift: values.isFixedShift,
      },
    }
    postEmployeeShift?.(payload)
  }

  const handleReset = () => {
    reset(defaultBasicEmployeeInformationValues)
    setFieldErrors({})
    setGeneralError("")
    setActiveConfirmPending(false)
    setShiftGroupSearch("")
    setShiftSearch("")
  }

  return (
    <div className="w-full mx-auto space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-0">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Basic Employee Information</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Employee ID, shift group, effective dates, and configuration settings
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 space-y-6">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {generalError && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="mt-0.5 flex-shrink-0">⚠</span>
                <span>{generalError}</span>
              </div>
            )}
            {/* Employee Information – layout like punch-requests-popup-new (label | value rows) */}
            {employeeId != null && employeeId !== "" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-700">Employee Information</h3>
                </div>
                {fetchedEmployee ? (
                  <div className="w-full space-y-0">
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Name</label>
                      <span className="text-sm text-gray-900 font-medium">{formatEmployeeName(fetchedEmployee) || "—"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Employee ID</label>
                    <span className="text-sm text-gray-500">Loading employee details…</span>
                  </div>
                )}
              </div>
            )}

            {/* Shift Group + Shift on same line */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Shift Group <span className="text-red-500 normal-case">*</span>
                </Label>
                <Popover open={shiftGroupPopoverOpen} onOpenChange={setShiftGroupPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={disabled}
                      className={`relative w-full h-10 border rounded-lg pl-10 pr-10 text-left transition-all bg-white hover:border-gray-400 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.shiftGroupCode ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-gray-900"}`}
                    >
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <span className="block truncate text-sm text-gray-700">
                        {shiftGroupsLoading
                          ? "Loading..."
                          : displayShiftGroup || "Search by shift group code or name"}
                      </span>
                      <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl">
                    <Command shouldFilter={false} className="bg-white">
                      <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <CommandInput
                            value={shiftGroupSearch}
                            onValueChange={setShiftGroupSearch}
                            placeholder="Search..."
                            className="pl-8 h-9"
                          />
                        </div>
                      </div>
                      <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                        {!tenantCode?.trim() ? (
                          <CommandEmpty>Tenant code required to load shift groups</CommandEmpty>
                        ) : shiftGroupsError ? (
                          <CommandEmpty>Failed to load shift groups</CommandEmpty>
                        ) : shiftGroups.length === 0 ? (
                          <CommandEmpty>No shift group found</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {shiftGroups.map((sg) => (
                              <CommandItem
                                key={sg.shiftGroupCode}
                                value={`${sg.shiftGroupCode} - ${sg.shiftGroupName}`}
                                onSelect={() => handleShiftGroupSelect(sg)}
                                className="cursor-pointer"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{sg.shiftGroupName || sg.shiftGroupCode}</div>
                                  <div className="text-xs text-gray-500">Code: {sg.shiftGroupCode}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-gray-500 text-xs mt-1">Search by code or name</p>
              </div>

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Shift <span className="text-red-500 normal-case">*</span>
                </Label>
                <Popover open={shiftPopoverOpen} onOpenChange={setShiftPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={disabled || !formValues.shiftGroupCode}
                      className="relative w-full h-10 border rounded-lg pl-10 pr-10 text-left transition-all bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <span className="block truncate text-sm text-gray-700">
                        {formValues.shiftGroupCode
                          ? displayShift || "Select shift (code / name)"
                          : "Select a shift group first"}
                      </span>
                      <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl">
                    <Command shouldFilter={false} className="bg-white">
                      <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <CommandInput
                            value={shiftSearch}
                            onValueChange={setShiftSearch}
                            placeholder="Search shift..."
                            className="pl-8 h-9"
                          />
                        </div>
                      </div>
                      <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                        {filteredShiftOptions.length === 0 ? (
                          <CommandEmpty>No shift found</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {filteredShiftOptions.map((s, i) => (
                              <CommandItem
                                key={`${s.shiftCode}-${s.shiftName}-${i}`}
                                value={`${s.shiftCode} - ${s.shiftName}`}
                                onSelect={() => handleShiftSelect(s)}
                                className="cursor-pointer"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{s.shiftName || s.shiftCode}</div>
                                  <div className="text-xs text-gray-500">Code: {s.shiftCode}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-gray-500 text-xs mt-1">Select shift; full shift object is stored for submit</p>
                {fieldErrors.shiftCode && (
                  <p className="text-red-500 text-xs mt-0.5" role="alert">{fieldErrors.shiftCode}</p>
                )}
              </div>
            </div>

            {/* Shift & Grace details – only whitelisted keys, 2–3 items per row */}
            {(formValues.shift && Object.keys(formValues.shift).some((k) => SHIFT_DISPLAY_KEYS.has(k))) ||
            (formValues.grace && Object.keys(formValues.grace).some((k) => GRACE_DISPLAY_KEYS.has(k))) ? (
              <div className="w-full space-y-4 border border-gray-200 rounded-lg bg-gray-50/50 p-4">
                {formValues.shift && Object.keys(formValues.shift).some((k) => SHIFT_DISPLAY_KEYS.has(k)) && (
                  <div className="space-y-0">
                    <h3 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-200">Shift</h3>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                      {Object.entries(formValues.shift)
                        .filter(([key]) => SHIFT_DISPLAY_KEYS.has(key))
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between gap-2 border-b border-gray-100 py-2 min-w-0">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0 truncate">
                              {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim()}
                            </label>
                            <span className="text-sm font-medium text-gray-900 text-right truncate">
                              {value === null || value === undefined ? "—" : String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {formValues.grace && Object.keys(formValues.grace).some((k) => GRACE_DISPLAY_KEYS.has(k)) && (
                  <div className="space-y-0">
                    <h3 className="text-sm font-semibold text-gray-900 pb-2 border-b border-gray-200 mt-4">Grace</h3>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                      {Object.entries(formValues.grace)
                        .filter(([key]) => GRACE_DISPLAY_KEYS.has(key))
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between gap-2 border-b border-gray-100 py-2 min-w-0">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0 truncate">
                              {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim()}
                            </label>
                            <span className="text-sm font-medium text-gray-900 text-right truncate">
                              {value === null || value === undefined ? "—" : String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Date Range */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Date Range</h3>
                <p className="text-sm text-gray-500 mt-1">Effective from and to dates</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromDate" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    From Date <span className="text-red-500 normal-case">*</span>
                  </Label>
                  <Input
                    id="fromDate"
                    type="date"
                    value={formValues.fromDate}
                    onChange={(e) => {
                      setValue("fromDate", e.target.value, { shouldDirty: true })
                      if (fieldErrors.fromDate) setFieldErrors((prev) => ({ ...prev, fromDate: undefined }))
                    }}
                    max={formValues.toDate || undefined}
                    disabled={disabled}
                    className={`h-9 rounded-md ${fieldErrors.fromDate ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300"}`}
                  />
                  {fieldErrors.fromDate ? (
                    <p className="text-red-500 text-xs mt-0.5" role="alert">{fieldErrors.fromDate}</p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1">Format: YYYY-MM-DD</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toDate" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    To Date <span className="text-red-500 normal-case">*</span>
                  </Label>
                  <Input
                    id="toDate"
                    type="date"
                    value={formValues.toDate}
                    onChange={(e) => {
                      setValue("toDate", e.target.value, { shouldDirty: true })
                      if (fieldErrors.toDate) setFieldErrors((prev) => ({ ...prev, toDate: undefined }))
                    }}
                    min={formValues.fromDate || undefined}
                    disabled={disabled}
                    className={`h-9 rounded-md ${fieldErrors.toDate ? "border-red-500 focus-visible:ring-red-500" : "border-gray-300"}`}
                  />
                  {fieldErrors.toDate ? (
                    <p className="text-red-500 text-xs mt-0.5" role="alert">{fieldErrors.toDate}</p>
                  ) : (
                    <p className="text-gray-500 text-xs mt-1">Format: YYYY-MM-DD</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Shift Type (mutually exclusive) ── */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Shift Type</h3>
                <p className="text-sm text-gray-500 mt-1">Select one shift assignment type</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {(["isAutomatic", "isRotational", "isFixedShift"] as const).map((key) => {
                  const label = key === "isAutomatic" ? "Automatic" : key === "isRotational" ? "Rotational" : "Fixed Shift"
                  const isChecked = !!formValues[key]
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors shrink-0 ${
                        isChecked ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (disabled) return
                          if (checked) {
                            setValue("isAutomatic", false, { shouldDirty: true })
                            setValue("isRotational", false, { shouldDirty: true })
                            setValue("isFixedShift", false, { shouldDirty: true })
                            setValue(key, true, { shouldDirty: true })
                          } else {
                            setValue(key, false, { shouldDirty: true })
                          }
                        }}
                        disabled={disabled}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* ── Active Status (confirmation required) ── */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Status</h3>
                <p className="text-sm text-gray-500 mt-1">Toggle active status requires confirmation</p>
              </div>
              <div className="flex items-center gap-4">
                <label
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors shrink-0 ${
                    formValues.isActive ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <Checkbox
                    checked={formValues.isActive}
                    onCheckedChange={() => {
                      if (disabled) return
                      setActiveConfirmPending(true)
                    }}
                    disabled={disabled}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                    <span className={`ml-2 text-xs font-normal px-1.5 py-0.5 rounded-full ${formValues.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                      {formValues.isActive ? "On" : "Off"}
                    </span>
                  </span>
                </label>
              </div>

              {activeConfirmPending && (
                <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
                  <span className="text-amber-600 text-sm mt-0.5">⚠</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      {formValues.isActive ? "Deactivate this shift assignment?" : "Activate this shift assignment?"}
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {formValues.isActive
                        ? "Setting to inactive will mark this record as disabled."
                        : "Setting to active will enable this shift assignment."}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setValue("isActive", !formValues.isActive, { shouldDirty: true })
                          setActiveConfirmPending(false)
                        }}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveConfirmPending(false)}
                        className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer – same structure as form-excel-upload */}
        {!disabled && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <ActionButtons
              layout="end"
              gap="gap-3"
              secondaryLabel="Reset"
              onSecondary={handleReset}
              primaryLabel="Save Changes"
              onPrimary={handleSave}
              primaryLoading={postLoading}
              primaryDisabled={postLoading}
              className="w-full"
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            />
          </div>
        )}
      </div>
    </div>
  )
}
