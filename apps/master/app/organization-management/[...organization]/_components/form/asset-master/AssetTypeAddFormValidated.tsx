"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Layers, X } from "lucide-react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"
import { createAssetTypeSchema } from "./asset-type-form-schema"

interface AssetTypeFormData {
  assetType: string
}

interface AssetTypeAddFormValidatedProps {
  open: boolean
  setOpen: (open: boolean) => void
  organizationId?: string
  assetTypes: string[]
  editValue?: string | null
  deleteValue?: string | null
  onSuccess?: () => void
}

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"

export default function AssetTypeAddFormValidated({
  open,
  setOpen,
  organizationId,
  assetTypes,
  editValue = null,
  deleteValue = null,
  onSuccess,
}: AssetTypeAddFormValidatedProps) {
  const tenantCode = useGetTenantCode()
  const isEditMode = Boolean(editValue)
  const schema = useMemo(
    () => createAssetTypeSchema(assetTypes, isEditMode, editValue || undefined),
    [assetTypes, editValue, isEditMode]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm<AssetTypeFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      assetType: "",
    },
  })

  const { post: postAssetType, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          if (fieldName.includes("assetType")) {
            setError("assetType", { type: "server", message })
          }
        })
        return
      }

      toast.success(`Asset type ${isEditMode ? "updated" : "saved"} successfully!`)
      onSuccess?.()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Asset type submission failed!")
      console.error("POST error:", error)
    },
  })

  useEffect(() => {
    if (open && editValue) {
      setValue("assetType", editValue)
      return
    }
    if (open) {
      reset()
    }
  }, [editValue, open, reset, setValue])

  useEffect(() => {
    if (!deleteValue) return

    const nextAssetTypes = assetTypes.filter((type) => type !== deleteValue)
    // postAssetType({
    //   tenant: tenantCode,
    //   action: "update",
    //   collectionName: "organization",
    //   event: "validate",
    //   id: organizationId,
    //   ruleId: "",
    //   data: {
    //     assetMaster: {
    //       assetTypes: nextAssetTypes,
    //     },
    //   },
    // })
  }, [assetTypes, deleteValue, organizationId, postAssetType, tenantCode])

  const handleFormSubmit = async (data: AssetTypeFormData) => {
    try {
      clearErrors()
      const nextAssetTypes = isEditMode
        ? assetTypes.map((type) => (type === editValue ? data.assetType.trim() : type))
        : [...assetTypes, data.assetType.trim()]

      postAssetType({
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          assetMaster: {
            assetTypes: nextAssetTypes,
          },
        },
      })
    } catch (error) {
      console.error("Error processing asset type:", error)
    }
  }

  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gray-100 p-1.5">
                <Layers className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {isEditMode ? "Edit Asset Type" : "Add Asset Type"}
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {isEditMode ? "Update the asset type." : "Create a new asset type."}
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

          <div className="px-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="assetType" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                Asset Type <span className="text-red-500">*</span>
              </Label>
              <Input
                id="assetType"
                {...register("assetType")}
                placeholder="Enter asset type"
                className={errors.assetType?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
              />
              {errors.assetType?.message && <p className="text-xs text-red-500">{errors.assetType.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
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
              type="submit"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={isSubmitting || postLoading}
            >
              {postLoading ? "Saving..." : isEditMode ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
