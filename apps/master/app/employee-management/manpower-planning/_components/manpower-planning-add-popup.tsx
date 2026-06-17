"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardFooter } from "@repo/ui/components/ui/card"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { X, Calendar, TrendingUp, Users } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { useEmployeeShiftGraphql } from "@/hooks/api/useEmployeeShiftGraphql"
import SingleSelectField from "@/components/fields/single-select-field"
import { toast } from "react-toastify"
import { defaultManpowerPlanningValues, manpowerPlanningSchema, type ManpowerPlanningFormValues } from "./schemas/manpower-planning-form.schema"

interface Props {
  isOpen: boolean
  mode?: "add" | "edit"
  recordId?: string | null
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

export default function ManpowerPlanningAddPopup({
  isOpen,
  mode = "add",
  recordId = null,
  onClose,
  onSaved,
}: Props) {
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [formData, setFormData] = useState<ManpowerPlanningFormValues>(defaultManpowerPlanningValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [organizationData, setOrganizationData] = useState<any>({})
  const wasOpenRef = useRef(false)
  const hasFetchedRef = useRef(false)

  // Fetch single record for edit mode
  const { refetch: fetchRecord, loading: recordLoading } = useRequest<any>({
    url: recordId && mode === "edit" ? `manpowerPlanning/${recordId}` : "",
    method: "GET",
    onSuccess: (data:any) => {
      if (data) {
        const manpowerData = data?.manpower || {}
        const mappedData: ManpowerPlanningFormValues = {
          subsidiary: {
            subsidiaryCode: data?.subsidiary?.subsidiaryCode || "",
            subsidiaryName: data?.subsidiary?.subsidiaryName || "",
          },
          division: {
            divisionCode: data?.division?.divisionCode || "",
            divisionName: data?.division?.divisionName || "",
          },
          location: {
            locationCode: data?.location?.locationCode || "",
            locationName: data?.location?.locationName || "",
          },
          department: {
            departmentCode: data?.department?.departmentCode || "",
            departmentName: data?.department?.departmentName || "",
          },
          fromDate: data?.fromDate?.split("T")[0] || "",
          toDate: data?.toDate?.split("T")[0] || "",
          shiftGroupCode: data?.shiftGroupCode || "",
          shiftCode: data?.shiftCode || "",
          manpower: {
            planned: manpowerData?.planned ?? 0,
            rotaPlanned: manpowerData?.rotaPlanned ?? 0,
            bench: manpowerData?.bench ?? 0,
            iedRequired: manpowerData?.iedRequired ?? 0,
          },
        }
        setFormData(mappedData)
      }
      setFetchingData(false)
    },
    onError: (error:any) => {
      setFetchingData(false)
    },
  })

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

  // Fetch all organization data using useAggregateArrayFetch
  const { arrayData: subsidiariesArray, loading: subsidiariesLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode) && isOpen,
    defaultValue: [],
  })

  const { arrayData: divisionsArray, loading: divisionsLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "divisions",
    enabled: Boolean(tenantCode) && isOpen,
    defaultValue: [],
  })

  const { arrayData: locationsArray, loading: locationsLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "location",
    enabled: Boolean(tenantCode) && isOpen,
    defaultValue: [],
  })

  const { arrayData: departmentsArray, loading: departmentsLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "departments",
    enabled: Boolean(tenantCode) && isOpen,
    defaultValue: [],
  })

  const isLoading = subsidiariesLoading || divisionsLoading || locationsLoading || departmentsLoading

  // Build hierarchy filters based on selected subsidiary and location
  const hierarchyFilters = useMemo(() => {
    const subsidiaryCode = formData.subsidiary?.subsidiaryCode
    const locationCode = formData.location?.locationCode
    
    // Only return filters if both subsidiary and location are selected
    if (!subsidiaryCode || !locationCode) {
      return null
    }
    
    return {
      subsidiary: subsidiaryCode,
      location: locationCode,
      categories: "ALL", // Always pass "ALL" for categories
    }
  }, [formData.subsidiary?.subsidiaryCode, formData.location?.locationCode])

  // Check if Shift Group should be enabled (Subsidiary AND Location must be selected)
  const isShiftGroupEnabled = !!(formData.subsidiary?.subsidiaryCode && formData.location?.locationCode)

  const { shiftGroups, shiftGroupsLoading, shiftOptions } = useEmployeeShiftGraphql({
    tenantCode,
    shiftGroupCode: formData.shiftGroupCode,
    hierarchyFilters: hierarchyFilters,
  })

  // Combine all organization data
  useEffect(() => {
    if (isOpen) {
      setOrganizationData({
        subsidiaries: subsidiariesArray || [],
        divisions: divisionsArray || [],
        locations: locationsArray || [],
        departments: departmentsArray || [],
      })
    }
  }, [isOpen, subsidiariesArray, divisionsArray, locationsArray, departmentsArray])

  // Reset form and fetch data when opening
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && recordId) {
        if (!hasFetchedRef.current || wasOpenRef.current === false) {
          setFetchingData(true)
          fetchRecord()
          hasFetchedRef.current = true
        }
      } else if (mode === "add") {
        setFormData(defaultManpowerPlanningValues)
        hasFetchedRef.current = false
      }
      setErrors({})
      setShowErrors(false)
    } else {
      hasFetchedRef.current = false
      setFormData(defaultManpowerPlanningValues)
    }
    wasOpenRef.current = isOpen
  }, [isOpen, mode, recordId])

  // Filter locations based on selected subsidiary
  const filteredLocations = useMemo(() => {
    const locations = organizationData.locations || []
    const subsidiaryCode = formData.subsidiary?.subsidiaryCode
    
    if (!subsidiaryCode) return locations
    
    return locations.filter((item: any) => 
      item?.subsidiaryCode === subsidiaryCode || !item?.subsidiaryCode
    )
  }, [organizationData.locations, formData.subsidiary?.subsidiaryCode])

  // Filter divisions based on selected subsidiary
  const filteredDivisions = useMemo(() => {
    const divisions = organizationData.divisions || []
    const subsidiaryCode = formData.subsidiary?.subsidiaryCode

    if (!subsidiaryCode) return divisions

    return divisions.filter((item: any) =>
      item?.subsidiaryCode === subsidiaryCode || !item?.subsidiaryCode
    )
  }, [organizationData.divisions, formData.subsidiary?.subsidiaryCode])

  // Department is now independent - no filtering based on division
  const allDepartments = useMemo(() => {
    return organizationData.departments || []
  }, [organizationData.departments])

  // Build options for dropdowns
  const subsidiaryOptions = useMemo(
    () =>
      (organizationData.subsidiaries || []).map((item: any) => ({
        value: item?.subsidiaryCode || item?.code || "",
        label: item?.subsidiaryName || item?.name || "",
        subsidiaryCode: item?.subsidiaryCode || item?.code,
        subsidiaryName: item?.subsidiaryName || item?.name,
      })),
    [organizationData.subsidiaries]
  )

  const divisionOptions = useMemo(
    () =>
      filteredDivisions.map((item: any) => ({
        value: item?.divisionCode || item?.code || "",
        label: item?.divisionName || item?.name || "",
        divisionCode: item?.divisionCode || item?.code,
        divisionName: item?.divisionName || item?.name,
      })),
    [filteredDivisions]
  )

  const locationOptions = useMemo(
    () =>
      filteredLocations.map((item: any) => ({
        value: item?.locationCode || item?.code || "",
        label: item?.locationName || item?.name || "",
        locationCode: item?.locationCode || item?.code,
        locationName: item?.locationName || item?.name,
      })),
    [filteredLocations]
  )

  // Department options - independent, no filtering
  const departmentOptions = useMemo(
    () =>
      allDepartments.map((item: any) => ({
        value: item?.departmentCode || item?.code || "",
        label: item?.departmentName || item?.name || "",
        departmentCode: item?.departmentCode || item?.code,
        departmentName: item?.departmentName || item?.name,
      })),
    [allDepartments]
  )

  const shiftGroupOptions = useMemo(
    () =>
      shiftGroups.map((item) => ({
        value: item.shiftGroupCode,
        label: `${item.shiftGroupCode}${item.shiftGroupName ? ` - ${item.shiftGroupName}` : ""}`,
      })),
    [shiftGroups]
  )

  const shiftCodeOptions = useMemo(
    () =>
      shiftOptions.map((item) => ({
        value: item.shiftCode,
        label: `${item.shiftCode}${item.shiftName ? ` - ${item.shiftName}` : ""}`,
      })),
    [shiftOptions]
  )

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading && !fetchingData) {
        onClose()
      }
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

  const { post } = usePostRequest<any>({
    url: "manpowerPlanning",
    onSuccess: async () => {
      toast.success(`Manpower Planning ${mode === "edit" ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)
      onClose()
    },
    onError: (error) => {
      setLoading(false)
    },
  })

  // Validate date range
  const validateDateRange = (fromDate: string, toDate: string) => {
    if (fromDate && toDate && fromDate > toDate) {
      setErrors(prev => ({
        ...prev,
        toDate: "To Date must be greater than or equal to From Date"
      }))
      return false
    } else if (errors.toDate === "To Date must be greater than or equal to From Date") {
      const newErrors = { ...errors }
      delete newErrors.toDate
      setErrors(newErrors)
    }
    return true
  }

  // Handle From Date change
  const handleFromDateChange = (value: string) => {
    setFormData((p: any) => ({ ...p, fromDate: value }))
    if (formData.toDate) {
      validateDateRange(value, formData.toDate)
    } else if (errors.toDate) {
      const newErrors = { ...errors }
      delete newErrors.toDate
      setErrors(newErrors)
    }
  }

  // Handle To Date change
  const handleToDateChange = (value: string) => {
    setFormData((p: any) => ({ ...p, toDate: value }))
    if (formData.fromDate) {
      validateDateRange(formData.fromDate, value)
    }
  }

  const submit = async () => {
    setShowErrors(true)
    
    // Validate date range before submitting
    if (formData.fromDate && formData.toDate && formData.fromDate > formData.toDate) {
      setErrors(prev => ({
        ...prev,
        toDate: "To Date must be greater than or equal to From Date"
      }))
      toast.error("Please fix the validation errors before saving")
      return
    }
    
    const parsed = manpowerPlanningSchema.safeParse(formData)
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
    
    try {
      await post({
        tenant: tenantCode,
        action: mode === "edit" ? "update" : "insert",
        id: mode === "edit" ? recordId : null,
        collectionName: "manpowerPlanning",
        event: "manpowerPlanning",
        data: {
          ...parsed.data,
          tenantCode,
          organizationCode: tenantCode,
          updatedBy: employeeId ?? null,
          updatedOn: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Submit error:", error)
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && !fetchingData) {
      onClose()
    }
  }

  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  const updateNestedField = <K extends keyof ManpowerPlanningFormValues>(
    section: K,
    field: string,
    value: any
  ) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
    const errorKey = `${String(section)}.${field}`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  // Handle selection for nested fields with cascading reset
  const handleSubsidiarySelect = (value: string) => {
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
        division: { divisionCode: "", divisionName: "" },
        location: { locationCode: "", locationName: "" },
        // Reset shift group and shift when subsidiary changes
        shiftGroupCode: "",
        shiftCode: "",
        // Department is independent - no reset needed
      }))
    }
  }

  const handleLocationSelect = (value: string) => {
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
        // Reset shift group and shift when location changes
        shiftGroupCode: "",
        shiftCode: "",
      }))
    }
  }

  const handleDepartmentSelect = (value: string) => {
    const selected = (organizationData.departments || []).find(
      (item: any) => (item?.departmentCode || item?.code) === value
    )
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        department: {
          departmentCode: selected.departmentCode || selected.code || "",
          departmentName: selected.departmentName || selected.name || "",
        },
      }))
    }
  }

  const handleDivisionSelect = (value: string) => {
    const selected = (organizationData.divisions || []).find(
      (item: any) => (item?.divisionCode || item?.code) === value
    )
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        division: {
          divisionCode: selected.divisionCode || selected.code || "",
          divisionName: selected.divisionName || selected.name || "",
        },
        // Department is independent - no reset
      }))
    }
  }

  const totalManpower = useMemo(() => {
    const { planned, rotaPlanned, bench, iedRequired } = formData.manpower
    return (planned || 0) + (rotaPlanned || 0) + (bench || 0) + (iedRequired || 0)
  }, [formData.manpower])

  const handleNumberChange = (section: keyof ManpowerPlanningFormValues, field: string, value: string) => {
    if (value === "") {
      updateNestedField(section, field, 0)
    } else {
      const numValue = parseInt(value, 10)
      if (!isNaN(numValue)) {
        updateNestedField(section, field, numValue)
      }
    }
  }

  if (!isOpen) return null

  const isLoadingData = fetchingData || recordLoading

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-4xl max-h-[90vh] flex flex-col">
        <Card className="border border-gray-200 bg-white shadow-sm flex flex-col h-full overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Manpower Planning - {mode === "edit" ? "Edit" : "Add New"}
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

          <CardContent className="px-6 py-4 overflow-y-auto flex-1">
            {(isLoading || isLoadingData) && isOpen && (
              <div className="py-12 text-center text-sm text-gray-600">
                {isLoadingData ? "Loading record data..." : "Loading form configuration..."}
              </div>
            )}
            
            {!isLoadingData && (
              <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-6">
                
                {/* Organization Details Section */}
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
                        disabled={isLoading}
                      />
                      {showErrors && errors["subsidiary.subsidiaryCode"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["subsidiary.subsidiaryCode"]}</p>
                      )}
                    </div>

                    {/* Division */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Division"
                        placeholder={formData.subsidiary?.subsidiaryCode ? "Select Division" : "Select subsidiary first"}
                        value={formData.division?.divisionCode || ""}
                        onChange={handleDivisionSelect}
                        options={divisionOptions}
                        required={true}
                        disabled={isLoading || !formData.subsidiary?.subsidiaryCode}
                      />
                      {showErrors && errors["division.divisionCode"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["division.divisionCode"]}</p>
                      )}
                    </div>

                    {/* Department - INDEPENDENT, not dependent on Division or Subsidiary */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Department"
                        placeholder="Select Department"
                        value={formData.department?.departmentCode || ""}
                        onChange={handleDepartmentSelect}
                        options={departmentOptions}
                        required={true}
                        disabled={isLoading}
                      />
                      {showErrors && errors["department.departmentCode"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["department.departmentCode"]}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Location"
                        placeholder={formData.subsidiary?.subsidiaryCode ? "Select Location" : "Select subsidiary first"}
                        value={formData.location?.locationCode || ""}
                        onChange={handleLocationSelect}
                        options={locationOptions}
                        required={true}
                        disabled={isLoading || !formData.subsidiary?.subsidiaryCode}
                      />
                      {showErrors && errors["location.locationCode"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["location.locationCode"]}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Date Range Section */}
                <div className="space-y-3">
                  <SubFormTitle title="Date Range" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        From Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={formData.fromDate}
                        onChange={(e) => handleFromDateChange(e.target.value)}
                        className={`${fieldStyles} bg-white ${showErrors && errors.fromDate ? "border-red-500" : ""}`}
                      />
                      {showErrors && errors.fromDate && (
                        <p className="text-xs text-red-600 mt-1">{errors.fromDate}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        To Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        value={formData.toDate}
                        onChange={(e) => handleToDateChange(e.target.value)}
                        className={`${fieldStyles} bg-white ${showErrors && errors.toDate ? "border-red-500" : ""}`}
                      />
                      {showErrors && errors.toDate && (
                        <p className="text-xs text-red-600 mt-1">{errors.toDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Shift Details Section */}
                <div className="space-y-3">
                  <SubFormTitle title="Shift Details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Shift Group Code"
                        placeholder={isShiftGroupEnabled ? "Select Shift Group" : "Select subsidiary and location first"}
                        value={formData.shiftGroupCode || ""}
                        onChange={(value) =>
                          setFormData((p: any) => ({ ...p, shiftGroupCode: value, shiftCode: "" }))
                        }
                        options={shiftGroupOptions}
                        required={true}
                        disabled={isLoading || shiftGroupsLoading || !isShiftGroupEnabled}
                      />
                      {!isShiftGroupEnabled && (
                        <p className="text-xs text-amber-600 mt-1">
                          Please select Subsidiary and Location before selecting Shift Group
                        </p>
                      )}
                      {showErrors && errors.shiftGroupCode && (
                        <p className="text-xs text-red-600 mt-1">{errors.shiftGroupCode}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Shift Code"
                        placeholder={formData.shiftGroupCode ? "Select Shift Code" : "Select shift group first"}
                        value={formData.shiftCode || ""}
                        onChange={(value) => setFormData((p: any) => ({ ...p, shiftCode: value }))}
                        options={shiftCodeOptions}
                        required={true}
                        disabled={isLoading || !formData.shiftGroupCode}
                      />
                      {showErrors && errors.shiftCode && (
                        <p className="text-xs text-red-600 mt-1">{errors.shiftCode}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Manpower Requirements Section */}
                <div className="space-y-3">
                  <SubFormTitle title="Manpower Requirements" />

                  <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-blue-100 bg-blue-50 mb-4">
                    <span className="text-sm font-semibold text-gray-700">Manpower Summary</span>
                    <span className="inline-flex items-center gap-1.5 border border-blue-200 bg-white text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {totalManpower.toLocaleString()} Required
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Planned
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.manpower.planned === 0 ? "" : formData.manpower.planned}
                        onChange={(e) => handleNumberChange("manpower", "planned", e.target.value)}
                        className={`${fieldStyles} bg-white ${showErrors && errors["manpower.planned"] ? "border-red-500" : ""}`}
                        placeholder="0"
                      />
                      {showErrors && errors["manpower.planned"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["manpower.planned"]}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Rota Planned
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.manpower.rotaPlanned === 0 ? "" : formData.manpower.rotaPlanned}
                        onChange={(e) => handleNumberChange("manpower", "rotaPlanned", e.target.value)}
                        className={`${fieldStyles} bg-white ${showErrors && errors["manpower.rotaPlanned"] ? "border-red-500" : ""}`}
                        placeholder="0"
                      />
                      {showErrors && errors["manpower.rotaPlanned"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["manpower.rotaPlanned"]}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Bench
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.manpower.bench === 0 ? "" : formData.manpower.bench}
                        onChange={(e) => handleNumberChange("manpower", "bench", e.target.value)}
                        className={`${fieldStyles} bg-white ${showErrors && errors["manpower.bench"] ? "border-red-500" : ""}`}
                        placeholder="0"
                      />
                      {showErrors && errors["manpower.bench"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["manpower.bench"]}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        IED Required
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.manpower.iedRequired === 0 ? "" : formData.manpower.iedRequired}
                        onChange={(e) => handleNumberChange("manpower", "iedRequired", e.target.value)}
                        className={`${fieldStyles} bg-white ${showErrors && errors["manpower.iedRequired"] ? "border-red-500" : ""}`}
                        placeholder="0"
                      />
                      {showErrors && errors["manpower.iedRequired"] && (
                        <p className="text-xs text-red-600 mt-1">{errors["manpower.iedRequired"]}</p>
                      )}
                    </div>
                  </div>
                </div>

              </form>
            )}
          </CardContent>

          <CardFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            <ActionButtons
              layout="end"
              gap="gap-3"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel="Save Changes"
              onPrimary={submit}
              primaryLoading={loading}
              primaryDisabled={loading || isLoading || isLoadingData}
              secondaryDisabled={loading || isLoadingData}
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}