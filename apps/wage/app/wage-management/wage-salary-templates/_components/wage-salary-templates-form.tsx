"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { DollarSign, CalendarCheck } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@repo/ui/components/ui/separator"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import SingleSelectField from "@/components/fields/single-select-field"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { GradientFormHeader } from "@/components/header/form-header"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { toast } from "react-toastify"
import {
  buildWageSalaryTemplatePayload,
  mapWageSalaryTemplateToFormValues,
  wageSalaryTemplateFormSchema,
  type WageSalaryTemplateFormValues,
} from "./schemas/wage-salary-template-form.schema"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"

type Mode = "add" | "edit" | "view"

type Props = {
  mode: Mode
  rowId?: string | null
  onClose: () => void
  onSaved?: () => Promise<void> | void
}


export default function WageSalaryTemplatesForm({
  mode,
  rowId,
  onClose,
  onSaved,
}: Props) {
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const isViewMode = mode === "view"
  const isEditMode = mode === "edit"
  const isAddMode = mode === "add"
  const [fetchingData, setFetchingData] = useState(false)
  const [organizationData, setOrganizationData] = useState<any>({})
  
  const {
    register,
    reset,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<WageSalaryTemplateFormValues>({
    resolver: zodResolver(wageSalaryTemplateFormSchema),
    defaultValues: mapWageSalaryTemplateToFormValues({}),
  })

  const formData = watch()

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
    url: "wageSalaryTemplates/search",
    method: "POST",
    data: searchApiCriteria || [],
    dependencies: [searchApiCriteria],
    enabled: Boolean(searchApiCriteria),
    onSuccess: (data: any[]) => {
      const record = Array.isArray(data) && data.length > 0 ? data[0] : null
      if (record) {
        reset(mapWageSalaryTemplateToFormValues(record))
      } else if (rowId) {
        toast.error("Record not found")
        onClose()
      }
      setFetchingData(false)
    },
    onError: () => {
      toast.error("Failed to load salary template data")
      setFetchingData(false)
      onClose()
    },
  })

  // ── Load record when in edit/view mode ────────────────────────────────────
  useEffect(() => {
    if ((isEditMode || isViewMode) && rowId && searchApiCriteria) {
      setFetchingData(true)
      fetchRecord()
    } else if (isAddMode) {
      reset(mapWageSalaryTemplateToFormValues({}))
      setFetchingData(false)
    }
  }, [rowId, isEditMode, isViewMode, isAddMode, searchApiCriteria])

  // Organization criteria for fetching data
  const organizationCriteriaRequests = useMemo(
    () =>
      tenantCode
        ? [
            {
              field: "tenantCode",
              operator: "is",
              value: tenantCode,
            },
          ]
        : [],
    [tenantCode]
  )

  // Fetch all organization data
  const { arrayData: countriesArray, loading: countriesLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "country",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: statesArray, loading: statesLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "state",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: subsidiariesArray, loading: subsidiariesLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: locationsArray, loading: locationsLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "location",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: designationsArray, loading: designationsLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "designations",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: gradesArray, loading: gradesLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "grades",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: categoriesArray, loading: categoriesLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "employeeCategories",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: skillLevelsArray, loading: skillLevelsLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "skillLevels",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const isLoading = countriesLoading || statesLoading || subsidiariesLoading || locationsLoading || 
                    designationsLoading || gradesLoading || categoriesLoading || skillLevelsLoading || 
                    fetchingData || recordLoading

  // Combine all organization data
  useEffect(() => {
    setOrganizationData({
      countries: countriesArray || [],
      states: statesArray || [],
      subsidiaries: subsidiariesArray || [],
      locations: locationsArray || [],
      designations: designationsArray || [],
      grades: gradesArray || [],
      categories: categoriesArray || [],
      skillLevels: skillLevelsArray || [],
    })
  }, [countriesArray, statesArray, subsidiariesArray, locationsArray, designationsArray, gradesArray, categoriesArray, skillLevelsArray])

  // Filtered options with parent-child relationships
  const countryOptions = useMemo(
    () =>
      (organizationData.countries || []).map((item: any) => ({
        value: item?.countryCode || item?.code || "",
        label: item?.countryName || item?.name || "",
      })),
    [organizationData.countries]
  )

  const stateOptions = useMemo(() => {
    const states = organizationData.states || []
    const filteredStates = formData.country
      ? states.filter((item: any) => item?.countryCode === formData.country)
      : states
    return filteredStates.map((item: any) => ({
      value: item?.stateCode || item?.code || "",
      label: item?.stateName || item?.name || "",
    }))
  }, [organizationData.states, formData.country])

  const zoneOptions = [
    { value: "Zone-1", label: "Zone 1" },
    { value: "Zone-2", label: "Zone 2" },
    { value: "Zone-3", label: "Zone 3" },
    { value: "Zone-4", label: "Zone 4" },
  ]

  // Filter locations based on selected subsidiary
  const filteredLocations = useMemo(() => {
    const locations = organizationData.locations || []
    const subsidiaryCode = formData.subsidiaryCode
    
    if (!subsidiaryCode) return locations
    
    return locations.filter((item: any) => 
      item?.subsidiaryCode === subsidiaryCode || !item?.subsidiaryCode
    )
  }, [organizationData.locations, formData.subsidiaryCode])

  // Independent Designations - no dependency on subsidiary
  const allDesignations = useMemo(() => {
    return (organizationData.designations || [])
  }, [organizationData.designations])

  // Independent Grades - no dependency on designation
  const allGrades = useMemo(() => {
    return (organizationData.grades || [])
  }, [organizationData.grades])

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
      allDesignations.map((item: any) => ({
        value: item?.designationCode || item?.code || "",
        label: item?.designationName || item?.name || "",
      })),
    [allDesignations]
  )

  const gradeOptions = useMemo(
    () =>
      allGrades.map((item: any) => ({
        value: item?.gradeCode || item?.code || "",
        label: item?.gradeName || item?.name || "",
      })),
    [allGrades]
  )

  // Category Options - based on actual data structure
  const categoryOptions = useMemo(() => {
    const categories = organizationData.categories || []
    
    if (!categories.length) return []
    
    return categories
      .filter((item: any) => item?.employeeCategoryCode)
      .map((item: any) => ({
        value: item.employeeCategoryCode,
        label: item.employeeCategoryName || item.employeeCategoryCode,
        description: item.employeeCategoryDescription || "",
      }))
  }, [organizationData.categories])

  // Skill Level Options - based on actual data structure
  const skillLevelOptions = useMemo(() => {
    const skillLevels = organizationData.skillLevels || []
    
    if (!skillLevels.length) return []
    
    // Remove duplicates based on skilledLevelTitle
    const uniqueSkillLevels = skillLevels.reduce((unique: any[], item: any) => {
      const title = item?.skilledLevelTitle
      if (title && !unique.some(existing => existing.skilledLevelTitle === title)) {
        unique.push(item)
      }
      return unique
    }, [])
    
    return uniqueSkillLevels
      .filter((item: any) => item?.skilledLevelTitle)
      .map((item: any) => ({
        value: item.skilledLevelTitle,
        label: item.skilledLevelTitle,
        description: item.skilledLevelDescription || "",
      }))
  }, [organizationData.skillLevels])

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onClose])

  const serverFieldMap: Record<string, string> = {
    name: "name",
    code: "code",
    country: "country",
    state: "state",
    zone: "zone",
    subsidiaryCode: "subsidiaryCode",
    subsidiaryName: "subsidiaryName",
    locationCode: "locationCode",
    locationName: "locationName",
    designationCode: "designationCode",
    designationName: "designationName",
    gradeCode: "gradeCode",
    gradeName: "gradeName",
    categoryCode: "categoryCode",
    categoryName: "categoryName",
    skillLevelCode: "skillLevelCode",
    effectiveFrom: "effectiveFrom",
    effectiveTo: "effectiveTo",
    remark: "remark",
  }

  const { post, loading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return

          const normalizedField =
            serverFieldMap[fieldName] ?? serverFieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField as any, { type: "server", message })
        })
        return
      }

      toast.success(`Salary Template ${isEditMode ? "updated" : "created"} successfully`)
      await onSaved?.()
      onClose()
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} salary template`)
    },
  })

  const submitForm = async (values: WageSalaryTemplateFormValues) => {
    if (isViewMode) return
    await post({
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      id: isEditMode ? rowId || null : null,
      collectionName: "wageSalaryTemplates",
      event: "validate",
      ruleId: "wageSalaryTemplateValidator",
      data: {
        ...buildWageSalaryTemplatePayload(values),
        tenantCode,
        organizationCode: tenantCode,
        updatedBy: employeeId ?? null,
        updatedOn: new Date().toISOString(),
      },
    })
  }

  const handleInvalidSubmit = () => {
    toast.error("Please fix the validation errors before saving")
  }

  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  const getTitle = () => {
    if (isViewMode) return "View Wage Salary Template"
    if (isEditMode) return "Edit Wage Salary Template"
    return "Add Wage Salary Template"
  }

  return (
    <div className="w-full space-y-6">
      <Card className="w-full mx-auto border border-gray-200 bg-white shadow-sm">
        <GradientFormHeader
          icon={DollarSign}
          title={`Wage Salary Template - ${getTitle()}`}
          description="Configure wage salary templates with organization structure and effective periods."
        />

        <CardContent className="px-6 py-4 space-y-6">
          {isLoading && !isViewMode && (
            <div className="py-12 text-center text-sm text-gray-600">
              Loading configuration data...
            </div>
          )}
          
          <form onSubmit={handleSubmit(submitForm, handleInvalidSubmit)} className="space-y-6">
            
            {/* Basic Information Section */}
            <div className="space-y-3">
              <SubFormTitle title="Basic Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    disabled={isViewMode || isLoading} 
                    {...register("name")} 
                    className={`${fieldStyles} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${errors.name ? "border-red-500" : ""}`}
                    placeholder="e.g., Monthly Salary Template"
                  />
                  {errors.name?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Code <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    disabled={isViewMode || isLoading || isEditMode} 
                    {...register("code")} 
                    className={`${fieldStyles} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${errors.code ? "border-red-500" : ""}`}
                    placeholder="e.g., SAL-MON-001"
                  />
                  {errors.code?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.code.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Information Section */}
            <div className="space-y-3">
              <SubFormTitle title="Location Information" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <SingleSelectField
                    label="Country"
                    value={formData.country}
                    options={countryOptions}
                    disabled={isViewMode || isLoading}
                    onChange={(v) => {
                      setValue("country", v, { shouldValidate: isSubmitted })
                      setValue("state", "", { shouldValidate: isSubmitted })
                    }}
                    placeholder="Select Country"
                    required
                  />
                  {errors.country?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.country.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <SingleSelectField
                    label="State"
                    value={formData.state}
                    options={stateOptions}
                    disabled={isViewMode || isLoading || !formData.country}
                    onChange={(v) => {
                      setValue("state", v, { shouldValidate: isSubmitted })
                    }}
                    placeholder={formData.country ? "Select State" : "Select country first"}
                    required
                  />
                  {errors.state?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.state.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Zone <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.zone}
                    onValueChange={(v) => setValue("zone", v, { shouldValidate: isSubmitted })}
                    disabled={isViewMode || isLoading}
                  >
                    <SelectTrigger className={`${fieldStyles} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${errors.zone ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zoneOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.zone?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.zone.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Organization Structure Section */}
            <div className="space-y-3">
              <SubFormTitle title="Organization Structure" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <SingleSelectField
                    label="Subsidiary"
                    value={formData.subsidiaryCode}
                    options={subsidiaryOptions}
                    disabled={isViewMode || isLoading}
                    onChange={(v) => {
                      const selected = (organizationData.subsidiaries || []).find(
                        (item: any) => (item?.subsidiaryCode || item?.code) === v
                      )
                      setValue("subsidiaryCode", v, { shouldValidate: isSubmitted })
                      setValue("subsidiaryName", selected?.subsidiaryName || selected?.name || "")
                      setValue("locationCode", "", { shouldValidate: isSubmitted })
                      setValue("locationName", "")
                    }}
                    placeholder="Select Subsidiary"
                    required
                  />
                  {errors.subsidiaryCode?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.subsidiaryCode.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <SingleSelectField
                    label="Location"
                    value={formData.locationCode}
                    options={locationOptions}
                    disabled={isViewMode || isLoading || !formData.subsidiaryCode}
                    onChange={(v) => {
                      const selected = (organizationData.locations || []).find(
                        (item: any) => (item?.locationCode || item?.code) === v
                      )
                      setValue("locationCode", v, { shouldValidate: isSubmitted })
                      setValue("locationName", selected?.locationName || selected?.name || "")
                    }}
                    placeholder={formData.subsidiaryCode ? "Select Location" : "Select subsidiary first"}
                    required
                  />
                  {errors.locationCode?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.locationCode.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <SingleSelectField
                    label="Designation"
                    value={formData.designationCode}
                    options={designationOptions}
                    disabled={isViewMode || isLoading || designationOptions.length === 0}
                    onChange={(v) => {
                      const selected = (organizationData.designations || []).find(
                        (item: any) => (item?.designationCode || item?.code) === v
                      )
                      setValue("designationCode", v, { shouldValidate: isSubmitted })
                      setValue("designationName", selected?.designationName || selected?.name || "")
                    }}
                    placeholder="Select Designation"
                    required
                  />
                  {errors.designationCode?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.designationCode.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <SingleSelectField
                    label="Grade"
                    value={formData.gradeCode}
                    options={gradeOptions}
                    disabled={isViewMode || isLoading || gradeOptions.length === 0}
                    onChange={(v) => {
                      const selected = (organizationData.grades || []).find(
                        (item: any) => (item?.gradeCode || item?.code) === v
                      )
                      setValue("gradeCode", v, { shouldValidate: isSubmitted })
                      setValue("gradeName", selected?.gradeName || selected?.name || "")
                    }}
                    placeholder="Select Grade"
                    required
                  />
                  {errors.gradeCode?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.gradeCode.message}</p>
                  )}
                </div>
                
                {/* Category Field */}
                <div className="space-y-2">
                  <SingleSelectField
                    label="Category"
                    value={formData.categoryCode}
                    options={categoryOptions}
                    disabled={isViewMode || isLoading || categoryOptions.length === 0}
                    onChange={(v) => {
                      const selected = (organizationData.categories || []).find(
                        (item: any) => item.employeeCategoryCode === v
                      )
                      setValue("categoryCode", v, { shouldValidate: isSubmitted })
                      setValue("categoryName", selected?.employeeCategoryName || v)
                    }}
                    placeholder={categoryOptions.length === 0 ? "No categories available" : "Select Category"}
                    required
                  />
                  {errors.categoryCode?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.categoryCode.message}</p>
                  )}
                </div>
                
                {/* Skill Level Field */}
                <div className="space-y-2">
                  <SingleSelectField
                    label="Skill Level"
                    value={formData.skillLevelCode}
                    options={skillLevelOptions}
                    disabled={isViewMode || isLoading || skillLevelOptions.length === 0}
                    onChange={(v) => {
                      const selected = (organizationData.skillLevels || []).find(
                        (item: any) => item.skilledLevelTitle === v
                      )
                      setValue("skillLevelCode", v, { shouldValidate: isSubmitted })
                      setValue("skillLevelDescription", selected?.skilledLevelDescription || "")
                    }}
                    placeholder={skillLevelOptions.length === 0 ? "No skill levels available" : "Select Skill Level"}
                    required
                  />
                  {errors.skillLevelCode?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.skillLevelCode.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Effective Period Section */}
            <div className="space-y-3">
              <SubFormTitle title="Effective Period" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Effective From <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    type="date" 
                    disabled={isViewMode || isLoading} 
                    {...register("effectiveFrom")} 
                    className={`${fieldStyles} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${errors.effectiveFrom ? "border-red-500" : ""}`}
                  />
                  {errors.effectiveFrom?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.effectiveFrom.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Effective To <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    type="date" 
                    disabled={isViewMode || isLoading} 
                    {...register("effectiveTo")} 
                    className={`${fieldStyles} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${errors.effectiveTo ? "border-red-500" : ""}`}
                  />
                  {errors.effectiveTo?.message && (
                    <p className="text-xs text-red-600 mt-1">{errors.effectiveTo.message}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Configuration Section */}
            <div className="space-y-3">
              <SubFormTitle title="Configuration" />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="asPerMinimumWages"
                  checked={formData.asPerMinimumWages}
                  onCheckedChange={(checked) => setValue("asPerMinimumWages", checked === true)}
                  disabled={isViewMode || isLoading}
                />
                <Label htmlFor="asPerMinimumWages" className="text-sm font-normal cursor-pointer">
                  As Per Minimum Wages
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Remarks
                </Label>
                <textarea
                  disabled={isViewMode || isLoading}
                  {...register("remark")}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 shadow-sm resize-none transition"
                  placeholder="Additional notes or comments..."
                  rows={3}
                />
              </div>
            </div>

          </form>
        </CardContent>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <ActionButtons
            layout="end"
            gap="gap-3"
            secondaryLabel={isViewMode ? "Close" : "Cancel"}
            onSecondary={onClose}
            primaryLabel={isViewMode ? "Close" : "Save Changes"}
            onPrimary={isViewMode ? onClose : handleSubmit(submitForm, handleInvalidSubmit)}
            primaryLoading={loading}
            primaryDisabled={isViewMode ? loading : loading || isLoading}
            secondaryDisabled={isViewMode || loading || isLoading}
            primaryClassName={isViewMode ? "bg-gray-600 hover:bg-gray-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          />
        </div>
      </Card>
    </div>
  )
} 