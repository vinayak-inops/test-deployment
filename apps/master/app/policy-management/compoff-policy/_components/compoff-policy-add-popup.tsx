"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@repo/ui/components/ui/card"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import {
  X,
  Building2,
  Filter,
  SearchIcon,
  Check,
  Trash2,
  Briefcase,
  Clock,
  Settings2,
  Users,
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
  defaultCompOffPolicyValues,
  compOffPolicyFormSchema,
  type CompOffPolicyFormValues,
} from "./schemas/compoff-policy-form.schema"
import BooleanToggle from "@/components/fields/input/boolean-toggle"
import NumericInput from "@/components/fields/input/number-input"

// ─── Constants ────────────────────────────────────────────────────────────────

const GENERATION_UNIT_OPTIONS = [
  { value: "days",  label: "Days"  },
  { value: "hours", label: "Hours" },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean
  mode?: "add" | "edit" | "view"
  recordId?: string | null
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CompOffPolicyAddPopup({
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
  const [formData, setFormData]         = useState<CompOffPolicyFormValues>(defaultCompOffPolicyValues)
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

  // ── Fetch single record (edit/view) ────────────────────────────────────────

  const { refetch: fetchRecord, loading: recordLoading } = useRequest<any>({
    url: recordId && (isEditMode || isViewMode) ? `compoff_policy/${recordId}` : "",
    method: "GET",
    onSuccess: (data: any) => {
      if (data) {
        setFormData({
          subsidiary: {
            subsidiaryCode: data?.subsidiary?.subsidiaryCode || "",
            subsidiaryName: data?.subsidiary?.subsidiaryName || "",
          },
          location: {
            locationCode: data?.location?.locationCode || "",
            locationName: data?.location?.locationName || "",
          },
          designation: {
            designationCode: data?.designation?.designationCode || "",
            designationName: data?.designation?.designationName || "",
          },
          employeeCategory: Array.isArray(data?.employeeCategory)
            ? data.employeeCategory
            : [],
          compOffPolicy: {
            compOffPolicyCode:  data?.compOffPolicy?.compOffPolicyCode  || "",
            compOffPolicyTitle: data?.compOffPolicy?.compOffPolicyTitle || "",
            generateOnWeekDay:          data?.compOffPolicy?.generateOnWeekDay          ?? false,
            generateOnWeekOff:          data?.compOffPolicy?.generateOnWeekOff          ?? false,
            generateOnHoliday:          data?.compOffPolicy?.generateOnHoliday          ?? false,
            halfDayCompOffApplicable:   data?.compOffPolicy?.halfDayCompOffApplicable   ?? false,
            expireCompOffAtYearEnd:     data?.compOffPolicy?.expireCompOffAtYearEnd     ?? false,
            backDateCompOffAllowed:     data?.compOffPolicy?.backDateCompOffAllowed      ?? false,
            allowDuringNoticePeriod:    data?.compOffPolicy?.allowDuringNoticePeriod    ?? false,
            deductLunchBreakForCompOff: data?.compOffPolicy?.deductLunchBreakForCompOff ?? false,
            compOffApplicationRequired: data?.compOffPolicy?.compOffApplicationRequired ?? false,
            autoApprove:                data?.compOffPolicy?.autoApprove                ?? false,
            compOffExpiryDays:               data?.compOffPolicy?.compOffExpiryDays               ?? 0,
            maxBackDaysAllowed:              data?.compOffPolicy?.maxBackDaysAllowed              ?? 0,
            compOffMonthlyLimit:             data?.compOffPolicy?.compOffMonthlyLimit             ?? 0,
            minimumMinutesToGetFullCompOff:  data?.compOffPolicy?.minimumMinutesToGetFullCompOff  ?? 0,
            minimumMinutesToGetHalfCompOff:  data?.compOffPolicy?.minimumMinutesToGetHalfCompOff  ?? 0,
            multiplierForWeekDay:            data?.compOffPolicy?.multiplierForWeekDay            ?? 1,
            multiplierForWeekOff:            data?.compOffPolicy?.multiplierForWeekOff            ?? 1,
            multiplierForHoliday:            data?.compOffPolicy?.multiplierForHoliday            ?? 1,
            daysUntilAutoApproval:           data?.compOffPolicy?.daysUntilAutoApproval           ?? 0,
            compOffGenerationUnit:           data?.compOffPolicy?.compOffGenerationUnit           || "days",
            forHolidayAndWeekOffOverlap: {
              multiplierWithoutWorking: data?.compOffPolicy?.forHolidayAndWeekOffOverlap?.multiplierWithoutWorking ?? 0,
              multiplierForWorking:     data?.compOffPolicy?.forHolidayAndWeekOffOverlap?.multiplierForWorking     ?? 0,
            },
            cannotCombineWith: {
              prefix:  data?.compOffPolicy?.cannotCombineWith?.prefix  || [],
              postfix: data?.compOffPolicy?.cannotCombineWith?.postfix  || [],
            },
            rounding: data?.compOffPolicy?.rounding || [],
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

  const { arrayData: designationsArray, loading: designationsLoading } =
    useAggregateArrayFetch<any>({
      collection:       "organization",
      criteriaRequests: organizationCriteriaRequests,
      arrayField:       "designations",
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

  const isOrgLoading =
    subsidiariesLoading ||
    locationsLoading    ||
    designationsLoading ||
    employeeCategoriesLoading

  // ── Sync org data into state ───────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setOrganizationData({
        subsidiaries:       subsidiariesArray        || [],
        locations:          locationsArray           || [],
        designations:       designationsArray        || [],
        employeeCategories: employeeCategoriesArray  || [],
      })
    }
  }, [isOpen, subsidiariesArray, locationsArray, designationsArray, employeeCategoriesArray])

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
        setFormData(defaultCompOffPolicyValues)
        hasFetchedRef.current = false
      }
      setErrors({})
      setShowErrors(false)
      setAddCategoryOpen(false)
      setAddCategorySearchTerm("")
      setCategorySearchTerm("")
    } else {
      hasFetchedRef.current = false
      setFormData(defaultCompOffPolicyValues)
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
      (item: any) =>
        item?.subsidiaryCode === subsidiaryCode || !item?.subsidiaryCode
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

  const designationOptions = useMemo(
    () =>
      (organizationData.designations || []).map((item: any) => ({
        value: item?.designationCode || item?.code || "",
        label: item?.designationName || item?.name || "",
      })),
    [organizationData.designations]
  )

  // ── Employee category helpers ──────────────────────────────────────────────

  const employeeCategoryOptions = useMemo(() => {
    const categories = organizationData.employeeCategories || []
    return categories
      .filter((cat: any) => {
        const hasCode =
          (cat.employeeCategoryCode || cat.categoryCode) &&
          (cat.employeeCategoryCode || cat.categoryCode).trim() !== ""
        return hasCode
      })
      .map((cat: any) => ({
        code: cat.employeeCategoryCode || cat.categoryCode,
        name:
          cat.employeeCategoryName ||
          cat.categoryName          ||
          cat.employeeCategoryCode ||
          cat.categoryCode,
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
    () =>
      employeeCategoryOptions.filter(
        (i: any) => !selectedCategories.includes(i.code)
      ),
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
    return selectedCategoryItems.filter((i:any) =>
      categorySearchField === "code"
        ? i.code.toLowerCase().includes(q)
        : i.name.toLowerCase().includes(q)
    )
  }, [selectedCategoryItems, categorySearchTerm, categorySearchField])

  const allAddFilteredSelected = useMemo(
    () =>
      addFilteredCategoryOptions.length > 0 &&
      addFilteredCategoryOptions.every((i: any) =>
        selectedCategories.includes(i.code)
      ),
    [addFilteredCategoryOptions, selectedCategories]
  )

  const paginatedSelectedCategories = useMemo(() => {
    const start = (categoryPage - 1) * pageSize
    return filteredSelectedCategories.slice(start, start + pageSize)
  }, [filteredSelectedCategories, categoryPage, pageSize])

  useEffect(() => { setCategoryPage(1) }, [categorySearchTerm])
  useEffect(() => {
    if (!addCategoryOpen) setAddCategorySearchTerm("")
  }, [addCategoryOpen])

  // ── ESC / backdrop ─────────────────────────────────────────────────────────

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
        if (!target.closest(".category-popup-container")) {
          setAddCategoryOpen(false)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [addCategoryOpen])

  // ── POST ───────────────────────────────────────────────────────────────────

  const serverFieldMap: Record<string, string> = {
    "subsidiary.subsidiaryCode":    "subsidiary.subsidiaryCode",
    "subsidiary.subsidiaryName":    "subsidiary.subsidiaryName",
    "location.locationCode":        "location.locationCode",
    "location.locationName":        "location.locationName",
    "designation.designationCode":  "designation.designationCode",
    "designation.designationName":  "designation.designationName",
    "employeeCategory":             "employeeCategory",
    "compOffPolicy.compOffPolicyCode":               "compOffPolicy.compOffPolicyCode",
    "compOffPolicy.compOffPolicyTitle":              "compOffPolicy.compOffPolicyTitle",
    "compOffPolicy.compOffGenerationUnit":           "compOffPolicy.compOffGenerationUnit",
    "compOffPolicy.generateOnWeekDay":               "compOffPolicy.generateOnWeekDay",
    "compOffPolicy.generateOnWeekOff":               "compOffPolicy.generateOnWeekOff",
    "compOffPolicy.generateOnHoliday":               "compOffPolicy.generateOnHoliday",
    "compOffPolicy.halfDayCompOffApplicable":        "compOffPolicy.halfDayCompOffApplicable",
    "compOffPolicy.expireCompOffAtYearEnd":          "compOffPolicy.expireCompOffAtYearEnd",
    "compOffPolicy.backDateCompOffAllowed":          "compOffPolicy.backDateCompOffAllowed",
    "compOffPolicy.allowDuringNoticePeriod":         "compOffPolicy.allowDuringNoticePeriod",
    "compOffPolicy.deductLunchBreakForCompOff":      "compOffPolicy.deductLunchBreakForCompOff",
    "compOffPolicy.compOffApplicationRequired":      "compOffPolicy.compOffApplicationRequired",
    "compOffPolicy.autoApprove":                     "compOffPolicy.autoApprove",
    "compOffPolicy.compOffExpiryDays":               "compOffPolicy.compOffExpiryDays",
    "compOffPolicy.maxBackDaysAllowed":              "compOffPolicy.maxBackDaysAllowed",
    "compOffPolicy.compOffMonthlyLimit":             "compOffPolicy.compOffMonthlyLimit",
    "compOffPolicy.minimumMinutesToGetFullCompOff":  "compOffPolicy.minimumMinutesToGetFullCompOff",
    "compOffPolicy.minimumMinutesToGetHalfCompOff":  "compOffPolicy.minimumMinutesToGetHalfCompOff",
    "compOffPolicy.multiplierForWeekDay":            "compOffPolicy.multiplierForWeekDay",
    "compOffPolicy.multiplierForWeekOff":            "compOffPolicy.multiplierForWeekOff",
    "compOffPolicy.multiplierForHoliday":            "compOffPolicy.multiplierForHoliday",
    "compOffPolicy.daysUntilAutoApproval":           "compOffPolicy.daysUntilAutoApproval",
    "compOffPolicy.forHolidayAndWeekOffOverlap.multiplierWithoutWorking": "compOffPolicy.forHolidayAndWeekOffOverlap.multiplierWithoutWorking",
    "compOffPolicy.forHolidayAndWeekOffOverlap.multiplierForWorking":     "compOffPolicy.forHolidayAndWeekOffOverlap.multiplierForWorking",
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

      toast.success(`Comp-off policy ${isEditMode ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)
      onClose()

      if (createdId && !isEditMode) {
        router.push(`/policy-management/compoff-policy?mode=edit&id=${encodeURIComponent(String(createdId))}`)
      }
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} comp-off policy`)
      setLoading(false)
    },
  })

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (isViewMode) return
    setShowErrors(true)
    const parsed = compOffPolicyFormSchema.safeParse({
      ...formData,
      compOffPolicy: { ...formData.compOffPolicy, rounding: [] },
    })
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
      collectionName: "compoff_policy",
      event:          "validate",
      ruleId:         "compOffValidator",
      data: {
        ...parsed.data,
        compOffPolicy: (({ rounding: _r, ...rest }) => rest)(parsed.data.compOffPolicy),
        tenantCode,
        updatedBy: employeeId ?? null,
        updatedOn: new Date().toISOString(),
      },
    })
  }

  // ── Field helpers ──────────────────────────────────────────────────────────

  const clearError = (key: string) => {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const handleSubsidiarySelect = (value: string) => {
    if (isViewMode) return
    const selected = (organizationData.subsidiaries || []).find(
      (i: any) => (i?.subsidiaryCode || i?.code) === value
    )
    if (selected) {
      setFormData((prev:any) => ({
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
      (i: any) => (i?.locationCode || i?.code) === value
    )
    if (selected) {
      setFormData((prev:any) => ({
        ...prev,
        location: {
          locationCode: selected.locationCode || selected.code || "",
          locationName: selected.locationName || selected.name || "",
        },
      }))
    }
    clearError("location.locationCode")
  }

  const handleDesignationSelect = (value: string) => {
    if (isViewMode) return
    const selected = (organizationData.designations || []).find(
      (i: any) => (i?.designationCode || i?.code) === value
    )
    if (selected) {
      setFormData((prev:any) => ({
        ...prev,
        designation: {
          designationCode: selected.designationCode || selected.code || "",
          designationName: selected.designationName || selected.name || "",
        },
      }))
    }
    clearError("designation.designationCode")
  }

  const setPolicyField = (field: string, value: any) => {
    if (isViewMode) return
    setFormData((prev:any) => ({
      ...prev,
      compOffPolicy: { ...prev.compOffPolicy, [field]: value },
    }))
    clearError(`compOffPolicy.${field}`)
  }

  const setOverlapField = (field: string, value: number) => {
    if (isViewMode) return
    setFormData((prev:any) => ({
      ...prev,
      compOffPolicy: {
        ...prev.compOffPolicy,
        forHolidayAndWeekOffOverlap: {
          ...prev.compOffPolicy.forHolidayAndWeekOffOverlap,
          [field]: value,
        },
      },
    }))
  }

  const handleSelectAllFiltered = () => {
    if (isViewMode) return
    if (allAddFilteredSelected) {
      const remaining = selectedCategories.filter(
        (code: string) =>
          !addFilteredCategoryOptions.some((i: any) => i.code === code)
      )
      setFormData((prev:any) => ({ ...prev, employeeCategory: remaining }))
    } else {
      const newCodes = addFilteredCategoryOptions
        .map((i: any) => i.code)
        .filter((code: string) => !selectedCategories.includes(code))
      setFormData((prev:any) => ({
        ...prev,
        employeeCategory: [...selectedCategories, ...newCodes],
      }))
    }
    clearError("employeeCategory")
  }

  const handleRemoveCategory = (code: string) => {
    if (isViewMode) return
    setFormData((prev:any) => ({
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
    if (isViewMode) return "View Comp-Off Policy"
    if (isEditMode) return "Edit Comp-Off Policy"
    return "Add New Comp-Off Policy"
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
                <Settings2 className="h-5 w-5 text-blue-600" />
                Comp-Off Policy — {getTitle()}
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
                {isLoadingData
                  ? "Loading record data..."
                  : "Loading form configuration..."}
              </div>
            )}

            {!isLoadingData && (
              <form
                onSubmit={(e) => { e.preventDefault(); submit() }}
                className="space-y-6"
              >
                {showErrors && Object.keys(errors).length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    Please correct the highlighted fields before saving.
                  </div>
                )}

                {/* ── Organization Details ──────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Organization Details" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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
                        <p className="text-xs text-red-600">{errors["subsidiary.subsidiaryCode"]}</p>
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
                        <p className="text-xs text-red-600">{errors["location.locationCode"]}</p>
                      )}
                    </div>

                    {/* Designation */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Designation"
                        placeholder="Select Designation"
                        value={formData.designation?.designationCode || ""}
                        onChange={handleDesignationSelect}
                        options={designationOptions}
                        required
                        disabled={isOrgLoading || isViewMode}
                      />
                      {showErrors && errors["designation.designationCode"] && (
                        <p className="text-xs text-red-600">{errors["designation.designationCode"]}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Employee Categories ────────────────────────────────── */}
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
                              <SelectItem value="code">Code</SelectItem>
                              <SelectItem value="name">Name</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 flex items-center bg-background rounded-r-lg">
                          <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="text"
                              autoComplete="off"
                              placeholder={`Search by ${categorySearchField}...`}
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
                                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    type="text"
                                    placeholder={`Search by ${categorySearchField}...`}
                                    value={addCategorySearchTerm}
                                    onChange={(e) => setAddCategorySearchTerm(e.target.value)}
                                    className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => { setAddCategoryOpen(false); setAddCategorySearchTerm("") }}
                                className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center"
                                aria-label="Close"
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
                                      <Check
                                        className={`h-4 w-4 rounded-sm border ${
                                          allAddFilteredSelected
                                            ? "opacity-100 text-green-600 border-green-500"
                                            : "opacity-70 text-transparent border-gray-300"
                                        }`}
                                      />
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
                                              setFormData((prev:any) => ({
                                                ...prev,
                                                employeeCategory: [...selectedCategories, item.code],
                                              }))
                                              clearError("employeeCategory")
                                            }
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={`mr-2 h-4 w-4 rounded-sm border ${
                                              isSelected
                                                ? "opacity-100 text-green-600 border-green-500"
                                                : "opacity-70 text-transparent border-gray-300"
                                            }`}
                                          />
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
                          <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                            Category Code
                          </TableHead>
                          <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                            Category Name
                          </TableHead>
                          {!isViewMode && (
                            <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                              Actions
                            </TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSelectedCategories.length > 0 ? (
                          paginatedSelectedCategories.map((item: any) => (
                            <TableRow
                              key={item.code}
                              className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                            >
                              <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                                {item.code}
                              </TableCell>
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
                            <TableCell
                              colSpan={isViewMode ? 2 : 3}
                              className="py-8 text-center text-sm text-gray-500"
                            >
                              No categories selected. Click "Add Categories" to add.
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
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            disabled={categoryPage === 1}
                            onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
                          >
                            Prev
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            disabled={categoryPage * pageSize >= filteredSelectedCategories.length}
                            onClick={() =>
                              setCategoryPage((p) =>
                                p * pageSize >= filteredSelectedCategories.length ? p : p + 1
                              )
                            }
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* ── Policy Identification ──────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Policy Identification" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                    {/* Policy Code */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Policy Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={formData.compOffPolicy.compOffPolicyCode}
                        onChange={(e) => setPolicyField("compOffPolicyCode", e.target.value)}
                        className={`${fieldStyles} bg-white ${showErrors && errors["compOffPolicy.compOffPolicyCode"] ? "border-red-500" : ""} ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        placeholder="e.g. COMPOFF-001"
                        disabled={isViewMode}
                      />
                      {showErrors && errors["compOffPolicy.compOffPolicyCode"] && (
                        <p className="text-xs text-red-600">{errors["compOffPolicy.compOffPolicyCode"]}</p>
                      )}
                    </div>

                    {/* Policy Title */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Policy Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={formData.compOffPolicy.compOffPolicyTitle}
                        onChange={(e) => setPolicyField("compOffPolicyTitle", e.target.value)}
                        className={`${fieldStyles} bg-white ${showErrors && errors["compOffPolicy.compOffPolicyTitle"] ? "border-red-500" : ""} ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        placeholder="e.g. Standard Comp-Off"
                        disabled={isViewMode}
                      />
                      {showErrors && errors["compOffPolicy.compOffPolicyTitle"] && (
                        <p className="text-xs text-red-600">{errors["compOffPolicy.compOffPolicyTitle"]}</p>
                      )}
                    </div>

                    {/* Generation Unit */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Generation Unit"
                        placeholder="Select Unit"
                        value={formData.compOffPolicy.compOffGenerationUnit}
                        onChange={(v) => setPolicyField("compOffGenerationUnit", v)}
                        options={GENERATION_UNIT_OPTIONS}
                        required
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Generation Rules (toggles) ─────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Generation Rules" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <BooleanToggle 
                      label="Generate on Week Day"          
                      value={formData.compOffPolicy.generateOnWeekDay}              
                      onChange={(val) => setPolicyField("generateOnWeekDay", val)}              
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Generate on Week Off"          
                      value={formData.compOffPolicy.generateOnWeekOff}              
                      onChange={(val) => setPolicyField("generateOnWeekOff", val)}              
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Generate on Holiday"           
                      value={formData.compOffPolicy.generateOnHoliday}              
                      onChange={(val) => setPolicyField("generateOnHoliday", val)}              
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Half Day Comp-Off Applicable"  
                      value={formData.compOffPolicy.halfDayCompOffApplicable}               
                      onChange={(val) => setPolicyField("halfDayCompOffApplicable", val)}               
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Expire Comp-Off at Year End"    
                      value={formData.compOffPolicy.expireCompOffAtYearEnd}                 
                      onChange={(val) => setPolicyField("expireCompOffAtYearEnd", val)}                 
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Back Date Comp-Off Allowed"    
                      value={formData.compOffPolicy.backDateCompOffAllowed}                 
                      onChange={(val) => setPolicyField("backDateCompOffAllowed", val)}                 
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Allow During Notice Period"   
                      value={formData.compOffPolicy.allowDuringNoticePeriod}                
                      onChange={(val) => setPolicyField("allowDuringNoticePeriod", val)}                
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Deduct Lunch Break"           
                      value={formData.compOffPolicy.deductLunchBreakForCompOff}             
                      onChange={(val) => setPolicyField("deductLunchBreakForCompOff", val)}             
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Application Required"         
                      value={formData.compOffPolicy.compOffApplicationRequired}             
                      onChange={(val) => setPolicyField("compOffApplicationRequired", val)}             
                      disabled={isViewMode} 
                    />
                    <BooleanToggle 
                      label="Auto Approve"                 
                      value={formData.compOffPolicy.autoApprove}                
                      onChange={(val) => setPolicyField("autoApprove", val)}                
                      disabled={isViewMode} 
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Numeric Settings ───────────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Numeric Settings" />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <NumericInput
                      label="Expiry Days"
                      value={formData.compOffPolicy.compOffExpiryDays}
                      onChange={(v) => setPolicyField("compOffExpiryDays", v)}
                      disabled={isViewMode}
                    />
                    <NumericInput
                      label="Max Back Days"
                      value={formData.compOffPolicy.maxBackDaysAllowed}
                      onChange={(v) => setPolicyField("maxBackDaysAllowed", v)}
                      disabled={isViewMode}
                    />
                    <NumericInput
                      label="Monthly Limit"
                      value={formData.compOffPolicy.compOffMonthlyLimit}
                      onChange={(v) => setPolicyField("compOffMonthlyLimit", v)}
                      disabled={isViewMode}
                    />
                    <NumericInput
                      label="Min. Minutes (Full)"
                      value={formData.compOffPolicy.minimumMinutesToGetFullCompOff}
                      onChange={(v) => setPolicyField("minimumMinutesToGetFullCompOff", v)}
                      disabled={isViewMode}
                    />
                    <NumericInput
                      label="Min. Minutes (Half)"
                      value={formData.compOffPolicy.minimumMinutesToGetHalfCompOff}
                      onChange={(v) => setPolicyField("minimumMinutesToGetHalfCompOff", v)}
                      disabled={isViewMode}
                    />
                    <NumericInput
                      label="Multiplier (Week Day)"
                      value={formData.compOffPolicy.multiplierForWeekDay}
                      onChange={(v) => setPolicyField("multiplierForWeekDay", v)}
                      disabled={isViewMode}
                    />
                    <NumericInput
                      label="Multiplier (Week Off)"
                      value={formData.compOffPolicy.multiplierForWeekOff}
                      onChange={(v) => setPolicyField("multiplierForWeekOff", v)}
                      disabled={isViewMode}
                    />
                    <NumericInput
                      label="Multiplier (Holiday)"
                      value={formData.compOffPolicy.multiplierForHoliday}
                      onChange={(v) => setPolicyField("multiplierForHoliday", v)}
                      disabled={isViewMode}
                    />
                    <NumericInput
                      label="Days Until Auto Approval"
                      value={formData.compOffPolicy.daysUntilAutoApproval}
                      onChange={(v) => setPolicyField("daysUntilAutoApproval", v)}
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Holiday & Week-Off Overlap ─────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Holiday & Week-Off Overlap Multipliers" />
                  <div className="grid grid-cols-3 gap-4">
                    <NumericInput
                      label="Multiplier Without Working"
                      value={formData.compOffPolicy.forHolidayAndWeekOffOverlap.multiplierWithoutWorking}
                      onChange={(v) => setOverlapField("multiplierWithoutWorking", v)}
                      disabled={isViewMode}
                    />
                    <NumericInput
                      label="Multiplier For Working"
                      value={formData.compOffPolicy.forHolidayAndWeekOffOverlap.multiplierForWorking}
                      onChange={(v) => setOverlapField("multiplierForWorking", v)}
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </form>
            )}
          </CardContent>

          {/* Footer */}
          <CardFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            {isViewMode ? (
              <Button
                type="button"
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
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