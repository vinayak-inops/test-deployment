"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@repo/ui/components/ui/card"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import {
  X, Clock, Building2, Filter, SearchIcon, Check, Trash2,
} from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import SingleSelectField from "@/components/fields/single-select-field"
import { toast } from "react-toastify"
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
import {
  defaultOtPolicyValues,
  otPolicySchema,
  type OtPolicyFormValues,
} from "./schemas/ot-policy-form.schema"
import NumericInput from "@/components/fields/input/number-input"
import BooleanToggle from "@/components/fields/input/boolean-toggle"

// ─── Safe string extractor ────────────────────────────────────────────────────
// The API may return certain fields as objects e.g. { calculationBasis: "Hourly" }
// instead of plain strings. This helper always produces a string no matter what
// shape the value arrives in.
function safeStr(value: any, fallback = ""): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value || fallback
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  // object — grab the first string-valued key
  if (typeof value === "object") {
    const first = Object.values(value).find((v) => typeof v === "string")
    return (first as string) || fallback
  }
  return fallback
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CALCULATE_ON_OPTIONS = [
  { value: "Hourly",  label: "Hourly" },
  { value: "Daily",   label: "Daily" },
  { value: "Monthly", label: "Monthly" },
]

const CROSSED_LIMIT_OPTIONS = [
  { value: "Allow",    label: "Allow" },
  { value: "Restrict", label: "Restrict" },
]

const STATUS_OPTIONS = [
  { value: "active",   label: "Active" },
  { value: "inactive", label: "Inactive" },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen:    boolean
  mode?:     "add" | "edit" | "view"
  recordId?: string | null
  onClose:   () => void
  onSaved?:  () => Promise<void> | void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OtPolicyAddPopup({
  isOpen,
  mode = "add",
  recordId = null,
  onClose,
  onSaved,
}: Props) {
  const router                = useRouter()
  const tenantCode            = useGetTenantCode()
  const { employeeId }        = useKeyclockRoleInfo()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [showErrors, setShowErrors]     = useState(false)
  const [formData, setFormData]         = useState<OtPolicyFormValues>(defaultOtPolicyValues)
  const [errors, setErrors]             = useState<Record<string, string>>({})
  const [organizationData, setOrganizationData] = useState<any>({})
  const wasOpenRef    = useRef(false)
  const hasFetchedRef = useRef(false)

  // Employee Categories State
  const [addCategoryOpen, setAddCategoryOpen]         = useState(false)
  const [categorySearchField, setCategorySearchField] = useState<"code" | "name">("name")
  const [categorySearchTerm, setCategorySearchTerm]   = useState("")
  const [addCategorySearchTerm, setAddCategorySearchTerm] = useState("")
  const [categoryPage, setCategoryPage] = useState(1)
  const pageSize = 5

  const isViewMode = mode === "view"
  const isEditMode = mode === "edit"
  const isAddMode  = mode === "add"

  // ── Fetch single record ────────────────────────────────────────────────────

  const { refetch: fetchRecord, loading: recordLoading } = useRequest<any>({
    url: recordId && (isEditMode || isViewMode) ? `ot_policy/${recordId}` : "",
    method: "GET",
    onSuccess: (data: any) => {
      if (data) {
        const p = data?.otPolicy ?? {}
        setFormData({
          employeeCategory: Array.isArray(data?.employeeCategory) ? data.employeeCategory : [],
          location: {
            locationCode: data?.location?.locationCode || "",
            locationName: data?.location?.locationName || "",
          },
          subsidiary: {
            subsidiaryCode: data?.subsidiary?.subsidiaryCode || "",
            subsidiaryName: data?.subsidiary?.subsidiaryName || "",
          },
          otPolicy: {
            otPolicyCode:                       safeStr(p.otPolicyCode),
            otPolicyName:                       safeStr(p.otPolicyName),
            calculateOnTheBasisOf:              safeStr(p.calculateOnTheBasisOf),
            multiplierForWorkingDay:            typeof p.multiplierForWorkingDay === "number" ? p.multiplierForWorkingDay : parseFloat(p.multiplierForWorkingDay) || 0,
            multiplierForNationalHoliday:       typeof p.multiplierForNationalHoliday === "number" ? p.multiplierForNationalHoliday : parseFloat(p.multiplierForNationalHoliday) || 0,
            multiplierForHoliday:               typeof p.multiplierForHoliday === "number" ? p.multiplierForHoliday : parseFloat(p.multiplierForHoliday) || 0,
            multiplierForWeeklyOff:             typeof p.multiplierForWeeklyOff === "number" ? p.multiplierForWeeklyOff : parseFloat(p.multiplierForWeeklyOff) || 0,
            dailyMaximumAllowedHours:           typeof p.dailyMaximumAllowedHours === "number" ? p.dailyMaximumAllowedHours : parseFloat(p.dailyMaximumAllowedHours) || 0,
            weeklyMaximumAllowedHours:          typeof p.weeklyMaximumAllowedHours === "number" ? p.weeklyMaximumAllowedHours : parseFloat(p.weeklyMaximumAllowedHours) || 0,
            monthlyMaximumAllowedHours:         typeof p.monthlyMaximumAllowedHours === "number" ? p.monthlyMaximumAllowedHours : parseFloat(p.monthlyMaximumAllowedHours) || 0,
            quaterlyMaximumAllowedHours:        typeof p.quaterlyMaximumAllowedHours === "number" ? p.quaterlyMaximumAllowedHours : parseFloat(p.quaterlyMaximumAllowedHours) || 0,
            yearlyMaximumAllowedHours:          typeof p.yearlyMaximumAllowedHours === "number" ? p.yearlyMaximumAllowedHours : parseFloat(p.yearlyMaximumAllowedHours) || 0,
            maximumHoursOnHoliday:              typeof p.maximumHoursOnHoliday === "number" ? p.maximumHoursOnHoliday : parseFloat(p.maximumHoursOnHoliday) || 0,
            maximumHoursOnWeekend:              typeof p.maximumHoursOnWeekend === "number" ? p.maximumHoursOnWeekend : parseFloat(p.maximumHoursOnWeekend) || 0,
            maximumHoursOnWeekday:              typeof p.maximumHoursOnWeekday === "number" ? p.maximumHoursOnWeekday : parseFloat(p.maximumHoursOnWeekday) || 0,
            minimumExtraMinutesConsideredForOT: typeof p.minimumExtraMinutesConsideredForOT === "number" ? p.minimumExtraMinutesConsideredForOT : parseFloat(p.minimumExtraMinutesConsideredForOT) || 0,
            roundingEnabled:                    Boolean(p.roundingEnabled),
            afterRoundingOff:                   Boolean(p.afterRoundingOff),
            beforeRoundingOff:                  Boolean(p.beforeRoundingOff),
            doThisWhenCrossedAllocatedLimit:    safeStr(p.doThisWhenCrossedAllocatedLimit),
            approvalRequired:                   Boolean(p.approvalRequired),
            minimumFixedMinutesToAllowOvertime: typeof p.minimumFixedMinutesToAllowOvertime === "number" ? p.minimumFixedMinutesToAllowOvertime : parseFloat(p.minimumFixedMinutesToAllowOvertime) || 0,
            status:                             safeStr(p.status, "active"),
            rounding:                           [],
            remark:                             safeStr(p.remark),
            isConsideredForHoliday:             Boolean(p.isConsideredForHoliday),
            isConsideredForNationalHoliday:     Boolean(p.isConsideredForNationalHoliday),
            isConsideredForWeeklyOff:           Boolean(p.isConsideredForWeeklyOff),
            isConsideredForWorkingDay:          Boolean(p.isConsideredForWorkingDay),
            isConsideredBeforeShift:            Boolean(p.isConsideredBeforeShift),
            isConsideredAfterShift:             Boolean(p.isConsideredAfterShift),
            perHourRate:                        typeof p.perHourRate === "number" ? p.perHourRate : parseFloat(p.perHourRate) || 0,
          },
        })
      }
      setFetchingData(false)
    },
    onError: () => setFetchingData(false),
  })

  // ── Organization criteria ──────────────────────────────────────────────────

  const organizationCriteriaRequests = useMemo(
    () =>
      tenantCode
        ? [{ field: "tenantCode", operator: "is", value: tenantCode }]
        : [],
    [tenantCode]
  )

  // ── Organization data ──────────────────────────────────────────────────────

  const { arrayData: subsidiariesArray, loading: subsidiariesLoading } =
    useAggregateArrayFetch<any>({
      collection:       "organization",
      criteriaRequests: organizationCriteriaRequests,
      arrayField:       "subsidiaries",
      enabled:          Boolean(tenantCode) && isOpen,
      defaultValue:     [],
    })

  const { arrayData: locationsArray, loading: locationsLoading } =
    useAggregateArrayFetch<any>({
      collection:       "organization",
      criteriaRequests: organizationCriteriaRequests,
      arrayField:       "location",
      enabled:          Boolean(tenantCode) && isOpen,
      defaultValue:     [],
    })

  const { arrayData: employeeCategoriesArray, loading: employeeCategoriesLoading } =
    useAggregateArrayFetch<any>({
      collection:       "organization",
      criteriaRequests: organizationCriteriaRequests,
      arrayField:       "employeeCategories",
      enabled:          Boolean(tenantCode) && isOpen,
      defaultValue:     [],
    })

  const isOrgLoading = subsidiariesLoading || locationsLoading || employeeCategoriesLoading

  useEffect(() => {
    if (isOpen) {
      setOrganizationData({
        subsidiaries:       subsidiariesArray       || [],
        locations:          locationsArray          || [],
        employeeCategories: employeeCategoriesArray || [],
      })
    }
  }, [isOpen, subsidiariesArray, locationsArray, employeeCategoriesArray])

  // ── Open / close lifecycle ─────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      if ((isEditMode || isViewMode) && recordId) {
        if (!hasFetchedRef.current || !wasOpenRef.current) {
          setFetchingData(true)
          fetchRecord()
          hasFetchedRef.current = true
        }
      } else if (isAddMode) {
        setFormData(defaultOtPolicyValues)
        hasFetchedRef.current = false
      }
      setErrors({})
      setShowErrors(false)
      setAddCategoryOpen(false)
      setAddCategorySearchTerm("")
      setCategorySearchTerm("")
    } else {
      hasFetchedRef.current = false
      setFormData(defaultOtPolicyValues)
      setAddCategoryOpen(false)
    }
    wasOpenRef.current = isOpen
  }, [isOpen, mode, recordId, isEditMode, isViewMode, isAddMode])

  // ── Filtered locations by subsidiary ──────────────────────────────────────

  const filteredLocations = useMemo(() => {
    const locations      = organizationData.locations || []
    const subsidiaryCode = formData.subsidiary?.subsidiaryCode
    if (!subsidiaryCode) return locations
    return locations.filter(
      (item: any) => item?.subsidiaryCode === subsidiaryCode || !item?.subsidiaryCode
    )
  }, [organizationData.locations, formData.subsidiary?.subsidiaryCode])

  // ── Dropdown options ───────────────────────────────────────────────────────

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

  // ── Employee Categories ────────────────────────────────────────────────────

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

  // ── ESC key ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading && !fetchingData) onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, loading, fetchingData])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addCategoryOpen) {
        const target = e.target as HTMLElement
        if (!target.closest(".category-popup-container")) setAddCategoryOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [addCategoryOpen])

  // ── POST ───────────────────────────────────────────────────────────────────

  const serverFieldMap: Record<string, string> = {
    "subsidiary.subsidiaryCode":                   "subsidiary.subsidiaryCode",
    "subsidiary.subsidiaryName":                   "subsidiary.subsidiaryName",
    "location.locationCode":                       "location.locationCode",
    "location.locationName":                       "location.locationName",
    "employeeCategory":                            "employeeCategory",
    "otPolicy.otPolicyCode":                       "otPolicy.otPolicyCode",
    "otPolicy.otPolicyName":                       "otPolicy.otPolicyName",
    "otPolicy.calculateOnTheBasisOf":              "otPolicy.calculateOnTheBasisOf",
    "otPolicy.perHourRate":                        "otPolicy.perHourRate",
    "otPolicy.status":                             "otPolicy.status",
    "otPolicy.doThisWhenCrossedAllocatedLimit":    "otPolicy.doThisWhenCrossedAllocatedLimit",
    "otPolicy.multiplierForWorkingDay":            "otPolicy.multiplierForWorkingDay",
    "otPolicy.multiplierForNationalHoliday":       "otPolicy.multiplierForNationalHoliday",
    "otPolicy.multiplierForHoliday":               "otPolicy.multiplierForHoliday",
    "otPolicy.multiplierForWeeklyOff":             "otPolicy.multiplierForWeeklyOff",
    "otPolicy.dailyMaximumAllowedHours":           "otPolicy.dailyMaximumAllowedHours",
    "otPolicy.weeklyMaximumAllowedHours":          "otPolicy.weeklyMaximumAllowedHours",
    "otPolicy.monthlyMaximumAllowedHours":         "otPolicy.monthlyMaximumAllowedHours",
    "otPolicy.quaterlyMaximumAllowedHours":        "otPolicy.quaterlyMaximumAllowedHours",
    "otPolicy.yearlyMaximumAllowedHours":          "otPolicy.yearlyMaximumAllowedHours",
    "otPolicy.maximumHoursOnHoliday":              "otPolicy.maximumHoursOnHoliday",
    "otPolicy.maximumHoursOnWeekend":              "otPolicy.maximumHoursOnWeekend",
    "otPolicy.maximumHoursOnWeekday":              "otPolicy.maximumHoursOnWeekday",
    "otPolicy.minimumExtraMinutesConsideredForOT": "otPolicy.minimumExtraMinutesConsideredForOT",
    "otPolicy.minimumFixedMinutesToAllowOvertime": "otPolicy.minimumFixedMinutesToAllowOvertime",
    "otPolicy.roundingEnabled":                    "otPolicy.roundingEnabled",
    "otPolicy.afterRoundingOff":                   "otPolicy.afterRoundingOff",
    "otPolicy.beforeRoundingOff":                  "otPolicy.beforeRoundingOff",
    "otPolicy.approvalRequired":                   "otPolicy.approvalRequired",
    "otPolicy.isConsideredForHoliday":             "otPolicy.isConsideredForHoliday",
    "otPolicy.isConsideredForNationalHoliday":     "otPolicy.isConsideredForNationalHoliday",
    "otPolicy.isConsideredForWeeklyOff":           "otPolicy.isConsideredForWeeklyOff",
    "otPolicy.isConsideredForWorkingDay":          "otPolicy.isConsideredForWorkingDay",
    "otPolicy.isConsideredBeforeShift":            "otPolicy.isConsideredBeforeShift",
    "otPolicy.isConsideredAfterShift":             "otPolicy.isConsideredAfterShift",
    "otPolicy.remark":                             "otPolicy.remark",
  }

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

      const createdId = response?.data?._id ?? response?.data?.id ?? response?._id ?? response?.id

      toast.success(`OT Policy ${isEditMode ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)
      onClose()

      if (createdId && !isEditMode) {
        router.push(`/policy-management/over-time?mode=edit&id=${encodeURIComponent(String(createdId))}`)
      }
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} OT policy`)
      setLoading(false)
    },
  })

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (isViewMode) return
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
      id:             isEditMode ? recordId : null,
      collectionName: "ot_policy",
      event:          "validate",
      ruleId:         "otValidator",
      data: {
        ...parsed.data,
        otPolicy: { ...parsed.data.otPolicy, rounding: [] },
        tenantCode,
        updatedBy: employeeId ?? null,
        updatedOn: new Date().toISOString(),
      },
    })
  }

  // ── Field helpers ──────────────────────────────────────────────────────────

  const clearError = (key: string) => {
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n })
  }

  const setOtField = (field: string, value: any) => {
    if (isViewMode) return
    setFormData((prev) => ({ ...prev, otPolicy: { ...prev.otPolicy, [field]: value } }))
    clearError(`otPolicy.${field}`)
  }

  const handleSubsidiarySelect = (value: string) => {
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
  }

  const handleLocationSelect = (value: string) => {
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
  }

  const handleSelectAllFiltered = () => {
    if (isViewMode) return
    if (allAddFilteredSelected) {
      const remaining = selectedCategories.filter(
        (code: string) => !addFilteredCategoryOptions.some((i: any) => i.code === code)
      )
      setFormData((prev) => ({ ...prev, employeeCategory: remaining }))
    } else {
      const newCats = addFilteredCategoryOptions
        .map((i: any) => i.code)
        .filter((code: string) => !selectedCategories.includes(code))
      setFormData((prev) => ({ ...prev, employeeCategory: [...selectedCategories, ...newCats] }))
    }
    clearError("employeeCategory")
  }

  const handleRemoveCategory = (code: string) => {
    if (isViewMode) return
    setFormData((prev) => ({
      ...prev,
      employeeCategory: selectedCategories.filter((c: string) => c !== code),
    }))
    clearError("employeeCategory")
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && !fetchingData) onClose()
  }

  const fieldStyles =
    "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  if (!isOpen) return null

  const isLoadingData = fetchingData || recordLoading

  const getTitle = () => {
    if (isViewMode) return "View OT Policy"
    if (isEditMode) return "Edit OT Policy"
    return "Add New OT Policy"
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-5xl max-h-[90vh] flex flex-col">
        <Card className="border border-gray-200 bg-white shadow-sm flex flex-col h-full overflow-hidden">

          {/* Header */}
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                OT Policy — {getTitle()}
              </CardTitle>
              <button
                type="button"
                onClick={onClose}
                disabled={loading || isLoadingData}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          {/* Body */}
          <CardContent className="px-6 py-4 overflow-y-auto flex-1">
            {(isOrgLoading || isLoadingData) && isOpen && (
              <div className="py-12 text-center text-sm text-gray-600">
                {isLoadingData ? "Loading record data..." : "Loading form configuration..."}
              </div>
            )}

            {!isLoadingData && (
              <form
                onSubmit={(e) => { e.preventDefault(); submit() }}
                className="space-y-6"
              >
                {/* ── Organization Details ─────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Organization Details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Subsidiary */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Subsidiary"
                        placeholder="Select Subsidiary"
                        value={formData.subsidiary?.subsidiaryCode || ""}
                        onChange={handleSubsidiarySelect}
                        options={subsidiaryOptions}
                        required
                        disabled={isOrgLoading || isViewMode}
                      />
                      {showErrors && errors["subsidiary.subsidiaryCode"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["subsidiary.subsidiaryCode"]}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Location"
                        placeholder={
                          formData.subsidiary?.subsidiaryCode
                            ? "Select Location"
                            : "Select subsidiary first"
                        }
                        value={formData.location?.locationCode || ""}
                        onChange={handleLocationSelect}
                        options={locationOptions}
                        required
                        disabled={isOrgLoading || !formData.subsidiary?.subsidiaryCode || isViewMode}
                      />
                      {showErrors && errors["location.locationCode"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["location.locationCode"]}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Employee Categories ──────────────────────────────── */}
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
                                          onSelect={() => {
                                            if (isSelected) {
                                              handleRemoveCategory(item.code)
                                            } else {
                                              setFormData((prev) => ({
                                                ...prev,
                                                employeeCategory: [...selectedCategories, item.code],
                                              }))
                                              clearError("employeeCategory")
                                            }
                                          }}
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
                        disabled={isOrgLoading || employeeCategoryOptions.length === 0}
                      >
                        Add Categories
                      </Button>
                    )}
                  </div>

                  {showErrors && errors["employeeCategory"] && (
                    <p className="text-red-500 text-xs">{errors["employeeCategory"]}</p>
                  )}

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

                <Separator />

                {/* ── Policy Identity ───────────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Policy Identity" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                    {/* Policy Code */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        OT Policy Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={formData.otPolicy.otPolicyCode}
                        onChange={(e) => setOtField("otPolicyCode", e.target.value)}
                        className={`${fieldStyles} bg-white ${showErrors && errors["otPolicy.otPolicyCode"] ? "border-red-500" : ""} ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        placeholder="e.g. OT_POLICY_001"
                        disabled={isViewMode}
                      />
                      {showErrors && errors["otPolicy.otPolicyCode"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["otPolicy.otPolicyCode"]}</p>
                      )}
                    </div>

                    {/* Policy Name */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        OT Policy Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={formData.otPolicy.otPolicyName}
                        onChange={(e) => setOtField("otPolicyName", e.target.value)}
                        className={`${fieldStyles} bg-white ${showErrors && errors["otPolicy.otPolicyName"] ? "border-red-500" : ""} ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        placeholder="e.g. Standard OT Policy"
                        disabled={isViewMode}
                      />
                      {showErrors && errors["otPolicy.otPolicyName"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["otPolicy.otPolicyName"]}</p>
                      )}
                    </div>

                    {/* Calculate On The Basis Of */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Calculate On The Basis Of"
                        placeholder="Select Basis"
                        value={formData.otPolicy.calculateOnTheBasisOf}
                        onChange={(v) => setOtField("calculateOnTheBasisOf", v)}
                        options={CALCULATE_ON_OPTIONS}
                        required
                        disabled={isViewMode}
                      />
                      {showErrors && errors["otPolicy.calculateOnTheBasisOf"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["otPolicy.calculateOnTheBasisOf"]}</p>
                      )}
                    </div>

                    {/* Per Hour Rate */}
                    <NumericInput
                      label="Per Hour Rate (₹)"
                      value={formData.otPolicy.perHourRate}
                      onChange={(v) => setOtField("perHourRate", v)}
                      disabled={isViewMode}
                      placeholder="e.g. 110"
                      required
                      hasError={showErrors && !!errors["otPolicy.perHourRate"]}
                      helperText={showErrors && errors["otPolicy.perHourRate"] ? errors["otPolicy.perHourRate"] : undefined}
                    />

                    {/* Status */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Status"
                        placeholder="Select Status"
                        value={formData.otPolicy.status}
                        onChange={(v) => setOtField("status", v)}
                        options={STATUS_OPTIONS}
                        required
                        disabled={isViewMode}
                      />
                      {showErrors && errors["otPolicy.status"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["otPolicy.status"]}</p>
                      )}
                    </div>

                    {/* When Crossed Limit */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="When Crossed Allocated Limit"
                        placeholder="Select Action"
                        value={formData.otPolicy.doThisWhenCrossedAllocatedLimit}
                        onChange={(v) => setOtField("doThisWhenCrossedAllocatedLimit", v)}
                        options={CROSSED_LIMIT_OPTIONS}
                        required
                        disabled={isViewMode}
                      />
                      {showErrors && errors["otPolicy.doThisWhenCrossedAllocatedLimit"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["otPolicy.doThisWhenCrossedAllocatedLimit"]}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Multipliers ───────────────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="OT Multipliers" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <NumericInput
                      label="Multiplier for Working Day"
                      value={formData.otPolicy.multiplierForWorkingDay}
                      onChange={(v) => setOtField("multiplierForWorkingDay", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.multiplierForWorkingDay"]}
                    />
                    <NumericInput
                      label="Multiplier for National Holiday"
                      value={formData.otPolicy.multiplierForNationalHoliday}
                      onChange={(v) => setOtField("multiplierForNationalHoliday", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.multiplierForNationalHoliday"]}
                    />
                    <NumericInput
                      label="Multiplier for Holiday"
                      value={formData.otPolicy.multiplierForHoliday}
                      onChange={(v) => setOtField("multiplierForHoliday", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.multiplierForHoliday"]}
                    />
                    <NumericInput
                      label="Multiplier for Weekly Off"
                      value={formData.otPolicy.multiplierForWeeklyOff}
                      onChange={(v) => setOtField("multiplierForWeeklyOff", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.multiplierForWeeklyOff"]}
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Maximum Allowed Hours ─────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Maximum Allowed Hours" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <NumericInput
                      label="Daily Maximum Allowed Hours"
                      value={formData.otPolicy.dailyMaximumAllowedHours}
                      onChange={(v) => setOtField("dailyMaximumAllowedHours", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.dailyMaximumAllowedHours"]}
                    />
                    <NumericInput
                      label="Weekly Maximum Allowed Hours"
                      value={formData.otPolicy.weeklyMaximumAllowedHours}
                      onChange={(v) => setOtField("weeklyMaximumAllowedHours", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.weeklyMaximumAllowedHours"]}
                    />
                    <NumericInput
                      label="Monthly Maximum Allowed Hours"
                      value={formData.otPolicy.monthlyMaximumAllowedHours}
                      onChange={(v) => setOtField("monthlyMaximumAllowedHours", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.monthlyMaximumAllowedHours"]}
                    />
                    <NumericInput
                      label="Quarterly Maximum Allowed Hours"
                      value={formData.otPolicy.quaterlyMaximumAllowedHours}
                      onChange={(v) => setOtField("quaterlyMaximumAllowedHours", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.quaterlyMaximumAllowedHours"]}
                    />
                    <NumericInput
                      label="Yearly Maximum Allowed Hours"
                      value={formData.otPolicy.yearlyMaximumAllowedHours}
                      onChange={(v) => setOtField("yearlyMaximumAllowedHours", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.yearlyMaximumAllowedHours"]}
                    />
                    <NumericInput
                      label="Maximum Hours on Holiday"
                      value={formData.otPolicy.maximumHoursOnHoliday}
                      onChange={(v) => setOtField("maximumHoursOnHoliday", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.maximumHoursOnHoliday"]}
                    />
                    <NumericInput
                      label="Maximum Hours on Weekend"
                      value={formData.otPolicy.maximumHoursOnWeekend}
                      onChange={(v) => setOtField("maximumHoursOnWeekend", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.maximumHoursOnWeekend"]}
                    />
                    <NumericInput
                      label="Maximum Hours on Weekday"
                      value={formData.otPolicy.maximumHoursOnWeekday}
                      onChange={(v) => setOtField("maximumHoursOnWeekday", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.maximumHoursOnWeekday"]}
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Minimum Thresholds ────────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Minimum Thresholds" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <NumericInput
                      label="Minimum Extra Minutes Considered for OT"
                      value={formData.otPolicy.minimumExtraMinutesConsideredForOT}
                      onChange={(v) => setOtField("minimumExtraMinutesConsideredForOT", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.minimumExtraMinutesConsideredForOT"]}
                    />
                    <NumericInput
                      label="Minimum Fixed Minutes to Allow Overtime"
                      value={formData.otPolicy.minimumFixedMinutesToAllowOvertime}
                      onChange={(v) => setOtField("minimumFixedMinutesToAllowOvertime", v)}
                      disabled={isViewMode}
                      hasError={showErrors && !!errors["otPolicy.minimumFixedMinutesToAllowOvertime"]}
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Flags & Toggles ───────────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Policy Flags" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    <BooleanToggle 
                      label="Rounding Enabled"                  
                      value={formData.otPolicy.roundingEnabled}              
                      onChange={(v) => setOtField("roundingEnabled", v)}              
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="After Rounding Off"                
                      value={formData.otPolicy.afterRoundingOff}             
                      onChange={(v) => setOtField("afterRoundingOff", v)}             
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Before Rounding Off"               
                      value={formData.otPolicy.beforeRoundingOff}            
                      onChange={(v) => setOtField("beforeRoundingOff", v)}            
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Approval Required"                 
                      value={formData.otPolicy.approvalRequired}             
                      onChange={(v) => setOtField("approvalRequired", v)}             
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Is Considered for Holiday"         
                      value={formData.otPolicy.isConsideredForHoliday}       
                      onChange={(v) => setOtField("isConsideredForHoliday", v)}       
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Is Considered for National Holiday" 
                      value={formData.otPolicy.isConsideredForNationalHoliday} 
                      onChange={(v) => setOtField("isConsideredForNationalHoliday", v)} 
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Is Considered for Weekly Off"      
                      value={formData.otPolicy.isConsideredForWeeklyOff}     
                      onChange={(v) => setOtField("isConsideredForWeeklyOff", v)}     
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Is Considered for Working Day"     
                      value={formData.otPolicy.isConsideredForWorkingDay}    
                      onChange={(v) => setOtField("isConsideredForWorkingDay", v)}    
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Is Considered Before Shift"        
                      value={formData.otPolicy.isConsideredBeforeShift}      
                      onChange={(v) => setOtField("isConsideredBeforeShift", v)}      
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Is Considered After Shift"         
                      value={formData.otPolicy.isConsideredAfterShift}       
                      onChange={(v) => setOtField("isConsideredAfterShift", v)}       
                      disabled={isViewMode} 
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Remark ────────────────────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Additional Info" />
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Remark</Label>
                    <textarea
                      value={formData.otPolicy.remark}
                      onChange={(e) => setOtField("remark", e.target.value)}
                      disabled={isViewMode}
                      rows={3}
                      placeholder="Optional remark..."
                      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition resize-none ${isViewMode ? "bg-gray-50 cursor-not-allowed" : "bg-white"}`}
                    />
                  </div>
                </div>

              </form>
            )}
          </CardContent>

          {/* Footer */}
          <CardFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            {isViewMode ? (
              <Button type="button" onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">
                Close
              </Button>
            ) : (
              <ActionButtons
                layout="end"
                gap="gap-3"
                secondaryLabel="Cancel"
                onSecondary={onClose}
                primaryLabel="Save Changes"
                onPrimary={submit}
                primaryLoading={loading}
                primaryDisabled={loading || isOrgLoading || isLoadingData}
                secondaryDisabled={loading || isLoadingData}
                primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
                secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              />
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}