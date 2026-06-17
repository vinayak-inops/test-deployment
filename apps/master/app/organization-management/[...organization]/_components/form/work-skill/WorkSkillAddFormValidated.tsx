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
import { createWorkSkillSchema } from "./work-skill-form-schema"

interface WorkSkillFormData {
  workSkillCode?: string
  workSkillTitle?: string
  workSkillDescription?: string
}

interface WorkSkillFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type WorkSkillFormField = "workSkillCode" | "workSkillTitle" | "workSkillDescription"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
const TEXTAREA_CLASS = "min-h-[96px] border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 resize-none"

export default function WorkSkillAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: WorkSkillFormModalProps) {
  const tenantCode = useGetTenantCode()
  const schema = useMemo(
    () => createWorkSkillSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.workSkillCode) return
    handleDeleteItem(deleteValue.workSkillCode)
  }, [deleteValue])

  const handleDeleteItem = async (workSkillCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          workSkill: [{ workSkillCode }],
        },
      }
      // postWorkSkill(postData)

    } catch (error) {
      console.error("Error deleting work skill:", error)
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
  } = useForm<WorkSkillFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      workSkillCode: "",
      workSkillTitle: "",
      workSkillDescription: "",
    },
  })

  const { post: postWorkSkill, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, WorkSkillFormField> = {
          workSkillCode: "workSkillCode",
          workSkillTitle: "workSkillTitle",
          workSkillDescription: "workSkillDescription",
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

      toast.success("Work Skill submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Work Skill submission failed!")
      console.error("POST error:", error)
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      setValue("workSkillCode", editData.workSkillCode || "")
      setValue("workSkillTitle", editData.workSkillTitle || "")
      setValue("workSkillDescription", editData.workSkillDescription || "")
    } else if (open && !isEditMode) {
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  const handleFormSubmit = async (data: WorkSkillFormData) => {
    try {
      clearErrors()
      const payloadWorkSkill = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "workSkillValidator",
        data: {
          workSkill: [payloadWorkSkill],
        },
      }
      postWorkSkill(postData)
    
    } catch (error) {
      console.error("Error processing work skill:", error)
    }
  }

  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gray-100 p-1.5">
              <Award className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {isEditMode ? "Edit Work Skill" : "Add New Work Skill"}
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {isEditMode ? "Update work skill information." : "Create a new work skill entry."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<WorkSkillFormData>)} className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workSkillCode" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Work Skill Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="workSkillCode"
                    {...register("workSkillCode")}
                    placeholder="Enter work skill code"
                    className={errors.workSkillCode?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                    disabled={isEditMode}
                  />
                  {errors.workSkillCode?.message && <p className="text-xs text-red-500">{errors.workSkillCode.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workSkillTitle" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Work Skill Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="workSkillTitle"
                    {...register("workSkillTitle")}
                    placeholder="Enter work skill title"
                    className={errors.workSkillTitle?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                  />
                  {errors.workSkillTitle?.message && <p className="text-xs text-red-500">{errors.workSkillTitle.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workSkillDescription" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="workSkillDescription"
                  {...register("workSkillDescription")}
                  placeholder="Enter work skill description"
                  rows={3}
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 rounded-b-lg border-t border-gray-200 bg-gray-50 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            onClick={handleCancel}
            disabled={isSubmitting || postLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSubmit(handleFormSubmit as SubmitHandler<WorkSkillFormData>)}
            disabled={isSubmitting || postLoading}
          >
            {postLoading ? "Saving..." : isEditMode ? "Update" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
