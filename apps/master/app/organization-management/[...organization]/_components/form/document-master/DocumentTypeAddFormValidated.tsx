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
import { createDocumentTypeSchema } from "./document-type-form-schema"

interface DocumentTypeFormData {
  documentType: string
}

interface DocumentTypeAddFormValidatedProps {
  open: boolean
  setOpen: (open: boolean) => void
  organizationId?: string
  documentTypes: string[]
  editValue?: string | null
  deleteValue?: string | null
  onSuccess?: () => void
}

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"

export default function DocumentTypeAddFormValidated({
  open,
  setOpen,
  organizationId,
  documentTypes,
  editValue = null,
  deleteValue = null,
  onSuccess,
}: DocumentTypeAddFormValidatedProps) {
  const tenantCode = useGetTenantCode()
  const isEditMode = Boolean(editValue)
  const schema = useMemo(
    () => createDocumentTypeSchema(documentTypes, isEditMode, editValue || undefined),
    [documentTypes, editValue, isEditMode]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm<DocumentTypeFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentType: "",
    },
  })

  const { post: postDocumentType, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          if (fieldName.includes("documentType")) {
            setError("documentType", { type: "server", message })
          }
        })
        return
      }

      toast.success(`Document type ${isEditMode ? "updated" : "saved"} successfully!`)
      onSuccess?.()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Document type submission failed!")
      console.error("POST error:", error)
    },
  })

  useEffect(() => {
    if (open && editValue) {
      setValue("documentType", editValue)
      return
    }
    if (open) {
      reset()
    }
  }, [editValue, open, reset, setValue])

  useEffect(() => {
    if (!deleteValue) return

    const nextDocumentTypes = documentTypes.filter((type) => type !== deleteValue)
    // postDocumentType({
    //   tenant: tenantCode,
    //   action: "update",
    //   collectionName: "organization",
    //   event: "validate",
    //   id: organizationId,
    //   ruleId: "",
    //   data: {
    //     documentMaster: {
    //       documentType: nextDocumentTypes,
    //     },
    //   },
    // })
  }, [deleteValue, documentTypes, organizationId, postDocumentType, tenantCode])

  const handleFormSubmit = async (data: DocumentTypeFormData) => {
    try {
      clearErrors()
      const nextDocumentTypes = isEditMode
        ? documentTypes.map((type) => (type === editValue ? data.documentType.trim() : type))
        : [...documentTypes, data.documentType.trim()]

      postDocumentType({
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          documentMaster: {
            documentType: nextDocumentTypes,
          },
        },
      })
    } catch (error) {
      console.error("Error processing document type:", error)
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
                  {isEditMode ? "Edit Document Type" : "Add Document Type"}
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {isEditMode ? "Update the document type." : "Create a new document type."}
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
              <Label htmlFor="documentType" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                Document Type <span className="text-red-500">*</span>
              </Label>
              <Input
                id="documentType"
                {...register("documentType")}
                placeholder="Enter document type"
                className={errors.documentType?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
              />
              {errors.documentType?.message && (
                <p className="text-xs text-red-500">{errors.documentType.message}</p>
              )}
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
