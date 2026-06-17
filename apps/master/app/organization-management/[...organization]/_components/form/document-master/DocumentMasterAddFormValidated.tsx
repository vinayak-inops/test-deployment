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
import { createDocumentMasterSchema } from "./document-master-form-schema"

interface DocumentMasterFormData {
  documentCategoryCode?: string
  documentCategoryName?: string
  documentType?: string[]
}

interface DocumentMasterFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
  documentCategories?: Array<{
    parseID?: string
    documentCategoryCode?: string
    documentCategoryName?: string
    documentType?: string[]
    status?: string
  }>
  documentTypes?: string[]
}

type DocumentMasterFormField = "documentCategoryCode" | "documentCategoryName" | "documentType"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"

export default function DocumentMasterAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
  documentCategories = [],
  documentTypes = [],
}: DocumentMasterFormModalProps) {
  const tenantCode = useGetTenantCode()

  const schema = useMemo(
    () => createDocumentMasterSchema(documentCategories, isEditMode || false, editData),
    [documentCategories, isEditMode, editData]
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
  } = useForm<DocumentMasterFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentCategoryCode: "",
      documentCategoryName: "",
      documentType: [],
    }
  })

  const watchedValues = watch()

  const { post: postDocumentMaster, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, DocumentMasterFormField> = {
          documentCategoryCode: "documentCategoryCode",
          documentCategoryName: "documentCategoryName",
          documentType: "documentType",
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

      toast.success("Document master submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setOpen(false)
    },
    onError: (error) => {
      console.error("Error submitting document category:", error)
      toast.error("Failed to submit document category. Please try again.")
    },
  })

  // Handle form submission
  const handleFormSubmit: SubmitHandler<DocumentMasterFormData> = async (data) => {
    try {
      clearErrors()
      const payloadCategory = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
        documentType: Array.isArray(data.documentType) ? data.documentType : [],
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "documentValidator",
        data: {
          documentMaster: {
            documentCategory: [payloadCategory],
          },
        },
      }
      postDocumentMaster(postData)
    } catch (error) {
      console.error("Error processing document category:", error)
      toast.error("Failed to process document category. Please try again.")
    }
  }

  // Handle delete item
  const handleDeleteItem = async (documentCategoryCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          documentMaster: {
            documentCategory: [{ documentCategoryCode }],
          },
        },
      }
      // postDocumentMaster(postData)
    } catch (error) {
      console.error("Error deleting document category:", error)
      toast.error("Failed to delete document category. Please try again.")
    }
  }

  // Handle cancel
  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  useEffect(() => {
    if (isEditMode && editData) {
      setValue("documentCategoryCode", editData.documentCategoryCode || "")
      setValue("documentCategoryName", editData.documentCategoryName || "")
      setValue("documentType", Array.isArray(editData.documentType) ? editData.documentType : [])
    } else if (open && !isEditMode) {
      reset()
    }
  }, [isEditMode, editData, setValue, reset, open])

  useEffect(() => {
    if (!deleteValue?.documentCategoryCode) return
    void handleDeleteItem(deleteValue.documentCategoryCode)
  }, [deleteValue])

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full h-full flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {isEditMode ? "Edit Document Category" : "Add New Document Category"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {isEditMode ? "Update document category information." : "Create a new document category entry."}
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
                  <Label htmlFor="documentCategoryCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Document Category Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="documentCategoryCode"
                    placeholder="Enter document category code"
                    {...register("documentCategoryCode")}
                    className={`${INPUT_CLASS} ${errors.documentCategoryCode ? "border-red-500" : ""}`}
                    disabled={isEditMode}
                  />
                  {errors.documentCategoryCode && (
                    <p className="text-xs text-red-500">{errors.documentCategoryCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentCategoryName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Document Category Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="documentCategoryName"
                    placeholder="Enter document category name"
                    {...register("documentCategoryName")}
                    className={`${INPUT_CLASS} ${errors.documentCategoryName ? "border-red-500" : ""}`}
                  />
                  {errors.documentCategoryName && (
                    <p className="text-xs text-red-500">{errors.documentCategoryName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentType" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Document Types
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-200 rounded-md p-3 bg-gray-50">
                  {documentTypes.map((type: string) => (
                    <label key={type} htmlFor={type} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        id={type}
                        value={type}
                        checked={watchedValues.documentType?.includes(type) || false}
                        onChange={(e) => {
                          const currentTypes = watchedValues.documentType || []
                          if (e.target.checked) {
                            setValue("documentType", [...currentTypes, type])
                          } else {
                            setValue("documentType", currentTypes.filter((currentType) => currentType !== type))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
                {errors.documentType && (
                  <p className="text-xs text-red-500">{errors.documentType.message as string}</p>
                )}
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
              disabled={postLoading || isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={postLoading || isSubmitting}
            >
              {postLoading ? "Saving..." : isEditMode ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) : null
}
