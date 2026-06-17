"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin, X, GitBranch } from "lucide-react"
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
import { createDivisionSchema } from "./division-form-schema"

interface DivisionFormData {
  divisionCode?: string
  divisionName?: string
  divisionDescription?: string
  subsidiaryCode: string // required
  locationCode?: string[]
}

interface DivisionFormModalProps {
  open: boolean
  setOpen: any
  organizationData?: any
  onSuccess?: () => void
  onAddSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type DivisionFormField =
  | "divisionCode"
  | "divisionName"
  | "divisionDescription"
  | "subsidiaryCode"
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

export default function DivisionAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onAddSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: DivisionFormModalProps) {
  const tenantCode = useGetTenantCode()
  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )
  
  // State for selected location codes and subsidiary
  const [selectedLocationCodes, setSelectedLocationCodes] = useState<string[]>([])
  const [selectedSubsidiaryCode, setSelectedSubsidiaryCode] = useState<string>("")

  const { arrayData: subsidiariesArray, refetch: refetchSubsidiaries } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subsidiaries",
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
  
  // Get filtered location options based on selected subsidiary
  const getFilteredLocationOptions = () => {
    if (!selectedSubsidiaryCode) return []
    
    const selectedSubsidiary = (subsidiariesArray || []).find((sub: any) => sub.subsidiaryCode === selectedSubsidiaryCode)
    if (!selectedSubsidiary || !selectedSubsidiary.locationCode) return []
    
    const subsidiaryLocationCodes = Array.isArray(selectedSubsidiary.locationCode) 
      ? selectedSubsidiary.locationCode 
      : [selectedSubsidiary.locationCode]
    
    return (locationArray || [])
      .filter((location: any) => subsidiaryLocationCodes.includes(location.locationCode))
      .map((location: any) => ({
        label: `${location.locationName} (${location.locationCode})`,
        value: location.locationCode
      }))
  }
  
  const locationOptions = useMemo(
    () => getFilteredLocationOptions(),
    [subsidiariesArray, locationArray, selectedSubsidiaryCode]
  )

  const schema = useMemo(
    () => createDivisionSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.divisionCode) return
    handleDeleteItem(deleteValue.divisionCode)
  }, [deleteValue])

  const handleDeleteItem = async (divisionCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          divisions: [{ divisionCode }],
        },
      }
      // postDivision(postData)

    } catch (error) {
      console.error("Error deleting division:", error)
    }
  }

  const resetDivisionFormState = () => {
    reset()
    setSelectedLocationCodes([])
    setSelectedSubsidiaryCode("")
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm<DivisionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      divisionCode: "",
      divisionName: "",
      divisionDescription: "",
      subsidiaryCode: "",
      locationCode: [],
    },
  })

  const { post: postDivision, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, DivisionFormField> = {
          divisionCode: "divisionCode",
          divisionName: "divisionName",
          divisionDescription: "divisionDescription",
          subsidiaryCode: "subsidiaryCode",
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
        toast.success("Division submitted successfully!")
      } else {
        onAddSuccess?.()
      }
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      resetDivisionFormState()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Division submission failed!")
      console.error("POST error:", error)
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      const normalizedLocationCodes = normalizeLocationCodes(editData.locationCode)
      setValue("divisionCode", editData.divisionCode || "")
      setValue("divisionName", editData.divisionName || "")
      setValue("divisionDescription", editData.divisionDescription || "")
      setValue("subsidiaryCode", editData.subsidiaryCode || "")
      setSelectedSubsidiaryCode(editData.subsidiaryCode || "")
      setSelectedLocationCodes(normalizedLocationCodes)
      setValue("locationCode", normalizedLocationCodes)
    } else if (open && !isEditMode) {
      resetDivisionFormState()
    }
  }, [isEditMode, editData, setValue, reset, open])

  const handleFormSubmit = async (data: DivisionFormData) => {
    try {
      clearErrors()
      const payloadDivision = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
        subsidiaryCode: selectedSubsidiaryCode,
        locationCode: normalizeLocationCodes(selectedLocationCodes),
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "divisionValidator",
        data: {
          divisions: [payloadDivision],
        },
      }
      postDivision(postData)
    } catch (error) {
      console.error("Error processing division:", error)
    }
  }

  // Handle subsidiary selection
  const handleSubsidiarySelect = (subsidiaryCode: string) => {
    setSelectedSubsidiaryCode(subsidiaryCode)
    setValue("subsidiaryCode", subsidiaryCode)
    // Clear location codes when subsidiary changes
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
    resetDivisionFormState()
    setOpen(false)
  }

  return (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<DivisionFormData>)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <GitBranch className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit Division" : "Add New Division"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update division information." : "Create a new division entry."}
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
                    <Label htmlFor="divisionCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Division Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="divisionCode"
                      {...register("divisionCode")}
                      placeholder="Enter division code"
                      className={`${INPUT_CLASS} ${errors.divisionCode?.message ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.divisionCode?.message && <p className="text-xs text-red-500">{errors.divisionCode.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="divisionName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Division Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="divisionName"
                      {...register("divisionName")}
                      placeholder="Enter division name"
                      className={`${INPUT_CLASS} ${errors.divisionName?.message ? "border-red-500" : ""}`}
                    />
                    {errors.divisionName?.message && <p className="text-xs text-red-500">{errors.divisionName.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="divisionDescription" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Description
                  </Label>
                  <Textarea
                    id="divisionDescription"
                    {...register("divisionDescription")}
                    placeholder="Enter division description"
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Subsidiary Assignment</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Assign this division to a subsidiary.</p>
                </div>

                <div className="space-y-2">
                  {subsidiaryOptions.length === 0 ? (
                    <div className="w-full px-3 py-2 rounded-md border border-red-300 bg-red-50 text-sm text-red-600">
                      No subsidiaries available
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Location Assignment</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Assign one or more locations to this division.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    {!selectedSubsidiaryCode ? (
                      <div className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 text-sm text-gray-500">
                        First select a subsidiary
                      </div>
                    ) : locationOptions.length === 0 ? (
                      <div className="w-full px-3 py-2 rounded-md border border-red-300 bg-red-50 text-sm text-red-600">
                        No locations available for selected subsidiary
                      </div>
                    ) : (
                      <SingleSelectField
                        label="Location Codes"
                        placeholder="Select location code"
                        value=""
                        onChange={handleLocationCodeSelect}
                        options={availableLocationOptions}
                        disabled={isEditMode}
                      />
                    )}
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
  )
}