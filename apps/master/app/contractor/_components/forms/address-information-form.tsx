"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { MapPin, ArrowRight, ArrowLeft, RotateCcw, X, Copy } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// Validation schema with nested structure
const addressInformationSchema = z.object({
  address: z.object({
    local: z.object({
      addressLine1: z.string().min(1, "Local address line 1 is required"),
      addressLine2: z.string().optional(),
      country: z.string().min(1, "Local country is required"),
      state: z.string().min(1, "Local state is required"),
      city: z.string().min(1, "Local city is required"),
      district: z.string().optional(),
      pincode: z.string().optional().refine((val) => {
        if (!val) return true; // Allow empty pincode
        return /^[0-9]{6}$/.test(val);
      }, "Pin Code must be 6 digits"),
      contactNumber: z.string()
        .optional()
        .refine((val) => {
          if (!val || val === "") return true; // Allow empty
          return /^\d{10}$/.test(val);
        }, "Contact number must be exactly 10 digits"),
    }),
    corporate: z.object({
      addressLine1: z.string().min(1, "Corporate address line 1 is required"),
      addressLine2: z.string().optional(),
      country: z.string().min(1, "Corporate country is required"),
      state: z.string().min(1, "Corporate state is required"),
      city: z.string().min(1, "Corporate city is required"),
      district: z.string().optional(),
      pincode: z.string().optional().refine((val) => {
        if (!val) return true; // Allow empty pincode
        return /^[0-9]{6}$/.test(val);
      }, "Pin Code must be 6 digits"),
      contactNumber: z.string()
        .optional()
        .refine((val) => {
          if (!val || val === "") return true; // Allow empty
          return /^\d{10}$/.test(val);
        }, "Contact number must be exactly 10 digits"),
    }),
  }),
})

type AddressInformationFormData = z.infer<typeof addressInformationSchema>

// Helper function to format pincode (6 digits only)
const formatPincode = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  // Limit to 6 digits
  return digits.substring(0, 6);
};

// Helper function to format phone number (10 digits only)
const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  // Limit to 10 digits
  return digits.substring(0, 10);
};

interface AddressInformationFormProps {
  formData: any
  onFormDataChange: (data: Partial<AddressInformationFormData>) => void
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  auditStatus?: any
  auditStatusFormData?: any
  setAuditStatus?: (data: any) => void
  setAuditStatusFormData?: (data: any) => void
  activeTab?: string
}

export function AddressInformationForm({ 
  formData, 
  onFormDataChange, 
  onNextTab,
  onPreviousTab,
  mode = "add" ,
  auditStatus,
  auditStatusFormData,
  setAuditStatus,
  setAuditStatusFormData,
  activeTab
}: AddressInformationFormProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [copyLocalToCorporate, setCopyLocalToCorporate] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const modeParam = searchParams.get("mode")
  const currentMode = modeParam || mode
  const isViewMode = currentMode === "view"
  const tenantCode = useGetTenantCode()

  const {
    register,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
    trigger,
  } = useForm<AddressInformationFormData>({
    resolver: zodResolver(addressInformationSchema),
    mode: "onChange",
    defaultValues: {
      address: {
        local: {
          addressLine1: "",
          addressLine2: "",
          country: "",
          state: "",
          city: "",
          district: "",
          pincode: "",
          contactNumber: "",
        },
        corporate: {
          addressLine1: "",
          addressLine2: "",
          country: "",
          state: "",
          city: "",
          district: "",
          pincode: "",
          contactNumber: "",
        },
      },
    },
  })

  const watchedValues = watch()

  // Watch local address changes and copy to corporate if checkbox is checked
  useEffect(() => {
    if (copyLocalToCorporate) {
      const localValues = watch("address.local")
      setValue("address.corporate.addressLine1", localValues.addressLine1)
      setValue("address.corporate.addressLine2", localValues.addressLine2)
      setValue("address.corporate.country", localValues.country)
      setValue("address.corporate.state", localValues.state)
      setValue("address.corporate.city", localValues.city)
      setValue("address.corporate.district", localValues.district)
      setValue("address.corporate.pincode", localValues.pincode)
      setValue("address.corporate.contactNumber", localValues.contactNumber)
    }
  }, [copyLocalToCorporate, watch("address.local"), setValue])

  

  // Populate form based on mode
  useEffect(() => {
      // In add mode, populate from auditStatusFormData
      if (auditStatusFormData.address) {
        // New nested structure
        setValue("address.local.addressLine1", auditStatusFormData.address.local?.addressLine1 || "")
        setValue("address.local.addressLine2", auditStatusFormData.address.local?.addressLine2 || "")
        setValue("address.local.country", auditStatusFormData.address.local?.country || "")
        setValue("address.local.state", auditStatusFormData.address.local?.state || "")
        setValue("address.local.city", auditStatusFormData.address.local?.city || "")
        setValue("address.local.district", auditStatusFormData.address.local?.district || "")
        setValue("address.local.pincode", auditStatusFormData.address.local?.pincode || "")
        setValue("address.local.contactNumber", auditStatusFormData.address.local?.contactNumber || "")
        
        setValue("address.corporate.addressLine1", auditStatusFormData.address.corporate?.addressLine1 || "")
        setValue("address.corporate.addressLine2", auditStatusFormData.address.corporate?.addressLine2 || "")
        setValue("address.corporate.country", auditStatusFormData.address.corporate?.country || "")
        setValue("address.corporate.state", auditStatusFormData.address.corporate?.state || "")
        setValue("address.corporate.city", auditStatusFormData.address.corporate?.city || "")
        setValue("address.corporate.district", auditStatusFormData.address.corporate?.district || "")
        setValue("address.corporate.pincode", auditStatusFormData.address.corporate?.pincode || "")
        setValue("address.corporate.contactNumber", auditStatusFormData.address.corporate?.contactNumber || "")
      } else {
        // Old flat structure for backward compatibility
        setValue("address.local.addressLine1", auditStatusFormData.localAddressLine1 || "")
        setValue("address.local.addressLine2", auditStatusFormData.localAddressLine2 || "")
        setValue("address.local.country", auditStatusFormData.localCountry || "")
        setValue("address.local.state", auditStatusFormData.localState || "")
        setValue("address.local.city", auditStatusFormData.localCity || "")
        setValue("address.local.district", auditStatusFormData.localDistrict || "")
        setValue("address.local.pincode", auditStatusFormData.localPincode || "")
        setValue("address.local.contactNumber", auditStatusFormData.localContactNumber || "")
        
        setValue("address.corporate.addressLine1", auditStatusFormData.corporateAddressLine1 || "")
        setValue("address.corporate.addressLine2", auditStatusFormData.corporateAddressLine2 || "")
        setValue("address.corporate.country", auditStatusFormData.corporateCountry || "")
        setValue("address.corporate.state", auditStatusFormData.corporateState || "")
        setValue("address.corporate.city", auditStatusFormData.corporateCity || "")
        setValue("address.corporate.district", auditStatusFormData.corporateDistrict || "")
        setValue("address.corporate.pincode", auditStatusFormData.corporatePincode || "")
        setValue("address.corporate.contactNumber", auditStatusFormData.corporateContactNumber || "")
      }
    
  }, [currentMode, auditStatusFormData, setValue, trigger])

  // API call for saving address information
  const {
    post: postAddressInformation,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "contractor",
    onSuccess: (data) => {
      setSuccessPopupData({
        title: "Address Information Saved",
        message: "Address information has been saved successfully."
      })
      setShowSuccessPopup(true)
    },
    onError: (error) => {
      console.error("Error saving address information:", error)
    },
  })

  // Function to copy local address to corporate address
  const handleCopyLocalToCorporate = () => {
    const localValues = watch("address.local")
    
    // Copy all local address fields to corporate address
    setValue("address.corporate.addressLine1", localValues.addressLine1)
    setValue("address.corporate.addressLine2", localValues.addressLine2)
    setValue("address.corporate.country", localValues.country)
    setValue("address.corporate.state", localValues.state)
    setValue("address.corporate.city", localValues.city)
    setValue("address.corporate.district", localValues.district)
    setValue("address.corporate.pincode", localValues.pincode)
    setValue("address.corporate.contactNumber", localValues.contactNumber)
  }

  const handleSaveAndContinue = async () => {
    
    const isValid = await trigger()
    if (isValid) {
      const formValues = watch()
      
      // Create the exact JSON structure as requested
      const exactData = {
        address: {
          local: {
            addressLine1: formValues.address.local.addressLine1 || "",
            addressLine2: formValues.address.local.addressLine2 || "",
            country: formValues.address.local.country || "",
            state: formValues.address.local.state || "",
            city: formValues.address.local.city || "",
            district: formValues.address.local.district || "",
            pincode: formValues.address.local.pincode || "",
            contactNumber: formValues.address.local.contactNumber || "",
          },
          corporate: {
            addressLine1: formValues.address.corporate.addressLine1 || "",
            addressLine2: formValues.address.corporate.addressLine2 || "",
            country: formValues.address.corporate.country || "",
            state: formValues.address.corporate.state || "",
            city: formValues.address.corporate.city || "",
            district: formValues.address.corporate.district || "",
            pincode: formValues.address.corporate.pincode || "",
            contactNumber: formValues.address.corporate.contactNumber || "",
          },
        },
      }
      
      // Mode-based save and continue logic
      if (currentMode === "add") {
        // In add mode: update auditStatusFormData, set completion status, and move to next tab
        setAuditStatusFormData?.({
          ...auditStatusFormData,
          ...exactData
        })
        setAuditStatus?.({
          ...auditStatus,
          addressInformation: true
        })
        setSuccessPopupData({
          title: "Address Information Saved",
          message: "Address information has been saved successfully."
        })
        setShowSuccessPopup(true)
      } else if (currentMode === "edit") {
        // In edit mode: update parent formData and save to backend
        onFormDataChange(exactData)
        let json = {
          tenant: tenantCode,
          action: "insert",
          id: auditStatusFormData._id,
          collectionName: "contractor",
          data: {
            ...auditStatusFormData,
            ...exactData,
            addressInformation: true
          }
        }
        postAddressInformation(json)
      } else {
        // In view mode: update parent formData only
        onFormDataChange(exactData)
      }
    } else {
      setShowErrors(true)
      
      // Log specific failing fields
      const requiredFields = [
        "address.local.addressLine1",
        "address.local.country", 
        "address.local.state",
        "address.local.city",
        "address.corporate.addressLine1",
        "address.corporate.country",
        "address.corporate.state", 
        "address.corporate.city"
      ]
      
      const failingFields = requiredFields.filter(field => {
        const fieldParts = field.split('.')
        let obj: any = errors
        for (const part of fieldParts) {
          obj = obj?.[part]
          if (!obj) break
        }
        return obj
      })
      
    }
  }

  // Split actions: Save and Continue
  const handleSave = async () => {
    await handleSaveAndContinue()
  }

  const handleContinue = async () => {
    setShowErrors(true)
    const valid = await trigger()
    if (valid && onNextTab) {
      onNextTab()
    }
  }

  const handleReset = () => {
    const clearedData = {
      address: {
        local: {
          addressLine1: "",
          addressLine2: "",
          country: "",
          state: "",
          city: "",
          district: "",
          pincode: "",
          contactNumber: "",
        },
        corporate: {
          addressLine1: "",
          addressLine2: "",
          country: "",
          state: "",
          city: "",
          district: "",
          pincode: "",
          contactNumber: "",
        },
      },
    }
    reset(clearedData)
    
    // Mode-based reset logic
    if (currentMode === "add") {
      // In add mode, clear auditStatusFormData
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...clearedData
      })
    } else {
      // In edit/view mode, update parent formData
      onFormDataChange(clearedData)
    }
  }

  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-xl shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-700/90"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Address Information</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Local and corporate address details
                </CardDescription>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-8">
          {/* Local Address Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              Local Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                <Label htmlFor="localAddressLine1" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Address Line 1 <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("address.local.addressLine1")}
                  id="localAddressLine1"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.local?.addressLine1 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter address line 1"
                  disabled={isViewMode}
                />
                {errors.address?.local?.addressLine1 && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.local.addressLine1.message}
                  </p>
                )}
              </div>
              <div className="group">
                <Label htmlFor="localAddressLine2" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Address Line 2
                </Label>
                <Input
                  {...register("address.local.addressLine2")}
                  id="localAddressLine2"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`}
                  placeholder="Enter address line 2"
                  disabled={isViewMode}
                />
              </div>
              <div className="group">
                <Label htmlFor="localCountry" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("address.local.country")}
                  id="localCountry"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.local?.country 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter country"
                  disabled={isViewMode}
                />
                {errors.address?.local?.country && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.local.country.message}
                  </p>
                )}
              </div>
              <div className="group">
                <Label htmlFor="localState" className="text-sm font-semibold text-gray-700 mb-2 block">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("address.local.state")}
                  id="localState"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.local?.state 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter state"
                  disabled={isViewMode}
                />
                {errors.address?.local?.state && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.local.state.message}
                  </p>
                )}
              </div>
              <div className="group">
                <Label htmlFor="localCity" className="text-sm font-semibold text-gray-700 mb-2 block">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("address.local.city")}
                  id="localCity"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.local?.city 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter city"
                  disabled={isViewMode}
                />
                {errors.address?.local?.city && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.local.city.message}
                  </p>
                )}
              </div>
              <div className="group">
                <Label htmlFor="localDistrict" className="text-sm font-semibold text-gray-700 mb-2 block">
                  District
                </Label>
                <Input
                  {...register("address.local.district")}
                  id="localDistrict"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`}
                  placeholder="Enter district"
                  disabled={isViewMode}
                />
              </div>
              <div className="group">
                <Label htmlFor="localPincode" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Pincode
                </Label>
                <Input
                  value={watchedValues.address?.local?.pincode || ''}
                  onChange={(e) => {
                    const formattedValue = formatPincode(e.target.value);
                    setValue("address.local.pincode", formattedValue);
                  }}
                  id="localPincode"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.local?.pincode 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                  disabled={isViewMode}
                />
                {errors.address?.local?.pincode && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.local.pincode.message}
                  </p>
                )}
                {!errors.address?.local?.pincode && (
                  <p className="text-gray-500 text-xs mt-1">Enter 6-digit pincode (optional)</p>
                )}
              </div>
              <div className="group">
                <Label htmlFor="localContactNumber" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Contact Number
                </Label>
                <Input
                  value={watchedValues.address?.local?.contactNumber || ''}
                  onChange={(e) => {
                    const formattedValue = formatPhoneNumber(e.target.value);
                    setValue("address.local.contactNumber", formattedValue);
                  }}
                  id="localContactNumber"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.local?.contactNumber 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter 10-digit contact number"
                  maxLength={10}
                  disabled={isViewMode}
                />
                {errors.address?.local?.contactNumber && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.local.contactNumber.message}
                  </p>
                )}
                {!errors.address?.local?.contactNumber && (
                  <p className="text-gray-500 text-xs mt-1">Enter 10-digit phone number (optional)</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Corporate Address Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Corporate Address
              </h3>
              {!isViewMode && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="copyLocalToCorporate"
                    checked={copyLocalToCorporate}
                    onCheckedChange={(checked) => {
                      setCopyLocalToCorporate(checked as boolean)
                      if (checked) {
                        handleCopyLocalToCorporate()
                      } else {
                        // Clear corporate address fields when unchecked
                        setValue("address.corporate.addressLine1", "")
                        setValue("address.corporate.addressLine2", "")
                        setValue("address.corporate.country", "")
                        setValue("address.corporate.state", "")
                        setValue("address.corporate.city", "")
                        setValue("address.corporate.district", "")
                        setValue("address.corporate.pincode", "")
                        setValue("address.corporate.contactNumber", "")
                      }
                    }}
                  />
                  <Label 
                    htmlFor="copyLocalToCorporate" 
                    className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4 text-blue-600" />
                    Copy Local Address as Corporate Address
                  </Label>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                <Label htmlFor="corporateAddressLine1" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Address Line 1 <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("address.corporate.addressLine1")}
                  id="corporateAddressLine1"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode || copyLocalToCorporate
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.corporate?.addressLine1 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder={copyLocalToCorporate ? "Auto-filled from local address" : "Enter address line 1"}
                  disabled={isViewMode || copyLocalToCorporate}
                />
                {errors.address?.corporate?.addressLine1 && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.corporate.addressLine1.message}
                  </p>
                )}
              </div>
              <div className="group">
                <Label htmlFor="corporateAddressLine2" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Address Line 2
                </Label>
                <Input
                  {...register("address.corporate.addressLine2")}
                  id="corporateAddressLine2"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode || copyLocalToCorporate
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`}
                  placeholder={copyLocalToCorporate ? "Auto-filled from local address" : "Enter address line 2"}
                  disabled={isViewMode || copyLocalToCorporate}
                />
              </div>
              <div className="group">
                <Label htmlFor="corporateCountry" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("address.corporate.country")}
                  id="corporateCountry"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode || copyLocalToCorporate
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.corporate?.country 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder={copyLocalToCorporate ? "Auto-filled from local address" : "Enter country"}
                  disabled={isViewMode || copyLocalToCorporate}
                />
                {errors.address?.corporate?.country && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.corporate.country.message}
                  </p>
                )}
              </div>
              <div className="group">
                <Label htmlFor="corporateState" className="text-sm font-semibold text-gray-700 mb-2 block">
                  State <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("address.corporate.state")}
                  id="corporateState"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode || copyLocalToCorporate
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.corporate?.state 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder={copyLocalToCorporate ? "Auto-filled from local address" : "Enter state"}
                  disabled={isViewMode || copyLocalToCorporate}
                />
                {errors.address?.corporate?.state && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.corporate.state.message}
                  </p>
                )}
              </div>
              <div className="group">
                <Label htmlFor="corporateCity" className="text-sm font-semibold text-gray-700 mb-2 block">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("address.corporate.city")}
                  id="corporateCity"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode || copyLocalToCorporate
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.corporate?.city 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder={copyLocalToCorporate ? "Auto-filled from local address" : "Enter city"}
                  disabled={isViewMode || copyLocalToCorporate}
                />
                {errors.address?.corporate?.city && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.corporate.city.message}
                  </p>
                )}
              </div>
              <div className="group">
                <Label htmlFor="corporateDistrict" className="text-sm font-semibold text-gray-700 mb-2 block">
                  District
                </Label>
                <Input
                  {...register("address.corporate.district")}
                  id="corporateDistrict"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode || copyLocalToCorporate
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`}
                  placeholder={copyLocalToCorporate ? "Auto-filled from local address" : "Enter district"}
                  disabled={isViewMode || copyLocalToCorporate}
                />
              </div>
              <div className="group">
                <Label htmlFor="corporatePincode" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Pincode
                </Label>
                <Input
                  value={watchedValues.address?.corporate?.pincode || ''}
                  onChange={(e) => {
                    const formattedValue = formatPincode(e.target.value);
                    setValue("address.corporate.pincode", formattedValue);
                  }}
                  id="corporatePincode"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode || copyLocalToCorporate
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.corporate?.pincode 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder={copyLocalToCorporate ? "Auto-filled from local address" : "Enter 6-digit pincode"}
                  maxLength={6}
                  disabled={isViewMode || copyLocalToCorporate}
                />
                {errors.address?.corporate?.pincode && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.corporate.pincode.message}
                  </p>
                )}
                {!errors.address?.corporate?.pincode && (
                  <p className="text-gray-500 text-xs mt-1">Enter 6-digit pincode (optional)</p>
                )}
              </div>
              <div className="group">
                <Label htmlFor="corporateContactNumber" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Contact Number
                </Label>
                <Input
                  value={watchedValues.address?.corporate?.contactNumber || ''}
                  onChange={(e) => {
                    const formattedValue = formatPhoneNumber(e.target.value);
                    setValue("address.corporate.contactNumber", formattedValue);
                  }}
                  id="corporateContactNumber"
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode || copyLocalToCorporate
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.address?.corporate?.contactNumber 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder={copyLocalToCorporate ? "Auto-filled from local address" : "Enter 10-digit contact number"}
                  maxLength={10}
                  disabled={isViewMode || copyLocalToCorporate}
                />
                {errors.address?.corporate?.contactNumber && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.address.corporate.contactNumber.message}
                  </p>
                )}
                {!errors.address?.corporate?.contactNumber && (
                  <p className="text-gray-500 text-xs mt-1">Enter 10-digit phone number (optional)</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            {onPreviousTab && (
              <Button
                type="button"
                variant="outline"
                onClick={onPreviousTab}
                className="px-6 py-3 h-12 rounded-xl border-2 border-gray-300 hover:bg-gray-50 bg-transparent text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {/* {!isViewMode && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="px-6 py-3 h-12 rounded-xl border-2 border-gray-300 hover:bg-gray-50 bg-transparent text-gray-700 hover:text-gray-900 transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Form
              </Button>
            )} */}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {isValid 
                  ? 'Form is valid and ready to continue' 
                  : showErrors 
                    ? 'Please complete all required fields' 
                    : 'Please fill in all required fields'
                }
              </span>
              {!isValid && showErrors && Object.keys(errors).length > 0 && (
                <div className="text-xs text-red-600 ml-2">
                  Errors: {Object.keys(errors).join(', ')}
                </div>
              )}
            </div>
            
            {!isViewMode && (
              <>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={postLoading}
                  className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg text-white font-medium transition-all duration-300"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleContinue}
                  className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300"
                >
                  Continue
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={successPopupData.title}
        message={successPopupData.message}
      />
    </Card>
  )
} 