"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin, X, Settings, FolderOpen } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Badge } from "@repo/ui/components/ui/badge"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import SingleSelectField from "@/components/fields/single-select-field"
import { createSectionSchema } from "./sections-form-schema"

interface SectionFormData {
  sectionCode?: string
  sectionName?: string
  sectionDescription?: string
  subsidiaryCode: string
  divisionCode: string
  departmentCode: string
  subDepartmentCode: string
  locationCode?: string[]
}

interface SectionFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type SectionFormField =
  | "sectionCode"
  | "sectionName"
  | "sectionDescription"
  | "subsidiaryCode"
  | "divisionCode"
  | "departmentCode"
  | "subDepartmentCode"
  | "locationCode"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
const TEXTAREA_CLASS = "min-h-[96px] border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 resize-none"

const normalizeLocationCodes = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return [value]
  }
  return []
}

export default function SectionAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: SectionFormModalProps) {
  const tenantCode = useGetTenantCode()
  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )
  
  // State for selected values
  const [selectedLocationCodes, setSelectedLocationCodes] = useState<string[]>([])
  const [selectedSubsidiaryCode, setSelectedSubsidiaryCode] = useState<string>("") 
  const [selectedDivisionCode, setSelectedDivisionCode] = useState<string>("") 
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState<string>("") 
  const [selectedSubDepartmentCode, setSelectedSubDepartmentCode] = useState<string>("") 
  
  // Track if user has manually changed values to prevent effects from overriding
  const [userHasChangedSubsidiary, setUserHasChangedSubsidiary] = useState(false)
  const [userHasChangedDivision, setUserHasChangedDivision] = useState(false)
  const [userHasChangedDepartment, setUserHasChangedDepartment] = useState(false)
  const [userHasChangedSubDepartment, setUserHasChangedSubDepartment] = useState(false)

  const { arrayData: subsidiariesArray, refetch: refetchSubsidiaries } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: divisionsArray, refetch: refetchDivisions } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "divisions",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: departmentsArray, refetch: refetchDepartments } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "departments",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: subDepartmentsArray, refetch: refetchSubDepartments } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subDepartments",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: locationArray, refetch: refetchLocations } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "location",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchSubsidiaries()
    void refetchDivisions()
    void refetchDepartments()
    void refetchSubDepartments()
    void refetchLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])
  
  // Get subsidiary options from organization data
  const subsidiaryOptions = (subsidiariesArray || []).map((subsidiary: any) => ({
    label: `${subsidiary.subsidiaryName} (${subsidiary.subsidiaryCode})`,
    value: subsidiary.subsidiaryCode
  }))
  
  // Get filtered division options based on selected subsidiary
  const getFilteredDivisionOptions = () => {
    if (!selectedSubsidiaryCode) return []
    
    return (divisionsArray || [])
      .filter((division: any) => division.subsidiaryCode === selectedSubsidiaryCode)
      .map((division: any) => ({
        label: `${division.divisionName} (${division.divisionCode})`,
        value: division.divisionCode
      }))
  }
  
  // Get filtered department options based on selected division
  const getFilteredDepartmentOptions = () => {
    if (!selectedDivisionCode) return []
    
    return (departmentsArray || [])
      .filter((department: any) => department.divisionCode === selectedDivisionCode)
      .map((department: any) => ({
        label: `${department.departmentName} (${department.departmentCode})`,
        value: department.departmentCode
      }))
  }
  
  // Get filtered sub department options based on selected department
  const getFilteredSubDepartmentOptions = () => {
    if (!selectedDepartmentCode) return []
    
    return (subDepartmentsArray || [])
      .filter((subDept: any) => subDept.departmentCode === selectedDepartmentCode)
      .map((subDept: any) => ({
        label: `${subDept.subDepartmentName} (${subDept.subDepartmentCode})`,
        value: subDept.subDepartmentCode
      }))
  }
  
  // Get filtered location options based on selected sub department
  const getFilteredLocationOptions = () => {
    if (!selectedSubDepartmentCode) return []
    
    const selectedSubDepartment = (subDepartmentsArray || []).find((subDept: any) => subDept.subDepartmentCode === selectedSubDepartmentCode)
    if (!selectedSubDepartment || !selectedSubDepartment.locationCode) return []
    
    const subDepartmentLocationCodes = Array.isArray(selectedSubDepartment.locationCode) 
      ? selectedSubDepartment.locationCode 
      : [selectedSubDepartment.locationCode]
    
    return (locationArray || [])
      .filter((location: any) => subDepartmentLocationCodes.includes(location.locationCode))
      .map((location: any) => ({
        label: `${location.locationName} (${location.locationCode})`,
        value: location.locationCode
      }))
  }
  
  const divisionOptions = getFilteredDivisionOptions()
  const departmentOptions = getFilteredDepartmentOptions()
  const subDepartmentOptions = getFilteredSubDepartmentOptions()
  const locationOptions = getFilteredLocationOptions()
  
  const schema = useMemo(
    () => createSectionSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.sectionCode) return
    handleDeleteItem(deleteValue.sectionCode)
  }, [deleteValue])

  const handleDeleteItem = async (sectionCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          sections: [{ sectionCode }],
        },
      }
      // postSection(postData)
    } catch (error) {
      console.error("Error deleting section:", error)
    }
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm<SectionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      sectionCode: "",
      sectionName: "",
      sectionDescription: "",
      subsidiaryCode: "",
      divisionCode: "",
      departmentCode: "",
      subDepartmentCode: "",
      locationCode: [],
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      const normalizedLocationCodes = normalizeLocationCodes(editData.locationCode)
      setValue("sectionCode", editData.sectionCode || "")
      setValue("sectionName", editData.sectionName || "")
      setValue("sectionDescription", editData.sectionDescription || "")
      setValue("subsidiaryCode", editData.subsidiaryCode || "")
      setValue("divisionCode", editData.divisionCode || "")
      setValue("departmentCode", editData.departmentCode || "")
      setValue("subDepartmentCode", editData.subDepartmentCode || "")
      setSelectedSubsidiaryCode(editData.subsidiaryCode || "")
      setSelectedDivisionCode(editData.divisionCode || "")
      setSelectedDepartmentCode(editData.departmentCode || "")
      setSelectedSubDepartmentCode(editData.subDepartmentCode || "")
      setSelectedLocationCodes(normalizedLocationCodes)
      setValue("locationCode", normalizedLocationCodes)
      
      // Reset user change flags when loading edit data
      setUserHasChangedSubsidiary(false)
      setUserHasChangedDivision(false)
      setUserHasChangedDepartment(false)
      setUserHasChangedSubDepartment(false)
    } else if (open && !isEditMode) {
      reset()
      setSelectedLocationCodes([])
      setSelectedSubsidiaryCode("")
      setSelectedDivisionCode("")
      setSelectedDepartmentCode("")
      setSelectedSubDepartmentCode("")
      
      // Reset user change flags when opening add mode
      setUserHasChangedSubsidiary(false)
      setUserHasChangedDivision(false)
      setUserHasChangedDepartment(false)
      setUserHasChangedSubDepartment(false)
    }
  }, [isEditMode, editData, setValue, reset, open])


  useEffect(() => {
    // Only set division if user hasn't manually changed subsidiary
    if (isEditMode && editData && selectedSubsidiaryCode && !userHasChangedSubsidiary) {
      setSelectedDivisionCode(editData.divisionCode || "");
      setValue("divisionCode", editData.divisionCode || "");
    }
  }, [isEditMode, editData, selectedSubsidiaryCode, setValue, userHasChangedSubsidiary]);

  useEffect(() => {
    // Only set department if user hasn't manually changed division
    if (isEditMode && editData && selectedDivisionCode && !userHasChangedDivision) {
      setSelectedDepartmentCode(editData.departmentCode || "");
      setValue("departmentCode", editData.departmentCode || "")
    }
  }, [isEditMode, editData, selectedDivisionCode, setValue, userHasChangedDivision]);

  useEffect(() => {
    // Only set sub department if user hasn't manually changed department
    if (isEditMode && editData && selectedDepartmentCode && !userHasChangedDepartment) {
      setSelectedSubDepartmentCode(editData.subDepartmentCode || "");
      setValue("subDepartmentCode", editData.subDepartmentCode || "")
    }
  }, [isEditMode, editData, selectedDepartmentCode, setValue, userHasChangedDepartment]);

  useEffect(() => {
    // Only set location if user hasn't manually changed sub department
    if (isEditMode && editData && selectedSubDepartmentCode && !userHasChangedSubDepartment) {
      const normalizedLocationCodes = normalizeLocationCodes(editData.locationCode)
      setSelectedLocationCodes(normalizedLocationCodes)
      setValue("locationCode", normalizedLocationCodes)
    }
  }, [isEditMode, editData, selectedSubDepartmentCode, setValue, userHasChangedSubDepartment]);

  const { post: postSection, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, SectionFormField> = {
          sectionCode: "sectionCode",
          sectionName: "sectionName",
          sectionDescription: "sectionDescription",
          subsidiaryCode: "subsidiaryCode",
          divisionCode: "divisionCode",
          departmentCode: "departmentCode",
          subDepartmentCode: "subDepartmentCode",
          locationCode: "locationCode",
        }

        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField as any, { type: "server", message })
        })
        return
      }

      toast.success("Section submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setSelectedLocationCodes([])
      setSelectedSubsidiaryCode("")
      setSelectedDivisionCode("")
      setSelectedDepartmentCode("")
      setSelectedSubDepartmentCode("")
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Section submission failed!")
      console.error("POST error:", error)
    },
  })

  const handleFormSubmit = async (data: SectionFormData) => {
    try {
      clearErrors()
      const payloadSection = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
        subsidiaryCode: selectedSubsidiaryCode,
        divisionCode: selectedDivisionCode,
        departmentCode: selectedDepartmentCode,
        subDepartmentCode: selectedSubDepartmentCode,
        locationCode: normalizeLocationCodes(selectedLocationCodes),
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "sectionValidator",
        data: {
          sections: [payloadSection],
        },
      }
      postSection(postData)
    } catch (error) {
      console.error("Error processing section:", error)
    }
  }

  // Handle subsidiary selection
  const handleSubsidiarySelect = (subsidiaryCode: string) => {
    setSelectedSubsidiaryCode(subsidiaryCode)
    setValue("subsidiaryCode", subsidiaryCode)
    
    // Mark that user has changed subsidiary
    setUserHasChangedSubsidiary(true)
    
    // Clear division, department, sub department and location codes when subsidiary changes
    setSelectedDivisionCode("")
    setValue("divisionCode", "")
    setSelectedDepartmentCode("")
    setValue("departmentCode", "")
    setSelectedSubDepartmentCode("")
    setValue("subDepartmentCode", "")
    setSelectedLocationCodes([])
    setValue("locationCode", [])
    
    // Reset child change flags since we're clearing them
    setUserHasChangedDivision(false)
    setUserHasChangedDepartment(false)
    setUserHasChangedSubDepartment(false)
  }

  // Handle division selection
  const handleDivisionSelect = (divisionCode: string) => {
    setSelectedDivisionCode(divisionCode)
    setValue("divisionCode", divisionCode)
    
    // Mark that user has changed division
    setUserHasChangedDivision(true)
    
    // Clear department, sub department and location codes when division changes
    setSelectedDepartmentCode("")
    setValue("departmentCode", "")
    setSelectedSubDepartmentCode("")
    setValue("subDepartmentCode", "")
    setSelectedLocationCodes([])
    setValue("locationCode", [])
    
    // Reset child change flags since we're clearing them
    setUserHasChangedDepartment(false)
    setUserHasChangedSubDepartment(false)
  }

  // Handle department selection
  const handleDepartmentSelect = (departmentCode: string) => {
    setSelectedDepartmentCode(departmentCode)
    setValue("departmentCode", departmentCode)
    
    // Mark that user has changed department
    setUserHasChangedDepartment(true)
    
    // Clear sub department and location codes when department changes
    setSelectedSubDepartmentCode("")
    setValue("subDepartmentCode", "")
    setSelectedLocationCodes([])
    setValue("locationCode", [])
    
    // Reset sub department change flag since we're clearing it
    setUserHasChangedSubDepartment(false)
  }

  // Handle sub department selection
  const handleSubDepartmentSelect = (subDepartmentCode: string) => {
    setSelectedSubDepartmentCode(subDepartmentCode)
    setValue("subDepartmentCode", subDepartmentCode)
    
    // Mark that user has changed sub department
    setUserHasChangedSubDepartment(true)
    
    // Clear location codes when sub department changes
    setSelectedLocationCodes([])
    setValue("locationCode", [])
  }

  // Handle location code selection
  const handleLocationCodeSelect = (locationCode: string) => {
    const normalizedCodes = normalizeLocationCodes(selectedLocationCodes)
    if (!normalizedCodes.includes(locationCode)) {
      const updatedCodes = [...normalizedCodes, locationCode]
      setSelectedLocationCodes(updatedCodes)
      setValue("locationCode", updatedCodes)
    }
  }

  const normalizedSelectedLocationCodes = normalizeLocationCodes(selectedLocationCodes)

  const availableLocationOptions = locationOptions.filter(
    (option: any) => !normalizedSelectedLocationCodes.includes(option.value)
  )

  // Handle location code removal
  const handleLocationCodeRemove = (locationCode: string) => {
    const updatedCodes = normalizedSelectedLocationCodes.filter(code => code !== locationCode)
    setSelectedLocationCodes(updatedCodes)
    setValue("locationCode", updatedCodes)
  }

  const handleCancel = () => {
    reset()
    setSelectedLocationCodes([])
    setSelectedSubsidiaryCode("")
    setSelectedDivisionCode("")
    setSelectedDepartmentCode("")
    setSelectedSubDepartmentCode("")
    
    // Reset user change flags
    setUserHasChangedSubsidiary(false)
    setUserHasChangedDivision(false)
    setUserHasChangedDepartment(false)
    setUserHasChangedSubDepartment(false)
    
    setOpen(false)
  }

  return (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<SectionFormData>)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit Section" : "Add New Section"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update section information." : "Create a new section entry."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-3">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sectionCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Section Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sectionCode"
                      {...register("sectionCode")}
                      placeholder="Enter section code"
                      className={`${INPUT_CLASS} ${errors.sectionCode?.message ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.sectionCode?.message && <p className="text-xs text-red-500">{errors.sectionCode.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sectionName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Section Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="sectionName"
                      {...register("sectionName")}
                      placeholder="Enter section name"
                      className={`${INPUT_CLASS} ${errors.sectionName?.message ? "border-red-500" : ""}`}
                    />
                    {errors.sectionName?.message && <p className="text-xs text-red-500">{errors.sectionName.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sectionDescription" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Description
                  </Label>
                  <Textarea
                    id="sectionDescription"
                    {...register("sectionDescription")}
                    placeholder="Enter section description"
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Parent Hierarchy</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Map the section under its full parent structure.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <SingleSelectField
                      label="Subsidiary"
                      required
                      placeholder="Select a subsidiary"
                      value={selectedSubsidiaryCode}
                      onChange={handleSubsidiarySelect}
                      options={subsidiaryOptions}
                      errorMessage={typeof errors.subsidiaryCode?.message === "string" ? errors.subsidiaryCode.message : undefined}
                      disabled={isEditMode}
                    />
                  </div>

                  <div className="space-y-2">
                    <SingleSelectField
                      label="Division"
                      required
                      placeholder={selectedSubsidiaryCode ? "Select a division" : "First select a subsidiary"}
                      disabled={!selectedSubsidiaryCode || isEditMode}
                      value={selectedDivisionCode}
                      onChange={handleDivisionSelect}
                      options={divisionOptions}
                      errorMessage={typeof errors.divisionCode?.message === "string" ? errors.divisionCode.message : undefined}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <SingleSelectField
                      label="Department"
                      required
                      placeholder={selectedDivisionCode ? "Select a department" : "First select a division"}
                      disabled={!selectedDivisionCode || isEditMode}
                      value={selectedDepartmentCode}
                      onChange={handleDepartmentSelect}
                      options={departmentOptions}
                      errorMessage={typeof errors.departmentCode?.message === "string" ? errors.departmentCode.message : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <SingleSelectField
                      label="Sub Department"
                      required
                      placeholder={selectedDepartmentCode ? "Select a sub department" : "First select a department"}
                      disabled={!selectedDepartmentCode || isEditMode}
                      value={selectedSubDepartmentCode}
                      onChange={handleSubDepartmentSelect}
                      options={subDepartmentOptions}
                      errorMessage={typeof errors.subDepartmentCode?.message === "string" ? errors.subDepartmentCode.message : undefined}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Location Assignment</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Assign one or more locations to this section.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <SingleSelectField
                      label="Location Codes"
                      placeholder={selectedSubDepartmentCode ? "Select location code" : "First select a sub department"}
                      disabled={!selectedSubDepartmentCode || isEditMode}
                      value=""
                      onChange={handleLocationCodeSelect}
                      options={availableLocationOptions}
                    />
                  </div>

                  {normalizedSelectedLocationCodes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Selected Locations
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {normalizedSelectedLocationCodes.map((code) => {
                          const location = (locationArray || []).find((loc: any) => loc.locationCode === code)
                          return (
                            <Badge
                              key={code}
                              variant="secondary"
                              className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200"
                            >
                              <MapPin className="w-3 h-3" />
                              {location ? `${location.locationName} (${code})` : code}
                              {!isEditMode && (
                                <button
                                  type="button"
                                  onClick={() => handleLocationCodeRemove(code)}
                                  className="ml-1 hover:text-red-500"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting || postLoading}
              >
                {postLoading ? "Saving..." : (isEditMode ? "Update" : "Save")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    ) : null
  )
}