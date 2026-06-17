"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin, AlertCircle, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { createStateSchema } from "./state-form-schema"
import { toast } from "react-toastify"
import SingleSelectField from "@/components/fields/single-select-field"

interface StateFormData {
  countryCode: string
  countryName: string
  stateCode: string
  stateName: string
}

interface StateFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type StateFormField = "countryCode" | "countryName" | "stateCode" | "stateName"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"

export default function StateAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: StateFormModalProps) {
  const tenantCode = useGetTenantCode()
  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )
  const schema = useMemo(
    () => createStateSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  const { arrayData: countryArray, refetch: refetchCountries } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "country",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchCountries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  const countryOptions = useMemo(
    () =>
      (countryArray || []).map((country: any) => ({
        label: `${country.countryName} (${country.countryCode})`,
        value: country.countryCode,
        name: country.countryName,
      })),
    [countryArray]
  )

  useEffect(() => {
    if (!deleteValue?.stateCode) return
    handleDeleteItem(deleteValue.stateCode)
  }, [deleteValue])

  const handleDeleteItem = async (stateCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "stateValidator",
        data: {
          state: [{ stateCode }],
        },
      }
      // postState(postData)
    } catch (error) {
      console.error("Error deleting state:", error)
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
    watch,
  } = useForm<StateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      countryCode: "",
      countryName: "",
      stateCode: "",
      stateName: "",
    },
  })

  const { post: postState, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, StateFormField> = {
          countryCode: "countryCode",
          countryName: "countryName",
          stateCode: "stateCode",
          stateName: "stateName",
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

      toast.success("State submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("State submission failed!")
      console.error("POST error:", error)
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      setValue("countryCode", editData.countryCode || "")
      setValue("countryName", editData.countryName || "")
      setValue("stateCode", editData.stateCode || "")
      setValue("stateName", editData.stateName || "")
    } else if (open && !isEditMode) {
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  // Handle country selection
  const handleCountrySelect = (value: string) => {
    const selectedCountry = countryOptions.find((country: any) => country.value === value)
    setValue("countryCode", value, { shouldValidate: true })
    setValue("countryName", selectedCountry?.name || "", { shouldValidate: true })
  }

  const handleFormSubmit = async (data: StateFormData) => {
    try {
      clearErrors()
      const payloadState = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "stateValidator",
        data: {
          state: [payloadState],
        },
      }
      postState(postData)
    } catch (error) {
      console.error("Error processing state:", error)
    }
  }

  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  return (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<StateFormData>)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit State" : "Add New State"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update state information." : "Create a new state entry."}
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
                  <div className="space-y-2 bg-white p-0 rounded-lg">
                    {countryOptions.length === 0 ? (
                      <div className="w-full px-3 py-2 rounded-md border border-red-300 bg-red-50 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Please add Country Code in proper way
                      </div>
                    ) : (
                      <SingleSelectField
                        id="countryCode"
                        label="Country Code"
                        required
                        placeholder="Select Country Code"
                        value={watch("countryCode") || ""}
                        onChange={handleCountrySelect}
                        options={countryOptions}
                        errorMessage={typeof errors.countryCode?.message === "string" ? errors.countryCode.message : undefined}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="countryName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Country Name
                    </Label>
                    <Input
                      id="countryName"
                      value={watch("countryName") || ""}
                      placeholder="Auto-populated from country selection"
                      className={`${INPUT_CLASS} bg-gray-50`}
                      readOnly
                    />
                    {errors.countryName?.message && <p className="text-xs text-red-500">{errors.countryName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stateCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      State Code
                    </Label>
                    <Input
                      id="stateCode"
                      {...register("stateCode")}
                      placeholder="Enter state code (e.g., OR)"
                      className={`${INPUT_CLASS} ${errors.stateCode?.message ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.stateCode?.message && <p className="text-xs text-red-500">{errors.stateCode.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stateName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      State Name
                    </Label>
                    <Input
                      id="stateName"
                      {...register("stateName")}
                      placeholder="Enter state name (e.g., Odisha)"
                      className={`${INPUT_CLASS} ${errors.stateName?.message ? "border-red-500" : ""}`}
                    />
                    {errors.stateName?.message && <p className="text-xs text-red-500">{errors.stateName.message}</p>}
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
