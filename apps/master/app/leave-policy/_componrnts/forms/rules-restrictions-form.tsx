"use client"

import type React from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Switch } from "@repo/ui/components/ui/switch"
import { Badge } from "@repo/ui/components/ui/badge"
import { Separator } from "@repo/ui/components/ui/separator"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Shield, RotateCcw, Calendar, Clock, XCircle, Bell, X, Hash, ArrowRight, ArrowLeft, CheckCircle, Search } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useSearchParams } from "next/navigation"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { SuccessPopup } from "@/components/success-popup"
import { gql, useQuery } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

import type { LeavePolicyData, LeavePolicyDataCompat } from "../types/leave-policy.types"

// Define the working GraphQL query for leave policy
const LEAVE_POLICY_QUERY = gql`
  query FetchLeavePolicy($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchLeavePolicy(criteriaRequests: $criteriaRequests, collection: $collection) {
      leavePolicy {
        leaveCode
        leaveTitle
      }
      employeeCategory
    }
  }
`;

// Yup Schema for validation
const rulesRestrictionsSchema = yup.object({
  sandwichHolidayAsLeave: yup.object({
    countAsLeave: yup.boolean().default(false),
    minimumLeaveDays: yup.number().min(0, "Minimum leave days must be 0 or greater").default(0)
  }).default({ countAsLeave: false, minimumLeaveDays: 0 }),
  sandwichWeekOffAsLeave: yup.object({
    countAsLeave: yup.boolean().default(false),
    minimumLeaveDays: yup.number().min(0, "Minimum leave days must be 0 or greater").default(0)
  }).default({ countAsLeave: false, minimumLeaveDays: 0 }),
  canStartOrEndOnHoliday: yup.boolean().default(false),
  canStartOrEndOnWeekOff: yup.boolean().default(false),
  preApplication: yup.object({
    leaveDaysMoreThan: yup.number().min(0, "Leave days must be 0 or greater").default(0),
    applyBeforeDays: yup.number().min(0, "Apply before days must be 0 or greater").default(0)
  }).default({ leaveDaysMoreThan: 0, applyBeforeDays: 0 }),
  maximumBackDaysApplicationAllowed: yup.number().min(0, "Maximum back days must be 0 or greater").default(0),
  maximumFutureDaysApplicationAllowed: yup.number().min(0, "Maximum future days must be 0 or greater").default(0),
  requireDocsIfLeaveDaysExceeds: yup.number().min(0, "Require docs days must be 0 or greater").default(0),
  allowedInNoticePeriod: yup.boolean().default(false),
  alertManagerAfterApproval: yup.boolean().default(false),
  alertManagerDaysBeforeLeaveStart: yup.number().min(0, "Alert days must be 0 or greater").default(0),
  delegateApplicable: yup.boolean().default(false),
  reminderFrequencyToApprover: yup.number().min(0, "Reminder frequency must be 0 or greater").default(0),
  autoApproval: yup.object({
    autoApprovalAllowed: yup.boolean().default(false),
    autoApproveIfDateCrossed: yup.boolean().default(false),
    daysForAutoApproval: yup.number().min(0, "Days for auto approval must be 0 or greater").default(0)
  }).default({ autoApprovalAllowed: false, autoApproveIfDateCrossed: false, daysForAutoApproval: 0 }),
  cannotCombineWith: yup.object({
    prefix: yup.array(yup.string()).default([]),
    postfix: yup.array(yup.string()).default([])
  }).default({ prefix: [], postfix: [] })
})

type RulesRestrictionsFormData = yup.InferType<typeof rulesRestrictionsSchema>

interface RulesRestrictionsFormProps {
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

export function RulesRestrictionsForm({ 
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
}: RulesRestrictionsFormProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const isInitializedRef = useRef(false)
  const  tenantCode  = useGetTenantCode()
  
  // Leave options state for dropdowns
  const [leaveOptions, setLeaveOptions] = useState<Array<{ leaveCode: string; leaveTitle: string }>>([])
  const [prefixSearch, setPrefixSearch] = useState("")
  const [postfixSearch, setPostfixSearch] = useState("")
  
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
    },
    dependencies: shouldFetchLeavePolicy ? [id] : ['no-fetch'] // Use different dependency to prevent fetching
  });

  // Extract values but only use them if we should fetch
  const leavePolicyResponse = shouldFetchLeavePolicy ? leavePolicyRequest.data : null;
  const isLoading = shouldFetchLeavePolicy ? leavePolicyRequest.loading : false;
  const leavePolicyRequestError = shouldFetchLeavePolicy ? leavePolicyRequest.error : null;
  const fetchLeavePolicy = leavePolicyRequest.refetch;

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    reset,
  } = useForm<RulesRestrictionsFormData>({
    resolver: yupResolver(rulesRestrictionsSchema),
    defaultValues: {
      sandwichHolidayAsLeave: { countAsLeave: false, minimumLeaveDays: 0 },
      sandwichWeekOffAsLeave: { countAsLeave: false, minimumLeaveDays: 0 },
      canStartOrEndOnHoliday: false,
      canStartOrEndOnWeekOff: false,
      preApplication: { leaveDaysMoreThan: 0, applyBeforeDays: 0 },
      maximumBackDaysApplicationAllowed: 0,
      maximumFutureDaysApplicationAllowed: 0,
      requireDocsIfLeaveDaysExceeds: 0,
      allowedInNoticePeriod: false,
      alertManagerAfterApproval: false,
      alertManagerDaysBeforeLeaveStart: 0,
      delegateApplicable: false,
      reminderFrequencyToApprover: 0,
      autoApproval: {
        autoApprovalAllowed: false,
        autoApproveIfDateCrossed: false,
        daysForAutoApproval: 0
      },
      cannotCombineWith: { prefix: [], postfix: [] },
    },
    mode: "onChange",
  })

  const handleInputChange = useCallback(async (field: keyof RulesRestrictionsFormData, value: any) => {
    setValue(field, value)
    await trigger(field)
    
    // Update form data based on mode
    const currentValues = watch()
    
    // Create exact data structure matching PersonalInformationForm pattern
    const exactData = {
      sandwichHolidayAsLeave: currentValues.sandwichHolidayAsLeave || { countAsLeave: false, minimumLeaveDays: 0 },
      sandwichWeekOffAsLeave: currentValues.sandwichWeekOffAsLeave || { countAsLeave: false, minimumLeaveDays: 0 },
      canStartOrEndOnHoliday: currentValues.canStartOrEndOnHoliday || false,
      canStartOrEndOnWeekOff: currentValues.canStartOrEndOnWeekOff || false,
      preApplication: currentValues.preApplication || { leaveDaysMoreThan: 0, applyBeforeDays: 0 },
      maximumBackDaysApplicationAllowed: currentValues.maximumBackDaysApplicationAllowed || 0,
      maximumFutureDaysApplicationAllowed: currentValues.maximumFutureDaysApplicationAllowed || 0,
      requireDocsIfLeaveDaysExceeds: currentValues.requireDocsIfLeaveDaysExceeds || 0,
      allowedInNoticePeriod: currentValues.allowedInNoticePeriod || false,
      alertManagerAfterApproval: currentValues.alertManagerAfterApproval || false,
      alertManagerDaysBeforeLeaveStart: currentValues.alertManagerDaysBeforeLeaveStart || 0,
      delegateApplicable: currentValues.delegateApplicable || false,
      reminderFrequencyToApprover: currentValues.reminderFrequencyToApprover || 0,
      autoApproval: currentValues.autoApproval || {
        autoApprovalAllowed: false,
        autoApproveIfDateCrossed: false,
        daysForAutoApproval: 0
      },
      cannotCombineWith: currentValues.cannotCombineWith || { prefix: [], postfix: [] },
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
        title: "Rules & Restrictions Saved",
        message: "Your rules and restrictions have been successfully saved. You can now continue to the next section or make additional changes."
      })
      setShowSuccessPopup(true)
    },
    onError: (error) => {
      console.error("Error saving rules & restrictions:", error)
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
        sandwichHolidayAsLeave: formValues.sandwichHolidayAsLeave || { countAsLeave: false, minimumLeaveDays: 0 },
        sandwichWeekOffAsLeave: formValues.sandwichWeekOffAsLeave || { countAsLeave: false, minimumLeaveDays: 0 },
        canStartOrEndOnHoliday: formValues.canStartOrEndOnHoliday || false,
        canStartOrEndOnWeekOff: formValues.canStartOrEndOnWeekOff || false,
        preApplication: formValues.preApplication || { leaveDaysMoreThan: 0, applyBeforeDays: 0 },
        maximumBackDaysApplicationAllowed: formValues.maximumBackDaysApplicationAllowed || 0,
        maximumFutureDaysApplicationAllowed: formValues.maximumFutureDaysApplicationAllowed || 0,
        requireDocsIfLeaveDaysExceeds: formValues.requireDocsIfLeaveDaysExceeds || 0,
        allowedInNoticePeriod: formValues.allowedInNoticePeriod || false,
        alertManagerAfterApproval: formValues.alertManagerAfterApproval || false,
        alertManagerDaysBeforeLeaveStart: formValues.alertManagerDaysBeforeLeaveStart || 0,
        delegateApplicable: formValues.delegateApplicable || false,
        reminderFrequencyToApprover: formValues.reminderFrequencyToApprover || 0,
        autoApproval: formValues.autoApproval || {
          autoApprovalAllowed: false,
          autoApproveIfDateCrossed: false,
          daysForAutoApproval: 0
        },
        cannotCombineWith: formValues.cannotCombineWith || { prefix: [], postfix: [] },
      }
      
      // Create nested leavePolicy structure
      const nestedData = {
        leavePolicy: exactData
      }
      
      if (currentMode === "add") {
        // Update audit status to mark this tab as completed
        setAuditStatus?.({
          ...auditStatus,
          rulesRestrictions: true
        })
        
        // Update audit status form data with nested structure
        setAuditStatusFormData?.({
          ...auditStatusFormData,
          ...nestedData
        })
        
        // Show success popup
        setSuccessPopupData({
          title: "Rules & Restrictions Saved",
          message: "Your rules and restrictions have been successfully saved. You can continue to the next section."
        })
        setShowSuccessPopup(true)
        // Navigation disabled here to allow popup visibility
      } else if (currentMode === "edit") {

        // Update audit status form data with nested structure
        setAuditStatusFormData?.({
          ...auditStatusFormData,
          ...nestedData
        })
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
      sandwichHolidayAsLeave: { countAsLeave: false, minimumLeaveDays: 0 },
      sandwichWeekOffAsLeave: { countAsLeave: false, minimumLeaveDays: 0 },
      canStartOrEndOnHoliday: false,
      canStartOrEndOnWeekOff: false,
      preApplication: { leaveDaysMoreThan: 0, applyBeforeDays: 0 },
      maximumBackDaysApplicationAllowed: 0,
      maximumFutureDaysApplicationAllowed: 0,
      requireDocsIfLeaveDaysExceeds: 0,
      allowedInNoticePeriod: false,
      alertManagerAfterApproval: false,
      alertManagerDaysBeforeLeaveStart: 0,
      delegateApplicable: false,
      reminderFrequencyToApprover: 0,
      autoApproval: {
        autoApprovalAllowed: false,
        autoApproveIfDateCrossed: false,
        daysForAutoApproval: 0
      },
      cannotCombineWith: { prefix: [], postfix: [] },
    }
    
    reset(clearedData as any)
    setShowErrors(false)
    isInitializedRef.current = false; // Reset initialization flag
    
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
    setValue("sandwichHolidayAsLeave", policy?.sandwichHolidayAsLeave || { countAsLeave: false, minimumLeaveDays: 0 });
    setValue("sandwichWeekOffAsLeave", policy?.sandwichWeekOffAsLeave || { countAsLeave: false, minimumLeaveDays: 0 });
    setValue("canStartOrEndOnHoliday", policy?.canStartOrEndOnHoliday || false);
    setValue("canStartOrEndOnWeekOff", policy?.canStartOrEndOnWeekOff || false);
    setValue("preApplication", policy?.preApplication || { leaveDaysMoreThan: 0, applyBeforeDays: 0 });
    setValue("maximumBackDaysApplicationAllowed", policy?.maximumBackDaysApplicationAllowed || 0);
    setValue("maximumFutureDaysApplicationAllowed", policy?.maximumFutureDaysApplicationAllowed || 0);
    setValue("requireDocsIfLeaveDaysExceeds", policy?.requireDocsIfLeaveDaysExceeds || 0);
    setValue("allowedInNoticePeriod", policy?.allowedInNoticePeriod || false);
    setValue("alertManagerAfterApproval", policy?.alertManagerAfterApproval || false);
    setValue("alertManagerDaysBeforeLeaveStart", policy?.alertManagerDaysBeforeLeaveStart || 0);
    setValue("delegateApplicable", policy?.delegateApplicable || false);
    setValue("reminderFrequencyToApprover", policy?.reminderFrequencyToApprover || 0);
    setValue("autoApproval", policy?.autoApproval || { autoApprovalAllowed: false, autoApproveIfDateCrossed: false, daysForAutoApproval: 0 });
    setValue("cannotCombineWith", policy?.cannotCombineWith || { prefix: [], postfix: [] });
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

  // GraphQL query for leave options - exactly like EmployeeBalanceForm
  const {
    data: leavePolicyData,
    error: leavePolicyGraphQLError,
    loading: leavePolicyLoading,
    refetch: refetchLeavePolicy
  } = useQuery(LEAVE_POLICY_QUERY, {
    client,
    variables: {
      criteriaRequests: [
        {
          field: "tenantCode",
          operator: "eq",
          value: tenantCode,
        }
      ],
      collection: "leave_policy",
    },
    errorPolicy: 'all',
    onCompleted: (data) => {
      const list = Array.isArray(data?.fetchLeavePolicy) ? data.fetchLeavePolicy : []
      const options = list.flatMap((item: any) => {
        const policy = item?.leavePolicy
          if (Array.isArray(policy)) {
            return policy
              .filter((p: any) => (p?.leaveCode || p?.levcode) && (p?.leaveTitle || p?.leavetitle))
              .map((p: any) => ({
                leaveCode: p.leaveCode || p.levcode,
                leaveTitle: p.leaveTitle || p.leavetitle,
            }))
          }
          if (policy && (policy.leaveCode || policy.levcode) && (policy.leaveTitle || policy.leavetitle)) {
          return [{ leaveCode: policy.leaveCode || policy.levcode, leaveTitle: policy.leaveTitle || policy.leavetitle }]
        }
        return []
      })
      if (options.length) setLeaveOptions(options)
    },
    onError: (error) => {
      console.error('❌ GraphQL Error loading leave policy data:', error);
      console.error('Error details:', error.message, error.graphQLErrors);
    }
  });

  // Refetch on mount - exactly like EmployeeBalanceForm
  useEffect(() => {
    refetchLeavePolicy()
  }, [])

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
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Rules & Restrictions</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Configure application rules, holiday handling, and approval workflows
                </CardDescription>
                {showErrors && errors.sandwichHolidayAsLeave && (
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
        {/* Holiday & Weekend Rules */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Holiday & Weekend Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sandwich Holiday as Leave */}
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <Label className="text-lg font-semibold text-gray-900">
                      Sandwich Holiday as Leave
                    </Label>
                  </div>
                  <p className="text-sm text-blue-700">Configure maximum leave rules for holidays sandwiched between leave days</p>
                  
                  {/* Count As Leave Switch */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-200">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${watchedValues.sandwichHolidayAsLeave?.countAsLeave ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        Count As Leave
                      </Label>
                      <p className="text-xs text-gray-600">Enable/disable counting holidays as leave days</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${watchedValues.sandwichHolidayAsLeave?.countAsLeave ? 'text-green-600' : 'text-gray-500'}`}>
                        {watchedValues.sandwichHolidayAsLeave?.countAsLeave ? 'Enabled' : 'Disabled'}
                      </span>
                      <Switch
                        checked={watchedValues.sandwichHolidayAsLeave?.countAsLeave || false}
                        onCheckedChange={(checked) => {
                          setValue("sandwichHolidayAsLeave.countAsLeave", checked);
                          handleInputChange('sandwichHolidayAsLeave', {
                            ...watchedValues.sandwichHolidayAsLeave,
                            countAsLeave: checked
                          });
                        }}
                        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>

                  {/* Minimum Leave Days Count */}
                  <div className="p-4 bg-white rounded-xl border border-blue-200">
                    <div className="space-y-3">
                      <Label htmlFor="sandwichHolidayMinDays" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-blue-600" />
                        Minimum Leave Days
                      </Label>
                      <p className="text-xs text-gray-600">Set the minimum number of leave days required</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              if (!isReadOnly) {
                              handleInputChange('sandwichHolidayAsLeave', {
                                ...watchedValues.sandwichHolidayAsLeave,
                                minimumLeaveDays: Math.max(0, (watchedValues.sandwichHolidayAsLeave?.minimumLeaveDays || 0) - 1)
                              })
                            }
                            }}
                            className={`px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors ${
                              isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            disabled={isReadOnly || (watchedValues.sandwichHolidayAsLeave?.minimumLeaveDays || 0) <= 0}
                          >
                            -
                          </button>
                          <Input
                            id="sandwichHolidayMinDays"
                            type="number"
                            value={watchedValues.sandwichHolidayAsLeave?.minimumLeaveDays || 0}
                            onChange={(e) => {
                              if (!isReadOnly) {
                              handleInputChange('sandwichHolidayAsLeave', {
                                ...watchedValues.sandwichHolidayAsLeave,
                                minimumLeaveDays: Number.parseInt(e.target.value) || 0
                              })
                            }
                            }}
                            className={`h-10 w-20 text-center border-0 focus:ring-0 ${
                              isReadOnly ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                            }`}
                            placeholder="0"
                            min="0"
                            disabled={isReadOnly}
                            readOnly={isReadOnly}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!isReadOnly) {
                              handleInputChange('sandwichHolidayAsLeave', {
                                ...watchedValues.sandwichHolidayAsLeave,
                                minimumLeaveDays: (watchedValues.sandwichHolidayAsLeave?.minimumLeaveDays || 0) + 1
                              })
                            }
                            }}
                            className={`px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors ${
                              isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            disabled={isReadOnly}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm text-gray-600">days</span>
                      </div>
                      {showErrors && errors.sandwichHolidayAsLeave?.minimumLeaveDays && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.sandwichHolidayAsLeave.minimumLeaveDays.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sandwich Week Off as Leave */}
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <Label className="text-lg font-semibold text-gray-900">
                      Sandwich Week Off as Leave
                    </Label>
                  </div>
                  <p className="text-sm text-blue-700">Configure maximum leave rules for week offs sandwiched between leave days</p>
                  
                  {/* Count As Leave Switch */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-blue-200">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${watchedValues.sandwichWeekOffAsLeave?.countAsLeave ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        Count As Leave
                      </Label>
                      <p className="text-xs text-gray-600">Enable/disable counting week offs as leave days</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${watchedValues.sandwichWeekOffAsLeave?.countAsLeave ? 'text-green-600' : 'text-gray-500'}`}>
                        {watchedValues.sandwichWeekOffAsLeave?.countAsLeave ? 'Enabled' : 'Disabled'}
                      </span>
                      <Switch
                        checked={watchedValues.sandwichWeekOffAsLeave?.countAsLeave || false}
                        onCheckedChange={(checked) => {
                          setValue("sandwichWeekOffAsLeave.countAsLeave", checked);
                          handleInputChange('sandwichWeekOffAsLeave', {
                            ...watchedValues.sandwichWeekOffAsLeave,
                            countAsLeave: checked
                          });
                        }}
                        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>

                  {/* Minimum Leave Days Count */}
                  <div className="p-4 bg-white rounded-xl border border-blue-200">
                    <div className="space-y-3">
                      <Label htmlFor="sandwichWeekOffMinDays" className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-blue-600" />
                        Minimum Leave Days
                      </Label>
                      <p className="text-xs text-gray-600">Set the minimum number of leave days required</p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              if (!isReadOnly) {
                              handleInputChange('sandwichWeekOffAsLeave', {
                                ...watchedValues.sandwichWeekOffAsLeave,
                                minimumLeaveDays: Math.max(0, (watchedValues.sandwichWeekOffAsLeave?.minimumLeaveDays || 0) - 1)
                              })
                            }
                            }}
                            className={`px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors ${
                              isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            disabled={isReadOnly || (watchedValues.sandwichWeekOffAsLeave?.minimumLeaveDays || 0) <= 0}
                          >
                            -
                          </button>
                          <Input
                            id="sandwichWeekOffMinDays"
                            type="number"
                            value={watchedValues.sandwichWeekOffAsLeave?.minimumLeaveDays || 0}
                            onChange={(e) => {
                              if (!isReadOnly) {
                              handleInputChange('sandwichWeekOffAsLeave', {
                                ...watchedValues.sandwichWeekOffAsLeave,
                                minimumLeaveDays: Number.parseInt(e.target.value) || 0
                              })
                            }
                            }}
                            className={`h-10 w-20 text-center border-0 focus:ring-0 ${
                              isReadOnly ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                            }`}
                            placeholder="0"
                            min="0"
                            disabled={isReadOnly}
                            readOnly={isReadOnly}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!isReadOnly) {
                              handleInputChange('sandwichWeekOffAsLeave', {
                                ...watchedValues.sandwichWeekOffAsLeave,
                                minimumLeaveDays: (watchedValues.sandwichWeekOffAsLeave?.minimumLeaveDays || 0) + 1
                              })
                            }
                            }}
                            className={`px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors ${
                              isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            disabled={isReadOnly}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm text-gray-600">days</span>
                      </div>
                      {showErrors && errors.sandwichWeekOffAsLeave?.minimumLeaveDays && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.sandwichWeekOffAsLeave.minimumLeaveDays.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Can Start or End on Holiday */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${watchedValues.canStartOrEndOnHoliday ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Can Start or End on Holiday
                </Label>
                <p className="text-xs text-blue-700">Allow leave applications to start or end on holidays</p>
              </div>
              <div className="flex items-center gap-3">
                                  <span className={`text-sm font-medium ${watchedValues.canStartOrEndOnHoliday ? 'text-green-600' : 'text-gray-500'}`}>
                    {watchedValues.canStartOrEndOnHoliday ? 'Enabled' : 'Disabled'}
                  </span>
                                  <Switch
                    checked={watchedValues.canStartOrEndOnHoliday || false}
                    onCheckedChange={(checked) => {
                      setValue("canStartOrEndOnHoliday", checked);
                      handleInputChange('canStartOrEndOnHoliday', checked);
                    }}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Can Start or End on Week Off */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${watchedValues.canStartOrEndOnWeekOff ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Can Start or End on Week Off
                </Label>
                <p className="text-xs text-blue-700">Allow leave applications to start or end on week offs</p>
              </div>
              <div className="flex items-center gap-3">
                                  <span className={`text-sm font-medium ${watchedValues.canStartOrEndOnWeekOff ? 'text-green-600' : 'text-gray-500'}`}>
                    {watchedValues.canStartOrEndOnWeekOff ? 'Enabled' : 'Disabled'}
                  </span>
                                  <Switch
                    checked={watchedValues.canStartOrEndOnWeekOff || false}
                    onCheckedChange={(checked) => {
                      setValue("canStartOrEndOnWeekOff", checked);
                      handleInputChange('canStartOrEndOnWeekOff', checked);
                    }}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Application Timing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Application Timing Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="leaveDaysMoreThan" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Leave Days More Than
              </Label>
              <Input
                {...register("preApplication.leaveDaysMoreThan", { valueAsNumber: true })}
                id="leaveDaysMoreThan"
                type="number"
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.preApplication?.leaveDaysMoreThan) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="0"
                disabled={isReadOnly}
                readOnly={isReadOnly}
                min="0"
              />
              <p className="text-xs text-gray-500">Days threshold for pre-application requirement</p>
              {showErrors && errors.preApplication?.leaveDaysMoreThan && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.preApplication.leaveDaysMoreThan.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="applyBeforeDays" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Apply Before Days
              </Label>
              <Input
                {...register("preApplication.applyBeforeDays", { valueAsNumber: true })}
                id="applyBeforeDays"
                type="number"
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.preApplication?.applyBeforeDays) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="0"
                disabled={isReadOnly}
                readOnly={isReadOnly}
                min="0"
              />
              <p className="text-xs text-gray-500">Days before leave start to apply</p>
              {showErrors && errors.preApplication?.applyBeforeDays && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.preApplication.applyBeforeDays.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Approval Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Approval Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto Approval Allowed */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${watchedValues.autoApproval?.autoApprovalAllowed ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Auto Approval Allowed
                </Label>
                <p className="text-xs text-blue-700">Allow automatic approval of leave applications</p>
              </div>
              <div className="flex items-center gap-3">
                                  <span className={`text-sm font-medium ${watchedValues.autoApproval?.autoApprovalAllowed ? 'text-green-600' : 'text-gray-500'}`}>
                    {watchedValues.autoApproval?.autoApprovalAllowed ? 'Enabled' : 'Disabled'}
                  </span>
                                  <Switch
                    checked={watchedValues.autoApproval?.autoApprovalAllowed || false}
                    onCheckedChange={(checked) => {
                      setValue("autoApproval.autoApprovalAllowed", checked);
                      handleInputChange('autoApproval', {
                        ...watchedValues.autoApproval,
                        autoApprovalAllowed: checked
                      });
                    }}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Auto Approve If Date Crossed */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${watchedValues.autoApproval?.autoApproveIfDateCrossed ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Auto Approve If Date Crossed
                </Label>
                <p className="text-xs text-blue-700">Automatically approve if leave date has passed</p>
              </div>
              <div className="flex items-center gap-3">
                                  <span className={`text-sm font-medium ${watchedValues.autoApproval?.autoApproveIfDateCrossed ? 'text-green-600' : 'text-gray-500'}`}>
                    {watchedValues.autoApproval?.autoApproveIfDateCrossed ? 'Enabled' : 'Disabled'}
                  </span>
                                  <Switch
                    checked={watchedValues.autoApproval?.autoApproveIfDateCrossed || false}
                    onCheckedChange={(checked) => {
                      setValue("autoApproval.autoApproveIfDateCrossed", checked);
                      handleInputChange('autoApproval', {
                        ...watchedValues.autoApproval,
                        autoApproveIfDateCrossed: checked
                      });
                    }}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Days For Auto Approval */}
          <div className="space-y-2">
            <Label htmlFor="daysForAutoApproval" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Days For Auto Approval
            </Label>
            <Input
              {...register("autoApproval.daysForAutoApproval", { valueAsNumber: true })}
              id="daysForAutoApproval"
              type="number"
              className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                isReadOnly 
                  ? "bg-gray-100 cursor-not-allowed" 
                  : ""
              } ${
                (showErrors && errors.autoApproval?.daysForAutoApproval) 
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
              placeholder="0"
              disabled={isReadOnly}
              readOnly={isReadOnly}
              min="0"
            />
            <p className="text-xs text-gray-500">Number of days after which leave is auto-approved</p>
            {showErrors && errors.autoApproval?.daysForAutoApproval && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <X className="h-3 w-3" />
                {errors.autoApproval.daysForAutoApproval.message}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Leave Combination Rules */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Leave Combination Rules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prefix Leave Types */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prefixLeaveTypes" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-blue-600" />
                  Cannot Combine With (Prefix) * (Add multiple leave types)
                </Label>
                <p className="text-xs text-gray-500">Leave types that cannot be applied before this leave</p>
                <div className="space-y-3">
                  {/* Leave Type Dropdown */}
                  <Select 
                    value=""
                    onValueChange={(value) => {
                      if (!isReadOnly) {
                      const currentPrefix = watchedValues.cannotCombineWith?.prefix || [];
                      if (value && !currentPrefix.includes(value)) {
                        handleInputChange('cannotCombineWith', {
                          ...watchedValues.cannotCombineWith,
                          prefix: [...currentPrefix, value]
                        });
                        }
                      }
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                      isReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : "bg-white"
                    } ${
                      (showErrors && errors.cannotCombineWith?.prefix) 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`} disabled={isReadOnly}>
                      <SelectValue placeholder={leavePolicyLoading ? 'Loading leave types…' : 'Select leave type to add'} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px]">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search leave types..."
                            value={prefixSearch}
                            onChange={(e) => setPrefixSearch(e.target.value)}
                            className="pl-10 h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                      {leavePolicyLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : leaveOptions.length > 0 ? (
                        (() => {
                          const currentPrefix = watchedValues.cannotCombineWith?.prefix || [];
                          return leaveOptions
                            .filter(o => {
                              if (prefixSearch) {
                                const s = prefixSearch.toLowerCase();
                                if (!o.leaveTitle.toLowerCase().includes(s) && !o.leaveCode.toLowerCase().includes(s)) return false;
                              }
                              // Don't show already selected options
                              return !currentPrefix.includes(o.leaveCode);
                            })
                            .map((o) => (
                              <SelectItem key={o.leaveCode} value={o.leaveCode}>
                                {o.leaveTitle} ({o.leaveCode})
                              </SelectItem>
                            ));
                        })()
                      ) : (
                        <SelectItem value="no-data" disabled>No leave types available</SelectItem>
                      )}
                      {(!leavePolicyLoading && leaveOptions.filter(o => {
                        if (!prefixSearch) return false;
                        const s = prefixSearch.toLowerCase();
                        return o.leaveTitle.toLowerCase().includes(s) || o.leaveCode.toLowerCase().includes(s);
                      }).length === 0 && prefixSearch) && (
                        <SelectItem value="no-results" disabled>No results for "{prefixSearch}"</SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Selected Leave Types Display */}
                  {Array.isArray(watchedValues.cannotCombineWith?.prefix) && watchedValues.cannotCombineWith.prefix.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Selected Leave Types ({watchedValues.cannotCombineWith.prefix.length})
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {watchedValues.cannotCombineWith.prefix.map((leaveType: string | undefined, index: number) => (
                          <Badge
                            key={`${leaveType || ''}-${index}`}
                            variant="secondary"
                            className="px-3 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-lg flex items-center gap-2"
                          >
                            <span className="font-medium">{leaveType || ''}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isReadOnly) {
                                  const updatedPrefix = (watchedValues.cannotCombineWith?.prefix || []).filter((_: string | undefined, i: number) => i !== index);
                                  handleInputChange('cannotCombineWith', {
                                    ...watchedValues.cannotCombineWith,
                                    prefix: updatedPrefix
                                  });
                                  }
                                }}
                                className={`ml-2 text-blue-600 hover:text-blue-800 transition-colors ${
                                  isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={isReadOnly}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(!Array.isArray(watchedValues.cannotCombineWith?.prefix) || watchedValues.cannotCombineWith.prefix.length === 0) && (
                    <div className="h-10 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 flex items-center font-medium shadow-sm">
                      <span className="text-gray-600 italic">No leave types added. Select from dropdown above to add them.</span>
                    </div>
                  )}
                  
                  {/* Error Display */}
                  {showErrors && errors.cannotCombineWith?.prefix && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.cannotCombineWith.prefix.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Postfix Leave Types */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="postfixLeaveTypes" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-blue-600" />
                  Cannot Combine With (Postfix) * (Add multiple leave types)
                </Label>
                <p className="text-xs text-gray-500">Leave types that cannot be applied after this leave</p>
                <div className="space-y-3">
                  {/* Leave Type Dropdown */}
                  <Select 
                    value=""
                    onValueChange={(value) => {
                      if (!isReadOnly) {
                      const currentPostfix = watchedValues.cannotCombineWith?.postfix || [];
                      if (value && !currentPostfix.includes(value)) {
                        handleInputChange('cannotCombineWith', {
                          ...watchedValues.cannotCombineWith,
                          postfix: [...currentPostfix, value]
                        });
                        }
                      }
                    }}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                      isReadOnly 
                        ? "bg-gray-100 cursor-not-allowed" 
                        : "bg-white"
                    } ${
                      (showErrors && errors.cannotCombineWith?.postfix) 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`} disabled={isReadOnly}>
                      <SelectValue placeholder={leavePolicyLoading ? 'Loading leave types…' : 'Select leave type to add'} />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px]">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search leave types..."
                            value={postfixSearch}
                            onChange={(e) => setPostfixSearch(e.target.value)}
                            className="pl-10 h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                      {leavePolicyLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : leaveOptions.length > 0 ? (
                        (() => {
                          const currentPostfix = watchedValues.cannotCombineWith?.postfix || [];
                          return leaveOptions
                            .filter(o => {
                              if (postfixSearch) {
                                const s = postfixSearch.toLowerCase();
                                if (!o.leaveTitle.toLowerCase().includes(s) && !o.leaveCode.toLowerCase().includes(s)) return false;
                              }
                              // Don't show already selected options
                              return !currentPostfix.includes(o.leaveCode);
                            })
                            .map((o) => (
                              <SelectItem key={o.leaveCode} value={o.leaveCode}>
                                {o.leaveTitle} ({o.leaveCode})
                              </SelectItem>
                            ));
                        })()
                      ) : (
                        <SelectItem value="no-data" disabled>No leave types available</SelectItem>
                      )}
                      {(!leavePolicyLoading && leaveOptions.filter(o => {
                        if (!postfixSearch) return false;
                        const s = postfixSearch.toLowerCase();
                        return o.leaveTitle.toLowerCase().includes(s) || o.leaveCode.toLowerCase().includes(s);
                      }).length === 0 && postfixSearch) && (
                        <SelectItem value="no-results" disabled>No results for "{postfixSearch}"</SelectItem>
                      )}
                    </SelectContent>
                  </Select>

                  {/* Selected Leave Types Display */}
                  {Array.isArray(watchedValues.cannotCombineWith?.postfix) && watchedValues.cannotCombineWith.postfix.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Selected Leave Types ({watchedValues.cannotCombineWith.postfix.length})
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {watchedValues.cannotCombineWith.postfix.map((leaveType: string | undefined, index: number) => (
                          <Badge
                            key={`${leaveType || ''}-${index}`}
                            variant="secondary"
                            className="px-3 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-lg flex items-center gap-2"
                          >
                            <span className="font-medium">{leaveType || ''}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isReadOnly) {
                                  const updatedPostfix = (watchedValues.cannotCombineWith?.postfix || []).filter((_: string | undefined, i: number) => i !== index);
                                  handleInputChange('cannotCombineWith', {
                                    ...watchedValues.cannotCombineWith,
                                    postfix: updatedPostfix
                                  });
                                  }
                                }}
                                className={`ml-2 text-blue-600 hover:text-blue-800 transition-colors ${
                                  isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                                disabled={isReadOnly}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {(!Array.isArray(watchedValues.cannotCombineWith?.postfix) || watchedValues.cannotCombineWith.postfix.length === 0) && (
                    <div className="h-10 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 flex items-center font-medium shadow-sm">
                      <span className="text-gray-600 italic">No leave types added. Select from dropdown above to add them.</span>
                    </div>
                  )}
                  
                  {/* Error Display */}
                  {showErrors && errors.cannotCombineWith?.postfix && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.cannotCombineWith.postfix.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Additional Policy Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Additional Policy Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allowed in Notice Period */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${watchedValues.allowedInNoticePeriod ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Allowed in Notice Period
                </Label>
                <p className="text-xs text-blue-700">Allow leave applications during notice period</p>
              </div>
              <div className="flex items-center gap-3">
                                  <span className={`text-sm font-medium ${watchedValues.allowedInNoticePeriod ? 'text-green-600' : 'text-gray-500'}`}>
                    {watchedValues.allowedInNoticePeriod ? 'Enabled' : 'Disabled'}
                  </span>
                                  <Switch
                    checked={watchedValues.allowedInNoticePeriod || false}
                    onCheckedChange={(checked) => {
                      setValue("allowedInNoticePeriod", checked);
                      handleInputChange('allowedInNoticePeriod', checked);
                    }}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Delegate Applicable */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${watchedValues.delegateApplicable ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Delegate Applicable
                </Label>
                <p className="text-xs text-blue-700">Allow delegation of leave approval authority</p>
              </div>
              <div className="flex items-center gap-3">
                                  <span className={`text-sm font-medium ${watchedValues.delegateApplicable ? 'text-green-600' : 'text-gray-500'}`}>
                    {watchedValues.delegateApplicable ? 'Enabled' : 'Disabled'}
                  </span>
                                  <Switch
                    checked={watchedValues.delegateApplicable || false}
                    onCheckedChange={(checked) => {
                      setValue("delegateApplicable", checked);
                      handleInputChange('delegateApplicable', checked);
                    }}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Alert Manager After Approval */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 shadow-md hover:shadow-lg transition-all duration-200">
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${watchedValues.alertManagerAfterApproval ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  Alert Manager After Approval
                </Label>
                <p className="text-xs text-blue-700">Send notification to manager after leave approval</p>
              </div>
              <div className="flex items-center gap-3">
                                  <span className={`text-sm font-medium ${watchedValues.alertManagerAfterApproval ? 'text-green-600' : 'text-gray-500'}`}>
                    {watchedValues.alertManagerAfterApproval ? 'Enabled' : 'Disabled'}
                  </span>
                                  <Switch
                    checked={watchedValues.alertManagerAfterApproval || false}
                    onCheckedChange={(checked) => {
                      setValue("alertManagerAfterApproval", checked);
                      handleInputChange('alertManagerAfterApproval', checked);
                    }}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 data-[state=checked]:border-blue-600 data-[state=unchecked]:border-gray-300 scale-110"
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Additional Numeric Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="reminderFrequencyToApprover" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                Reminder Frequency to Approver (days)
              </Label>
              <Input
                {...register("reminderFrequencyToApprover", { valueAsNumber: true })}
                id="reminderFrequencyToApprover"
                type="number"
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
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
                readOnly={isReadOnly}
                min="0"
              />
              <p className="text-xs text-gray-500">Days between reminder notifications to approver</p>
              {showErrors && errors.reminderFrequencyToApprover && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.reminderFrequencyToApprover.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="alertManagerDaysBeforeLeaveStart" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                Alert Manager Days Before Leave Start
              </Label>
              <Input
                {...register("alertManagerDaysBeforeLeaveStart", { valueAsNumber: true })}
                id="alertManagerDaysBeforeLeaveStart"
                type="number"
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.alertManagerDaysBeforeLeaveStart) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="0"
                disabled={isReadOnly}
                readOnly={isReadOnly}
                min="0"
              />
              <p className="text-xs text-gray-500">Number of days before leave start to send alert to manager</p>
              {showErrors && errors.alertManagerDaysBeforeLeaveStart && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.alertManagerDaysBeforeLeaveStart.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maximumBackDaysApplicationAllowed" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Maximum Back Days Application Allowed
              </Label>
              <Input
                {...register("maximumBackDaysApplicationAllowed", { valueAsNumber: true })}
                id="maximumBackDaysApplicationAllowed"
                type="number"
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.maximumBackDaysApplicationAllowed) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="0"
                disabled={isReadOnly}
                readOnly={isReadOnly}
                min="0"
              />
              <p className="text-xs text-gray-500">Maximum days in past for leave application</p>
              {showErrors && errors.maximumBackDaysApplicationAllowed && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.maximumBackDaysApplicationAllowed.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maximumFutureDaysApplicationAllowed" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Maximum Future Days Application Allowed
              </Label>
              <Input
                {...register("maximumFutureDaysApplicationAllowed", { valueAsNumber: true })}
                id="maximumFutureDaysApplicationAllowed"
                type="number"
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.maximumFutureDaysApplicationAllowed) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="0"
                disabled={isReadOnly}
                readOnly={isReadOnly}
                min="0"
              />
              <p className="text-xs text-gray-500">Maximum days in future for leave application</p>
              {showErrors && errors.maximumFutureDaysApplicationAllowed && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.maximumFutureDaysApplicationAllowed.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requireDocsIfLeaveDaysExceeds" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Require Docs If Leave Days Exceeds
              </Label>
              <Input
                {...register("requireDocsIfLeaveDaysExceeds", { valueAsNumber: true })}
                id="requireDocsIfLeaveDaysExceeds"
                type="number"
                className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 ${
                  isReadOnly 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : ""
                } ${
                  (showErrors && errors.requireDocsIfLeaveDaysExceeds) 
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
                placeholder="0"
                disabled={isReadOnly}
                readOnly={isReadOnly}
                min="0"
              />
              <p className="text-xs text-gray-500">Number of leave days after which documentation is required</p>
              {showErrors && errors.requireDocsIfLeaveDaysExceeds && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {errors.requireDocsIfLeaveDaysExceeds.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <div></div>
          
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