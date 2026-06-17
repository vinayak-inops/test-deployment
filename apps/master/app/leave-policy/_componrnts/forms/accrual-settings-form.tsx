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
import { Badge } from "@repo/ui/components/ui/badge"
import { Separator } from "@repo/ui/components/ui/separator"
import { Button } from "@repo/ui/components/ui/button"
import { Clock, RotateCcw, ArrowRight, ArrowLeft, Calendar, Hash, Type, Plus, Minus, X } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useSearchParams } from "next/navigation"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

import type { LeavePolicyData, LeavePolicyDataCompat } from "../types/leave-policy.types"

// Yup Schema for validation
const accrualSettingsSchema = yup.object({
  reminderFrequencyToApprover: yup.number().min(0, "Reminder frequency must be 0 or greater").default(0),
  leaveAccrual: yup.object({
    accrualType: yup.string().default(""),
    dayId: yup.number().min(0, "Day ID must be 0 or greater").default(0),
    accrualPolicy: yup.object({
      accrualDays: yup.number().min(0, "Accrual days must be 0 or greater").default(0),
      workingDays: yup.number().min(0, "Working days must be 0 or greater").default(0)
    }).default({ accrualDays: 0, workingDays: 0 }),
    accrualInAdvance: yup.boolean().default(false),
    maximumBalanceCarriedForward: yup.number().min(0, "Maximum balance must be 0 or greater").default(0),
    excludedDaysForAccrual: yup.array(yup.string()).default([])
  }).default({
    accrualType: "",
    dayId: 0,
    accrualPolicy: { accrualDays: 0, workingDays: 0 },
    accrualInAdvance: false,
    maximumBalanceCarriedForward: 0,
    excludedDaysForAccrual: []
  })
})

type AccrualSettingsFormData = yup.InferType<typeof accrualSettingsSchema>

interface AccrualSettingsFormProps {
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

export function AccrualSettingsForm({ 
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
}: AccrualSettingsFormProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const  tenantCode  = useGetTenantCode()
  
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
  } = useForm<AccrualSettingsFormData>({
    resolver: yupResolver(accrualSettingsSchema),
    defaultValues: {
      reminderFrequencyToApprover: 0,
      leaveAccrual: {
        accrualType: "",
        dayId: 0,
        accrualPolicy: {
          accrualDays: 0,
          workingDays: 0
        },
        accrualInAdvance: false,
        maximumBalanceCarriedForward: 0,
        excludedDaysForAccrual: []
      }
    },
    mode: "onChange",
  })

  const handleInputChange = useCallback(async (field: keyof AccrualSettingsFormData, value: any) => {
    setValue(field, value)
    await trigger(field)
    
    // Update form data based on mode
    const currentValues = watch()
    
    // Create exact data structure matching PersonalInformationForm pattern
    const exactData = {
      reminderFrequencyToApprover: currentValues.reminderFrequencyToApprover || 0,
      leaveAccrual: currentValues.leaveAccrual || {
        accrualType: "",
        dayId: 0,
        accrualPolicy: { accrualDays: 0, workingDays: 0 },
        accrualInAdvance: false,
        maximumBalanceCarriedForward: 0,
        excludedDaysForAccrual: []
      }
    }
    
    // Create nested leavePolicy structure
    const nestedData = {
      leavePolicy: exactData
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
        title: "Accrual Settings Saved",
        message: "Your accrual settings have been successfully saved. You can now continue to the next section or make additional changes."
      })
      setShowSuccessPopup(true)
    },
    onError: (error) => {
      console.error("Error saving accrual settings:", error)
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
        ...auditStatusFormData.leavePolicy,
        reminderFrequencyToApprover: formValues.reminderFrequencyToApprover || 0,
        leaveAccrual: formValues.leaveAccrual || {
          accrualType: "",
          dayId: 0,
          accrualPolicy: { accrualDays: 0, workingDays: 0 },
          accrualInAdvance: false,
          maximumBalanceCarriedForward: 0,
          excludedDaysForAccrual: []
        }
      }
      
      // Create nested leavePolicy structure
      const nestedData = {
        leavePolicy: exactData
      }
      
      if (currentMode === "add") {
        // Update audit status to mark this tab as completed
        setAuditStatus?.({
          ...auditStatus,
          accrualSettings: true
        })
        
        // Update audit status form data with nested structure
        setAuditStatusFormData?.({
          ...auditStatusFormData,
          ...nestedData
        })
        
        // Show success popup
        setSuccessPopupData({
          title: "Accrual Settings Saved",
          message: "Your accrual settings have been successfully saved. You can continue to the next section."
        })
        setShowSuccessPopup(true)
        // Navigation disabled here to allow popup visibility
      } else if (currentMode === "edit") {
        // In edit mode, update parent formData and save to backend
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
      reminderFrequencyToApprover: 0,
      leaveAccrual: {
        accrualType: "",
        dayId: 0,
        accrualPolicy: {
          accrualDays: 0,
          workingDays: 0
        },
        accrualInAdvance: false,
        maximumBalanceCarriedForward: 0,
        excludedDaysForAccrual: []
      }
    }
    
    reset(clearedData as any)
    setShowErrors(false)
    
    // Create nested leavePolicy structure
    const nestedData = {
      leavePolicy: clearedData
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
    setValue("reminderFrequencyToApprover", policy?.reminderFrequencyToApprover || 0);
    setValue("leaveAccrual", policy?.leaveAccrual || {
      accrualType: "",
      dayId: 0,
      accrualPolicy: { accrualDays: 0, workingDays: 0 },
      accrualInAdvance: false,
      maximumBalanceCarriedForward: 0,
      excludedDaysForAccrual: []
    });
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
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Accrual Settings</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Configure how leave balances accumulate over time
                </CardDescription>
                {showErrors && errors.reminderFrequencyToApprover && (
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
        {/* Alert Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Alert Settings
          </h3>
          <div className="grid grid-cols-1 gap-6">


            <div className="space-y-2">
              <Label htmlFor="reminderFrequencyToApprover" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Reminder Frequency To Approver
              </Label>
              <Input
                {...register("reminderFrequencyToApprover", { valueAsNumber: true })}
                id="reminderFrequencyToApprover"
                type="number"
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.reminderFrequencyToApprover) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="0"
                disabled={isReadOnly}
                min="0"
              />
              <p className="text-xs text-gray-500">Days between reminder notifications</p>
              {showErrors && errors.reminderFrequencyToApprover && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.reminderFrequencyToApprover.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Leave Accrual Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Leave Accrual Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="accrualType" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Type className="w-4 h-4 text-blue-600" />
                Accrual Type
              </Label>
              <Select
                value={watchedValues.leaveAccrual?.accrualType || ""}
                onValueChange={(value) => handleInputChange('leaveAccrual', { ...watchedValues.leaveAccrual, accrualType: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : "bg-white"
                } ${
                  (showErrors && errors.leaveAccrual) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`} disabled={isReadOnly}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dayId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600" />
                Day ID
              </Label>
              <Input
                {...register("leaveAccrual.dayId", { valueAsNumber: true })}
                id="dayId"
                type="number"
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.leaveAccrual) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="0"
                disabled={isReadOnly}
                min="0"
              />
              <p className="text-xs text-gray-500">Day of month/quarter/year for accrual</p>
            </div>
          </div>

          {/* Accrual Policy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Accrual Policy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="accrualDays" className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Accrual Days
                </Label>
                <Input
                  {...register("leaveAccrual.accrualPolicy.accrualDays", { valueAsNumber: true })}
                  id="accrualDays"
                  type="number"
                  step="0.1"
                  className={`h-12 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                    isReadOnly 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.leaveAccrual?.accrualPolicy?.accrualDays) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="0"
                  disabled={isReadOnly}
                  min="0"
                />
                {showErrors && errors.leaveAccrual?.accrualPolicy?.accrualDays && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.leaveAccrual.accrualPolicy.accrualDays.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="workingDays" className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Working Days
                </Label>
                <Input
                  {...register("leaveAccrual.accrualPolicy.workingDays", { valueAsNumber: true })}
                  id="workingDays"
                  type="number"
                  className={`h-12 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                    isReadOnly 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.leaveAccrual?.accrualPolicy?.workingDays) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="0"
                  disabled={isReadOnly}
                  min="0"
                />
                {showErrors && errors.leaveAccrual?.accrualPolicy?.workingDays && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.leaveAccrual.accrualPolicy.workingDays.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Accrual Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${watchedValues.leaveAccrual?.accrualInAdvance ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                Accrual In Advance
              </Label>
              <p className="text-xs text-blue-700">Allow leave to be accrued in advance</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${watchedValues.leaveAccrual?.accrualInAdvance ? 'text-green-600' : 'text-gray-500'}`}>
                {watchedValues.leaveAccrual?.accrualInAdvance ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={watchedValues.leaveAccrual?.accrualInAdvance || false}
                onCheckedChange={(checked) => handleInputChange('leaveAccrual', { ...watchedValues.leaveAccrual, accrualInAdvance: checked })}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                disabled={isReadOnly}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maximumBalanceCarriedForward" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              Maximum Balance Carried Forward
            </Label>
            <Input
              {...register("leaveAccrual.maximumBalanceCarriedForward", { valueAsNumber: true })}
              id="maximumBalanceCarriedForward"
              type="number"
              className={`h-12 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                isReadOnly 
                  ? "bg-gray-100 cursor-not-allowed" 
                  : ""
              } ${
                (showErrors && errors.leaveAccrual?.maximumBalanceCarriedForward) 
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
              placeholder="0"
              disabled={isReadOnly}
              min="0"
            />
            <p className="text-xs text-gray-500">Maximum days that can be carried forward</p>
            {showErrors && errors.leaveAccrual?.maximumBalanceCarriedForward && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <X className="h-3 w-3" />
                {errors.leaveAccrual.maximumBalanceCarriedForward.message}
              </p>
            )}
          </div>
        </div>

        {/* Excluded Days for Accrual */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Minus className="w-4 h-4 text-blue-600" />
            Excluded Days for Accrual
          </Label>
          <p className="text-xs text-gray-500">Days that are excluded from leave accrual calculation</p>
          <div className="space-y-3">
            {/* Predefined Options */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Select from predefined options:</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["WeekOff", "Paid leaves", "Holiday", "Absent"].map((option) => {
                  const isSelected = (watchedValues.leaveAccrual?.excludedDaysForAccrual || []).includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        if (isReadOnly) return;
                        const currentExcluded = watchedValues.leaveAccrual?.excludedDaysForAccrual || [];
                        let updatedExcludedDays;
                        
                        if (isSelected) {
                          // Remove from array
                          updatedExcludedDays = currentExcluded.filter(item => item !== option);
                        } else {
                          // Add to array
                          updatedExcludedDays = [...currentExcluded, option];
                        }
                        
                        setValue("leaveAccrual.excludedDaysForAccrual", updatedExcludedDays);
                        handleInputChange('leaveAccrual', {
                          ...watchedValues.leaveAccrual,
                          excludedDaysForAccrual: updatedExcludedDays
                        });
                      }}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? "bg-blue-100 border-blue-500 text-blue-800"
                          : "bg-white border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                      } ${isReadOnly ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      disabled={isReadOnly}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Selected Items Display */}
            {(watchedValues.leaveAccrual?.excludedDaysForAccrual || []).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Selected Days ({watchedValues.leaveAccrual.excludedDaysForAccrual.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {(watchedValues.leaveAccrual?.excludedDaysForAccrual || []).map((dayType, index) => (
                    <Badge
                      key={index}
                      className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 px-4 py-2 rounded-full font-medium"
                    >
                      {dayType}
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            const updatedExcludedDays = (watchedValues.leaveAccrual?.excludedDaysForAccrual || []).filter((_, i) => i !== index);
                            setValue("leaveAccrual.excludedDaysForAccrual", updatedExcludedDays);
                            handleInputChange('leaveAccrual', {
                              ...watchedValues.leaveAccrual,
                              excludedDaysForAccrual: updatedExcludedDays
                            });
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {(!watchedValues.leaveAccrual?.excludedDaysForAccrual || watchedValues.leaveAccrual.excludedDaysForAccrual.length === 0) && (
              <div className="h-10 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 flex items-center font-medium shadow-sm">
                <span className="text-gray-600 italic">No days selected. Click on the options above to add them.</span>
              </div>
            )}
            
            {showErrors && errors.leaveAccrual?.excludedDaysForAccrual && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <X className="h-3 w-3" />
                {errors.leaveAccrual.excludedDaysForAccrual.message}
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
                      <Clock className="h-4 w-4" />
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