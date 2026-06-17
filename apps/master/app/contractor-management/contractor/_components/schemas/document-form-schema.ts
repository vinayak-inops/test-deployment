import * as z from "zod"

// Letters, numbers, spaces, . , ' ` ( ) / _ -
const ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9\s.,`'()/_-]+$/
const ALLOWED_CHARS_MSG = "can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -"

// Code fields: letters, numbers, hyphens only — no spaces
const CODE_REGEX = /^[a-zA-Z0-9-]+$/
const CODE_MSG = "can only contain letters, numbers, and hyphens (-), with no spaces"

// Block HTML/script tags only
const hasScriptChars = (val: string) => /[<>]/.test(val)

export type DocumentFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type DocumentFieldKey =
  | "documentCategoryCode"
  | "documentCategoryTitle"
  | "documentTypeCode"
  | "documentTypeTitle"
  | "documentPath"
  | "identificationNumber"
export type DocumentFieldsConfig = Partial<Record<DocumentFieldKey, DocumentFieldConfig>>

export type DocumentTabConfig = {
  tabRequired?: boolean
  fields?: DocumentFieldsConfig
}

export function normalizeDocumentConfig(
  rawConfig: DocumentFieldsConfig | DocumentTabConfig | undefined
): DocumentTabConfig {
  if (rawConfig && typeof rawConfig === "object" && "fields" in rawConfig) {
    return rawConfig as DocumentTabConfig
  }
  return {
    tabRequired: true,
    fields: (rawConfig ?? {}) as DocumentFieldsConfig,
  }
}

export function createDocumentSchema(rawConfig?: DocumentFieldsConfig | DocumentTabConfig) {
  const tabConfig = normalizeDocumentConfig(rawConfig)
  const fields = tabConfig.fields ?? {}

  const isRequired = (key: DocumentFieldKey) => fields[key]?.required === true

  // Code fields: letters, numbers, hyphens only — no spaces
  const codeField = (key: DocumentFieldKey, requiredMsg: string, label: string) =>
    isRequired(key)
      ? z.string().min(1, requiredMsg).refine((val) => CODE_REGEX.test(val), { message: `${label} ${CODE_MSG}` })
      : z.string().optional().refine((val) => !val || CODE_REGEX.test(val), { message: `${label} ${CODE_MSG}` })

  // Title / identification fields: extended allowed chars
  const titleField = (key: DocumentFieldKey, requiredMsg: string, label: string) =>
    isRequired(key)
      ? z.string().min(1, requiredMsg).refine((val) => ALLOWED_CHARS_REGEX.test(val), { message: `${label} ${ALLOWED_CHARS_MSG}` })
      : z.string().optional().refine((val) => !val || ALLOWED_CHARS_REGEX.test(val), { message: `${label} ${ALLOWED_CHARS_MSG}` })

  // Path field: allow everything except < >
  const pathField = (key: DocumentFieldKey, requiredMsg: string) =>
    isRequired(key)
      ? z.string().min(1, requiredMsg).refine((val) => !hasScriptChars(val), { message: "Document path must not contain < or >" })
      : z.string().optional().refine((val) => !val || !hasScriptChars(val), { message: "Document path must not contain < or >" })

  return z.object({
    parseID: z.string().optional(),
    documentCategory: z.object({
      documentCategoryCode: codeField("documentCategoryCode", "Document category is required", "Document category code"),
      documentCategoryTitle: titleField("documentCategoryTitle", "Document category title is required", "Document category title"),
    }),
    documentType: z.object({
      documentTypeCode: codeField("documentTypeCode", "Document type is required", "Document type code"),
      documentTypeTitle: titleField("documentTypeTitle", "Document type title is required", "Document type title"),
    }),
    documentPath: pathField("documentPath", "Document file is required"),
    identificationNumber: titleField("identificationNumber", "Identification number is required", "Identification number"),
  })
}

export const documentSchema = createDocumentSchema()

export type Document = z.infer<typeof documentSchema>

export const EMPTY_DOCUMENT: Document = {
  parseID: undefined,
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