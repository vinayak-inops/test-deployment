"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, MapPin, X } from "lucide-react"
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
import { createDepartmentSchema } from "./department-form-schema"

interface DepartmentFormData {
  departmentCode?: string
  departmentName?: string
  departmentDescription?: string
  subsidiaryCode: string // required
  divisionCode: string   // required
  locationCode?: string[]
}

interface DepartmentFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onAddSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type DepartmentFormField =
  | "departmentCode"
  | "departmentName"
  | "departmentDescription"
  | "subsidiaryCode"
  | "divisionCode"
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

export default function DepartmentAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onAddSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: DepartmentFormModalProps) {
  const tenantCode = useGetTenantCode()
  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )
  
  // State for selected values
  const [selectedLocationCodes, setSelectedLocationCodes] = useState<string[]>([])
  const [selectedSubsidiaryCode, setSelectedSubsidiaryCode] = useState<string>("")  
  const [selectedDivisionCode, setSelectedDivisionCode] = useState<string>("")
  
  // Track if user has manually changed values to prevent effects from overriding
  const [userHasChangedSubsidiary, setUserHasChangedSubsidiary] = useState(false)
  const [userHasChangedDivision, setUserHasChangedDivision] = useState(false)

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
    void refetchLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])
  
  const subsidiaryOptions = useMemo(
    () =>
      (subsidiariesArray || []).map((subsidiary: any) => ({
        label: `${subsidiary.subsidiaryName} (${subsidiary.subsidiaryCode})`,
        value: subsidiary.subsidiaryCode,
      })),
    [subsidiariesArray]
  )
  
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
  
  // Get filtered location options based on selected division
  const getFilteredLocationOptions = () => {
    if (!selectedDivisionCode) return []
    
    const selectedDivision = (divisionsArray || []).find((div: any) => div.divisionCode === selectedDivisionCode)
    if (!selectedDivision || !selectedDivision.locationCode) return []
    
    const divisionLocationCodes = Array.isArray(selectedDivision.locationCode) 
      ? selectedDivision.locationCode 
      : [selectedDivision.locationCode]
    
    return (locationArray || [])
      .filter((location: any) => divisionLocationCodes.includes(location.locationCode))
      .map((location: any) => ({
        label: `${location.locationName} (${location.locationCode})`,
        value: location.locationCode
      }))
  }
  
  const divisionOptions = useMemo(() => getFilteredDivisionOptions(), [divisionsArray, selectedSubsidiaryCode])
  const locationOptions = useMemo(() => getFilteredLocationOptions(), [divisionsArray, locationArray, selectedDivisionCode])

  const schema = useMemo(
    () => createDepartmentSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.departmentCode) return
    handleDeleteItem(deleteValue.departmentCode)
  }, [deleteValue])

  const handleDeleteItem = async (departmentCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          departments: [{ departmentCode }],
        },
      }
      // postDepartment(postData)

    } catch (error) {
      console.error("Error deleting department:", error)
    }
  }

  const resetDepartmentFormState = () => {
    reset()
    setSelectedLocationCodes([])
    setSelectedSubsidiaryCode("")
    setSelectedDivisionCode("")
    setUserHasChangedSubsidiary(false)
    setUserHasChangedDivision(false)
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      departmentCode: "",
      departmentName: "",
      departmentDescription: "",
      subsidiaryCode: "", // ensure string, not undefined
      divisionCode: "",   // ensure string, not undefined
      locationCode: [],
    },
  })

  const { post: postDepartment, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, DepartmentFormField> = {
          departmentCode: "departmentCode",
          departmentName: "departmentName",
          departmentDescription: "departmentDescription",
          subsidiaryCode: "subsidiaryCode",
          divisionCode: "divisionCode",
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

      if (isEditMode) {
        toast.success("Department submitted successfully!")
      } else {
        onAddSuccess?.()
      }
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      resetDepartmentFormState()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Department submission failed!")
      console.error("POST error:", error)
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      const normalizedLocationCodes = normalizeLocationCodes(editData.locationCode)
      setValue("departmentCode", editData.departmentCode || "")
      setValue("departmentName", editData.departmentName || "")
      setValue("departmentDescription", editData.departmentDescription || "")
      setValue("subsidiaryCode", editData.subsidiaryCode || "")
      setSelectedSubsidiaryCode(editData.subsidiaryCode || "")
      setSelectedDivisionCode(editData.divisionCode || "")
      setSelectedLocationCodes(normalizedLocationCodes)
      setValue("locationCode", normalizedLocationCodes)
      
      // Reset user change flags when loading edit data
      setUserHasChangedSubsidiary(false)
      setUserHasChangedDivision(false)
    } else if (open && !isEditMode) {
      resetDepartmentFormState()
    }
  }, [isEditMode, editData, setValue, reset, open])

  // Progressive sync for dependent selects to avoid layout jumps
  useEffect(() => {
    if (isEditMode && editData) {
      setSelectedSubsidiaryCode(editData.subsidiaryCode || "");
      setValue("subsidiaryCode", editData.subsidiaryCode || "");
    }
  }, [isEditMode, editData, setValue])

  useEffect(() => {
    // Only set division if user hasn't manually changed subsidiary
    if (isEditMode && editData && selectedSubsidiaryCode && !userHasChangedSubsidiary) {
      setSelectedDivisionCode(editData.divisionCode || "");
      setValue("divisionCode", editData.divisionCode || "");
    }
  }, [isEditMode, editData, selectedSubsidiaryCode, setValue, userHasChangedSubsidiary])

  useEffect(() => {
    // Only set location if user hasn't manually changed division
    if (isEditMode && editData && selectedDivisionCode && !userHasChangedDivision) {
      const normalizedLocationCodes = normalizeLocationCodes(editData.locationCode)
      setSelectedLocationCodes(normalizedLocationCodes)
      setValue("locationCode", normalizedLocationCodes)
    }
  }, [isEditMode, editData, selectedDivisionCode, setValue, userHasChangedDivision])

  const handleFormSubmit = async (data: DepartmentFormData) => {
    try {
      clearErrors()
      const payloadDepartment = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
        subsidiaryCode: selectedSubsidiaryCode,
        divisionCode: selectedDivisionCode,
        locationCode: normalizeLocationCodes(selectedLocationCodes),
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "departmentValidator",
        data: {
          departments: [payloadDepartment],
        },
      }
      postDepartment(postData)
    } catch (error) {
      console.error("Error processing department:", error)
    }
  }

  // Handle subsidiary selection
  const handleSubsidiarySelect = (subsidiaryCode: string) => {
    setSelectedSubsidiaryCode(subsidiaryCode)
    setValue("subsidiaryCode", subsidiaryCode)
    
    // Mark that user has changed subsidiary
    setUserHasChangedSubsidiary(true)
    
    // Clear division and location codes when subsidiary changes
    setSelectedDivisionCode("")
    setValue("divisionCode", "")
    setSelectedLocationCodes([])
    setValue("locationCode", [])
    
    // Reset division change flag since we're clearing it
    setUserHasChangedDivision(false)
  }

  // Handle division selection
  const handleDivisionSelect = (divisionCode: string) => {
    setSelectedDivisionCode(divisionCode)
    setValue("divisionCode", divisionCode)
    
    // Mark that user has changed division
    setUserHasChangedDivision(true)
    
    // Clear location codes when division changes
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
    resetDepartmentFormState()
    setOpen(false)
  }

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<DepartmentFormData>)} className="w-full h-full flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {isEditMode ? "Edit Department" : "Add New Department"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {isEditMode ? "Update department information." : "Create a new department entry."}
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
                  <Label htmlFor="departmentCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Department Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="departmentCode"
                    {...register("departmentCode")}
                    placeholder="Enter department code"
                    className={`${INPUT_CLASS} ${errors.departmentCode?.message ? "border-red-500" : ""}`}
                    disabled={isEditMode}
                  />
                  {errors.departmentCode?.message && <p className="text-xs text-red-500">{errors.departmentCode.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departmentName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Department Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="departmentName"
                    {...register("departmentName")}
                    placeholder="Enter department name"
                    className={`${INPUT_CLASS} ${errors.departmentName?.message ? "border-red-500" : ""}`}
                  />
                  {errors.departmentName?.message && <p className="text-xs text-red-500">{errors.departmentName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="departmentDescription" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Description
                </Label>
                <Textarea
                  id="departmentDescription"
                  {...register("departmentDescription")}
                  placeholder="Enter department description"
                  rows={3}
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Parent Hierarchy</h4>
                <p className="text-xs text-gray-500 mt-0.5">Map the department under its parent structure.</p>
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
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Location Assignment</h4>
                <p className="text-xs text-gray-500 mt-0.5">Assign one or more locations to this department.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <SingleSelectField
                    label="Location Codes"
                    placeholder={selectedDivisionCode ? "Select location code" : "First select a division"}
                    disabled={!selectedDivisionCode || isEditMode}
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
              disabled={isSubmitting || postLoading}
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
}