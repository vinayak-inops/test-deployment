"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Globe, X } from "lucide-react"
import { useEffect, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"
import { createRegionSchema } from "./region-form-schema"

interface RegionFormData {
  regionCode?: string
  regionName?: string
  regionDescription?: string
}

interface RegionFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type RegionFormField = "regionCode" | "regionName" | "regionDescription"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
const TEXTAREA_CLASS = "min-h-[96px] border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 resize-none"

export default function RegionAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: RegionFormModalProps) {
  const tenantCode = useGetTenantCode()
  const schema = useMemo(
    () => createRegionSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.regionCode) return
    handleDeleteItem(deleteValue.regionCode)
  }, [deleteValue])

  const handleDeleteItem = async (regionCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          region: [{ regionCode }],
        },
      }
      // postRegion(postData)

    } catch (error) {
      console.error("Error deleting region:", error)
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
  } = useForm<RegionFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      regionCode: "",
      regionName: "",
      regionDescription: "",
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      setValue("regionCode", editData.regionCode || "")
      setValue("regionName", editData.regionName || "")
      setValue("regionDescription", editData.regionDescription || "")
    } else if (open && !isEditMode) {
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  const { post: postRegion, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, RegionFormField> = {
          regionCode: "regionCode",
          regionName: "regionName",
          regionDescription: "regionDescription",
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

      toast.success("Region submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Region submission failed!")
      console.error("POST error:", error)
    },
  })

  const handleFormSubmit = async (data: RegionFormData) => {
    try {
      clearErrors()
      const payloadRegion = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }
      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "regionValidator",
        data: {
          region: [payloadRegion],
        },
      }
      postRegion(postData)
    } catch (error) {
      console.error("Error processing region:", error)
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
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<RegionFormData>)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Globe className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit Region" : "Add New Region"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update region information." : "Create a new region entry."}
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
                    <Label htmlFor="regionCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Region Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="regionCode"
                      {...register("regionCode")}
                      placeholder="Enter region code (e.g., NE)"
                      className={`${INPUT_CLASS} ${errors.regionCode?.message ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.regionCode?.message && <p className="text-xs text-red-500">{errors.regionCode.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regionName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Region Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="regionName"
                      {...register("regionName")}
                      placeholder="Enter region name (e.g., North-Eastern India)"
                      className={`${INPUT_CLASS} ${errors.regionName?.message ? "border-red-500" : ""}`}
                    />
                    {errors.regionName?.message && <p className="text-xs text-red-500">{errors.regionName.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regionDescription" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Description
                  </Label>
                  <Textarea
                    id="regionDescription"
                    {...register("regionDescription")}
                    placeholder="Enter region description"
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
