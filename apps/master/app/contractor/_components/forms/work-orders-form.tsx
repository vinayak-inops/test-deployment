"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/ui/dropdown-menu"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Separator } from "@repo/ui/components/ui/separator"
import { ClipboardList, Plus, Trash2, ArrowRight, ArrowLeft, RotateCcw, X, ChevronDown, ChevronUp, MoreVertical } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { BeautifulModal } from "../ui/beautiful-modal"
import { SuccessPopup } from "@/components/success-popup"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import DocumentPreview from "@/components/popup/document-preview"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { SingleSelectField } from "@/components/fields/single-select-field"

// Validation schemas
const assetChargeSchema = z.object({
  assetCode: z.string().min(1, "Asset code is required"),
  assetName: z.string().min(1, "Asset name is required"),
  assetCharges: z.number().min(0, "Asset charges must be positive"),
})

const employeeWagesSchema = z.object({
  wageType: z.string().optional(),
  wageAmount: z.number().min(0, "Wage amount must be positive").optional(),
})



const allocatedManPowerDetailSchema = z.object({
  skillLevel: z.object({
    skilledLevelTitle: z.string().min(1, "Title is required"),
    skilledLevelDescription: z.string().optional().or(z.literal("")),
  }),
  manPower: z.number().min(0, "Man power must be positive"),
})

const workOrderSchema = z.object({
  workOrderNumber: z.string().min(1, "Work order number is required"),
  workOrderDate: z.string().min(1, "Work order date is required"),
  proposalReferenceNumber: z.string().nullable().optional().or(z.literal("")),
  NumberOfEmployee: z.number().min(0, "Number of employees must be positive"),
  contractPeriodFrom: z.string().min(1, "Contract period from is required"),
  contractPeriodTo: z.string().min(1, "Contract period to is required"),
  workOrderDocumentFilePath: z.string().nullable().optional().or(z.literal("")),
  annexureFilePath: z.string().nullable().optional().or(z.literal("")),
  serviceChargeAmount: z.number().min(0, "Service charge amount must be positive").optional(),
  workOrderType: z.string().min(1, "Work order type is required"),
  workOrderLineItems: z.string().nullable().optional().or(z.literal("")),
  serviceLineItems: z.string().nullable().optional().or(z.literal("")),
  serviceCode: z.string().nullable().optional().or(z.literal("")),
  wcChargesPerEmployee: z.number().min(0, "WC charges per employee must be positive").optional(),
  assetChargesPerDay: z.array(assetChargeSchema),
  employeeWages: employeeWagesSchema.optional(),
  allocatedManPower: z.array(allocatedManPowerDetailSchema).optional(),
  remarks: z.string().nullable().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  // Enhanced validation for contract period dates
  if (data.contractPeriodFrom && data.contractPeriodTo) {
    const fromDate = new Date(data.contractPeriodFrom);
    const toDate = new Date(data.contractPeriodTo);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    

    // Ensure contract period to date is not in the future (removed this restriction)
    // if (toDate > today) {
    //   ctx.addIssue({
    //     code: z.ZodIssueCode.custom,
    //     message: "Contract Period To date cannot be in the future",
    //     path: ["contractPeriodTo"],
    //   });
    // }

    // Ensure contract period from date is earlier than or equal to contract period to date
    if (fromDate > toDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contract Period From date must be earlier than or equal to Contract Period To date",
        path: ["contractPeriodTo"],
      });
    }
  }

  // Enhanced validation for work order date
  if (data.workOrderDate) {
    const workOrderDate = new Date(data.workOrderDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    

    // Ensure work order date is less than or equal to contract period from date
    if (data.contractPeriodFrom) {
      const contractPeriodFrom = new Date(data.contractPeriodFrom);
      if (workOrderDate > contractPeriodFrom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Work Order Date must be less than or equal to Contract Period From date",
          path: ["workOrderDate"],
        });
      }
    }
  }

  // Require manPowerDetails when type is "Man Power"
  if (data.workOrderType === "Man Power") {
    // Man power details subform removed; skip validation for it
    // Prevent duplicates in allocatedManPower as well
    if (data.allocatedManPower && data.allocatedManPower.length > 0) {
      const seenAlloc = new Set<string>()
      for (let i = 0; i < data.allocatedManPower.length; i++) {
        const curr = data.allocatedManPower[i]
        const title = (curr?.skillLevel?.skilledLevelTitle || "").trim()
        const desc = (curr?.skillLevel?.skilledLevelDescription || "").trim()
        const key = `${title}|||${desc}`.toLowerCase()
        if (title) {
          if (seenAlloc.has(key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Duplicate skill level not allowed",
              path: ["allocatedManPower", i, "skillLevel", "skilledLevelTitle"],
            })
          }
          seenAlloc.add(key)
        }
      }
    }
  }
})

// Schema for the entire work orders array
const workOrdersArraySchema = z.array(workOrderSchema).min(1, "At least one work order is required")

type AssetCharge = z.infer<typeof assetChargeSchema>
type EmployeeWages = z.infer<typeof employeeWagesSchema>
type AllocatedManPowerDetail = z.infer<typeof allocatedManPowerDetailSchema>
type WorkOrder = {
  workOrderNumber: string
  workOrderDate: string
  proposalReferenceNumber?: string
  NumberOfEmployee: number
  contractPeriodFrom: string
  contractPeriodTo: string
  workOrderDocumentFilePath?: string
  annexureFilePath?: string
  serviceChargeAmount?: number
  workOrderType: string
  workOrderLineItems?: string
  serviceLineItems?: string
  serviceCode?: string
  wcChargesPerEmployee?: number
  assetChargesPerDay: AssetCharge[]
  employeeWages?: EmployeeWages
  allocatedManPower?: AllocatedManPowerDetail[]
  departments?: Array<{ departmentCode: string; departmentName: string }>
  remarks?: string
  showAllManPower?: boolean
  showAllAssetCharges?: boolean
}

interface WorkOrdersFormProps {
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

export function WorkOrdersForm({ 
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
}: WorkOrdersFormProps) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [deptDropdownOpenIndex, setDeptDropdownOpenIndex] = useState<number | null>(null)
  const [departmentSearch, setDepartmentSearch] = useState<string>("")
  const deptDropdownRef = useRef<HTMLDivElement | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: any }>({})
  const isInitialMount = useRef(true)
  const [subOrganization, setSubOrganization] = useState<any>({})
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const { uploadFile: uploadDocument } = useFileUpload({ uploadPath: "contractor" })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})
  const [showAllWorkOrders, setShowAllWorkOrders] = useState(false)
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
  
  // Helper: build data URL from raw base64 or pass-through if already data URL
  const toDataUrl = (value: string | undefined | null, fallbackMime?: string): string => {
    const raw = String(value ?? '').trim()
    if (!raw) return ''
    if (raw.startsWith('data:')) return raw
    let mime = fallbackMime || 'application/pdf'
    const head = raw.slice(0, 10)
    if (head.startsWith('/9j')) mime = 'image/jpeg'
    else if (head.startsWith('iVBOR')) mime = 'image/png'
    else if (head.startsWith('R0lGOD')) mime = 'image/gif'
    return `data:${mime};base64,${raw}`
  }
  
  // Upload to server and store returned path (or filename fallback)
  const handleDocUpload = async (index: number, kind: 'workOrderDocumentFilePath' | 'annexureFilePath', file: File | null) => {
    if (!file) return
    try {
      const now = new Date()
      const isoTime = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      const fileExtension = file.name.split('.').pop()
      const fieldSafe = kind === 'workOrderDocumentFilePath' ? 'workOrder' : 'annexure'
      const newFileName = `${auditStatusFormData.contractorCode}_${fieldSafe}_${isoTime}.${fileExtension}`
      const FileCtor: any = (File as any)
      const renamedFile = new FileCtor([file], newFileName, { type: file.type } as any)
      const res = await uploadDocument(renamedFile, newFileName)
      const pathValue = res?.success && res?.serverPath ? res.serverPath : file.name
      const updated = [...workOrders]
      updated[index] = { ...updated[index], [kind]: pathValue } as any
      setWorkOrders(updated)
    } catch (err: any) {
      alert(err?.message || 'Failed to upload file')
    }
  }

  const lastWorkOrdersRef = useRef<WorkOrder[]>([])

  // Real-time validation effect for contract period dates
  useEffect(() => {
    const validateContractPeriodDates = () => {
      workOrders.forEach((workOrder, index) => {
        if (workOrder.contractPeriodFrom && workOrder.contractPeriodTo) {
          const fromDate = new Date(workOrder.contractPeriodFrom);
          const toDate = new Date(workOrder.contractPeriodTo);
          
          // If contract period to date is now invalid, clear it
          if (fromDate > toDate) {
            const updatedWorkOrders = [...workOrders];
            updatedWorkOrders[index] = { ...updatedWorkOrders[index], contractPeriodTo: '' };
            setWorkOrders(updatedWorkOrders);
          }
        }
      });
    };

    validateContractPeriodDates();
  }, [workOrders]);

  // Close department dropdown on outside click / Escape
  useEffect(() => {
    if (deptDropdownOpenIndex === null) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(target)) {
        setDeptDropdownOpenIndex(null)
        setDepartmentSearch("")
      }
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDeptDropdownOpenIndex(null)
        setDepartmentSearch("")
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [deptDropdownOpenIndex])

  // Modal state for delete confirmation
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    type: "warning" as "success" | "warning" | "error" | "info",
    title: "",
    message: "",
    workOrderIndex: -1
  })
  
  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const currentMode = (modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add";

  const isViewMode = currentMode === "view"
 // Remove fetchContractor from dependencies to prevent infinite loop

  // Populate work orders from fetched data (primary source)
  useEffect(() => {
    if (auditStatusFormData && auditStatusFormData.workOrders) {
      const workOrdersData = auditStatusFormData.workOrders.map((workOrder: any) => {
        const normalizePath = (val: any) => typeof val === 'string' ? val : (val?.documentPath || "")
        // Transform flat structure to nested structure
        const transformedWorkOrder = {
          ...workOrder,
          workOrderDocumentFilePath: normalizePath(workOrder.workOrderDocumentFilePath),
          annexureFilePath: normalizePath(workOrder.annexureFilePath),
          // Handle NumberOfEmployee field - support both old and new field names
          NumberOfEmployee: workOrder.NumberOfEmployee || workOrder.NumberOfEmployees || 0,
          // Map direct wageType and wageAmount to employeeWages object
          employeeWages: {
            wageType: workOrder.wageType || workOrder.employeeWages?.wageType || "",
            wageAmount: workOrder.wageAmount || workOrder.employeeWages?.wageAmount || 0,
          },
          // Map direct assetCode, assetName, assetCharges to assetChargesPerDay array
          assetChargesPerDay: workOrder.assetChargesPerDay || (workOrder.assetCode ? [{
            assetCode: workOrder.assetCode || "",
            assetName: workOrder.assetName || "",
            assetCharges: workOrder.assetCharges || 0,
          }] : []),
          // Map department to departments (support both old and new field names)
          departments: workOrder.departments || workOrder.department || [],
        }
        
        // Remove the flat properties to avoid duplication
        const { wageType, wageAmount, assetCode, assetName, assetCharges, NumberOfEmployees, department, ...cleanWorkOrder } = transformedWorkOrder
        return cleanWorkOrder
      })
      setWorkOrders(workOrdersData)
    }
  }, [auditStatusFormData])

  // Populate work orders from formData (fallback)
  useEffect(() => {
    if (formData && formData.workOrders && !auditStatusFormData) {
      const workOrdersData = formData.workOrders.map((workOrder: any) => {
        const normalizePath = (val: any) => typeof val === 'string' ? val : (val?.documentPath || "")
        // Transform flat structure to nested structure
        const transformedWorkOrder = {
          ...workOrder,
          workOrderDocumentFilePath: normalizePath(workOrder.workOrderDocumentFilePath),
          annexureFilePath: normalizePath(workOrder.annexureFilePath),
          // Handle NumberOfEmployee field - support both old and new field names
          NumberOfEmployee: workOrder.NumberOfEmployee || workOrder.NumberOfEmployees || 0,
          // Map direct wageType and wageAmount to employeeWages object
          employeeWages: {
            wageType: workOrder.wageType || workOrder.employeeWages?.wageType || "",
            wageAmount: workOrder.wageAmount || workOrder.employeeWages?.wageAmount || 0,
          },
          // Map direct assetCode, assetName, assetCharges to assetChargesPerDay array
          assetChargesPerDay: workOrder.assetChargesPerDay || (workOrder.assetCode ? [{
            assetCode: workOrder.assetCode || "",
            assetName: workOrder.assetName || "",
            assetCharges: workOrder.assetCharges || 0,
          }] : []),
          // Map department to departments (support both old and new field names)
          departments: workOrder.departments || workOrder.department || [],
        }
        
        // Remove the flat properties to avoid duplication
        const { wageType, wageAmount, assetCode, assetName, assetCharges, NumberOfEmployees, department, ...cleanWorkOrder } = transformedWorkOrder
        return cleanWorkOrder
      })
      setWorkOrders(workOrdersData)
    }
  }, [formData, auditStatusFormData])

  // Populate subOrganization data for asset master
  useEffect(() => {
    if (auditStatusFormData?.subOrganization) {
      setSubOrganization(auditStatusFormData.subOrganization)
    } else if (formData?.subOrganization) {
      setSubOrganization(formData.subOrganization)
    }
  }, [auditStatusFormData, formData])



  // Initialize with one empty work order in add mode if no data exists
  useEffect(() => {
    if (currentMode === "add" && !auditStatusFormData && !formData?.workOrders) {
      const emptyWorkOrder = {
        workOrderNumber: "",
        workOrderDate: "",
        proposalReferenceNumber: "",
        NumberOfEmployee: 0,
        contractPeriodFrom: "",
        contractPeriodTo: "",
        workOrderDocumentFilePath: "",
        annexureFilePath: "",
        serviceChargeAmount: 0,
        workOrderType: "Standard",
        workOrderLineItems: "",
        serviceLineItems: "",
        serviceCode: "",
        wcChargesPerEmployee: 0,
        assetChargesPerDay: [{
          assetCode: "",
          assetName: "",
          assetCharges: 0,
        }],
        employeeWages: {
          wageType: "",
          wageAmount: 0,
        },
        departments: [],
        remarks: "",
      }
      setWorkOrders([emptyWorkOrder])
    }
  }, [currentMode, auditStatusFormData, formData?.workOrders])

  // Memoized function to create exact data structure
  const createExactData = useCallback((workOrdersData: WorkOrder[]) => {
    return {
      workOrders: workOrdersData.map(workOrder => ({
        workOrderNumber: workOrder.workOrderNumber || "",
        workOrderDate: workOrder.workOrderDate || "",
        proposalReferenceNumber: workOrder.proposalReferenceNumber ?? "",
        NumberOfEmployee: typeof workOrder.NumberOfEmployee === 'string' ? parseInt(workOrder.NumberOfEmployee) || 0 : workOrder.NumberOfEmployee || 0,
        contractPeriodFrom: workOrder.contractPeriodFrom || "",
        contractPeriodTo: workOrder.contractPeriodTo || "",
        workOrderDocumentFilePath: workOrder.workOrderDocumentFilePath ?? "",
        annexureFilePath: workOrder.annexureFilePath ?? "",
        serviceChargeAmount: workOrder.serviceChargeAmount ?? 0,
        workOrderType: workOrder.workOrderType || "Standard",
        workOrderLineItems: workOrder.workOrderLineItems ?? "",
        serviceLineItems: workOrder.serviceLineItems ?? "",
        serviceCode: workOrder.serviceCode ?? "",
        wcChargesPerEmployee: workOrder.wcChargesPerEmployee || 0,
        assetChargesPerDay: workOrder.assetChargesPerDay.map(asset => ({
          assetCode: asset.assetCode || "",
          assetName: asset.assetName || "",
          assetCharges: asset.assetCharges || 0,
        })),
        employeeWages: {
          wageType: workOrder.employeeWages?.wageType || "",
          wageAmount: workOrder.employeeWages?.wageAmount || 0,
        },
        departments: (workOrder.departments || []).map(d => ({
          departmentCode: d.departmentCode || "",
          departmentName: d.departmentName || "",
        })),
        remarks: workOrder.remarks ?? "",
        ...(workOrder.workOrderType === "Man Power" ? {
          
          allocatedManPower: (workOrder.allocatedManPower || []).map(ap => ({
            skillLevel: {
              skilledLevelTitle: ap.skillLevel?.skilledLevelTitle || "",
              skilledLevelDescription: ap.skillLevel?.skilledLevelDescription || "",
            },
            manPower: parseFloat((ap.manPower || 0).toFixed(2)),
          }))
        } : {}),
      }))
    }
  }, [])


  const {
    data,
    error,
    loading,
    refetch
}: {
    data: any;
    error: any;
    loading: any;
    refetch: any;
} = useRequest<any[]>({
    url: `map/organization/search?tenantCode=${tenantCode}`,
    onSuccess: (data: any) => {
      if (data && data.length > 0) {
        const org = data[0] || {}
        setSubOrganization({
          // preserve entire payload for any other consumers
          ...org,
          // ensure structures exist to avoid undefined checks
          assetMaster: org.assetMaster || { assets: [] },
          skillLevels: org.skillLevels || [],
          divisions: org.divisions || [],
          departments: org.departments || [],
          subDepartments: org.subDepartments || [],
          sections: org.sections || [],
          employeeCategories: org.employeeCategories || [],
          grades: org.grades || [],
          designations: org.designations || [],
          location: org.location || [],
        })
      } else {
        setSubOrganization({ assetMaster: { assets: [] }, skillLevels: [], divisions: [], departments: [], subDepartments: [], sections: [], employeeCategories: [], grades: [], designations: [], location: [] })
      }
    },
    onError: (error: any) => {
      setSubOrganization({ assetMaster: { assets: [] }, skillLevels: [], divisions: [], departments: [], subDepartments: [], sections: [], employeeCategories: [], grades: [], designations: [], location: [] })
    }
  });

  // proactively fetch organization data on mount (to match other forms behavior)
  useEffect(() => {
    if (typeof refetch === 'function') {
      refetch()
    }
  }, [])

  // Function to check if the form is valid in real-time
  const isFormValid = useCallback(() => {
    if (workOrders.length === 0) return false
    
    // Check if all work orders have required fields
    return workOrders.every(workOrder => {
      const basicFieldsValid = workOrder.workOrderNumber.trim() !== "" &&
                              workOrder.workOrderDate.trim() !== "" &&
                              workOrder.NumberOfEmployee > 0 &&
                              workOrder.contractPeriodFrom.trim() !== "" &&
                              workOrder.contractPeriodTo.trim() !== "" &&
                              workOrder.workOrderType.trim() !== ""
      
      // Check if all asset charges are valid
      const assetChargesValid = workOrder.assetChargesPerDay.every(validateAssetCharge)
      
      // Check if employee wages are valid (optional but if provided, must be complete)
      const employeeWagesValid = validateEmployeeWages(workOrder.employeeWages)
      
      return basicFieldsValid && assetChargesValid && employeeWagesValid
    })
  }, [workOrders])

  // Update form data when work orders change - with proper guards
  useEffect(() => {
    // Skip the first render to prevent infinite loop
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastWorkOrdersRef.current = workOrders
      return
    }

    // Check if workOrders actually changed to prevent unnecessary updates
    const workOrdersChanged = JSON.stringify(workOrders) !== JSON.stringify(lastWorkOrdersRef.current)
    
    if (workOrdersChanged) {
      const exactData = createExactData(workOrders)
      onFormDataChange(exactData)
      lastWorkOrdersRef.current = workOrders
    }
  }, [workOrders, createExactData]) // Removed onFormDataChange from dependencies

  // API call for saving work orders
  const {
    post: postWorkOrders,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "contractor",
    onSuccess: (data) => {
      // Clear validation errors on successful save
      setValidationErrors({})
      setShowErrors(false)
      setSuccessPopupData({
        title: "Work Orders Saved",
        message: "Work orders have been saved successfully."
      })
      setShowSuccessPopup(true)
    },
    onError: (error) => {
      console.error("Error saving work orders:", error)
      // Show error message to user
      // alert(`Error saving work orders: ${error.message || 'Unknown error occurred'}`)
    },
  })

  const addWorkOrder = () => {
    const newWorkOrder = {
      workOrderNumber: "",
      workOrderDate: "",
      proposalReferenceNumber: "",
      NumberOfEmployee: 0,
      contractPeriodFrom: "",
      contractPeriodTo: "",
      workOrderDocumentFilePath: "",
      annexureFilePath: "",
      serviceChargeAmount: 0,
      workOrderType: "Standard",
      workOrderLineItems: "",
      serviceLineItems: "",
      serviceCode: "",
      wcChargesPerEmployee: 0,
      assetChargesPerDay: [{
        assetCode: "",
        assetName: "",
        assetCharges: 0,
      }],
      employeeWages: {
        wageType: "",
        wageAmount: 0,
      },
      remarks: "",
    }
    const updatedWorkOrders = [...workOrders, newWorkOrder]
    setWorkOrders(updatedWorkOrders)
  }

  // Helper functions for delete modal
  const showDeleteModal = (index: number) => {
    const workOrderNumber = workOrders[index]?.workOrderNumber || `Work Order ${index + 1}`
    setDeleteModalState({
      isOpen: true,
      type: "warning",
      title: "⚠️ Confirm Deletion",
      message: `Are you sure you want to delete "${workOrderNumber}"? This action cannot be undone and all associated data will be permanently removed.`,
      workOrderIndex: index
    })
  }

  const closeDeleteModal = () => {
    setDeleteModalState(prev => ({ 
      ...prev, 
      isOpen: false,
      workOrderIndex: -1
    }))
  }

  const confirmDeleteWorkOrder = () => {
    if (deleteModalState.workOrderIndex >= 0) {
      // In add mode, ensure at least one work order remains
      if (currentMode === "add" && workOrders.length <= 1) {
        setDeleteModalState({
          isOpen: true,
          type: "error",
          title: "❌ Cannot Delete",
          message: "At least one work order must remain in add mode. You cannot delete the last work order.",
          workOrderIndex: -1
        })
        return
      }
      
      const workOrderNumber = workOrders[deleteModalState.workOrderIndex]?.workOrderNumber || `Work Order ${deleteModalState.workOrderIndex + 1}`
      const updatedWorkOrders = workOrders.filter((_, i) => i !== deleteModalState.workOrderIndex)
      setWorkOrders(updatedWorkOrders)
      
      // Show success message
      setDeleteModalState({
        isOpen: true,
        type: "success",
        title: "✅ Successfully Deleted",
        message: `"${workOrderNumber}" has been successfully deleted from the work orders list.`,
        workOrderIndex: -1
      })
    }
  }

  const removeWorkOrder = (index: number) => {
    showDeleteModal(index)
  }

  const updateWorkOrder = (index: number, field: string, value: any) => {
    const updatedWorkOrders = [...workOrders]
    updatedWorkOrders[index] = { ...updatedWorkOrders[index], [field]: value }
    setWorkOrders(updatedWorkOrders)
  }

  const addAssetCharge = (workOrderIndex: number) => {
    const newAssetCharge = {
      assetCode: "",
      assetName: "",
      assetCharges: 0,
    }
    const updatedWorkOrders = [...workOrders]
    updatedWorkOrders[workOrderIndex].assetChargesPerDay.push(newAssetCharge)
    setWorkOrders(updatedWorkOrders)
  }

  const removeAssetCharge = (workOrderIndex: number, assetIndex: number) => {
    const updatedWorkOrders = [...workOrders]
    updatedWorkOrders[workOrderIndex].assetChargesPerDay.splice(assetIndex, 1)
    setWorkOrders(updatedWorkOrders)
  }

  // Function to validate individual asset charges
  const validateAssetCharge = (asset: AssetCharge): boolean => {
    return asset.assetCode.trim() !== "" && 
           asset.assetName.trim() !== "" && 
           asset.assetCharges > 0
  }

  // Function to validate employee wages
  const validateEmployeeWages = (wages: EmployeeWages | undefined): boolean => {
    if (!wages) return true // Optional field
    return (wages.wageType?.trim() !== "" && wages.wageAmount && wages.wageAmount > 0) || 
           (wages.wageType?.trim() === "" && (!wages.wageAmount || wages.wageAmount === 0))
  }

  // Function to handle asset code change (similar to organizational structure form)
  const handleAssetCodeChange = (workOrderIndex: number, assetIndex: number, code: string) => {
    let name = ""
    
    // Find corresponding name based on selected code from API data
    if (subOrganization?.assetMaster?.assets) {
      const asset = subOrganization.assetMaster.assets.find((assetItem: any) => 
        assetItem.assetCode === code
      )
      name = asset?.assetName || ""
    }

    // Update both code and name
    const updatedWorkOrders = [...workOrders]
    updatedWorkOrders[workOrderIndex].assetChargesPerDay[assetIndex] = {
      ...updatedWorkOrders[workOrderIndex].assetChargesPerDay[assetIndex],
      assetCode: code,
      assetName: name,
    }
    setWorkOrders(updatedWorkOrders)
  }


  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    
    // First validate that at least one work order exists
    const arrayValidationResult = workOrdersArraySchema.safeParse(workOrders)
    if (!arrayValidationResult.success) {
      // Instead of setting array errors, we'll handle this by checking workOrders length
      if (workOrders.length === 0) {
        setValidationErrors({ 
          general: { 
            message: "At least one work order is required" 
          } 
        })
        return
      }
    }
    
    // Validate all work orders with detailed error tracking
    const workOrderValidationResults = workOrders.map((workOrder, index) => {
      const result = workOrderSchema.safeParse(workOrder)
      return { index, result }
    })
    const workOrderHasErrors = workOrderValidationResults.some(({ result }) => !result.success)
    
    // Store validation errors for UI display with better structure
    const errors: { [key: string]: any } = {}
    workOrderValidationResults.forEach(({ index, result }) => {
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors
        const formErrors = result.error.flatten().formErrors
        
        // Handle nested validation errors for asset charges and employee wages
        const processedErrors: any = {}
        
        // Process regular field errors
        Object.keys(fieldErrors).forEach(key => {
          if (key !== 'assetChargesPerDay' && key !== 'employeeWages') {
            processedErrors[key] = fieldErrors[key as keyof typeof fieldErrors]
          }
        })
        
        // Process asset charges errors
        if (fieldErrors.assetChargesPerDay) {
          processedErrors.assetChargesPerDay = fieldErrors.assetChargesPerDay
        }
        
        // Process employee wages errors
        if (fieldErrors.employeeWages) {
          processedErrors.employeeWages = fieldErrors.employeeWages
        }
        
        // Handle form-level errors (like date validation) by mapping them to specific fields
        if (formErrors.length > 0) {
          formErrors.forEach((error: string) => {
            if (error.includes('Contract Period From date must be earlier than Contract Period To date')) {
              // Map this error to the contractPeriodTo field
              if (!processedErrors.contractPeriodTo) {
                processedErrors.contractPeriodTo = []
              }
              processedErrors.contractPeriodTo.push(error)
            }
          })
        }
        
        errors[`workOrder_${index}`] = processedErrors
      }
    })
    setValidationErrors(errors)
    
    if (workOrderHasErrors) {
      console.error("Validation errors found:")
      workOrderValidationResults.forEach(({ index, result }) => {
        if (!result.success) {
          console.error(`Work Order ${index + 1} errors:`, result.error.flatten().fieldErrors)
        }
      })
      return
    }

    // Clear validation errors if validation passes
    setValidationErrors({})

    // Create the exact JSON structure as requested
    const exactData = createExactData(workOrders)
    
    onFormDataChange(exactData)
    
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...exactData
      })
      setAuditStatus?.({
        ...auditStatus,
        workOrdersCompleted: true
      })
      setSuccessPopupData({
        title: "Work Orders Saved",
        message: "Work orders have been saved successfully."
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
          workOrdersCompleted: true
        }
      }
      postWorkOrders(json)
    } else {
      // view mode: just synced parent already
    }
    
  }

  // Split actions: Save and Continue
  const handleSave = async () => {
    await handleSaveAndContinue()
  }

  const handleContinue = async () => {
    setShowErrors(true)
    // Basic validation: ensure array has entries and no pending validation errors
    const arrayValidationResult = workOrdersArraySchema.safeParse(workOrders)
    if (!arrayValidationResult.success) return
    const hasErrors = !workOrders.every(wo => workOrderSchema.safeParse(wo).success)
    if (!hasErrors && onNextTab) {
      onNextTab()
    }
  }

  const handleReset = () => {
    if (currentMode === "add") {
      // In add mode, reset to one empty work order instead of empty array
      const emptyWorkOrder = {
        workOrderNumber: "",
        workOrderDate: "",
        proposalReferenceNumber: "",
        NumberOfEmployee: 0,
        contractPeriodFrom: "",
        contractPeriodTo: "",
        workOrderDocumentFilePath: "",
        annexureFilePath: "",
        serviceChargeAmount: 0,
        workOrderType: "Standard",
        workOrderLineItems: "",
        serviceLineItems: "",
        serviceCode: "",
        wcChargesPerEmployee: 0,
        assetChargesPerDay: [{
          assetCode: "",
          assetName: "",
          assetCharges: 0,
        }],
        employeeWages: {
          wageType: "",
          wageAmount: 0,
        },
        departments: [],
        remarks: "",
      }
      setWorkOrders([emptyWorkOrder])
      onFormDataChange({ workOrders: [emptyWorkOrder] })
      lastWorkOrdersRef.current = [emptyWorkOrder]
    } else {
      // In edit/view mode, reset to empty array
      setWorkOrders([])
      onFormDataChange({ workOrders: [] })
      lastWorkOrdersRef.current = []
    }
    setValidationErrors({})
    setShowErrors(false)
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
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Work Orders</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Work order management and contract details
                </CardDescription>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {/* Loading and Error States */}
        {/* {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading contractor data...</p>
          </div>
        )}

        {contractorError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">Error loading contractor data: {contractorError.message}</p>
          </div>
        )} */}

        {/* Validation Errors Summary */}
        {showErrors && Object.keys(validationErrors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h4 className="text-red-800 font-semibold mb-2">Please fix the following validation errors:</h4>
            <div className="space-y-2">
              {Object.entries(validationErrors).map(([key, errors]) => {
                if (key === 'array') {
                  return (
                    <div key={key} className="text-sm">
                      <p className="text-red-700 font-medium">General Error:</p>
                      <ul className="list-disc list-inside text-red-600 ml-4">
                        {Array.isArray(errors) && errors.map((message, index) => (
                          <li key={index}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  )
                }
                const workOrderIndex = parseInt(key.split('_')[1]) + 1
                return (
                  <div key={key} className="text-sm">
                    <p className="text-red-700 font-medium">Work Order {workOrderIndex}:</p>
                    <ul className="list-disc list-inside text-red-600 ml-4">
                      {Object.entries(errors).map(([field, messages]) => {
                        // Handle date validation errors more clearly
                        if (field === 'contractPeriodTo' && Array.isArray(messages)) {
                          const message = messages[0];
                          if (message.includes('Contract Period From date must be earlier than Contract Period To date')) {
                            return (
                              <li key={field} className="text-red-600">
                                Contract Period From date must be earlier than Contract Period To date
                              </li>
                            );
                          }
                        }
                        
                        // Handle other field errors
                        if (Array.isArray(messages)) {
                          return (
                            <li key={field}>
                              {field === 'workOrderNumber' ? 'Work Order Number' :
                               field === 'workOrderDate' ? 'Work Order Date' :
                               field === 'NumberOfEmployee' ? 'Number of Employees' :
                               field === 'contractPeriodFrom' ? 'Contract Period From' :
                               field === 'contractPeriodTo' ? 'Contract Period To' :
                               field === 'workOrderType' ? 'Work Order Type' :
                               field === 'serviceChargeAmount' ? 'Service Charge Amount' :
                               field === 'wcChargesPerEmployee' ? 'WC Charges Per Employee' :
                               field}: {messages[0]}
                            </li>
                          );
                        }
                        return (
                          <li key={field}>
                            {field}: {Array.isArray(messages) ? messages[0] : String(messages)}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Work Orders Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                Work Orders ({workOrders.length})
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
                          onClick={() => setShowAllWorkOrders(!showAllWorkOrders)}
                          className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
                        >
                          {showAllWorkOrders ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2 text-gray-600" />
                              View Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                              View All ({workOrders.length} work orders)
                            </>
                          )}
                        </DropdownMenuItem>
                        {/* Future menu items can be added here */}
                      </DropdownMenuContent>
                    </DropdownMenu>
                {!isViewMode && (
                  <>
                    <Button 
                      onClick={addWorkOrder} 
                      className="px-4 py-2 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Work Order
                    </Button>
                  </>
                )}
              </div>
            </div>

            {workOrders.length === 0 && currentMode !== "add" && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No work orders added yet</p>
                <p className="text-sm text-gray-400">Click "Add Work Order" to get started</p>
              </div>
            )}

            {[...workOrders].reverse().map((workOrder, originalIndex) => {
              const actualIndex = workOrders.length - 1 - originalIndex
              // Show only the most recently added work order (first in reverse order) when showAllWorkOrders is false
              if (!showAllWorkOrders && originalIndex !== 0) {
                return null
              }
              const errors = validationErrors[`workOrder_${actualIndex}`] || {}

              return (
                <div key={actualIndex} className="group/item bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ClipboardList className="w-4 h-4 text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        {actualIndex === workOrders.length - 1 ? "Latest Work Order (last update)" : `Work Order ${actualIndex + 1}`}
                      </h4>
                    </div>
                    {!isViewMode && (currentMode !== "add" || workOrders.length > 1) && (
                      <Button
                        onClick={() => removeWorkOrder(actualIndex)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>

                  {/* Basic Work Order Details */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Basic Details
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Work Order Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={workOrder.workOrderNumber}
                          onChange={(e) => updateWorkOrder(actualIndex, "workOrderNumber", e.target.value)}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.workOrderNumber
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter work order number"
                          disabled={isViewMode}
                        />
                        {errors.workOrderNumber && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.workOrderNumber[0]}
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Work Order Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={workOrder.workOrderDate}
                          onChange={(e) => updateWorkOrder(actualIndex, "workOrderDate", e.target.value)}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.workOrderDate
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : workOrder.workOrderDate && workOrder.contractPeriodFrom && new Date(workOrder.workOrderDate) <= new Date(workOrder.contractPeriodFrom)
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          disabled={isViewMode}
                        />
                        {/* Show validation errors for work order date */}
                        {errors.workOrderDate && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.workOrderDate[0]}
                          </p>
                        )}
                        {/* Show validation error for date relationship */}
                        {workOrder.workOrderDate && workOrder.contractPeriodFrom && new Date(workOrder.workOrderDate) > new Date(workOrder.contractPeriodFrom) && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            Work Order Date must be less than or equal to Contract Period From date
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Proposal Reference Number
                        </Label>
                        <Input
                          value={workOrder.proposalReferenceNumber || ""}
                          onChange={(e) => updateWorkOrder(actualIndex, "proposalReferenceNumber", e.target.value)}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                          } border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`}
                          placeholder="Enter proposal reference number"
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Number of Employees <span className="text-red-500">*</span>
                        </Label>
                                                  <Input
                            type="number"
                            value={workOrder.NumberOfEmployee}
                            onChange={(e) =>
                              updateWorkOrder(actualIndex, "NumberOfEmployee", parseInt(e.target.value) || 0)
                            }
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.NumberOfEmployee
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter number of employees"
                          disabled={isViewMode}
                        />
                        {errors.NumberOfEmployee && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.NumberOfEmployee[0]}
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Contract Period From <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={workOrder.contractPeriodFrom}
                          onChange={(e) => updateWorkOrder(actualIndex, "contractPeriodFrom", e.target.value)}
                          min={workOrder.workOrderDate ? workOrder.workOrderDate : undefined}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.contractPeriodFrom
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : workOrder.contractPeriodFrom && workOrder.contractPeriodTo && new Date(workOrder.contractPeriodFrom) <= new Date(workOrder.contractPeriodTo)
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          disabled={isViewMode}
                        />
                        {/* Show validation errors for contract period from date */}
                        {errors.contractPeriodFrom && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.contractPeriodFrom[0]}
                          </p>
                        )}
                        {/* Show validation error for date relationship with work order date */}
                        {workOrder.workOrderDate && workOrder.contractPeriodFrom && new Date(workOrder.workOrderDate) > new Date(workOrder.contractPeriodFrom) && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            Contract Period From date must be greater than or equal to Work Order Date
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Contract Period To <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={workOrder.contractPeriodTo}
                          onChange={(e) => updateWorkOrder(actualIndex, "contractPeriodTo", e.target.value)}
                          min={workOrder.contractPeriodFrom ? workOrder.contractPeriodFrom : undefined}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.contractPeriodTo
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : workOrder.contractPeriodFrom && workOrder.contractPeriodTo && new Date(workOrder.contractPeriodFrom) <= new Date(workOrder.contractPeriodTo)
                              ? "border-green-500 focus:border-green-500 focus:ring-green-500/20"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          disabled={isViewMode}
                        />
                        {/* Show validation errors for contract period to date */}
                        {errors.contractPeriodTo && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.contractPeriodTo[0]}
                          </p>
                        )}
                        {/* Show validation error for date relationship */}
                        {workOrder.contractPeriodFrom && workOrder.contractPeriodTo && new Date(workOrder.contractPeriodFrom) > new Date(workOrder.contractPeriodTo) && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            Contract Period From date must be earlier than or equal to Contract Period To date
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Document Uploads (2MB max, store as base64, with View) */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Documents
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Work Order Document (max 2MB)
                        </Label>
                        <div className="space-y-3">
                          {workOrder.workOrderDocumentFilePath ? (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-green-800">File Uploaded</p>
                                    <p className="text-xs text-green-600" title={workOrder.workOrderDocumentFilePath || undefined}>{getFileNameFromPath(workOrder.workOrderDocumentFilePath)}</p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPreviewDoc({
                                      path: workOrder.workOrderDocumentFilePath || undefined,
                                      mime: guessMimeFromPath(workOrder.workOrderDocumentFilePath || ''),
                                      title: 'Work Order Document'
                                    })
                                    setPreviewOpen(true)
                                  }}
                                  className="h-8 px-3 text-green-700 border-green-300 hover:bg-green-100"
                                >
                                  View File
                                </Button>
                                {!isViewMode && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const updated = [...workOrders]
                                      updated[actualIndex] = { ...updated[actualIndex], workOrderDocumentFilePath: '' }
                                      setWorkOrders(updated)
                                    }}
                                    className="h-8 px-3 text-red-700 border-red-300 hover:bg-red-100 ml-2"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                              <div className="text-center">
                                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm text-gray-600 mb-2">No file uploaded</p>
                              </div>
                            </div>
                          )}
                          
                          {!isViewMode && (
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={(e) => handleDocUpload(actualIndex, 'workOrderDocumentFilePath', e.target.files?.[0] || null)}
                                disabled={isViewMode}
                                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                              />
                            </div>
                          )}
                        </div>
                        {errors.workOrderDocumentFilePath && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.workOrderDocumentFilePath[0]}
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Annexure (max 2MB)
                        </Label>
                        <div className="space-y-3">
                          {workOrder.annexureFilePath ? (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-green-800">File Uploaded</p>
                                    <p className="text-xs text-green-600" title={workOrder.annexureFilePath || undefined}>{getFileNameFromPath(workOrder.annexureFilePath)}</p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPreviewDoc({
                                      path: workOrder.annexureFilePath || undefined,
                                      mime: guessMimeFromPath(workOrder.annexureFilePath || ''),
                                      title: 'Annexure Document'
                                    })
                                    setPreviewOpen(true)
                                  }}
                                  className="h-8 px-3 text-green-700 border-green-300 hover:bg-green-100"
                                >
                                  View File
                                </Button>
                                {!isViewMode && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const updated = [...workOrders]
                                      updated[actualIndex] = { ...updated[actualIndex], annexureFilePath: '' }
                                      setWorkOrders(updated)
                                    }}
                                    className="h-8 px-3 text-red-700 border-red-300 hover:bg-red-100 ml-2"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                              <div className="text-center">
                                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm text-gray-600 mb-2">No file uploaded</p>
                              </div>
                            </div>
                          )}
                          
                          {!isViewMode && (
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={(e) => handleDocUpload(actualIndex, 'annexureFilePath', e.target.files?.[0] || null)}
                                disabled={isViewMode}
                                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                              />
                            </div>
                          )}
                        </div>
                        {errors.annexureFilePath && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.annexureFilePath[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Department(s) Selection (Multi-select) */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Department(s)
                    </h5>
                    <div className="relative">
                      <div className="relative flex items-center">
                        <Input
                          value={deptDropdownOpenIndex === actualIndex ? departmentSearch : ""}
                          onChange={(e) => setDepartmentSearch(e.target.value)}
                          onFocus={() => setDeptDropdownOpenIndex(actualIndex)}
                          placeholder="Search department by name or code"
                          disabled={loading || isViewMode}
                          className={`h-10 rounded-xl border-2 bg-white px-3 py-2 text-sm ${loading || isViewMode ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
                          <ClipboardList className="h-4 w-4" />
                        </span>
                      </div>

                      {deptDropdownOpenIndex === actualIndex && !isViewMode && (
                        <div ref={deptDropdownRef} className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="sticky top-0 bg-white px-3 py-2 border-b border-gray-100 flex items-center gap-3 justify-between">
                            <div className="flex items-center gap-3">
                              {(() => {
                                const options = subOrganization?.departments || []
                                const selected = workOrder.departments || []
                                const allSelected = options.length > 0 && selected.length === options.length
                                return (
                                  <>
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                                      checked={allSelected}
                                      onChange={(e) => {
                                        const optionsAll = (subOrganization?.departments || []).map((d: any) => ({
                                          departmentCode: d.code || d.departmentCode || "",
                                          departmentName: d.name || d.departmentName || "Unknown",
                                        }))
                                        const updated = [...workOrders]
                                        updated[actualIndex] = {
                                          ...updated[actualIndex],
                                          departments: e.target.checked ? optionsAll : []
                                        }
                                        setWorkOrders(updated)
                                      }}
                                    />
                                    <span className="text-sm font-medium text-gray-700">Select All</span>
                                  </>
                                )
                              })()}
                            </div>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={(e) => { e.stopPropagation(); setDeptDropdownOpenIndex(null); setDepartmentSearch("") }}
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md p-1"
                              aria-label="Close departments dropdown"
                              title="Close"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          {(() => {
                            const options = (subOrganization?.departments || []).map((dept: any) => ({
                              code: dept.code || dept.departmentCode || "",
                              name: dept.name || dept.departmentName || "Unknown"
                            }))
                            const filtered = (departmentSearch.trim() === "")
                              ? options
                              : options.filter((d: any) => {
                                  const term = departmentSearch.toLowerCase()
                                  return d.code.toLowerCase().includes(term) || d.name.toLowerCase().includes(term)
                                })
                            const selected = workOrder.departments || []
                            return filtered.length > 0 ? (
                              filtered.map((d: any) => {
                                const isChecked = selected.some(s => s.departmentCode === d.code)
                                return (
                                  <label
                                    key={`${d.code}`}
                                    className="px-3 py-2 flex items-center gap-3 hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0 cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      const updated = [...workOrders]
                                      const list = updated[actualIndex].departments || []
                                      if (isChecked) {
                                        updated[actualIndex] = { ...updated[actualIndex], departments: list.filter(s => s.departmentCode !== d.code) }
                                      } else {
                                        updated[actualIndex] = { ...updated[actualIndex], departments: [...list, { departmentCode: d.code, departmentName: d.name }] }
                                      }
                                      setWorkOrders(updated)
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const updated = [...workOrders]; const list = updated[actualIndex].departments || []; if (isChecked) { updated[actualIndex] = { ...updated[actualIndex], departments: list.filter(s => s.departmentCode !== d.code) } } else { updated[actualIndex] = { ...updated[actualIndex], departments: [...list, { departmentCode: d.code, departmentName: d.name }] } } setWorkOrders(updated) } }}
                                  >
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                                      readOnly
                                      checked={isChecked}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="font-medium">{d.code} - {d.name}</span>
                                  </label>
                                )
                              })
                            ) : (
                              <div className="p-3 text-gray-500 text-sm text-center">No departments found</div>
                            )
                          })()}
                        </div>
                      )}
                    </div>

                    {(workOrder.departments || []).length > 0 && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-gray-600">Selected Departments:</p>
                        <div className="flex flex-wrap gap-2 max-h-[56px] overflow-y-auto">
                          {(workOrder.departments || []).map((dept, i2) => (
                            <div key={`${dept.departmentCode}-${i2}`} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              <span>{dept.departmentCode} - {dept.departmentName}</span>
                              {!isViewMode && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...workOrders]
                                    updated[actualIndex] = { ...updated[actualIndex], departments: (updated[actualIndex].departments || []).filter((d) => d.departmentCode !== dept.departmentCode) }
                                  setWorkOrders(updated)
                                }}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Service Details
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Service Charge Amount
                        </Label>
                        <Input
                          type="number"
                          value={workOrder.serviceChargeAmount ?? ""}
                          onChange={(e) =>
                            updateWorkOrder(actualIndex, "serviceChargeAmount", e.target.value ? Number.parseFloat(e.target.value) : undefined)
                          }
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.serviceChargeAmount
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter service charge amount"
                          disabled={isViewMode}
                        />
                        {errors.serviceChargeAmount && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.serviceChargeAmount[0]}
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Work Order Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={workOrder.workOrderType}
                          onValueChange={(value) => updateWorkOrder(actualIndex, "workOrderType", value)}
                          disabled={isViewMode}
                        >
                          <SelectTrigger className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.workOrderType
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}>
                            <SelectValue placeholder="Select work order type" />
                          </SelectTrigger>
                                                     <SelectContent>
                             <SelectItem value="Standard">Standard</SelectItem>
                             <SelectItem value="Job Work">Job Work</SelectItem>
                             <SelectItem value="Man Power">Man Power</SelectItem>
                           </SelectContent>
                        </Select>
                        {errors.workOrderType && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.workOrderType[0]}
                          </p>
                        )}
                      </div>

                      
                      {/* Man Power Details removed as requested */}

                      {/* Allocated Man Power */}
                      {workOrder.workOrderType === "Man Power" && (
                        <div className="group md:col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-semibold text-gray-700">Allocated Man Power ({(workOrder.allocatedManPower?.length || 0)})</Label>
                            <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="px-2 py-2 h-8 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg">
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      const updated = [...workOrders]
                                      const currentShowAll = (updated[actualIndex] as any).showAllManPower || false
                                      ;(updated[actualIndex] as any).showAllManPower = !currentShowAll
                                      setWorkOrders(updated)
                                    }}
                                    className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
                                  >
                                    {((workOrder as any).showAllManPower || false) ? (
                                      <>
                                        <ChevronUp className="h-4 w-4 mr-2 text-gray-600" />
                                        View Less
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                                        View All ({(workOrder.allocatedManPower?.length || 0)} entries)
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              {!isViewMode && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const updated = [...workOrders]
                                    const list = updated[actualIndex].allocatedManPower || []
                                    list.push({
                                      skillLevel: {
                                        skilledLevelTitle: "Low-Skilled",
                                        skilledLevelDescription: "Entry-level skills",
                                      },
                                      manPower: 45.00,
                                    })
                                    updated[actualIndex].allocatedManPower = list
                                    setWorkOrders(updated)
                                  }}
                                  className="h-8 px-3"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add Entry
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-3">
                            {[...(workOrder.allocatedManPower || [])].reverse().map((ap, apOriginalIndex) => {
                              const actualApIndex = (workOrder.allocatedManPower?.length || 0) - 1 - apOriginalIndex
                              
                              // Show only the most recently added man power entry (first in reverse order) when showAllManPower is false
                              if (!((workOrder as any).showAllManPower || false) && apOriginalIndex !== 0) {
                                return null
                              }
                              
                              return (
                              <div key={actualApIndex} className="p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-6 gap-3">
                                <div className="md:col-span-6 mb-2">
                                  <h6 className="text-sm font-medium text-gray-700">
                                    {actualApIndex === (workOrder.allocatedManPower?.length || 0) - 1 ? "Latest Man Power Entry (last update)" : `Man Power Entry ${actualApIndex + 1}`}
                                  </h6>
                                </div>
                                <div className="md:col-span-2">
                                  <Label className="text-xs text-gray-600 mb-1 block">Skilled Level Title</Label>
                                  <Select
                                    value={ap.skillLevel?.skilledLevelTitle || ""}
                                    onValueChange={(value) => {
                                      const updated = [...workOrders]
                                      const list = updated[actualIndex].allocatedManPower || []
                                      // find description from subOrganization.skillLevels
                                      let description = ap.skillLevel?.skilledLevelDescription || ""
                                      const skillOptions = subOrganization?.skillLevels || []
                                      const found = skillOptions.find((opt: any) => {
                                        const optTitle = opt.title || opt.skilledLevelTitle || ""
                                        return optTitle === value
                                      })
                                      if (found) {
                                        description = found.skilledLevelDescription || found.description || ""
                                      }
                                      list[actualApIndex] = {
                                        skillLevel: {
                                          skilledLevelTitle: value,
                                          skilledLevelDescription: description,
                                        },
                                        manPower: ap.manPower || 0,
                                      }
                                      updated[actualIndex].allocatedManPower = list
                                      setWorkOrders(updated)
                                    }}
                                    disabled={isViewMode}
                                  >
                                    <SelectTrigger className={`h-10 border-2 rounded-xl transition-all duration-300 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}> 
                                      <SelectValue placeholder="Select Skill Level" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px]">
                                      {loading ? (
                                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                                      ) : subOrganization?.skillLevels && subOrganization.skillLevels.length > 0 ? (
                                        subOrganization.skillLevels.map((option: any) => {
                                          const optionValue = option.title || option.skilledLevelTitle || ""
                                          const optionName = option.title || option.skilledLevelTitle || "Unknown"
                                          // disable if already chosen in this allocated list
                                          const isTaken = (workOrder.allocatedManPower || []).some((row, rowIdx) => {
                                            if (rowIdx === actualApIndex) return false
                                            const t = (row?.skillLevel?.skilledLevelTitle || "").trim()
                                            const d = (row?.skillLevel?.skilledLevelDescription || "").trim()
                                            const td = (option.skilledLevelDescription || option.description || "").trim()
                                            return t.toLowerCase() === optionValue.toLowerCase() && d.toLowerCase() === td.toLowerCase()
                                          })
                                          return (
                                            <SelectItem key={optionValue} value={optionValue} disabled={isTaken}>
                                              {optionName}
                                            </SelectItem>
                                          )
                                        })
                                      ) : (
                                        <SelectItem value="no-data" disabled>
                                          {subOrganization?.skillLevels ? 'No skill levels available' : 'Loading skill levels...'}
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="md:col-span-3">
                                  <Label className="text-xs text-gray-600 mb-1 block">Skilled Level Description</Label>
                                  <Input
                                    value={ap.skillLevel?.skilledLevelDescription || ""}
                                    readOnly
                                    className={`${isViewMode ? "bg-gray-100" : "bg-gray-50"}`}
                                  />
                                </div>
                                <div className="md:col-span-1">
                                  <Label className="text-xs text-gray-600 mb-1 block">Man Power</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={ap.manPower ? ap.manPower.toFixed(2) : "0.00"}
                                    onChange={(e) => {
                                      const updated = [...workOrders]
                                      const list = updated[actualIndex].allocatedManPower || []
                                      const value = parseFloat(e.target.value) || 0
                                      list[actualApIndex] = {
                                        skillLevel: {
                                          skilledLevelTitle: ap.skillLevel?.skilledLevelTitle || "",
                                          skilledLevelDescription: ap.skillLevel?.skilledLevelDescription || "",
                                        },
                                        manPower: value,
                                      }
                                      updated[actualIndex].allocatedManPower = list
                                      setWorkOrders(updated)
                                    }}
                                    disabled={isViewMode}
                                  />
                                </div>
                                {!isViewMode && (
                                  <div className="md:col-span-6 flex justify-end">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const updated = [...workOrders]
                                        const list = (updated[actualIndex].allocatedManPower || []).filter((_, i) => i !== actualApIndex)
                                        updated[actualIndex].allocatedManPower = list
                                        setWorkOrders(updated)
                                      }}
                                      className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )})}
                          </div>
                        </div>
                      )}
                      <div className="group md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Work Order Line Items
                        </Label>
                        <Textarea
                          value={workOrder.workOrderLineItems}
                          onChange={(e) => updateWorkOrder(actualIndex, "workOrderLineItems", e.target.value)}
                          className={`border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.workOrderLineItems
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter work order line items"
                          rows={2}
                          disabled={isViewMode}
                        />
                        {errors.workOrderLineItems && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.workOrderLineItems[0]}
                          </p>
                        )}
                      </div>
                      <div className="group md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Service Line Items
                        </Label>
                        <Textarea
                          value={workOrder.serviceLineItems}
                          onChange={(e) => updateWorkOrder(actualIndex, "serviceLineItems", e.target.value)}
                          className={`border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.serviceLineItems
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter service line items"
                          rows={2}
                          disabled={isViewMode}
                        />
                        {errors.serviceLineItems && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.serviceLineItems[0]}
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Service Code
                        </Label>
                        <Input
                          value={workOrder.serviceCode}
                          onChange={(e) => updateWorkOrder(actualIndex, "serviceCode", e.target.value)}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.serviceCode
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter service code"
                          disabled={isViewMode}
                        />
                        {errors.serviceCode && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.serviceCode[0]}
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          WC Charges Per Employee
                        </Label>
                        <Input
                          type="number"
                          value={workOrder.wcChargesPerEmployee}
                          onChange={(e) =>
                            updateWorkOrder(actualIndex, "wcChargesPerEmployee", Number.parseFloat(e.target.value) || 0)
                          }
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.wcChargesPerEmployee
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter WC charges per employee"
                          disabled={isViewMode}
                        />
                        {errors.wcChargesPerEmployee && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.wcChargesPerEmployee[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Employee Wages */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Employee Wages
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Wage Type
                        </Label>
                        <Select
                          value={workOrder.employeeWages?.wageType || ""}
                          onValueChange={(value) => {
                            const updatedWorkOrders = [...workOrders]
                            if (!updatedWorkOrders[actualIndex].employeeWages) {
                              updatedWorkOrders[actualIndex].employeeWages = {
                                wageType: "",
                                wageAmount: 0,
                              }
                            }
                            updatedWorkOrders[actualIndex].employeeWages.wageType = value
                            setWorkOrders(updatedWorkOrders)
                          }}
                          disabled={isViewMode}
                        >
                          <SelectTrigger className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.employeeWages?.wageType
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}>
                            <SelectValue placeholder="Select wage type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.employeeWages?.wageType && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.employeeWages.wageType[0]}
                          </p>
                        )}
                      </div>
                      <div className="group">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Wage Amount
                        </Label>
                        <Input
                          type="number"
                          value={workOrder.employeeWages?.wageAmount || 0}
                          onChange={(e) => {
                            const updatedWorkOrders = [...workOrders]
                            if (!updatedWorkOrders[actualIndex].employeeWages) {
                              updatedWorkOrders[actualIndex].employeeWages = {
                                wageType: "",
                                wageAmount: 0,
                              }
                            }
                            updatedWorkOrders[actualIndex].employeeWages.wageAmount = Number.parseFloat(e.target.value) || 0
                            setWorkOrders(updatedWorkOrders)
                          }}
                          className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                              ? "bg-gray-100 cursor-not-allowed" 
                              : ""
                            } ${errors.employeeWages?.wageAmount
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                          }`}
                          placeholder="Enter wage amount"
                          disabled={isViewMode}
                        />
                        {errors.employeeWages?.wageAmount && (
                          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {errors.employeeWages.wageAmount[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Asset Charges Per Day */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        Asset Charges Per Day ({(workOrder.assetChargesPerDay?.length || 0)})
                      </h5>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="px-2 py-2 h-8 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg">
                            <DropdownMenuItem 
                              onClick={() => {
                                const updated = [...workOrders]
                                const currentShowAll = (updated[actualIndex] as any).showAllAssetCharges || false
                                ;(updated[actualIndex] as any).showAllAssetCharges = !currentShowAll
                                setWorkOrders(updated)
                              }}
                              className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
                            >
                              {((workOrder as any).showAllAssetCharges || false) ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-2 text-gray-600" />
                                  View Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                                  View All ({(workOrder.assetChargesPerDay?.length || 0)} charges)
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {!isViewMode && (
                          <Button
                            onClick={() => addAssetCharge(actualIndex)}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Asset Charge
                          </Button>
                        )}
                      </div>
                    </div>

                    {[...workOrder.assetChargesPerDay].reverse().map((asset, assetOriginalIndex) => {
                      const actualAssetIndex = (workOrder.assetChargesPerDay?.length || 0) - 1 - assetOriginalIndex
                      
                      // Show only the most recently added asset charge (first in reverse order) when showAllAssetCharges is false
                      if (!((workOrder as any).showAllAssetCharges || false) && assetOriginalIndex !== 0) {
                        return null
                      }
                      
                      return (
                      <div key={actualAssetIndex} className="p-4 bg-gray-50 rounded-lg space-y-4">
                        <div className="flex items-center justify-between">
                          <h6 className="text-sm font-medium text-gray-700">
                            {actualAssetIndex === (workOrder.assetChargesPerDay?.length || 0) - 1 ? "Latest Asset Charge (last update)" : `Asset Charge ${actualAssetIndex + 1}`}
                          </h6>
                          {!isViewMode && (
                            <Button
                              onClick={() => removeAssetCharge(actualIndex, actualAssetIndex)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50 bg-transparent transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <SingleSelectField
                            key={`assetCode-${actualIndex}-${actualAssetIndex}`}
                            id={`assetCode-${actualIndex}-${actualAssetIndex}`}
                            label="Asset Code"
                            placeholder="Search Asset Code"
                            disabled={isViewMode}
                            value={asset.assetCode || ""}
                            onChange={(value) => handleAssetCodeChange(actualIndex, actualAssetIndex, value)}
                            options={loading ? [] : (subOrganization?.assetMaster?.assets ?? []).map((assetItem: any) => ({
                              value: assetItem.assetCode || "",
                              label: `${assetItem.assetCode || ""} - ${assetItem.assetName || "Unknown"}`,
                              tooltip: `${assetItem.assetCode || ""} - ${assetItem.assetName || "Unknown"}`
                            }))}
                            showOnlyValueInTrigger
                            className="group"
                            errorMessage={errors.assetChargesPerDay?.[actualAssetIndex]?.assetCode ? errors.assetChargesPerDay[actualAssetIndex].assetCode[0] : undefined}
                            allowOnlyProvidedOptions
                          />
                          <div className="group">
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Asset Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={asset.assetName}
                              className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                                  ? "bg-gray-100 cursor-not-allowed" 
                                  : "bg-gray-50 cursor-not-allowed"
                                } ${errors.assetChargesPerDay?.[actualAssetIndex]?.assetName
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                              }`}
                              placeholder="Asset name will be auto-populated"
                              readOnly
                            />
                            {errors.assetChargesPerDay?.[actualAssetIndex]?.assetName && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <X className="h-3 w-3" />
                                {errors.assetChargesPerDay[actualAssetIndex].assetName[0]}
                              </p>
                            )}
                          </div>
                          <div className="group">
                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Asset Charges <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="number"
                              value={asset.assetCharges}
                              onChange={(e) => {
                                const updatedWorkOrders = [...workOrders]
                                updatedWorkOrders[actualIndex].assetChargesPerDay[actualAssetIndex].assetCharges = Number.parseFloat(e.target.value) || 0
                                setWorkOrders(updatedWorkOrders)
                              }}
                              className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                                  ? "bg-gray-100 cursor-not-allowed" 
                                  : ""
                                } ${errors.assetChargesPerDay?.[actualAssetIndex]?.assetCharges
                                  ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                                  : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                              }`}
                              placeholder="Enter asset charges"
                              disabled={isViewMode}
                            />
                            {errors.assetChargesPerDay?.[actualAssetIndex]?.assetCharges && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                <X className="h-3 w-3" />
                                {errors.assetChargesPerDay[actualAssetIndex].assetCharges[0]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>

                  {/* Remarks */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">
                      Remarks
                    </h5>
                    <div className="group">
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Additional Notes
                      </Label>
                      <Textarea
                        value={workOrder.remarks || ""}
                        onChange={(e) => updateWorkOrder(actualIndex, "remarks", e.target.value)}
                        className={`border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${isViewMode
                            ? "bg-gray-100 cursor-not-allowed" 
                            : ""
                          } border-gray-200 focus:border-blue-500 focus:ring-blue-500/20`}
                        placeholder="Enter any additional remarks or notes"
                        rows={3}
                        disabled={isViewMode}
                      />
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
              <li>• <strong>Work Order Date</strong> must be less than or equal to <strong>Contract Period From</strong></li>
              <li>• <strong>Contract Period From</strong> must be earlier than or equal to <strong>Contract Period To</strong></li>
              <li>• <strong>Work Order Date</strong> can be in the future</li>
              <li>• <strong>Contract Period From</strong> can be in the future</li>
              <li>• <strong>Contract Period To</strong> can be in the future (for future contract end dates)</li>
            </ul>
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
              <div className={`w-3 h-3 rounded-full ${isFormValid() ? 'bg-green-500' : workOrders.length > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {isFormValid() 
                  ? 'Form is valid and ready to continue' 
                  : workOrders.length > 0 
                    ? `${workOrders.length} work order(s) added - please complete required fields` 
                    : 'At least one work order is required'
                }
              </span>
              {showErrors && Object.keys(validationErrors).length > 0 && (
                <div className="text-xs text-red-600 ml-2">
                  {workOrders.length === 0 
                    ? 'At least one work order is required' 
                    : 'Please complete all required fields'}
                </div>
              )}
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

      {/* Delete Confirmation Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${deleteModalState.isOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
          onClick={closeDeleteModal}
        />
        
        {/* Modal */}
        <div className="relative transform transition-all duration-300 ease-out scale-100 opacity-100 max-w-md w-full mx-auto">
          <div className={`${deleteModalState.type === "warning"
              ? "bg-yellow-50 border-yellow-200" 
              : "bg-green-50 border-green-200"
          } border-2 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300`}>
            {/* Header with Icon */}
            <div className="relative p-6 pb-4">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${deleteModalState.type === "warning"
                    ? "bg-yellow-50 border border-yellow-200" 
                    : "bg-green-50 border border-green-200"
                }`}>
                  {deleteModalState.type === "warning" ? (
                    <Trash2 className="h-8 w-8 text-yellow-600" />
                  ) : (
                    <ClipboardList className="h-8 w-8 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${deleteModalState.type === "warning"
                      ? "text-yellow-800" 
                      : "text-green-800"
                  }`}>
                    {deleteModalState.title}
                  </h3>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-6 pb-6">
              <p className={`text-sm leading-relaxed ${deleteModalState.type === "warning"
                  ? "text-yellow-700" 
                  : "text-green-700"
              }`}>
                {deleteModalState.message}
              </p>
            </div>
            
            {/* Footer */}
            <div className="px-6 pb-6 flex justify-end space-x-3">
              <Button
                onClick={closeDeleteModal}
                variant="outline"
                className={`border-2 ${deleteModalState.type === "warning"
                    ? "border-yellow-200 text-yellow-800 hover:bg-yellow-50" 
                    : "border-green-200 text-green-800 hover:bg-green-50"
                } transition-colors duration-200`}
              >
                {deleteModalState.type === "warning" ? "Cancel" : "Close"}
              </Button>
              {deleteModalState.type === "warning" && (
                <Button
                  onClick={confirmDeleteWorkOrder}
                  className="bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={successPopupData.title}
        message={successPopupData.message}
      />
      <DocumentPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentPath={previewDoc.path}
        mimeType={previewDoc.mime}
        title={previewDoc.title}
      />
    </Card>
  )
} 