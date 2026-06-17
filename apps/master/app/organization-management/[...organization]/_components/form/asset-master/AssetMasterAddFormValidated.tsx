"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Package, X } from "lucide-react"
import { useEffect, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import SingleSelectField from "@/components/fields/single-select-field"
import { createAssetMasterSchema } from "./asset-master-form-schema"

interface AssetMasterFormData {
  assetCode?: string
  assetName?: string
  assetType?: string
}

interface AssetMasterFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  assetTypes: string[]
  existingAssetCodes: string[]
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type AssetMasterFormField = "assetCode" | "assetName" | "assetType"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"

export default function AssetMasterAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  assetTypes,
  existingAssetCodes,
  editData,
  isEditMode,
  deleteValue,
}: AssetMasterFormModalProps) {
  const tenantCode = useGetTenantCode()
  const assetTypeValues = Array.isArray(assetTypes) ? assetTypes : []

  const schema = useMemo(
    () => createAssetMasterSchema(existingAssetCodes, isEditMode || false, editData),
    [editData, existingAssetCodes, isEditMode]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
  } = useForm<AssetMasterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      assetCode: "",
      assetName: "",
      assetType: "",
    }
  })
  const watchedAssetType = watch("assetType")
  const assetTypeOptions = useMemo(
    () =>
      assetTypeValues.map((type: string) => ({
        value: type,
        label: type,
      })),
    [assetTypeValues]
  )

  const { post: postAssetMaster, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, AssetMasterFormField> = {
          assetCode: "assetCode",
          assetName: "assetName",
          assetType: "assetType",
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

      toast.success("Asset submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      console.error("Error submitting asset:", error)
      toast.error("Failed to submit asset. Please try again.")
    },
  })

  const handleDeleteItem = async (assetCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          assetMaster: {
            assets: [{ assetCode }],
          },
        },
      }
      postAssetMaster(postData)
    } catch (error) {
      console.error("Error deleting asset:", error)
      toast.error("Failed to delete asset. Please try again.")
    }
  }

  const handleFormSubmit: SubmitHandler<AssetMasterFormData> = async (data) => {
    try {
      clearErrors()

      const payloadAsset = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
        assetType: data.assetType || "",
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "assetValidator",
        data: {
          assetMaster: {
            assets: [payloadAsset],
          },
        },
      }
      postAssetMaster(postData)
    } catch (error) {
      console.error("Error processing asset:", error)
      toast.error("Failed to process asset. Please try again.")
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
      setValue("assetCode", editData.assetCode || "")
      setValue("assetName", editData.assetName || "")
      setValue("assetType", editData.assetType || "")
    } else if (open && !isEditMode) {
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  useEffect(() => {
    if (!deleteValue?.assetCode) return
    // handleDeleteItem(deleteValue.assetCode)
  }, [deleteValue])

  return (
    open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full h-full flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {isEditMode ? "Edit Asset" : "Add New Asset"}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isEditMode ? "Update asset information." : "Create a new asset entry."}
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
                    <Label htmlFor="assetCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Asset Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="assetCode"
                      placeholder="Enter asset code"
                      {...register("assetCode")}
                      className={`${INPUT_CLASS} ${errors.assetCode ? "border-red-500" : ""}`}
                      disabled={isEditMode}
                    />
                    {errors.assetCode && (
                      <p className="text-xs text-red-500">{errors.assetCode.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Asset Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="assetName"
                      placeholder="Enter asset name"
                      {...register("assetName")}
                      className={`${INPUT_CLASS} ${errors.assetName ? "border-red-500" : ""}`}
                    />
                    {errors.assetName && (
                      <p className="text-xs text-red-500">{errors.assetName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <SingleSelectField
                    id="assetType"
                    label="Asset Type *"
                    placeholder="Select asset type"
                    value={watchedAssetType || ""}
                    onChange={(value) => setValue("assetType", value, { shouldValidate: true })}
                    options={assetTypeOptions}
                    errorMessage={typeof errors.assetType?.message === "string" ? errors.assetType.message : undefined}
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
