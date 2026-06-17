"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, GraduationCap } from "lucide-react"
import { useEffect, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useFetchUserEntitlements } from "@/hooks/hierarchy/useFetchUserEntitlements"
import { createGradeSchema } from "./grade-form-schema"

interface GradeFormData {
  gradeCode?: string
  gradeName?: string
  gradeDescription?: string
}

interface GradeFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type GradeFormField = "gradeCode" | "gradeName" | "gradeDescription"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
const TEXTAREA_CLASS = "min-h-[96px] border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 resize-none"

export default function GradeAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: GradeFormModalProps) {
  const tenantCode = useGetTenantCode()
  const { fetchUserEntitlements } = useFetchUserEntitlements()

  const schema = useMemo(
    () => createGradeSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.gradeCode) return
    handleDeleteItem(deleteValue.gradeCode)
  }, [deleteValue])

  const handleDeleteItem = async (gradeCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          grades: [{ gradeCode }],
        },
      }
      // postGrade(postData)
    } catch (error) {
      console.error("Error deleting grade:", error)
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
  } = useForm<GradeFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gradeCode: "",
      gradeName: "",
      gradeDescription: "",
    },
  })

  const { post: postGrade, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, GradeFormField> = {
          gradeCode: "gradeCode",
          gradeName: "gradeName",
          gradeDescription: "gradeDescription",
        }

        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField as any, { type: "server", message })
        })
        return
      }

      toast.success("Grade submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) {
        if (isEditMode) {
          await onServerUpdate()
        } else {
          const userEntitlementsFetched = await fetchUserEntitlements()
          if (userEntitlementsFetched) {
            await onServerUpdate()
          }
        }
      }
      reset()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Grade submission failed!")
      console.error("POST error:", error)
    },
  })

  useEffect(() => {
    if (isEditMode && editData) {
      setValue("gradeCode", editData.gradeCode || "")
      setValue("gradeName", editData.gradeName || "")
      setValue("gradeDescription", editData.gradeDescription || "")
    } else if (open && !isEditMode) {
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  const handleFormSubmit = async (data: GradeFormData) => {
    try {
      clearErrors()
      const payloadGrade = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "gradeValidator",
        data: {
          grades: [payloadGrade],
        },
      }
      postGrade(postData)
    } catch (error) {
      console.error("Error processing grade:", error)
    }
  }

  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full h-full flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <GraduationCap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {isEditMode ? "Edit Grade" : "Add New Grade"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {isEditMode ? "Update grade information." : "Create a new grade entry."}
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
                  <Label htmlFor="gradeCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Grade Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="gradeCode"
                    {...register("gradeCode")}
                    placeholder="Enter grade code"
                    className={`${INPUT_CLASS} ${errors.gradeCode?.message ? "border-red-500" : ""}`}
                    disabled={isEditMode}
                  />
                  {errors.gradeCode?.message && <p className="text-xs text-red-500">{errors.gradeCode.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradeName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Grade Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="gradeName"
                    {...register("gradeName")}
                    placeholder="Enter grade name"
                    className={`${INPUT_CLASS} ${errors.gradeName?.message ? "border-red-500" : ""}`}
                  />
                  {errors.gradeName?.message && <p className="text-xs text-red-500">{errors.gradeName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeDescription" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Description
                </Label>
                <Textarea
                  id="gradeDescription"
                  {...register("gradeDescription")}
                  placeholder="Enter grade description"
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
}
