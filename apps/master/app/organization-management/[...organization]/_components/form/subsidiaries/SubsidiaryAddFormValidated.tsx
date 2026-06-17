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
import { createSubsidiarySchema } from "./subsidiary-form-schema"

interface SubsidiaryFormData {
  subsidiaryCode?: string
  subsidiaryName?: string
  subsidiaryDescription?: string
  locationCode?: string[]
}

interface SubsidiaryFormModalProps {
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

type SubsidiaryFormField = "subsidiaryCode" | "subsidiaryName" | "subsidiaryDescription" | "locationCode"

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

export default function SubsidiaryAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onAddSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: SubsidiaryFormModalProps) {
  const tenantCode = useGetTenantCode()
  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  // State for selected location codes
  const [selectedLocationCodes, setSelectedLocationCodes] = useState<string[]>([])
  const { arrayData: locationArray, refetch: refetchLocations } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "location",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  const locationOptions = useMemo(
    () =>
      (locationArray || []).map((location: any) => ({
        label: `${location.locationName} (${location.locationCode})`,
        value: location.locationCode,
      })),
    [locationArray]
  )

  const schema = useMemo(
    () => createSubsidiarySchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.subsidiaryCode) return
    handleDeleteItem(deleteValue.subsidiaryCode)
  }, [deleteValue])

  const handleDeleteItem = async (subsidiaryCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          subsidiaries: [{ subsidiaryCode }],
        },
      }
      // postSubsidiary(postData)
    } catch (error) {
      console.error("Error deleting subsidiary:", error)
    }
  }

  const resetSubsidiaryFormState = () => {
    reset()
    setSelectedLocationCodes([])
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm<SubsidiaryFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subsidiaryCode: "",
      subsidiaryName: "",
      subsidiaryDescription: "",
      locationCode: [],
    },
  })

  const { post: postSubsidiary, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, SubsidiaryFormField> = {
          subsidiaryCode: "subsidiaryCode",
          subsidiaryName: "subsidiaryName",
          subsidiaryDescription: "subsidiaryDescription",
          locationCode: "locationCode",
        }

        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return

          const normalizedField = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField, { type: "server", message })
        })
        return
      }

      if (isEditMode) {
        toast.success("Subsidiary submitted successfully!")
      } else {
        onAddSuccess?.()
      }
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      resetSubsidiaryFormState()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Subsidiary submission failed!")
      console.error("POST error:", error)
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      const normalizedLocationCodes = normalizeLocationCodes(editData.locationCode)
      setValue("subsidiaryCode", editData.subsidiaryCode || "")
      setValue("subsidiaryName", editData.subsidiaryName || "")
      setValue("subsidiaryDescription", editData.subsidiaryDescription || "")
      setSelectedLocationCodes(normalizedLocationCodes)
      setValue("locationCode", normalizedLocationCodes)
    } else if (open && !isEditMode) {
      resetSubsidiaryFormState()
    }
  }, [isEditMode, editData, setValue, reset, open])

  const handleFormSubmit = async (data: SubsidiaryFormData) => {
    try {
      clearErrors()
      const payloadSubsidiary = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
        locationCode: normalizeLocationCodes(selectedLocationCodes),
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "subsidiaryValidator",
        data: {
          subsidiaries: [payloadSubsidiary],
        },
      }
      postSubsidiary(postData)
    } catch (error) {
      console.error("Error processing subsidiary:", error)
    }
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
    resetSubsidiaryFormState()
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gray-100 p-1.5">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {isEditMode ? "Edit Subsidiary" : "Add New Subsidiary"}
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {isEditMode ? "Update subsidiary information." : "Create a new subsidiary entry."}
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
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<SubsidiaryFormData>)} className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subsidiaryCode" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Subsidiary Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subsidiaryCode"
                    {...register("subsidiaryCode")}
                    placeholder="Enter subsidiary code"
                    className={errors.subsidiaryCode?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                    disabled={isEditMode}
                  />
                  {errors.subsidiaryCode?.message && <p className="text-xs text-red-500">{errors.subsidiaryCode.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subsidiaryName" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Subsidiary Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subsidiaryName"
                    {...register("subsidiaryName")}
                    placeholder="Enter subsidiary name"
                    className={errors.subsidiaryName?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                  />
                  {errors.subsidiaryName?.message && <p className="text-xs text-red-500">{errors.subsidiaryName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subsidiaryDescription" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="subsidiaryDescription"
                  {...register("subsidiaryDescription")}
                  placeholder="Enter subsidiary description"
                  rows={3}
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900">Location Assignment</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  {locationOptions.length === 0 ? (
                    <div className="flex w-full items-center rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600">
                      No locations available
                    </div>
                  ) : (
                    <SingleSelectField
                      label="Location Codes"
                      placeholder="Select location code"
                      value=""
                      onChange={handleLocationCodeSelect}
                      options={availableLocationOptions}
                    />
                  )}
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
                            <button
                              type="button"
                              onClick={() => handleLocationCodeRemove(code)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
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
            disabled={isSubmitting || postLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSubmit(handleFormSubmit as SubmitHandler<SubsidiaryFormData>)}
            disabled={isSubmitting || postLoading}
          >
            {postLoading ? "Saving..." : isEditMode ? "Update" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
