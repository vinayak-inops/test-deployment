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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Button } from "@repo/ui/components/ui/button"
import { SuccessPopup } from "@/components/success-popup"
import { Separator } from "@repo/ui/components/ui/separator"
import { Building2, ArrowRight, ArrowLeft, RotateCcw, X } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// Validation schema with nested structure
const companyDetailsSchema = z.object({
  typeOfCompany: z.string().min(1, "Type of company is required"),
  workType: z.object({
    workTypeCode: z.string().optional().default(""),
    workTypeTitle: z.string().optional().default(""),
  }),
  areaOfWork: z.object({
    areaOfWorkCode: z.string().optional().default(""),
    areaOfWorkTitle: z.string().optional().default(""),
  }),
})

type CompanyDetailsFormData = z.infer<typeof companyDetailsSchema>

interface CompanyDetailsFormProps {
  formData: any
  onFormDataChange: (data: Partial<CompanyDetailsFormData>) => void
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  auditStatus?: any
  auditStatusFormData?: any
  setAuditStatus?: (data: any) => void
  setAuditStatusFormData?: (data: any) => void
  activeTab?: string
}

export function CompanyDetailsForm({ 
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
}: CompanyDetailsFormProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const tenantCode = useGetTenantCode()
  
  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const currentMode = (modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add";

  const isViewMode = currentMode === "view"


  const {
    register,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
    trigger,
  } = useForm<CompanyDetailsFormData>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      typeOfCompany: "",
      workType: {
        workTypeCode: "",
        workTypeTitle: "",
      },
      areaOfWork: {
        areaOfWorkCode: "",
        areaOfWorkTitle: "",
      },
    },
    mode: "onChange",
  })

  const watchedValues = watch()

  // Update form values based on mode
  useEffect(() => {
      // In add mode, get values from auditStatusFormData
      if (auditStatusFormData) {
        setValue("typeOfCompany", auditStatusFormData.typeOfCompany || "");
        setValue("workType.workTypeCode", auditStatusFormData.workType?.workTypeCode || auditStatusFormData.workTypeCode || "");
        setValue("workType.workTypeTitle", auditStatusFormData.workType?.workTypeTitle || auditStatusFormData.workTypeTitle || "");
        setValue("areaOfWork.areaOfWorkCode", auditStatusFormData.areaOfWork?.areaOfWorkCode || auditStatusFormData.areaOfWorkCode || "");
        setValue("areaOfWork.areaOfWorkTitle", auditStatusFormData.areaOfWork?.areaOfWorkTitle || auditStatusFormData.areaOfWorkTitle || "");
      }
    
    
    // Trigger validation after setting all values
    setTimeout(() => {
      trigger();
    }, 100);
  }, [auditStatusFormData, currentMode, setValue, trigger]);

  // Specific effect to watch auditStatusFormData changes in add mode
  useEffect(() => {
    if (currentMode === "add" && auditStatusFormData) {
      // Force reset the form with auditStatusFormData values
      reset({
        typeOfCompany: auditStatusFormData.typeOfCompany || "",
        workType: {
          workTypeCode: auditStatusFormData.workType?.workTypeCode || auditStatusFormData.workTypeCode || "",
          workTypeTitle: auditStatusFormData.workType?.workTypeTitle || auditStatusFormData.workTypeTitle || "",
        },
        areaOfWork: {
          areaOfWorkCode: auditStatusFormData.areaOfWork?.areaOfWorkCode || auditStatusFormData.areaOfWorkCode || "",
          areaOfWorkTitle: auditStatusFormData.areaOfWork?.areaOfWorkTitle || auditStatusFormData.areaOfWorkTitle || "",
        },
      });
      
      // Trigger validation after setting values
      setTimeout(() => {
        trigger();
      }, 100);
    }
  }, [auditStatusFormData, currentMode, reset, trigger]);

  // Effect to handle tab navigation in add mode
  useEffect(() => {
    if (currentMode === "add" && auditStatusFormData && activeTab === "company-details") {
      // When navigating back to this tab, ensure form is properly populated
      reset({
        typeOfCompany: auditStatusFormData.typeOfCompany || "",
        workType: {
          workTypeCode: auditStatusFormData.workType?.workTypeCode || auditStatusFormData.workTypeCode || "",
          workTypeTitle: auditStatusFormData.workType?.workTypeTitle || auditStatusFormData.workTypeTitle || "",
        },
        areaOfWork: {
          areaOfWorkCode: auditStatusFormData.areaOfWork?.areaOfWorkCode || auditStatusFormData.areaOfWorkCode || "",
          areaOfWorkTitle: auditStatusFormData.areaOfWork?.areaOfWorkTitle || auditStatusFormData.areaOfWorkTitle || "",
        },
      });
      
      // Trigger validation after setting values
      setTimeout(() => {
        trigger();
      }, 100);
    }
  }, [activeTab, currentMode, auditStatusFormData, reset, trigger]);

  const handleInputChange = async (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setValue(`${parent}.${child}` as any, value)
    } else {
      setValue(field as any, value)
    }
    await trigger()
    
    // Update form data for parent component with only the exact fields
    const currentValues = watch()
    const exactData = {
      typeOfCompany: currentValues.typeOfCompany || "",
      workType: {
        workTypeCode: currentValues.workType.workTypeCode || "",
        workTypeTitle: currentValues.workType.workTypeTitle || "",
      },
      areaOfWork: {
        areaOfWorkCode: currentValues.areaOfWork.areaOfWorkCode || "",
        areaOfWorkTitle: currentValues.areaOfWork.areaOfWorkTitle || "",
      },
    }
    
    // In add mode, update auditStatusFormData; in edit/view mode, update parent formData
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...exactData
      })
    } else {
      onFormDataChange(exactData)
    }
  }

  // API call for saving company details
  const {
    post: postCompanyDetails,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "contractor",
    onSuccess: (data) => {
      setSuccessPopupData({
        title: "Company Details Saved",
        message: "Company details have been saved successfully."
      })
      setShowSuccessPopup(true)
    },
    onError: (error) => {
      console.error("Error saving company details:", error)
    },
  })

  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    const isValid = await trigger()
    
    // Debug: Log all form values and errors
    const formValues = watch()
    // Check which specific fields are failing validation
    const requiredFields = [
      'typeOfCompany', 'workType.workTypeCode', 'workType.workTypeTitle', 
      'areaOfWork.areaOfWorkCode', 'areaOfWork.areaOfWorkTitle'
    ]
    
    const failingFields = requiredFields.filter(field => {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj: any, key) => obj?.[key], formValues)
        : (formValues as any)[field]
      return !value || (typeof value === 'string' && value.trim() === '')
    })
    

    if (isValid) {
      const formValues = watch()
      
      // Create the exact JSON structure as requested
      const exactData = {
        typeOfCompany: formValues.typeOfCompany || "",
        workType: {
          workTypeCode: formValues.workType.workTypeCode || "",
          workTypeTitle: formValues.workType.workTypeTitle || "",
        },
        areaOfWork: {
          areaOfWorkCode: formValues.areaOfWork.areaOfWorkCode || "",
          areaOfWorkTitle: formValues.areaOfWork.areaOfWorkTitle || "",
        },
      }
      
      // Update form data based on mode
      if (currentMode === "add") {
        setAuditStatusFormData?.({
          ...auditStatusFormData,
          ...exactData,
        })
        setAuditStatus?.({
          ...auditStatus,
          companyDetails:true
        })
        setSuccessPopupData({
          title: "Company Details Saved",
          message: "Company details have been saved successfully."
        })
        setShowSuccessPopup(true)
      } else if (currentMode === "edit") {
        // In edit mode, update parent formData and save to backend
        onFormDataChange(exactData)
        let json = {
          tenant: tenantCode,
          action: "insert",
          id: auditStatusFormData._id || null,
          collectionName: "contractor",
          data: {
            ...auditStatusFormData,
            ...exactData,
            companyDetails: true
          }
        }
        postCompanyDetails(json)
      } else {
        // In view mode, just update parent formData
        onFormDataChange(exactData)
      }
    } else {
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
    reset({
      typeOfCompany: "",
      workType: {
        workTypeCode: "",
        workTypeTitle: "",
      },
      areaOfWork: {
        areaOfWorkCode: "",
        areaOfWorkTitle: "",
      },
    })
    setShowErrors(false)
    
    // Clear only the exact fields that should be submitted
    const clearedData = {
      typeOfCompany: "",
      workType: {
        workTypeCode: "",
        workTypeTitle: "",
      },
      areaOfWork: {
        areaOfWorkCode: "",
        areaOfWorkTitle: "",
      },
    }
    
    // In add mode, update auditStatusFormData; in edit/view mode, update parent formData
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...clearedData
      })
    } else {
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
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Company Details</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Company type, work classification, and business details
                </CardDescription>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {/* {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-blue-600 text-lg">Loading company details...</div>
          </div>
        )}
        {contractorError && (
          <div className="flex items-center justify-center py-8">
            <div className="text-red-600 text-lg">Error loading data: {contractorError.message}</div>
          </div>
        )} */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Company Information */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                <Label htmlFor="typeOfCompany" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Type of Company <span className="text-red-500">*</span>
                </Label>
                <Select
                  key={`typeOfCompany-${watchedValues.typeOfCompany || 'empty'}`}
                  value={watchedValues.typeOfCompany || ""}
                  onValueChange={async (value) => {
                    setValue("typeOfCompany", value)
                    await trigger("typeOfCompany")
                    
                    // Update form data for parent component with only the exact fields
                    const currentValues = watch()
                    const exactData = {
                      typeOfCompany: currentValues.typeOfCompany || "",
                      workType: {
                        workTypeCode: currentValues.workType.workTypeCode || "",
                        workTypeTitle: currentValues.workType.workTypeTitle || "",
                      },
                      areaOfWork: {
                        areaOfWorkCode: currentValues.areaOfWork.areaOfWorkCode || "",
                        areaOfWorkTitle: currentValues.areaOfWork.areaOfWorkTitle || "",
                      },
                    }
                    
                    // In add mode, update auditStatusFormData; in edit/view mode, update parent formData
                    if (currentMode === "add") {
                      setAuditStatusFormData?.({
                        ...auditStatusFormData,
                        ...exactData
                      })
                    } else {
                      onFormDataChange(exactData)
                    }
                  }}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    showErrors && errors.typeOfCompany 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}>
                    <SelectValue placeholder="Select company type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                    <SelectItem value="Partnership">Partnership</SelectItem>
                    <SelectItem value="Private Limited">Private Limited</SelectItem>
                    <SelectItem value="Public Limited">Public Limited</SelectItem>
                    <SelectItem value="LLP">LLP</SelectItem>
                  </SelectContent>
                </Select>
                {showErrors && errors.typeOfCompany && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.typeOfCompany.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator className="lg:col-span-3 my-2" />

          {/* Work Type */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Work Type
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                <Label htmlFor="workTypeCode" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Work Type Code
                </Label>
                <Input
                  {...register("workType.workTypeCode")}
                  id="workTypeCode"
                  value={watchedValues.workType.workTypeCode}
                  onChange={(e) => handleInputChange("workType.workTypeCode", e.target.value)}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`}
                  placeholder="Enter work type code"
                  disabled={isViewMode}
                />

              </div>
              <div className="group">
                <Label htmlFor="workTypeTitle" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Work Type Title
                </Label>
                <Input
                  {...register("workType.workTypeTitle")}
                  id="workTypeTitle"
                  value={watchedValues.workType.workTypeTitle}
                  onChange={(e) => handleInputChange("workType.workTypeTitle", e.target.value)}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`}
                  placeholder="Enter work type title"
                  disabled={isViewMode}
                />

              </div>
            </div>
          </div>

          <Separator className="lg:col-span-3 my-2" />

          {/* Area of Work */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Area of Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                                 <Label htmlFor="areaOfWorkCode" className="text-sm font-semibold text-gray-700 mb-2 block">
                   Area of Work Code
                 </Label>
                <Input
                  {...register("areaOfWork.areaOfWorkCode")}
                  id="areaOfWorkCode"
                  value={watchedValues.areaOfWork.areaOfWorkCode}
                  onChange={(e) => handleInputChange("areaOfWork.areaOfWorkCode", e.target.value)}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`}
                  placeholder="Enter area of work code"
                  disabled={isViewMode}
                />
                
              </div>
              <div className="group">
                                 <Label htmlFor="areaOfWorkTitle" className="text-sm font-semibold text-gray-700 mb-2 block">
                   Area of Work Title
                 </Label>
                <Input
                  {...register("areaOfWork.areaOfWorkTitle")}
                  id="areaOfWorkTitle"
                  value={watchedValues.areaOfWork.areaOfWorkTitle}
                  onChange={(e) => handleInputChange("areaOfWork.areaOfWorkTitle", e.target.value)}
                                     className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                     isViewMode 
                       ? "bg-gray-100 cursor-not-allowed" 
                       : ""
                   } border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`}
                  placeholder="Enter area of work title"
                  disabled={isViewMode}
                />
                
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
                {isValid ? 'Form is valid and ready to continue' : 'Please complete all required fields'}
              </span>
              {!isValid && showErrors && Object.keys(errors).length > 0 && (
                <div className="text-xs text-red-600 ml-2">Errors: {Object.keys(errors).join(', ')}</div>
              )}
            </div>
            {!isViewMode && (
              <>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={postLoading}
                  className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg text-white font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {postLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      Save
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleContinue}
                  className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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