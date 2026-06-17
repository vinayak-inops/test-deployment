"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardFooter } from "@repo/ui/components/ui/card"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Separator } from "@repo/ui/components/ui/separator"
import {
  X,
  Filter,
  SearchIcon,
  Check,
  Trash2,
  Briefcase,
  ClipboardList,
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
import BooleanToggle from "@/components/fields/input/boolean-toggle"
import NumericInput from "@/components/fields/input/number-input"
import {
  defaultOutDutyPolicyValues,
  outDutyPolicyFormSchema,
  type OutDutyPolicyFormValues,
} from "./schemas/out-duty-policy-form.schema"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean
  mode?: "add" | "edit" | "view"
  recordId?: string | null
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OutDutyPolicyAddPopup({
  isOpen,
  mode = "add",
  recordId = null,
  onClose,
  onSaved,
}: Props) {
  const tenantCode            = useGetTenantCode()
  const { employeeId }        = useKeyclockRoleInfo()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [showErrors, setShowErrors]     = useState(false)
  const [formData, setFormData]         = useState<OutDutyPolicyFormValues>(defaultOutDutyPolicyValues)
  const [errors, setErrors]             = useState<Record<string, string>>({})
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const [organizationData, setOrganizationData] = useState<any>({})
  const wasOpenRef    = useRef(false)
  const hasFetchedRef = useRef(false)

  // Employee Categories State
  const [addCategoryOpen, setAddCategoryOpen]             = useState(false)
  const [categorySearchField, setCategorySearchField]     = useState<"code" | "name">("name")
  const [categorySearchTerm, setCategorySearchTerm]       = useState("")
  const [addCategorySearchTerm, setAddCategorySearchTerm] = useState("")
  const [categoryPage, setCategoryPage] = useState(1)
  const pageSize = 5

  const isViewMode = mode === "view"
  const isEditMode = mode === "edit"
  const isAddMode  = mode === "add"

  // ── Fetch single record ────────────────────────────────────────────────────

  const { refetch: fetchRecord, loading: recordLoading } = useRequest<any>({
    url: recordId && (isEditMode || isViewMode) ? `outDutyPolicy/${recordId}` : "",
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
          policy: {
            hourlyPolicy: {
              minimumMinutesPerApplication: data?.policy?.hourlyPolicy?.minimumMinutesPerApplication ?? 0,
              maximumMinutesPerApplication: data?.policy?.hourlyPolicy?.maximumMinutesPerApplication ?? 0,
            },
            dailyPolicy: {
              minimumDaysPerApplication: data?.policy?.dailyPolicy?.minimumDaysPerApplication ?? 0,
              maximumDaysPerApplication: data?.policy?.dailyPolicy?.maximumDaysPerApplication ?? 0,
            },
            sandwichHolidayAsOutDuty: data?.policy?.sandwichHolidayAsOutDuty ?? false,
            sandwichWeekOffAsOutDuty:  data?.policy?.sandwichWeekOffAsOutDuty  ?? false,
            isAllowedInNoticePeriod:   data?.policy?.isAllowedInNoticePeriod   ?? false,
            allowStartOrEndOnHoliday:  data?.policy?.allowStartOrEndOnHoliday  ?? false,
            allowStartOrEndOnWeekOff:  data?.policy?.allowStartOrEndOnWeekOff  ?? false,
            autoApproval: {
              autoApprovalAllowed:      data?.policy?.autoApproval?.autoApprovalAllowed      ?? false,
              autoApproveIfDateCrossed: data?.policy?.autoApproval?.autoApproveIfDateCrossed ?? false,
              daysForAutoApproval:      data?.policy?.autoApproval?.daysForAutoApproval      ?? 0,
            },
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
    subsidiariesLoading    ||
    locationsLoading       ||
    designationsLoading    ||
    employeeCategoriesLoading

  // ── Sync org data ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setOrganizationData({
        subsidiaries:       subsidiariesArray       || [],
        locations:          locationsArray          || [],
        designations:       designationsArray       || [],
        employeeCategories: employeeCategoriesArray || [],
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
        setFormData(defaultOutDutyPolicyValues)
        hasFetchedRef.current = false
      }
      setErrors({})
      setServerErrors([])
      setShowErrors(false)
      setAddCategoryOpen(false)
      setAddCategorySearchTerm("")
      setCategorySearchTerm("")
    } else {
      hasFetchedRef.current = false
      setFormData(defaultOutDutyPolicyValues)
      setServerErrors([])
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
        const code = cat.employeeCategoryCode || cat.categoryCode
        return code && code.trim() !== ""
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
        if (!target.closest(".category-popup-container")) setAddCategoryOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [addCategoryOpen])

  // ── POST ───────────────────────────────────────────────────────────────────

  const serverFieldMap: Record<string, string> = {
    "subsidiary.subsidiaryCode":              "subsidiary.subsidiaryCode",
    "subsidiary.subsidiaryName":              "subsidiary.subsidiaryName",
    "location.locationCode":                  "location.locationCode",
    "location.locationName":                  "location.locationName",
    "designation.designationCode":            "designation.designationCode",
    "designation.designationName":            "designation.designationName",
    "employeeCategory":                       "employeeCategory",
    "policy.hourlyPolicy.minimumMinutesPerApplication": "policy.hourlyPolicy.minimumMinutesPerApplication",
    "policy.hourlyPolicy.maximumMinutesPerApplication": "policy.hourlyPolicy.maximumMinutesPerApplication",
    "policy.dailyPolicy.minimumDaysPerApplication":     "policy.dailyPolicy.minimumDaysPerApplication",
    "policy.dailyPolicy.maximumDaysPerApplication":     "policy.dailyPolicy.maximumDaysPerApplication",
    "policy.sandwichHolidayAsOutDuty": "policy.sandwichHolidayAsOutDuty",
    "policy.sandwichWeekOffAsOutDuty":  "policy.sandwichWeekOffAsOutDuty",
    "policy.isAllowedInNoticePeriod":   "policy.isAllowedInNoticePeriod",
    "policy.allowStartOrEndOnHoliday":  "policy.allowStartOrEndOnHoliday",
    "policy.allowStartOrEndOnWeekOff":  "policy.allowStartOrEndOnWeekOff",
    "policy.autoApproval.autoApprovalAllowed":      "policy.autoApproval.autoApprovalAllowed",
    "policy.autoApproval.autoApproveIfDateCrossed": "policy.autoApproval.autoApproveIfDateCrossed",
    "policy.autoApproval.daysForAutoApproval":      "policy.autoApproval.daysForAutoApproval",
  }

  const { post } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const nextErrors: Record<string, string> = {}
        const messages: string[] = []
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return

          messages.push(message)
          const normalizedField =
            serverFieldMap[fieldName] ??
            serverFieldMap[fieldName.split(".").slice(-2).join(".")] ??
            serverFieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          nextErrors[normalizedField] = message
        })
        setServerErrors(messages)
        setErrors((prev) => ({ ...prev, ...nextErrors }))
        setLoading(false)
        return
      }

      toast.success(`Out-duty policy ${isEditMode ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)
      onClose()
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} out-duty policy`)
      setLoading(false)
    },
  })

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (isViewMode) return
    setShowErrors(true)
    const parsed = outDutyPolicyFormSchema.safeParse(formData)
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
    setServerErrors([])
    setLoading(true)
    await post({
      tenant:         tenantCode,
      action:         isEditMode ? "update" : "insert",
      id:             isEditMode ? recordId : null,
      collectionName: "outDutyPolicy",
      event:          "validate",
      ruleId:         "outDutyPolicyValidator",
      data: {
        ...parsed.data,
        tenantCode,
        organizationCode:tenantCode,
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
      (i: any) => (i?.locationCode || i?.code) === value
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

  const handleDesignationSelect = (value: string) => {
    if (isViewMode) return
    const selected = (organizationData.designations || []).find(
      (i: any) => (i?.designationCode || i?.code) === value
    )
    if (selected) {
      setFormData((prev) => ({
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
    setFormData((prev) => ({
      ...prev,
      policy: { ...prev.policy, [field]: value },
    }))
    clearError(`policy.${field}`)
  }

  const setHourlyField = (field: string, value: number) => {
    if (isViewMode) return
    setFormData((prev) => ({
      ...prev,
      policy: {
        ...prev.policy,
        hourlyPolicy: { ...prev.policy.hourlyPolicy, [field]: value },
      },
    }))
    clearError(`policy.hourlyPolicy.${field}`)
  }

  const setDailyField = (field: string, value: number) => {
    if (isViewMode) return
    setFormData((prev) => ({
      ...prev,
      policy: {
        ...prev.policy,
        dailyPolicy: { ...prev.policy.dailyPolicy, [field]: value },
      },
    }))
    clearError(`policy.dailyPolicy.${field}`)
  }

  const setAutoApprovalField = (field: string, value: any) => {
    if (isViewMode) return
    setFormData((prev) => ({
      ...prev,
      policy: {
        ...prev.policy,
        autoApproval: { ...prev.policy.autoApproval, [field]: value },
      },
    }))
    clearError(`policy.autoApproval.${field}`)
  }

  const handleSelectAllFiltered = () => {
    if (isViewMode) return
    if (allAddFilteredSelected) {
      const remaining = selectedCategories.filter(
        (code: string) =>
          !addFilteredCategoryOptions.some((i: any) => i.code === code)
      )
      setFormData((prev) => ({ ...prev, employeeCategory: remaining }))
    } else {
      const newCodes = addFilteredCategoryOptions
        .map((i: any) => i.code)
        .filter((code: string) => !selectedCategories.includes(code))
      setFormData((prev) => ({
        ...prev,
        employeeCategory: [...selectedCategories, ...newCodes],
      }))
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
    if (isViewMode) return "View Out-Duty Policy"
    if (isEditMode) return "Edit Out-Duty Policy"
    return "Add New Out-Duty Policy"
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
                <ClipboardList className="h-5 w-5 text-blue-600" />
                Out-Duty Policy — {getTitle()}
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
                {/* ── Server Error Banner ── */}
                {serverErrors.length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-semibold text-red-700 mb-1">
                      Please fix the following errors:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {serverErrors.map((msg, i) => (
                        <li key={i} className="text-xs text-red-600">{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ── Organization Details ── */}
                <div className="space-y-3">
                  <SubFormTitle title="Organization Details" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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

                {/* ── Employee Categories ── */}
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
                                              setFormData((prev) => ({
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

                {/* ── Hourly Policy ── */}
                <div className="space-y-3">
                  <SubFormTitle title="Hourly Policy" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <NumericInput
                      label="Min. Minutes Per Application"
                      value={formData.policy.hourlyPolicy.minimumMinutesPerApplication}
                      onChange={(v) => setHourlyField("minimumMinutesPerApplication", v)}
                      disabled={isViewMode}
                      step="1"
                      hasError={showErrors && !!errors["policy.hourlyPolicy.minimumMinutesPerApplication"]}
                      helperText={showErrors ? errors["policy.hourlyPolicy.minimumMinutesPerApplication"] : undefined}
                    />
                    <NumericInput
                      label="Max. Minutes Per Application"
                      value={formData.policy.hourlyPolicy.maximumMinutesPerApplication}
                      onChange={(v) => setHourlyField("maximumMinutesPerApplication", v)}
                      disabled={isViewMode}
                      step="1"
                      hasError={showErrors && !!errors["policy.hourlyPolicy.maximumMinutesPerApplication"]}
                      helperText={showErrors ? errors["policy.hourlyPolicy.maximumMinutesPerApplication"] : undefined}
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Daily Policy ── */}
                <div className="space-y-3">
                  <SubFormTitle title="Daily Policy" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <NumericInput
                      label="Min. Days Per Application"
                      value={formData.policy.dailyPolicy.minimumDaysPerApplication}
                      onChange={(v) => setDailyField("minimumDaysPerApplication", v)}
                      disabled={isViewMode}
                      step="1"
                      hasError={showErrors && !!errors["policy.dailyPolicy.minimumDaysPerApplication"]}
                      helperText={showErrors ? errors["policy.dailyPolicy.minimumDaysPerApplication"] : undefined}
                    />
                    <NumericInput
                      label="Max. Days Per Application"
                      value={formData.policy.dailyPolicy.maximumDaysPerApplication}
                      onChange={(v) => setDailyField("maximumDaysPerApplication", v)}
                      disabled={isViewMode}
                      step="1"
                      hasError={showErrors && !!errors["policy.dailyPolicy.maximumDaysPerApplication"]}
                      helperText={showErrors ? errors["policy.dailyPolicy.maximumDaysPerApplication"] : undefined}
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Policy Rules ── */}
                <div className="space-y-3">
                  <SubFormTitle title="Policy Rules" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <BooleanToggle
                      label="Sandwich Holiday as Out-Duty"
                      value={formData.policy.sandwichHolidayAsOutDuty}
                      onChange={(v) => setPolicyField("sandwichHolidayAsOutDuty", v)}
                      disabled={isViewMode}
                    />
                    <BooleanToggle
                      label="Sandwich Week-Off as Out-Duty"
                      value={formData.policy.sandwichWeekOffAsOutDuty}
                      onChange={(v) => setPolicyField("sandwichWeekOffAsOutDuty", v)}
                      disabled={isViewMode}
                    />
                    <BooleanToggle
                      label="Allowed in Notice Period"
                      value={formData.policy.isAllowedInNoticePeriod}
                      onChange={(v) => setPolicyField("isAllowedInNoticePeriod", v)}
                      disabled={isViewMode}
                    />
                    <BooleanToggle
                      label="Allow Start/End on Holiday"
                      value={formData.policy.allowStartOrEndOnHoliday}
                      onChange={(v) => setPolicyField("allowStartOrEndOnHoliday", v)}
                      disabled={isViewMode}
                    />
                    <BooleanToggle
                      label="Allow Start/End on Week-Off"
                      value={formData.policy.allowStartOrEndOnWeekOff}
                      onChange={(v) => setPolicyField("allowStartOrEndOnWeekOff", v)}
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Auto Approval ── */}
                <div className="space-y-3">
                  <SubFormTitle title="Auto Approval" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <BooleanToggle
                      label="Auto Approval Allowed"
                      value={formData.policy.autoApproval.autoApprovalAllowed}
                      onChange={(v) => setAutoApprovalField("autoApprovalAllowed", v)}
                      disabled={isViewMode}
                    />
                    <BooleanToggle
                      label="Auto Approve if Date Crossed"
                      value={formData.policy.autoApproval.autoApproveIfDateCrossed}
                      onChange={(v) => setAutoApprovalField("autoApproveIfDateCrossed", v)}
                      disabled={isViewMode || !formData.policy.autoApproval.autoApprovalAllowed}
                    />
                    <NumericInput
                      label="Days for Auto Approval"
                      value={formData.policy.autoApproval.daysForAutoApproval}
                      onChange={(v) => setAutoApprovalField("daysForAutoApproval", v)}
                      disabled={isViewMode || !formData.policy.autoApproval.autoApprovalAllowed}
                      step="1"
                      hasError={showErrors && !!errors["policy.autoApproval.daysForAutoApproval"]}
                      helperText={showErrors ? errors["policy.autoApproval.daysForAutoApproval"] : undefined}
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
