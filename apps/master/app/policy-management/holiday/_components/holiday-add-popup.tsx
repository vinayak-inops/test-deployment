"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardFooter } from "@repo/ui/components/ui/card"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { X, Calendar, CalendarDays, Filter, SearchIcon, Check, Trash2 } from "lucide-react"
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
  defaultHolidayValues,
  holidaySchema,
  type HolidayFormValues,
} from "./schemas/holiday-form.schema"

// ─── Constants ────────────────────────────────────────────────────────────────

const HOLIDAY_TYPE_OPTIONS = [
  { value: "National", label: "National" },
  { value: "Regional", label: "Regional" },
  { value: "Optional", label: "Optional" },
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

export default function HolidayAddPopup({
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
  const [formData, setFormData]         = useState<HolidayFormValues>(defaultHolidayValues)
  const [errors, setErrors]             = useState<Record<string, string>>({})
  const [organizationData, setOrganizationData] = useState<any>({})
  const wasOpenRef    = useRef(false)
  const hasFetchedRef = useRef(false)

  // Employee Categories State
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [categorySearchField, setCategorySearchField] = useState<"code" | "name">("name")
  const [categorySearchTerm, setCategorySearchTerm] = useState("")
  const [addCategorySearchTerm, setAddCategorySearchTerm] = useState("")
  const [categoryPage, setCategoryPage] = useState(1)
  const pageSize = 5

  const isViewMode = mode === "view"
  const isEditMode = mode === "edit"
  const isAddMode  = mode === "add"

  // ── API Criteria for fetching single record ────────────────────────────────

  const searchApiCriteria = useMemo(() => {
    if (!recordId || (!isEditMode && !isViewMode)) return null

    const criteria: Array<{ field: string; operator: string; value: any }> = [
      { field: "_id",        operator: "eq", value: recordId },
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
    ]
    return criteria
  }, [recordId, isEditMode, isViewMode, tenantCode])

  // ── Fetch single record ────────────────────────────────────────────────────

  const { loading: recordLoading, refetch: fetchRecord } = useRequest<any[]>({
    url: "holiday/search",
    method: "POST",
    data: searchApiCriteria || [],
    dependencies: [searchApiCriteria],
    enabled: Boolean(searchApiCriteria),
    onSuccess: (data: any[]) => {
      const record = Array.isArray(data) && data.length > 0 ? data[0] : null
      if (record) {
        setFormData({
          employeeCategory: Array.isArray(record?.employeeCategory)
            ? record.employeeCategory
            : [],
          location: {
            locationCode: record?.location?.locationCode || "",
            locationName: record?.location?.locationName || "",
          },
          holiday: {
            holidayType: record?.holiday?.holidayType || "",
            holidayName: record?.holiday?.holidayName || "",
            holidayDate: record?.holiday?.holidayDate?.split("T")[0] || "",
          },
          subsidiary: {
            subsidiaryCode: record?.subsidiary?.subsidiaryCode || "",
            subsidiaryName: record?.subsidiary?.subsidiaryName || "",
          },
        })
      } else if (recordId) {
        toast.error("Record not found")
        onClose()
      }
      setFetchingData(false)
    },
    onError: () => {
      toast.error("Failed to load holiday data")
      setFetchingData(false)
      onClose()
    },
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

  // ── Sync org data into state ───────────────────────────────────────────────

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
      if ((isEditMode || isViewMode) && recordId && searchApiCriteria) {
        if (!hasFetchedRef.current || !wasOpenRef.current) {
          setFetchingData(true)
          fetchRecord()
          hasFetchedRef.current = true
        }
      } else if (isAddMode) {
        setFormData(defaultHolidayValues)
        hasFetchedRef.current = false
      }
      setErrors({})
      setShowErrors(false)
      setAddCategoryOpen(false)
      setAddCategorySearchTerm("")
      setCategorySearchTerm("")
    } else {
      hasFetchedRef.current = false
      setFormData(defaultHolidayValues)
      setAddCategoryOpen(false)
    }
    wasOpenRef.current = isOpen
    // fetchRecord is intentionally omitted — useRequest returns a new reference each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, recordId, isEditMode, isViewMode, isAddMode, searchApiCriteria])

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

  // ── Employee category options ──────────────────────────────────────────────

  const employeeCategoryOptions = useMemo(() => {
    const categories = organizationData.employeeCategories || []
    const seen = new Set<string>()
    return categories
      .filter((category: any) => {
        const code = category.employeeCategoryCode || category.categoryCode
        if (!code || code.trim() === "") return false
        if (seen.has(code)) return false
        seen.add(code)
        return true
      })
      .map((category: any) => ({
        code: category.employeeCategoryCode || category.categoryCode,
        name:
          category.employeeCategoryName ||
          category.categoryName ||
          category.employeeCategoryCode ||
          category.categoryCode,
      }))
  }, [organizationData.employeeCategories])

  const selectedCategories = useMemo(
    () => (Array.isArray(formData.employeeCategory) ? formData.employeeCategory : []),
    [formData.employeeCategory]
  )

  const selectedCategoryItems = useMemo(
    () =>
      selectedCategories.map((code: string) => {
        const found = employeeCategoryOptions.find((item: any) => item.code === code)
        return { code, name: found?.name || code }
      }),
    [selectedCategories, employeeCategoryOptions]
  )

  const availableCategoryOptions = useMemo(
    () => employeeCategoryOptions.filter((item: any) => !selectedCategories.includes(item.code)),
    [employeeCategoryOptions, selectedCategories]
  )

  const addFilteredCategoryOptions = useMemo(() => {
    const q = addCategorySearchTerm.toLowerCase().trim()
    if (!q) return availableCategoryOptions
    return availableCategoryOptions.filter((item: any) =>
      categorySearchField === "code"
        ? item.code.toLowerCase().includes(q)
        : item.name.toLowerCase().includes(q)
    )
  }, [availableCategoryOptions, addCategorySearchTerm, categorySearchField])

  const filteredSelectedCategories = useMemo(() => {
    const q = categorySearchTerm.toLowerCase().trim()
    if (!q) return selectedCategoryItems
    return selectedCategoryItems.filter((item) =>
      categorySearchField === "code"
        ? item.code.toLowerCase().includes(q)
        : item.name.toLowerCase().includes(q)
    )
  }, [selectedCategoryItems, categorySearchTerm, categorySearchField])

  const allAddFilteredSelected = useMemo(() => {
    if (addFilteredCategoryOptions.length === 0) return false
    return addFilteredCategoryOptions.every((item: any) =>
      selectedCategories.includes(item.code)
    )
  }, [addFilteredCategoryOptions, selectedCategories])

  const paginatedSelectedCategories = useMemo(() => {
    const start = (categoryPage - 1) * pageSize
    return filteredSelectedCategories.slice(start, start + pageSize)
  }, [filteredSelectedCategories, categoryPage, pageSize])

  useEffect(() => { setCategoryPage(1) }, [categorySearchTerm])

  useEffect(() => {
    if (!addCategoryOpen) setAddCategorySearchTerm("")
  }, [addCategoryOpen])

  // ── ESC key handler ────────────────────────────────────────────────────────

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

  // ── Click outside to close add-category popup ──────────────────────────────

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
    "subsidiary.subsidiaryCode": "subsidiary.subsidiaryCode",
    "subsidiary.subsidiaryName": "subsidiary.subsidiaryName",
    "location.locationCode": "location.locationCode",
    "location.locationName": "location.locationName",
    "holiday.holidayName": "holiday.holidayName",
    "holiday.holidayType": "holiday.holidayType",
    "holiday.holidayDate": "holiday.holidayDate",
    "employeeCategory": "employeeCategory",
  }

  const { post } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      console.log("Validation response:", response)
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

      toast.success(`Holiday ${isEditMode ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)
      onClose()
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} holiday`)
      setLoading(false)
    },
  })

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (isViewMode) return

    setShowErrors(true)
    const parsed = holidaySchema.safeParse(formData)
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
      collectionName: "holiday",
      event:          "validate",
      ruleId:         "holidayValidator",
      data: {
        ...parsed.data,
        tenantCode,
        organizationCode: tenantCode,
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

  const setHolidayField = (field: string, value: string) => {
    if (isViewMode) return
    setFormData((prev) => ({
      ...prev,
      holiday: { ...prev.holiday, [field]: value },
    }))
    clearError(`holiday.${field}`)
  }

  const handleSelectAllFiltered = () => {
    if (isViewMode) return
    if (allAddFilteredSelected) {
      const remaining = selectedCategories.filter(
        (code: string) => !addFilteredCategoryOptions.some((item: any) => item.code === code)
      )
      setFormData((prev) => ({ ...prev, employeeCategory: remaining }))
    } else {
      const newCodes = addFilteredCategoryOptions
        .map((item: any) => item.code)
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

  // ── Early return ───────────────────────────────────────────────────────────

  if (!isOpen) return null

  const isLoadingData = fetchingData || recordLoading

  const getTitle = () => {
    if (isViewMode) return "View Holiday"
    if (isEditMode) return "Edit Holiday"
    return "Add New Holiday"
  }

  const fieldStyles =
    "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-4xl max-h-[90vh] flex flex-col">
        <Card className="border border-gray-200 bg-white shadow-sm flex flex-col h-full overflow-hidden">

          {/* ── Header ── */}
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Holiday — {getTitle()}
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

          {/* ── Body ── */}
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
                {/* ── Organization Details ── */}
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
                        required={true}
                        disabled={isOrgLoading || isViewMode}
                      />
                      {showErrors && errors["subsidiary.subsidiaryCode"] && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors["subsidiary.subsidiaryCode"]}
                        </p>
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
                        required={true}
                        disabled={isOrgLoading || !formData.subsidiary?.subsidiaryCode || isViewMode}
                      />
                      {showErrors && errors["location.locationCode"] && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors["location.locationCode"]}
                        </p>
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
                      {/* Search bar */}
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

                      {/* Add-category dropdown */}
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

                  {/* Selected categories table */}
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
                              <TableCell className="py-1.5 text-sm text-gray-900">
                                {item.name}
                              </TableCell>
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
                              No categories selected. Click "Add Categories" to select categories.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {filteredSelectedCategories.length > pageSize && (
                      <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                        <p className="text-[11px] text-gray-500">
                          Showing{" "}
                          <span className="font-semibold">
                            {Math.min((categoryPage - 1) * pageSize + 1, filteredSelectedCategories.length)}–
                            {Math.min(categoryPage * pageSize, filteredSelectedCategories.length)}
                          </span>{" "}
                          of{" "}
                          <span className="font-semibold">{filteredSelectedCategories.length}</span>
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

                {/* ── Holiday Details ── */}
                <div className="space-y-3">
                  <SubFormTitle title="Holiday Details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Holiday Name */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Holiday Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={formData.holiday.holidayName}
                        onChange={(e) => setHolidayField("holidayName", e.target.value)}
                        className={`${fieldStyles} bg-white ${
                          showErrors && errors["holiday.holidayName"] ? "border-red-500" : ""
                        } ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        placeholder="e.g. Diwali"
                        disabled={isViewMode}
                      />
                      {showErrors && errors["holiday.holidayName"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["holiday.holidayName"]}</p>
                      )}
                    </div>

                    {/* Holiday Type */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Holiday Type"
                        placeholder="Select Type"
                        value={formData.holiday.holidayType}
                        onChange={(value) => setHolidayField("holidayType", value)}
                        options={HOLIDAY_TYPE_OPTIONS}
                        required={true}
                        disabled={isViewMode}
                      />
                      {showErrors && errors["holiday.holidayType"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["holiday.holidayType"]}</p>
                      )}
                    </div>

                    {/* Holiday Date */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Holiday Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={formData.holiday.holidayDate}
                        onChange={(e) => setHolidayField("holidayDate", e.target.value)}
                        className={`${fieldStyles} bg-white ${
                          showErrors && errors["holiday.holidayDate"] ? "border-red-500" : ""
                        } ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        disabled={isViewMode}
                      />
                      {showErrors && errors["holiday.holidayDate"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["holiday.holidayDate"]}</p>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            )}
          </CardContent>

          {/* ── Footer ── */}
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