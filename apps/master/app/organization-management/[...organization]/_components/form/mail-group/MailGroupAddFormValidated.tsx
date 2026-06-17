"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, X } from "lucide-react"
import { useEffect, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { createMailGroupSchema } from "./mail-group-form-schema"

interface MailGroupFormData {
  mailGroupCode?: string
  mailGroupName?: string
}

interface MailGroupFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type MailGroupFormField = "mailGroupCode" | "mailGroupName"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"

export default function MailGroupAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: MailGroupFormModalProps) {
  const tenantCode = useGetTenantCode()
  const schema = useMemo(
    () => createMailGroupSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.mailGroupCode) return
    handleDeleteItem(deleteValue.mailGroupCode)
  }, [deleteValue])

  const handleDeleteItem = async (mailGroupCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          mailGroup: [{ mailGroupCode }],
        },
      }
      // postMailGroup(postData)
    } catch (error) {
      console.error("Error deleting mail group:", error)
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
  } = useForm<MailGroupFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      mailGroupCode: "",
      mailGroupName: "",
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      setValue("mailGroupCode", editData.mailGroupCode || "")
      setValue("mailGroupName", editData.mailGroupName || "")
    } else if (open && !isEditMode) {
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  const { post: postMailGroup, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, MailGroupFormField> = {
          mailGroupCode: "mailGroupCode",
          mailGroupName: "mailGroupName",
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

      toast.success("Mail group submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Mail group submission failed!")
      console.error("POST error:", error)
    },
  })

  const handleFormSubmit = async (data: MailGroupFormData) => {
    try {
      clearErrors()
      const payloadMailGroup = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }
      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "mailGroupValidator",
        data: {
          mailGroup: [payloadMailGroup],
        },
      }
      postMailGroup(postData)
    } catch (error) {
      console.error("Error processing mail group:", error)
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
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<MailGroupFormData>)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit Mail Group" : "Add New Mail Group"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update mail group information." : "Create a new mail group entry."}
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
                    <Label htmlFor="mailGroupCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Mail Group Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="mailGroupCode"
                      {...register("mailGroupCode")}
                      placeholder="Enter mail group code (e.g., labourLicense1)"
                      className={`${INPUT_CLASS} ${errors.mailGroupCode?.message ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.mailGroupCode?.message && <p className="text-xs text-red-500">{errors.mailGroupCode.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mailGroupName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Mail Group Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="mailGroupName"
                      {...register("mailGroupName")}
                      placeholder="Enter mail group name (e.g., labourLicense1)"
                      className={`${INPUT_CLASS} ${errors.mailGroupName?.message ? "border-red-500" : ""}`}
                    />
                    {errors.mailGroupName?.message && <p className="text-xs text-red-500">{errors.mailGroupName.message}</p>}
                  </div>
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
