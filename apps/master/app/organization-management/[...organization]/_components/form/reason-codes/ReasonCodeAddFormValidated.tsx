"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, X } from "lucide-react"
import { useEffect, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { createReasonCodesSchema } from "./reason-codes-form-schema"

interface ReasonCodeFormData {
  reasonCode?: string
  reasonName?: string
  reasonDescription?: string
}

interface ReasonCodeFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type ReasonCodeFormField = "reasonCode" | "reasonName" | "reasonDescription"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
const TEXTAREA_CLASS = "min-h-[96px] border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 resize-none"

export default function ReasonCodeAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: ReasonCodeFormModalProps) {
  const tenantCode = useGetTenantCode()
  const schema = useMemo(
    () => createReasonCodesSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.reasonCode) return
    handleDeleteItem(deleteValue.reasonCode)
  }, [deleteValue])

  const handleDeleteItem = async (reasonCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          reasonCodes: [{ reasonCode }],
        },
      }
      // postReasonCode(postData)

    } catch (error) {
      console.error("Error deleting reason code:", error)
    }
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm<ReasonCodeFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      reasonCode: "",
      reasonName: "",
      reasonDescription: "",
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      setValue("reasonCode", editData.reasonCode || "")
      setValue("reasonName", editData.reasonName || "")
      setValue("reasonDescription", editData.reasonDescription || "")
    } else if (open && !isEditMode) {
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  const { post: postReasonCode, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, ReasonCodeFormField> = {
          reasonCode: "reasonCode",
          reasonName: "reasonName",
          reasonDescription: "reasonDescription",
        }
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField, { type: "server", message })
        })
        return
      }

      toast.success("Reason code submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Reason code submission failed!")
      console.error("POST error:", error)
    },
  })

  const handleFormSubmit = async (data: ReasonCodeFormData) => {
    try {
      clearErrors()
      const payloadReasonCode = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }
      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "reasonCodeValidator",
        data: {
          reasonCodes: [payloadReasonCode],
        },
      }
      postReasonCode(postData)
    } catch (error) {
      console.error("Error processing reason code:", error)
    }
  }

  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  return (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<ReasonCodeFormData>)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit Reason Code" : "Add New Reason Code"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update reason code information." : "Create a new reason code entry."}
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

            <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-3">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reasonCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Reason Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="reasonCode"
                      {...register("reasonCode")}
                      placeholder="Enter reason code"
                      className={`${INPUT_CLASS} ${errors.reasonCode?.message ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.reasonCode?.message && <p className="text-xs text-red-500">{errors.reasonCode.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reasonName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Reason Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="reasonName"
                      {...register("reasonName")}
                      placeholder="Enter reason name"
                      className={`${INPUT_CLASS} ${errors.reasonName?.message ? "border-red-500" : ""}`}
                    />
                    {errors.reasonName?.message && <p className="text-xs text-red-500">{errors.reasonName.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reasonDescription" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Description
                  </Label>
                  <Textarea
                    id="reasonDescription"
                    {...register("reasonDescription")}
                    placeholder="Enter reason description"
                    rows={3}
                    className={TEXTAREA_CLASS}
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting || postLoading}
              >
                {postLoading ? "Saving..." : (isEditMode ? "Update" : "Save")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    ) : null
  )
} 
