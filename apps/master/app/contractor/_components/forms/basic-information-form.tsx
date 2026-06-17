"use client"

import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { Button } from "@repo/ui/components/ui/button"
import { SuccessPopup } from "@/components/success-popup"
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import PreviewOfEmp from "@/app/contractor/_components/forms/basic-information/preview-of-emp"

import { User, Building2, Mail, Calendar, Globe, Clock, Camera, Upload, X, RotateCcw, ArrowRight, ArrowLeft, CheckCircle, MapPin } from "lucide-react"
import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useToast } from "@repo/ui/hooks/use-toast"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// Zod Schema for validation
const basicInformationSchema = z.object({
  contractorName: z.string().min(1, "Contractor name is required"),
  contractorCode: z.string().min(1, "Contractor code is required"),
  aadharNumber: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true; // Allow empty since it's optional
      return /^\d{12}$/.test(val);
    }, "Aadhar number must be exactly 12 digits"),
  panNumber: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true; // Allow empty since it's optional
      return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val);
    }, "PAN number must be in format: ABCDE1234F (5 letters, 4 digits, 1 letter)"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerContactNo: z.string()
    .min(1, "Owner contact number is required")
    .regex(/^\d{10}$/, "Contact number must be exactly 10 digits"),
  ownerEmailId: z.string().email("Invalid email format"),
  fatherName: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonContactNo: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true; // Allow empty
      return /^\d{10}$/.test(val);
    }, "Contact number must be exactly 10 digits"),
  contactPersonEmailId: z.union([
    z.string().email("Invalid email format"),
    z.literal("")
  ]).optional(),
  birthDate: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true; // Allow empty since it's optional
      const birthDate = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today to allow today's date
      return birthDate <= today;
    }, "Birth date cannot be in the future"),
  workLocation: z.string().optional(),
  contractorImage: z.string().optional().or(z.literal("")),
  serviceSince: z.string()
    .min(1, "Service since date is required")
    .refine((val) => {
      if (!val || val === "") return false; // Required field
      const serviceDate = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today to allow today's date
      return serviceDate <= today;
    }, "Service since date cannot be in the future"),
})

type BasicInformationData = z.infer<typeof basicInformationSchema>

// Helper function to format Aadhar number
const formatAadharNumber = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  // Limit to 12 digits
  const limitedDigits = digits.substring(0, 12);
  // Format as XXXX XXXX XXXX
  return limitedDigits.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3').trim();
};

// Helper function to get unformatted Aadhar number
const getUnformattedAadhar = (value: string) => {
  return value.replace(/\D/g, '').substring(0, 12);
};

// Helper function to format phone number
const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  // Limit to 10 digits
  return digits.substring(0, 10);
};

// Helper function to format PAN number
const formatPANNumber = (value: string) => {
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  // Limit to 10 characters (5 letters + 4 digits + 1 letter)
  return cleaned.substring(0, 10);
};

// Normalizers for safe comparison
const normalizeAadhar = (value: unknown) => String(value ?? '').replace(/\D/g, '').slice(0, 12);
const normalizeContractorCode = (value: unknown) => String(value ?? '').trim();

// Helper function to check for duplicate Contractor Code
const checkDuplicateContractorCode = (contractorCode: string, duplicateData: any[] | undefined, currentMode: string, auditStatusFormData?: any) => {
  if (!duplicateData || duplicateData.length === 0 || !contractorCode) {
    return false;
  }

  const current = normalizeContractorCode(contractorCode);
  const original = normalizeContractorCode(auditStatusFormData?.contractorCode);

  // In edit mode, if the new contractor code is the same as the existing one, allow it
  if (currentMode === "edit" && original && original === current) {
    return false;
  }

  return duplicateData.some((item: any) => normalizeContractorCode(item?.contractorCode) === current);
};

// Helper function to check for duplicate Aadhar Number
const checkDuplicateAadharNumber = (aadharNumber: string, duplicateData: any[] | undefined, currentMode: string, auditStatusFormData?: any) => {
  if (!duplicateData || duplicateData.length === 0 || !aadharNumber) {
    return false;
  }

  const current = normalizeAadhar(aadharNumber);
  const original = normalizeAadhar(auditStatusFormData?.aadharNumber);

  // In edit mode, if the new aadhar number is the same as the existing one, allow it
  if (currentMode === "edit" && original && original === current) {
    return false;
  }

  return duplicateData.some((item: any) => normalizeAadhar(item?.aadharNumber) === current);
};

interface BasicInformationFormProps {
  duplicateData?: any[]
  existingContractors?: any[]
  formData: any
  onFormDataChange: (data: Partial<BasicInformationData>) => void
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  auditStatus?: any
  auditStatusFormData?: any
  setAuditStatus?: (data: any) => void
  setAuditStatusFormData?: (data: any) => void
  activeTab?: string
}

export function BasicInformationForm({ 
  duplicateData,
  existingContractors,
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
}: BasicInformationFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string>(auditStatusFormData?.contractorImage || formData?.contractorImage || "")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const tenantCode = useGetTenantCode()
  
  // Guess mime from file extension
  const guessMimeFromPath = (path: string): string => {
    const lower = path.toLowerCase()
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
    if (lower.endsWith('.png')) return 'image/png'
    if (lower.endsWith('.gif')) return 'image/gif'
    if (lower.endsWith('.webp')) return 'image/webp'
    return 'application/octet-stream'
  }

  // Hook to fetch bytes and build object URL for preview
  const { fetchByteArray } = useByteToBase64()
  // File upload hook for contractor images
  const { uploadFile: uploadContractorImage } = useFileUpload({ uploadPath: "contractor" })
  
  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const currentMode = (modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add";

  const isViewMode = currentMode === "view"


  // Helper function to convert dd-mm-yyyy to yyyy-mm-dd
  const convertDateFormat = (dateString: string) => {
    if (!dateString) return "";
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

  const {
    register,
    formState: { errors, isValid, dirtyFields },
    watch,
    setValue,
    trigger,
    reset,
    setError,
    clearErrors,
  } = useForm<BasicInformationData>({
    resolver: zodResolver(basicInformationSchema),
    defaultValues: {
      contractorName: "",
      contractorCode: "",
      ownerName: "",
      ownerContactNo: "",
      ownerEmailId: "",
      fatherName: "",
      contactPersonName: "",
      contactPersonContactNo: "",
      contactPersonEmailId: "",
      birthDate: "",
      workLocation: "",
      aadharNumber: "",
      panNumber: "",
      contractorImage: "",
      serviceSince: "",
    },
    mode: "onChange",
  })

  // Contractor Code duplicate check (server-side), same pattern as company-employee Employee ID
  const [checkContractorCode, setCheckContractorCode] = useState<string>("")
  const pendingContractorCodeCheckRef = useRef<{
    resolve: (rows: any[]) => void
    reject: (err: any) => void
  } | null>(null)

  const contractorCodeCheckCriteria = useMemo(() => {
    if (!checkContractorCode || !tenantCode) return []
    return [
      { field: "contractorCode", operator: "is", value: checkContractorCode },
      { field: "tenantCode", operator: "is", value: tenantCode },
    ]
  }, [checkContractorCode, tenantCode])

  const { refetch: refetchContractorCodeExists } = useRequest<any[]>({
    url: `contractor/search?offset=0&limit=1`,
    method: "POST",
    data: contractorCodeCheckCriteria,
    dependencies: [],
    onSuccess: (rows: any) => {
      const arr = Array.isArray(rows) ? rows : []
      pendingContractorCodeCheckRef.current?.resolve(arr)
      pendingContractorCodeCheckRef.current = null
    },
    onError: (err) => {
      pendingContractorCodeCheckRef.current?.reject(err)
      pendingContractorCodeCheckRef.current = null
    },
  })

  const runContractorCodeExistsCheck = async (contractorCode: string) => {
    setCheckContractorCode(contractorCode)
    const rows = await new Promise<any[]>((resolve, reject) => {
      pendingContractorCodeCheckRef.current = { resolve, reject }
      void refetchContractorCodeExists()
    })
    return rows.filter(
      (item: any) => item && typeof item === "object" && Object.keys(item).length > 0
    )
  }

  // When navigating away from Basic tab, clear duplicate state/errors
  useEffect(() => {
    if (activeTab !== "basic") {
      setCheckContractorCode("")
      pendingContractorCodeCheckRef.current = null
      if (errors.contractorCode?.type === "custom") {
        clearErrors("contractorCode")
      }
    }
  }, [activeTab, clearErrors, errors.contractorCode?.type])

  const {
    post: postBasicInformation,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "contractor",
    onSuccess: (data) => {
      setSuccessPopupData({
        title: "Basic Information Saved",
        message: "Contractor basic information has been saved successfully."
      })
      setShowSuccessPopup(true)
      setTimeout(() => {
        setShowSuccessPopup(false)
      }, 2000)
    },
    onError: (error) => {
      console.error("Error saving basic information:", error)
    },
  });

  // Update form values based on mode
  useEffect(() => {
    
      // In add mode, get values from auditStatusFormData
      if (auditStatusFormData) {
        // Normalize contractorImage coming from backend: it might be an object with documentPath
        const normalizeBackendImage = (img: any): string => {
          if (!img) return ""
          if (typeof img === 'string') return img
          if (typeof img === 'object') {
            // Support shapes: { documentPath: string } or { contractorImage: string }
            return (img.documentPath || img.contractorImage || "") as string
          }
          return ""
        }

        setValue("contractorName", auditStatusFormData.contractorName || "");
        setValue("contractorCode", auditStatusFormData.contractorCode || "");
        setValue("ownerName", auditStatusFormData.ownerName || "");
        setValue("ownerContactNo", auditStatusFormData.ownerContactNo || "");
        setValue("ownerEmailId", auditStatusFormData.ownerEmailId || "");
        setValue("fatherName", auditStatusFormData.fatherName || "");
        setValue("contactPersonName", auditStatusFormData.contactPersonName || "");
        setValue("contactPersonContactNo", auditStatusFormData.contactPersonContactNo || "");
        setValue("contactPersonEmailId", auditStatusFormData.contactPersonEmailId || "");
        setValue("birthDate", auditStatusFormData.birthDate || "");
        setValue("workLocation", auditStatusFormData.workLocation || "");
        setValue("aadharNumber", auditStatusFormData.aadharNumber || "");
        setValue("panNumber", auditStatusFormData.panNumber || "");
        setValue("contractorImage", normalizeBackendImage(auditStatusFormData.contractorImage));
        setValue("serviceSince", auditStatusFormData.serviceSince || "");
      }
    
    // Trigger validation after setting all values
    setTimeout(() => {
      trigger();
    }, 100);
  }, [ auditStatusFormData, currentMode, setValue, trigger]);

  // Watch all form values (used for image preview precedence)
  const watchedValues = watch()

  // Photo preview effect: prioritize current form value; avoid fallback if explicitly cleared
  useEffect(() => {
    let currentObjectUrl: string | null = null
    let isCancelled = false

    // Determine source:
    // 1) current form/watched value
    // 2) props.formData (if provided)
    // 3) auditStatusFormData as last resort
    const watchedImage = watchedValues?.contractorImage
    const propImage = formData?.contractorImage
    const auditImage = auditStatusFormData?.contractorImage

    // If user explicitly changed the image field to empty (cleared), keep it cleared and don't fallback
    if (watchedImage === "" && dirtyFields?.contractorImage) {
      setPhotoPreview("")
      return () => {
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
      }
    }

    const photoValue: string | undefined = watchedImage ?? propImage ?? auditImage

    const run = async () => {
      if (!photoValue) {
        if (!isCancelled) setPhotoPreview("")
        return
      }

      // If it's already a data URL, use directly
      if (photoValue.startsWith('data:')) {
        if (!isCancelled) setPhotoPreview(photoValue)
        return
      }

      // First try to fetch as a server resource (works for both relative and absolute paths)
      try {
        const mime = guessMimeFromPath(photoValue)
        const res:any = await fetchByteArray(photoValue, mime)
        if (!isCancelled && res.success && res.objectUrl) {
          currentObjectUrl = res.objectUrl
          setPhotoPreview(res.objectUrl)
          return
        }
      } catch {
        // ignore and try base64 fallback
      }

      // Fallback: treat as raw base64 and prefix data URL
      if (!isCancelled) setPhotoPreview(`data:image/*;base64,${photoValue}`)
    }

    void run()
    return () => {
      isCancelled = true
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
    }
  }, [ watchedValues?.contractorImage, dirtyFields?.contractorImage, formData?.contractorImage, auditStatusFormData?.contractorImage, fetchByteArray ])

  const handleInputChange = async (field: keyof BasicInformationData, value: string) => {
    setValue(field, value)
    await trigger(field)
    
    // Update form data for parent component with only the exact fields
    const currentValues = watch()
    const exactData = {
      contractorName: currentValues.contractorName || "",
      contractorCode: currentValues.contractorCode || "",
      ownerName: currentValues.ownerName || "",
      ownerContactNo: currentValues.ownerContactNo || "",
      ownerEmailId: currentValues.ownerEmailId || "",
      fatherName: currentValues.fatherName || "",
      contactPersonName: currentValues.contactPersonName || "",
      contactPersonContactNo: currentValues.contactPersonContactNo || "",
      contactPersonEmailId: currentValues.contactPersonEmailId || "",
      birthDate: currentValues.birthDate || "",
      workLocation: currentValues.workLocation || "",
      aadharNumber: currentValues.aadharNumber || "",
      panNumber: currentValues.panNumber || "",
      contractorImage: currentValues.contractorImage || "",
      serviceSince: currentValues.serviceSince || "",
    }
    
    // In add mode, update auditStatusFormData; in edit/view mode, update parent formData
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...exactData
      })
    } else {
      onFormDataChange(exactData)
    }
  }



  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      // Immediate local preview for UX
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPhotoPreview(result)
      }
      reader.readAsDataURL(file)

      // Build a descriptive filename: <contractorCode|name>_contractorImage_<ISO>.ext
      const now = new Date()
      const isoTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      const fileExtension = file.name.split('.').pop()
      const identifier = (watch().contractorCode || watch().contractorName || 'contractor').toString().replace(/\s+/g, '_')
      const newFileName = `${identifier}_contractorImage_${isoTime}.${fileExtension}`

      // Upload to server and store serverPath in form
      try {
        const renamedFile = new File([file], newFileName, { type: file.type })
        const res:any = await uploadContractorImage(renamedFile, newFileName)
        const serverPath = res?.serverPath || res?.data || ""

        setValue("contractorImage", serverPath as any)

        // Immediately update preview from server bytes for consistency
        if (serverPath) {
          const mime = guessMimeFromPath(serverPath)
          const fetched:any = await fetchByteArray(serverPath, mime)
          if (fetched?.success && fetched.objectUrl) {
            setPhotoPreview(fetched.objectUrl)
          }
        }

        const currentValues = watch()
        const exactData = {
          contractorName: currentValues.contractorName || "",
          contractorCode: currentValues.contractorCode || "",
          ownerName: currentValues.ownerName || "",
          ownerContactNo: currentValues.ownerContactNo || "",
          ownerEmailId: currentValues.ownerEmailId || "",
          fatherName: currentValues.fatherName || "",
          contactPersonName: currentValues.contactPersonName || "",
          contactPersonContactNo: currentValues.contactPersonContactNo || "",
          contactPersonEmailId: currentValues.contactPersonEmailId || "",
          birthDate: currentValues.birthDate || "",
          workLocation: currentValues.workLocation || "",
          aadharNumber: currentValues.aadharNumber || "",
          contractorImage: serverPath || "",
          panNumber: currentValues.panNumber || "",
          serviceSince: currentValues.serviceSince || "",
        }

        if (currentMode === "add") {
          setAuditStatusFormData?.({
            ...auditStatusFormData,
            ...exactData,
          })
        } else {
          onFormDataChange(exactData)
        }
      } catch {
        // If upload fails, fall back to clearing the value (or keep preview only)
        setValue("contractorImage", "")
      }
    }
  }

  const removePhoto = () => {
    // Clear preview and file state
    setPhotoPreview("")
    setPhotoFile(null)
    setValue("contractorImage", "")
    
    // Clear the file input
    const fileInput = document.getElementById("contractorImage") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
    
    const currentValues = watch()
    const exactData = {
      contractorName: currentValues.contractorName || "",
      contractorCode: currentValues.contractorCode || "",
      ownerName: currentValues.ownerName || "",
      ownerContactNo: currentValues.ownerContactNo || "",
      ownerEmailId: currentValues.ownerEmailId || "",
      fatherName: currentValues.fatherName || "",
      contactPersonName: currentValues.contactPersonName || "",
      contactPersonContactNo: currentValues.contactPersonContactNo || "",
      contactPersonEmailId: currentValues.contactPersonEmailId || "",
      birthDate: currentValues.birthDate || "",
      workLocation: currentValues.workLocation || "",
      aadharNumber: currentValues.aadharNumber || "",
      contractorImage: "",
      panNumber: currentValues.panNumber || "",
      serviceSince: currentValues.serviceSince || "",
    }
    
    // In add mode, update auditStatusFormData; in edit/view mode, update parent formData
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...exactData
      })
    } else {
      onFormDataChange(exactData)
    }
  }

  const handleReset = () => {
    reset({
      contractorName: "",
      contractorCode: "",
      ownerName: "",
      ownerContactNo: "",
      ownerEmailId: "",
      fatherName: "",
      contactPersonName: "",
      contactPersonContactNo: "",
      contactPersonEmailId: "",
      birthDate: "",
      workLocation: "",
      aadharNumber: "",
      panNumber: "",
      contractorImage: "",
      serviceSince: "",
    })
    setPhotoPreview("")
    setPhotoFile(null)
    setShowErrors(false)
    
    const clearedData = {
      contractorName: "",
      contractorCode: "",
      ownerName: "",
      ownerContactNo: "",
      ownerEmailId: "",
      fatherName: "",
      contactPersonName: "",
      contactPersonContactNo: "",
      contactPersonEmailId: "",
      birthDate: "",
      workLocation: "",
      aadharNumber: "",
      panNumber: "",
      contractorImage: "",
      serviceSince: "",
    }
    
    // In add mode, update auditStatusFormData; in edit/view mode, update parent formData
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...clearedData
      })
    } else {
      onFormDataChange(clearedData)
    }
  }

  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    const formValues = watch()

    // ——— STEP 1: Server-side Contractor Code check first (add mode). If duplicate, stop here. ———
    if (currentMode === "add") {
      const trimmedCode = (formValues.contractorCode || "").trim()
      if (trimmedCode) {
        try {
          const existing = await runContractorCodeExistsCheck(trimmedCode)
          if (existing.length > 0) {
            setError("contractorCode", {
              type: "custom",
              message: `Contractor Code "${trimmedCode}" already exists. Please use a different code.`,
            })
            toast.error("Contractor Code already exists. Please use a different code before proceeding.")
            return
          }
        } catch {
          // Network/server error: continue to step 2
        }
      }
    }

    // Aadhar duplicate check (client-side from duplicateData)
    if (duplicateData && duplicateData.length > 0 && formValues.aadharNumber && formValues.aadharNumber.trim() !== "") {
      const isDuplicateAadhar = checkDuplicateAadharNumber(formValues.aadharNumber, duplicateData, currentMode, auditStatusFormData)
      if (isDuplicateAadhar) {
        setError("aadharNumber", {
          type: "custom",
          message: "Aadhar Number already exists. Please use a different number.",
        })
        toast.error("Aadhar Number already exists. Please use a different number before proceeding.")
        return
      }
    }

    // ——— STEP 2: Other validation (required fields, formats, etc.). If invalid, stop. ———
    const isValid = await trigger()
    
    // Debug: Log all form values and errors
    // Check which specific fields are failing validation
    const requiredFields = [
      'contractorName', 'contractorCode', 'ownerName', 'ownerContactNo', 
      'ownerEmailId', 'contactPersonName', 'contactPersonContactNo', 'serviceSince'
    ]
    
    const failingFields = requiredFields.filter(field => {
      const value = formValues[field as keyof BasicInformationData]
      return !value || (typeof value === 'string' && value.trim() === '')
    })
    
    

    if (isValid) {
      
      // Create the exact JSON structure as requested
      const exactData = {
        contractorName: formValues.contractorName || "",
        contractorCode: formValues.contractorCode || "",
        ownerName: formValues.ownerName || "",
        ownerContactNo: formValues.ownerContactNo || "",
        ownerEmailId: formValues.ownerEmailId || "",
        fatherName: formValues.fatherName || "",
        contactPersonName: formValues.contactPersonName || "",
        contactPersonContactNo: formValues.contactPersonContactNo || "",
        contactPersonEmailId: formValues.contactPersonEmailId || "",
        birthDate: formValues.birthDate || "",
        workLocation: formValues.workLocation || "",
        aadharNumber: formValues.aadharNumber || "",
        panNumber: formValues.panNumber || "",
        contractorImage: formValues.contractorImage || "",
        serviceSince: formValues.serviceSince || "",
      }
      
             // Update form data based on mode
       if (currentMode === "add") {
         setAuditStatusFormData?.({
           ...auditStatusFormData,
           ...exactData,
         })
         setAuditStatus?.({
           ...auditStatus,
           basicInformation:true
         })
         setSuccessPopupData({
           title: "Basic Information Saved",
           message: "Contractor basic information has been saved successfully."
         })
         setShowSuccessPopup(true)
       } else if (currentMode === "edit") {
         // In edit mode, update parent formData and save to backend
         onFormDataChange(exactData)
         let json = {
           tenant: tenantCode,
           action: "insert",
           id: auditStatusFormData._id || null,
           collectionName: "contractor",
           data: {
             ...auditStatusFormData,
             ...exactData,
           }
         }
         postBasicInformation(json)
       } else {
         // In view mode, just update parent formData
         onFormDataChange(exactData)
       }
    }
  }

  // watchedValues declared above for image precedence

  // Split actions: Save and Continue
  const handleSave = async () => {
    await handleSaveAndContinue()
  }

  const handleContinue = async () => {
    setShowErrors(true)
    const formValues = watch()

    // ——— STEP 1: Server-side Contractor Code check first (add mode only). If duplicate, stop here. ———
    if (currentMode === "add") {
      const trimmedCode = (formValues.contractorCode || "").trim()
      if (trimmedCode) {
        try {
          const existing = await runContractorCodeExistsCheck(trimmedCode)
          if (existing.length > 0) {
            setError("contractorCode", {
              type: "custom",
              message: `Contractor Code "${trimmedCode}" already exists. Please use a different code.`,
            })
            return
          }
        } catch {
          // Network/server error: continue to step 2
        }
      }
    }

    // ——— STEP 2: Other validation. If invalid, stop. ———
    const valid = await trigger()
    if (!valid) return

    // ——— STEP 3: All checks passed — go to next tab. ———
    if (onNextTab) onNextTab()
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
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Basic Information</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Essential contractor details and identification
                </CardDescription>
                {showErrors && (errors.contractorCode || errors.aadharNumber) && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-200 text-sm">
                    <X className="h-4 w-4" />
                    <span>Please fix the duplicate Contractor Code or Aadhar Number to continue</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Profile Photo and Contractor Details in One Row */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Profile Photo Section */}
              <div className="lg:col-span-1">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  Contractor Photo
                </h3>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <PreviewOfEmp path={watchedValues?.contractorImage|| ""} />
                    {!isViewMode && (watchedValues?.contractorImage || formData?.contractorImage || auditStatusFormData?.contractorImage) && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="w-full">
                    {!isViewMode ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="file"
                            id="contractorImage"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handlePhotoChange}
                            accept="image/*"
                            disabled={isViewMode}
                          />
                          <div className={`h-10 border-2 rounded-xl flex items-center px-3 transition-all duration-300 cursor-pointer ${
                            isViewMode 
                              ? "bg-gray-100 cursor-not-allowed opacity-50" 
                              : "border-gray-200 hover:border-blue-300 bg-white"
                          }`}>
                            <Upload className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-600 flex-1">
                              {photoFile ? "Change photo" : "Choose photo to upload"}
                            </span>
                          </div>
                        </div>
                        
                        {photoFile && (
                          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <Camera className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-800 flex-1" title={photoFile.name}>
                              {photoFile.name}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-10 border-2 border-gray-200 rounded-xl flex items-center px-3 bg-gray-100">
                        <Camera className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          {photoPreview ? "Photo uploaded" : "No photo uploaded"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contractor Details Section */}
              <div className="lg:col-span-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Contractor Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="group">
                    <Label htmlFor="contractorName" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Contractor Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("contractorName")}
                      id="contractorName"
                      disabled={isViewMode}
                      className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                        isViewMode 
                          ? "bg-gray-100 cursor-not-allowed" 
                          : ""
                      } ${
                        (showErrors && errors.contractorName) 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      placeholder="Enter contractor name"
                    />
                    {showErrors && errors.contractorName && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.contractorName.message}
                      </p>
                    )}
                  </div>
                  <div className="group">
                    <Label htmlFor="contractorCode" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Contractor Code <span className="text-red-500">*</span>
                    </Label>
                    {/* 
                      Duplicate Contractor Code Validation:
                      - Real-time checking against existing contractors in the system
                      - Prevents form submission if duplicate is detected
                      - Shows toast notifications for user feedback
                      - Blocks progression to next tab until resolved
                    */}
                    <Input
                      {...register("contractorCode")}
                      id="contractorCode"
                      disabled={currentMode === "view" || currentMode === "edit"}
                      onChange={(e) => {
                        const value = e.target.value
                        void handleInputChange("contractorCode", value)
                        if (errors.contractorCode?.type === "custom") {
                          clearErrors("contractorCode")
                        }
                        // Client-side duplicate feedback when duplicateData is available
                        if (duplicateData && duplicateData.length > 0 && value) {
                          const isDuplicate = checkDuplicateContractorCode(value, duplicateData, currentMode, auditStatusFormData)
                          if (isDuplicate) {
                            setError("contractorCode", {
                              type: "custom",
                              message: "Contractor Code already exists. Please use a different code.",
                            })
                            toast.error("This Contractor Code already exists. Please use a different code.")
                          } else {
                            clearErrors("contractorCode")
                          }
                        }
                      }}
                      onBlur={async (e) => {
                        const value = e.target.value.trim()
                        if (!value || currentMode !== "add") return
                        try {
                          const existing = await runContractorCodeExistsCheck(value)
                          if (existing.length > 0) {
                            setError("contractorCode", {
                              type: "custom",
                              message: `Contractor Code "${value}" already exists. Please use a different code.`,
                            })
                          }
                        } catch {
                          // Silent fail on network / server errors
                        }
                      }}
                      className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                        currentMode === "view" || currentMode === "edit"
                          ? "bg-gray-100 cursor-not-allowed" 
                          : ""
                      } ${
                        (showErrors && errors.contractorCode) 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      placeholder="Enter contractor code"
                    />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter a unique Contractor Code that doesn't exist in the system
                        </p>
                    {showErrors && errors.contractorCode && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.contractorCode.message}
                      </p>
                    )}
                    {/* Enhanced duplicate checking feedback */}
                    {duplicateData && duplicateData.length > 0 && watchedValues.contractorCode && (
                      <>
                        {checkDuplicateContractorCode(watchedValues.contractorCode, duplicateData, currentMode, auditStatusFormData) ? (
                          <div className="mt-2">
                            {
                              mode!="view" && (
                                <p className="text-orange-600 text-sm flex items-center gap-2">
                                  <X className="h-4 w-4" />
                                  <span className="font-medium">Duplicate Contractor Code detected</span>
                                </p>
                              )
                            }
                            {/* <p className="text-gray-600 text-xs mt-1">
                              Existing contractor codes: {duplicateData.map((item: any) => item.contractorCode).join(", ")}
                            </p> */}
                          </div>
                        )  : (
                          <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Contractor code is available</span>
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="group">
                    <Label htmlFor="aadharNumber" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Aadhar Number
                    </Label>
                    {/* 
                      Duplicate Aadhar Number Validation:
                      - Real-time checking against existing contractors in the system
                      - Prevents form submission if duplicate is detected
                      - Shows toast notifications for user feedback
                      - Blocks progression to next tab until resolved
                    */}
                    <Input
                      value={formatAadharNumber(watchedValues.aadharNumber || '')}
                      onChange={(e) => {
                        const unformattedValue = getUnformattedAadhar(e.target.value);
                        setValue("aadharNumber", unformattedValue);
                        handleInputChange("aadharNumber", unformattedValue);
                        
                        // Check for duplicate Aadhar Number in real-time (only if value is provided)
                        if (duplicateData && duplicateData.length > 0 && unformattedValue && unformattedValue.trim() !== "") {
                          const isDuplicate = checkDuplicateAadharNumber(unformattedValue, duplicateData, currentMode, auditStatusFormData);
                          if (isDuplicate) {
                            setError("aadharNumber", {
                              type: "custom",
                              message: "Aadhar Number already exists. Please use a different number."
                            });
                            // Show toast notification
                            toast.error("This Aadhar Number already exists. Please use a different number.");
                          } else {
                            // Clear the error if no duplicate found
                            clearErrors("aadharNumber");
                            // Show success toast if there was a previous error
                            if (errors.aadharNumber) {
                              toast.success("This Aadhar Number is unique and available for use.");
                            }
                          }
                        } else if (unformattedValue === "" || unformattedValue.trim() === "") {
                          // Clear any existing errors when field is empty (since it's optional)
                          clearErrors("aadharNumber");
                        }
                      }}
                      id="aadharNumber"
                      disabled={isViewMode}
                      className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                        isViewMode 
                          ? "bg-gray-100 cursor-not-allowed" 
                          : ""
                      } ${
                        (showErrors && errors.aadharNumber) 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      placeholder="XXXX XXXX XXXX (optional)"
                      maxLength={14} // 12 digits + 2 spaces
                    />
                    {showErrors && errors.aadharNumber && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.aadharNumber.message}
                      </p>
                    )}
                    {/* Enhanced duplicate checking feedback */}
                    {duplicateData && duplicateData.length > 0 && watchedValues.aadharNumber && watchedValues.aadharNumber.trim() !== "" && (
                      <>
                        {checkDuplicateAadharNumber(watchedValues.aadharNumber, duplicateData, currentMode, auditStatusFormData) ? (
                          <div className="mt-2">
                            {
                              mode!="view" && (
                                <p className="text-orange-600 text-sm flex items-center gap-2">
                              <X className="h-4 w-4" />
                              <span className="font-medium">Duplicate Aadhar Number detected</span>
                            </p>
                              )
                            }
                            {/* <p className="text-gray-600 text-xs mt-1">
                              Existing aadhar numbers: {duplicateData.map((item: any) => item.aadharNumber).join(", ")}
                            </p> */}
                          </div>
                        ) : (
                          <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Aadhar number is available</span>
                          </p>
                        )}
                      </>
                    )}
                    {!errors.aadharNumber && (
                      <p className="text-gray-500 text-xs mt-1">Enter 12-digit Aadhar number that doesn't exist in the system (optional)</p>
                    )}
                  </div>
                  <div className="group">
                    <Label htmlFor="panNumber" className="text-sm font-semibold text-gray-700 mb-2 block">
                      PAN Number
                    </Label>
                    <Input
                      value={watchedValues.panNumber || ''}
                      onChange={(e) => {
                        const formattedValue = formatPANNumber(e.target.value);
                        setValue("panNumber", formattedValue);
                        handleInputChange("panNumber", formattedValue);
                      }}
                      id="panNumber"
                      disabled={isViewMode}
                      className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                        isViewMode 
                          ? "bg-gray-100 cursor-not-allowed" 
                          : ""
                      } ${
                        (showErrors && errors.panNumber) 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      placeholder=""
                      maxLength={10}
                    />
                    {showErrors && errors.panNumber && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.panNumber.message}
                      </p>
                    )}
                    {!errors.panNumber && (
                      <p className="text-gray-500 text-xs mt-1">Format: ABCDE1234F (5 letters, 4 digits, 1 letter)</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="lg:col-span-3 my-2" />

          {/* Owner Information */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Owner Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                <Label htmlFor="ownerName" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Owner Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("ownerName")}
                  id="ownerName"
                  disabled={isViewMode}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.ownerName) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter owner name"
                />
                {showErrors && errors.ownerName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.ownerName.message}
                  </p>
                )}
              </div>

              <div className="group">
                <Label htmlFor="ownerContactNo" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Owner Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={watchedValues.ownerContactNo || ''}
                  onChange={(e) => {
                    const formattedValue = formatPhoneNumber(e.target.value);
                    setValue("ownerContactNo", formattedValue);
                    handleInputChange("ownerContactNo", formattedValue);
                  }}
                  id="ownerContactNo"
                  disabled={isViewMode}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.ownerContactNo) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter 10-digit contact number"
                  maxLength={10}
                />
                {showErrors && errors.ownerContactNo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.ownerContactNo.message}
                  </p>
                )}
                {!errors.ownerContactNo && (
                  <p className="text-gray-500 text-xs mt-1">Enter 10-digit phone number</p>
                )}
              </div>

              <div className="group">
                <Label htmlFor="ownerEmailId" className="text-sm font-semibold text-gray-700 mb-2 block">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Owner Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("ownerEmailId")}
                  id="ownerEmailId"
                  type="email"
                  disabled={isViewMode}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.ownerEmailId) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter owner email"
                />
                {showErrors && errors.ownerEmailId && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.ownerEmailId.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator className="lg:col-span-3 my-2" />

          {/* Contact Person Information */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Contact Person Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                                 <Label htmlFor="contactPersonName" className="text-sm font-semibold text-gray-700 mb-2 block">
                   Contact Person Name
                 </Label>
                <Input
                  {...register("contactPersonName")}
                  id="contactPersonName"
                  disabled={isViewMode}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.contactPersonName) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter contact person name"
                />
                {showErrors && errors.contactPersonName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.contactPersonName.message}
                  </p>
                )}
              </div>

              <div className="group">
                <Label htmlFor="contactPersonContactNo" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Contact Person Number
                </Label>
                <Input
                  value={watchedValues.contactPersonContactNo || ''}
                  onChange={(e) => {
                    const formattedValue = formatPhoneNumber(e.target.value);
                    setValue("contactPersonContactNo", formattedValue);
                    handleInputChange("contactPersonContactNo", formattedValue);
                  }}
                  id="contactPersonContactNo"
                  disabled={isViewMode}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.contactPersonContactNo) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter 10-digit contact number"
                  maxLength={10}
                />
                {showErrors && errors.contactPersonContactNo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.contactPersonContactNo.message}
                  </p>
                )}
                {!errors.contactPersonContactNo && (
                  <p className="text-gray-500 text-xs mt-1">Enter 10-digit phone number (optional)</p>
                )}
              </div>

              <div className="group">
                <Label htmlFor="contactPersonEmailId" className="text-sm font-semibold text-gray-700 mb-2 block">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Contact Person Email
                </Label>
                <Input
                  {...register("contactPersonEmailId")}
                  id="contactPersonEmailId"
                  type="email"
                  disabled={isViewMode}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.contactPersonEmailId) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter contact person email"
                />
                {showErrors && errors.contactPersonEmailId && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.contactPersonEmailId.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator className="lg:col-span-3 my-2" />

          {/* Additional Information */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group">
                <Label htmlFor="serviceSince" className="text-sm font-semibold text-gray-700 mb-2 block">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Service Since <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("serviceSince")}
                  id="serviceSince"
                  type="date"
                  disabled={isViewMode}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.serviceSince) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {showErrors && errors.serviceSince && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.serviceSince.message}
                  </p>
                )}
                {!errors.serviceSince && (
                  <p className="text-gray-500 text-xs mt-1">Select the date when service started (cannot be future date)</p>
                )}
              </div>

              <div className="group">
                <Label htmlFor="birthDate" className="text-sm font-semibold text-gray-700 mb-2 block">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Birth Date
                </Label>
                <Input
                  {...register("birthDate")}
                  id="birthDate"
                  type="date"
                  disabled={isViewMode}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.birthDate) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {showErrors && errors.birthDate && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.birthDate.message}
                  </p>
                )}
                {!errors.birthDate && (
                  <p className="text-gray-500 text-xs mt-1">Select birth date (cannot be future date)</p>
                )}
              </div>

              <div className="group">
                <Label htmlFor="fatherName" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Father Name
                </Label>
                <Input
                  {...register("fatherName")}
                  id="fatherName"
                  disabled={isViewMode}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.fatherName) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter father name"
                />
                {showErrors && errors.fatherName && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.fatherName.message}
                  </p>
                )}
              </div>

              <div className="group">
                <Label htmlFor="workLocation" className="text-sm font-semibold text-gray-700 mb-2 block">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Work Location
                </Label>
                <Input
                  {...register("workLocation")}
                  id="workLocation"
                  disabled={isViewMode}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.workLocation) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter work location"
                />
                {showErrors && errors.workLocation && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.workLocation.message}
                  </p>
                )}
              </div>


            </div>
          </div>

          
        </div>

        {/* Status Area - Duplicate Checking */}
        {duplicateData && duplicateData.length > 0 && currentMode !== "view" && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Duplicate Status</h4>
            <div className="space-y-2">
              {watchedValues.contractorCode && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">Contractor Code:</span>
                  {checkDuplicateContractorCode(watchedValues.contractorCode, duplicateData, currentMode, auditStatusFormData) ? (
                    <span className="text-orange-600 text-xs flex items-center gap-1">
                      <X className="h-3 w-3" />
                      Duplicate detected
                    </span>
                  ) : currentMode === "edit" && auditStatusFormData?.contractorCode === watchedValues.contractorCode ? (
                    <span className="text-blue-600 text-xs flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Same code allowed (editing own record)
                    </span>
                  ) : (
                    <span className="text-green-600 text-xs flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Available
                    </span>
                  )}
                </div>
              )}
              {watchedValues.aadharNumber && watchedValues.aadharNumber.trim() !== "" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">Aadhar Number:</span>
                  {checkDuplicateAadharNumber(watchedValues.aadharNumber, duplicateData, currentMode, auditStatusFormData) ? (
                    <span className="text-orange-600 text-xs flex items-center gap-1">
                      <X className="h-3 w-3" />
                      Duplicate detected
                    </span>
                  ) : currentMode === "edit" && auditStatusFormData?.aadharNumber === watchedValues.aadharNumber ? (
                    <span className="text-blue-600 text-xs flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Same number allowed (editing own record)
                    </span>
                  ) : (
                    <span className="text-green-600 text-xs flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Available
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
            {!isViewMode && (
              <>
                <Button
                  type="button"
                  onClick={handleSave}
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
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleContinue}
                  className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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