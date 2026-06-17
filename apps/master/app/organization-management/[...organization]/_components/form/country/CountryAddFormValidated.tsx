"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Globe, X } from "lucide-react"
import { useEffect, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"
import { createCountrySchema } from "./country-form-schema"

interface CountryFormData {
  countryCode?: string
  countryName?: string
}

interface CountryFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type CountryFormField = "countryCode" | "countryName"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"

export default function CountryAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: CountryFormModalProps) {
  const tenantCode = useGetTenantCode()
  const schema = useMemo(
    () => createCountrySchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  useEffect(() => {
    if (!deleteValue?.countryCode) return
    handleDeleteItem(deleteValue.countryCode)
  }, [deleteValue])

  const handleDeleteItem = async (countryCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          country: [{ countryCode }],
        },
      }
      // postCountry(postData)
    } catch (error) {
      console.error("Error deleting country:", error)
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
  } = useForm<CountryFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      countryCode: "",
      countryName: "",
    },
  })

  const { post: postCountry, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, CountryFormField> = {
          countryCode: "countryCode",
          countryName: "countryName",
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

      toast.success("Country submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Country submission failed!")
      console.error("POST error:", error)
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      setValue("countryCode", editData.countryCode || "")
      setValue("countryName", editData.countryName || "")
    } else if (open && !isEditMode) {
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  const handleFormSubmit = async (data: CountryFormData) => {
    try {
      clearErrors()
      const payloadCountry = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "countryValidator",
        data: {
          country: [payloadCountry],
        },
      }
      postCountry(postData)
    
    } catch (error) {
      console.error("Error processing country:", error)
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
          <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Globe className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit Country" : "Add New Country"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update country information." : "Create a new country entry."}
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
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Basic Information</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Enter the core country details.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="countryCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Country Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="countryCode"
                      {...register("countryCode")}
                      placeholder="Enter country code (e.g., IN)"
                      className={`${INPUT_CLASS} ${errors.countryCode?.message ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.countryCode?.message && <p className="text-xs text-red-500">{errors.countryCode.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="countryName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Country Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="countryName"
                      {...register("countryName")}
                      placeholder="Enter country name (e.g., India)"
                      className={`${INPUT_CLASS} ${errors.countryName?.message ? "border-red-500" : ""}`}
                    />
                    {errors.countryName?.message && <p className="text-xs text-red-500">{errors.countryName.message}</p>}
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
