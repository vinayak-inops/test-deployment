"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin, X, Settings } from "lucide-react"
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
import { useFetchUserEntitlements } from "@/hooks/hierarchy/useFetchUserEntitlements"
import SingleSelectField from "@/components/fields/single-select-field"
import { createSubDepartmentSchema } from "./sub-departments-form-schema"

interface SubDepartmentFormData {
  subDepartmentCode?: string
  subDepartmentName?: string
  subDepartmentDescription?: string
  subsidiaryCode: string
  divisionCode: string
  departmentCode: string
  locationCode?: string[]
}

interface SubDepartmentFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type SubDepartmentFormField =
  | "subDepartmentCode"
  | "subDepartmentName"
  | "subDepartmentDescription"
  | "subsidiaryCode"
  | "divisionCode"
  | "departmentCode"
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

export default function SubDepartmentAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: SubDepartmentFormModalProps) {
  const tenantCode = useGetTenantCode()
  const { fetchUserEntitlements } = useFetchUserEntitlements()
  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )
  
  // State for selected values
  const [selectedLocationCodes, setSelectedLocationCodes] = useState<string[]>([])
  const [selectedSubsidiaryCode, setSelectedSubsidiaryCode] = useState<string>("") 
  const [selectedDivisionCode, setSelectedDivisionCode] = useState<string>("") 
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState<string>("") 
  
  // Track if user has manually changed values to prevent effects from overriding
  const [userHasChangedSubsidiary, setUserHasChangedSubsidiary] = useState(false)
  const [userHasChangedDivision, setUserHasChangedDivision] = useState(false)
  const [userHasChangedDepartment, setUserHasChangedDepartment] = useState(false)

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
  
  // Get filtered location options based on selected department
  const getFilteredLocationOptions = () => {
    if (!selectedDepartmentCode) return []
    
    const selectedDepartment = (departmentsArray || []).find((dept: any) => dept.departmentCode === selectedDepartmentCode)
    if (!selectedDepartment || !selectedDepartment.locationCode) return []
    
    const departmentLocationCodes = Array.isArray(selectedDepartment.locationCode) 
      ? selectedDepartment.locationCode 
      : [selectedDepartment.locationCode]
    
    return (locationArray || [])
      .filter((location: any) => departmentLocationCodes.includes(location.locationCode))
      .map((location: any) => ({
        label: `${location.locationName} (${location.locationCode})`,
        value: location.locationCode
      }))
  }
  
  const divisionOptions = getFilteredDivisionOptions()
  const departmentOptions = getFilteredDepartmentOptions()
  const locationOptions = getFilteredLocationOptions()
  
  const schema = useMemo(
    () => createSubDepartmentSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.subDepartmentCode) return
    handleDeleteItem(deleteValue.subDepartmentCode)
  }, [deleteValue])

  const handleDeleteItem = async (subDepartmentCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          subDepartments: [{ subDepartmentCode }],
        },
      }
      // await postSubDepartment(postData)

    } catch (error) {
      console.error("Error deleting sub department:", error)
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
  } = useForm<SubDepartmentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subDepartmentCode: "",
      subDepartmentName: "",
      subDepartmentDescription: "",
      subsidiaryCode: "",
      divisionCode: "",
      departmentCode: "",
      locationCode: [],
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      const normalizedLocationCodes = normalizeLocationCodes(editData.locationCode)
      setValue("subDepartmentCode", editData.subDepartmentCode || "")
      setValue("subDepartmentName", editData.subDepartmentName || "")
      setValue("subDepartmentDescription", editData.subDepartmentDescription || "")
      setValue("subsidiaryCode", editData.subsidiaryCode || "")
      setValue("divisionCode", editData.divisionCode || "")
      setValue("departmentCode", editData.departmentCode || "")
      setSelectedSubsidiaryCode(editData.subsidiaryCode || "")
      setSelectedDivisionCode(editData.divisionCode || "")
      setSelectedDepartmentCode(editData.departmentCode || "")
      setSelectedLocationCodes(normalizedLocationCodes)
      setValue("locationCode", normalizedLocationCodes)
      
      // Reset user change flags when loading edit data
      setUserHasChangedSubsidiary(false)
      setUserHasChangedDivision(false)
      setUserHasChangedDepartment(false)
    } else if (open && !isEditMode) {
      reset()
      setSelectedLocationCodes([])
      setSelectedSubsidiaryCode("")
      setSelectedDivisionCode("")
      setSelectedDepartmentCode("")
      
      // Reset user change flags when opening add mode
      setUserHasChangedSubsidiary(false)
      setUserHasChangedDivision(false)
      setUserHasChangedDepartment(false)
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
    // Only set location if user hasn't manually changed department
    if (isEditMode && editData && selectedDepartmentCode && !userHasChangedDepartment) {
      const normalizedLocationCodes = normalizeLocationCodes(editData.locationCode)
      setSelectedLocationCodes(normalizedLocationCodes)
      setValue("locationCode", normalizedLocationCodes)
    }
  }, [isEditMode, editData, selectedDepartmentCode, setValue, userHasChangedDepartment]);

  const { post: postSubDepartment, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, SubDepartmentFormField> = {
          subDepartmentCode: "subDepartmentCode",
          subDepartmentName: "subDepartmentName",
          subDepartmentDescription: "subDepartmentDescription",
          subsidiaryCode: "subsidiaryCode",
          divisionCode: "divisionCode",
          departmentCode: "departmentCode",
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

      toast.success("Sub Department submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) {
        if (isEditMode) {
          await onServerUpdate()
        } else {
          const userEntitlementsFetched = await fetchUserEntitlements()
          if (userEntitlementsFetched) {
            await onServerUpdate()
          }
        }
      }
      reset()
      setSelectedLocationCodes([])
      setSelectedSubsidiaryCode("")
      setSelectedDivisionCode("")
      setSelectedDepartmentCode("")
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Sub Department submission failed!")
      console.error("POST error:", error)
    },
  })

  const handleFormSubmit = async (data: SubDepartmentFormData) => {
    try {
      clearErrors()
      const payloadSubDepartment = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
        subsidiaryCode: selectedSubsidiaryCode,
        divisionCode: selectedDivisionCode,
        departmentCode: selectedDepartmentCode,
        locationCode: normalizeLocationCodes(selectedLocationCodes),
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "subDepartmentValidator",
        data: {
          subDepartments: [payloadSubDepartment],
        },
      }
      await postSubDepartment(postData)
    } catch (error) {
      console.error("Error processing sub department:", error)
    }
  }

  // Handle subsidiary selection
  const handleSubsidiarySelect = (subsidiaryCode: string) => {
    setSelectedSubsidiaryCode(subsidiaryCode)
    setValue("subsidiaryCode", subsidiaryCode)
    
    // Mark that user has changed subsidiary
    setUserHasChangedSubsidiary(true)
    
    // Clear division, department and location codes when subsidiary changes
    setSelectedDivisionCode("")
    setValue("divisionCode", "")
    setSelectedDepartmentCode("")
    setValue("departmentCode", "")
    setSelectedLocationCodes([])
    setValue("locationCode", [])
    
    // Reset child change flags since we're clearing them
    setUserHasChangedDivision(false)
    setUserHasChangedDepartment(false)
  }

  // Handle division selection
  const handleDivisionSelect = (divisionCode: string) => {
    setSelectedDivisionCode(divisionCode)
    setValue("divisionCode", divisionCode)
    
    // Mark that user has changed division
    setUserHasChangedDivision(true)
    
    // Clear department and location codes when division changes
    setSelectedDepartmentCode("")
    setValue("departmentCode", "")
    setSelectedLocationCodes([])
    setValue("locationCode", [])
    
    // Reset department change flag since we're clearing it
    setUserHasChangedDepartment(false)
  }

  // Handle department selection
  const handleDepartmentSelect = (departmentCode: string) => {
    setSelectedDepartmentCode(departmentCode)
    setValue("departmentCode", departmentCode)
    
    // Mark that user has changed department
    setUserHasChangedDepartment(true)
    
    // Clear location codes when department changes
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
    
    // Reset user change flags
    setUserHasChangedSubsidiary(false)
    setUserHasChangedDivision(false)
    setUserHasChangedDepartment(false)
    
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gray-100 p-1.5">
              <Settings className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {isEditMode ? "Edit Sub Department" : "Add New Sub Department"}
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {isEditMode ? "Update sub department information." : "Create a new sub department entry."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<SubDepartmentFormData>)} className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subDepartmentCode" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Sub Department Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subDepartmentCode"
                    {...register("subDepartmentCode")}
                    placeholder="Enter sub department code"
                    className={errors.subDepartmentCode?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                    disabled={isEditMode}
                  />
                  {errors.subDepartmentCode?.message && <p className="text-xs text-red-500">{errors.subDepartmentCode.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subDepartmentName" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Sub Department Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subDepartmentName"
                    {...register("subDepartmentName")}
                    placeholder="Enter sub department name"
                    className={errors.subDepartmentName?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                  />
                  {errors.subDepartmentName?.message && <p className="text-xs text-red-500">{errors.subDepartmentName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subDepartmentDescription" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="subDepartmentDescription"
                  {...register("subDepartmentDescription")}
                  placeholder="Enter sub department description"
                  rows={3}
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900">Parent Hierarchy</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900">Location Assignment</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <SingleSelectField
                    label="Location Codes"
                    placeholder={selectedDepartmentCode ? "Select location code" : "First select a department"}
                    disabled={!selectedDepartmentCode || isEditMode}
                    value=""
                    onChange={handleLocationCodeSelect}
                    options={availableLocationOptions}
                  />
                </div>

                {normalizedSelectedLocationCodes.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wide text-gray-700">Selected Locations</Label>
                    <div className="flex flex-wrap gap-2">
                      {normalizedSelectedLocationCodes.map((code) => {
                        const location = (locationArray || []).find((loc: any) => loc.locationCode === code)
                        return (
                          <Badge
                            key={code}
                            variant="secondary"
                            className="flex items-center gap-1 border border-gray-200 bg-gray-100 px-3 py-1 text-gray-700"
                          >
                            <MapPin className="h-3 w-3" />
                            {location ? `${location.locationName} (${code})` : code}
                            {!isEditMode && (
                              <button
                                type="button"
                                onClick={() => handleLocationCodeRemove(code)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
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
          </form>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 rounded-b-lg border-t border-gray-200 bg-gray-50 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSubmit(handleFormSubmit as SubmitHandler<SubDepartmentFormData>)}
            disabled={isSubmitting || postLoading}
          >
            {postLoading ? "Saving..." : isEditMode ? "Update" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}