"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, UserCheck } from "lucide-react"
import { useEffect, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useFetchUserEntitlements } from "@/hooks/hierarchy/useFetchUserEntitlements"
import { createDesignationSchema } from "./designation-form-schema"

interface DesignationFormData {
  designationCode?: string
  designationName?: string
  designationDescription?: string
}

interface DesignationFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type DesignationFormField =
  | "designationCode"
  | "designationName"
  | "designationDescription"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
const TEXTAREA_CLASS = "min-h-[96px] border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 resize-none"

export default function DesignationAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: DesignationFormModalProps) {
  const tenantCode = useGetTenantCode()
  const { fetchUserEntitlements } = useFetchUserEntitlements()

  const schema = useMemo(
    () => createDesignationSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.designationCode) return
    handleDeleteItem(deleteValue.designationCode)
  }, [deleteValue])

  const handleDeleteItem = async (designationCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          designations: [{ designationCode }],
        },
      }
      // postDesignation(postData)
    } catch (error) {
      console.error("Error deleting designation:", error)
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
  } = useForm<DesignationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      designationCode: "",
      designationName: "",
      designationDescription: "",
    },
  })

  const { post: postDesignation, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, DesignationFormField> = {
          designationCode: "designationCode",
          designationName: "designationName",
          designationDescription: "designationDescription",
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

      toast.success("Designation submitted successfully!")
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
      toast.error("Designation submission failed!")
      console.error("POST error:", error)
    },
  })


  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      setValue("designationCode", editData.designationCode || "")
      setValue("designationName", editData.designationName || "")
      setValue("designationDescription", editData.designationDescription || "")
    } else if (open && !isEditMode) {
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  const handleFormSubmit = async (data: DesignationFormData) => {
    try {
      clearErrors()
      const payloadDesignation = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "designationValidator",
        data: {
          designations: [payloadDesignation],
        },
      }
      postDesignation(postData)
    } catch (error) {
      console.error("Error processing designation:", error)
    }
  }

  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  return (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<DesignationFormData>)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit Designation" : "Add New Designation"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update designation information." : "Create a new designation entry."}
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
                    <Label htmlFor="designationCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Designation Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="designationCode"
                      {...register("designationCode")}
                      placeholder="Enter designation code"
                      className={`${INPUT_CLASS} ${errors.designationCode?.message ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.designationCode?.message && <p className="text-xs text-red-500">{errors.designationCode.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designationName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Designation Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="designationName"
                      {...register("designationName")}
                      placeholder="Enter designation name"
                      className={`${INPUT_CLASS} ${errors.designationName?.message ? "border-red-500" : ""}`}
                    />
                    {errors.designationName?.message && <p className="text-xs text-red-500">{errors.designationName.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designationDescription" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Description
                  </Label>
                  <Textarea
                    id="designationDescription"
                    {...register("designationDescription")}
                    placeholder="Enter designation description"
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
  )
} 
