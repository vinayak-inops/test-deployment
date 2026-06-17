"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/ui/dropdown-menu"
import { Shield, Plus, Trash2, ArrowRight, ArrowLeft, RotateCcw, X, ChevronDown, ChevronUp, MoreVertical } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAuditTrailAlert } from "@/hooks/api/useAuditTrailAlert"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { decryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"

// Validation schemas
const licenseSchema = z.object({
  licenseNo: z.string().min(1, "License number is required"),
  licenseFromDate: z.string().min(1, "License from date is required"),
  licenseToDate: z.string().min(1, "License to date is required"),
  workmen: z.number().min(0, "Number of workmen must be positive"),
  issuedOn: z.string().min(1, "Issued on date is required"),
  natureOfWork: z.string().min(1, "Nature of work is required"),
}).superRefine((data, ctx) => {
  // Enhanced validation for license dates
  if (data.licenseFromDate && data.licenseToDate) {
    const fromDate = new Date(data.licenseFromDate);
    const toDate = new Date(data.licenseToDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ensure license to date is not in the future (removed this restriction)
    // if (toDate > today) {
    //   ctx.addIssue({
    //     code: z.ZodIssueCode.custom,
    //     message: "License To Date cannot be in the future",
    //     path: ["licenseToDate"],
    //   });
    // }

    // Ensure license from date is earlier than or equal to license to date
    if (fromDate > toDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "License From Date must be earlier than or equal to License To Date",
        path: ["licenseToDate"],
      });
    }
  }

  // Enhanced validation for issued on date
  if (data.issuedOn && data.licenseFromDate) {
    const issuedDate = new Date(data.issuedOn);
    const fromDate = new Date(data.licenseFromDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ensure issued on date is not in the future
    if (issuedDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Issued On Date cannot be in the future",
        path: ["issuedOn"],
      });
    }

    // Ensure issued on date is less than or equal to license from date
    if (issuedDate > fromDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Issued On Date must be less than or equal to License From Date",
        path: ["issuedOn"],
      });
    }
  }
})

// const importantNumberSchema = z.object({
//   documentTypeCode: z.string().min(1, "Document type code is required"),
//   documentTypeTitle: z.string().min(1, "Document type title is required"),
//   identificatinNumber: z.string().min(1, "Identification number is required"),
// })

type License = z.infer<typeof licenseSchema>
// type ImportantNumber = z.infer<typeof importantNumberSchema>

interface LicensesPermitsFormProps {
  formData: any
  onFormDataChange: (data: any) => void
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  auditStatus?: any
  auditStatusFormData?: any
  setAuditStatus?: (data: any) => void
  setAuditStatusFormData?: (data: any) => void
  activeTab?: string
}

export function LicensesPermitsForm({ 
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
}: LicensesPermitsFormProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const [showAllLicenses, setShowAllLicenses] = useState(false)
  
  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const currentMode = (modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add";
  const tenantCode = useGetTenantCode()
  const isViewMode = currentMode === "view"
  
  // Audit trail hooks
  const { setOldValues, recordAndShowAudit } = useAuditTrailAlert({ showAlert: false })
  const hasSetAuditOldValuesRef = useRef(false)
  const auditRecordIdRef = useRef<string | null>(null)
  const savedDataRef = useRef<{ licenses: License[] } | null>(null)
  const { employeeId } = useKeyclockRoleInfo()

  // Resolve contractor record id from encrypted URL param (do not depend on auditStatusFormData)
  let contractorId: string | null = null
  if (id && currentMode !== "add") {
    try {
      const decrypted: any = decryptEmployeeData(id)
      contractorId = decrypted?._id ?? id
    } catch {
      contractorId = id
    }
  }
  
  const [licenses, setLicenses] = useState<License[]>([
    {
      licenseNo: "",
      licenseFromDate: "",
      licenseToDate: "",
      workmen: 0,
      issuedOn: "",
      natureOfWork: "",
    }
  ])
  // const [importantNumbers, setImportantNumbers] = useState<ImportantNumber[]>([])

  // Real-time validation effect for license dates
  useEffect(() => {
    const validateLicenseDates = () => {
      licenses.forEach((license, index) => {
        if (license.licenseFromDate && license.licenseToDate) {
          const fromDate = new Date(license.licenseFromDate);
          const toDate = new Date(license.licenseToDate);
          
          // If license to date is now invalid, clear it
          if (fromDate > toDate) {
            const updatedLicenses = [...licenses];
            updatedLicenses[index] = { ...updatedLicenses[index], licenseToDate: '' };
            setLicenses(updatedLicenses);
          }
        }
      });
    };

    validateLicenseDates();
  }, [licenses]);


  // Helper function to convert date format
  const convertDateFormat = (dateString: any) => {
    if (!dateString || typeof dateString !== 'string') return "";
    // Check if it's already in yyyy-mm-dd format
    if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
      return dateString;
    }
    // Convert from dd-mm-yyyy to yyyy-mm-dd
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  }

  // Update form values based on mode
  useEffect(() => {
      // In add mode, get values from auditStatusFormData
      if (auditStatusFormData) {
        if (auditStatusFormData.licenses && Array.isArray(auditStatusFormData.licenses)) {
          const formattedLicenses = auditStatusFormData.licenses.map((license: any) => ({
            licenseNo: license.licenseNo || "",
            licenseFromDate: license.licenseFromDate?.$date ? new Date(license.licenseFromDate.$date).toISOString().split('T')[0] : (license.licenseFromDate || ""),
            licenseToDate: license.licenseToDate?.$date ? new Date(license.licenseToDate.$date).toISOString().split('T')[0] : (license.licenseToDate || ""),
            workmen: license.workmen || 0,
            issuedOn: license.issuedOn?.$date ? new Date(license.issuedOn.$date).toISOString().split('T')[0] : (license.issuedOn || ""),
            natureOfWork: license.natureOfWork || "",
          }))
          setLicenses(formattedLicenses)
          
          // Capture initial values for audit trail (old values) when form loads in edit mode
          const recordIdStr = contractorId != null ? String(contractorId) : null
          if (currentMode === "edit" && (recordIdStr !== auditRecordIdRef.current || !hasSetAuditOldValuesRef.current)) {
            auditRecordIdRef.current = recordIdStr
            hasSetAuditOldValuesRef.current = true
            const snapshot: Record<string, unknown> = {
              licenses: formattedLicenses.map((license: License) => ({
                licenseNo: license.licenseNo || "",
                licenseFromDate: license.licenseFromDate || "",
                licenseToDate: license.licenseToDate || "",
                workmen: license.workmen || 0,
                issuedOn: license.issuedOn || "",
                natureOfWork: license.natureOfWork || "",
              })),
            }
            setOldValues(snapshot)
          }
        }
        
        // if (auditStatusFormData.importantNumbers && Array.isArray(auditStatusFormData.importantNumbers)) {
        //   setImportantNumbers(auditStatusFormData.importantNumbers)
        // }
      }
    
  }, [auditStatusFormData, currentMode, contractorId, setOldValues])

  const updateFormData = () => {
    const exactData = {
      licenses: licenses.map(license => ({
        licenseNo: license.licenseNo,
        licenseFromDate: license.licenseFromDate || "",
        licenseToDate: license.licenseToDate || "",
        workmen: license.workmen,
        issuedOn: license.issuedOn || "",
        natureOfWork: license.natureOfWork,
      })),
      // importantNumbers: importantNumbers.map(number => ({
      //   documentTypeCode: number.documentTypeCode,
      //   documentTypeTitle: number.documentTypeTitle,
      //   identificatinNumber: number.identificatinNumber,
      // })),
    }
    // Always update parent form data to keep it in sync
    onFormDataChange(exactData)
  }

  // API call for saving licenses and permits
  const {
    post: postLicensesPermits,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "contractor",
    onSuccess: (data) => {
      setSuccessPopupData({
        title: "Licenses & Permits Saved",
        message: "Licenses and permits have been saved successfully."
      })
      setShowSuccessPopup(true)
      
      // Update old values after successful save so subsequent changes compare against saved state
      if (currentMode === "edit" && savedDataRef.current) {
        const snapshot: Record<string, unknown> = {
          licenses: savedDataRef.current.licenses,
        }
        setOldValues(snapshot)
        // Clear the ref after using it
        savedDataRef.current = null
      }
    },
    onError: (error) => {
      console.error("Error saving licenses and permits:", error)
    },
  })

  const addLicense = () => {
    const newLicenses = [
      ...licenses,
      {
        licenseNo: "",
        licenseFromDate: "",
        licenseToDate: "",
        workmen: 0,
        issuedOn: "",
        natureOfWork: "",
      },
    ]
    setLicenses(newLicenses)
    // Keep showAllLicenses as false - don't automatically show all
    updateFormData()
  }

  const removeLicense = (index: number) => {
    // Allow removing all licenses since they are now optional
    const updatedLicenses = licenses.filter((_, i) => i !== index)
    setLicenses(updatedLicenses)
    updateFormData()
  }

  const updateLicense = (index: number, field: string, value: any) => {
    const updatedLicenses = [...licenses]
    updatedLicenses[index] = { ...updatedLicenses[index], [field]: value }
    setLicenses(updatedLicenses)
    updateFormData()
  }

  // const addImportantNumber = () => {
  //   const newImportantNumbers = [
  //     ...importantNumbers,
  //     { documentTypeCode: "", documentTypeTitle: "", identificatinNumber: "" },
  //   ]
  //   setImportantNumbers(newImportantNumbers)
  //   updateFormData()
  // }

  // const removeImportantNumber = (index: number) => {
  //   const updatedImportantNumbers = importantNumbers.filter((_, i) => i !== index)
  //   setImportantNumbers(updatedImportantNumbers)
  //   updateFormData()
  // }

  // const updateImportantNumber = (index: number, field: string, value: string) => {
  //   const updated = [...importantNumbers]
  //   updated[index] = { ...updated[index], [field]: value }
  //   setImportantNumbers(updated)
  //   updateFormData()
  // }

  const handleSaveAndContinue = async () => {
    
    // Licenses are optional - only validate if any are present
    if (licenses.length === 0) {
      // No licenses present, which is allowed
    } else {
      // Licenses are present, so validate all of them
      const licenseValidationResults = licenses.map(license => licenseSchema.safeParse(license))
      const licenseHasErrors = licenseValidationResults.some(result => !result.success)
      
      if (licenseHasErrors) {
        setShowErrors(true)
        console.error("Validation errors:", {
          licenseErrors: licenseValidationResults.filter(r => !r.success),
        })
        
        // Log specific failing fields
        licenseValidationResults.forEach((result, index) => {
          if (!result.success) {
          }
        })
        
        return
      }
    }

    // Create the exact JSON structure as requested
    const exactData = {
      licenses: licenses.map(license => ({
        licenseNo: license.licenseNo,
        licenseFromDate: license.licenseFromDate || "",
        licenseToDate: license.licenseToDate || "",
        workmen: license.workmen,
        issuedOn: license.issuedOn || "",
        natureOfWork: license.natureOfWork,
      })),
      // importantNumbers: importantNumbers.map(number => ({
      //   documentTypeCode: number.documentTypeCode,
      //   documentTypeTitle: number.documentTypeTitle,
      //   identificatinNumber: number.identificatinNumber,
      // })),
    }
    
    // Store the saved data for updating old values after successful save
    if (currentMode === "edit") {
      savedDataRef.current = {
        licenses: licenses.map(license => ({
          licenseNo: license.licenseNo || "",
          licenseFromDate: license.licenseFromDate || "",
          licenseToDate: license.licenseToDate || "",
          workmen: license.workmen || 0,
          issuedOn: license.issuedOn || "",
          natureOfWork: license.natureOfWork || "",
        })),
      }
    }
    
    // Always update parent form data first to ensure data is saved
    onFormDataChange(exactData)
    
    // Update form data based on mode
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...exactData
      })
      setAuditStatus?.({
        ...auditStatus,
        licensesPermits: true
      })
      setSuccessPopupData({
        title: "Licenses & Permits Saved",
        message: "Licenses and permits have been saved successfully."
      })
      setShowSuccessPopup(true)
    } else if (currentMode === "edit") {
      // In edit mode, save to backend with audit trail
      const auditEntry = recordAndShowAudit(exactData as Record<string, unknown>, {
        entityName: "contractor",
        entityID: contractorId,
        tenantCode,
        organizationCode: tenantCode,
        performedBy: employeeId,
      })


      console.log(auditEntry)
      
      let json = {
        tenant: tenantCode,
        action: "update",
        event: "update",
        id: contractorId,
        collectionName: "contractor",
        data: {
          ...auditStatusFormData,
          ...exactData,
          licensesPermits: true
        },
        audit: auditEntry?.audit ?? {},
      }
      postLicensesPermits(json)
    } else {
      // In view mode, just update parent (already done above)
    }
    
  }

  // Split actions: Save and Continue
  const handleSave = async () => {
    await handleSaveAndContinue()
  }

  const handleContinue = async () => {
    setShowErrors(true)
    // Licenses are optional - only validate if any are present
    if (licenses.length === 0) {
      // No licenses present, which is allowed - proceed to next tab
      if (onNextTab) onNextTab()
    } else {
      // Licenses are present, so validate all of them
      const licenseValidationResults = licenses.map(license => licenseSchema.safeParse(license))
      const licenseHasErrors = licenseValidationResults.some(result => !result.success)
      if (!licenseHasErrors && onNextTab) {
        onNextTab()
      }
    }
  }

  const handleReset = () => {
    const resetLicenses = [
      {
        licenseNo: "",
        licenseFromDate: "",
        licenseToDate: "",
        workmen: 0,
        issuedOn: "",
        natureOfWork: "",
      }
    ]
    setLicenses(resetLicenses)
    // setImportantNumbers([])
    
    const clearedData = { 
      licenses: resetLicenses, 
      // importantNumbers: [] 
    }
    
    // Always update parent form data to keep it in sync
    onFormDataChange(clearedData)
    
    // In add mode, also update auditStatusFormData
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...clearedData
      })
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
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Licenses & Permits</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  License information and permit details
                </CardDescription>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {/* {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-blue-600 text-lg">Loading licenses and permits...</div>
          </div>
        )}
        {contractorError && (
          <div className="flex items-center justify-center py-8">
            <div className="text-red-600 text-lg">Error loading data: {contractorError.message}</div>
          </div>
        )} */}
        <div className="space-y-8">
          {/* Licenses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Licenses ({licenses.length})
              </h3>
              <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="px-2 py-2 h-10 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg">
                        <DropdownMenuItem 
                          onClick={() => setShowAllLicenses(!showAllLicenses)}
                          className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
                        >
                          {showAllLicenses ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2 text-gray-600" />
                              View Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                              View All ({licenses.length} licenses)
                            </>
                          )}
                        </DropdownMenuItem>
                        {/* Future menu items can be added here */}
                        {/* <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm">
                          <Settings className="h-4 w-4 mr-2 text-gray-600" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm">
                          <Download className="h-4 w-4 mr-2 text-gray-600" />
                          Export
                        </DropdownMenuItem> */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                {!isViewMode && (
                  <>
                    <Button 
                      onClick={addLicense} 
                      className="px-4 py-2 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add License
                    </Button>
                  </>
                )}
              </div>
            </div>

            {licenses.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No licenses added yet</p>
                <p className="text-sm text-gray-400">Click "Add License" to get started</p>
              </div>
            )}

            {[...licenses].reverse().map((license, originalIndex) => {
              const actualIndex = licenses.length - 1 - originalIndex
              // Show only the most recently added license (first in reverse order) when showAllLicenses is false
              if (!showAllLicenses && originalIndex !== 0) {
                return null
              }
              
              const validationResult = licenseSchema.safeParse(license)
              const errors = validationResult.success ? {} : validationResult.error.flatten().fieldErrors

              return (
                <div key={actualIndex}>
                  <div className="p-6 border-2 border-gray-100 rounded-xl space-y-4 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-md font-semibold text-gray-800">
                        {actualIndex === licenses.length - 1 ? "Latest License (last update)" : `License ${actualIndex + 1}`}
                      </h4>
                      {!isViewMode && (
                        <Button
                          onClick={() => removeLicense(actualIndex)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          License Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={license.licenseNo}
                          onChange={(e) => updateLicense(actualIndex, "licenseNo", e.target.value)}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                            isViewMode 
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                          } ${
                            showErrors && errors.licenseNo 
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter license number"
                          disabled={isViewMode}
                        />
                        {showErrors && errors.licenseNo && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.licenseNo[0]}
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          License From Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={license.licenseFromDate}
                          onChange={(e) => updateLicense(actualIndex, "licenseFromDate", e.target.value)}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                            isViewMode 
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                          } ${
                            showErrors && errors.licenseFromDate 
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : license.licenseFromDate && license.licenseToDate && new Date(license.licenseFromDate) <= new Date(license.licenseToDate) && 
                                 license.issuedOn && new Date(license.issuedOn) <= new Date(license.licenseFromDate)
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          disabled={isViewMode}
                        />
                        {/* Show validation errors for license from date */}
                        {showErrors && errors.licenseFromDate && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.licenseFromDate[0]}
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          License To Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={license.licenseToDate}
                          onChange={(e) => updateLicense(actualIndex, "licenseToDate", e.target.value)}
                          min={license.licenseFromDate ? license.licenseFromDate : undefined}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                            isViewMode 
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                          } ${
                            showErrors && errors.licenseToDate 
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : license.licenseFromDate && license.licenseToDate && new Date(license.licenseFromDate) <= new Date(license.licenseToDate)
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          disabled={isViewMode}
                        />
                        {/* Show validation errors for license to date */}
                        {showErrors && errors.licenseToDate && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.licenseToDate[0]}
                          </p>
                        )}
                        {/* Show validation error for date relationship */}
                        {/* {license.licenseFromDate && license.licenseToDate && new Date(license.licenseFromDate) > new Date(license.licenseToDate) && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            License From Date must be earlier than or equal to License To Date
                          </p>
                        )} */}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Number of Workmen <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          value={license.workmen}
                          onChange={(e) => updateLicense(actualIndex, "workmen", Number.parseInt(e.target.value) || 0)}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                            isViewMode 
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                          } ${
                            showErrors && errors.workmen 
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter number of workmen"
                          disabled={isViewMode}
                        />
                        {showErrors && errors.workmen && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.workmen[0]}
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Issued On <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={license.issuedOn}
                          onChange={(e) => updateLicense(actualIndex, "issuedOn", e.target.value)}
                          max={license.licenseFromDate || new Date().toISOString().split('T')[0]}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                            isViewMode 
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                          } ${
                            showErrors && errors.issuedOn 
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : license.issuedOn && license.licenseFromDate && new Date(license.issuedOn) <= new Date(license.licenseFromDate)
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          disabled={isViewMode}
                        />
                        {/* Show validation errors for issued on date */}
                        {showErrors && errors.issuedOn && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.issuedOn[0]}
                          </p>
                        )}
                        {/* Show validation error for issued on date constraint */}
                        {license.issuedOn && license.licenseFromDate && !isViewMode && (
                          (() => {
                            const issuedDate = new Date(license.issuedOn);
                            const fromDate = new Date(license.licenseFromDate);
                            const isValid = issuedDate <= fromDate;
                            return !isValid ? (<></>
                              // <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                              //   <X className="h-3 w-3" />
                              //   Issued On Date must be less than or equal to License From Date
                              // </p>
                            ) : null;
                          })()
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Nature of Work <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={license.natureOfWork}
                          onChange={(e) => updateLicense(actualIndex, "natureOfWork", e.target.value)}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                            isViewMode 
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                          } ${
                            showErrors && errors.natureOfWork 
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter nature of work"
                          disabled={isViewMode}
                        />
                        {showErrors && errors.natureOfWork && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.natureOfWork[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Helpful validation note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">Date Validation Rules:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• <strong>License From Date</strong> must be earlier than or equal to <strong>License To Date</strong></li>
              <li>• <strong>Issued On Date</strong> must be less than or equal to <strong>License From Date</strong></li>
              <li>• <strong>Issued On Date</strong> cannot be in the future</li>
              <li>• <strong>License From Date</strong> and <strong>License To Date</strong> can be in the future (e.g., upcoming licenses/renewals)</li>
            </ul>
          </div>

          {/* <Separator />

          {/* Important Numbers Section */}
          {/* <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Important Numbers
              </h3>
              {!isViewMode && (
                <Button 
                  onClick={addImportantNumber} 
                  className="px-4 py-2 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Number
                </Button>
              )}
            </div>

            {importantNumbers.map((number, index) => {
              const validationResult = importantNumberSchema.safeParse(number)
              const errors = validationResult.success ? {} : validationResult.error.flatten().fieldErrors

              return (
                <div key={index} className="p-6 border-2 border-gray-100 rounded-xl space-y-4 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-semibold text-gray-800">Document {index + 1}</h4>
                    {!isViewMode && (
                      <Button
                        onClick={() => removeImportantNumber(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="group">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Document Type Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={number.documentTypeCode}
                        onChange={(e) => updateImportantNumber(index, "documentTypeCode", e.target.value)}
                        className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                          isViewMode 
                            ? "bg-gray-100 cursor-not-allowed" 
                            : ""
                        } ${
                          errors.documentTypeCode 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                        placeholder="Enter document type code"
                        disabled={isViewMode}
                      />
                      {errors.documentTypeCode && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.documentTypeCode[0]}
                        </p>
                      )}
                    </div>
                    <div className="group">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Document Type Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={number.documentTypeTitle}
                        onChange={(e) => updateImportantNumber(index, "documentTypeTitle", e.target.value)}
                        className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                          isViewMode 
                            ? "bg-gray-100 cursor-not-allowed" 
                            : ""
                        } ${
                          errors.documentTypeTitle 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                        placeholder="Enter document type title"
                        disabled={isViewMode}
                      />
                      {errors.documentTypeTitle && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.documentTypeTitle[0]}
                        </p>
                      )}
                    </div>
                    <div className="group">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Identification Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={number.identificatinNumber}
                        onChange={(e) => updateImportantNumber(index, "identificatinNumber", e.target.value)}
                        className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                          isViewMode 
                            ? "bg-gray-100 cursor-not-allowed" 
                            : ""
                        } ${
                          errors.identificatinNumber 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                        placeholder="Enter identification number"
                        disabled={isViewMode}
                      />
                      {errors.identificatinNumber && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.identificatinNumber[0]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div> */}
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
              <div className={`w-3 h-3 rounded-full ${licenses.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {licenses.length > 0 ? `${licenses.length} license(s) added` : 'No licenses added yet'}
              </span>
              {/* Licenses are now optional, so no error message needed */}
            </div>
            
            {!isViewMode && (
              <>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={postLoading}
                  className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {postLoading ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleContinue}
                  className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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