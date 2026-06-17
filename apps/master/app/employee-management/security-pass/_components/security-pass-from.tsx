"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { Save, ArrowLeft, User, Phone, Building2, FileText, Users, GraduationCap, Briefcase, Heart, Settings, ChevronLeft, ChevronRight, Banknote } from "lucide-react"
import { TrainingAssetsForm as WorkOrderForm } from "./police/training-assets-form"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { PoliceVerificationForm } from "./police/police-verfication"
import CordsGeneratePass from "./police/cords-generate-pass"
import DownloadProgressPopup from "@/components/DownloadProgressPopup"
import { useDownloadProgress } from "@/hooks/useDownloadProgress"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import PageNotFound from "@/components/page-notfound"
import { decryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"

// Utility function for base64 to blob conversion
const base64ToBlob = (base64Data: string, mimeType: string): Blob => {
  try {
    // Input validation
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error('Invalid input: base64Data must be a non-empty string');
    }

    // Validate base64 string format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Data)) {
      throw new Error('Invalid base64 string format');
    }

    // Check for reasonable file size (max 50MB to prevent memory issues)
    const estimatedSize = Math.ceil((base64Data.length * 3) / 4);
    if (estimatedSize > 50 * 1024 * 1024) {
      throw new Error('File size too large (max 50MB)');
    }

    // Convert base64 to binary array using proper binary handling
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob with proper MIME type
    const blob = new Blob([bytes], { type: mimeType });

    // Validate blob was created successfully
    if (blob.size === 0) {
      throw new Error('Generated file is empty');
    }

    return blob;
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    throw error;
  }
};

export function SecurityPassForm() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("police-verification")
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const tenantCode = useGetTenantCode()

  const [formData, setFormData] = useState<any>({
    // Police Verification
    policeVerification: [],

    // Cards
    cards: [],

    // Basic Information
    employeeID: "",
    firstName: "",
    lastName: "",
    organizationCode: "",
    contractorCode: "",

    // Other fields can be added as needed
    remark: "",
    status: {
      currentStatus: "Active",
      createdOn: "",
      updatedOn: "",
    },
  })

  // Get employeeId from cookie using hook
  const { employeeId: currentUserEmployeeId } = useKeyclockRoleInfo()

  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const encryptedId = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const mode: "add" | "edit" | "view" = (modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add";

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

  // Centralized role-permissions (align with SecurityPassPage)
  const securityPass = "securityPass"
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "employeeManagement",
    screenName: securityPass,
  });
  const viewMode = rolePermissions?.view || false;
  const editMode = rolePermissions?.edit || false;
  const addMode = rolePermissions?.add || false;

  // Check if the current mode is allowed based on permissions
  const isModeAllowed = (viewMode && mode === "view") || (editMode && mode === "edit") || (addMode && mode === "add")

  // Add audit status state for local tab control
  const [auditStatus, setAuditStatus] = useState<any>({})
  const [auditStatusFormData, setAuditStatusFormData] = useState<any>({})
  const [showDownloadProgress, setShowDownloadProgress] = useState(false)
  
  // Download progress tracking
  const downloadProgress = useDownloadProgress()

  const {
    data: employeeResponse,
    loading: isLoading,
    error: employeeError,
    refetch: fetchEmployee
  } = useRequest<any>({
    url: 'contract_employee/search',
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
      console.error("Error fetching employee data:", error);
    },
    dependencies: [id]
  });

  useEffect(() => {
    if (mode === "view" || mode === "edit") {
      fetchEmployee()
    }
  }, [mode, activeTab])

  const [value, setValue] = useState<any>(employeeResponse?.[0])

  useEffect(() => {
    setValue(employeeResponse?.[0])
  }, [employeeResponse])

  // Populate form data when API response is received
  useEffect(() => {
    if (employeeResponse && employeeResponse[0] && (mode === "edit" || mode === "view")) {
      const employeeData = employeeResponse[0];

      // Normalize the data to match form expectations
      const normalizedData = {
        ...employeeData,
        // Add other field normalizations if needed
      };

      setFormData(normalizedData);
    }
  }, [employeeResponse, mode]);

  // Function to check if a tab is accessible based on audit status
  const isTabAccessible = (tabValue: string) => {
    // In edit and view modes, all tabs are accessible
    if (mode === "edit" || mode === "view") return true

    // In add mode, enforce step-by-step progression
    const tabOrder = ["police-verification", "work-order", "cords-generate-pass"]
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
      case "police-verification":
        return auditStatus.policeVerification === true
      case "work-order":
        return auditStatus.trainingAssets === true
      case "cords-generate-pass":
        return auditStatus.cards === true
      default:
        return false
    }
  }

  // Function to get the next accessible tab
  const getNextAccessibleTab = () => {
    const tabOrder = ["police-verification", "work-order", "cords-generate-pass"]
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
    const tabOrder = ["police-verification", "work-order", "cords-generate-pass"]
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
      const tabOrder = ["police-verification", "work-order", "cords-generate-pass"]
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
      // Show success message
    }
  }

  const handlePreviousTab = () => {
    // In edit and view modes, allow free navigation
    if (mode === "edit" || mode === "view") {
      const tabOrder = ["police-verification", "cords-generate-pass"]
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
      const tabOrder = ["police-verification", "cords-generate-pass"]
      const targetIndex = tabOrder.indexOf(tabValue)

      for (let i = 0; i < targetIndex; i++) {
        const previousTab = tabOrder[i]
        if (!isTabCompleted(previousTab)) {
          const tabLabels = {
            "police-verification": "Police Verification",
            "cords-generate-pass": "Cords Generate Pass"
          }
          setActiveTab(previousTab)
          return
        }
      }
    }
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

  const updatePoliceVerification = (data: any) => {
    if (mode === "view") return; // Don't allow updates in view mode
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const updateCards = (data: any) => {
    if (mode === "view") return; // Don't allow updates in view mode
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  const updateWorkOrder = (data: any) => {
    if (mode === "view") return;
    setFormData((prev: any) => ({ ...prev, ...data }))
  }

  // Get page title based on mode
  const getPageTitle = () => {
    switch (mode) {
      case "add":
        return "Add New Security Pass"
      case "edit":
        return "Edit Security Pass"
      case "view":
        return "View Security Pass"
      default:
        return "Security Pass Management"
    }
  }

  // Get page description based on mode
  const getPageDescription = () => {
    switch (mode) {
      case "add":
        return "Add new security pass and comprehensive profile"
      case "edit":
        return "Edit existing security pass and comprehensive profile"
      case "view":
        return "View security pass details (read-only)"
      default:
        return "Manage security pass and comprehensive profile"
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
          <p className="mt-4 text-gray-600">{isDecrypting ? "Validating access..." : "Loading employee data..."}</p>
        </div>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Show success message

    // Navigate back after showing success
    setTimeout(() => {
      router.push('/employee-management/security-pass')
    }, 2000)
  }

  const handleCancel = () => {
    router.push('/employee-management/security-pass')
  }

  const handleBack = () => {
    router.push('/employee-management/security-pass')
  }

  // Function to handle download progress popup
  const handleShowDownloadProgress = () => {
    setShowDownloadProgress(true)
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
          <span>Security Management</span>
          <span>/</span>
          <span>Security Pass</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">New Security Pass</span>
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
          </div>
        </div>

        <form onSubmit={handleSubmit}>
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
                    { value: "police-verification", label: "Police Verification", icon: User },
                    // { value: "work-order", label: "Work Order", icon: Briefcase },
                    { value: "cords-generate-pass", label: "Generate Pass", icon: FileText },
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
                        className={`flex items-center space-x-3 px-4 py-4 border-b-2 border-transparent rounded-none font-medium transition-colors duration-200 text-sm cursor-pointer relative whitespace-nowrap ${isActive
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

            {/* Police Verification Tab */}
            <TabsContent value="police-verification" className="space-y-6">
              <PoliceVerificationForm
                key={`police-verification-${value?._id || 'new'}-${mode}`}
                formData={formData}
                onFormDataChange={updatePoliceVerification}
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

            {/* Work Order Tab */}
            <TabsContent value="work-order" className="space-y-6">
              <WorkOrderForm
                key={`work-order-${value?._id || 'new'}-${mode}`}
                formData={formData}
                onFormDataChange={updateWorkOrder}
                onNextTab={handleNextTab}
                onPreviousTab={handlePreviousTab}
                mode={"view"}
                auditStatus={auditStatus}
                auditStatusFormData={auditStatusFormData}
                setAuditStatus={setAuditStatus}
                setAuditStatusFormData={setAuditStatusFormData}
                activeTab={activeTab}
              />
            </TabsContent>

            {/* Cords Generate Pass Tab */}
            <TabsContent value="cords-generate-pass" className="space-y-6">
              <CordsGeneratePass
                key={`cords-generate-pass-${value?._id || 'new'}-${mode}`}
                formData={formData}
                onFormDataChange={updateCards}
                onNextTab={handleNextTab}
                onPreviousTab={handlePreviousTab}
                mode={mode as "add" | "edit" | "view"}
                auditStatus={auditStatus}
                auditStatusFormData={auditStatusFormData}
                setAuditStatus={setAuditStatus}
                setAuditStatusFormData={setAuditStatusFormData}
                activeTab={activeTab}
                statusShower={handleShowDownloadProgress}
                downloadProgress={downloadProgress}
                // onShowDownloadProgress={handleShowDownloadProgress}
              />
            </TabsContent>
          </Tabs>

        </form>

        {/* Download Progress Popup */}
        {showDownloadProgress && (
          <DownloadProgressPopup
            isOpen={showDownloadProgress}
            onClose={() => {
              setShowDownloadProgress(false)
              downloadProgress.reset()
            }}
            onDownload={async () => {
              try {
                
                // Update progress: Initializing
                downloadProgress.updateProgress(5, 'Initializing security pass generation...');
                
                // Get the current employee data for PDF generation
                const employeeData = auditStatusFormData || value;

                if (!employeeData) {
                  console.error('No employee data available for PDF generation');
                  throw new Error('Employee data not found');
                }

                // Update progress: Preparing data
                downloadProgress.updateProgress(15, 'Preparing security pass data...');

                // Build the payload for security pass generation
                const jsonData = {
                  tenant: tenantCode,
                  action: "insert",
                  collectionName: "securityPasses",
                  event: "reportGeneration",
                  id: "",
                  data: {
                    status: "Initiated",
                    workflowName: "SecurityPass",
                    organizationCode: tenantCode,
                    tenantCode: tenantCode,
                    employeeID: String(employeeData.employeeID || employeeData._id || ""),
                    securityPass: {
                      // Add security pass specific data here
                      generatedOn: new Date().toISOString(),
                      status: "Active"
                    },
                    uploadedBy: "user",
                    createdOn: new Date().toISOString(),
                  }
                };

                // Update progress: Making API call
                downloadProgress.updateProgress(25, 'Generating security pass PDF...');

                // Make API call to generate PDF
                const response = await fetch('/api/security-pass/generate-pdf', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(jsonData)
                });

                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }

                // Update progress: Processing response
                downloadProgress.updateProgress(40, 'Processing PDF generation...');

                const result = await response.json();

                if (result.success) {

                  // Update progress: Converting to file
                  downloadProgress.updateProgress(60, 'Preparing file for download...');

                  // If the API returns a download URL, trigger download
                  if (result.downloadUrl) {
                    const link = document.createElement('a');
                    link.href = result.downloadUrl;
                    link.download = `security-pass-${employeeData.employeeID || employeeData._id}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }

                  // If the API returns base64 data, convert and download
                  if (result.pdfData) {
                    downloadProgress.updateProgress(80, 'Converting file for download...');
                    
                    const blob = base64ToBlob(result.pdfData, 'application/pdf');
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `security-pass-${employeeData.employeeID || employeeData._id}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    
                    // Small delay to ensure download starts
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }

                  // Update progress: Complete
                  downloadProgress.updateProgress(100, 'Security pass downloaded successfully!');
                  downloadProgress.setComplete();

                } else {
                  throw new Error(result.error || 'PDF generation failed');
                }

              } catch (error) {
                console.error('❌ Error generating PDF:', error);
                downloadProgress.setError(error instanceof Error ? error.message : 'Unknown error');
              }
              // Don't auto-close - let user close manually or handle in parent component
            }}
            fileName="security-pass"
            fileExtension="pdf"
            fileSize="2.5 MB"
            fileType="application/pdf"
            progress={downloadProgress.progress}
            statusMessage={downloadProgress.statusMessage}
          />
        )}

      </div>
    </>
  )
}

