"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import {
  Building2,
  User,
  FileText,
  CreditCard,
  MapPin,
  Shield,
  ClipboardList,
  AlertTriangle,
  Settings,
  Save,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { BeautifulModal } from "./ui/beautiful-modal"

// Import form components
import { BasicInformationForm } from "./forms/basic-information-form"
import { CompanyDetailsForm } from "./forms/company-details-form"
import { LicensesPermitsForm } from "./forms/licenses-permits-form"
import { FinancialDetailsForm } from "./forms/financial-details-form"
import { AddressInformationForm } from "./forms/address-information-form"
import { DocumentsComplianceForm } from "./forms/documents-compliance-form"
import { WorkOrdersForm } from "./forms/work-orders-form"
import { PenaltiesPoliciesForm } from "./forms/penalties-policies-form"
import { AuditStatusForm } from "./forms/audit-status-form"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import PageNotFound from "@/components/page-notfound"
import { decryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"

export function ContractorManagementForm({ duplicateData }: { duplicateData: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const encryptedId = searchParams.get('id')
  const modeParam = searchParams.get('mode')
  const mode = (modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add"
  
  // Get employeeId from cookie using hook
  const { employeeId: currentUserEmployeeId } = useKeyclockRoleInfo()

  // State for decrypted ID and validation
  const [id, setId] = useState<string | null>(null);
  const [isEmployeeIdMatch, setIsEmployeeIdMatch] = useState<boolean>(true);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  // Decrypt the encrypted ID and validate employeeId match
  useEffect(() => {
    if (encryptedId && mode !== "add") {
      setIsDecrypting(true);
      try {
        const decryptedData = decryptEmployeeData(encryptedId);
        setId(decryptedData._id);
        
        // Check if the employeeId from decrypted data matches current user's employeeId
        const matches = decryptedData.employeeId === currentUserEmployeeId;
        setIsEmployeeIdMatch(matches);
        
        if (!matches) {
          console.warn("Employee ID mismatch. Decrypted:", decryptedData.employeeId, "Current user:", currentUserEmployeeId);
        }
      } catch (error) {
        console.error("Error decrypting employee data:", error);
        setIsEmployeeIdMatch(false);
        setId(null);
      } finally {
        setIsDecrypting(false);
      }
    } else if (mode !== "add" && encryptedId) {
      // If no encrypted ID provided in edit/view mode, use raw ID (for backward compatibility)
      setId(encryptedId);
      setIsEmployeeIdMatch(true);
    } else if (mode === "add") {
      setId(null);
      setIsEmployeeIdMatch(true);
    }
  }, [encryptedId, currentUserEmployeeId, mode]);

  // Centralized role-permissions (align with ContractorManagementPage)
  const contractor = "contractor"
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "user",
    screenName: contractor,
  });
  const viewMode = rolePermissions?.view || false;
  const editMode = rolePermissions?.edit || false;
  const addMode = rolePermissions?.add || false;

  // Check if the current mode is allowed based on permissions
  const isModeAllowed = (viewMode && mode === "view") || (editMode && mode === "edit") || (addMode && mode === "add")

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
    // setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const [activeTab, setActiveTab] = useState("basic")
  const [existingContractors, setExistingContractors] = useState<any[]>([])
  const [formData, setFormData] = useState({
    // Basic Information
    contractorName: "",
    contractorCode: "",
    isActive: true,
    isDeleted: false,
    ownerName: "",
    ownerContactNo: "",
    ownerEmailId: "",
    contactPersonName: "",
    contactPersonContactNo: "",
    contactPersonEmailId: "",
    serviceSince: "",
    typeOfCompany: "",
    workTypeCode: "",
    workTypeTitle: "",
    areaOfWorkCode: "",
    areaOfWorkTitle: "",
    restricted: false,
    contractorImage: "",
    individualContractor: true,
    birthDate: "",
    fatherName: "",
    workLocation: "",
    organizationCode: "",

    // Address Information
    localAddressLine1: "",
    localAddressLine2: "",
    localCountry: "",
    localState: "",
    localCity: "",
    localDistrict: "",
    localPincode: "",
    localContactNumber: "",

    corporateAddressLine1: "",
    corporateAddressLine2: "",
    corporateCountry: "",
    corporateState: "",
    corporateCity: "",
    corporateDistrict: "",
    corporatePincode: "",
    corporateContactNumber: "",

    // Audit Trail
    createdBy: "",
    createdOn: "",
    updatedBy: "",
    updatedOn: "",
  })

  const [licenses, setLicenses] = useState<any[]>([])
  const [importantNumbers, setImportantNumbers] = useState<any[]>([])
  const [bankDetails, setBankDetails] = useState<any[]>([])
  const [securityDeposits, setSecurityDeposits] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [penalties, setPenalties] = useState<any[]>([])
  const [wcPolicies, setWcPolicies] = useState<any[]>([])
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true) // Always show right scroll button initially
  const [auditStatus, setAuditStatus] = useState<any>({})
  const [auditStatusFormData, setAuditStatusFormData] = useState<any>({})
  const tenantCode = useGetTenantCode()

  // Modal state for beautiful alerts
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "warning" | "error" | "info",
    title: "",
    message: ""
  })

  const tabsContainerRef = useRef<HTMLDivElement>(null)

  const {
    data: contractorResponse,
    loading: isLoading,
    error: contractorError,
    refetch: fetchContractor
  } = useRequest<any>({
    url: 'contractor/search',
    method: 'POST',
    data: [
      {
        field: "_id",
        value: id,
        operator: "eq",
      }
    ],
    onSuccess: (data) => { 
      if(data[0].isDeleted!=true){
        setAuditStatusFormData(data[0])
      }
    },
    onError: (error) => {
      console.error("Error fetching contractor data:", error);
    },
    dependencies: [id]
  });

  // Fetch existing contractor data for duplicate checking
  const {
    data: existingContractorsData,
    loading: existingContractorsLoading,
    error: existingContractorsError,
    refetch: fetchExistingContractors
  } = useRequest<any[]>({
    url: `map/contractor/search?tenantCode=${tenantCode}`,
    onSuccess: (data) => {
      setExistingContractors(data || []);
    },
    onError: (error) => {
      console.error("Error fetching existing contractors:", error);
      setExistingContractors([]);
    }
  });

  useEffect(() => {
    // Fetch existing contractors for duplicate checking
    fetchExistingContractors();
  }, []);

  useEffect(() => {
    if (mode === "view" || mode === "edit") {
      fetchContractor()
    }
  }, [mode, activeTab])

  // Check scroll position for tab navigation
  const checkScrollPosition = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current
      const tabsOverflow = scrollWidth > clientWidth
      
      // Show left button if scrolled
      setCanScrollLeft(scrollLeft > 0)
      
      // Show right button if tabs overflow (more aggressive showing)
      if (tabsOverflow) {
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10) // Add 10px buffer
      } else {
        setCanScrollRight(false)
      }
    }
  }

  useEffect(() => {
    // Initial check with a small delay to ensure tabs are rendered
    const timer = setTimeout(() => {
      checkScrollPosition()
    }, 100)
    
    checkScrollPosition()
    window.addEventListener('resize', checkScrollPosition)
    
    // Set up ResizeObserver to watch for tab container size changes
    let resizeObserver: ResizeObserver | null = null
    if (tabsContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        checkScrollPosition()
      })
      resizeObserver.observe(tabsContainerRef.current)
    }
    
    return () => {
      window.removeEventListener('resize', checkScrollPosition)
      clearTimeout(timer)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [])

  // Also check when activeTab changes to ensure proper button visibility
  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollPosition()
    }, 50)
    return () => clearTimeout(timer)
  }, [activeTab])

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200 // Adjust this value as needed
      const newScrollLeft = tabsContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
      tabsContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  // Function to check if a tab is accessible based on audit status
  const isTabAccessible = (tabValue: string) => {
    // In edit and view modes, all tabs are accessible
    if (mode === "edit" || mode === "view") return true
    
    // In add mode, enforce step-by-step progression
    const tabOrder = ["basic", "company", "licenses", "financial", "address", "documents", "workorders", "penalties", "audit"]
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
      case "basic":
        return auditStatus.basicInformation === true
      case "company":
        return auditStatus.companyDetails === true
      case "licenses":
        return auditStatus.licensesPermits === true
      case "financial":
        return auditStatus.financialDetails === true
      case "address":
        return auditStatus.addressInformation === true
      case "documents":
        return auditStatus.documentsCompliance === true
      case "workorders":
        return auditStatus.workOrdersCompleted === true
      case "penalties":
        return auditStatus.penaltiesPolicies === true
      case "audit":
        return true // Audit tab is always considered completed
      default:
        return false
    }
  }

  // Function to get the next accessible tab
  const getNextAccessibleTab = () => {
    const tabOrder = ["basic", "company", "licenses", "financial", "address", "documents", "workorders", "penalties", "audit"]
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
    const tabOrder = ["basic", "company", "licenses", "financial", "address", "documents", "workorders", "penalties", "audit"]
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
    if (mode === "edit" || mode === "view") {
      const tabOrder = ["basic", "company", "licenses", "financial", "address", "documents", "workorders", "penalties", "audit"]
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
      showModal("success", "🎉 Success!", "Contractor record has been saved successfully! All required information has been completed.")
    }
  }

  const handlePreviousTab = () => {
    // In edit and view modes, allow free navigation
    if (mode === "edit" || mode === "view") {
      const tabOrder = ["basic", "company", "licenses", "financial", "address", "documents", "workorders", "penalties", "audit"]
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
    } else {
      // Show alert that no previous tab is accessible
      // alert("No previous tab is accessible.")
    }
  }

  // Function to handle tab click with accessibility check
  const handleTabClick = (tabValue: string) => {
    // In edit and view modes, allow free navigation
    if (mode === "edit" || mode === "view") {
      setActiveTab(tabValue)
      return
    }
    
    // In add mode, enforce step-by-step progression
    if (isTabAccessible(tabValue)) {
      setActiveTab(tabValue)
    } else {
      // Find the first incomplete tab that needs to be completed
      const tabOrder = ["basic", "company", "licenses", "financial", "address", "documents", "workorders", "penalties", "audit"]
      const targetIndex = tabOrder.indexOf(tabValue)
      
      for (let i = 0; i < targetIndex; i++) {
        const previousTab = tabOrder[i]
        if (!isTabCompleted(previousTab)) {
          const tabLabels = {
            basic: "Basic Information",
            company: "Company Details", 
            licenses: "Licenses & Permits",
            financial: "Financial Details",
            address: "Address Information",
            documents: "Documents & Compliance",
            workorders: "Work Orders",
            penalties: "Penalties & Policies",
            audit: "Audit & Status"
          }
          showModal("warning", "⚠️ Complete Previous Steps", `Please complete the "${tabLabels[previousTab as keyof typeof tabLabels]}" section first before proceeding to this tab.`)
          setActiveTab(previousTab)
          return
        }
      }
    }
  }

  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Show success modal
    showModal("success", "✅ Saved Successfully!", `Contractor ${mode === "add" ? "has been created" : "has been updated"} successfully! Redirecting to contractor management...`)
    
    // Navigate back after showing success
    setTimeout(() => {
      // router.push('/contractor')
    }, 2000)
  }

  const handleCancel = () => {
    router.push('/contractor')
  }

  const handleBack = () => {
    router.push('/contractor')
  }

  const updateBasicInformation = (data: any) => {
    if (mode === "view") return; // Don't allow updates in view mode
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const updateCompanyDetails = (data: any) => {
    if (mode === "view") return; // Don't allow updates in view mode
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const updateAddressInformation = (data: any) => {
    if (mode === "view") return; // Don't allow updates in view mode
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const updateAuditStatus = (data: any) => {
    if (mode === "view") return; // Don't allow updates in view mode
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const updateLicensesPermits = (data: any) => {
    if (mode === "view") return; // Don't allow updates in view mode
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const updateFinancialDetails = (data: any) => {
    if (mode === "view") return; // Don't allow updates in view mode
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const updateDocumentsCompliance = (data: any) => {
    if (mode === "view") return; // Don't allow updates in view mode
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const updateWorkOrders = (data: any) => {
    if (mode === "view") return; // Don't allow updates in view mode
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const updatePenaltiesPolicies = (data: any) => {
    if (mode === "view") return; // Don't allow updates in view mode
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  // Get page title based on mode
  const getPageTitle = () => {
    switch (mode) {
      case "add":
        return "Add New Contractor"
      case "edit":
        return "Edit Contractor"
      case "view":
        return "View Contractor"
      default:
        return "Contractor Management"
    }
  }

  // Get page description based on mode
  const getPageDescription = () => {
    switch (mode) {
      case "add":
        return "Add new contractor and company information"
      case "edit":
        return "Edit existing contractor and company information"
      case "view":
        return "View contractor details (read-only)"
      default:
        return "Manage contractor and company information"
    }
  }

  // Check if employeeId matches - if not, show PageNotFound (for edit/view modes only)
  if (!isDecrypting && mode !== "add" && !isEmployeeIdMatch) {
    return <PageNotFound />
  }

  // Check permissions first - if mode is not allowed, show PageNotFound
  if (!isModeAllowed) {
    return <PageNotFound />
  }

  // Show loading state while decrypting or fetching data
  if ((isDecrypting || isLoading) && mode !== "add") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{isDecrypting ? "Validating access..." : "Loading contractor data..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>Contractor Management</span>
        <span>/</span>
        <span>Contractors</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Contractor Management</span>
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
          {/* {mode !== "view" && (
            <Button 
              className="bg-gradient-to-r text-white from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
              onClick={handleSubmit}
            >
              <Save className="w-4 h-4 mr-2" />
              {mode === "add" ? "Task Manager" : "Task Manager"}
            </Button>
          )} */}
        </div>
      </div>

      

      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={handleTabClick} className="w-full">
          {/* Clean Horizontal Tab Navigation */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6 shadow-sm relative">
            {/* Left Scroll Button */}
            {canScrollLeft && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                onClick={() => scrollTabs('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            
            {/* Right Scroll Button */}
            {canScrollRight && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm hover:bg-gray-50"
                onClick={() => scrollTabs('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            
            <div 
              ref={tabsContainerRef}
              className="overflow-x-auto scrollbar-hide"
              onScroll={checkScrollPosition}
            >
              <TabsList className="w-max justify-start bg-transparent border-b border-gray-100 rounded-none p-0 h-auto min-w-full">
              {[
                { value: "basic", label: "Basic Information", icon: User },
                { value: "company", label: "Company Details", icon: Building2 },
                { value: "licenses", label: "Licenses & Permits", icon: Shield },
                { value: "financial", label: "Financial Details", icon: CreditCard },
                { value: "address", label: "Address Information", icon: MapPin },
                { value: "documents", label: "Documents & Compliance", icon: FileText },
                { value: "workorders", label: "Work Orders", icon: ClipboardList },
                { value: "penalties", label: "Penalties & Policies", icon: AlertTriangle },
                // { value: "audit", label: "Audit & Status", icon: Settings },
              ].map((tab) => {
                const IconComponent = tab.icon
                const isAccessible = isTabAccessible(tab.value)
                const isCompleted = isTabCompleted(tab.value)
                const isActive = activeTab === tab.value
                
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    disabled={mode === "add" && !isAccessible}
                    className={`flex items-center space-x-3 px-4 py-4 border-b-2 border-transparent rounded-none font-medium transition-colors duration-200 text-sm cursor-pointer relative ${
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

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <BasicInformationForm
              duplicateData={duplicateData}
              key={`basic-${auditStatusFormData?._id || 'new'}-${mode}`}
              formData={formData}
              onFormDataChange={updateBasicInformation}
              onNextTab={handleNextTab}
              mode={mode as "add" | "edit" | "view"}
              auditStatus={auditStatus}
              auditStatusFormData={auditStatusFormData}
              setAuditStatus={setAuditStatus}
              setAuditStatusFormData={setAuditStatusFormData}
              activeTab={activeTab}
            />
          </TabsContent>

          {/* Company Details Tab */}
          <TabsContent value="company" className="space-y-6">
            <CompanyDetailsForm 
              formData={formData} 
              onFormDataChange={updateCompanyDetails}
              onNextTab={handleNextTab}
              onPreviousTab={handlePreviousTab}
              mode={mode as "add" | "edit" | "view"}
              auditStatus={auditStatus}
              auditStatusFormData={auditStatusFormData}
              setAuditStatus={setAuditStatus}
              setAuditStatusFormData={setAuditStatusFormData}
              activeTab={activeTab}
            />
          </TabsContent>

          {/* Licenses & Permits Tab */}
          <TabsContent value="licenses" className="space-y-6">
                          <LicensesPermitsForm 
                formData={formData}
                onFormDataChange={updateLicensesPermits}
              onNextTab={handleNextTab}
              onPreviousTab={handlePreviousTab}
              mode={mode as "add" | "edit" | "view"}
              auditStatus={auditStatus}
              auditStatusFormData={auditStatusFormData}
              setAuditStatus={setAuditStatus}
              setAuditStatusFormData={setAuditStatusFormData}
              activeTab={activeTab}
            />
          </TabsContent>

          {/* Financial Details Tab */}
          <TabsContent value="financial" className="space-y-6">
                        <FinancialDetailsForm 
              formData={formData}
              onFormDataChange={updateFinancialDetails}
              onNextTab={handleNextTab}
              onPreviousTab={handlePreviousTab}
              mode={mode as "add" | "edit" | "view"}
              auditStatus={auditStatus}
              auditStatusFormData={auditStatusFormData}
              setAuditStatus={setAuditStatus}
              setAuditStatusFormData={setAuditStatusFormData}
              activeTab={activeTab}
            />
          </TabsContent>

          {/* Address Information Tab */}
          <TabsContent value="address" className="space-y-6">
                        <AddressInformationForm 
              formData={formData} 
              onFormDataChange={updateAddressInformation}
              onNextTab={handleNextTab}
              onPreviousTab={handlePreviousTab}
              mode={mode as "add" | "edit" | "view"}
              auditStatus={auditStatus}
              auditStatusFormData={auditStatusFormData}
              setAuditStatus={setAuditStatus}
              setAuditStatusFormData={setAuditStatusFormData}
              activeTab={activeTab}
            />
          </TabsContent>

          {/* Documents & Compliance Tab */}
          <TabsContent value="documents" className="space-y-6">
            <DocumentsComplianceForm 
              formData={formData}
              onFormDataChange={updateDocumentsCompliance}
              onNextTab={handleNextTab}
              onPreviousTab={handlePreviousTab}
              mode={mode as "add" | "edit" | "view"}
              auditStatus={auditStatus}
              auditStatusFormData={auditStatusFormData}
              setAuditStatus={setAuditStatus}
              setAuditStatusFormData={setAuditStatusFormData}
              activeTab={activeTab}
            />
          </TabsContent>

          {/* Work Orders Tab */}
          <TabsContent value="workorders" className="space-y-6">
            <WorkOrdersForm 
              formData={formData}
              onFormDataChange={updateWorkOrders}
              onNextTab={handleNextTab}
              onPreviousTab={handlePreviousTab}
              mode={mode as "add" | "edit" | "view"}
              auditStatus={auditStatus}
              auditStatusFormData={auditStatusFormData}
              setAuditStatus={setAuditStatus}
              setAuditStatusFormData={setAuditStatusFormData}
              activeTab={activeTab}
            />
          </TabsContent>

          {/* Penalties & Policies Tab */}
          <TabsContent value="penalties" className="space-y-6">
            <PenaltiesPoliciesForm 
              formData={formData}
              onFormDataChange={updatePenaltiesPolicies}
              onNextTab={handleNextTab}
              onPreviousTab={handlePreviousTab}
              mode={mode as "add" | "edit" | "view"}
              auditStatus={auditStatus}
              auditStatusFormData={auditStatusFormData}
              setAuditStatus={setAuditStatus}
              setAuditStatusFormData={setAuditStatusFormData}
              activeTab={activeTab}
            />
          </TabsContent>

          {/* Audit & Status Tab */}
          {/* <TabsContent value="audit" className="space-y-6">
            <AuditStatusForm 
              formData={formData} 
              onFormDataChange={updateAuditStatus}
              onPreviousTab={handlePreviousTab}
              mode={mode as "add" | "edit" | "view"}
            />
          </TabsContent> */}
        </Tabs>
      </form>

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
  )
}
