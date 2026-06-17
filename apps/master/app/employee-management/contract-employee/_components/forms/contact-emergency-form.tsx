"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Phone, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { FormActionsFooter } from "../../../../../components/footer/form-actions-footer"
import { GradientFormHeader } from "../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"
import {
  createContactEmergencySchema,
  normalizeContactEmergencyConfig,
  type ContactEmergencyConfig,
  type ContactEmergencyData,
} from "../schemas/contact-emergency-schema"
import { toast } from "react-toastify"

interface ContactEmergencyFormProps {
  employeeRecordId?: string | null
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (data: any) => void
}

export function ContactEmergencyForm({
  employeeRecordId = null,
  onNextTab,
  onPreviousTab,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: ContactEmergencyFormProps) {
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [sameAsPermanentAddress, setSameAsPermanentAddress] = useState(false)
  const hydratedForRecordRef = useRef<string | null>(null)

  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const resolvedEmployeeRecordId = employeeRecordId || id
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const tenantCode = useGetTenantCode()
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const {
    post: postContactEmergency,
    loading: postLoading,
  } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        setShowErrors(true)
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const applyFieldError = (fieldName: string, message: string) => {
          const normalized = fieldName.trim()
          if (!normalized || !message.trim()) return
          setError(normalized as any, {
            type: "server",
            message,
          })
        }

        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return

            if (typeof message === "string") {
              applyFieldError(fieldName, message)
              return
            }

            if (message && typeof message === "object") {
              Object.entries(message as Record<string, unknown>).forEach(([childKey, childValue]) => {
                if (typeof childValue !== "string") return
                applyFieldError(`${fieldName}.${childKey}`, childValue)
              })
            }
          })
        }
        return
      }

      toast.success("Employee data saved successfully!")
      void fetchEmployee()
    },
    onError: (error) => {
      console.error("Error saving contact emergency data:", error)
    },
  })

  

  const contactEmergencyConfig = useMemo(
    () => normalizeContactEmergencyConfig((formStructure?.contactEmergency as ContactEmergencyConfig | undefined) ?? undefined),
    [formStructure]
  )

  const contactEmergencySchema = useMemo(
    () =>
      createContactEmergencySchema({
        tabRequired: contactEmergencyConfig.tabRequired,
        emailID: contactEmergencyConfig.emailID,
        contactNumber: contactEmergencyConfig.contactNumber,
        address: contactEmergencyConfig.address,
      }),
    [contactEmergencyConfig]
  )

  const isVisibleEmail = (field: keyof ContactEmergencyData["emailID"]) =>
    contactEmergencyConfig.emailID.fields[field]?.visible ?? true
  const isVisibleContact = (field: keyof ContactEmergencyData["contactNumber"]) =>
    contactEmergencyConfig.contactNumber.fields[field]?.visible ?? true
  const isVisibleAddress = (
    addressType: "permanentAddress" | "temporaryAddress",
    field: keyof ContactEmergencyData["address"]["permanentAddress"]
  ) => contactEmergencyConfig.address[addressType].fields[field]?.visible ?? true

  const getEmailLabel = (field: keyof ContactEmergencyData["emailID"], fallback: string) =>
    contactEmergencyConfig.emailID.fields[field]?.label || fallback
  const getContactLabel = (field: keyof ContactEmergencyData["contactNumber"], fallback: string) =>
    contactEmergencyConfig.contactNumber.fields[field]?.label || fallback
  const getAddressLabel = (
    addressType: "permanentAddress" | "temporaryAddress",
    field: keyof ContactEmergencyData["address"]["permanentAddress"],
    fallback: string
  ) => contactEmergencyConfig.address[addressType].fields[field]?.label || fallback

  const isRequiredContact = (field: keyof ContactEmergencyData["contactNumber"], requiredByDefault = false) =>
    contactEmergencyConfig.contactNumber.fields[field]?.required ?? requiredByDefault
  const isRequiredAddress = (
    addressType: "permanentAddress" | "temporaryAddress",
    field: keyof ContactEmergencyData["address"]["permanentAddress"],
    requiredByDefault = false
  ) => contactEmergencyConfig.address[addressType].fields[field]?.required ?? requiredByDefault

  const showContactInformationSection =
    isVisibleEmail("primaryEmailID") ||
    isVisibleEmail("secondaryEmailID") ||
    isVisibleContact("primaryContactNo") ||
    isVisibleContact("secondaryContactNumber")
  const showEmergencyContactsSection =
    isVisibleContact("emergencyContactPerson1") ||
    isVisibleContact("emergencyContactNo1") ||
    isVisibleContact("emergencyContactPerson2") ||
    isVisibleContact("emergencyContactNo2")
  const showPermanentAddressSection =
    isVisibleAddress("permanentAddress", "addressLine1") ||
    isVisibleAddress("permanentAddress", "addressLine2") ||
    isVisibleAddress("permanentAddress", "country") ||
    isVisibleAddress("permanentAddress", "state") ||
    isVisibleAddress("permanentAddress", "city") ||
    isVisibleAddress("permanentAddress", "pinCode") ||
    isVisibleAddress("permanentAddress", "taluka") ||
    isVisibleAddress("permanentAddress", "isVerified")
  const showTemporaryAddressSection =
    isVisibleAddress("temporaryAddress", "addressLine1") ||
    isVisibleAddress("temporaryAddress", "addressLine2") ||
    isVisibleAddress("temporaryAddress", "country") ||
    isVisibleAddress("temporaryAddress", "state") ||
    isVisibleAddress("temporaryAddress", "city") ||
    isVisibleAddress("temporaryAddress", "pinCode") ||
    isVisibleAddress("temporaryAddress", "taluka") ||
    isVisibleAddress("temporaryAddress", "isVerified")

  const shouldShowConfigLoader = formStructureLoading || !formStructure

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    setError,
    trigger,
    clearErrors,
  } = useForm<ContactEmergencyData>({
    resolver: zodResolver(contactEmergencySchema),
    defaultValues: {
      emailID: {
        primaryEmailID: "",
        secondaryEmailID: "",
      },
      contactNumber: {
        primaryContactNo: "",
        secondaryContactNumber: "",
        emergencyContactPerson1: "",
        emergencyContactNo1: "",
        emergencyContactPerson2: "",
        emergencyContactNo2: "",
      },
      address: {
        permanentAddress: {
          addressLine1: "",
          addressLine2: "",
          country: "",
          state: "",
          city: "",
          pinCode: "",
          taluka: "",
          isVerified: false,
        },
        temporaryAddress: {
          addressLine1: "",
          addressLine2: "",
          country: "",
          state: "",
          city: "",
          pinCode: "",
          taluka: "",
          isVerified: false,
        },
      },
    },
    mode: "onChange",
  })
  const auditEntityId = String(
    resolvedEmployeeRecordId ||
      employeeData?._id ||
      employeeData?.employeeID ||
      employeeData?.employeeId ||
      "",
  )
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })

  const { refetch: fetchEmployee } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [
      {
        field: "_id",
        value: resolvedEmployeeRecordId,
        operator: "eq",
      },
    ],
    onSuccess: (data) => {
      if (Array.isArray(data) && data[0] && data[0].isDeleted !== true) {
        setEmployeeData(data[0])
      }
    },
    onError: (error) => {
      console.error("Error fetching employee data:", error)
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  })

  useEffect(() => {
    if (!resolvedEmployeeRecordId || currentMode === "add") return
    void fetchEmployee()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedEmployeeRecordId, currentMode, employeeSearchUrl])

  useEffect(() => {
    hydratedForRecordRef.current = null
  }, [resolvedEmployeeRecordId])

  useEffect(() => {
    if (!employeeData) return
    if (!resolvedEmployeeRecordId) return
    if (hydratedForRecordRef.current === resolvedEmployeeRecordId) return

    setValue("emailID.primaryEmailID", employeeData.emailID?.primaryEmailID || "")
    setValue("emailID.secondaryEmailID", employeeData.emailID?.secondaryEmailID || "")
    setValue("contactNumber.primaryContactNo", employeeData.contactNumber?.primaryContactNo || "")
    setValue("contactNumber.secondaryContactNumber", employeeData.contactNumber?.secondaryContactNumber || "")
    setValue("contactNumber.emergencyContactPerson1", employeeData.contactNumber?.emergencyContactPerson1 || "")
    setValue("contactNumber.emergencyContactNo1", employeeData.contactNumber?.emergencyContactNo1 || "")
    setValue("contactNumber.emergencyContactPerson2", employeeData.contactNumber?.emergencyContactPerson2 || "")
    setValue("contactNumber.emergencyContactNo2", employeeData.contactNumber?.emergencyContactNo2 || "")
    setValue("address.permanentAddress.addressLine1", employeeData.address?.permanentAddress?.addressLine1 || "")
    setValue("address.permanentAddress.addressLine2", employeeData.address?.permanentAddress?.addressLine2 || "")
    setValue("address.permanentAddress.country", employeeData.address?.permanentAddress?.country || "")
    setValue("address.permanentAddress.state", employeeData.address?.permanentAddress?.state || "")
    setValue("address.permanentAddress.city", employeeData.address?.permanentAddress?.city || "")
    setValue("address.permanentAddress.pinCode", employeeData.address?.permanentAddress?.pinCode || "")
    setValue("address.permanentAddress.taluka", employeeData.address?.permanentAddress?.taluka || "")
    setValue("address.permanentAddress.isVerified", Boolean(employeeData.address?.permanentAddress?.isVerified))
    setValue("address.temporaryAddress.addressLine1", employeeData.address?.temporaryAddress?.addressLine1 || "")
    setValue("address.temporaryAddress.addressLine2", employeeData.address?.temporaryAddress?.addressLine2 || "")
    setValue("address.temporaryAddress.country", employeeData.address?.temporaryAddress?.country || "")
    setValue("address.temporaryAddress.state", employeeData.address?.temporaryAddress?.state || "")
    setValue("address.temporaryAddress.city", employeeData.address?.temporaryAddress?.city || "")
    setValue("address.temporaryAddress.pinCode", employeeData.address?.temporaryAddress?.pinCode || "")
    setValue("address.temporaryAddress.taluka", employeeData.address?.temporaryAddress?.taluka || "")
    setValue("address.temporaryAddress.isVerified", Boolean(employeeData.address?.temporaryAddress?.isVerified))
    hydratedForRecordRef.current = resolvedEmployeeRecordId
    void trigger()
  }, [employeeData, resolvedEmployeeRecordId, setValue, trigger])

  const watchedValues = watch()

  const handleAddressChange = async (
    addressType: "permanentAddress" | "temporaryAddress",
    field: string,
    value: any
  ) => {
    setValue(`address.${addressType}.${field}` as any, value)
    await trigger(`address.${addressType}.${field}` as any)
  }

  const handleSaveAndContinue = async () => {
    if (shouldShowConfigLoader) return
    setShowErrors(true)
    clearErrors()
    const formValues = watch()
    const valid = await trigger()
    if (!valid) return

    const isEditMode = currentMode === "edit" && Boolean(resolvedEmployeeRecordId)
    const shouldSetContactEmergencyTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        ...formValues,
        ...(shouldSetContactEmergencyTab ? { contactEmergencytab: true } : {}),
      },
      audit: auditPayload,
    }

    postContactEmergency(payload)
  }

  const handleSave = async () => {
    await handleSaveAndContinue()
  }

  const handleContinue = async () => {
    setShowErrors(true)
    const valid = await trigger()
    if (!valid) return
    if (onNextTab) onNextTab()
  }

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      {postLoading && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Saving permissions...</span>
          </div>
        </div>
      )}
      <GradientFormHeader
        icon={Phone}
        title="Contact & Emergency Information"
        description="Contact details and emergency contact information"
      />
      <CardContent className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Contact Information */}
          {showContactInformationSection && (
          <div className="lg:col-span-3">
            <SubFormTitle title="Contact Information" className="mb-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {isVisibleEmail("primaryEmailID") && (
              <div className="group">
                <Label htmlFor="primaryEmailID" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getEmailLabel("primaryEmailID", "Primary Email ID")}
                </Label>
                <Input
                  {...register("emailID.primaryEmailID")}
                  id="primaryEmailID"
                  type="email"
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    (showErrors && errors.emailID?.primaryEmailID)
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter primary email"
                  disabled={isViewMode}
                />
                {showErrors && errors.emailID?.primaryEmailID && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.emailID.primaryEmailID.message}
                  </p>
                )}
              </div>
              )}
              {isVisibleEmail("secondaryEmailID") && (
              <div className="group">
                <Label htmlFor="secondaryEmailID" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getEmailLabel("secondaryEmailID", "Secondary Email ID")}
                </Label>
                <Input
                  {...register("emailID.secondaryEmailID")}
                  id="secondaryEmailID"
                  type="email"
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    (showErrors && errors.emailID?.secondaryEmailID)
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter secondary email"
                  disabled={isViewMode}
                />
                {showErrors && errors.emailID?.secondaryEmailID && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.emailID.secondaryEmailID.message}
                  </p>
                )}
              </div>
              )}
              {isVisibleContact("primaryContactNo") && (
              <div className="group">
                <Label htmlFor="primaryContactNo" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getContactLabel("primaryContactNo", "Primary Contact Number")} {isRequiredContact("primaryContactNo", true) && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  {...register("contactNumber.primaryContactNo")}
                  id="primaryContactNo"
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    (showErrors && errors.contactNumber?.primaryContactNo)
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter primary contact number"
                  disabled={isViewMode}
                  inputMode="numeric"
                  onKeyDown={(e) => { if (!/[\d]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"].includes(e.key)) e.preventDefault() }}
                />
                {showErrors && errors.contactNumber?.primaryContactNo && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.contactNumber.primaryContactNo.message}
                  </p>
                )}
              </div>
              )}
              {isVisibleContact("secondaryContactNumber") && (
              <div className="group">
                <Label htmlFor="secondaryContactNumber" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getContactLabel("secondaryContactNumber", "Secondary Contact Number")} {isRequiredContact("secondaryContactNumber") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  {...register("contactNumber.secondaryContactNumber")}
                  id="secondaryContactNumber"
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    (showErrors && errors.contactNumber?.secondaryContactNumber)
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter secondary contact number"
                  disabled={isViewMode}
                  inputMode="numeric"
                  onKeyDown={(e) => { if (!/[\d]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"].includes(e.key)) e.preventDefault() }}
                />
                {showErrors && errors.contactNumber?.secondaryContactNumber && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.contactNumber.secondaryContactNumber.message}
                  </p>
                )}
              </div>
              )}
            </div>
          </div>
          )}

          {(showContactInformationSection && showEmergencyContactsSection) && <Separator className="lg:col-span-3 my-2" />}

          {/* Emergency Contacts */}
          {showEmergencyContactsSection && (
          <div className="lg:col-span-3">
            <SubFormTitle title="Emergency Contacts" className="mb-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {isVisibleContact("emergencyContactPerson1") && (
              <div className="group">
                <Label htmlFor="emergencyContactPerson1" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getContactLabel("emergencyContactPerson1", "Emergency Contact 1 Name")} {isRequiredContact("emergencyContactPerson1") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  {...register("contactNumber.emergencyContactPerson1")}
                  id="emergencyContactPerson1"
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    (showErrors && errors.contactNumber?.emergencyContactPerson1)
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter name"
                  disabled={isViewMode}
                />
                {showErrors && errors.contactNumber?.emergencyContactPerson1 && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.contactNumber.emergencyContactPerson1.message}
                  </p>
                )}
              </div>
              )}

              {isVisibleContact("emergencyContactNo1") && (
              <div className="group">
                <Label htmlFor="emergencyContactNo1" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getContactLabel("emergencyContactNo1", "Emergency Contact 1 No")} {isRequiredContact("emergencyContactNo1") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  {...register("contactNumber.emergencyContactNo1")}
                  id="emergencyContactNo1"
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    (showErrors && errors.contactNumber?.emergencyContactNo1)
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter number"
                  disabled={isViewMode}
                />
                {showErrors && errors.contactNumber?.emergencyContactNo1 && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.contactNumber.emergencyContactNo1.message}
                  </p>
                )}
              </div>
              )}

              {isVisibleContact("emergencyContactPerson2") && (
              <div className="group">
                <Label htmlFor="emergencyContactPerson2" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getContactLabel("emergencyContactPerson2", "Emergency Contact 2 Name")} {isRequiredContact("emergencyContactPerson2") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  {...register("contactNumber.emergencyContactPerson2")}
                  id="emergencyContactPerson2"
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    (showErrors && errors.contactNumber?.emergencyContactPerson2)
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter name"
                  disabled={isViewMode}
                />
                {showErrors && errors.contactNumber?.emergencyContactPerson2 && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.contactNumber.emergencyContactPerson2.message}
                  </p>
                )}
              </div>
              )}

              {isVisibleContact("emergencyContactNo2") && (
              <div className="group">
                <Label htmlFor="emergencyContactNo2" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getContactLabel("emergencyContactNo2", "Emergency Contact 2 No")} {isRequiredContact("emergencyContactNo2") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  {...register("contactNumber.emergencyContactNo2")}
                  id="emergencyContactNo2"
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    (showErrors && errors.contactNumber?.emergencyContactNo2)
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter number"
                  disabled={isViewMode}
                />
                {showErrors && errors.contactNumber?.emergencyContactNo2 && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.contactNumber.emergencyContactNo2.message}
                  </p>
                )}
              </div>
              )}
            </div>
          </div>
          )}

          {(showEmergencyContactsSection && showPermanentAddressSection) && <Separator className="lg:col-span-3 my-2" />}

          {showPermanentAddressSection && (
          <div className="lg:col-span-3 mt-2 mb-2 py-2">
            <SubFormTitle title="Permanent Address" className="mb-2" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {isVisibleAddress("permanentAddress", "addressLine1") && (
              <div className="group col-span-6">
                <Label htmlFor="permanentAddressLine1" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("permanentAddress", "addressLine1", "Address Line 1")} {isRequiredAddress("permanentAddress", "addressLine1", true) && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="permanentAddressLine1"
                  value={watchedValues.address?.permanentAddress?.addressLine1 || ""}
                  onChange={(e) => handleAddressChange("permanentAddress", "addressLine1", e.target.value)}
                  disabled={isViewMode}
                  className={`min-h-[56px] border rounded-md px-3 py-2 text-sm resize-none ${
                    isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${
                    showErrors && errors.address?.permanentAddress?.addressLine1
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter address line 1"
                  rows={2}
                />
                {showErrors && errors.address?.permanentAddress?.addressLine1 && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.permanentAddress.addressLine1.message}
                  </p>
                )}
              </div>
              )}
              {isVisibleAddress("permanentAddress", "addressLine2") && (
              <div className="group col-span-6">
                <Label htmlFor="permanentAddressLine2" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("permanentAddress", "addressLine2", "Address Line 2")}
                </Label>
                <Textarea
                  id="permanentAddressLine2"
                  value={watchedValues.address?.permanentAddress?.addressLine2 || ""}
                  onChange={(e) => handleAddressChange("permanentAddress", "addressLine2", e.target.value)}
                  disabled={isViewMode}
                  className="min-h-[56px] border rounded-md px-3 py-2 text-sm resize-none border-gray-300 focus:border-gray-900"
                  placeholder="Enter address line 2"
                  rows={2}
                />
              </div>
              )}
              {isVisibleAddress("permanentAddress", "country") && (
              <div className="group col-span-2">
                <Label htmlFor="permanentCountry" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("permanentAddress", "country", "Country")} {isRequiredAddress("permanentAddress", "country", true) && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="permanentCountry"
                  value={watchedValues.address?.permanentAddress?.country || ""}
                  onChange={(e) => handleAddressChange("permanentAddress", "country", e.target.value)}
                  disabled={isViewMode}
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${
                    showErrors && errors.address?.permanentAddress?.country
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter country"
                />
              </div>
              )}
              {isVisibleAddress("permanentAddress", "state") && (
              <div className="group col-span-2">
                <Label htmlFor="permanentState" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("permanentAddress", "state", "State")} {isRequiredAddress("permanentAddress", "state", true) && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="permanentState"
                  value={watchedValues.address?.permanentAddress?.state || ""}
                  onChange={(e) => handleAddressChange("permanentAddress", "state", e.target.value)}
                  disabled={isViewMode}
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${
                    showErrors && errors.address?.permanentAddress?.state
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter state"
                />
              </div>
              )}
              {isVisibleAddress("permanentAddress", "city") && (
              <div className="group col-span-2">
                <Label htmlFor="permanentCity" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("permanentAddress", "city", "City")} {isRequiredAddress("permanentAddress", "city", true) && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="permanentCity"
                  value={watchedValues.address?.permanentAddress?.city || ""}
                  onChange={(e) => handleAddressChange("permanentAddress", "city", e.target.value)}
                  disabled={isViewMode}
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${
                    showErrors && errors.address?.permanentAddress?.city
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter city"
                />
              </div>
              )}
              {isVisibleAddress("permanentAddress", "pinCode") && (
              <div className="group col-span-2">
                <Label htmlFor="permanentPinCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("permanentAddress", "pinCode", "Pin Code")} {isRequiredAddress("permanentAddress", "pinCode") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="permanentPinCode"
                  value={watchedValues.address?.permanentAddress?.pinCode || ""}
                  onChange={(e) => handleAddressChange("permanentAddress", "pinCode", e.target.value)}
                  disabled={isViewMode}
                  className={`h-9 border rounded-md px-3 py-1.5 text-sm ${
                    isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${
                    showErrors && errors.address?.permanentAddress?.pinCode
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                  placeholder="Enter pin code"
                />
              </div>
              )}
              {isVisibleAddress("permanentAddress", "taluka") && (
              <div className="group col-span-2">
                <Label htmlFor="permanentTaluka" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("permanentAddress", "taluka", "Taluka")} {isRequiredAddress("permanentAddress", "taluka") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="permanentTaluka"
                  value={watchedValues.address?.permanentAddress?.taluka || ""}
                  onChange={(e) => handleAddressChange("permanentAddress", "taluka", e.target.value)}
                  disabled={isViewMode}
                  className="h-9 border rounded-md px-3 py-1.5 text-sm border-gray-300 focus:border-gray-900"
                  placeholder="Enter taluka"
                />
              </div>
              )}
              {isVisibleAddress("permanentAddress", "isVerified") && (
              <div className="flex items-center space-x-2 mt-2 col-span-2">
                <input
                  type="checkbox"
                  id="permanentIsVerified"
                  checked={watchedValues.address?.permanentAddress?.isVerified || false}
                  onChange={(e) => handleAddressChange("permanentAddress", "isVerified", e.target.checked)}
                  disabled={isViewMode}
                  className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                    isViewMode ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
                <Label htmlFor="permanentIsVerified" className="text-sm text-gray-700">
                  {getAddressLabel("permanentAddress", "isVerified", "Address Verified")}
                </Label>
              </div>
              )}
            </div>
          </div>
          )}

          {(showPermanentAddressSection && showTemporaryAddressSection) && <Separator className="lg:col-span-3 my-2" />}

          {showTemporaryAddressSection && (
          <div className="lg:col-span-3 pt-2">
            <SubFormTitle title="Temporary Address" className="mb-2" />
            {!isViewMode && isVisibleAddress("temporaryAddress", "addressLine1") && (
              <div className="mb-4 flex items-center space-x-2">
                <Checkbox
                  id="sameAsPermanentAddress"
                  checked={sameAsPermanentAddress}
                  onCheckedChange={(checked) => {
                    const enabled = checked as boolean
                    setSameAsPermanentAddress(enabled)
                    if (enabled) {
                      const currentValues = watch()
                      const permanentAddress = currentValues.address.permanentAddress
                      setValue("address.temporaryAddress.addressLine1", permanentAddress.addressLine1 || "")
                      setValue("address.temporaryAddress.addressLine2", permanentAddress.addressLine2 || "")
                      setValue("address.temporaryAddress.country", permanentAddress.country || "")
                      setValue("address.temporaryAddress.state", permanentAddress.state || "")
                      setValue("address.temporaryAddress.city", permanentAddress.city || "")
                      setValue("address.temporaryAddress.pinCode", permanentAddress.pinCode || "")
                      setValue("address.temporaryAddress.taluka", permanentAddress.taluka || "")
                      setValue("address.temporaryAddress.isVerified", permanentAddress.isVerified || false)
                    }
                  }}
                />
                <Label htmlFor="sameAsPermanentAddress" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Is Permanent Address same as Temporary Address?
                </Label>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {isVisibleAddress("temporaryAddress", "addressLine1") && (
              <div className="group col-span-6">
                <Label htmlFor="temporaryAddressLine1" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("temporaryAddress", "addressLine1", "Address Line 1")} {isRequiredAddress("temporaryAddress", "addressLine1") && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="temporaryAddressLine1"
                  value={watchedValues.address?.temporaryAddress?.addressLine1 || ""}
                  onChange={(e) => handleAddressChange("temporaryAddress", "addressLine1", e.target.value)}
                  disabled={isViewMode || sameAsPermanentAddress}
                  className="min-h-[56px] border rounded-md px-3 py-2 text-sm resize-none border-gray-300 focus:border-gray-900"
                  placeholder="Enter address line 1"
                  rows={2}
                />
              </div>
              )}
              {isVisibleAddress("temporaryAddress", "addressLine2") && (
              <div className="group col-span-6">
                <Label htmlFor="temporaryAddressLine2" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("temporaryAddress", "addressLine2", "Address Line 2")} {isRequiredAddress("temporaryAddress", "addressLine2") && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="temporaryAddressLine2"
                  value={watchedValues.address?.temporaryAddress?.addressLine2 || ""}
                  onChange={(e) => handleAddressChange("temporaryAddress", "addressLine2", e.target.value)}
                  disabled={isViewMode || sameAsPermanentAddress}
                  className="min-h-[56px] border rounded-md px-3 py-2 text-sm resize-none border-gray-300 focus:border-gray-900"
                  placeholder="Enter address line 2"
                  rows={2}
                />
              </div>
              )}
              {isVisibleAddress("temporaryAddress", "country") && (
              <div className="group col-span-2">
                <Label htmlFor="temporaryCountry" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("temporaryAddress", "country", "Country")} {isRequiredAddress("temporaryAddress", "country") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="temporaryCountry"
                  value={watchedValues.address?.temporaryAddress?.country || ""}
                  onChange={(e) => handleAddressChange("temporaryAddress", "country", e.target.value)}
                  disabled={isViewMode || sameAsPermanentAddress}
                  className="h-9 border rounded-md px-3 py-1.5 text-sm border-gray-300 focus:border-gray-900"
                  placeholder="Enter country"
                />
              </div>
              )}
              {isVisibleAddress("temporaryAddress", "state") && (
              <div className="group col-span-2">
                <Label htmlFor="temporaryState" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("temporaryAddress", "state", "State")} {isRequiredAddress("temporaryAddress", "state") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="temporaryState"
                  value={watchedValues.address?.temporaryAddress?.state || ""}
                  onChange={(e) => handleAddressChange("temporaryAddress", "state", e.target.value)}
                  disabled={isViewMode || sameAsPermanentAddress}
                  className="h-9 border rounded-md px-3 py-1.5 text-sm border-gray-300 focus:border-gray-900"
                  placeholder="Enter state"
                />
              </div>
              )}
              {isVisibleAddress("temporaryAddress", "city") && (
              <div className="group col-span-2">
                <Label htmlFor="temporaryCity" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("temporaryAddress", "city", "City")} {isRequiredAddress("temporaryAddress", "city") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="temporaryCity"
                  value={watchedValues.address?.temporaryAddress?.city || ""}
                  onChange={(e) => handleAddressChange("temporaryAddress", "city", e.target.value)}
                  disabled={isViewMode || sameAsPermanentAddress}
                  className="h-9 border rounded-md px-3 py-1.5 text-sm border-gray-300 focus:border-gray-900"
                  placeholder="Enter city"
                />
              </div>
              )}
              {isVisibleAddress("temporaryAddress", "pinCode") && (
              <div className="group col-span-2">
                <Label htmlFor="temporaryPinCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("temporaryAddress", "pinCode", "Pin Code")} {isRequiredAddress("temporaryAddress", "pinCode") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="temporaryPinCode"
                  value={watchedValues.address?.temporaryAddress?.pinCode || ""}
                  onChange={(e) => handleAddressChange("temporaryAddress", "pinCode", e.target.value)}
                  disabled={isViewMode || sameAsPermanentAddress}
                  className="h-9 border rounded-md px-3 py-1.5 text-sm border-gray-300 focus:border-gray-900"
                  placeholder="Enter pin code"
                />
              </div>
              )}
              {isVisibleAddress("temporaryAddress", "taluka") && (
              <div className="group col-span-2">
                <Label htmlFor="temporaryTaluka" className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1">
                  {getAddressLabel("temporaryAddress", "taluka", "Taluka")} {isRequiredAddress("temporaryAddress", "taluka") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="temporaryTaluka"
                  value={watchedValues.address?.temporaryAddress?.taluka || ""}
                  onChange={(e) => handleAddressChange("temporaryAddress", "taluka", e.target.value)}
                  disabled={isViewMode || sameAsPermanentAddress}
                  className="h-9 border rounded-md px-3 py-1.5 text-sm border-gray-300 focus:border-gray-900"
                  placeholder="Enter taluka"
                />
              </div>
              )}
              {isVisibleAddress("temporaryAddress", "isVerified") && (
              <div className="flex items-center space-x-2 mt-2 col-span-2">
                <input
                  type="checkbox"
                  id="temporaryIsVerified"
                  checked={watchedValues.address?.temporaryAddress?.isVerified || false}
                  onChange={(e) => handleAddressChange("temporaryAddress", "isVerified", e.target.checked)}
                  disabled={isViewMode || sameAsPermanentAddress}
                  className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                    isViewMode || sameAsPermanentAddress ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                />
                <Label htmlFor="temporaryIsVerified" className="text-sm text-gray-700">
                  {getAddressLabel("temporaryAddress", "isVerified", "Address Verified")}
                </Label>
              </div>
              )}
            </div>
          </div>
          )}
          </div>
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
