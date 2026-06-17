"use client"

import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Switch } from "@repo/ui/components/ui/switch"
import { Separator } from "@repo/ui/components/ui/separator"
import { Button } from "@repo/ui/components/ui/button"
import { Wallet, RotateCcw, ArrowRight, ArrowLeft, Minus, Clock, Calendar, Percent, X } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useSearchParams } from "next/navigation"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

import type { LeavePolicyData, LeavePolicyDataCompat } from "../types/leave-policy.types"



// Zod Schema for validation
const balanceManagementSchema = z.object({
  balanceValidation: z.boolean().default(false),
  allowedNegativeBalance: z.number().min(0, "Allowed negative balance must be 0 or greater").default(0),
  minServicePeriodRequired: z.number().min(0, "Minimum service period must be 0 or greater").default(0), 
  lapseLeaveBalanceAtYearEnd: z.string().default(""),
  maximumBalanceAllowed: z.number().min(0, "Maximum balance must be 0 or greater").default(0)
})

type BalanceManagementFormData = z.infer<typeof balanceManagementSchema>

interface BalanceManagementFormProps {
  formData: LeavePolicyDataCompat
  onFormDataChange: (data: Partial<LeavePolicyData>) => void
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  auditStatus?: any
  auditStatusFormData?: any
  setAuditStatus?: (status: any) => void
  setAuditStatusFormData?: (data: any) => void
  activeTab?: string
}

export function BalanceManagementForm({ 
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
}: BalanceManagementFormProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const  tenantCode  = useGetTenantCode()
  
  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const currentMode = (modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add";

  const isViewMode = currentMode === "view"
  // Determine if form is read-only based on mode
  const isReadOnly = isViewMode

  // Determine which form data to use based on mode
  const currentFormData = mode === "add" ? auditStatusFormData : formData;

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
  } = useForm<BalanceManagementFormData>({
    resolver: zodResolver(balanceManagementSchema),
    defaultValues: {
      balanceValidation: false,
      allowedNegativeBalance: 0,
      minServicePeriodRequired: 0,
      lapseLeaveBalanceAtYearEnd: "",
      maximumBalanceAllowed: 0
    },
    mode: "onChange",
  })

  const handleInputChange = useCallback(async (field: keyof BalanceManagementFormData, value: any) => {
    setValue(field, value)
    await trigger(field)
    
    // Update form data based on mode
    const currentValues = watch()
    
    // Create nested leavePolicy structure
    const nestedData = {
      leavePolicy: {
        balance: {
          ...currentValues
        }
      }
    }
    
    if (mode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...nestedData
      })
    } else {
      onFormDataChange(nestedData as Partial<LeavePolicyData>)
    }
  }, [mode, auditStatusFormData, setAuditStatusFormData, onFormDataChange, setValue, trigger, watch])

  const handleFormDataChange = useCallback((field: keyof LeavePolicyData, value: any) => {
    onFormDataChange({ [field]: value });
  }, []);

  const {
    post: postLeavePolicy,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "leave_policy",
    onSuccess: (data) => {
      setSuccessPopupData({
        title: "Balance Management Saved",
        message: "Your balance management settings have been successfully saved. You can now continue to the next section or make additional changes."
      })
      setShowSuccessPopup(true)
    },
    onError: (error) => {
      console.error("Error saving balance management:", error)
    },
  });

  // Handle save and continue functionality
  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    const isValid = await trigger()
    
    if (isValid) {
      const formValues = watch()
      
      // Create nested leavePolicy structure
      const nestedData = {
        leavePolicy: {
          ...auditStatusFormData.leavePolicy,
          balance: {
            ...formValues
          }
        }
      }
      
      if (mode === "add") {
        // Update audit status to mark this tab as completed
        setAuditStatus?.({
          ...auditStatus,
          balanceManagement: true
        })
        
        // Update audit status form data with nested structure
        setAuditStatusFormData?.({
          ...auditStatusFormData,
          ...nestedData
        })
        
        // Show success popup
        setSuccessPopupData({
          title: "Balance Management Saved",
          message: "Your balance management settings have been successfully saved. You can continue to the next section."
        })
        setShowSuccessPopup(true)
      } else {
        // In edit mode, update the form data and let parent component handle the final submission
        // This maintains consistency with add mode behavior
        setAuditStatusFormData?.({
          ...auditStatusFormData,
          ...nestedData
        })
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
      }
      
      // Form is valid, proceed to next tab
      if (onNextTab) {
        onNextTab()
      }
    } else {
    }
  }

  // Handle reset functionality
  const handleReset = () => {
    const clearedData = {
      balanceValidation: false,
      allowedNegativeBalance: 0,
      minServicePeriodRequired: 0,
      maximumBalanceAllowed: 0,
      lapseLeaveBalanceAtYearEnd: ""
    }
    
    reset(clearedData as any)
    setShowErrors(false)
    
    if (mode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        leavePolicy: {
          ...auditStatusFormData?.leavePolicy,
          balance: clearedData
        }
      })
    } else {
      // Create nested leavePolicy structure
      const nestedData = {
        leavePolicy: {
          balance: {
            ...clearedData
          }
        }
      }
      onFormDataChange(nestedData as any)
    }
  }

  // Unified effect to handle form data updates for all modes
  useEffect(() => {
    
    if (currentMode === "add" && auditStatusFormData) {
      const balanceData = auditStatusFormData?.leavePolicy?.balance || auditStatusFormData;
      setValue("balanceValidation", balanceData?.balanceValidation ?? false);
      setValue("allowedNegativeBalance", balanceData?.allowedNegativeBalance ?? 0);
      setValue("minServicePeriodRequired", balanceData?.minServicePeriodRequired ?? 0);
      setValue("lapseLeaveBalanceAtYearEnd", balanceData?.lapseLeaveBalanceAtYearEnd ?? "");
      setValue("maximumBalanceAllowed", balanceData?.maximumBalanceAllowed ?? 0);
    } else if ((currentMode === "edit" || currentMode === "view") && formData) {
      const balanceData = formData?.leavePolicy?.balance || formData;
      setValue("balanceValidation", balanceData?.balanceValidation ?? false);
      setValue("allowedNegativeBalance", balanceData?.allowedNegativeBalance ?? 0);
      setValue("minServicePeriodRequired", balanceData?.minServicePeriodRequired ?? 0);
      setValue("lapseLeaveBalanceAtYearEnd", balanceData?.lapseLeaveBalanceAtYearEnd ?? "");
      setValue("maximumBalanceAllowed", balanceData?.maximumBalanceAllowed ?? 0);
    }
  }, [currentMode, formData, auditStatusFormData, setValue]);

  // Update form values when leavePolicyResponse changes (only in edit/view mode)
  useEffect(() => {
    if ((currentMode === "edit" || currentMode === "view") && leavePolicyResponse && leavePolicyResponse[0]) {
      const policyData = leavePolicyResponse[0];
      const balanceData = policyData.leavePolicy?.balance || policyData;
      
      setValue("balanceValidation", balanceData?.balanceValidation ?? false);
      setValue("allowedNegativeBalance", balanceData?.allowedNegativeBalance ?? 0);
      setValue("minServicePeriodRequired", balanceData?.minServicePeriodRequired ?? 0);
      setValue("lapseLeaveBalanceAtYearEnd", balanceData?.lapseLeaveBalanceAtYearEnd ?? "");
      setValue("maximumBalanceAllowed", balanceData?.maximumBalanceAllowed ?? 0);
    }
  }, [leavePolicyResponse, setValue, currentMode]);

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
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Balance Management</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Configure leave balance validation and management policies
                </CardDescription>
                {showErrors && errors.balanceValidation && (
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
        {/* Balance Validation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Balance Validation Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${watchedValues.balanceValidation ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Balance Validation
                </Label>
                <p className="text-xs text-blue-700">Enable balance validation for leave applications</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${watchedValues.balanceValidation ? 'text-green-600' : 'text-gray-500'}`}>
                  {watchedValues.balanceValidation ? 'Enabled' : 'Disabled'}
                </span>
                <Switch
                  checked={Boolean(watchedValues.balanceValidation)}
                  onCheckedChange={(checked) => handleInputChange('balanceValidation', checked)}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                  disabled={isReadOnly}
                />
              </div>
            </div>
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <Label htmlFor="allowedNegativeBalance" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Minus className="w-4 h-4 text-blue-600" />
                Allowed Negative Balance
              </Label>
              <Input
                id="allowedNegativeBalance"
                type="number"
                value={watchedValues.allowedNegativeBalance || ''}
                onChange={(e) => handleInputChange('allowedNegativeBalance', e.target.value === '' ? undefined : Number.parseInt(e.target.value))}
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.allowedNegativeBalance) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="0"
                disabled={isReadOnly}
              />
              <p className="text-xs text-gray-500">Maximum negative balance allowed in days</p>
              {showErrors && errors.allowedNegativeBalance && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.allowedNegativeBalance.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Service Period and Balance Limits */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Service Period and Balance Limits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <Label htmlFor="minServicePeriodRequired" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Minimum Service Period Required (Days)
              </Label>
              <Input
                id="minServicePeriodRequired"
                type="number"
                value={watchedValues.minServicePeriodRequired || ''}
                onChange={(e) => handleInputChange('minServicePeriodRequired', e.target.value === '' ? undefined : Number.parseInt(e.target.value))}
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.minServicePeriodRequired) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="0"
                disabled={isReadOnly}
              />
              <p className="text-xs text-gray-500">Minimum service period required for balance accrual</p>
              {showErrors && errors.minServicePeriodRequired && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.minServicePeriodRequired.message}
                </p>
              )}
            </div>
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <Label htmlFor="maximumBalanceAllowed" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Maximum Balance Allowed (Days)
              </Label>
              <Input
                id="maximumBalanceAllowed"
                type="number"
                value={watchedValues.maximumBalanceAllowed || ''}
                onChange={(e) => handleInputChange('maximumBalanceAllowed', e.target.value === '' ? undefined : Number.parseInt(e.target.value))}
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.maximumBalanceAllowed) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="0"
                disabled={isReadOnly}
              />
              <p className="text-xs text-gray-500">Maximum leave balance allowed to accumulate</p>
              {showErrors && errors.maximumBalanceAllowed && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.maximumBalanceAllowed.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Balance Lapse Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Balance Lapse Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <Label htmlFor="lapseLeaveBalanceAtYearEnd" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-600" />
                Lapse Leave Balance at Year End
              </Label>
              <Input
                id="lapseLeaveBalanceAtYearEnd"
                type="text"
                value={watchedValues.lapseLeaveBalanceAtYearEnd || ""}
                onChange={(e) => handleInputChange('lapseLeaveBalanceAtYearEnd', e.target.value)}
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.lapseLeaveBalanceAtYearEnd) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="e.g., 25%, 50%, 100%"
                disabled={isReadOnly}
              />
              <p className="text-xs text-gray-500">Percentage of leave balance that lapses at year end</p>
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
                      <Wallet className="h-4 w-4" />
                      Save
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