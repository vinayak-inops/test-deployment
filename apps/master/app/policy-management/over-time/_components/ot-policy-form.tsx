"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { Building2, FileText, TrendingUp, Clock, AlertCircle, Flag, X, Filter, SearchIcon, Check, Trash2 } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { GradientFormHeader } from "@/components/header/form-header"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import SingleSelectField from "@/components/fields/single-select-field"
import { Button } from "@repo/ui/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@repo/ui/components/ui/command"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table"
import { toast } from "react-toastify"
import {
  defaultOtPolicyValues,
  otPolicySchema,
  type OtPolicyFormValues,
} from "./schemas/ot-policy-form.schema"
import NumericInput from "@/components/fields/input/number-input"
import BooleanToggle from "@/components/fields/input/boolean-toggle"

type Mode = "add" | "edit" | "view"

type Props = {
  mode: Mode
  rowId?: string | null
  tenantCode?: string
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CALCULATE_ON_OPTIONS = [
  { value: "Hourly", label: "Hourly" },
  { value: "Daily", label: "Daily" },
  { value: "Monthly", label: "Monthly" },
]

const CROSSED_LIMIT_OPTIONS = [
  { value: "Allow", label: "Allow" },
  { value: "Restrict", label: "Restrict" },
]

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

// ─── Helper Functions ────────────────────────────────────────────────────────
function safeStr(value: any, fallback = ""): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value || fallback
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (typeof value === "object") {
    const first = Object.values(value).find((v) => typeof v === "string")
    return (first as string) || fallback
  }
  return fallback
}

function safeNumber(value: any, fallback = 0): number {
  if (typeof value === "number") return value
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeOtPolicyValues(value: any): OtPolicyFormValues {
  const p = value?.otPolicy ?? {}

  return {
    employeeCategory: Array.isArray(value?.employeeCategory)
      ? value.employeeCategory.map((item: any) => safeStr(item)).filter(Boolean)
      : [],
    location: {
      locationCode: safeStr(value?.location?.locationCode),
      locationName: safeStr(value?.location?.locationName),
    },
    subsidiary: {
      subsidiaryCode: safeStr(value?.subsidiary?.subsidiaryCode),
      subsidiaryName: safeStr(value?.subsidiary?.subsidiaryName),
    },
    otPolicy: {
      ...defaultOtPolicyValues.otPolicy,
      otPolicyCode: safeStr(p.otPolicyCode),
      otPolicyName: safeStr(p.otPolicyName),
      calculateOnTheBasisOf: safeStr(p.calculateOnTheBasisOf),
      multiplierForWorkingDay: safeNumber(p.multiplierForWorkingDay),
      multiplierForNationalHoliday: safeNumber(p.multiplierForNationalHoliday),
      multiplierForHoliday: safeNumber(p.multiplierForHoliday),
      multiplierForWeeklyOff: safeNumber(p.multiplierForWeeklyOff),
      dailyMaximumAllowedHours: safeNumber(p.dailyMaximumAllowedHours),
      weeklyMaximumAllowedHours: safeNumber(p.weeklyMaximumAllowedHours),
      monthlyMaximumAllowedHours: safeNumber(p.monthlyMaximumAllowedHours),
      quaterlyMaximumAllowedHours: safeNumber(p.quaterlyMaximumAllowedHours),
      yearlyMaximumAllowedHours: safeNumber(p.yearlyMaximumAllowedHours),
      maximumHoursOnHoliday: safeNumber(p.maximumHoursOnHoliday),
      maximumHoursOnWeekend: safeNumber(p.maximumHoursOnWeekend),
      maximumHoursOnWeekday: safeNumber(p.maximumHoursOnWeekday),
      minimumExtraMinutesConsideredForOT: safeNumber(p.minimumExtraMinutesConsideredForOT),
      roundingEnabled: Boolean(p.roundingEnabled),
      afterRoundingOff: Boolean(p.afterRoundingOff),
      beforeRoundingOff: Boolean(p.beforeRoundingOff),
      doThisWhenCrossedAllocatedLimit: safeStr(p.doThisWhenCrossedAllocatedLimit),
      approvalRequired: Boolean(p.approvalRequired),
      minimumFixedMinutesToAllowOvertime: safeNumber(p.minimumFixedMinutesToAllowOvertime),
      status: safeStr(p.status, "active"),
      rounding: Array.isArray(p.rounding) ? p.rounding : [],
      remark: safeStr(p.remark),
      isConsideredForHoliday: Boolean(p.isConsideredForHoliday),
      isConsideredForNationalHoliday: Boolean(p.isConsideredForNationalHoliday),
      isConsideredForWeeklyOff: Boolean(p.isConsideredForWeeklyOff),
      isConsideredForWorkingDay: Boolean(p.isConsideredForWorkingDay),
      isConsideredBeforeShift: Boolean(p.isConsideredBeforeShift),
      isConsideredAfterShift: Boolean(p.isConsideredAfterShift),
      perHourRate: safeNumber(p.perHourRate),
    },
  }
}

export default function OtPolicyForm({
  mode,
  rowId,
  tenantCode: propTenantCode,
  onClose,
  onSaved,
}: Props) {
  const router = useRouter()
  const hookTenantCode = useGetTenantCode()
  const hookEmployeeId = useKeyclockRoleInfo()

  const tenantCode = propTenantCode || hookTenantCode
  const employeeId = hookEmployeeId?.employeeId
  
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [formData, setFormData] = useState<OtPolicyFormValues>(defaultOtPolicyValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [organizationData, setOrganizationData] = useState<any>({})

  // Category management state
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [categorySearchField, setCategorySearchField] = useState<"code" | "name">("name")
  const [categorySearchTerm, setCategorySearchTerm] = useState("")
  const [addCategorySearchTerm, setAddCategorySearchTerm] = useState("")
  const [categoryPage, setCategoryPage] = useState(1)
  const pageSize = 5

  const isViewMode = mode === "view"
  const isEditMode = mode === "edit"
  const isAddMode = mode === "add"

  // ── API Criteria for fetching single record ────────────────────────────────────
  const searchApiCriteria = useMemo(() => {
    if (!rowId || (!isEditMode && !isViewMode)) return null
    
    const criteria: Array<{ field: string; operator: string; value: any }> = [
      { field: "_id", operator: "eq", value: rowId },
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
    ]
    return criteria
  }, [rowId, isEditMode, isViewMode, tenantCode])

  // ── Fetch single record using POST search ────────────────────────────────────
  const { loading: recordLoading, refetch: fetchRecord } = useRequest<any[]>({
    url: "ot_policy/search",
    method: "POST",
    data: searchApiCriteria || [],
    dependencies: [searchApiCriteria],
    enabled: Boolean(searchApiCriteria),
    onSuccess: (data: any[]) => {
      const record = Array.isArray(data) && data.length > 0 ? data[0] : null
      if (record) {
        setFormData(normalizeOtPolicyValues(record))
      } else if (rowId) {
        toast.error("Record not found")
      }
      setFetchingData(false)
    },
    onError: () => {
      toast.error("Failed to load OT policy data")
      setFetchingData(false)
    },
  })

  // ── Organization criteria ──────────────────────────────────────────────────
  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  // ── Organization data fetching ────────────────────────────────────────────
  const { arrayData: subsidiariesArray, loading: subsidiariesLoading } =
    useAggregateArrayFetch<any>({
      collection:       "organization",
      criteriaRequests: organizationCriteriaRequests,
      arrayField:       "subsidiaries",
      enabled:          Boolean(tenantCode),
      defaultValue:     [],
    })

  const { arrayData: locationsArray, loading: locationsLoading } =
    useAggregateArrayFetch<any>({
      collection:       "organization",
      criteriaRequests: organizationCriteriaRequests,
      arrayField:       "location",
      enabled:          Boolean(tenantCode),
      defaultValue:     [],
    })

  const { arrayData: employeeCategoriesArray, loading: employeeCategoriesLoading } =
    useAggregateArrayFetch<any>({
      collection:       "organization",
      criteriaRequests: organizationCriteriaRequests,
      arrayField:       "employeeCategories",
      enabled:          Boolean(tenantCode),
      defaultValue:     [],
    })

  const isOrgLoading = subsidiariesLoading || locationsLoading || employeeCategoriesLoading

  // Update organization data when fetched
  useEffect(() => {
    setOrganizationData({
      subsidiaries:       subsidiariesArray || [],
      locations:          locationsArray || [],
      employeeCategories: employeeCategoriesArray || [],
    })
  }, [subsidiariesArray, locationsArray, employeeCategoriesArray])

  // ── Load record when in edit/view mode ────────────────────────────────────
  useEffect(() => {
    if ((isEditMode || isViewMode) && rowId && searchApiCriteria) {
      setFetchingData(true)
      fetchRecord()
    } else if (isAddMode) {
      setFormData(defaultOtPolicyValues)
      setFetchingData(false)
    }
    setErrors({})
    setShowErrors(false)
  }, [rowId, isEditMode, isViewMode, isAddMode, searchApiCriteria])

  // ─── Server field map ─────────────────────────────────────────────────────
  const serverFieldMap: Record<string, string> = {
    "subsidiary.subsidiaryCode":                  "subsidiary.subsidiaryCode",
    "subsidiary.subsidiaryName":                  "subsidiary.subsidiaryName",
    "location.locationCode":                      "location.locationCode",
    "location.locationName":                      "location.locationName",
    "employeeCategory":                           "employeeCategory",
    "otPolicy.otPolicyCode":                      "otPolicy.otPolicyCode",
    "otPolicy.otPolicyName":                      "otPolicy.otPolicyName",
    "otPolicy.calculateOnTheBasisOf":             "otPolicy.calculateOnTheBasisOf",
    "otPolicy.perHourRate":                       "otPolicy.perHourRate",
    "otPolicy.status":                            "otPolicy.status",
    "otPolicy.doThisWhenCrossedAllocatedLimit":   "otPolicy.doThisWhenCrossedAllocatedLimit",
    "otPolicy.multiplierForWorkingDay":           "otPolicy.multiplierForWorkingDay",
    "otPolicy.multiplierForNationalHoliday":      "otPolicy.multiplierForNationalHoliday",
    "otPolicy.multiplierForHoliday":              "otPolicy.multiplierForHoliday",
    "otPolicy.multiplierForWeeklyOff":            "otPolicy.multiplierForWeeklyOff",
    "otPolicy.dailyMaximumAllowedHours":          "otPolicy.dailyMaximumAllowedHours",
    "otPolicy.weeklyMaximumAllowedHours":         "otPolicy.weeklyMaximumAllowedHours",
    "otPolicy.monthlyMaximumAllowedHours":        "otPolicy.monthlyMaximumAllowedHours",
    "otPolicy.quaterlyMaximumAllowedHours":       "otPolicy.quaterlyMaximumAllowedHours",
    "otPolicy.yearlyMaximumAllowedHours":         "otPolicy.yearlyMaximumAllowedHours",
    "otPolicy.maximumHoursOnHoliday":             "otPolicy.maximumHoursOnHoliday",
    "otPolicy.maximumHoursOnWeekend":             "otPolicy.maximumHoursOnWeekend",
    "otPolicy.maximumHoursOnWeekday":             "otPolicy.maximumHoursOnWeekday",
    "otPolicy.minimumExtraMinutesConsideredForOT": "otPolicy.minimumExtraMinutesConsideredForOT",
    "otPolicy.minimumFixedMinutesToAllowOvertime": "otPolicy.minimumFixedMinutesToAllowOvertime",
    "otPolicy.roundingEnabled":                   "otPolicy.roundingEnabled",
    "otPolicy.afterRoundingOff":                  "otPolicy.afterRoundingOff",
    "otPolicy.beforeRoundingOff":                 "otPolicy.beforeRoundingOff",
    "otPolicy.approvalRequired":                  "otPolicy.approvalRequired",
    "otPolicy.isConsideredForHoliday":            "otPolicy.isConsideredForHoliday",
    "otPolicy.isConsideredForNationalHoliday":    "otPolicy.isConsideredForNationalHoliday",
    "otPolicy.isConsideredForWeeklyOff":          "otPolicy.isConsideredForWeeklyOff",
    "otPolicy.isConsideredForWorkingDay":         "otPolicy.isConsideredForWorkingDay",
    "otPolicy.isConsideredBeforeShift":           "otPolicy.isConsideredBeforeShift",
    "otPolicy.isConsideredAfterShift":            "otPolicy.isConsideredAfterShift",
    "otPolicy.remark":                            "otPolicy.remark",
  }

  // ─── POST request for create/update ───────────────────────────────────────
  const { post } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const nextErrors: Record<string, string> = {}
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return

          const normalizedField =
            serverFieldMap[fieldName] ??
            serverFieldMap[fieldName.split(".").slice(-2).join(".")] ??
            serverFieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          nextErrors[normalizedField] = message
        })
        setErrors((prev) => ({ ...prev, ...nextErrors }))
        setLoading(false)
        return
      }

      toast.success(`OT Policy ${isEditMode ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} OT policy`)
      setLoading(false)
    },
  })

  // ─── Submit handler ───────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    if (isViewMode) {
      return
    }

    setShowErrors(true)
    const parsed = otPolicySchema.safeParse(formData)

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".")
        if (!nextErrors[key]) nextErrors[key] = issue.message
      }
      setErrors(nextErrors)
      toast.error("Please fix the validation errors before saving")
      return
    }

    setErrors({})
    setLoading(true)

    await post({
      tenant:         tenantCode,
      action:         isEditMode ? "update" : "insert",
      id:             isEditMode ? rowId : null,
      collectionName: "ot_policy",
      event:          "validate",
      ruleId:         "otValidator",
      data: {
        ...parsed.data,
        otPolicy: (({ rounding: _r, ...rest }) => rest)(parsed.data.otPolicy),
        tenantCode,
        updatedBy: employeeId ?? null,
        updatedOn: new Date().toISOString(),
      },
    })
  }, [formData, isViewMode, isEditMode, tenantCode, employeeId, rowId, post, onSaved])

  // ─── Field update helpers ─────────────────────────────────────────────────
  const clearError = useCallback((key: string) => {
    if (errors[key]) {
      setErrors((prev) => {
        const n = { ...prev }
        delete n[key]
        return n
      })
    }
  }, [errors])

  const updateOtPolicyField = useCallback((field: string, value: any) => {
    if (isViewMode) return
    setFormData((prev) => ({
      ...prev,
      otPolicy: { ...prev.otPolicy, [field]: value }
    }))
    clearError(`otPolicy.${field}`)
  }, [isViewMode, clearError])

  const updateSubsidiary = useCallback((value: string) => {
    if (isViewMode) return
    const selected = (organizationData.subsidiaries || []).find(
      (item: any) => (item?.subsidiaryCode || item?.code) === value
    )
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        subsidiary: {
          subsidiaryCode: selected.subsidiaryCode || selected.code || "",
          subsidiaryName: selected.subsidiaryName || selected.name || "",
        },
        location: { locationCode: "", locationName: "" },
      }))
    }
    clearError("subsidiary.subsidiaryCode")
  }, [isViewMode, organizationData.subsidiaries, clearError])

  const updateLocation = useCallback((value: string) => {
    if (isViewMode) return
    const selected = (organizationData.locations || []).find(
      (item: any) => (item?.locationCode || item?.code) === value
    )
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        location: {
          locationCode: selected.locationCode || selected.code || "",
          locationName: selected.locationName || selected.name || "",
        },
      }))
    }
    clearError("location.locationCode")
  }, [isViewMode, organizationData.locations, clearError])

  const updateEmployeeCategories = useCallback((categories: string[]) => {
    if (isViewMode) return
    setFormData((prev) => ({
      ...prev,
      employeeCategory: categories
    }))
    clearError("employeeCategory")
  }, [isViewMode, clearError])

  // ─── Category Management ───────────────────────────────────────────────────
  const filteredLocations = useMemo(() => {
    const locations = organizationData.locations || []
    const subsidiaryCode = formData.subsidiary?.subsidiaryCode
    if (!subsidiaryCode) return locations
    return locations.filter(
      (item: any) => item?.subsidiaryCode === subsidiaryCode || !item?.subsidiaryCode
    )
  }, [organizationData.locations, formData.subsidiary?.subsidiaryCode])

  const subsidiaryOptions = useMemo(
    () =>
      (organizationData.subsidiaries || []).map((item: any) => ({
        value: item?.subsidiaryCode || item?.code || "",
        label: item?.subsidiaryName || item?.name || "",
      })),
    [organizationData.subsidiaries]
  )

  const locationOptions = useMemo(
    () =>
      filteredLocations.map((item: any) => ({
        value: item?.locationCode || item?.code || "",
        label: item?.locationName || item?.name || "",
      })),
    [filteredLocations]
  )

  const employeeCategoryOptions = useMemo(() => {
    return (organizationData.employeeCategories || [])
      .filter((c: any) => {
        const code = c.employeeCategoryCode || c.categoryCode
        return code && code.trim() !== ""
      })
      .map((c: any) => ({
        code: c.employeeCategoryCode || c.categoryCode,
        name: c.employeeCategoryName || c.categoryName || c.employeeCategoryCode || c.categoryCode,
      }))
  }, [organizationData.employeeCategories])

  const selectedCategories = useMemo(
    () => (Array.isArray(formData.employeeCategory) ? formData.employeeCategory : []),
    [formData.employeeCategory]
  )

  const selectedCategoryItems = useMemo(
    () =>
      selectedCategories.map((code: string) => {
        const found = employeeCategoryOptions.find((i: any) => i.code === code)
        return { code, name: found?.name || code }
      }),
    [selectedCategories, employeeCategoryOptions]
  )

  const availableCategoryOptions = useMemo(
    () => employeeCategoryOptions.filter((i: any) => !selectedCategories.includes(i.code)),
    [employeeCategoryOptions, selectedCategories]
  )

  const addFilteredCategoryOptions = useMemo(() => {
    const q = addCategorySearchTerm.toLowerCase().trim()
    if (!q) return availableCategoryOptions
    return availableCategoryOptions.filter((i: any) =>
      categorySearchField === "code"
        ? i.code.toLowerCase().includes(q)
        : i.name.toLowerCase().includes(q)
    )
  }, [availableCategoryOptions, addCategorySearchTerm, categorySearchField])

  const filteredSelectedCategories = useMemo(() => {
    const q = categorySearchTerm.toLowerCase().trim()
    if (!q) return selectedCategoryItems
    return selectedCategoryItems.filter((i: any) =>
      categorySearchField === "code"
        ? i.code.toLowerCase().includes(q)
        : i.name.toLowerCase().includes(q)
    )
  }, [selectedCategoryItems, categorySearchTerm, categorySearchField])

  const allAddFilteredSelected = useMemo(() => {
    if (addFilteredCategoryOptions.length === 0) return false
    return addFilteredCategoryOptions.every((i: any) => selectedCategories.includes(i.code))
  }, [addFilteredCategoryOptions, selectedCategories])

  const paginatedSelectedCategories = useMemo(() => {
    const start = (categoryPage - 1) * pageSize
    return filteredSelectedCategories.slice(start, start + pageSize)
  }, [filteredSelectedCategories, categoryPage, pageSize])

  useEffect(() => { setCategoryPage(1) }, [categorySearchTerm])
  useEffect(() => { if (!addCategoryOpen) setAddCategorySearchTerm("") }, [addCategoryOpen])

  const handleSelectAllFiltered = () => {
    if (isViewMode) return
    if (allAddFilteredSelected) {
      const remaining = selectedCategories.filter(
        (code: string) => !addFilteredCategoryOptions.some((i: any) => i.code === code)
      )
      updateEmployeeCategories(remaining)
    } else {
      const newCats = addFilteredCategoryOptions
        .map((i: any) => i.code)
        .filter((code: string) => !selectedCategories.includes(code))
      updateEmployeeCategories([...selectedCategories, ...newCats])
    }
  }

  const handleRemoveCategory = (code: string) => {
    if (isViewMode) return
    updateEmployeeCategories(selectedCategories.filter((c: string) => c !== code))
  }

  const handleAddCategorySelect = (code: string) => {
    if (selectedCategories.includes(code)) {
      handleRemoveCategory(code)
    } else {
      updateEmployeeCategories([...selectedCategories, code])
    }
  }

  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
  const labelStyles = "block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1"
  const disabledFieldStyles = isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"
  const getFieldError = (key: string) => (showErrors ? errors[key] : undefined)
  const getFieldStyles = (key: string) =>
    `${fieldStyles} ${disabledFieldStyles} ${getFieldError(key) ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`
  const renderFieldError = (key: string) => {
    const message = getFieldError(key)
    return message ? <p className="text-xs text-red-600 mt-1">{message}</p> : null
  }

  const isLoading = fetchingData || recordLoading || isOrgLoading

  const getTitle = () => {
    if (isViewMode) return "View OT Policy"
    if (isEditMode) return "Edit OT Policy"
    return "Add OT Policy"
  }

  // Determine if OT Policy Code should be disabled
  const isOtPolicyCodeDisabled = isViewMode || isEditMode

  return (
    <div className="w-full space-y-6">
      <Card className="w-full mx-auto border border-gray-200 bg-white shadow-sm">
        <GradientFormHeader
          icon={Building2}
          title={`OT Policy - ${getTitle()}`}
          description="Define OT policy settings including multipliers, limits, and employee categories"
        />

        <CardContent className="px-6 py-4 space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-600">Loading configuration data...</div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-6">
              {showErrors && Object.keys(errors).length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Please correct the highlighted fields before saving.
                </div>
              )}

              {/* Organization Details Section */}
              <div className="space-y-6">
                <SubFormTitle title="Organization Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <SingleSelectField
                      label="Subsidiary"
                      placeholder="Select Subsidiary"
                      value={formData.subsidiary?.subsidiaryCode || ""}
                      onChange={updateSubsidiary}
                      options={subsidiaryOptions}
                      required
                      disabled={isViewMode}
                    />
                    {renderFieldError("subsidiary.subsidiaryCode")}
                  </div>

                  <div className="space-y-2">
                    <SingleSelectField
                      label="Location"
                      placeholder={formData.subsidiary?.subsidiaryCode ? "Select Location" : "Select subsidiary first"}
                      value={formData.location?.locationCode || ""}
                      onChange={updateLocation}
                      options={locationOptions}
                      required
                      disabled={isViewMode || !formData.subsidiary?.subsidiaryCode}
                    />
                    {renderFieldError("location.locationCode")}
                  </div>
                </div>

                <Separator />

                {/* Employee Categories Section */}
                <div className="space-y-3">
                  <SubFormTitle title="Employee Categories" />
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1 category-popup-container">
                      <div className="flex bg-muted/50 rounded-lg border">
                        <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                          <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                          <Select
                            value={categorySearchField}
                            onValueChange={(val: "code" | "name") => setCategorySearchField(val)}
                            disabled={isViewMode}
                          >
                            <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="code" className="text-sm">Code</SelectItem>
                              <SelectItem value="name" className="text-sm">Name</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 flex items-center bg-background rounded-r-lg">
                          <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="text"
                              autoComplete="off"
                              placeholder={`Search by ${categorySearchField === "code" ? "code" : "name"}...`}
                              value={categorySearchTerm}
                              onChange={(e) => setCategorySearchTerm(e.target.value)}
                              className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                              disabled={isViewMode}
                            />
                          </div>
                        </div>
                      </div>

                      {addCategoryOpen && !isViewMode && (
                        <div className="absolute z-30 left-0 top-full mt-3 w-[min(720px,100%)]">
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                            <div className="flex bg-muted/50 rounded-lg border">
                              <div className="flex-1 flex items-center bg-background rounded-l-lg">
                                <div className="relative flex-1">
                                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    type="text"
                                    placeholder={`Search by ${categorySearchField === "code" ? "code" : "name"}...`}
                                    value={addCategorySearchTerm}
                                    onChange={(e) => setAddCategorySearchTerm(e.target.value)}
                                    className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setAddCategoryOpen(false); setAddCategorySearchTerm("") }}
                                className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="border rounded-lg bg-white">
                              <Command shouldFilter={false} className="rounded-lg">
                                {addFilteredCategoryOptions.length > 0 && (
                                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                                    <button
                                      type="button"
                                      onClick={handleSelectAllFiltered}
                                      className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                    >
                                      <Check className={`h-4 w-4 rounded-sm border ${allAddFilteredSelected ? "opacity-100 text-green-600 border-green-500" : "opacity-70 text-transparent border-gray-300"}`} />
                                      <span>Select all ({addFilteredCategoryOptions.length})</span>
                                    </button>
                                  </div>
                                )}
                                <CommandList className="max-h-[200px]">
                                  <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                                    No categories found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {addFilteredCategoryOptions.map((item: any) => {
                                      const isSelected = selectedCategories.includes(item.code)
                                      return (
                                        <CommandItem
                                          key={item.code}
                                          value={`${item.code}-${item.name}`}
                                          onSelect={() => handleAddCategorySelect(item.code)}
                                          className="cursor-pointer"
                                        >
                                          <Check className={`mr-2 h-4 w-4 rounded-sm border ${isSelected ? "opacity-100 text-green-600 border-green-500" : "opacity-70 text-transparent border-gray-300"}`} />
                                          <div className="flex-1">
                                            <div className="font-medium text-sm">{item.name || "N/A"}</div>
                                            <div className="text-xs text-gray-500">Code: {item.code}</div>
                                          </div>
                                        </CommandItem>
                                      )
                                    })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isViewMode && (
                      <Button
                        type="button"
                        onClick={() => setAddCategoryOpen((prev) => !prev)}
                        size="default"
                        className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                        disabled={employeeCategoryOptions.length === 0}
                      >
                        Add Categories
                      </Button>
                    )}
                  </div>

                  {renderFieldError("employeeCategory")}

                  <div className="border rounded-lg bg-slate-50/40">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Category Code</TableHead>
                          <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Category Name</TableHead>
                          {!isViewMode && (
                            <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">Actions</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSelectedCategories.length > 0 ? (
                          paginatedSelectedCategories.map((item: any) => (
                            <TableRow key={item.code} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                              <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">{item.code}</TableCell>
                              <TableCell className="py-1.5 text-sm text-gray-900">{item.name}</TableCell>
                              {!isViewMode && (
                                <TableCell className="py-1.5 pr-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                    onClick={() => handleRemoveCategory(item.code)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={isViewMode ? 2 : 3} className="py-8 text-center text-sm text-gray-500">
                              No categories selected. Click "Add Categories" to select categories.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    {filteredSelectedCategories.length > pageSize && (
                      <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                        <p className="text-[11px] text-gray-500">
                          Showing{" "}
                          <span className="font-semibold">
                            {Math.min((categoryPage - 1) * pageSize + 1, filteredSelectedCategories.length)}-
                            {Math.min(categoryPage * pageSize, filteredSelectedCategories.length)}
                          </span>{" "}
                          of <span className="font-semibold">{filteredSelectedCategories.length}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={categoryPage === 1} onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}>Prev</Button>
                          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={categoryPage * pageSize >= filteredSelectedCategories.length} onClick={() => setCategoryPage((p) => p * pageSize >= filteredSelectedCategories.length ? p : p + 1)}>Next</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Policy Identity Section */}
              <div className="space-y-6">
                <SubFormTitle title="Policy Identity" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className={labelStyles}>OT Policy Code <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.otPolicy.otPolicyCode}
                      onChange={(e) => updateOtPolicyField("otPolicyCode", e.target.value)}
                      className={getFieldStyles("otPolicy.otPolicyCode")}
                      placeholder="e.g. OT_POLICY_001"
                      disabled={isOtPolicyCodeDisabled}
                    />
                    {renderFieldError("otPolicy.otPolicyCode")}
                  </div>

                  <div className="space-y-2">
                    <Label className={labelStyles}>OT Policy Name <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      value={formData.otPolicy.otPolicyName}
                      onChange={(e) => updateOtPolicyField("otPolicyName", e.target.value)}
                      className={getFieldStyles("otPolicy.otPolicyName")}
                      placeholder="e.g. Standard OT Policy"
                      disabled={isViewMode}
                    />
                    {renderFieldError("otPolicy.otPolicyName")}
                  </div>

                  <div className="space-y-2">
                    <SingleSelectField
                      label="Calculate On The Basis Of"
                      placeholder="Select Basis"
                      value={formData.otPolicy.calculateOnTheBasisOf}
                      onChange={(v) => updateOtPolicyField("calculateOnTheBasisOf", v)}
                      options={CALCULATE_ON_OPTIONS}
                      required
                      disabled={isViewMode}
                    />
                    {renderFieldError("otPolicy.calculateOnTheBasisOf")}
                  </div>

                  <div className="space-y-2">
                    <Label className={labelStyles}>Per Hour Rate (₹) <span className="text-red-500">*</span></Label>
                    <NumericInput
                      value={formData.otPolicy.perHourRate}
                      onChange={(v) => updateOtPolicyField("perHourRate", v)}
                      disabled={isViewMode}
                      placeholder="e.g. 110"
                      hasError={!!getFieldError("otPolicy.perHourRate")}
                    />
                    {renderFieldError("otPolicy.perHourRate")}
                  </div>

                  <div className="space-y-2">
                    <SingleSelectField
                      label="Status"
                      placeholder="Select Status"
                      value={formData.otPolicy.status}
                      onChange={(v) => updateOtPolicyField("status", v)}
                      options={STATUS_OPTIONS}
                      required
                      disabled={isViewMode}
                    />
                    {renderFieldError("otPolicy.status")}
                  </div>

                  <div className="space-y-2">
                    <SingleSelectField
                      label="When Crossed Allocated Limit"
                      placeholder="Select Action"
                      value={formData.otPolicy.doThisWhenCrossedAllocatedLimit}
                      onChange={(v) => updateOtPolicyField("doThisWhenCrossedAllocatedLimit", v)}
                      options={CROSSED_LIMIT_OPTIONS}
                      required
                      disabled={isViewMode}
                    />
                    {renderFieldError("otPolicy.doThisWhenCrossedAllocatedLimit")}
                  </div>
                </div>
              </div>

              <Separator />

              {/* OT Multipliers Section */}
              <div className="space-y-6">
                <SubFormTitle title="OT Multipliers" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { field: "multiplierForWorkingDay", label: "Multiplier for Working Day" },
                    { field: "multiplierForNationalHoliday", label: "Multiplier for National Holiday" },
                    { field: "multiplierForHoliday", label: "Multiplier for Holiday" },
                    { field: "multiplierForWeeklyOff", label: "Multiplier for Weekly Off" },
                  ].map(({ field, label }) => (
                    <div key={field} className="space-y-2">
                      <Label className={labelStyles}>{label}</Label>
                      <NumericInput
                        value={(formData.otPolicy as any)[field]}
                        onChange={(v) => updateOtPolicyField(field, v)}
                        disabled={isViewMode}
                        hasError={!!getFieldError(`otPolicy.${field}`)}
                      />
                      {renderFieldError(`otPolicy.${field}`)}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Maximum Allowed Hours Section */}
              <div className="space-y-6">
                <SubFormTitle title="Maximum Allowed Hours" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { field: "dailyMaximumAllowedHours", label: "Daily Maximum Allowed Hours" },
                    { field: "weeklyMaximumAllowedHours", label: "Weekly Maximum Allowed Hours" },
                    { field: "monthlyMaximumAllowedHours", label: "Monthly Maximum Allowed Hours" },
                    { field: "quaterlyMaximumAllowedHours", label: "Quarterly Maximum Allowed Hours" },
                    { field: "yearlyMaximumAllowedHours", label: "Yearly Maximum Allowed Hours" },
                    { field: "maximumHoursOnHoliday", label: "Maximum Hours on Holiday" },
                    { field: "maximumHoursOnWeekend", label: "Maximum Hours on Weekend" },
                    { field: "maximumHoursOnWeekday", label: "Maximum Hours on Weekday" },
                  ].map(({ field, label }) => (
                    <div key={field} className="space-y-2">
                      <Label className={labelStyles}>{label}</Label>
                      <NumericInput
                        value={(formData.otPolicy as any)[field]}
                        onChange={(v) => updateOtPolicyField(field, v)}
                        disabled={isViewMode}
                        hasError={!!getFieldError(`otPolicy.${field}`)}
                      />
                      {renderFieldError(`otPolicy.${field}`)}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Minimum Thresholds Section */}
              <div className="space-y-6">
                <SubFormTitle title="Minimum Thresholds" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className={labelStyles}>Minimum Extra Minutes Considered for OT</Label>
                    <NumericInput
                      value={formData.otPolicy.minimumExtraMinutesConsideredForOT}
                      onChange={(v) => updateOtPolicyField("minimumExtraMinutesConsideredForOT", v)}
                      disabled={isViewMode}
                      hasError={!!getFieldError("otPolicy.minimumExtraMinutesConsideredForOT")}
                    />
                    {renderFieldError("otPolicy.minimumExtraMinutesConsideredForOT")}
                  </div>
                  <div className="space-y-2">
                    <Label className={labelStyles}>Minimum Fixed Minutes to Allow Overtime</Label>
                    <NumericInput
                      value={formData.otPolicy.minimumFixedMinutesToAllowOvertime}
                      onChange={(v) => updateOtPolicyField("minimumFixedMinutesToAllowOvertime", v)}
                      disabled={isViewMode}
                      hasError={!!getFieldError("otPolicy.minimumFixedMinutesToAllowOvertime")}
                    />
                    {renderFieldError("otPolicy.minimumFixedMinutesToAllowOvertime")}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Policy Flags Section */}
              <div className="space-y-6">
                <SubFormTitle title="Policy Flags" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
                  <BooleanToggle label="Rounding Enabled" value={formData.otPolicy.roundingEnabled} onChange={(v) => updateOtPolicyField("roundingEnabled", v)} disabled={isViewMode} />
                  <BooleanToggle label="After Rounding Off" value={formData.otPolicy.afterRoundingOff} onChange={(v) => updateOtPolicyField("afterRoundingOff", v)} disabled={isViewMode} />
                  <BooleanToggle label="Before Rounding Off" value={formData.otPolicy.beforeRoundingOff} onChange={(v) => updateOtPolicyField("beforeRoundingOff", v)} disabled={isViewMode} />
                  <BooleanToggle label="Approval Required" value={formData.otPolicy.approvalRequired} onChange={(v) => updateOtPolicyField("approvalRequired", v)} disabled={isViewMode} />
                  <BooleanToggle label="Is Considered for Holiday" value={formData.otPolicy.isConsideredForHoliday} onChange={(v) => updateOtPolicyField("isConsideredForHoliday", v)} disabled={isViewMode} />
                  <BooleanToggle label="Is Considered for National Holiday" value={formData.otPolicy.isConsideredForNationalHoliday} onChange={(v) => updateOtPolicyField("isConsideredForNationalHoliday", v)} disabled={isViewMode} />
                  <BooleanToggle label="Is Considered for Weekly Off" value={formData.otPolicy.isConsideredForWeeklyOff} onChange={(v) => updateOtPolicyField("isConsideredForWeeklyOff", v)} disabled={isViewMode} />
                  <BooleanToggle label="Is Considered for Working Day" value={formData.otPolicy.isConsideredForWorkingDay} onChange={(v) => updateOtPolicyField("isConsideredForWorkingDay", v)} disabled={isViewMode} />
                  <BooleanToggle label="Is Considered Before Shift" value={formData.otPolicy.isConsideredBeforeShift} onChange={(v) => updateOtPolicyField("isConsideredBeforeShift", v)} disabled={isViewMode} />
                  <BooleanToggle label="Is Considered After Shift" value={formData.otPolicy.isConsideredAfterShift} onChange={(v) => updateOtPolicyField("isConsideredAfterShift", v)} disabled={isViewMode} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className={labelStyles}>Remark</Label>
                  <textarea
                    value={formData.otPolicy.remark}
                    onChange={(e) => updateOtPolicyField("remark", e.target.value)}
                    disabled={isViewMode}
                    rows={3}
                    placeholder="Optional remark..."
                    className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition resize-none ${disabledFieldStyles}`}
                  />
                </div>
              </div>
            </form>
          )}
        </CardContent>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <ActionButtons
            layout="end"
            gap="gap-3"
            secondaryLabel="Cancel"
            onSecondary={onClose}
            primaryLabel={isViewMode ? "Close" : "Save Changes"}
            onPrimary={isViewMode ? onClose : submit}
            primaryLoading={loading}
            primaryDisabled={loading || isLoading}
            secondaryDisabled={loading || isLoading}
            primaryClassName={isViewMode ? "bg-gray-600 hover:bg-gray-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          />
        </div>
      </Card>
    </div>
  )
}