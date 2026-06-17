"use client"

import { useEffect, useMemo, useState } from "react"
import { gql, useQuery } from "@apollo/client"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { X, FileText } from "lucide-react"
import { SingleSelectField } from "@/components/fields/single-select-field"
import DocumentUploadField from "@/components/fields/document-upload-field"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_UPLOADED_DOCUMENT,
  createUploadedDocumentItemSchema,
  normalizeUploadedDocumentsConfig,
  type UploadedDocumentsConfig,
  type UploadedDocumentCategoryFieldKey,
  type UploadedDocumentItem,
  type UploadedDocumentRootFieldKey,
  type UploadedDocumentTypeFieldKey,
} from "../../schemas/uploaded-documents-form-schema"

const FETCH_ORGANIZATION_DOCUMENT_MASTER_QUERY = gql`
  query FetchOrganizationDocumentMaster($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      documentMaster {
        documentType
        documentCategory {
          documentCategoryCode
          documentCategoryName
          documentType
          status
        }
      }
    }
  }
`

interface UploadedDocumentsFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: UploadedDocumentItem | null
  onSubmit: (values: UploadedDocumentItem[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  uploadedDocuments: UploadedDocumentItem[]
  editIndex: number | null
  refetchUploadedDocuments?: () => Promise<void> | void
  isViewMode?: boolean
  employeeID?: string
  uploadDocument: (file: File, fileName?: string) => Promise<any>
}

export function UploadedDocumentsFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  uploadedDocuments,
  editIndex,
  refetchUploadedDocuments,
  isViewMode = false,
  employeeID,
  uploadDocument: _uploadDocument,
}: UploadedDocumentsFormPopupProps) {
  const [form, setForm] = useState<UploadedDocumentItem>({ ...EMPTY_UPLOADED_DOCUMENT })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingUploadedDocuments, setPendingUploadedDocuments] = useState<UploadedDocumentItem[] | null>(null)
  const localTenantCode = useGetTenantCode()
  const effectiveTenantCode = tenantCode || localTenantCode
  const auditEntityId = String(employeeRecordId)
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const uploadedDocumentsConfig = useMemo(
    () =>
      normalizeUploadedDocumentsConfig(
        formStructure?.uploadedDocuments as UploadedDocumentsConfig | undefined
      ),
    [formStructure]
  )
  const uploadedDocumentItemSchema = useMemo(
    () => createUploadedDocumentItemSchema(uploadedDocumentsConfig),
    [uploadedDocumentsConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const root = uploadedDocumentsConfig.fields
    const category = uploadedDocumentsConfig.documentCategory.fields
    const type = uploadedDocumentsConfig.documentType.fields

    return (fieldPath: string): boolean => {
      switch (fieldPath) {
        case "documentCategory.documentCategoryCode":
          return Boolean(category.documentCategoryCode?.required)
        case "documentCategory.documentCategoryTitle":
          return Boolean(category.documentCategoryTitle?.required)
        case "documentType.documentTypeCode":
          return Boolean(type.documentTypeCode?.required)
        case "documentType.documentTypeTitle":
          return Boolean(type.documentTypeTitle?.required)
        case "documentPath":
          return Boolean(root.documentPath?.required)
        case "identificationNumber":
          return root.identificationNumber?.required ?? true
        default:
          return false
      }
    }
  }, [uploadedDocumentsConfig])
  const isVisible = useMemo(() => {
    const root = uploadedDocumentsConfig.fields
    const category = uploadedDocumentsConfig.documentCategory.fields
    const type = uploadedDocumentsConfig.documentType.fields
    return (fieldPath: string): boolean => {
      switch (fieldPath) {
        case "documentCategory.documentCategoryCode":
          return category.documentCategoryCode?.visible ?? true
        case "documentCategory.documentCategoryTitle":
          return category.documentCategoryTitle?.visible ?? true
        case "documentType.documentTypeCode":
          return type.documentTypeCode?.visible ?? true
        case "documentType.documentTypeTitle":
          return type.documentTypeTitle?.visible ?? true
        case "documentPath":
          return root.documentPath?.visible ?? true
        case "identificationNumber":
          return root.identificationNumber?.visible ?? true
        default:
          return true
      }
    }
  }, [uploadedDocumentsConfig])
  const getRootLabel = useMemo(() => {
    const root = uploadedDocumentsConfig.fields
    return (field: UploadedDocumentRootFieldKey, fallback: string): string => root[field]?.label || fallback
  }, [uploadedDocumentsConfig])
  const getCategoryLabel = useMemo(() => {
    const fields = uploadedDocumentsConfig.documentCategory.fields
    return (field: UploadedDocumentCategoryFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [uploadedDocumentsConfig])
  const getTypeLabel = useMemo(() => {
    const fields = uploadedDocumentsConfig.documentType.fields
    return (field: UploadedDocumentTypeFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [uploadedDocumentsConfig])

  const { post: postUploadedDocuments, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const nextErrors: Record<string, string> = {}
        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
            if (typeof message !== "string" || !message.trim()) return
            if (fieldName.includes("documentCategory.documentCategoryCode")) {
              nextErrors["documentCategory.documentCategoryCode"] = message
            } else if (fieldName.includes("documentType.documentTypeCode")) {
              nextErrors["documentType.documentTypeCode"] = message
            } else if (fieldName.includes("identificationNumber")) {
              nextErrors.identificationNumber = message
            } else if (fieldName.includes("documentPath")) {
              nextErrors.documentPath = message
            }
          })
        }
        setErrors(nextErrors)
        return
      }

      toast.success("Uploaded documents saved successfully!")
      if (pendingUploadedDocuments) {
        onSubmit(pendingUploadedDocuments)
      }
      setPendingUploadedDocuments(null)
      await refetchUploadedDocuments?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving uploaded documents:", error)
    },
  })

  const { data: organizationResponse } = useQuery(FETCH_ORGANIZATION_DOCUMENT_MASTER_QUERY, {
    variables: {
      criteriaRequests: [{ field: "tenantCode", operator: "eq", value: effectiveTenantCode }],
      collection: "organization",
    },
    skip: !effectiveTenantCode,
    client,
  })
  const documentCategories = useMemo(() => {
    const organizations = organizationResponse?.fetchOrganization
    const firstOrganization = Array.isArray(organizations) && organizations.length > 0 ? organizations[0] : null
    const firstMaster = firstOrganization?.documentMaster || null
    return Array.isArray(firstMaster?.documentCategory) ? firstMaster.documentCategory : []
  }, [organizationResponse])

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_UPLOADED_DOCUMENT })
      setErrors({})
      setPendingUploadedDocuments(null)
    }
  }, [open, initialValue])

  const categoryOptions = useMemo(
    () =>
      documentCategories.map((o: any) => ({
        value: o.documentCategoryCode || "",
        label: o.documentCategoryName || "",
        tooltip: o.documentCategoryName || "",
      })),
    [documentCategories]
  )

  const documentTypeOptions = useMemo(() => {
    if (!form.documentCategory?.documentCategoryCode) return []
    const selectedCategory = documentCategories.find(
      (cat: any) => cat.documentCategoryCode === form.documentCategory?.documentCategoryCode
    )
    return (selectedCategory?.documentType || []).map((docType: string) => ({
      value: docType,
      label: docType,
      tooltip: docType,
    }))
  }, [documentCategories, form.documentCategory?.documentCategoryCode])

  const handleSubmit = () => {
    if (shouldShowConfigLoader || isViewMode || postLoading) return
    const result = uploadedDocumentItemSchema.safeParse(form)
    if (!result.success) {
      const err: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".")
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})

    const payloadUploadedDocument = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_UPLOADED_DOCUMENT,
      ...result.data,
    } as UploadedDocumentItem

    const parseId = (payloadUploadedDocument as Record<string, any>)?.parseID
    const next = parseId
      ? uploadedDocuments.map((row) =>
          (row as Record<string, any>)?.parseID === parseId ? payloadUploadedDocument : row
        )
      : editIndex !== null
        ? uploadedDocuments.map((row, index) => (index === editIndex ? payloadUploadedDocument : row))
        : [...uploadedDocuments, payloadUploadedDocument]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetUploadedDocumentsTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: effectiveTenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      audit: auditPayload,
      data: {
        uploadedDocuments: [payloadUploadedDocument],
        ...(shouldSetUploadedDocumentsTab ? { uploadedDocumentstab: true } : {}),
      },
    }

    setPendingUploadedDocuments(next)
    postUploadedDocuments(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {initialValue !== null ? "Edit Uploaded Document" : "Add Uploaded Document"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Enter document details and upload file.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
            {shouldShowConfigLoader ? (
              <div className="py-8 text-center text-sm text-gray-600">
                Loading form configuration...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isVisible("documentCategory.documentCategoryCode") && (
              <SingleSelectField
                id="uploaded-doc-category"
                label={`${getCategoryLabel("documentCategoryCode", "Document Category")}${
                  isRequired("documentCategory.documentCategoryCode") ? " *" : ""
                }`}
                placeholder="Search Document Category"
                disabled={isViewMode || postLoading}
                value={form.documentCategory?.documentCategoryCode || ""}
                onChange={(value) => {
                  const selected = documentCategories.find(
                    (cat: any) => cat.documentCategoryCode === value
                  )
                  setForm((prev) => ({
                    ...prev,
                    documentCategory: {
                      documentCategoryCode: value,
                      documentCategoryTitle: selected?.documentCategoryName || "",
                    },
                    documentType: {
                      documentTypeCode: "",
                      documentTypeTitle: "",
                    },
                  }))
                  if (errors["documentCategory.documentCategoryCode"]) {
                    setErrors((prev) => ({ ...prev, "documentCategory.documentCategoryCode": "" }))
                  }
                }}
                options={categoryOptions}
                showOnlyValueInTrigger
                allowOnlyProvidedOptions
              />
              )}
              {errors["documentCategory.documentCategoryCode"] && (
                <p className="text-red-500 text-xs mt-0.5">{errors["documentCategory.documentCategoryCode"]}</p>
              )}

              {isVisible("documentType.documentTypeCode") && (
              <SingleSelectField
                id="uploaded-doc-type"
                label={`${getTypeLabel("documentTypeCode", "Document Type")}${
                  isRequired("documentType.documentTypeCode") ? " *" : ""
                }`}
                placeholder={!form.documentCategory?.documentCategoryCode ? "Select Document Category first" : "Search Document Type"}
                disabled={isViewMode || postLoading || !form.documentCategory?.documentCategoryCode}
                value={form.documentType?.documentTypeCode || ""}
                onChange={(value) =>
                  {
                    setForm((prev) => ({
                      ...prev,
                      documentType: {
                        documentTypeCode: value,
                        documentTypeTitle: value,
                      },
                    }))
                    if (errors["documentType.documentTypeCode"]) {
                      setErrors((prev) => ({ ...prev, "documentType.documentTypeCode": "" }))
                    }
                  }
                }
                options={documentTypeOptions}
                showOnlyValueInTrigger
                allowOnlyProvidedOptions
              />
              )}
              {errors["documentType.documentTypeCode"] && (
                <p className="text-red-500 text-xs mt-0.5">{errors["documentType.documentTypeCode"]}</p>
              )}

              {isVisible("identificationNumber") && (
              <div className="md:col-span-2">
                <Label className="text-xs font-medium text-gray-700">
                  {getRootLabel("identificationNumber", "Identification Number")}
                  {isRequired("identificationNumber") && <span className="text-red-500"> *</span>}
                </Label>
                <Input
                  value={form.identificationNumber || ""}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, identificationNumber: e.target.value }))
                    if (errors.identificationNumber) {
                      setErrors((prev) => ({ ...prev, identificationNumber: "" }))
                    }
                  }}
                  className="h-9 mt-1 border border-gray-300 rounded-md"
                  placeholder="Enter identification number"
                  disabled={isViewMode || postLoading}
                />
                {errors.identificationNumber && <p className="text-red-500 text-xs mt-0.5">{errors.identificationNumber}</p>}
              </div>
              )}

              {isVisible("documentPath") && (
              <div className="md:col-span-2">
                <DocumentUploadField
                  id="uploadedDocumentPath"
                  label={`${getRootLabel("documentPath", "Upload Document")}${isRequired("documentPath") ? " *" : ""}`}
                  isViewMode={isViewMode || postLoading}
                  employeeID={employeeID}
                  value={{ documentPath: form.documentPath || "", documentType: "" }}
                  onChange={(doc) => {
                    setForm((prev) => ({ ...prev, documentPath: doc.documentPath || "" }))
                    if (errors.documentPath) {
                      setErrors((prev) => ({ ...prev, documentPath: "" }))
                    }
                  }}
                  uploadPrefix="uploadedDocument"
                  uploadButtonText={`Upload ${form.documentType?.documentTypeTitle || "Document"}`}
                  successTitle={form.documentType?.documentTypeTitle || "Document"}
                  successSubtitle="Document uploaded successfully"
                  wrapperClassName="space-y-2"
                  labelClassName="text-xs font-medium text-gray-700"
                />
                {errors.documentPath && <p className="text-red-500 text-xs mt-0.5">{errors.documentPath}</p>}
              </div>
              )}
            </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubmit}
              disabled={isViewMode || shouldShowConfigLoader || postLoading}
            >
              {initialValue !== null ? "Save" : "Add Document"}
            </Button>
          </div>
      </div>
    </div>
  )
}
