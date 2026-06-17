"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Award, X } from "lucide-react"
import { useEffect, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { createSkillLevelsSchema } from "./skill-levels-form-schema"

interface SkillLevelsFormData {
  skilledLevelTitle?: string
  skilledLevelDescription?: string
}

interface SkillLevelsFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type SkillLevelsFormField = "skilledLevelTitle" | "skilledLevelDescription"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
const TEXTAREA_CLASS = "min-h-[96px] border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 resize-none"

export default function SkillLevelsAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: SkillLevelsFormModalProps) {
  const tenantCode = useGetTenantCode()
  const schema = useMemo(
    () => createSkillLevelsSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm<SkillLevelsFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      skilledLevelTitle: "",
      skilledLevelDescription: "",
    }
  })

  useEffect(() => {
    if (!deleteValue?.skilledLevelTitle) return
    handleDeleteItem(deleteValue.skilledLevelTitle)
  }, [deleteValue])

  const { post: postSkillLevels, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, SkillLevelsFormField> = {
          skilledLevelTitle: "skilledLevelTitle",
          skilledLevelDescription: "skilledLevelDescription",
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

      toast.success("Skill level submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      console.error("Error submitting skill level:", error)
      toast.error("Failed to submit skill level. Please try again.")
    }
  })

  // Handle form submission
  const handleFormSubmit: SubmitHandler<SkillLevelsFormData> = async (data) => {
    try {
      clearErrors()
      const payloadSkillLevel = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }

      const postData = {
        tenant: tenantCode,
        action:"update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "skillLevelValidator",
        data: {
          skillLevels: [payloadSkillLevel],
        },
      }
      postSkillLevels(postData)
    } catch (error) {
      console.error("Error processing skill level:", error)
      toast.error("Failed to process skill level. Please try again.")
    }
  }

  // Handle delete item
  const handleDeleteItem = async (skilledLevelTitle: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          skillLevels: [{ skilledLevelTitle }],
        },
      }

      // postSkillLevels(postData)
    } catch (error) {
      console.error("Error deleting skill level:", error)
      toast.error("Failed to delete skill level. Please try again.")
    }
  }

  // Handle cancel
  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  // Reset form when edit data changes or popup opens/closes
  useEffect(() => {
    if (isEditMode && editData) {
      setValue("skilledLevelTitle", editData.skilledLevelTitle || "")
      setValue("skilledLevelDescription", editData.skilledLevelDescription || "")
    } else if (open && !isEditMode) {
      // Reset form when opening in add mode
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  return (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Award className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit Skill Level" : "Add New Skill Level"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update skill level information." : "Create a new skill level entry."}
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

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="skilledLevelTitle" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Skill Level Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="skilledLevelTitle"
                      placeholder="Enter skill level title"
                      {...register("skilledLevelTitle")}
                      className={`${INPUT_CLASS} ${errors.skilledLevelTitle ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.skilledLevelTitle && (
                      <p className="text-xs text-red-500">{errors.skilledLevelTitle.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skilledLevelDescription" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Description
                    </Label>
                    <Textarea
                      id="skilledLevelDescription"
                      placeholder="Enter skill level description"
                      rows={3}
                      {...register("skilledLevelDescription")}
                      className={`${TEXTAREA_CLASS} ${errors.skilledLevelDescription ? "border-red-500" : ""}`}
                    />
                    {errors.skilledLevelDescription && (
                      <p className="text-xs text-red-500">{errors.skilledLevelDescription.message}</p>
                    )}
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
                disabled={isSubmitting || postLoading}
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
