"use client"

import type React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Switch } from "@repo/ui/components/ui/switch"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Separator } from "@repo/ui/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/ui/dropdown-menu"
import { Heart, Plus, Trash2, Upload, FileText, FileCheck, X, Shield, Calendar, ChevronDown, ChevronUp, MoreVertical } from "lucide-react"
import { useState, useEffect } from "react"
import { SuccessPopup } from "@/components/success-popup"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import DocumentPreview from "@/components/popup/document-preview"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// Zod schema for validation
const policeVerificationSchema = z.object({
  policeVerification: z.array(z.object({
    verificationDate: z.string().min(1, "Verification date is required"),
    nextVerificationDate: z.string().min(1, "Next verification date is required"),
    description: z.string().min(1, "Description is required"),
    policeStationDetail: z.string().min(1, "Police station detail is required"),
    policeStationPinCode: z.string().optional(),
    documentPath: z.string().optional(),
    isActive: z.boolean().default(true),
  }).superRefine((data, ctx) => {
    // Custom validation: Verification Date must be equal to or earlier than Next Verification Date
    if (data.verificationDate && data.nextVerificationDate) {
      const verificationDate = new Date(data.verificationDate);
      const nextVerificationDate = new Date(data.nextVerificationDate);

      if (verificationDate > nextVerificationDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Verification Date must be equal to or earlier than Expiry Date",
          path: ["verificationDate"],
        });
      }
    }

    // Custom validation: Verification Date must not be in the future
    if (data.verificationDate) {
      const verificationDate = new Date(data.verificationDate)
      const today = new Date()
      today.setHours(0,0,0,0)
      if (verificationDate > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Verification Date cannot be in the future",
          path: ["verificationDate"],
        })
      }
    }
  })).min(1, "At least one police verification is required"),
})

type PoliceVerificationFormData = z.infer<typeof policeVerificationSchema>

interface PoliceVerificationFormProps {
  formData: any
  onFormDataChange: (data: any) => void
  onPreviousTab?: () => void
  onNextTab?: () => void
  mode?: "add" | "edit" | "view"
  auditStatus?: any
  auditStatusFormData?: any
  setAuditStatus?: (data: any) => void
  setAuditStatusFormData?: (data: any) => void
  activeTab?: string
}

export function PoliceVerificationForm({ 
  formData, 
  onFormDataChange, 
  onPreviousTab,
  onNextTab,
  mode = "add",
  auditStatus,
  auditStatusFormData,
  setAuditStatus,
  setAuditStatusFormData,
  activeTab
}: PoliceVerificationFormProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const currentMode = mode || searchParams.get('mode') || 'add'
  const isViewMode = currentMode === 'view'
  const { uploadFile: uploadDocument } = useFileUpload({ uploadPath: "contract_employee" })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})
  
  // State for managing view mode
  const [showAllPoliceVerifications, setShowAllPoliceVerifications] = useState(false)
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
  const tenantCode = useGetTenantCode()

  const { post: postPoliceVerification } = usePostRequest({
    url: "contract_employee",
    onSuccess: (data) => {
      setSuccessPopupData({
        title: "Police Verification Saved",
        message: "Details have been saved successfully.",
      })
      setShowSuccessPopup(true)
    },
    onError: (error) => {
      console.error("Error saving police verification:", error)
    }
  })

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    reset,
    control,
  } = useForm<PoliceVerificationFormData>({
    resolver: zodResolver(policeVerificationSchema),
    defaultValues: {
      policeVerification: [{
        verificationDate: "",
        nextVerificationDate: "",
        description: "",
        policeStationDetail: "",
        policeStationPinCode: "",
        documentPath: "",
        isActive: true,
      }],
    },
    mode: "onChange",
  })

  const { fields: policeVerificationFields, append: appendPoliceVerification, remove: removePoliceVerification } = useFieldArray({
    control,
    name: "policeVerification",
  })

  const watchedValues = watch()

  // Debug: Log watched values when they change
  useEffect(() => {
  }, [watchedValues]);

  useEffect(() => {
    if (auditStatusFormData) {
      // Populate from auditStatusFormData for add mode
      if (auditStatusFormData.policeVerification) {
        setValue("policeVerification", auditStatusFormData.policeVerification)
      }
    }
  }, [auditStatusFormData, currentMode, setValue])

  const handleReset = () => {
    reset()
    setShowErrors(false)
    // Clear auditStatusFormData or call onFormDataChange with empty data
    if (currentMode === 'add') {
      onFormDataChange({
        policeVerification: [{
          verificationDate: "",
          nextVerificationDate: "",
          description: "",
          policeStationDetail: "",
          policeStationPinCode: "",
          documentPath: "",
          isActive: true,
        }],
      })
    } else {
      onFormDataChange({
        policeVerification: [{
          verificationDate: "",
          nextVerificationDate: "",
          description: "",
          policeStationDetail: "",
          policeStationPinCode: "",
          documentPath: "",
          isActive: true,
        }],
      })
    }
  }

  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    const valid = await trigger()
    if (valid) {
      const formValues = watch()
      
      // Convert nested form values to flat data structure
      const flatData = {
        policeVerification: formValues.policeVerification || [],
      }

      if (currentMode === 'add') {
        setAuditStatusFormData?.({
          ...auditStatusFormData,
          ...flatData,
        })
        setAuditStatus?.({
          ...auditStatus,
          policeVerification: true
        })
        setSuccessPopupData({
          title: "Police Verification Saved",
          message: "Details have been saved successfully.",
        })
        setShowSuccessPopup(true)
      } else {
        // Save to backend for edit mode
        const json = {
          tenant: tenantCode,
          action: "insert",
          id: auditStatusFormData._id ,
          collectionName: "contract_employee",
          data: {
            ...auditStatusFormData,
            ...flatData,
          }
        }
        await postPoliceVerification(json)
      }
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
                <CardTitle className="text-2xl font-bold">Police Verification</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Background checks, character verification, and police clearance records
                </CardDescription>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-8">
          {/* Police Verification */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Police Verification ({(watchedValues.policeVerification?.length || 0)})
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
                          onClick={() => setShowAllPoliceVerifications(!showAllPoliceVerifications)}
                          className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
                        >
                          {showAllPoliceVerifications ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2 text-gray-600" />
                              View Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                              View All ({(watchedValues.policeVerification?.length || 0)} verifications)
                            </>
                          )}
                        </DropdownMenuItem>
                        {/* Future menu items can be added here */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                {!isViewMode && (
                  <>
                    <Button
                      type="button"
                      disabled={isViewMode}
                      onClick={() => appendPoliceVerification({
                        verificationDate: "",
                        nextVerificationDate: "",
                        description: "",
                        policeStationDetail: "",
                        policeStationPinCode: "",
                        documentPath: "",
                        isActive: true,
                      })}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Verification
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Active Status Note */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Only police verification records marked as "Active" will be used for pass generation. 
                You can toggle the active status using the switch below each verification record.
              </p>
            </div>

            <div className="space-y-4">
              {policeVerificationFields.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No police verifications added yet</p>
                  <p className="text-sm">Click "Add Verification" to get started</p>
                </div>
              )}

              {[...policeVerificationFields].reverse().map((field, originalIndex) => {
                const actualIndex = policeVerificationFields.length - 1 - originalIndex
                
                // Show only the most recently added police verification (first in reverse order) when showAllPoliceVerifications is false
                if (!showAllPoliceVerifications && originalIndex !== 0) {
                  return null
                }
                
                return (
                <div key={field.id} className="p-6 border border-gray-200 rounded-xl bg-gray-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-gray-800">
                      {actualIndex === policeVerificationFields.length - 1 ? "Latest Police Verification (last update)" : `Police Verification #${actualIndex + 1}`}
                    </h4>
                    <div className="flex items-center gap-2"> 
                      <Badge className="bg-[#87CEEB] text-[#0056CC]">Verified</Badge>
                      <Badge className={`${watchedValues.policeVerification?.[actualIndex]?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs px-2 py-1 rounded-full`}>
                        {watchedValues.policeVerification?.[actualIndex]?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {policeVerificationFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isViewMode}
                          onClick={() => removePoliceVerification(actualIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="group">
                      <Label className="text-sm font-medium text-gray-700">Verification Date <span className="text-red-500">*</span></Label>
                      <Input
                        {...register(`policeVerification.${actualIndex}.verificationDate`)}
                        type="date"
                        disabled={isViewMode}
                        max={(() => {
                          const today = new Date().toISOString().split('T')[0]
                          const next = watchedValues.policeVerification?.[actualIndex]?.nextVerificationDate
                          if (!next) return today
                          return new Date(next) < new Date(today) ? next : today
                        })()}
                        className={`h-10 border-2 transition-colors duration-200 rounded-xl ${
                          showErrors && errors.policeVerification?.[actualIndex]?.verificationDate 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                            : watchedValues.policeVerification?.[actualIndex]?.verificationDate && watchedValues.policeVerification?.[actualIndex]?.nextVerificationDate && new Date(watchedValues.policeVerification[actualIndex].verificationDate) <= new Date(watchedValues.policeVerification[actualIndex].nextVerificationDate)
                            ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                      />
                      {showErrors && errors.policeVerification?.[actualIndex]?.verificationDate && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.policeVerification[actualIndex]?.verificationDate?.message}
                        </p>
                      )}
                    </div>
                    <div className="group">
                      <Label className="text-sm font-medium text-gray-700">Expiry Date <span className="text-red-500">*</span></Label>
                      <Input
                        {...register(`policeVerification.${actualIndex}.nextVerificationDate`)}
                        type="date"
                        disabled={isViewMode}
                        min={watchedValues.policeVerification?.[actualIndex]?.verificationDate || undefined}
                        className={`h-10 border-2 transition-colors duration-200 rounded-xl ${
                          showErrors && errors.policeVerification?.[actualIndex]?.nextVerificationDate 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                            : watchedValues.policeVerification?.[actualIndex]?.verificationDate && watchedValues.policeVerification?.[actualIndex]?.nextVerificationDate && new Date(watchedValues.policeVerification[actualIndex].verificationDate) <= new Date(watchedValues.policeVerification[actualIndex].nextVerificationDate)
                            ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                      />
                      {showErrors && errors.policeVerification?.[actualIndex]?.nextVerificationDate && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.policeVerification[actualIndex]?.nextVerificationDate?.message}
                        </p>
                      )}
                      
                      {/* Date validation help text */}
                      {watchedValues.policeVerification?.[actualIndex]?.verificationDate && watchedValues.policeVerification?.[actualIndex]?.nextVerificationDate && (
                        <div className={`mt-2 p-2 rounded-lg text-xs ${
                          new Date(watchedValues.policeVerification[actualIndex].verificationDate) <= new Date(watchedValues.policeVerification[actualIndex].nextVerificationDate)
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {new Date(watchedValues.policeVerification[actualIndex].verificationDate) <= new Date(watchedValues.policeVerification[actualIndex].nextVerificationDate)
                            ? '✓ Verification Date is valid (on or before Expiry Date)'
                            : '✗ Verification Date must be on or before Expiry Date'
                          }
                        </div>
                      )}
                    </div>
                    <div className="group lg:col-span-2">
                      <Label className="text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></Label>
                      <Input
                        {...register(`policeVerification.${actualIndex}.description`)}
                        disabled={isViewMode}
                        className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 bg-white ${
                          (showErrors && errors.policeVerification?.[actualIndex]?.description) 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                        placeholder="Enter verification description"
                      />
                      {showErrors && errors.policeVerification?.[actualIndex]?.description && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.policeVerification[actualIndex]?.description?.message}
                        </p>
                      )}
                    </div>
                    <div className="group">
                      <Label className="text-sm font-medium text-gray-700">Police Jurisdiction <span className="text-red-500">*</span></Label>
                      <Input
                        {...register(`policeVerification.${actualIndex}.policeStationDetail`)}
                        disabled={isViewMode}
                        className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 bg-white ${
                          (showErrors && errors.policeVerification?.[actualIndex]?.policeStationDetail) 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                        placeholder="Enter police station detail"
                      />
                      {showErrors && errors.policeVerification?.[actualIndex]?.policeStationDetail && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <X className="h-3 w-3" />
                          {errors.policeVerification[actualIndex]?.policeStationDetail?.message}
                        </p>
                      )}
                    </div>
                    <div className="group">
                      <Label className="text-sm font-medium text-gray-700">Police Station Pin Code</Label>
                      <Input
                        {...register(`policeVerification.${actualIndex}.policeStationPinCode`)}
                        disabled={isViewMode}
                        className="h-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-300 group-hover:border-gray-300 bg-white"
                        placeholder="Enter pin code"
                      />
                    </div>
                    <div className="group border border-gray-200 p-3 rounded-lg bg-white">
                      <Label className="text-sm font-medium text-gray-700">Active Status</Label>
                      <div className="flex items-center space-x-2 h-10 mt-2">
                        <Switch
                          checked={watchedValues.policeVerification?.[actualIndex]?.isActive ?? true}
                          onCheckedChange={(checked) => {
                            setValue(`policeVerification.${actualIndex}.isActive`, checked);
                            // Also update parent form data
                            const updatedVerification = [...(watchedValues.policeVerification || [])];
                            updatedVerification[actualIndex] = {
                              ...updatedVerification[actualIndex],
                              isActive: checked
                            };
                            onFormDataChange({
                              policeVerification: updatedVerification
                            });
                          }}
                          disabled={isViewMode}
                          className="data-[state=checked]:bg-blue-600"
                        />
                        <Label className="text-sm font-medium cursor-pointer">
                          {watchedValues.policeVerification?.[actualIndex]?.isActive ? 'Active' : 'Inactive'}
                        </Label>
                      </div>
                      
                    </div>
                    <div className="group lg:col-span-2">
                      <Label className="text-sm font-medium text-gray-700">Document</Label>
                        <div className="relative">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={isViewMode}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            const now = new Date()
                            const isoTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
                            const fileExtension = file.name.split('.').pop()
                            const employeeID = auditStatusFormData?.employeeID || 'unknown'
                            const newFileName = `${employeeID}_policeVerification_${isoTime}.${fileExtension}`
                            const renamedFile = new File([file], newFileName, { type: file.type }) as File
                            const res = await uploadDocument(renamedFile, newFileName)
                            const pathValue = res?.success && res?.serverPath ? res.serverPath : file.name
                            setValue(`policeVerification.${actualIndex}.documentPath`, pathValue)
                          }}
                          className="hidden"
                        />
                        {watchedValues.policeVerification?.[actualIndex]?.documentPath ? (
                          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <FileCheck className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-800">Verification Document</p>
                              <p className="text-xs text-green-600" title={watchedValues.policeVerification?.[actualIndex]?.documentPath}>
                                {getFileNameFromPath(watchedValues.policeVerification?.[actualIndex]?.documentPath)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const path = watchedValues.policeVerification?.[actualIndex]?.documentPath || ''
                                setPreviewDoc({ path, mime: guessMimeFromPath(path), title: 'Verification Document' })
                                setPreviewOpen(true)
                              }}
                              className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                            >
                              Preview
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isViewMode}
                              onClick={() => {
                                setValue(`policeVerification.${actualIndex}.documentPath`, "")
                              }}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => {
                              const input = (document.querySelector(`#police-doc-input-${actualIndex}`) as HTMLInputElement) || (document.querySelector(`input[type="file"]`) as HTMLInputElement)
                              if (input) input.click()
                            }}
                            className="w-full flex items-center justify-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors bg-gray-50/50"
                          >
                            <Upload className="h-6 w-6 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Upload Verification Document</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isViewMode && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3"></div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {isValid ? 'Form is valid and ready to continue' : 'Please complete all required fields'}
                </span>
              </div>
              <Button
                type="button"
                onClick={handleSaveAndContinue}
                className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg text-white font-medium transition-all duration-300"
              >
                Save
              </Button>
              <Button
                type="button"
                onClick={async () => { setShowErrors(true); const ok = await trigger(); if (ok && onNextTab) onNextTab(); }}
                className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300"
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <DocumentPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentPath={previewDoc.path}
        mimeType={previewDoc.mime}
        title={previewDoc.title}
      />
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={successPopupData.title}
        message={successPopupData.message}
      />
    </Card>
  )
}

export default PoliceVerificationForm