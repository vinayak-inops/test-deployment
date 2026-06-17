"use client"

import type React from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Switch } from "@repo/ui/components/ui/switch"
import { Separator } from "@repo/ui/components/ui/separator"
import { Button } from "@repo/ui/components/ui/button"
import { Settings, RotateCcw, ArrowRight, ArrowLeft, Hash, Type, Calendar, Users, Heart, Clock, AlertTriangle, FileText, X, CheckCircle } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useSearchParams } from "next/navigation"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

import type { LeavePolicyData, LeavePolicyDataCompat } from "../types/leave-policy.types"

// Yup Schema for validation
const policyDetailsSchema = yup.object({
  leaveCode: yup.string()
    .required("Leave code is required")
    .max(10, "Leave code must be less than 10 characters"),
  leaveTitle: yup.string()
    .required("Leave title is required")
    .min(2, "Leave title must be at least 2 characters")
    .max(100, "Leave title must be less than 100 characters")
    .matches(/^[a-zA-Z0-9\s\-_]+$/, "Leave title can only contain letters, numbers, spaces, hyphens, and underscores"),
  effectiveFrom: yup.string()
    .required("Effective from date is required"),
  genderAllowed: yup.string()
    .oneOf(["All", "Male", "Female"], "Please select a valid gender option")
    .default("All"),
  leaveType: yup.string()
    .oneOf(["paid", "unpaid"], "Please select a valid leave type")
    .default("unpaid"),
  leaveCategory: yup.string()
    .oneOf(["Time Away", "Leave of Absence"], "Please select a valid leave category")
    .default("Time Away"),
  maritalStatus: yup.array()
    .of(yup.string())
    .min(1, "At least one marital status must be selected")
    .default(["all"]),
  minimumServicePeriodRequired: yup.number()
    .min(0, "Minimum service period must be 0 or greater")
    .max(120, "Minimum service period cannot exceed 120 months")
    .default(0),
  maximumLeaveAllowed: yup.array()
    .of(yup.object({
      type: yup.string()
        .oneOf(["once", "monthly", "yearly"], "Please select a valid leave type"),
      daysAllowed: yup.number()
        .min(0, "Days allowed must be 0 or greater")
        .max(365, "Days allowed cannot exceed 365 days")
        .default(0)
    }))
    .default([{ type: "once", daysAllowed: 0 }]),
  minimumDaysPerApplication: yup.number()
    .min(1, "Minimum days per application must be at least 1")
    .max(30, "Minimum days per application cannot exceed 30")
    .default(1),
  maximumDaysPerApplication: yup.number()
    .min(1, "Maximum days per application must be at least 1")
    .max(365, "Maximum days per application cannot exceed 365")
    .default(0),
  maximumApplicationAllowed: yup.array()
    .of(yup.object({
      type: yup.string()
        .oneOf(["once", "monthly", "yearly"], "Please select a valid application type"),
      count: yup.number()
        .min(0, "Count must be 0 or greater")
        .max(100, "Count cannot exceed 100")
    }))
    .default([{ type: "once", count: 0 }]),
  halfDayAllowed: yup.boolean()
    .default(false),
  alertManagerDaysBeforeLeaveStart: yup.number()
    .min(0, "Alert manager days must be 0 or greater")
    .max(30, "Alert manager days cannot exceed 30")
    .default(0),
})

type PolicyDetailsFormData = yup.InferType<typeof policyDetailsSchema>

interface PolicyDetailsFormProps {
  duplicateData?: any[]
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

export function PolicyDetailsForm({ 
  duplicateData,
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
}: PolicyDetailsFormProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const isInitializedRef = useRef(false)
  const tenantCode: string = useGetTenantCode()

  // Normalizers for safe comparisons
  const normalizeLeaveCode = (value: unknown) => String(value ?? '').trim().toUpperCase()
  const normalizeLeaveTitle = (value: unknown) => String(value ?? '').trim()

  // Duplicate check helpers with edit-mode allowance
  const checkDuplicateLeaveCode = (leaveCode: string, duplicateData: any[], currentMode: string, auditStatusFormData?: any) => {
    if (!duplicateData || duplicateData.length === 0 || !leaveCode) return false
    const current = normalizeLeaveCode(leaveCode)
    const original = normalizeLeaveCode(auditStatusFormData?.leavePolicy?.leaveCode || auditStatusFormData?.leaveCode)
    if (currentMode === 'edit' && original && original === current) return false
    return duplicateData.some((item: any) => {
      const itemCode = normalizeLeaveCode(item?.leavePolicy?.leaveCode || item?.leaveCode)
      return itemCode === current
    })
  }

  const checkDuplicateLeaveTitle = (leaveTitle: string, duplicateData: any[], currentMode: string, auditStatusFormData?: any) => {
    if (!duplicateData || duplicateData.length === 0 || !leaveTitle) return false
    const current = normalizeLeaveTitle(leaveTitle)
    const original = normalizeLeaveTitle(auditStatusFormData?.leavePolicy?.leaveTitle || auditStatusFormData?.leaveTitle)
    if (currentMode === 'edit' && original && original === current) return false
    return duplicateData.some((item: any) => {
      const itemTitle = normalizeLeaveTitle(item?.leavePolicy?.leaveTitle || item?.leaveTitle)
      return itemTitle === current
    })
  }
  
  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  
  // Determine current mode
  const currentMode = mode || ((modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add");
  const isViewMode = currentMode === "view"
  // Determine if form is read-only based on mode
  const isReadOnly = isViewMode
  // Leave Code should be read-only in edit mode as well
  const isLeaveCodeReadOnly = isViewMode || currentMode === "edit"

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
    setError,
    clearErrors,
  } = useForm<PolicyDetailsFormData>({
    resolver: yupResolver(policyDetailsSchema),
    defaultValues: {
      leaveCode: "",
      leaveTitle: "",
      effectiveFrom: "",
      genderAllowed: "All",
      leaveType: "paid",
      leaveCategory: "Time Away",
      maritalStatus: ["all"],
      minimumServicePeriodRequired: 0,
      maximumLeaveAllowed: [{ type: "once", daysAllowed: 0 }],
      minimumDaysPerApplication: 1,
      maximumDaysPerApplication: 0,
      maximumApplicationAllowed: [{ type: "once", count: 0 }],
      halfDayAllowed: false,
      alertManagerDaysBeforeLeaveStart: 0,
    },
    mode: "onChange",
  })

  const handleInputChange = useCallback(async (field: keyof PolicyDetailsFormData, value: any) => {
    setValue(field, value)
    await trigger(field)
    
    // Update form data based on mode
    const currentValues = watch()
    
    // Ensure maximumLeaveAllowed has proper structure
    const processedMaxLeaveAllowed = currentValues.maximumLeaveAllowed?.map(item => ({
      type: item.type || "once",
      daysAllowed: item.daysAllowed ?? 0  // Default to 0 instead of undefined
    })) || [{ type: "once", daysAllowed: 0 }]
    
    // Create exact data structure matching PersonalInformationForm pattern
    const exactData = {
      leaveCode: currentValues.leaveCode || "",
      leaveTitle: currentValues.leaveTitle || "",
      effectiveFrom: currentValues.effectiveFrom || "",
      genderAllowed: currentValues.genderAllowed || "All",
      leaveType: currentValues.leaveType || "paid",
      leaveCategory: currentValues.leaveCategory || "Time Away",
      maritalStatus: currentValues.maritalStatus || ["all"],
      minimumServicePeriodRequired: currentValues.minimumServicePeriodRequired || 0,
      maximumLeaveAllowed: processedMaxLeaveAllowed,
      minimumDaysPerApplication: currentValues.minimumDaysPerApplication || 1,
      maximumDaysPerApplication: currentValues.maximumDaysPerApplication || 0,
      maximumApplicationAllowed: currentValues.maximumApplicationAllowed || [{ type: "once", count: 0 }],
      halfDayAllowed: currentValues.halfDayAllowed || false,
      alertManagerDaysBeforeLeaveStart: currentValues.alertManagerDaysBeforeLeaveStart || 0,
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
  }, [currentMode, auditStatusFormData, onFormDataChange, setValue, trigger, watch])



  const {
    post: postLeavePolicy,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "leave_policy",
    onSuccess: (data) => {
      setSuccessPopupData({
        title: "Policy Details Saved",
        message: "Your policy details have been successfully saved. You can now continue to the next section or make additional changes."
      })
      setShowSuccessPopup(true)
    },
    onError: (error) => {
      console.error("Error saving policy details:", error)
    },
  });

  // Handle save and continue functionality
  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    
    // Check for duplicate Leave Code and Leave Title before form validation
    const formValues = watch()
    if (duplicateData && duplicateData.length > 0) {
      // Check for duplicate Leave Code
      if (formValues.leaveCode) {
        const isDuplicateLeaveCode = checkDuplicateLeaveCode(formValues.leaveCode, duplicateData, currentMode, auditStatusFormData)
        if (isDuplicateLeaveCode) {
          setError("leaveCode", {
            type: "custom",
            message: "Leave Code already exists. Please use a different code."
          })
          setShowErrors(true)
          return
        }
      }
      
      // Check for duplicate Leave Title
      if (formValues.leaveTitle) {
        const isDuplicateLeaveTitle = checkDuplicateLeaveTitle(formValues.leaveTitle, duplicateData, currentMode, auditStatusFormData)
        if (isDuplicateLeaveTitle) {
          setError("leaveTitle", {
            type: "custom",
            message: "Leave Title already exists. Please use a different title."
          })
          setShowErrors(true)
          return
        }
      }
    }
    
    const isFormValid = await trigger()
    
    if (isFormValid) {
      const formValues = watch()
      
      // Ensure maximumLeaveAllowed has proper structure
      const processedMaxLeaveAllowed = formValues.maximumLeaveAllowed?.map(item => ({
        type: item.type || "once",
        daysAllowed: item.daysAllowed ?? 0  // Default to 0 instead of undefined
      })) || [{ type: "once", daysAllowed: 0 }]
      
      // Create exact data structure matching PersonalInformationForm pattern
      const exactData = {
        ...auditStatusFormData.leavePolicy,
        leaveCode: formValues.leaveCode || "",
        leaveTitle: formValues.leaveTitle || "",
        effectiveFrom: formValues.effectiveFrom || "",
        genderAllowed: formValues.genderAllowed || "All",
        leaveType: formValues.leaveType || "paid",
        leaveCategory: formValues.leaveCategory || "Time Away",
        maritalStatus: formValues.maritalStatus || ["all"],
        minimumServicePeriodRequired: formValues.minimumServicePeriodRequired || 0,
        maximumLeaveAllowed: processedMaxLeaveAllowed,
        minimumDaysPerApplication: formValues.minimumDaysPerApplication || 0,
        maximumDaysPerApplication: formValues.maximumDaysPerApplication || 0,
        maximumApplicationAllowed: formValues.maximumApplicationAllowed || [{ type: "once", count: 0 }],
        halfDayAllowed: formValues.halfDayAllowed || false,
        alertManagerDaysBeforeLeaveStart: formValues.alertManagerDaysBeforeLeaveStart || 0,
      }
      
      // Create nested leavePolicy structure
      const nestedData = {
        leavePolicy: exactData
      }
      
      if (currentMode === "add") {
        // Update audit status to mark this tab as completed
        setAuditStatus?.({
          ...auditStatus,
          policyDetails: true
        })
        
        // Update audit status form data with nested structure
        setAuditStatusFormData?.({
          ...auditStatusFormData,
          ...nestedData
        })
        // Show success popup
        setSuccessPopupData({
          title: "Policy Details Saved",
          message: "Your policy details have been successfully saved. You can continue to the next section."
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

  

  // Helper functions to safely cast enum values
  const safeCastGenderAllowed = (value: any): "All" | "Male" | "Female" => {
    if (value === "All" || value === "Male" || value === "Female") {
      return value;
    }
    return "All";
  };

  const safeCastLeaveType = (value: any): "paid" | "unpaid" => {
    if (value === "paid" || value === "unpaid") {
      return value;
    }
    return "paid";
  };

  const safeCastLeaveCategory = (value: any): "Time Away" | "Leave of Absence" => {
    if (value === "Time Away" || value === "Leave of Absence") {
      return value;
    }
    return "Time Away";
  };

  const safeCastMaritalStatus = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return [value];
    }
    return ["all"];
  };

  const safeCastMaxApplicationAllowed = (value: any): { type: "once" | "monthly" | "yearly"; count: number }[] => {
    if (Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      if (firstItem && typeof firstItem === 'object' && 'type' in firstItem && 'count' in firstItem) {
        const type = firstItem.type;
        if (type === "once" || type === "monthly" || type === "yearly") {
          return [{ type, count: Number(firstItem.count) ?? 0 }];
        }
      }
    }
    return [{ type: "once" as const, count: 0 }];
  };

  const safeCastMaxLeaveAllowed = (value: any): { type: "once" | "monthly" | "yearly"; daysAllowed: number }[] => {
    if (Array.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      if (firstItem && typeof firstItem === 'object' && 'type' in firstItem) {
        const type = firstItem.type;
        if (type === "once" || type === "monthly" || type === "yearly") {
          return [{ 
            type, 
            daysAllowed: firstItem.daysAllowed ?? 0  // Default to 0 instead of undefined
          }];
        }
      }
    }
    return [{ type: "once" as const, daysAllowed: 0 }];
  };

  // Helper function to set form values from data
  const setFormValuesFromData = useCallback((data: any) => {
    const leavePolicy = data?.leavePolicy || data;
    setValue("leaveCode", data?.leaveCode || leavePolicy?.leaveCode || "");
    setValue("leaveTitle", data?.leaveTitle || leavePolicy?.leaveTitle || "");
    setValue("effectiveFrom", data?.effectiveFrom || leavePolicy?.effectiveFrom || "");
    setValue("genderAllowed", safeCastGenderAllowed(data?.genderAllowed || leavePolicy?.genderAllowed));
    setValue("leaveType", safeCastLeaveType(data?.leaveType || leavePolicy?.leaveType));
    setValue("leaveCategory", safeCastLeaveCategory(data?.leaveCategory || leavePolicy?.leaveCategory));
    setValue("maritalStatus", safeCastMaritalStatus(data?.maritalStatus || leavePolicy?.maritalStatus || ["all"]));
    setValue("minimumServicePeriodRequired", data?.minimumServicePeriodRequired || leavePolicy?.minimumServicePeriodRequired || 0);
    setValue("maximumLeaveAllowed", safeCastMaxLeaveAllowed(data?.maximumLeaveAllowed || leavePolicy?.maximumLeaveAllowed));
    setValue("minimumDaysPerApplication", data?.minimumDaysPerApplication || leavePolicy?.minimumDaysPerApplication || 1);
    setValue("maximumDaysPerApplication", data?.maximumDaysPerApplication || leavePolicy?.maximumDaysPerApplication || 0);
    setValue("maximumApplicationAllowed", safeCastMaxApplicationAllowed(data?.maximumApplicationAllowed || leavePolicy?.maximumApplicationAllowed));
    setValue("halfDayAllowed", data?.halfDayAllowed || leavePolicy?.halfDayAllowed || false);
    setValue("alertManagerDaysBeforeLeaveStart", data?.alertManagerDaysBeforeLeaveStart || leavePolicy?.alertManagerDaysBeforeLeaveStart || 0);
  }, [setValue]);

  // Update form values based on mode (similar to OrganizationForm)
  useEffect(() => {
    if (currentMode === "add") {
      // In add mode, get values from auditStatusFormData
      if (auditStatusFormData) {
        setValue("leaveCode", auditStatusFormData.leavePolicy?.leaveCode || auditStatusFormData.leaveCode || "");
        setValue("leaveTitle", auditStatusFormData.leavePolicy?.leaveTitle || auditStatusFormData.leaveTitle || "");
        setValue("effectiveFrom", auditStatusFormData.leavePolicy?.effectiveFrom || auditStatusFormData.effectiveFrom || "");
        setValue("genderAllowed", auditStatusFormData.leavePolicy?.genderAllowed || auditStatusFormData.genderAllowed || "All");
        setValue("leaveType", auditStatusFormData.leavePolicy?.leaveType || auditStatusFormData.leaveType || "paid");
        setValue("leaveCategory", auditStatusFormData.leavePolicy?.leaveCategory || auditStatusFormData.leaveCategory || "Time Away");
        setValue("maritalStatus", Array.isArray(auditStatusFormData.leavePolicy?.maritalStatus) ? auditStatusFormData.leavePolicy.maritalStatus : 
                  Array.isArray(auditStatusFormData?.maritalStatus) ? auditStatusFormData.maritalStatus : 
                  ["all"]);
        setValue("minimumServicePeriodRequired", auditStatusFormData.leavePolicy?.minimumServicePeriodRequired || auditStatusFormData?.minimumServicePeriodRequired || 0);
        setValue("maximumLeaveAllowed", auditStatusFormData.leavePolicy?.maximumLeaveAllowed || auditStatusFormData?.maximumLeaveAllowed || [{ type: "once", daysAllowed: 0 }]);
        setValue("minimumDaysPerApplication", auditStatusFormData.leavePolicy?.minimumDaysPerApplication || auditStatusFormData?.minimumDaysPerApplication || 1);
        setValue("maximumDaysPerApplication", auditStatusFormData.leavePolicy?.maximumDaysPerApplication || auditStatusFormData?.maximumDaysPerApplication || 0);
        setValue("maximumApplicationAllowed", auditStatusFormData.leavePolicy?.maximumApplicationAllowed || auditStatusFormData?.maximumApplicationAllowed || [{ type: "once", count: 0 }]);
        setValue("halfDayAllowed", auditStatusFormData.leavePolicy?.halfDayAllowed || auditStatusFormData?.halfDayAllowed || false);
        setValue("alertManagerDaysBeforeLeaveStart", auditStatusFormData.leavePolicy?.alertManagerDaysBeforeLeaveStart || auditStatusFormData?.alertManagerDaysBeforeLeaveStart || 0);
      }
    } else if (currentMode === "edit" || currentMode === "view") {
      // In edit/view mode, get values from auditStatusFormData (previously formData)
      if (auditStatusFormData) {
        setValue("leaveCode", auditStatusFormData.leavePolicy?.leaveCode || auditStatusFormData.leaveCode || "");
        setValue("leaveTitle", auditStatusFormData.leavePolicy?.leaveTitle || auditStatusFormData.leaveTitle || "");
        setValue("effectiveFrom", auditStatusFormData.leavePolicy?.effectiveFrom || auditStatusFormData.effectiveFrom || "");
        setValue("genderAllowed", auditStatusFormData.leavePolicy?.genderAllowed || auditStatusFormData.genderAllowed || "All");
        setValue("leaveType", auditStatusFormData.leavePolicy?.leaveType || auditStatusFormData.leaveType || "paid");
        setValue("leaveCategory", auditStatusFormData.leavePolicy?.leaveCategory || auditStatusFormData.leaveCategory || "Time Away");
        setValue("maritalStatus", Array.isArray(auditStatusFormData.leavePolicy?.maritalStatus) ? auditStatusFormData.leavePolicy.maritalStatus : 
                  Array.isArray(auditStatusFormData?.maritalStatus) ? auditStatusFormData.maritalStatus : 
                  ["all"]);
        setValue("minimumServicePeriodRequired", auditStatusFormData.leavePolicy?.minimumServicePeriodRequired || auditStatusFormData?.minimumServicePeriodRequired || 0);
        setValue("maximumLeaveAllowed", auditStatusFormData.leavePolicy?.maximumLeaveAllowed || auditStatusFormData?.maximumLeaveAllowed || [{ type: "once", daysAllowed: 0 }]);
        setValue("minimumDaysPerApplication", auditStatusFormData.leavePolicy?.minimumDaysPerApplication || auditStatusFormData?.minimumDaysPerApplication || 1);
        setValue("maximumDaysPerApplication", auditStatusFormData.leavePolicy?.maximumDaysPerApplication || auditStatusFormData?.maximumDaysPerApplication || 0);
        setValue("maximumApplicationAllowed", auditStatusFormData.leavePolicy?.maximumApplicationAllowed || auditStatusFormData?.maximumApplicationAllowed || [{ type: "once", count: 0 }]);
        setValue("halfDayAllowed", auditStatusFormData.leavePolicy?.halfDayAllowed || auditStatusFormData?.halfDayAllowed || false);
        setValue("alertManagerDaysBeforeLeaveStart", auditStatusFormData.leavePolicy?.alertManagerDaysBeforeLeaveStart || auditStatusFormData?.alertManagerDaysBeforeLeaveStart || 0);
      }
    }
  }, [currentMode, auditStatusFormData, setValue]);

  // Update form values when leavePolicyResponse changes (only in edit/view mode)
  useEffect(() => {
    if ((currentMode === "edit" || currentMode === "view") && leavePolicyResponse && leavePolicyResponse[0]) {
      const policyData = leavePolicyResponse[0];
      setValue("leaveCode", policyData.leavePolicy?.leaveCode || policyData.leaveCode || "");
      setValue("leaveTitle", policyData.leavePolicy?.leaveTitle || policyData.leaveTitle || "");
      setValue("effectiveFrom", policyData.leavePolicy?.effectiveFrom || policyData.effectiveFrom || "");
      setValue("genderAllowed", policyData.leavePolicy?.genderAllowed || policyData.genderAllowed || "All");
      setValue("leaveType", policyData.leavePolicy?.leaveType || policyData.leaveType || "paid");
      setValue("leaveCategory", policyData.leavePolicy?.leaveCategory || policyData.leaveCategory || "Time Away");
      setValue("maritalStatus", Array.isArray(policyData.leavePolicy?.maritalStatus) ? policyData.leavePolicy.maritalStatus : 
                Array.isArray(policyData?.maritalStatus) ? policyData.maritalStatus : 
                ["all"]);
      setValue("minimumServicePeriodRequired", policyData.leavePolicy?.minimumServicePeriodRequired || policyData?.minimumServicePeriodRequired || 0);
      setValue("maximumLeaveAllowed", policyData.leavePolicy?.maximumLeaveAllowed || policyData?.maximumLeaveAllowed || [{ type: "once", daysAllowed: 0 }]);
      setValue("minimumDaysPerApplication", policyData.leavePolicy?.minimumDaysPerApplication || policyData?.minimumDaysPerApplication || 1);
      setValue("maximumDaysPerApplication", policyData.leavePolicy?.maximumDaysPerApplication || policyData?.maximumDaysPerApplication || 0);
      setValue("maximumApplicationAllowed", policyData.leavePolicy?.maximumApplicationAllowed || policyData?.maximumApplicationAllowed || [{ type: "once", count: 0 }]);
      setValue("halfDayAllowed", policyData.leavePolicy?.halfDayAllowed || policyData?.halfDayAllowed || false);
      setValue("alertManagerDaysBeforeLeaveStart", policyData.leavePolicy?.alertManagerDaysBeforeLeaveStart || policyData?.alertManagerDaysBeforeLeaveStart || 0);
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
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Leave Policy Details</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Configure the basic leave policy information and eligibility criteria
                </CardDescription>
                {showErrors && Object.keys(errors).length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-200 text-sm">
                    <X className="h-4 w-4" />
                    <span>Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} to continue</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Basic Information */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="group">
                  <Label htmlFor="leaveCode" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Leave Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("leaveCode")}
                    id="leaveCode"
                    onChange={(e) => {
                      if (!isLeaveCodeReadOnly) {
                        const value = e.target.value;
                        // Check for duplicate Leave Code in real-time
                        if (duplicateData && duplicateData.length > 0 && value) {
                          const isDuplicate = checkDuplicateLeaveCode(value, duplicateData, currentMode, auditStatusFormData)
                          if (isDuplicate) {
                            setError("leaveCode", {
                              type: "custom",
                              message: "Leave Code already exists. Please use a different code."
                            });
                          } else {
                            // Clear the error if no duplicate found
                            clearErrors("leaveCode");
                          }
                        } else {
                          clearErrors("leaveCode");
                        }
                      }
                    }}
                    className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                      isLeaveCodeReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : ""
                    } ${
                      (showErrors && errors.leaveCode) 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    placeholder="e.g., ML, CL, SL"
                    disabled={isLeaveCodeReadOnly}
                    readOnly={isLeaveCodeReadOnly}
                  />
                  {showErrors && errors.leaveCode && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.leaveCode.message}
                    </p>
                  )}
                  {/* Enhanced duplicate checking feedback */}
                  {duplicateData && duplicateData.length > 0 && watchedValues.leaveCode && (
                    <>
                      {checkDuplicateLeaveCode(watchedValues.leaveCode, duplicateData, currentMode, auditStatusFormData) ? (
                        <div className="mt-2">
                          {currentMode !== "view" && (
                            <p className="text-orange-600 text-sm flex items-center gap-2">
                              <X className="h-4 w-4" />
                              <span className="font-medium">Duplicate Leave Code detected</span>
                            </p>
                          )}
                        </div>
                      ) : currentMode === "edit" && (auditStatusFormData?.leavePolicy?.leaveCode || auditStatusFormData?.leaveCode) === watchedValues.leaveCode ? (
                        <p className="text-blue-600 text-sm mt-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Same leave code - update allowed (editing your own record)</span>
                        </p>
                      ) : (
                        <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Leave Code is available</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="group">
                  <Label htmlFor="leaveTitle" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Leave Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("leaveTitle")}
                    id="leaveTitle"
                    onChange={(e) => {
                      if (!isReadOnly) {
                        const value = e.target.value;
                        // Check for duplicate Leave Title in real-time
                        if (duplicateData && duplicateData.length > 0 && value) {
                          const isDuplicate = checkDuplicateLeaveTitle(value, duplicateData, currentMode, auditStatusFormData)
                          if (isDuplicate) {
                            setError("leaveTitle", {
                              type: "custom",
                              message: "Leave Title already exists. Please use a different title."
                            });
                          } else {
                            // Clear the error if no duplicate found
                            clearErrors("leaveTitle");
                          }
                        } else {
                          clearErrors("leaveTitle");
                        }
                      }
                    }}
                    className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                      isReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : ""
                    } ${
                      (showErrors && errors.leaveTitle) 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    placeholder="Enter leave title"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                  />
                  {showErrors && errors.leaveTitle && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.leaveTitle.message}
                    </p>
                  )}
                  {/* Enhanced duplicate checking feedback */}
                  {duplicateData && duplicateData.length > 0 && watchedValues.leaveTitle && (
                    <>
                      {checkDuplicateLeaveTitle(watchedValues.leaveTitle, duplicateData, currentMode, auditStatusFormData) ? (
                        <div className="mt-2">
                          {currentMode !== "view" && (
                            <p className="text-orange-600 text-sm flex items-center gap-2">
                              <X className="h-4 w-4" />
                              <span className="font-medium">Duplicate Leave Title detected</span>
                            </p>
                          )}
                        </div>
                      ) : currentMode === "edit" && (auditStatusFormData?.leavePolicy?.leaveTitle || auditStatusFormData?.leaveTitle) === watchedValues.leaveTitle ? (
                        <p className="text-blue-600 text-sm mt-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Same leave title - update allowed (editing your own record)</span>
                        </p>
                      ) : (
                        <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Leave Title is available</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="group">
                  <Label htmlFor="effectiveFrom" className="text-sm font-semibold text-gray-700 mb-2 block">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Effective From <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("effectiveFrom")}
                    id="effectiveFrom"
                    type="date"
                    className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                      isReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : ""
                    } ${
                      (showErrors && errors.effectiveFrom) 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                  />
                  {showErrors && errors.effectiveFrom && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.effectiveFrom.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>

          <Separator className="lg:col-span-3 my-6" />

          {/* Eligibility Criteria */}
          <div className="lg:col-span-3 pb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Eligibility Criteria
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="group">
                  <Label htmlFor="genderAllowed" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Gender Allowed <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={watchedValues.genderAllowed || ""} 
                    onValueChange={(value) => !isReadOnly && handleInputChange("genderAllowed", value)}
                    key={`genderAllowed-${watchedValues.genderAllowed || 'empty'}`}
                  >
                    <SelectTrigger className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                      isReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : "bg-white"
                    } ${
                      (showErrors && errors.genderAllowed) 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`} disabled={isReadOnly}>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 bg-white">
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {showErrors && errors.genderAllowed && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.genderAllowed.message}
                    </p>
                  )}
                </div>
                <div className="group">
                  <Label htmlFor="leaveType" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Leave Type <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={watchedValues.leaveType || ""} 
                    onValueChange={(value) => !isReadOnly && handleInputChange("leaveType", value)}
                    key={`leaveType-${watchedValues.leaveType || 'empty'}`}
                  >
                    <SelectTrigger className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                      isReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : "bg-white"
                    } ${
                      (showErrors && errors.leaveType) 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`} disabled={isReadOnly}>
                      <SelectValue placeholder="Select Leave Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 bg-white">
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                  {showErrors && errors.leaveType && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.leaveType.message}
                    </p>
                  )}
                </div>
                <div className="group">
                  <Label htmlFor="leaveCategory" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Leave Category <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={watchedValues.leaveCategory || ""} 
                    onValueChange={(value) => !isReadOnly && handleInputChange("leaveCategory", value)}
                    key={`leaveCategory-${watchedValues.leaveCategory || 'empty'}`}
                  >
                    <SelectTrigger className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                      isReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : "bg-white"
                    } ${
                      (showErrors && errors.leaveCategory) 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`} disabled={isReadOnly}>
                      <SelectValue placeholder="Select Leave Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 bg-white">
                      <SelectItem value="Time Away">Time Away</SelectItem>
                      <SelectItem value="Leave of Absence">Leave of Absence</SelectItem>
                    </SelectContent>
                  </Select>
                  {showErrors && errors.leaveCategory && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.leaveCategory.message}
                    </p>
                  )}
                </div>

                <div className="group">
                  <Label htmlFor="maritalStatus" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Marital Status Allowed <span className="text-red-500">*</span>
                  </Label>
                  <div className={`p-4 border-2 rounded-xl transition-all duration-300 ${
                    (showErrors && errors.maritalStatus) 
                      ? "border-red-500 bg-red-50" 
                      : "border-gray-200 bg-white"
                  }`}>
                    <div className="flex flex-wrap gap-4">
                      {["married", "un-married", "divorced", "widowed", "single"].map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`maritalStatus-${status}`}
                            checked={watchedValues.maritalStatus?.includes(status) || false}
                            onChange={(e) => {
                              if (!isReadOnly) {
                                const currentStatus = watchedValues.maritalStatus || [];
                                let newStatus;
                                if (e.target.checked) {
                                  newStatus = [...currentStatus, status];
                                } else {
                                  newStatus = currentStatus.filter(s => s !== status);
                                }
                                handleInputChange("maritalStatus", newStatus);
                              }
                            }}
                            disabled={isReadOnly}
                            className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                              isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                            } ${
                              (showErrors && errors.maritalStatus) ? "border-red-500" : ""
                            }`}
                          />
                          <Label 
                            htmlFor={`maritalStatus-${status}`} 
                            className={`text-sm capitalize cursor-pointer whitespace-nowrap ${
                              (showErrors && errors.maritalStatus) ? "text-red-700" : "text-gray-700"
                            }`}
                          >
                            {status === "un-married" ? "Unmarried" : status}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {showErrors && errors.maritalStatus && (
                    <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.maritalStatus.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

          <Separator className="lg:col-span-3 my-6" />

          {/* Leave Limits */}
          <div className="lg:col-span-3 pb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Leave Limits & Applications
            </h3>
            <div className="space-y-6">
              {/* Min Service Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <Label htmlFor="minimumServicePeriodRequired" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Min Service Period (months)
                  </Label>
                  <Input
                    {...register("minimumServicePeriodRequired", { valueAsNumber: true })}
                    id="minimumServicePeriodRequired"
                    type="number"
                    className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                      isReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : ""
                    } ${
                      (showErrors && errors.minimumServicePeriodRequired) 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    placeholder="0"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                  />
                  {showErrors && errors.minimumServicePeriodRequired && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.minimumServicePeriodRequired.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Maximum Leave Allowed */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-700">
                  Maximum Leave Allowed
                </Label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="group">
                    <Label htmlFor="maxLeaveType" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Type
                    </Label>
                    <Select
                      value={watchedValues.maximumLeaveAllowed?.[0]?.type || "once"}
                      onValueChange={(value: "once" | "monthly" | "yearly") => {
                        if (!isReadOnly) {
                          const updatedMaxLeave = [...(watchedValues.maximumLeaveAllowed || [])];
                          if (updatedMaxLeave.length > 0) {
                            updatedMaxLeave[0] = { ...updatedMaxLeave[0], type: value };
                          } else {
                            updatedMaxLeave.push({ type: value, daysAllowed: 0 });
                          }
                          setValue('maximumLeaveAllowed', updatedMaxLeave);
                          handleInputChange('maximumLeaveAllowed', updatedMaxLeave);
                        }
                      }}
                      key={`maxLeaveType-${watchedValues.maximumLeaveAllowed?.[0]?.type || 'empty'}`}
                    >
                      <SelectTrigger className={`h-10 w-full border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 bg-white ${
                        (showErrors && errors.maximumLeaveAllowed) 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2 bg-white">
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    {showErrors && errors.maximumLeaveAllowed && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.maximumLeaveAllowed.message}
                      </p>
                    )}
                  </div>
                  <div className="group">
                    <Label htmlFor="maxLeaveDaysAllowed" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Days Allowed
                    </Label>
                    <Input
                      {...register("maximumLeaveAllowed.0.daysAllowed", { valueAsNumber: true })}
                      id="maxLeaveDaysAllowed"
                      type="number"
                      className={`h-10 w-full border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                        isReadOnly 
                          ? "bg-gray-100 cursor-not-allowed" 
                          : ""
                      } ${
                        (showErrors && errors.maximumLeaveAllowed) 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      placeholder="0"
                      min="0"
                      max="365"
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                    />
                    {showErrors && errors.maximumLeaveAllowed && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.maximumLeaveAllowed.message}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">Configure the maximum leave days allowed</p>
              </div>

              {/* Min/Max Days Per Application */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <Label htmlFor="minimumDaysPerApplication" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Min Days Per Application
                  </Label>
                  <Input
                    {...register("minimumDaysPerApplication", { valueAsNumber: true })}
                    id="minimumDaysPerApplication"
                    type="number"
                    className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                      isReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : ""
                    } ${
                      (showErrors && errors.minimumDaysPerApplication) 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    placeholder="1"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                  />
                  {showErrors && errors.minimumDaysPerApplication && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.minimumDaysPerApplication.message}
                    </p>
                  )}
                </div>
                <div className="group">
                  <Label htmlFor="maximumDaysPerApplication" className="text-sm font-semibold text-gray-700 mb-2 block">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Max Days Per Application
                  </Label>
                  <Input
                    {...register("maximumDaysPerApplication", { valueAsNumber: true })}
                    id="maximumDaysPerApplication"
                    type="number"
                    className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                      isReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : ""
                    } ${
                      (showErrors && errors.maximumDaysPerApplication) 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    placeholder="30"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                  />
                  {showErrors && errors.maximumDaysPerApplication && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.maximumDaysPerApplication.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Maximum Application Allowed */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-gray-700">
                  Maximum Application Allowed
                </Label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="group">
                    <Label htmlFor="maxAppType" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Type
                    </Label>
                    <Select
                      value={watchedValues.maximumApplicationAllowed?.[0]?.type || "once"}
                      onValueChange={(value: "once" | "monthly" | "yearly") => {
                        if (!isReadOnly) {
                          const updatedMaxApp = [...(watchedValues.maximumApplicationAllowed || [])];
                          if (updatedMaxApp.length > 0) {
                            updatedMaxApp[0] = { ...updatedMaxApp[0], type: value };
                          } else {
                            updatedMaxApp.push({ type: value, count: 1 });
                          }
                          setValue('maximumApplicationAllowed', updatedMaxApp);
                          handleInputChange('maximumApplicationAllowed', updatedMaxApp);
                        }
                      }}
                      key={`maxAppType-${watchedValues.maximumApplicationAllowed?.[0]?.type || 'empty'}`}
                    >
                      <SelectTrigger className={`h-10 w-full border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 bg-white ${
                        (showErrors && errors.maximumApplicationAllowed) 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2 bg-white">
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    {showErrors && errors.maximumApplicationAllowed && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.maximumApplicationAllowed.message}
                      </p>
                    )}
                  </div>
                  <div className="group">
                    <Label htmlFor="maxAppCount" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Count
                    </Label>
                    <Input
                      {...register("maximumApplicationAllowed.0.count", { valueAsNumber: true })}
                      id="maxAppCount"
                      type="number"
                      className={`h-10 w-full border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                        isReadOnly 
                          ? "bg-gray-100 cursor-not-allowed" 
                          : ""
                      } ${
                        (showErrors && errors.maximumApplicationAllowed) 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      placeholder="0"
                      min="0"
                      max="100"
                      disabled={isReadOnly}
                      readOnly={isReadOnly}
                    />
                    {showErrors && errors.maximumApplicationAllowed && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.maximumApplicationAllowed.message}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">Configure how many times this leave can be applied for</p>
              </div>

              <div className={`flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 shadow-md hover:shadow-lg transition-all duration-200 ${
                (showErrors && errors.halfDayAllowed) 
                  ? "border-red-300 bg-red-50" 
                  : "border-blue-300"
              }`}>
                <div className="space-y-1">
                  <Label htmlFor="halfDayAllowed" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${watchedValues.halfDayAllowed ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    Allow Half Day Applications
                  </Label>
                  <p className="text-xs text-blue-700">Enable employees to apply for half-day leave</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${watchedValues.halfDayAllowed ? 'text-green-600' : 'text-gray-500'}`}>
                    {watchedValues.halfDayAllowed ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch
                    id="halfDayAllowed"
                    checked={watchedValues.halfDayAllowed}
                    onCheckedChange={(checked) => {
                      if (!isReadOnly) {
                        setValue('halfDayAllowed', checked);
                        handleInputChange('halfDayAllowed', checked);
                      }
                    }}
                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                    disabled={isReadOnly}
                  />
                </div>
              </div>
              {showErrors && errors.halfDayAllowed && (
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.halfDayAllowed.message}
                </p>
              )}

              {/* Additional Application Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <Label htmlFor="alertManagerDaysBeforeLeaveStart" className="text-sm font-semibold text-gray-700 mb-2 block">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Alert Manager Days Before Leave Start
                  </Label>
                  <Input
                    {...register("alertManagerDaysBeforeLeaveStart", { valueAsNumber: true })}
                    id="alertManagerDaysBeforeLeaveStart"
                    type="number"
                    className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                      isReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : ""
                    } ${
                      (showErrors && errors.alertManagerDaysBeforeLeaveStart) 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    placeholder="10"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                  />
                  <p className="text-xs text-gray-500">Days before leave start to alert manager</p>
                  {showErrors && errors.alertManagerDaysBeforeLeaveStart && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.alertManagerDaysBeforeLeaveStart.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error Summary */}
          {showErrors && Object.keys(errors).length > 0 && (
            <div className="lg:col-span-3 mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <X className="h-5 w-5 text-red-600" />
                <h3 className="text-sm font-semibold text-red-800">
                  Please fix the following {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''}:
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(errors).map(([field, error]) => (
                  <div key={field} className="flex items-center gap-2 text-sm text-red-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span>{error?.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} remaining
                  </div>
                )}
              </div>
              
              {!isReadOnly && (
                <>
                  <Button
                    type="button"
                    onClick={handleSaveAndContinue}
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
                        <CheckCircle className="h-4 w-4" />
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
                      className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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