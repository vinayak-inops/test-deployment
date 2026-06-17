"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/ui/dropdown-menu"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { FileText, Plus, Trash2, ArrowRight, ArrowLeft, RotateCcw, X, Upload, ChevronDown, ChevronUp, MoreVertical } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import DocumentPreview from "@/components/popup/document-preview"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { SingleSelectField } from "@/components/fields/single-select-field"

// Validation schema for individual document
const documentSchema = z.object({
  documentCategory: z.object({
    documentCategoryCode: z.string().optional(),
    documentCategoryTitle: z.string().optional(),
  }),
  documentType: z.object({
    documentTypeCode: z.string().optional(),
    documentTypeTitle: z.string().optional(),
  }),
  documentPath: z.string().optional(),
  identificationNumber: z.string().optional(),
})

type Document = z.infer<typeof documentSchema>

interface DocumentsComplianceFormProps {
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

export function DocumentsComplianceForm({ 
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
}: DocumentsComplianceFormProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [showErrors, setShowErrors] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: number]: File | null }>({})
  const [fileNames, setFileNames] = useState<{ [key: number]: string }>({})
  const [organizationData, setOrganizationData] = useState<any>({})
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})
  const [showAllDocuments, setShowAllDocuments] = useState(false)
  const tenantCode = useGetTenantCode()
  
  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const currentMode = (modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add";

  const isViewMode = currentMode === "view"

  // Upload hook must be called at top-level
  const { uploadFile: uploadDocument } = useFileUpload({ uploadPath: "contractor" })

  const getFileNameFromPath = (path?: string): string => {
    if (!path) return ""
    const normalized = path.replace(/\\/g, "/")
    const parts = normalized.split("/")
    return parts[parts.length - 1] || path
  }
  const guessMimeFromPath = (path: string): string => {
    const lower = (path || "").toLowerCase()
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
    if (lower.endsWith('.png')) return 'image/png'
    if (lower.endsWith('.gif')) return 'image/gif'
    if (lower.endsWith('.webp')) return 'image/webp'
    if (lower.endsWith('.pdf')) return 'application/pdf'
    if (lower.endsWith('.doc')) return 'application/msword'
    if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    return 'application/octet-stream'
  }

  const buildPreviewUrl = (path?: string | null) => {
    if (!path) return ""
    if (path.startsWith("http") || path.startsWith("data:")) return path
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`
  }

  // Fetch organizational data for document categories and types
  const {
    data: orgData,
    error: orgError,
    loading: orgLoading,
    refetch: fetchOrgData
  } = useRequest<any[]>({
    url: `map/organization/search?tenantCode=${tenantCode}`,
    onSuccess: (data: any) => {
      if (data && data.length > 0) {
        const orgData = data[0];
        setOrganizationData(orgData);
      } else {
        setOrganizationData({});
      }
    },
    onError: (error: any) => {
      console.error('Error loading organization data for documents:', error);
      setOrganizationData({});
    }
  });

  useEffect(() => {
    fetchOrgData()
  }, [])

  

  // Populate documents from fetched data (primary source)
  useEffect(() => {
    if (auditStatusFormData && auditStatusFormData.uploadedDocuments) {
      setDocuments(auditStatusFormData.uploadedDocuments)
    }
  }, [auditStatusFormData])

  // Populate documents from formData (fallback)
  useEffect(() => {
    if (formData && formData.uploadedDocuments && !auditStatusFormData) {
      setDocuments(formData.uploadedDocuments)
    }
  }, [formData, auditStatusFormData])

  // API call for saving documents compliance
  const {
    post: postDocumentsCompliance,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "contractor",
    onSuccess: (data) => {
      setSuccessPopupData({
        title: "Documents & Compliance Saved",
        message: "Documents and compliance details have been saved successfully."
      })
      setShowSuccessPopup(true)
    },
    onError: (error) => {
      console.error("Error saving documents compliance:", error)
    },
  })

  const addDocument = () => {
    const newDocument = {
      documentCategory: {
        documentCategoryCode: "",
        documentCategoryTitle: "",
      },
      documentType: {
        documentTypeCode: "",
        documentTypeTitle: "",
      },
      documentPath: "",
      identificationNumber: "",
    }
    const updatedDocuments = [...documents, newDocument]
    setDocuments(updatedDocuments)
  }

  const removeDocument = (index: number) => {
    const updatedDocuments = documents.filter((_, i) => i !== index)
    setDocuments(updatedDocuments)
    
    // Clean up file states
    const newUploadedFiles = { ...uploadedFiles }
    const newFileNames = { ...fileNames }
    delete newUploadedFiles[index]
    delete newFileNames[index]
    
    // Reindex remaining files
    const reindexedFiles: { [key: number]: File | null } = {}
    const reindexedNames: { [key: number]: string } = {}
    
    Object.keys(newUploadedFiles).forEach((key) => {
      const oldIndex = parseInt(key)
      if (oldIndex > index) {
        reindexedFiles[oldIndex - 1] = newUploadedFiles[oldIndex]
        reindexedNames[oldIndex - 1] = newFileNames[oldIndex]
      } else {
        reindexedFiles[oldIndex] = newUploadedFiles[oldIndex]
        reindexedNames[oldIndex] = newFileNames[oldIndex]
      }
    })
    
    setUploadedFiles(reindexedFiles)
    setFileNames(reindexedNames)
  }

  const updateDocument = (index: number, field: string, value: string) => {
    const updated = [...documents]
    const fieldParts = field.split('.')
    if (fieldParts.length === 2) {
      const [parentField, childField] = fieldParts
      updated[index] = {
        ...updated[index],
        [parentField]: {
          ...(updated[index][parentField as keyof Document] as any),
          [childField]: value
        }
      }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setDocuments(updated)
  }

  const handleFileUpload = async (index: number, file: File | null) => {
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [index]: file }))
      setFileNames(prev => ({ ...prev, [index]: file.name }))
      
      // Rename and upload via server
      const now = new Date();
      const isoTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const fileExtension = file.name.split('.').pop();
      const employeeID = auditStatusFormData?.contractorCode || 'unknown';
      const docTypeSafe = (documents[index]?.documentType?.documentTypeCode || 'document').replace(/\s+/g,'_')
      const newFileName = `${employeeID}_uploadedDocument_${docTypeSafe}_${isoTime}.${fileExtension}`;

      // Create renamed file and upload
      const renamedFile = new File([file], newFileName, { type: file.type }) as any
      const res = await uploadDocument(renamedFile, newFileName)

      if (res.success && res.serverPath) {
        updateDocument(index, "documentPath", res.serverPath)
      } else {
        updateDocument(index, "documentPath", newFileName)
      }
    } else {
      // Clear file data
      setUploadedFiles(prev => {
        const newFiles = { ...prev }
        delete newFiles[index]
        return newFiles
      })
      setFileNames(prev => {
        const newNames = { ...prev }
        delete newNames[index]
        return newNames
      })
      updateDocument(index, "documentPath", "")
    }
  }

  // Handle document category change and update available document types
  const handleDocumentCategoryChange = (categoryCode: string, index: number) => {
    
    // Find the selected category from organization data
    const selectedCategory = organizationData?.documentMaster?.documentCategory?.find(
      (cat: any) => cat.documentCategoryCode === categoryCode
    )
    
    
    if (selectedCategory) {
      // Update the documents array directly
      const updated = [...documents]
      updated[index] = {
        ...updated[index],
        documentCategory: {
          documentCategoryCode: categoryCode,
          documentCategoryTitle: selectedCategory.documentCategoryName
        },
        documentType: {
          documentTypeCode: "",
          documentTypeTitle: ""
        }
      }
      setDocuments(updated)
    }
  }

  // Handle document type change
  const handleDocumentTypeChange = (documentType: string, index: number) => {
    
    // Update the documents array directly
    const updated = [...documents]
    updated[index] = {
      ...updated[index],
      documentType: {
        documentTypeCode: documentType,
        documentTypeTitle: documentType
      }
    }
    setDocuments(updated)
  }

  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    
    // Documents are now optional, so no validation needed here
    // if (documents.length === 0) {
    //   console.error("At least one document is required")
    //   return
    // }
    
    // Validate all documents
    const validationResults = documents.map(doc => documentSchema.safeParse(doc))
    const hasErrors = validationResults.some(result => !result.success)
    
    if (hasErrors) {
      console.error("Validation errors:", validationResults.filter(r => !r.success))
      return
    }

    // Create the exact JSON structure as requested
    const exactData = {
      uploadedDocuments: documents.map(doc => ({
        documentCategory: {
          documentCategoryCode: doc.documentCategory?.documentCategoryCode || "",
          documentCategoryTitle: doc.documentCategory?.documentCategoryTitle || "",
        },
        documentType: {
          documentTypeCode: doc.documentType?.documentTypeCode || "",
          documentTypeTitle: doc.documentType?.documentTypeTitle || "",
        },
        documentPath: doc.documentPath || "",
        identificationNumber: doc.identificationNumber || "",
      }))
    }
    
    onFormDataChange(exactData)
    
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...exactData
      })
      setAuditStatus?.({
        ...auditStatus,
        documentsCompliance:true
      })
      setSuccessPopupData({
        title: "Documents & Compliance Saved",
        message: "Documents and compliance details have been saved successfully."
      })
      setShowSuccessPopup(true)
    } else if (currentMode === "edit") {
      let json = {
        tenant: tenantCode,
        action: "insert",
        id: auditStatusFormData._id || null,
        collectionName: "contractor",
        data: {
          ...auditStatusFormData,
          ...exactData,
          documentsCompliance: true
        }
      }
      postDocumentsCompliance(json)
    } else {
      // view mode: nothing to save, parent already updated
    }
  }

  // Split actions: Save and Continue
  const handleSave = async () => {
    await handleSaveAndContinue()
  }

  const handleContinue = async () => {
    setShowErrors(true)
    // documents optional; just navigate if available
    if (onNextTab) onNextTab()
  }

  const handleReset = () => {
    setDocuments([])
    onFormDataChange({ uploadedDocuments: [] })
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
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Documents & Compliance</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Document management and compliance records
                </CardDescription>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-8">
          {/* Documents Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Documents ({documents.length})
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
                          onClick={() => setShowAllDocuments(!showAllDocuments)}
                          className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
                        >
                          {showAllDocuments ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2 text-gray-600" />
                              View Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                              View All ({documents.length} documents)
                            </>
                          )}
                        </DropdownMenuItem>
                        {/* Future menu items can be added here */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                {!isViewMode && (
                  <>
                    <Button 
                      onClick={addDocument} 
                      className="px-4 py-2 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Document
                    </Button>
                  </>
                )}
              </div>
            </div>

            {documents.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No documents added yet</p>
                <p className="text-sm text-gray-400">Click "Add Document" to get started</p>
              </div>
            )}

            {[...documents].reverse().map((document, originalIndex) => {
              const actualIndex = documents.length - 1 - originalIndex
              // Show only the most recently added document (first in reverse order) when showAllDocuments is false
              if (!showAllDocuments && originalIndex !== 0) {
                return null
              }
              const validationResult = documentSchema.safeParse(document)
              const errors = validationResult.success ? {} : validationResult.error.flatten().fieldErrors
              
              // Helper function to get nested error
              const getNestedError = (path: string) => {
                if (!validationResult.success) {
                  const pathArray = path.split('.')
                  const errorPath = pathArray.join('.')
                  return validationResult.error.issues.find(issue => 
                    issue.path.join('.') === errorPath
                  )?.message
                }
                return null
              }

              return (
                <div key={actualIndex} className="group/item bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        {actualIndex === documents.length - 1 ? "Latest Document (last update)" : `Document ${actualIndex + 1}`}
                      </h4>
                    </div>
                    {!isViewMode && (
                      <Button
                        onClick={() => removeDocument(actualIndex)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
 
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SingleSelectField
                      key={`documentCategory-${actualIndex}`}
                      id={`documentCategory-${actualIndex}`}
                      label="Document Category"
                      placeholder="Search Document Category"
                      disabled={isViewMode}
                      value={document.documentCategory?.documentCategoryCode || ""}
                      onChange={(value) => handleDocumentCategoryChange(value, actualIndex)}
                      options={orgLoading ? [] : (organizationData?.documentMaster?.documentCategory ?? []).map((category: any) => ({
                        value: category.documentCategoryCode || "",
                        label: `${category.documentCategoryCode || ""} - ${category.documentCategoryName || ""}`,
                        tooltip: `${category.documentCategoryCode || ""} - ${category.documentCategoryName || ""}`
                      }))}
                      showOnlyValueInTrigger
                      className="group"
                      errorMessage={getNestedError('documentCategory.documentCategoryCode') ?? undefined}
                      allowOnlyProvidedOptions
                    />
                    <div className="group">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Document Category Title
                    </Label>
                      <div className={`h-10 px-4 py-2 border-2 rounded-xl flex items-center font-medium transition-all duration-300 ${
                        document.documentCategory?.documentCategoryTitle 
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800" 
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}>
                        {document.documentCategory?.documentCategoryTitle || "Will auto-fill from category selection"}
                      </div>
                      {getNestedError('documentCategory.documentCategoryTitle') && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {getNestedError('documentCategory.documentCategoryTitle')}
                        </p>
                      )}
                    </div>
                    <SingleSelectField
                      key={`documentType-${actualIndex}-${document.documentCategory?.documentCategoryCode || 'none'}`}
                      id={`documentType-${actualIndex}`}
                      label="Document Type"
                      placeholder={!document.documentCategory?.documentCategoryCode ? "Select Document Category first" : "Search Document Type"}
                      disabled={isViewMode || !document.documentCategory?.documentCategoryCode}
                      value={document.documentType?.documentTypeCode || ""}
                      onChange={(value) => handleDocumentTypeChange(value, actualIndex)}
                      options={(() => {
                        if (!document.documentCategory?.documentCategoryCode) {
                          return []
                        }
                        // Get document types for the selected category
                        const selectedCategory = organizationData?.documentMaster?.documentCategory?.find(
                          (cat: any) => cat.documentCategoryCode === document.documentCategory?.documentCategoryCode
                        )
                        const documentTypes = selectedCategory?.documentType || []

                        return documentTypes.map((docType: string) => ({
                          value: docType,
                          label: docType,
                          tooltip: docType
                        }))
                      })()}
                      showOnlyValueInTrigger
                      className="group"
                      errorMessage={getNestedError('documentType.documentTypeCode') ?? undefined}
                      allowOnlyProvidedOptions
                    />
                    <div className="group">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Document Type Title
                    </Label>
                      <div className={`h-10 px-4 py-2 border-2 rounded-xl flex items-center font-medium transition-all duration-300 ${
                        document.documentType?.documentTypeTitle 
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800" 
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}>
                        {document.documentType?.documentTypeTitle || "Will auto-fill from type selection"}
                      </div>
                      {getNestedError('documentType.documentTypeTitle') && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {getNestedError('documentType.documentTypeTitle')}
                        </p>
                      )}
                    </div>
                    <div className="group">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Identification Number
                    </Label>
                      <Input
                        value={document.identificationNumber || ""}
                        onChange={(e) => updateDocument(actualIndex, "identificationNumber", e.target.value)}
                        className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                          isViewMode 
                            ? "bg-gray-100 cursor-not-allowed" 
                            : ""
                        } ${
                          errors.identificationNumber 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                        placeholder="Enter identification number"
                        disabled={isViewMode}
                      />
                      {errors.identificationNumber && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.identificationNumber[0]}
                        </p>
                      )}
                      {!errors.identificationNumber && (
                        <p className="text-gray-500 text-xs mt-1">Enter document identification number</p>
                      )}
                    </div>
                    <div className="group md:col-span-3">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Document Upload
                      </Label>
                      {!isViewMode ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                              <input
                                type="file"
                                id={`file-upload-${actualIndex}`}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null
                                  handleFileUpload(actualIndex, file)
                                }}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        disabled={isViewMode}
                      />
                              <div className={`h-10 border-2 rounded-xl flex items-center px-3 transition-all duration-300 cursor-pointer ${
                                errors.documentPath 
                                  ? "border-red-500 bg-red-50" 
                                  : "border-gray-200 hover:border-blue-300 bg-white"
                              }`}>
                                <Upload className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm text-gray-600 flex-1">
                                  {fileNames[actualIndex] ? "Change file" : "Choose file to upload"}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {(document.documentPath || fileNames[actualIndex]) && (
                            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-800 flex-1" title={document.documentPath || fileNames[actualIndex]}>
                                {getFileNameFromPath(document.documentPath || fileNames[actualIndex])}
                              </span>
                              {document.documentPath && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPreviewDoc({
                                      path: document.documentPath,
                                      mime: guessMimeFromPath(document.documentPath || ""),
                                      title: document.documentType?.documentTypeTitle || `Document ${actualIndex + 1}`
                                    })
                                    setPreviewOpen(true)
                                  }}
                                  className="h-6 px-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                  Preview
                                </Button>
                              )}
                              {!isViewMode && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleFileUpload(actualIndex, null)}
                                  className="h-6 px-2 text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="h-10 border-2 border-gray-200 rounded-xl flex items-center px-3 bg-gray-100">
                            <FileText className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-600 flex-1" title={document.documentPath || undefined}>
                              {document.documentPath ? getFileNameFromPath(document.documentPath) : "No document uploaded"}
                            </span>
                          </div>
                          {document.documentPath && (
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPreviewDoc({
                                    path: document.documentPath,
                                    mime: guessMimeFromPath(document.documentPath || ""),
                                    title: document.documentType?.documentTypeTitle || `Document ${actualIndex + 1}`
                                  })
                                  setPreviewOpen(true)
                                }}
                                className="h-6 px-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                Preview
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {errors.documentPath && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.documentPath[0]}
                        </p>
                      )}
                      {!errors.documentPath && !isViewMode && (
                        <p className="text-gray-500 text-xs mt-1">
                          Upload document file (PDF, DOC, DOCX, JPG, PNG - optional)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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
                              <div className={`w-3 h-3 rounded-full ${documents.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {documents.length > 0 ? `${documents.length} document(s) added` : 'No documents added yet'}
              </span>
              {/* Documents are now optional, so no error message needed */}
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
                  className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300"
                >
                  Continue
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
      <DocumentPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentPath={previewDoc.path}
        mimeType={previewDoc.mime}
        title={previewDoc.title}
      />
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