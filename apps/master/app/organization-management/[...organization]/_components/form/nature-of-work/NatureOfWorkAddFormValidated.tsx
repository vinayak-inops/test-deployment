"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Briefcase, X } from "lucide-react"
import { useEffect, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { createNatureOfWorkSchema } from "./nature-of-work-form-schema"

interface NatureOfWorkFormData {
  natureOfWorkCode?: string
  natureOfWorkTitle?: string
  natureOfWorkDescription?: string
}

interface NatureOfWorkFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type NatureOfWorkFormField = "natureOfWorkCode" | "natureOfWorkTitle" | "natureOfWorkDescription"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
const TEXTAREA_CLASS = "min-h-[96px] border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 resize-none"

export default function NatureOfWorkAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: NatureOfWorkFormModalProps) {
  const tenantCode = useGetTenantCode()
  const schema = useMemo(
    () => createNatureOfWorkSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.natureOfWorkCode) return
    handleDeleteItem(deleteValue.natureOfWorkCode)
  }, [deleteValue])

  const handleDeleteItem = async (natureOfWorkCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          natureOfWork: [{ natureOfWorkCode }],
        },
      }
      // postNatureOfWork(postData)
    } catch (error) {
      console.error("Error deleting nature of work:", error)
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
  } = useForm<NatureOfWorkFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      natureOfWorkCode: "",
      natureOfWorkTitle: "",
      natureOfWorkDescription: "",
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      setValue("natureOfWorkCode", editData.natureOfWorkCode || "")
      setValue("natureOfWorkTitle", editData.natureOfWorkTitle || "")
      setValue("natureOfWorkDescription", editData.natureOfWorkDescription || "")
    } else if (open && !isEditMode) {
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  const { post: postNatureOfWork, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, NatureOfWorkFormField> = {
          natureOfWorkCode: "natureOfWorkCode",
          natureOfWorkTitle: "natureOfWorkTitle",
          natureOfWorkDescription: "natureOfWorkDescription",
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

      toast.success("Nature of work submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Nature of work submission failed!")
      console.error("POST error:", error)
    },
  })

  const handleFormSubmit = async (data: NatureOfWorkFormData) => {
    try {
      clearErrors()
      const payloadNatureOfWork = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "natureOfWorkValidator",
        data: {
          natureOfWork: [payloadNatureOfWork],
        },
      }
      postNatureOfWork(postData)
    } catch (error) {
      console.error("Error processing nature of work:", error)
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
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<NatureOfWorkFormData>)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit Nature of Work" : "Add New Nature of Work"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update nature of work information." : "Create a new nature of work entry."}
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
                    <Label htmlFor="natureOfWorkCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Nature of Work Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="natureOfWorkCode"
                      {...register("natureOfWorkCode")}
                      placeholder="Enter nature of work code"
                      className={`${INPUT_CLASS} ${errors.natureOfWorkCode?.message ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.natureOfWorkCode?.message && <p className="text-xs text-red-500">{errors.natureOfWorkCode.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="natureOfWorkTitle" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Nature of Work Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="natureOfWorkTitle"
                      {...register("natureOfWorkTitle")}
                      placeholder="Enter nature of work title"
                      className={`${INPUT_CLASS} ${errors.natureOfWorkTitle?.message ? "border-red-500" : ""}`}
                    />
                    {errors.natureOfWorkTitle?.message && <p className="text-xs text-red-500">{errors.natureOfWorkTitle.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="natureOfWorkDescription" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Description
                  </Label>
                  <Textarea
                    id="natureOfWorkDescription"
                    {...register("natureOfWorkDescription")}
                    placeholder="Enter nature of work description"
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
