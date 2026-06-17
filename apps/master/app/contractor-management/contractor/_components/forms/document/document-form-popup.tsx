"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { FileText, X } from "lucide-react"
import { gql, useQuery } from "@apollo/client"
import { SingleSelectField } from "@/components/fields/single-select-field"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import DocumentUploadField from "../../../../../../components/fields/document-upload-field"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import {
  EMPTY_DOCUMENT,
  createDocumentSchema,
  normalizeDocumentConfig,
  type DocumentFieldsConfig,
  type DocumentTabConfig,
  type Document,
} from "../../schemas/document-form-schema"
import { useDynamicSchemaConfig } from "../../hooks/useDynamicSchemaConfig"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

interface DocumentFormPopupProps {
  open: boolean
  onClose: () => void
  initialDocument: Document | null
  onSubmit: (docs: Document[]) => void
  onSaved?: () => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  documents: Document[]
  editIndex: number | null
  refetchDocuments?: () => Promise<void> | void
  disabled?: boolean
}
type DocumentFormField =
  | "identificationNumber"
  | "documentPath"
  | "documentCategory.documentCategoryCode"
  | "documentCategory.documentCategoryTitle"
  | "documentType.documentTypeCode"
  | "documentType.documentTypeTitle"

function toPayloadDocument(doc: Document) {
  return {
    parseID: doc.parseID || undefined,
    documentCategory: {
      documentCategoryCode: doc.documentCategory?.documentCategoryCode || "",
      documentCategoryTitle: doc.documentCategory?.documentCategoryTitle || "",
    },
    documentType: {
      documentTypeCode: doc.documentType?.documentTypeCode || "",
      documentTypeTitle: doc.documentType?.documentTypeTitle || "",
    },
    documentPath: doc.documentPath || "",
    identificationNumber: doc.identificationNumber || "",
  }
}

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

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

export function DocumentFormPopup({
  open,
  onClose,
  initialDocument,
  onSubmit,
  onSaved,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  documents,
  editIndex,
  refetchDocuments,
  disabled = false,
}: DocumentFormPopupProps) {
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contractor_form_strcture",
  })
  const [organizationData, setOrganizationData] = useState<any>({})

  const documentTabConfig = useMemo(
    () =>
      normalizeDocumentConfig(
        formStructure?.document as DocumentFieldsConfig | DocumentTabConfig | undefined
      ),
    [formStructure]
  )

  const documentSchema = useMemo(
    () => createDocumentSchema(documentTabConfig),
    [documentTabConfig]
  )

  const { isRequired, isVisible, getLabel } = useDynamicSchemaConfig({
    schema: documentSchema,
    fieldConfig: documentTabConfig,
    emptyValues: EMPTY_DOCUMENT,
  })
  const showDocumentClassification =
    isVisible("documentCategoryCode") ||
    isVisible("documentCategoryTitle") ||
    isVisible("documentTypeCode") ||
    isVisible("documentTypeTitle")
  const showIdentificationDetails = isVisible("identificationNumber")
  const showDocumentUpload = isVisible("documentPath")
  const [formDoc, setFormDoc] = useState<Document>({ ...EMPTY_DOCUMENT })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingDocuments, setPendingDocuments] = useState<Document[] | null>(null)

  useQuery(FETCH_ORGANIZATION_DOCUMENT_MASTER_QUERY, {
    variables: {
      criteriaRequests: tenantCode ? [{ field: "tenantCode", operator: "eq", value: tenantCode }] : [],
      collection: "organization",
    },
    skip: !tenantCode,
    client,
    onCompleted: (response) => {
      const data = response?.fetchOrganization
      if (Array.isArray(data) && data.length > 0) {
        setOrganizationData(data[0])
        return
      }
      setOrganizationData({})
    },
    onError: () => setOrganizationData({}),
  })

  useEffect(() => {
    if (open) {
      setFormDoc(initialDocument ? { ...initialDocument } : { ...EMPTY_DOCUMENT })
      setErrors({})
      setPendingDocuments(null)
    }
  }, [open, initialDocument])

  const { post: postContractor, loading: postLoading } = usePostRequest<any>({
    url: contractorCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, DocumentFormField> = {
          "documentCategory.documentCategoryCode": "documentCategory.documentCategoryCode",
          "documentCategory.documentCategoryTitle": "documentCategory.documentCategoryTitle",
          "documentType.documentTypeCode": "documentType.documentTypeCode",
          "documentType.documentTypeTitle": "documentType.documentTypeTitle",
          identificationNumber: "identificationNumber",
          documentPath: "documentPath",
        }
        const normalizeServerField = (fieldName: string): DocumentFormField | null => {
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("uploadedDocuments.")) {
            const stripped = fieldName.replace(/^uploadedDocuments\.\d+\./, "")
            return fieldMap[stripped] ?? null
          }
          return null
        }
        const nextErrors: Record<string, string> = {}
        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
            if (typeof message !== "string" || !message.trim()) return
            const normalizedField = normalizeServerField(fieldName)
            if (!normalizedField) return
            nextErrors[normalizedField] = message
          })
        }
        setErrors(nextErrors)
        return
      }

      toast.success("Contractor data saved successfully!")
      if (pendingDocuments) onSubmit(pendingDocuments)
      setPendingDocuments(null)
      await refetchDocuments?.()
      onSaved?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving contractor data:", error)
    },
  })

  const handleCategoryChange = (categoryCode: string) => {
    const selectedCategory = organizationData?.documentMaster?.documentCategory?.find(
      (cat: any) => cat.documentCategoryCode === categoryCode
    )
    if (selectedCategory) {
      setFormDoc((prev) => ({
        ...prev,
        documentCategory: {
          documentCategoryCode: categoryCode,
          documentCategoryTitle: selectedCategory.documentCategoryName ?? "",
        },
        documentType: { documentTypeCode: "", documentTypeTitle: "" },
      }))
    }
  }

  const handleTypeChange = (documentType: string) => {
    setFormDoc((prev) => ({
      ...prev,
      documentType: {
        documentTypeCode: documentType,
        documentTypeTitle: documentType,
      },
    }))
  }

  const shouldShowConfigLoader = formStructureLoading || !formStructure

  const handleSubmit = () => {
    if (shouldShowConfigLoader || postLoading) return
    const result = documentSchema.safeParse(formDoc)
    if (!result.success) {
      const nextErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".")
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message
        }
      })
      setErrors(nextErrors)
      return
    }
    setErrors({})
    const payloadDoc: Document = {
      ...EMPTY_DOCUMENT,
      parseID: (initialDocument as Record<string, any> | null)?.parseID,
      ...result.data,
      documentCategory: {
        ...EMPTY_DOCUMENT.documentCategory,
        ...(result.data.documentCategory ?? {}),
      },
      documentType: {
        ...EMPTY_DOCUMENT.documentType,
        ...(result.data.documentType ?? {}),
      },
    }
    const payload = toPayloadDocument(payloadDoc) as Document
    const parseId = (payload as Record<string, any>)?.parseID
    const next =
      parseId
        ? documents.map((doc) => ((doc as Record<string, any>)?.parseID === parseId ? payload : doc))
        : editIndex !== null
          ? documents.map((doc, index) => (index === editIndex ? payload : doc))
          : [...documents, payload]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetDocumentTab = employeeSearchUrl === "draft/contractor/search"
    const postPayload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      event: "validate",
      ruleId: "",
      collectionName: "contractor",
      data: {
        uploadedDocuments: [payload],
        ...(shouldSetDocumentTab ? { documenttab: true } : {}),
      },
    }
    setPendingDocuments(next)
    postContractor?.(postPayload)
  }

  const handleClose = () => {
    setErrors({})
    setPendingDocuments(null)
    onClose()
  }

  const documentTypes = (() => {
    if (!formDoc.documentCategory?.documentCategoryCode) return []
    const selectedCategory = organizationData?.documentMaster?.documentCategory?.find(
      (cat: any) => cat.documentCategoryCode === formDoc.documentCategory?.documentCategoryCode
    )
    return selectedCategory?.documentType || []
  })()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialDocument !== null ? "Edit Document" : "Add Document"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Enter document category, type, and upload file.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {shouldShowConfigLoader ? (
            <div className="py-12 text-center text-sm text-gray-600">
              Loading form configuration...
            </div>
          ) : (
            <>
              {showDocumentClassification && (
              <div className="space-y-3">
                <SubFormTitle title="Document Classification" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isVisible("documentCategoryCode") && (
                  <SingleSelectField
                    id="popup-documentCategory"
                    label={`${getLabel("documentCategoryCode", "Document Category")}${isRequired("documentCategoryCode") ? " *" : ""}`}
                    placeholder="Search Document Category"
                    disabled={disabled}
                    value={formDoc.documentCategory?.documentCategoryCode || ""}
                    onChange={handleCategoryChange}
                    options={(organizationData?.documentMaster?.documentCategory ?? []).map((cat: any) => ({
                      value: cat.documentCategoryCode || "",
                      label: `${cat.documentCategoryCode || ""} - ${cat.documentCategoryName || ""}`,
                      tooltip: `${cat.documentCategoryCode || ""} - ${cat.documentCategoryName || ""}`,
                    }))}
                    showOnlyValueInTrigger
                    className="group"
                    allowOnlyProvidedOptions
                  />
                  )}
                  {isVisible("documentCategoryTitle") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("documentCategoryTitle", "Document Category Title")} {isRequired("documentCategoryTitle") && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="h-9 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600 flex items-center">
                      {formDoc.documentCategory?.documentCategoryTitle || "-"}
                    </div>
                  </div>
                  )}
                  {isVisible("documentTypeCode") && (
                  <SingleSelectField
                    id="popup-documentType"
                    label={`${getLabel("documentTypeCode", "Document Type")}${isRequired("documentTypeCode") ? " *" : ""}`}
                    placeholder={
                      !formDoc.documentCategory?.documentCategoryCode
                        ? "Select category first"
                        : "Search Document Type"
                    }
                    disabled={disabled || !formDoc.documentCategory?.documentCategoryCode}
                    value={formDoc.documentType?.documentTypeCode || ""}
                    onChange={handleTypeChange}
                    options={documentTypes.map((docType: string) => ({
                      value: docType,
                      label: docType,
                      tooltip: docType,
                    }))}
                    showOnlyValueInTrigger
                    className="group"
                    allowOnlyProvidedOptions
                  />
                  )}
                  {isVisible("documentTypeTitle") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("documentTypeTitle", "Document Type Title")} {isRequired("documentTypeTitle") && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="h-9 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-600 flex items-center">
                      {formDoc.documentType?.documentTypeTitle || "-"}
                    </div>
                  </div>
                  )}
                </div>
                {isVisible("documentCategoryCode") && errors["documentCategory.documentCategoryCode"] && <p className="text-red-500 text-xs">{errors["documentCategory.documentCategoryCode"]}</p>}
                {isVisible("documentCategoryTitle") && errors["documentCategory.documentCategoryTitle"] && <p className="text-red-500 text-xs">{errors["documentCategory.documentCategoryTitle"]}</p>}
                {isVisible("documentTypeCode") && errors["documentType.documentTypeCode"] && <p className="text-red-500 text-xs">{errors["documentType.documentTypeCode"]}</p>}
                {isVisible("documentTypeTitle") && errors["documentType.documentTypeTitle"] && <p className="text-red-500 text-xs">{errors["documentType.documentTypeTitle"]}</p>}
              </div>
              )}

              {showDocumentClassification && (showIdentificationDetails || showDocumentUpload) && <Separator />}

              {showIdentificationDetails && (
              <div className="space-y-3">
                <SubFormTitle title="Identification Details" />
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getLabel("identificationNumber", "Identification Number")} {isRequired("identificationNumber") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    value={formDoc.identificationNumber || ""}
                    onChange={(e) =>
                      setFormDoc((p) => ({ ...p, identificationNumber: e.target.value }))
                    }
                    className={INPUT_CLASS}
                    placeholder="Enter identification number"
                    disabled={disabled}
                  />
                  {errors.identificationNumber && <p className="text-red-500 text-xs">{errors.identificationNumber}</p>}
                </div>
              </div>
              )}

              {showDocumentUpload && (showDocumentClassification || showIdentificationDetails) && <Separator />}

              {showDocumentUpload && (
              <div className="space-y-3">
                <SubFormTitle title="Document Upload" />
                <DocumentUploadField
                  id="popup-document-file"
                  label={`${getLabel("documentPath", "Document Upload")}${isRequired("documentPath") ? " *" : ""}`}
                  isViewMode={disabled}
                  employeeID={formDoc.identificationNumber || "contractor"}
                  value={{
                    documentPath: formDoc.documentPath || "",
                    documentType: formDoc.documentType?.documentTypeCode || "",
                  }}
                  onChange={(doc) =>
                    setFormDoc((prev) => ({
                      ...prev,
                      documentPath: doc.documentPath || "",
                    }))
                  }
                  uploadPrefix={(formDoc.documentType?.documentTypeCode || "document").toLowerCase()}
                  uploadButtonText="Upload Document"
                  wrapperClassName="space-y-2"
                  labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                />
                {errors.documentPath && <p className="text-red-500 text-xs">{errors.documentPath}</p>}
              </div>
              )}
            </>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
            disabled={disabled || shouldShowConfigLoader || postLoading}
          >
            {initialDocument !== null ? "Save" : "Add Document"}
          </Button>
        </div>
      </div>
    </div>
  )
}
