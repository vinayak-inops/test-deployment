"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { Button } from "@repo/ui/components/ui/button"
import { ArrowLeft, Save, Plus, Building2, Shield, Settings, Calculator, CreditCard, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  OrganizationForm, 
  PolicyDetailsForm, 
  RulesRestrictionsForm, 
  AccrualSettingsForm, 
  BalanceManagementForm, 
  EncashmentForm 
} from "./index"
import type { LeavePolicyData, LeavePolicyDataCompat } from "../types/leave-policy.types"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import PageNotFound from "@/components/page-notfound"

export function LeaveManagementForm({ duplicateData }: { duplicateData: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const id = searchParams.get('id')
  const tenantCode = useGetTenantCode()
  
  const isEditMode = mode === 'edit'
  const isAddMode = mode === 'add'
  const isViewMode = mode === 'view'

  // Centralized role-permissions (align with LeavePolicyPage)
  const leavePolicy = "leavePolicy"
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "policy",
    screenName: "leavePolicy",
  });
  const viewMode = rolePermissions?.view || false;
  const editMode = rolePermissions?.edit || false;
  const addMode = rolePermissions?.add || false;

  // Check if the current mode is allowed based on permissions
  const isModeAllowed = (viewMode && mode === "view") || (editMode && mode === "edit") || (addMode && mode === "add")

  // Scroll functionality for tabs
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Initialize form data with empty values
  const [formData, setFormData] = useState<LeavePolicyData>({
    organizationCode: "",
    tenantCode: "",
    subsidiary: {
      subsidiaryCode: "",
      subsidiaryName: ""
    },
    location: {
      locationCode: "",
      locationName: ""
    },
    designation: {
      designationCode: "",
      designationName: ""
    },
    employeeCategory: [],
    leavePolicy: {
      leaveCode: "",
      leaveTitle: "",
      effectiveFrom: "",
      genderAllowed: "",
      maritalStatus: [],
      minimumServicePeriodRequired: 0,
      maximumLeaveAllowed: [],
      maximumApplicationAllowed: [],
      minimumDaysPerApplication: 0,
      maximumDaysPerApplication: 0,
      halfDayAllowed: false,
      sandwichHolidayAsLeave: {
        countAsLeave: false,
        minimumLeaveDays: 0
      },
      sandwichWeekOffAsLeave: {
        countAsLeave: false,
        minimumLeaveDays: 0
      },
      canStartOrEndOnHoliday: false,
      canStartOrEndOnWeekOff: false,
      preApplication: {
        leaveDaysMoreThan: 0,
        applyBeforeDays: 0
      },
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
      cannotCombineWith: {
        prefix: [],
        postfix: []
      },
      balance: {
        balanceValidation: false,
        allowedNegativeBalance: 0,
        minServicePeriodRequired: 0,
        lapseLeaveBalanceAtYearEnd: "",
        maximumBalanceAllowed: 0
      },
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
      },
      encashment: {
        encashmentAllowed: false,
        autoEncashment: false,
        minimumBalanceRequired: 0,
        maximumAllowedEncashment: 0,
        applicationRequired: false,
        maximumApplicationAllowedYearly: 0,
        maximumEncashmentPerApplication: 0
      },
      leaveType: "",
      leaveCategory: ""
    },
    encashment: false
  })

  // Tab state management
  const [activeTab, setActiveTab] = useState("organization")
  
  // Audit status for tab completion tracking
  const [auditStatus, setAuditStatus] = useState<any>({
    organization: false,
    policyDetails: false,
    rulesRestrictions: false,
    accrualSettings: false,
    balanceManagement: false,
    encashment: false
  })

  // Audit status form data for add mode
  const [auditStatusFormData, setAuditStatusFormData] = useState<any>({})

  // Modal state for beautiful alerts
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "warning" | "error" | "info",
    title: "",
    message: ""
  })

  // Helper function to show beautiful modals
  const showModal = (type: "success" | "warning" | "error" | "info", title: string, message: string) => {
    setModalState({
      isOpen: true,
      type,
      title,
      message
    })
  }

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  // Scroll functions for tabs
  const scrollLeft = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  const checkScrollButtons = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  // Check scroll buttons on mount and when tabs change
  useEffect(() => {
    checkScrollButtons()
    const handleResize = () => checkScrollButtons()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab])

  // API hook for final data save
  const {
    post: postLeavePolicyData,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "leave_policy",
    onSuccess: (data) => {
      showModal("success", "✅ Success!", "Leave policy has been saved successfully! Redirecting to leave policy management...")
      // Add small delay to ensure user sees the success message before redirect
      setTimeout(() => {
        router.push('/leave-policy');
      }, 2000);
    },
    onError: (error) => {
      showModal("error", "❌ Error!", "Failed to save leave policy. Please try again.")
      console.error("POST error:", error);
    },
  });

  // API hook for fetching existing data in edit mode
  const {
    data: leavePolicyResponse,
    loading: isLoading,
    error: leavePolicyError,
    refetch: fetchLeavePolicy1
  } = useRequest<any>({
    url: 'leave_policy/search',
    method: 'POST',
    data: [
      {
        field: "_id",
        value: id,
        operator: "eq",
      }
    ],
    onSuccess: (data) => { },
    onError: (error) => {
      console.error("Error fetching leave policy data:", error);
    },
    dependencies: [id]
  });

  useEffect(() => {
    if (isEditMode || isViewMode) {
      fetchLeavePolicy1()
    }
  }, [isEditMode, isViewMode, id])

  // Populate form data when API response is received in edit/view mode
  useEffect(() => {
    if (leavePolicyResponse && leavePolicyResponse[0] && (isEditMode || isViewMode)) {
      const policyData = leavePolicyResponse[0];
      
      // Set the form data with the fetched policy data
      setFormData(policyData);
    }
  }, [leavePolicyResponse, isEditMode, isViewMode]);

  // Fetch data when in edit or view mode
  useEffect(() => {
    if ((isEditMode || isViewMode) && id) {
      fetchLeavePolicy()
    }
  }, [isEditMode, isViewMode, id])

  const handleFormDataChange = (data: Partial<LeavePolicyData>) => {
    setFormData(prev => ({
      ...prev,
      ...data,
      // Deep merge nested objects
      ...(data.subsidiary && { subsidiary: { ...prev.subsidiary, ...data.subsidiary } }),
      ...(data.location && { location: { ...prev.location, ...data.location } }),
      ...(data.designation && { designation: { ...prev.designation, ...data.designation } }),
      ...(data.leavePolicy && { 
        leavePolicy: {
          ...prev.leavePolicy,
          ...data.leavePolicy,
          // Deep merge nested leavePolicy objects with null checks
          ...(data.leavePolicy.sandwichHolidayAsLeave && { 
            sandwichHolidayAsLeave: { 
              ...(prev.leavePolicy?.sandwichHolidayAsLeave || {}), 
              ...data.leavePolicy.sandwichHolidayAsLeave 
            } 
          }),
          ...(data.leavePolicy.sandwichWeekOffAsLeave && { 
            sandwichWeekOffAsLeave: { 
              ...(prev.leavePolicy?.sandwichWeekOffAsLeave || {}), 
              ...data.leavePolicy.sandwichWeekOffAsLeave 
            } 
          }),
          ...(data.leavePolicy.preApplication && { 
            preApplication: { 
              ...(prev.leavePolicy?.preApplication || {}), 
              ...data.leavePolicy.preApplication 
            } 
          }),
          ...(data.leavePolicy.autoApproval && { 
            autoApproval: { 
              ...(prev.leavePolicy?.autoApproval || {}), 
              ...data.leavePolicy.autoApproval 
            } 
          }),
          ...(data.leavePolicy.cannotCombineWith && { 
            cannotCombineWith: { 
              ...(prev.leavePolicy?.cannotCombineWith || {}), 
              ...data.leavePolicy.cannotCombineWith 
            } 
          }),
          ...(data.leavePolicy.balance && { 
            balance: { 
              ...(prev.leavePolicy?.balance || {}), 
              ...data.leavePolicy.balance 
            } 
          }),
          ...(data.leavePolicy.leaveAccrual && { 
            leaveAccrual: { 
              ...(prev.leavePolicy?.leaveAccrual || {}), 
              ...data.leavePolicy.leaveAccrual,
              ...(data.leavePolicy.leaveAccrual.accrualPolicy && prev.leavePolicy?.leaveAccrual?.accrualPolicy && {
                accrualPolicy: { ...prev.leavePolicy.leaveAccrual.accrualPolicy, ...data.leavePolicy.leaveAccrual.accrualPolicy }
              })
            }
          }),
          ...(data.leavePolicy.encashment && { 
            encashment: { 
              ...(prev.leavePolicy?.encashment || {}), 
              ...data.leavePolicy.encashment 
            } 
          })
        }
      })
    }))
  }

  // Helper function to properly merge leavePolicy data into auditStatusFormData
  const updateAuditStatusFormData = (newData: any) => {
    setAuditStatusFormData((prev: any) => {
      const merged = {
        ...prev,
        ...newData,
        // Deep merge nested objects
        ...(newData.subsidiary && { subsidiary: { ...prev.subsidiary, ...newData.subsidiary } }),
        ...(newData.location && { location: { ...prev.location, ...newData.location } }),
        ...(newData.designation && { designation: { ...prev.designation, ...newData.designation } }),
        ...(newData.leavePolicy && { 
          leavePolicy: {
            ...prev.leavePolicy,
            ...newData.leavePolicy,
            // Deep merge nested leavePolicy objects
            ...(newData.leavePolicy.sandwichHolidayAsLeave && { 
              sandwichHolidayAsLeave: { ...prev.leavePolicy?.sandwichHolidayAsLeave, ...newData.leavePolicy.sandwichHolidayAsLeave } 
            }),
            ...(newData.leavePolicy.sandwichWeekOffAsLeave && { 
              sandwichWeekOffAsLeave: { ...prev.leavePolicy?.sandwichWeekOffAsLeave, ...newData.leavePolicy.sandwichWeekOffAsLeave } 
            }),
            ...(newData.leavePolicy.preApplication && { 
              preApplication: { ...prev.leavePolicy?.preApplication, ...newData.leavePolicy.preApplication } 
            }),
            ...(newData.leavePolicy.autoApproval && { 
              autoApproval: { ...prev.leavePolicy?.autoApproval, ...newData.leavePolicy.autoApproval } 
            }),
            ...(newData.leavePolicy.cannotCombineWith && { 
              cannotCombineWith: { ...prev.leavePolicy?.cannotCombineWith, ...newData.leavePolicy.cannotCombineWith } 
            }),
            ...(newData.leavePolicy.balance && { 
              balance: { ...prev.leavePolicy?.balance, ...newData.leavePolicy.balance } 
            }),
            ...(newData.leavePolicy.leaveAccrual && { 
              leaveAccrual: { 
                ...prev.leavePolicy?.leaveAccrual, 
                ...newData.leavePolicy.leaveAccrual,
                ...(newData.leavePolicy.leaveAccrual.accrualPolicy && {
                  accrualPolicy: { ...prev.leavePolicy?.leaveAccrual?.accrualPolicy, ...newData.leavePolicy.leaveAccrual.accrualPolicy }
                })
              }
            }),
            ...(newData.leavePolicy.encashment && { 
              encashment: { ...prev.leavePolicy?.encashment, ...newData.leavePolicy.encashment } 
            })
          }
        })
      }
      return merged
    })
  }

  // Function to check if a tab is accessible based on audit status
  const isTabAccessible = (tabValue: string) => {
    // In edit and view modes, all tabs are accessible
    if (isEditMode || isViewMode) return true
    
    // In add mode, enforce step-by-step progression
    const tabOrder = ["organization", "policyDetails", "rulesRestrictions", "accrualSettings", "balanceManagement", "encashment"]
    const currentIndex = tabOrder.indexOf(tabValue)
    
    // First tab is always accessible
    if (currentIndex === 0) return true
    
    // Check if all previous tabs are completed based on audit status
    for (let i = 0; i < currentIndex; i++) {
      const previousTab = tabOrder[i]
      if (!isTabCompleted(previousTab)) {
        return false
      }
    }
    
    return true
  }

  // Function to check if a specific tab is completed based on audit status
  const isTabCompleted = (tabValue: string) => {
    switch (tabValue) {
      case "organization":
        return auditStatus.organization === true
      case "policyDetails":
        return auditStatus.policyDetails === true
      case "rulesRestrictions":
        return auditStatus.rulesRestrictions === true
      case "accrualSettings":
        return auditStatus.accrualSettings === true
      case "balanceManagement":
        return auditStatus.balanceManagement === true
      case "encashment":
        return auditStatus.encashment === true
      default:
        return false
    }
  }

  // Function to get the next accessible tab
  const getNextAccessibleTab = () => {
    const tabOrder = ["organization", "policyDetails", "rulesRestrictions", "accrualSettings", "balanceManagement", "encashment"]
    const currentIndex = tabOrder.indexOf(activeTab)
    
    for (let i = currentIndex + 1; i < tabOrder.length; i++) {
      const nextTab = tabOrder[i]
      if (isTabAccessible(nextTab)) {
        return nextTab
      }
    }
    
    return null
  }

  // Function to get the previous accessible tab
  const getPreviousAccessibleTab = () => {
    const tabOrder = ["organization", "policyDetails", "rulesRestrictions", "accrualSettings", "balanceManagement", "encashment"]
    const currentIndex = tabOrder.indexOf(activeTab)
    
    for (let i = currentIndex - 1; i >= 0; i--) {
      const previousTab = tabOrder[i]
      if (isTabAccessible(previousTab)) {
        return previousTab
      }
    }
    
    return null
  }

  const handleNextTab = () => {
    // In edit and view modes, allow free navigation
    if (isEditMode || isViewMode) {
      const tabOrder = ["organization", "policyDetails", "rulesRestrictions", "accrualSettings", "balanceManagement", "encashment"]
      const currentIndex = tabOrder.indexOf(activeTab)
      const nextIndex = currentIndex + 1
      
      if (nextIndex < tabOrder.length) {
        setActiveTab(tabOrder[nextIndex])
      }
      return
    }
    
    // In add mode, enforce step-by-step progression
    const nextTab = getNextAccessibleTab()
    if (nextTab) {
      setActiveTab(nextTab)
    } else {
      // Show beautiful success modal
      showModal("success", "🎉 Success!", "Leave policy has been saved successfully! All required information has been completed.")
    }
  }

  const handlePreviousTab = () => {
    // In edit and view modes, allow free navigation
    if (isEditMode || isViewMode) {
      const tabOrder = ["organization", "policyDetails", "rulesRestrictions", "accrualSettings", "balanceManagement", "encashment"]
      const currentIndex = tabOrder.indexOf(activeTab)
      const previousIndex = currentIndex - 1
      
      if (previousIndex >= 0) {
        setActiveTab(tabOrder[previousIndex])
      }
      return
    }
    
    // In add mode, enforce step-by-step progression
    const previousTab = getPreviousAccessibleTab()
    if (previousTab) {
      setActiveTab(previousTab)
    }
  }

  // Function to handle tab click with accessibility check
  const handleTabClick = (tabValue: string) => {
    // In edit and view modes, allow free navigation
    if (isEditMode || isViewMode) {
      setActiveTab(tabValue)
      return
    }
    
    // In add mode, enforce step-by-step progression
    if (isTabAccessible(tabValue)) {
      setActiveTab(tabValue)
    } else {
      // Find the first incomplete tab that needs to be completed
      const tabOrder = ["organization", "policyDetails", "rulesRestrictions", "accrualSettings", "balanceManagement", "encashment"]
      const targetIndex = tabOrder.indexOf(tabValue)
      
      for (let i = 0; i < targetIndex; i++) {
        const previousTab = tabOrder[i]
        if (!isTabCompleted(previousTab)) {
          const tabLabels = {
            organization: "Organization",
            policyDetails: "Policy Details", 
            rulesRestrictions: "Rules & Restrictions",
            accrualSettings: "Accrual Settings",
            balanceManagement: "Balance Management",
            encashment: "Encashment"
          }
          showModal("warning", "⚠️ Complete Previous Steps", `Please complete the "${tabLabels[previousTab as keyof typeof tabLabels]}" section first before proceeding to this tab.`)
          setActiveTab(previousTab)
          return
        }
      }
    }
  }

   // GET request for fetching existing leave policy data (for edit/view modes)
   const {
    data: leavePolicyResponse1,
    loading: isLeavePolicyLoading,
    error: leavePolicyError1,
    refetch: fetchLeavePolicy
  } = useRequest<any>({
    url: 'leave_policy/search',
    method: 'POST',
    data: [
      {
        field: "_id",
        value: id,
        operator: "eq",
      }
    ],
    onSuccess: (data) => {
      setAuditStatusFormData(data[0])
    },
    onError: (error) => {
      console.error("Error fetching leave policy data:", error);
    },
    dependencies: [id]
  });
  useEffect(() => {
    if ((isEditMode || isViewMode) && id) {
      fetchLeavePolicy()
    }
  }, [isEditMode, isViewMode, id])
  const handleSave = async () => {
    try {
      if (isAddMode) {
        // In add mode, save all accumulated data from auditStatusFormData
        // Ensure the data is properly structured with complete leavePolicy object
        const finalData = {
          ...auditStatusFormData,
          organizationCode: tenantCode, 
          tenantCode: tenantCode,
          // Mark all sections as completed
          organization: true,
          policyDetails: true,
          rulesRestrictions: true,
          accrualSettings: true,
          balanceManagement: true,
          encashment: true
        }
        
        let json = {
          tenant: tenantCode,
          action: "insert",
          id: null,
          collectionName: "leave_policy",
          data: finalData
        }
        
        postLeavePolicyData(json)
      } else if (isEditMode) {
        // In edit mode, update existing data
        if (leavePolicyResponse && leavePolicyResponse[0]) {
          let json = {
            tenant: tenantCode,
            action: "insert", 
            id: leavePolicyResponse[0]._id || null,
            collectionName: "leave_policy",
            data: {
              ...leavePolicyResponse[0],
              ...formData,
              // Mark all sections as completed
              organization: true,
              policyDetails: true,
              rulesRestrictions: true,
              accrualSettings: true,
              balanceManagement: true,
              encashment: true
            }
          }
          
          postLeavePolicyData(json)
        }
      } else {
        // In view mode, just navigate back
        router.push('/leave-policy')
      }
    } catch (error) {
      console.error('Error saving form:', error)
      showModal("error", "❌ Error!", "Failed to save leave policy. Please try again.")
    }
  }

  const handleBack = () => {
    router.push('/leave-policy')
  }

  const handleCancel = () => {
    router.push('/leave-policy')
  }

  // Get page title based on mode
  const getPageTitle = () => {
    switch (mode) {
      case "add":
        return "Add New Leave Policy"
      case "edit":
        return "Edit Leave Policy"
      case "view":
        return "View Leave Policy"
      default:
        return "Leave Policy Management"
    }
  }

  // Get page description based on mode
  const getPageDescription = () => {
    switch (mode) {
      case "add":
        return "Create a new leave policy with comprehensive configuration"
      case "edit":
        return "Update existing leave policy details"
      case "view":
        return "View leave policy details (read-only)"
      default:
        return "Manage leave policy configuration"
    }
  }

  // Check permissions first - if mode is not allowed, show PageNotFound
  if (!isModeAllowed) {
    return <PageNotFound />
  }

  // Show loading state
  if (isLoading && mode !== "add") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leave policy data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>HR Management</span>
          <span>/</span>
          <span>Leave Management</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">Leave Policy</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-blue-50"
              onClick={handleBack}
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h2>
              <p className="text-gray-600">{getPageDescription()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              className="border-gray-300 hover:bg-gray-50 bg-transparent"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            {/* {!isViewMode && (
              <Button 
                className="bg-gradient-to-r text-white from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                onClick={handleSave}
                disabled={postLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                {postLoading ? "Saving..." : (isEditMode ? "Update Policy" : "Save Policy")}
              </Button>
            )} */}
          </div>
        </div>

        {/* Form Tabs */}
        <Card className="">
          
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabClick} className="w-full">
              {/* Clean Horizontal Tab Navigation with Scroll */}
              <div className="bg-white rounded-lg border border-gray-200 mb-6 shadow-sm relative">
                {/* Left Scroll Button */}
                {canScrollLeft && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={scrollLeft}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50 shadow-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Right Scroll Button */}
                {canScrollRight && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={scrollRight}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50 shadow-sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                
                <div 
                  ref={tabsContainerRef}
                  className="overflow-x-auto hide-scrollbar"
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none'
                  }}
                  onScroll={checkScrollButtons}
                >
                  <TabsList className="w-full justify-start bg-transparent border-b border-gray-100 rounded-none p-0 h-auto min-w-max">
                    {[
                      { value: "organization", label: "Organization", icon: Building2 },
                      { value: "policyDetails", label: "Policy Details", icon: Shield },
                      { value: "rulesRestrictions", label: "Rules & Restrictions", icon: Settings },
                      { value: "accrualSettings", label: "Accrual Settings", icon: Calculator },
                      { value: "balanceManagement", label: "Balance Management", icon: CreditCard },
                      { value: "encashment", label: "Encashment", icon: FileText },
                    ].map((tab) => {
                      const IconComponent = tab.icon
                      const isAccessible = isTabAccessible(tab.value)
                      const isCompleted = isTabCompleted(tab.value)
                      const isActive = activeTab === tab.value
                      
                      return (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          disabled={isAddMode && !isAccessible}
                          className={`flex items-center space-x-3 px-4 py-4 border-b-2 border-transparent rounded-none font-medium transition-colors duration-200 text-sm cursor-pointer relative whitespace-nowrap ${
                            isActive 
                              ? 'border-blue-600 text-blue-600' 
                              : isCompleted 
                                ? 'text-green-600 hover:text-green-700' 
                                : isAccessible 
                                  ? 'text-gray-500 hover:text-gray-700' 
                                  : 'text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{tab.label}</span>
                          {isCompleted && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </div>
              </div>

            <TabsContent value="organization" className="mt-6">
              <OrganizationForm
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onNextTab={handleNextTab}
                mode={mode as "add" | "edit" | "view"}
                auditStatus={auditStatus}
                auditStatusFormData={auditStatusFormData}
                setAuditStatus={setAuditStatus}
                setAuditStatusFormData={updateAuditStatusFormData}
                activeTab={activeTab}
              />
            </TabsContent>

            <TabsContent value="policyDetails" className="mt-6">
              <PolicyDetailsForm
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onNextTab={handleNextTab}
                onPreviousTab={handlePreviousTab}
                mode={mode as "add" | "edit" | "view"}
                auditStatus={auditStatus}
                auditStatusFormData={auditStatusFormData}
                setAuditStatus={setAuditStatus}
                setAuditStatusFormData={updateAuditStatusFormData}
                activeTab={activeTab}
                duplicateData={duplicateData}
              />
            </TabsContent>

            <TabsContent value="rulesRestrictions" className="mt-6">
              <RulesRestrictionsForm
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onNextTab={handleNextTab}
                onPreviousTab={handlePreviousTab}
                mode={mode as "add" | "edit" | "view"}
                auditStatus={auditStatus}
                auditStatusFormData={auditStatusFormData}
                setAuditStatus={setAuditStatus}
                setAuditStatusFormData={updateAuditStatusFormData}
                activeTab={activeTab}
              />
            </TabsContent>

            <TabsContent value="accrualSettings" className="mt-6">
              <AccrualSettingsForm
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onNextTab={handleNextTab}
                onPreviousTab={handlePreviousTab}
                mode={mode as "add" | "edit" | "view"}
                auditStatus={auditStatus}
                auditStatusFormData={auditStatusFormData}
                setAuditStatus={setAuditStatus}
                setAuditStatusFormData={updateAuditStatusFormData}
                activeTab={activeTab}
              />
            </TabsContent>

            <TabsContent value="balanceManagement" className="mt-6">
              <BalanceManagementForm
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onNextTab={handleNextTab}
                onPreviousTab={handlePreviousTab}
                mode={mode as "add" | "edit" | "view"}
                auditStatus={auditStatus}
                auditStatusFormData={auditStatusFormData}
                setAuditStatus={setAuditStatus}
                setAuditStatusFormData={updateAuditStatusFormData}
                activeTab={activeTab}
              />
            </TabsContent>

            <TabsContent value="encashment" className="mt-6">
              <EncashmentForm
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onPreviousTab={handlePreviousTab}
                mode={mode as "add" | "edit" | "view"}
                auditStatus={auditStatus}
                auditStatusFormData={auditStatusFormData}
                setAuditStatus={setAuditStatus}
                setAuditStatusFormData={updateAuditStatusFormData}
                activeTab={activeTab}
              />
            </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Beautiful Modal for Alerts */}
        {/* <BeautifulModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          autoClose={true}
          autoCloseDelay={3000}
        /> */}
      </div>
    </>
  )
} 