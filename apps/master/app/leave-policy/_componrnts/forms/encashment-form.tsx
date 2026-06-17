"use client"

import type React from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Switch } from "@repo/ui/components/ui/switch"
import { Separator } from "@repo/ui/components/ui/separator"
import { Button } from "@repo/ui/components/ui/button"
import { BarChart3, RotateCcw, ArrowRight, ArrowLeft, DollarSign, Calendar, Hash, FileText, X, CheckCircle } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useSearchParams, useRouter } from "next/navigation"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

import type { LeavePolicyData, LeavePolicyDataCompat } from "../types/leave-policy.types"

// Yup Schema for validation
const encashmentSchema = yup.object({
  encashmentAllowed: yup.boolean().default(false),
  autoEncashment: yup.boolean().default(false),
  minimumBalanceRequired: yup.number().min(0, "Minimum balance required must be 0 or greater").default(0),
  maximumAllowedEncashment: yup.number().min(0, "Maximum allowed encashment must be 0 or greater").default(0),
  applicationRequired: yup.boolean().default(false),
  maximumApplicationAllowedYearly: yup.number().min(0, "Maximum application allowed yearly must be 0 or greater").default(0),
  maximumEncashmentPerApplication: yup.number().min(0, "Maximum encashment per application must be 0 or greater").default(0)
})

type EncashmentFormData = yup.InferType<typeof encashmentSchema>

interface EncashmentFormProps {
  formData?: LeavePolicyDataCompat
  onFormDataChange: (data: Partial<LeavePolicyDataCompat>) => void
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  auditStatus?: any
  auditStatusFormData?: any
  setAuditStatus?: (status: any) => void
  setAuditStatusFormData?: (data: any) => void
  activeTab?: string
}

export function EncashmentForm({ 
  formData, 
  onFormDataChange, 
  onNextTab,
  onPreviousTab,
  mode = "add",
  auditStatus,
  auditStatusFormData,
  setAuditStatus,
  setAuditStatusFormData,
  activeTab
}: EncashmentFormProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const router = useRouter()
  const tenantCode: string = useGetTenantCode()
  
  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  
  // Determine current mode
  const currentMode = mode || ((modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add");
  const isViewMode = currentMode === "view"
  // Determine if form is read-only based on mode
  const isReadOnly = isViewMode

  // Conditional API call - only fetch in edit/view mode when id is available
  const shouldFetchLeavePolicy = (currentMode === "edit" || currentMode === "view") && id;
 

  // Create conditional hook call to prevent unnecessary API calls
  const leavePolicyRequest = useRequest<any>({
    url: 'leave_policy/search',
    method: 'POST',
    data: shouldFetchLeavePolicy ? [
      {
        field: "_id",
        value: id,
        operator: "eq",
      }
    ] : [], // Send empty array when not fetching
    onSuccess: (data) => {
      
    },
    onError: (error) => {
      // Only log error if we should fetch leave policy (ignore errors when we're not supposed to fetch)
      if (shouldFetchLeavePolicy) {
        console.error("Error fetching leave policy data:", error);
      }
    },
    dependencies: shouldFetchLeavePolicy ? [id] : ['no-fetch'] // Use different dependency to prevent fetching
  });

  // Extract values but only use them if we should fetch
  const leavePolicyResponse = shouldFetchLeavePolicy ? leavePolicyRequest.data : null;
  const isLoading = shouldFetchLeavePolicy ? leavePolicyRequest.loading : false;
  const leavePolicyError = shouldFetchLeavePolicy ? leavePolicyRequest.error : null;
  const fetchLeavePolicy = leavePolicyRequest.refetch;

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    reset,
  } = useForm<EncashmentFormData>({
    resolver: yupResolver(encashmentSchema),
    defaultValues: {
      encashmentAllowed: false,
      autoEncashment: false,
      minimumBalanceRequired: 0,
      maximumAllowedEncashment: 0,
      applicationRequired: false,
      maximumApplicationAllowedYearly: 0,
      maximumEncashmentPerApplication: 0
    },
    mode: "onChange",
  })

  const handleInputChange = useCallback(async (field: keyof EncashmentFormData, value: any) => {
    setValue(field, value)
    await trigger(field)
    
    // Update form data based on mode
    const currentValues = watch()
    
    // Create exact data structure matching PersonalInformationForm pattern
    const exactData = {
      encashmentAllowed: currentValues.encashmentAllowed || false,
      autoEncashment: currentValues.autoEncashment || false,
      minimumBalanceRequired: currentValues.minimumBalanceRequired || 0,
      maximumAllowedEncashment: currentValues.maximumAllowedEncashment || 0,
      applicationRequired: currentValues.applicationRequired || false,
      maximumApplicationAllowedYearly: currentValues.maximumApplicationAllowedYearly || 0,
      maximumEncashmentPerApplication: currentValues.maximumEncashmentPerApplication || 0
    }
    
    // Create nested leavePolicy structure
    const nestedData = {
      leavePolicy: {
        encashment: exactData
      }
    }
    
    // In add mode, update auditStatusFormData; in edit/view mode, update parent formData
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...nestedData
      })
    } else {
      onFormDataChange(nestedData as any)
    }
  }, [currentMode, auditStatusFormData, setAuditStatusFormData, onFormDataChange, setValue, trigger, watch])


  const {
    post: postLeavePolicy,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "leave_policy",
    onSuccess: (data) => {
      setSuccessPopupData({
        title: "Encashment Settings Saved",
        message: "Your encashment settings have been successfully saved. You can now continue to the next section or make additional changes."
      })
      setShowSuccessPopup(true)
      // Navigate back to main table page to show updated data
      setTimeout(() => {
        router.push('/leave-policy');
      }, 2000);
    },
    onError: (error) => {
      console.error("Error saving encashment settings:", error)
    },
  });





  // Handle save and continue functionality
  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    const isFormValid = await trigger()
    
    if (isFormValid) {
      const formValues = watch()
      
      // Create exact data structure matching PersonalInformationForm pattern
      const exactData = {
        encashmentAllowed: formValues.encashmentAllowed || false,
        autoEncashment: formValues.autoEncashment || false,
        minimumBalanceRequired: formValues.minimumBalanceRequired || 0,
        maximumAllowedEncashment: formValues.maximumAllowedEncashment || 0,
        applicationRequired: formValues.applicationRequired || false,
        maximumApplicationAllowedYearly: formValues.maximumApplicationAllowedYearly || 0,
        maximumEncashmentPerApplication: formValues.maximumEncashmentPerApplication || 0
      }
      
      // Create nested leavePolicy structure
      const nestedData = {
        leavePolicy: {
          ...auditStatusFormData.leavePolicy,
          encashment: exactData
        }
      }
      
      if (currentMode === "add") {
        // Update audit status to mark this tab as completed
        setAuditStatus?.({
          ...auditStatus,
          encashment: true
        })
        
        // Update audit status form data with nested structure
        setAuditStatusFormData?.({
          ...auditStatusFormData,
          ...nestedData
        })
        
        let json = {
          tenant: tenantCode,
          action: "insert",
          id: auditStatusFormData._id || null,
          collectionName: "leave_policy",
          data: {
            ...auditStatusFormData,
            ...nestedData,
            organizationCode: tenantCode,  
            tenantCode: tenantCode,
            createdOn: new Date().toISOString(),
            createdBy: "System" 
          }
        }
        postLeavePolicy(json)
        // Navigation disabled here to allow popup visibility
      } else if (currentMode === "edit") {
        // In edit mode, update parent formData and save to backend
        onFormDataChange(nestedData as any)
        let json = {
          tenant: tenantCode,
          action: "insert",
          id: auditStatusFormData._id || null,
          collectionName: "leave_policy",
          data: {
            ...auditStatusFormData,
            ...nestedData,
          }
        }
        postLeavePolicy(json)
      } else {
        // In view mode, just update parent formData
        onFormDataChange(nestedData as any)
        if (onNextTab) {
          onNextTab()
        }
      }
      
    } else {
    }
  }



  // Handle reset functionality
  const handleReset = () => {
    const clearedData = {
      encashmentAllowed: false,
      autoEncashment: false,
      minimumBalanceRequired: 0,
      maximumAllowedEncashment: 0,
      applicationRequired: false,
      maximumApplicationAllowedYearly: 0,
      maximumEncashmentPerApplication: 0
    }
    
    reset(clearedData as any)
    setShowErrors(false)
    
    // Create nested leavePolicy structure
    const nestedData = {
      leavePolicy: {
        encashment: clearedData
      }
    }
    
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...nestedData
      })
    } else {
      onFormDataChange(nestedData as any)
    }
  }







  // Helper function to set form values from data
  const setFormValuesFromData = useCallback((data: any) => {
    const policy = data?.leavePolicy || data;
    const encashment = policy?.encashment || policy;
    setValue("encashmentAllowed", encashment?.encashmentAllowed ?? false);
    setValue("autoEncashment", encashment?.autoEncashment ?? false);
    setValue("minimumBalanceRequired", encashment?.minimumBalanceRequired ?? 0);
    setValue("maximumAllowedEncashment", encashment?.maximumAllowedEncashment ?? 0);
    setValue("applicationRequired", encashment?.applicationRequired ?? false);
    setValue("maximumApplicationAllowedYearly", encashment?.maximumApplicationAllowedYearly ?? 0);
    setValue("maximumEncashmentPerApplication", encashment?.maximumEncashmentPerApplication ?? 0);
  }, [setValue]);

  // Update form values based on mode (similar to OrganizationForm)
  useEffect(() => {
    if (currentMode === "add" && auditStatusFormData) {
      setFormValuesFromData(auditStatusFormData);
    } else if (currentMode === "edit" || currentMode === "view") {
      // In edit/view mode, get values from auditStatusFormData (previously formData)
      if (auditStatusFormData) {
        setFormValuesFromData(auditStatusFormData);
      }
    }
  }, [currentMode, auditStatusFormData, setFormValuesFromData]);

  // Update form values when leavePolicyResponse changes (only in edit/view mode)
  useEffect(() => {
    if ((currentMode === "edit" || currentMode === "view") && leavePolicyResponse && leavePolicyResponse[0]) {
      setFormValuesFromData(leavePolicyResponse[0]);
    }
  }, [leavePolicyResponse, setFormValuesFromData, currentMode]);

  const watchedValues = watch()

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
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Encashment Settings</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Configure leave encashment policies and rules
                </CardDescription>
                {showErrors && errors.encashmentAllowed && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-200 text-sm">
                    <X className="h-4 w-4" />
                    <span>Please fix the form errors to continue</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        {/* Encashment Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Encashment Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${watchedValues.encashmentAllowed ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Encashment Allowed
                </Label>
                <p className="text-xs text-blue-700">Allow leave balance to be encashed</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${watchedValues.encashmentAllowed ? 'text-green-600' : 'text-gray-500'}`}>
                  {watchedValues.encashmentAllowed ? 'Enabled' : 'Disabled'}
                </span>
                <Switch
                  checked={watchedValues.encashmentAllowed || false}
                  onCheckedChange={(checked) => handleInputChange('encashmentAllowed', checked)}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                  disabled={isReadOnly}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${watchedValues.autoEncashment ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Auto Encashment
                </Label>
                <p className="text-xs text-blue-700">Automatically encash leave balance</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${watchedValues.autoEncashment ? 'text-green-600' : 'text-gray-500'}`}>
                  {watchedValues.autoEncashment ? 'Enabled' : 'Disabled'}
                </span>
                <Switch
                  checked={watchedValues.autoEncashment || false}
                  onCheckedChange={(checked) => handleInputChange('autoEncashment', checked)}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Encashment Limits */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Encashment Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <Label htmlFor="minimumBalanceRequired" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Minimum Balance Required
              </Label>
              <Input
                id="minimumBalanceRequired"
                type="number"
                value={watchedValues.minimumBalanceRequired || ''}
                onChange={(e) => handleInputChange('minimumBalanceRequired', e.target.value === '' ? undefined : Number.parseInt(e.target.value))}
                className={`h-10 border-2 focus:ring-blue-400/20 rounded-xl ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.minimumBalanceRequired) 
                    ? "border-red-500 focus:border-red-500" 
                    : "border-gray-200 focus:border-blue-400"
                }`}
                placeholder="0"
                disabled={isReadOnly}
              />
              <p className="text-xs text-gray-500">Minimum leave balance required for encashment</p>
              {showErrors && errors.minimumBalanceRequired && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.minimumBalanceRequired.message}
                </p>
              )}
            </div>
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <Label htmlFor="maximumAllowedEncashment" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Maximum Allowed Encashment
              </Label>
              <Input
                id="maximumAllowedEncashment"
                type="number"
                value={watchedValues.maximumAllowedEncashment || ''}
                onChange={(e) => handleInputChange('maximumAllowedEncashment', e.target.value === '' ? undefined : Number.parseInt(e.target.value))}
                className={`h-10 border-2 focus:ring-blue-400/20 rounded-xl ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.maximumAllowedEncashment) 
                    ? "border-red-500 focus:border-red-500" 
                    : "border-gray-200 focus:border-blue-400"
                }`}
                placeholder="0"
                disabled={isReadOnly}
              />
              <p className="text-xs text-gray-500">Maximum days that can be encashed</p>
              {showErrors && errors.maximumAllowedEncashment && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.maximumAllowedEncashment.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Application Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Application Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${watchedValues.applicationRequired ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Application Required
                </Label>
                <p className="text-xs text-blue-700">Require application for encashment</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${watchedValues.applicationRequired ? 'text-green-600' : 'text-gray-500'}`}>
                  {watchedValues.applicationRequired ? 'Enabled' : 'Disabled'}
                </span>
                <Switch
                  checked={watchedValues.applicationRequired || false}
                  onCheckedChange={(checked) => handleInputChange('applicationRequired', checked)}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                  disabled={isReadOnly}
                />
              </div>
            </div>
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <Label htmlFor="maximumApplicationAllowedYearly" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600" />
                Maximum Application Allowed Yearly
              </Label>
              <Input
                id="maximumApplicationAllowedYearly"
                type="number"
                value={watchedValues.maximumApplicationAllowedYearly || ''}
                onChange={(e) => handleInputChange('maximumApplicationAllowedYearly', e.target.value === '' ? undefined : Number.parseInt(e.target.value))}
                className={`h-10 border-2 focus:ring-blue-400/20 rounded-xl ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.maximumApplicationAllowedYearly) 
                    ? "border-red-500 focus:border-red-500" 
                    : "border-gray-200 focus:border-blue-400"
                }`}
                placeholder="0"
                disabled={isReadOnly}
              />
              <p className="text-xs text-gray-500">Maximum encashment applications per year</p>
              {showErrors && errors.maximumApplicationAllowedYearly && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.maximumApplicationAllowedYearly.message}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
            <Label htmlFor="maximumEncashmentPerApplication" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Maximum Encashment Per Application
            </Label>
            <Input
              id="maximumEncashmentPerApplication"
              type="number"
              value={watchedValues.maximumEncashmentPerApplication || ''}
              onChange={(e) => handleInputChange('maximumEncashmentPerApplication', e.target.value === '' ? undefined : Number.parseInt(e.target.value))}
              className={`h-10 border-2 focus:ring-blue-400/20 rounded-xl ${
                isReadOnly 
                  ? "bg-gray-100 cursor-not-allowed" 
                  : ""
              } ${
                (showErrors && errors.maximumEncashmentPerApplication) 
                  ? "border-red-500 focus:border-red-500" 
                  : "border-gray-200 focus:border-blue-400"
              }`}
              placeholder="0"
              disabled={isReadOnly}
            />
            <p className="text-xs text-gray-500">Maximum days that can be encashed per application</p>
            {showErrors && errors.maximumEncashmentPerApplication && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <X className="h-3 w-3" />
                {errors.maximumEncashmentPerApplication.message}
              </p>
            )}
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
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {isValid ? 'Form is valid and ready to continue' : 'Please complete all required fields'}
              </span>
              {!isValid && showErrors && Object.keys(errors).length > 0 && (
                <div className="text-xs text-red-600 ml-2">
                  Errors: {Object.keys(errors).join(', ')}
                </div>
              )}
            </div>
            
            {!isReadOnly && (
              <>
                <Button
                  type="button"
                  onClick={handleSaveAndContinue}
                  disabled={postLoading}
                  className="px-6 py-3 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg text-white font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {postLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Submit
                    </>
                  )}
                </Button>
                {onNextTab && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowErrors(true)
                      if (isValid && onNextTab) {
                        onNextTab()
                      }
                    }}
                    className="px-6 py-3 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </Button>
                )}
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