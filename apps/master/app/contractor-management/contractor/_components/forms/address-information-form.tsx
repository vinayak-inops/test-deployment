"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Copy, X } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"
import { GradientFormHeader } from "../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"
import { FormActionsFooter } from "../../../../../components/footer/form-actions-footer"
import { useDynamicSchemaConfig } from "../hooks/useDynamicSchemaConfig"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import {
  createAddressInformationSchema,
  normalizeAddressConfig,
  EMPTY_ADDRESS_INFORMATION,
  type AddressFieldKey,
  type AddressFieldsConfig,
  type AddressInformationTabConfig,
  type AddressInformationFormData,
} from "../schemas/address-information-form-schema"

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

const formatPincode = (value: string) => value.replace(/\D/g, "").substring(0, 6)
const formatPhoneNumber = (value: string) => value.replace(/\D/g, "").substring(0, 10)

interface AddressInformationFormProps {
  employeeRecordId?: string | null
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  onSaved?: () => void
}

export function AddressInformationForm({
  employeeRecordId = null,
  onNextTab: _onNextTab,
  onPreviousTab,
  mode = "add",
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  onSaved,
}: AddressInformationFormProps) {
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contractor_form_strcture",
  })

  const addressInformationTabConfig = useMemo(
    () =>
      normalizeAddressConfig(
        formStructure?.addressInformation as
          | AddressFieldsConfig
          | AddressInformationTabConfig
          | undefined
      ),
    [formStructure]
  )

  const addressInformationSchemaDef = useMemo(
    () => createAddressInformationSchema(addressInformationTabConfig),
    [addressInformationTabConfig]
  )
  const defaultRequiredConfig: Partial<Record<AddressFieldKey, boolean>> = {
    localAddressLine1: true,
    localCountry: true,
    localState: true,
    localCity: true,
    corporateAddressLine1: true,
    corporateCountry: true,
    corporateState: true,
    corporateCity: true,
  }

  const { schema: addressInformationSchema, emptyValues, isRequired, isVisible, getLabel } = useDynamicSchemaConfig({
    schema: addressInformationSchemaDef,
    fieldConfig: addressInformationTabConfig,
    emptyValues: EMPTY_ADDRESS_INFORMATION,
    defaultRequired: defaultRequiredConfig,
  })
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()
  const idFromUrl = searchParams.get("id")
  const resolvedEmployeeRecordId = employeeRecordId || idFromUrl
  const isViewMode = mode === "view"

  const [showErrors, setShowErrors] = useState(false)
  const [copyLocalToCorporate, setCopyLocalToCorporate] = useState(false)
  const showLocalSection =
    isVisible("localAddressLine1") ||
    isVisible("localAddressLine2") ||
    isVisible("localCountry") ||
    isVisible("localState") ||
    isVisible("localCity") ||
    isVisible("localDistrict") ||
    isVisible("localPincode") ||
    isVisible("localContactNumber")
  const showCorporateSection =
    isVisible("corporateAddressLine1") ||
    isVisible("corporateAddressLine2") ||
    isVisible("corporateCountry") ||
    isVisible("corporateState") ||
    isVisible("corporateCity") ||
    isVisible("corporateDistrict") ||
    isVisible("corporatePincode") ||
    isVisible("corporateContactNumber")

  const {
    register,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    trigger,
    formState: { errors, isValid },
  } = useForm<AddressInformationFormData>({
    resolver: zodResolver(addressInformationSchema),
    defaultValues: emptyValues,
    mode: "onChange",
  })

  const watchedValues = watch()
  const localAddress = watchedValues.address?.local
  const corporateAddress = watchedValues.address?.corporate
  const shouldShowConfigLoader = formStructureLoading || !formStructure

  const { refetch: fetchContractor } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: resolvedEmployeeRecordId, operator: "eq" }],
    onSuccess: (data) => {
      if (!Array.isArray(data) || !data[0] || data[0].isDeleted === true) return
      const row = data[0]
      if (row.address) {
        reset({
          address: {
            local: {
              addressLine1: row.address.local?.addressLine1 || "",
              addressLine2: row.address.local?.addressLine2 || "",
              country: row.address.local?.country || "",
              state: row.address.local?.state || "",
              city: row.address.local?.city || "",
              district: row.address.local?.district || "",
              pincode: row.address.local?.pincode || "",
              contactNumber: row.address.local?.contactNumber || "",
            },
            corporate: {
              addressLine1: row.address.corporate?.addressLine1 || "",
              addressLine2: row.address.corporate?.addressLine2 || "",
              country: row.address.corporate?.country || "",
              state: row.address.corporate?.state || "",
              city: row.address.corporate?.city || "",
              district: row.address.corporate?.district || "",
              pincode: row.address.corporate?.pincode || "",
              contactNumber: row.address.corporate?.contactNumber || "",
            },
          },
        })
        return
      }
      reset({
        address: {
          local: {
            addressLine1: row.localAddressLine1 || "",
            addressLine2: row.localAddressLine2 || "",
            country: row.localCountry || "",
            state: row.localState || "",
            city: row.localCity || "",
            district: row.localDistrict || "",
            pincode: row.localPincode || "",
            contactNumber: row.localContactNumber || "",
          },
          corporate: {
            addressLine1: row.corporateAddressLine1 || "",
            addressLine2: row.corporateAddressLine2 || "",
            country: row.corporateCountry || "",
            state: row.corporateState || "",
            city: row.corporateCity || "",
            district: row.corporateDistrict || "",
            pincode: row.corporatePincode || "",
            contactNumber: row.corporateContactNumber || "",
          },
        },
      })
    },
    onError: (error) => {
      console.error("Error fetching contractor address:", error)
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  })

  const { post: postContractorAddress, loading: postLoading } = usePostRequest<any>({
    url: contractorCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const normalizeServerField = (fieldName: string) => {
          if (fieldName.startsWith("address.local.") || fieldName.startsWith("address.corporate.")) {
            return fieldName
          }

          const fieldMap: Record<string, string> = {
            localAddressLine1: "address.local.addressLine1",
            localAddressLine2: "address.local.addressLine2",
            localCountry: "address.local.country",
            localState: "address.local.state",
            localCity: "address.local.city",
            localDistrict: "address.local.district",
            localPincode: "address.local.pincode",
            localContactNumber: "address.local.contactNumber",
            corporateAddressLine1: "address.corporate.addressLine1",
            corporateAddressLine2: "address.corporate.addressLine2",
            corporateCountry: "address.corporate.country",
            corporateState: "address.corporate.state",
            corporateCity: "address.corporate.city",
            corporateDistrict: "address.corporate.district",
            corporatePincode: "address.corporate.pincode",
            corporateContactNumber: "address.corporate.contactNumber",
          }

          return fieldMap[fieldName] || fieldName
        }

        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
            if (typeof message !== "string" || !message.trim()) return

            setError(normalizeServerField(fieldName) as any, {
              type: "server",
              message,
            })
          })
        }
        return
      }

      toast.success("Contractor address saved successfully!")
      if (resolvedEmployeeRecordId && mode !== "add") {
        void fetchContractor()
      }
      onSaved?.()
    },
    onError: (error) => {
      console.error("Error saving contractor address:", error)
    },
  })

  useEffect(() => {
    if (!resolvedEmployeeRecordId || mode === "add") {
      reset(emptyValues)
      return
    }
    void fetchContractor()
  }, [resolvedEmployeeRecordId, mode, employeeSearchUrl])

  useEffect(() => {
    if (!copyLocalToCorporate) return
    const localValues = watchedValues.address.local
    setValue("address.corporate.addressLine1", localValues.addressLine1)
    setValue("address.corporate.addressLine2", localValues.addressLine2 || "")
    setValue("address.corporate.country", localValues.country)
    setValue("address.corporate.state", localValues.state)
    setValue("address.corporate.city", localValues.city)
    setValue("address.corporate.district", localValues.district || "")
    setValue("address.corporate.pincode", localValues.pincode || "")
    setValue("address.corporate.contactNumber", localValues.contactNumber || "")
  }, [copyLocalToCorporate, watchedValues.address.local, setValue])

  const handleAddressChange = async (
    addressType: "local" | "corporate",
    field: string,
    value: any
  ) => {
    setValue(`address.${addressType}.${field}` as any, value)
    await trigger(`address.${addressType}.${field}` as any)
  }

  const handleSave = async () => {
    if (shouldShowConfigLoader) return
    setShowErrors(true)
    clearErrors()
    const valid = await trigger()
    if (!valid) return

    const watched = watch()
    const values = {
      address: {
        local: {
          ...emptyValues.address.local,
          ...(watched.address?.local ?? {}),
        },
        corporate: {
          ...emptyValues.address.corporate,
          ...(watched.address?.corporate ?? {}),
        },
      },
    }
    const payload = {
      tenant: tenantCode,
      action: mode === "edit" && Boolean(resolvedEmployeeRecordId) ? "update" : "insert",
      ...(mode === "edit" && resolvedEmployeeRecordId ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "contractor",
      ruleId: "",
      data: {
        address: {
          local: {
            addressLine1: values.address.local.addressLine1 || "",
            addressLine2: values.address.local.addressLine2 || "",
            country: values.address.local.country || "",
            state: values.address.local.state || "",
            city: values.address.local.city || "",
            district: values.address.local.district || "",
            pincode: values.address.local.pincode || "",
            contactNumber: values.address.local.contactNumber || "",
          },
          corporate: {
            addressLine1: values.address.corporate.addressLine1 || "",
            addressLine2: values.address.corporate.addressLine2 || "",
            country: values.address.corporate.country || "",
            state: values.address.corporate.state || "",
            city: values.address.corporate.city || "",
            district: values.address.corporate.district || "",
            pincode: values.address.corporate.pincode || "",
            contactNumber: values.address.corporate.contactNumber || "",
          },
        },
        ...(employeeSearchUrl === "draft/contractor/search"
          ? { addressInformationtab: true }
          : {}),
      },
    }
    postContractorAddress?.(payload)
  }

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      <GradientFormHeader
        icon={MapPin}
        title="Address Information"
        description="Local and corporate address details"
      />

      <CardContent className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
        {shouldShowConfigLoader ? (
          <div className="py-12 text-center text-sm text-gray-600">
            Loading form configuration...
          </div>
        ) : (
          <>
        {showErrors && Object.keys(errors).length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix highlighted fields before continuing.
          </div>
        )}

        {showLocalSection && (
        <div className="space-y-4">
          <SubFormTitle title="Local Address" className="mb-2" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {isVisible("localAddressLine1") && (
            <div className="col-span-6 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("localAddressLine1", "Address Line 1")} {isRequired("localAddressLine1") && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                value={localAddress?.addressLine1 || ""}
                onChange={(e) => void handleAddressChange("local", "addressLine1", e.target.value)}
                disabled={isViewMode}
                className={`min-h-[56px] border rounded-md px-3 py-2 text-sm resize-none ${
                  isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                } ${
                  showErrors && errors.address?.local?.addressLine1
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-gray-900"
                }`}
                placeholder="Enter address line 1"
                rows={2}
              />
              {showErrors && errors.address?.local?.addressLine1 && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.local.addressLine1.message}
                </p>
              )}
            </div>
            )}

            {isVisible("localAddressLine2") && (
            <div className="col-span-6 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("localAddressLine2", "Address Line 2")}
              </Label>
              <Textarea
                value={localAddress?.addressLine2 || ""}
                onChange={(e) => void handleAddressChange("local", "addressLine2", e.target.value)}
                disabled={isViewMode}
                className={`min-h-[56px] border rounded-md px-3 py-2 text-sm resize-none ${
                  isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                } border-gray-300 focus:border-gray-900`}
                placeholder="Enter address line 2"
                rows={2}
              />
              {showErrors && errors.address?.local?.addressLine2 && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.local.addressLine2.message}
                </p>
              )}
            </div>
            )}

            {isVisible("localCountry") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("localCountry", "Country")} {isRequired("localCountry") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("address.local.country")}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                  showErrors && errors.address?.local?.country ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder="Enter country"
              />
              {showErrors && errors.address?.local?.country && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.local.country.message}
                </p>
              )}
            </div>
            )}

            {isVisible("localState") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("localState", "State")} {isRequired("localState") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("address.local.state")}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                  showErrors && errors.address?.local?.state ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder="Enter state"
              />
              {showErrors && errors.address?.local?.state && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.local.state.message}
                </p>
              )}
            </div>
            )}

            {isVisible("localCity") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("localCity", "City")} {isRequired("localCity") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("address.local.city")}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                  showErrors && errors.address?.local?.city ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder="Enter city"
              />
              {showErrors && errors.address?.local?.city && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.local.city.message}
                </p>
              )}
            </div>
            )}

            {isVisible("localDistrict") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("localDistrict", "District")}</Label>
              <Input
                {...register("address.local.district")}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Enter district"
              />
              {showErrors && errors.address?.local?.district && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.local.district.message}
                </p>
              )}
            </div>
            )}

            {isVisible("localPincode") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("localPincode", "Pincode")}</Label>
              <Input
                value={localAddress?.pincode || ""}
                onChange={(e) => void handleAddressChange("local", "pincode", formatPincode(e.target.value))}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                  showErrors && errors.address?.local?.pincode ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder="Enter 6-digit pincode"
                maxLength={6}
              />
              {showErrors && errors.address?.local?.pincode && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.local.pincode.message}
                </p>
              )}
            </div>
            )}

            {isVisible("localContactNumber") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("localContactNumber", "Contact Number")}</Label>
              <Input
                value={localAddress?.contactNumber || ""}
                onChange={(e) =>
                  void handleAddressChange("local", "contactNumber", formatPhoneNumber(e.target.value))
                }
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                  showErrors && errors.address?.local?.contactNumber ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder="Enter 10-digit number"
                maxLength={10}
              />
              {showErrors && errors.address?.local?.contactNumber && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.local.contactNumber.message}
                </p>
              )}
            </div>
            )}
          </div>
        </div>
        )}

        {showLocalSection && showCorporateSection && <Separator className="my-2" />}

        {showCorporateSection && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <SubFormTitle title="Corporate Address" className="mb-2" />
            {!isViewMode && showLocalSection && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="copyLocalToCorporate"
                  checked={copyLocalToCorporate}
                  onCheckedChange={(checked) => {
                    const next = checked as boolean
                    setCopyLocalToCorporate(next)
                    if (next) return
                    setValue("address.corporate.addressLine1", "")
                    setValue("address.corporate.addressLine2", "")
                    setValue("address.corporate.country", "")
                    setValue("address.corporate.state", "")
                    setValue("address.corporate.city", "")
                    setValue("address.corporate.district", "")
                    setValue("address.corporate.pincode", "")
                    setValue("address.corporate.contactNumber", "")
                  }}
                />
                <Label htmlFor="copyLocalToCorporate" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
                  <Copy className="h-4 w-4 text-blue-600" />
                  Is Local Address same as Corporate Address?
                </Label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {isVisible("corporateAddressLine1") && (
            <div className="col-span-6 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("corporateAddressLine1", "Address Line 1")} {isRequired("corporateAddressLine1") && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                value={corporateAddress?.addressLine1 || ""}
                onChange={(e) => void handleAddressChange("corporate", "addressLine1", e.target.value)}
                disabled={isViewMode || copyLocalToCorporate}
                className={`min-h-[56px] border rounded-md px-3 py-2 text-sm resize-none ${
                  isViewMode || copyLocalToCorporate ? "bg-gray-100 cursor-not-allowed" : ""
                } ${
                  showErrors && errors.address?.corporate?.addressLine1
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-gray-900"
                }`}
                placeholder="Enter address line 1"
                rows={2}
              />
              {showErrors && errors.address?.corporate?.addressLine1 && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.corporate.addressLine1.message}
                </p>
              )}
            </div>
            )}

            {isVisible("corporateAddressLine2") && (
            <div className="col-span-6 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("corporateAddressLine2", "Address Line 2")}
              </Label>
              <Textarea
                value={corporateAddress?.addressLine2 || ""}
                onChange={(e) => void handleAddressChange("corporate", "addressLine2", e.target.value)}
                disabled={isViewMode || copyLocalToCorporate}
                className={`min-h-[56px] border rounded-md px-3 py-2 text-sm resize-none ${
                  isViewMode || copyLocalToCorporate ? "bg-gray-100 cursor-not-allowed" : ""
                } border-gray-300 focus:border-gray-900`}
                placeholder="Enter address line 2"
                rows={2}
              />
              {showErrors && errors.address?.corporate?.addressLine2 && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.corporate.addressLine2.message}
                </p>
              )}
            </div>
            )}

            {isVisible("corporateCountry") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("corporateCountry", "Country")} {isRequired("corporateCountry") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("address.corporate.country")}
                disabled={isViewMode || copyLocalToCorporate}
                className={`${INPUT_CLASS} ${isViewMode || copyLocalToCorporate ? "bg-gray-100 cursor-not-allowed" : ""} ${
                  showErrors && errors.address?.corporate?.country ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder="Enter country"
              />
              {showErrors && errors.address?.corporate?.country && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.corporate.country.message}
                </p>
              )}
            </div>
            )}

            {isVisible("corporateState") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("corporateState", "State")} {isRequired("corporateState") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("address.corporate.state")}
                disabled={isViewMode || copyLocalToCorporate}
                className={`${INPUT_CLASS} ${isViewMode || copyLocalToCorporate ? "bg-gray-100 cursor-not-allowed" : ""} ${
                  showErrors && errors.address?.corporate?.state ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder="Enter state"
              />
              {showErrors && errors.address?.corporate?.state && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.corporate.state.message}
                </p>
              )}
            </div>
            )}

            {isVisible("corporateCity") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("corporateCity", "City")} {isRequired("corporateCity") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                {...register("address.corporate.city")}
                disabled={isViewMode || copyLocalToCorporate}
                className={`${INPUT_CLASS} ${isViewMode || copyLocalToCorporate ? "bg-gray-100 cursor-not-allowed" : ""} ${
                  showErrors && errors.address?.corporate?.city ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder="Enter city"
              />
              {showErrors && errors.address?.corporate?.city && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.corporate.city.message}
                </p>
              )}
            </div>
            )}

            {isVisible("corporateDistrict") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("corporateDistrict", "District")}</Label>
              <Input
                {...register("address.corporate.district")}
                disabled={isViewMode || copyLocalToCorporate}
                className={`${INPUT_CLASS} ${isViewMode || copyLocalToCorporate ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Enter district"
              />
              {showErrors && errors.address?.corporate?.district && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.corporate.district.message}
                </p>
              )}
            </div>
            )}

            {isVisible("corporatePincode") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("corporatePincode", "Pincode")}</Label>
              <Input
                value={corporateAddress?.pincode || ""}
                onChange={(e) =>
                  void handleAddressChange("corporate", "pincode", formatPincode(e.target.value))
                }
                disabled={isViewMode || copyLocalToCorporate}
                className={`${INPUT_CLASS} ${isViewMode || copyLocalToCorporate ? "bg-gray-100 cursor-not-allowed" : ""} ${
                  showErrors && errors.address?.corporate?.pincode ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder="Enter 6-digit pincode"
                maxLength={6}
              />
              {showErrors && errors.address?.corporate?.pincode && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.corporate.pincode.message}
                </p>
              )}
            </div>
            )}

            {isVisible("corporateContactNumber") && (
            <div className="col-span-2 space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">{getLabel("corporateContactNumber", "Contact Number")}</Label>
              <Input
                value={corporateAddress?.contactNumber || ""}
                onChange={(e) =>
                  void handleAddressChange("corporate", "contactNumber", formatPhoneNumber(e.target.value))
                }
                disabled={isViewMode || copyLocalToCorporate}
                className={`${INPUT_CLASS} ${isViewMode || copyLocalToCorporate ? "bg-gray-100 cursor-not-allowed" : ""} ${
                  showErrors && errors.address?.corporate?.contactNumber ? "border-red-500 focus-visible:ring-red-500" : ""
                }`}
                placeholder="Enter 10-digit number"
                maxLength={10}
              />
              {showErrors && errors.address?.corporate?.contactNumber && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.address.corporate.contactNumber.message}
                </p>
              )}
            </div>
            )}
          </div>
        </div>
        )}
          </>
        )}
      </CardContent>

      <FormActionsFooter
        onPreviousTab={onPreviousTab}
        isViewMode={isViewMode}
        isValid={isValid}
        showErrors={showErrors}
        errorCount={Object.keys(errors).length}
        postLoading={postLoading || shouldShowConfigLoader}
        onSave={handleSave}
      />

      
    </Card>
  )
}
