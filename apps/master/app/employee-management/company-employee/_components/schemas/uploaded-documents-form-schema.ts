import { z } from "zod"

// Identification number: letters, numbers, underscore (_), hyphen (-) only
const isValidIdentificationNumber = (str: string) => /^[a-zA-Z0-9_-]+$/.test(str)

export type UploadedDocumentFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type UploadedDocumentRootFieldKey = "documentPath" | "identificationNumber"
export type UploadedDocumentCategoryFieldKey = "documentCategoryCode" | "documentCategoryTitle"
export type UploadedDocumentTypeFieldKey = "documentTypeCode" | "documentTypeTitle"

export type UploadedDocumentRootFieldsConfig = Partial<
  Record<UploadedDocumentRootFieldKey, UploadedDocumentFieldConfig>
>
export type UploadedDocumentCategoryFieldsConfig = Partial<
  Record<UploadedDocumentCategoryFieldKey, UploadedDocumentFieldConfig>
>
export type UploadedDocumentTypeFieldsConfig = Partial<
  Record<UploadedDocumentTypeFieldKey, UploadedDocumentFieldConfig>
>

export type UploadedDocumentsConfig = {
  tabRequired?: boolean
  fields?: UploadedDocumentRootFieldsConfig
  documentCategory?: { fields?: UploadedDocumentCategoryFieldsConfig }
  documentType?: { fields?: UploadedDocumentTypeFieldsConfig }
}

export function normalizeUploadedDocumentsConfig(raw: unknown): {
  tabRequired: boolean
  fields: UploadedDocumentRootFieldsConfig
  documentCategory: { fields: UploadedDocumentCategoryFieldsConfig }
  documentType: { fields: UploadedDocumentTypeFieldsConfig }
} {
  const asObject = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  const extractFields = <T extends Record<string, unknown>>(value: unknown): T => {
    const obj = asObject(value)
    if ("fields" in obj && obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
      return obj.fields as T
    }
    return obj as T
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
      documentCategory: { fields: {} },
      documentType: { fields: {} },
    }
  }

  const root = raw as UploadedDocumentsConfig
  const source = asObject((root as { fields?: unknown }).fields ?? root)
  const flatFields = extractFields<Record<string, unknown>>(source)
  const nestedCategory = extractFields<UploadedDocumentCategoryFieldsConfig>(source.documentCategory)
  const nestedType = extractFields<UploadedDocumentTypeFieldsConfig>(source.documentType)
  return {
    tabRequired: root.tabRequired ?? false,
    fields: {
      documentPath: flatFields.documentPath as UploadedDocumentFieldConfig | undefined,
      identificationNumber: flatFields.identificationNumber as UploadedDocumentFieldConfig | undefined,
    },
    documentCategory: {
      fields: {
        documentCategoryCode:
          nestedCategory.documentCategoryCode ??
          (flatFields.documentCategoryCode as UploadedDocumentFieldConfig | undefined),
        documentCategoryTitle:
          nestedCategory.documentCategoryTitle ??
          (flatFields.documentCategoryTitle as UploadedDocumentFieldConfig | undefined),
      },
    },
    documentType: {
      fields: {
        documentTypeCode:
          nestedType.documentTypeCode ??
          (flatFields.documentTypeCode as UploadedDocumentFieldConfig | undefined),
        documentTypeTitle:
          nestedType.documentTypeTitle ??
          (flatFields.documentTypeTitle as UploadedDocumentFieldConfig | undefined),
      },
    },
  }
}

export function createUploadedDocumentItemSchema(rawConfig?: UploadedDocumentsConfig) {
  const normalized = normalizeUploadedDocumentsConfig(rawConfig)
  const rootFields = normalized.fields
  const categoryFields = normalized.documentCategory.fields
  const typeFields = normalized.documentType.fields

  const isRootDefaultRequired = (key: UploadedDocumentRootFieldKey) =>
    key === "identificationNumber"

  const rootField = (key: UploadedDocumentRootFieldKey, msg: string) =>
    (rootFields[key]?.required ?? isRootDefaultRequired(key))
      ? z.string().min(1, msg)
      : z.string().optional().default("")

  const categoryField = (key: UploadedDocumentCategoryFieldKey, msg: string) =>
    categoryFields[key]?.required
      ? z.string().min(1, msg)
      : z.string().optional().default("")

  const typeField = (key: UploadedDocumentTypeFieldKey, msg: string) =>
    typeFields[key]?.required
      ? z.string().min(1, msg)
      : z.string().optional().default("")

  return z.object({
    documentCategory: z.object({
      documentCategoryCode: categoryField("documentCategoryCode", "Document category is required"),
      documentCategoryTitle: categoryField("documentCategoryTitle", "Document category title is required"),
    }),
    documentType: z.object({
      documentTypeCode: typeField("documentTypeCode", "Document type is required"),
      documentTypeTitle: typeField("documentTypeTitle", "Document type title is required"),
    }),
    documentPath: rootField("documentPath", "Document file is required"),
    identificationNumber: (() => {
      const required = rootFields["identificationNumber"]?.required ?? true
      return required
        ? z.string().min(1, "Identification number is required").refine(isValidIdentificationNumber, {
            message: "Identification number can only contain letters, numbers, underscore (_), and hyphen (-)",
          })
        : z.string().optional().default("").refine((val) => !val || isValidIdentificationNumber(val), {
            message: "Identification number can only contain letters, numbers, underscore (_), and hyphen (-)",
          })
    })(),
  })
}

export const uploadedDocumentItemSchema = createUploadedDocumentItemSchema()

export const uploadedDocumentsSchema = z.array(uploadedDocumentItemSchema)

export type UploadedDocumentItem = z.infer<typeof uploadedDocumentItemSchema>

export const EMPTY_UPLOADED_DOCUMENT: UploadedDocumentItem = {
  documentCategory: {
    documentCategoryCode: "",
    documentCategoryTitle: "",
  },
  documentType: {
    documentTypeCode: "",
    documentTypeTitle: "",
  },
  documentPath: "",
  identificationNumber: "",
}
