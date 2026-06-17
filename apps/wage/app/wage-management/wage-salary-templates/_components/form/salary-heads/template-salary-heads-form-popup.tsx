"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { X, FileText } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import SingleSelectField from "@/components/fields/single-select-field"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import type { SalaryHeadItem } from "../../schemas/salary-head.schema"
import { createEmptySalaryHead } from "../../schemas/salary-head.schema"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

interface TemplateSalaryHeadsFormPopupProps {
  open: boolean
  setOpen: (isOpen: boolean) => void
  onSuccess?: () => void
  onAddSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  templateId?: string | null
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

export default function TemplateSalaryHeadsFormPopup({
  open,
  setOpen,
  onSuccess,
  onAddSuccess,
  onServerUpdate,
  organizationId,
  templateId,
  editData,
  isEditMode,
  deleteValue,
}: TemplateSalaryHeadsFormPopupProps) {
  const tenantCode = useGetTenantCode()
  const [selectedSalaryHead, setSelectedSalaryHead] = useState<{ code: string; name: string } | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [existingSalaryHeads, setExistingSalaryHeads] = useState<SalaryHeadItem[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const inputClass = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

  // Fetch existing salary heads from the template document
  const templateCriteria = useMemo(
    () => (tenantCode && templateId ? [
      { field: "tenantCode", operator: "eq", value: tenantCode },
      { field: "_id", operator: "eq", value: templateId }
    ] : []),
    [tenantCode, templateId]
  )

  const { data: templateData, refetch: refetchTemplate } = useRequest<any>({
    url: "salaryTemplates/search",
    method: "POST",
    data: templateCriteria,
    dependencies: [tenantCode, templateId],
    enabled: Boolean(tenantCode && templateId) && open,
  })

  // Fetch all available salary heads for dropdown
  const salaryHeadCriteria = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "eq", value: tenantCode }] : []),
    [tenantCode],
  )
  
  const { data: salaryHeadData, loading: salaryHeadLoading } = useRequest<any[]>({
    url: "wageSalaryHeads/search",
    method: "POST",
    data: salaryHeadCriteria,
    dependencies: [tenantCode],
    enabled: Boolean(tenantCode) && open,
  })

  // Transform salary head data for dropdown options
  const salaryHeadOptions = useMemo(() => {
    const currentHeadCode = editData?.salaryHeadCode
    return (Array.isArray(salaryHeadData) ? salaryHeadData : [])
      .filter((item: any) => item.code !== currentHeadCode)
      .map((item: any) => ({
        value: item?.code || "",
        label: `${item?.name || ""} (${item?.code || ""})`,
        originalData: {
          code: item?.code || "",
          name: item?.name || "",
        },
      }))
  }, [salaryHeadData, editData?.salaryHeadCode])

  // Set existing salary heads from the template data
  useEffect(() => {
    if (templateData && Array.isArray(templateData) && templateData.length > 0) {
      const templateSalaryHeads = templateData[0]?.salaryHeads || []
      setExistingSalaryHeads(templateSalaryHeads)
    }
  }, [templateData])

  // Reset form when modal opens
  useEffect(() => {
    if (!open) {
      setSelectedSalaryHead(null)
      setAmount(0)
      setErrors({})
      return
    }
    
    if (isEditMode && editData) {
      setSelectedSalaryHead({
        code: editData.salaryHeadCode,
        name: editData.salaryHeadName,
      })
      setAmount(editData.amount || 0)
    } else {
      setSelectedSalaryHead(null)
      setAmount(0)
    }
    setErrors({})
  }, [open, isEditMode, editData])

  // Handle delete when deleteValue is provided
  useEffect(() => {
    if (deleteValue?.salaryHeadCode) {
      handleDeleteItem(deleteValue)
    }
  }, [deleteValue])

  const { post: postSalaryHead, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      
      if (!status) {
        // Validation failed
        const responseData = response?.data && typeof response.data === "object" ? response.data : response
        toast.error(responseData?.message || "Validation failed")
        return
      }

      // Success
      toast.success(isEditMode ? "Salary head updated successfully!" : "Salary head added successfully!")
      
      if (!isEditMode) onAddSuccess?.()
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Failed to save salary head!")
      console.error("POST error:", error)
    },
  })

  const handleDeleteItem = async (itemToDelete: SalaryHeadItem) => {
    try {
      // Get current salary heads
      const currentSalaryHeads = existingSalaryHeads
      
      // Filter out the item to delete
      const updatedSalaryHeads = currentSalaryHeads.filter(
        (item) => item.salaryHeadCode !== itemToDelete.salaryHeadCode
      )

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "salaryTemplates",
        event: "validate",
        id: templateId,
        ruleId: "templateSalaryHeadsValidator",
        data: {
          salaryHeads: updatedSalaryHeads,
        },
      }
      
      postSalaryHead(postData)
    } catch (error) {
      console.error("Error deleting salary head:", error)
      toast.error("Failed to delete salary head")
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!selectedSalaryHead?.code) {
      newErrors.salaryHeadCode = "Salary head is required"
    }
    
    if (!selectedSalaryHead?.name) {
      newErrors.salaryHeadName = "Salary head name is required"
    }
    
    if (amount <= 0) {
      newErrors.amount = "Amount must be greater than 0"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFormSubmit = async () => {
    if (!validateForm()) return

    if (!selectedSalaryHead) {
      toast.error("Please select a salary head")
      return
    }

    // Check for duplicates
    const isDuplicate = existingSalaryHeads.some(
      (item) => 
        item.salaryHeadCode === selectedSalaryHead.code &&
        (!isEditMode || item.salaryHeadCode !== editData?.salaryHeadCode)
    )

    if (isDuplicate) {
      toast.error("This salary head has already been added to the template")
      return
    }

    // Prepare the new salary head item
    const newSalaryHead: SalaryHeadItem = {
      salaryHeadCode: selectedSalaryHead.code,
      salaryHeadName: selectedSalaryHead.name,
      amount: amount,
      parseID: isEditMode && editData?.parseID ? editData.parseID : crypto.randomUUID?.() || Math.random().toString(36),
    }

    // Prepare the payload
    let updatedSalaryHeads = [...existingSalaryHeads]

    if (isEditMode && editData) {
      // Replace the edited item
      const editIndex = existingSalaryHeads.findIndex(
        (item) => item.salaryHeadCode === editData.salaryHeadCode
      )
      if (editIndex !== -1) {
        updatedSalaryHeads[editIndex] = newSalaryHead
      }
    } else {
      // Add new item
      updatedSalaryHeads.push(newSalaryHead)
    }

    const postData = {
      tenant: tenantCode,
      action: "update",
      collectionName: "salaryTemplates",
      event: "validate",
      id: templateId,
      ruleId: "templateSalaryHeadsValidator",
      data: {
        salaryHeads: updatedSalaryHeads,
      },
    }
    
    postSalaryHead(postData)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {isEditMode ? "Edit Salary Head" : "Add Salary Head to Template"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {isEditMode ? "Update salary head information." : "Select a salary head and enter amount for this template."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-3">
            <SubFormTitle title="Salary Head Information" />
            <div className="space-y-4">
              <div className="space-y-2">
                <SingleSelectField
                  label="Salary Head"
                  placeholder={salaryHeadLoading ? "Loading..." : "Select Salary Head"}
                  value={selectedSalaryHead?.code || ""}
                  disabled={isEditMode}
                  onChange={(value) => {
                    const selected = salaryHeadOptions.find(opt => opt.value === value)
                    if (selected?.originalData) {
                      setSelectedSalaryHead(selected.originalData)
                      setErrors((prev) => ({ ...prev, salaryHeadCode: "", salaryHeadName: "" }))
                    }
                  }}
                  options={salaryHeadOptions}
                  required
                />
                {errors.salaryHeadCode && <p className="text-red-500 text-xs">{errors.salaryHeadCode}</p>}
                {errors.salaryHeadName && <p className="text-red-500 text-xs">{errors.salaryHeadName}</p>}
              </div>

              {/* Show selected item details */}
              {selectedSalaryHead && (
                <div className="mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-600">Selected:</span>
                    <span className="text-gray-900">
                      {selectedSalaryHead.name} ({selectedSalaryHead.code})
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  className={`${inputClass} ${errors.amount ? "border-red-500" : ""}`}
                  type="number"
                  value={amount}
                  disabled={isEditMode === false && !selectedSalaryHead}
                  onChange={(e) => {
                    setAmount(Number(e.target.value || 0))
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }))
                  }}
                  placeholder="Enter amount"
                />
                {errors.amount && <p className="text-red-500 text-xs">{errors.amount}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={postLoading || salaryHeadLoading}
            onClick={handleFormSubmit}
          >
            {postLoading ? "Saving..." : isEditMode ? "Update" : "Add Salary Head"}
          </Button>
        </div>
      </div>
    </div>
  )
}