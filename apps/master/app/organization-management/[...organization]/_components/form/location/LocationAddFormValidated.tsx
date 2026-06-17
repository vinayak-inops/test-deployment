"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin, X } from "lucide-react"
import { useEffect, useMemo } from "react"
import SingleSelectField from "@/components/fields/single-select-field"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { createLocationSchema } from "./location-form-schema"
import { Button } from "@repo/ui/components/ui/button"

interface LocationFormData {
  locationCode?: string
  locationName?: string
  regionCode?: string
  countryCode?: string | null
  stateCode?: string | null
  city?: string | null
  pinCode?: string | null
}

interface LocationFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onAddSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any // Data for editing mode
  isEditMode?: boolean // Flag to indicate edit mode
  deleteValue?: any
}

type LocationFormField = "locationCode" | "locationName" | "regionCode" | "countryCode" | "stateCode" | "city" | "pinCode"

const INPUT_CLASS = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"

export default function LocationFormModal({
  open,
  setOpen,
  onSuccess,
  onAddSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue
}: LocationFormModalProps) {
  const tenantCode = useGetTenantCode()
  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const { arrayData: regionArray, refetch: refetchRegion } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "region",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: countryArray, refetch: refetchCountry } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "country",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: stateArray, refetch: refetchState } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "state",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchRegion()
    void refetchCountry()
    void refetchState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  const regionOptions = useMemo(
    () =>
      (regionArray || []).map((region: any) => ({
        value: region.regionCode,
        label: region.regionName,
      })),
    [regionArray]
  )

  const countryOptions = useMemo(
    () =>
      (countryArray || [])
        .filter((country: any) => country.status !== "active")
        .map((country: any) => ({
          value: country.countryCode,
          label: country.countryName,
        })),
    [countryArray]
  )

  const schema = useMemo(
    () => createLocationSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
  } = useForm<LocationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      locationCode: "",
      locationName: "",
      regionCode: "",
      countryCode: null,
      stateCode: null,
      city: null,
      pinCode: null,
    },
  })

  const selectedCountryCode = watch("countryCode") || ""

  const stateOptions = useMemo(() => {
    if (!selectedCountryCode) return []
    return (stateArray || [])
      .filter((state: any) => {
        return (
          state.countryCode === selectedCountryCode ||
          state.countryCode === selectedCountryCode.substring(0, 2) ||
          selectedCountryCode.startsWith(state.countryCode)
        )
      })
      .map((state: any) => ({
        value: state.stateCode,
        label: state.region ? `${state.stateName} - ${state.region}` : state.stateName,
      }))
  }, [stateArray, selectedCountryCode])

  useEffect(() => {
    if (!deleteValue?.locationCode) return
    handleDeleteItem(deleteValue.locationCode)
  }, [deleteValue])

  const handleDeleteItem = async (locationCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          location: [{ locationCode }],
        },
      }
      // postLocation(postData)
    } catch (error) {
      console.error("Error deleting location:", error)
    }
  }

  const resetLocationFormState = () => {
    reset()
  }

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      setValue("locationCode", editData.locationCode || "")
      setValue("locationName", editData.locationName || "")
      setValue("regionCode", editData.regionCode || "")
      setValue("countryCode", editData.countryCode || "")
      setValue("stateCode", editData.stateCode || "")
      setValue("city", editData.city || "")
      setValue("pinCode", editData.pinCode || "")
    } else if (open && !isEditMode) {
      resetLocationFormState()
    }
  }, [isEditMode, editData, setValue, reset, open])

  const {
    post: postLocation,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, LocationFormField> = {
          locationCode: "locationCode",
          locationName: "locationName",
          regionCode: "regionCode",
          countryCode: "countryCode",
          stateCode: "stateCode",
          city: "city",
          pinCode: "pinCode",
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
        toast.success("Location submitted successfully!")
      } else {
        onAddSuccess?.()
      }
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      resetLocationFormState()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Location submission failed!")
      console.error("POST error:", error);
    },
  });

  const handleFormSubmit = async (data: LocationFormData) => {
    try {
      clearErrors()
      const payloadLocation = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "locationValidator",
        data: {
          location: [payloadLocation],
        }
      }
      postLocation(postData)

    } catch (error) {
      console.error("Error processing location:", error)
    }
  }

  const handleCancel = () => {
    resetLocationFormState()
    setOpen(false)
  }

  return (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<LocationFormData>)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit Location" : "Add New Location"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update location information." : "Create a new location entry."}
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
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Location Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("locationCode")}
                      placeholder="Enter location code"
                      className={`${INPUT_CLASS} ${errors.locationCode ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.locationCode && (
                      <p className="text-xs text-red-500">{errors.locationCode.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Location Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("locationName")}
                      placeholder="Enter location name"
                      className={`${INPUT_CLASS} ${errors.locationName ? "border-red-500" : ""}`}
                    />
                    {errors.locationName && (
                      <p className="text-xs text-red-500">{errors.locationName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SingleSelectField
                    label="Region Code"
                    required
                    placeholder="Select Region Code"
                    value={watch("regionCode") || ""}
                    onChange={(value) => setValue("regionCode", value, { shouldValidate: true })}
                    options={regionOptions}
                    errorMessage={typeof errors.regionCode?.message === "string" ? errors.regionCode.message : undefined}
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Address Information</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Assign region and address details for the location.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SingleSelectField
                    label="Country"
                    placeholder="Select Country"
                    value={selectedCountryCode}
                    onChange={(value) => {
                      setValue("countryCode", value, { shouldValidate: true })
                      setValue("stateCode", "", { shouldValidate: true })
                    }}
                    options={countryOptions}
                    errorMessage={typeof errors.countryCode?.message === "string" ? errors.countryCode.message : undefined}
                  />

                  <SingleSelectField
                    label="State"
                    placeholder={selectedCountryCode ? "Select State" : "Please select a country first"}
                    disabled={!selectedCountryCode}
                    value={watch("stateCode") || ""}
                    onChange={(value) => setValue("stateCode", value, { shouldValidate: true })}
                    options={stateOptions}
                    errorMessage={typeof errors.stateCode?.message === "string" ? errors.stateCode.message : undefined}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      City
                    </label>
                    <input
                      value={watch("city") || ""}
                      onChange={(e) => setValue("city", e.target.value)}
                      placeholder="Enter city"
                      className={`${INPUT_CLASS} ${errors.city ? "border-red-500" : ""}`}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-500">{errors.city.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      ZIP Code
                    </label>
                    <input
                      value={watch("pinCode") || ""}
                      onChange={(e) => setValue("pinCode", e.target.value)}
                      placeholder="Enter ZIP code"
                      className={`${INPUT_CLASS} ${errors.pinCode ? "border-red-500" : ""}`}
                    />
                    {errors.pinCode && (
                      <p className="text-xs text-red-500">{errors.pinCode.message}</p>
                    )}
                  </div>
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting || postLoading}
              >
                {postLoading ? "Processing..." : isEditMode ? "Update Location" : "Add Location"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    ) : null
  )
}
