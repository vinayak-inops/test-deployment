import * as z from "zod"

// Document numbers: letters, numbers, underscore (_), hyphen (-) only
const isValidDocNumber = (str: string) => /^[a-zA-Z0-9_-]+$/.test(str)
const DOC_NUMBER_MSG = "can only contain letters, numbers, underscore (_), and hyphen (-)"

export type DocumentsVerificationFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type DocumentsRootFieldKey =
  | "insuranceNumber"
  | "mediclaimPolicyNumber"
  | "accidentPolicyNumber"
export type DocumentsPassportFieldKey =
  | "passportNumber"
  | "passportExpiryDate"
  | "passportPath"
export type DocumentsWorkPermitFieldKey =
  | "workpermitNumber"
  | "workpermitExpiryDate"
  | "workPermitPath"
export type DocumentsLabourCardFieldKey =
  | "labourCardNumber"
  | "labourCardExpiryDate"
  | "labourCardPath"

export type DocumentsRootFieldsConfig = Partial<
  Record<DocumentsRootFieldKey, DocumentsVerificationFieldConfig>
>
export type DocumentsPassportFieldsConfig = Partial<
  Record<DocumentsPassportFieldKey, DocumentsVerificationFieldConfig>
>
export type DocumentsWorkPermitFieldsConfig = Partial<
  Record<DocumentsWorkPermitFieldKey, DocumentsVerificationFieldConfig>
>
export type DocumentsLabourCardFieldsConfig = Partial<
  Record<DocumentsLabourCardFieldKey, DocumentsVerificationFieldConfig>
>

export type DocumentsVerificationConfig = {
  tabRequired?: boolean
  fields?: DocumentsRootFieldsConfig
  passport?: { fields?: DocumentsPassportFieldsConfig }
  workPermit?: { fields?: DocumentsWorkPermitFieldsConfig }
  labourCard?: { fields?: DocumentsLabourCardFieldsConfig }
}

export function normalizeDocumentsVerificationConfig(raw: unknown): {
  tabRequired: boolean
  fields: DocumentsRootFieldsConfig
  passport: { fields: DocumentsPassportFieldsConfig }
  workPermit: { fields: DocumentsWorkPermitFieldsConfig }
  labourCard: { fields: DocumentsLabourCardFieldsConfig }
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
      passport: { fields: {} },
      workPermit: { fields: {} },
      labourCard: { fields: {} },
    }
  }

  const root = raw as DocumentsVerificationConfig
  const source = asObject((root as { fields?: unknown }).fields ?? root)
  const rootFields = extractFields<DocumentsRootFieldsConfig>(source)
  return {
    tabRequired: root.tabRequired ?? false,
    fields: {
      insuranceNumber: rootFields.insuranceNumber,
      mediclaimPolicyNumber: rootFields.mediclaimPolicyNumber,
      accidentPolicyNumber: rootFields.accidentPolicyNumber,
    },
    passport: { fields: extractFields<DocumentsPassportFieldsConfig>(source.passport) },
    workPermit: { fields: extractFields<DocumentsWorkPermitFieldsConfig>(source.workPermit) },
    labourCard: { fields: extractFields<DocumentsLabourCardFieldsConfig>(source.labourCard) },
  }
}

export function createDocumentsVerificationSchema(rawConfig?: DocumentsVerificationConfig) {
  const normalized = normalizeDocumentsVerificationConfig(rawConfig)
  const fields = normalized.fields
  const passportFields = normalized.passport.fields
  const workPermitFields = normalized.workPermit.fields
  const labourCardFields = normalized.labourCard.fields

  type CV = { validate: (val: string) => boolean; message: string }

  const mkField = (required: boolean | undefined, msg: string, cv?: CV) =>
    required
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  const rootField = (key: DocumentsRootFieldKey, msg: string, cv?: CV) =>
    mkField(fields[key]?.required, msg, cv)
  const passportField = (key: DocumentsPassportFieldKey, msg: string, cv?: CV) =>
    mkField(passportFields[key]?.required, msg, cv)
  const workPermitField = (key: DocumentsWorkPermitFieldKey, msg: string, cv?: CV) =>
    mkField(workPermitFields[key]?.required, msg, cv)
  const labourCardField = (key: DocumentsLabourCardFieldKey, msg: string, cv?: CV) =>
    mkField(labourCardFields[key]?.required, msg, cv)

  const numCV = (label: string): CV => ({ validate: isValidDocNumber, message: `${label} ${DOC_NUMBER_MSG}` })

  const isFutureDate = (date: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(date) > today
  }

  const mkExpiryDateField = (required: boolean | undefined, requiredMsg: string) =>
    required
      ? z
          .string()
          .min(1, requiredMsg)
          .refine(isFutureDate, "Expiry date must be a future date")
      : z
          .string()
          .optional()
          .default("")
          .refine((val) => !val || isFutureDate(val), "Expiry date must be a future date")

  return z.object({
    passport: z.object({
      passportNumber: passportField("passportNumber", "Passport number is required", numCV("Passport number")),
      passportExpiryDate: mkExpiryDateField(passportFields.passportExpiryDate?.required, "Passport expiry date is required"),
      passportPath: passportField("passportPath", "Passport document is required"),
    }),
    insuranceNumber: rootField("insuranceNumber", "Insurance number is required", numCV("Insurance number")),
    mediclaimPolicyNumber: rootField("mediclaimPolicyNumber", "Mediclaim policy number is required", numCV("Mediclaim policy number")),
    accidentPolicyNumber: rootField("accidentPolicyNumber", "Accident policy number is required", numCV("Accident policy number")),
    workPermit: z.object({
      workpermitNumber: workPermitField("workpermitNumber", "Work permit number is required", numCV("Work permit number")),
      workpermitExpiryDate: mkExpiryDateField(workPermitFields.workpermitExpiryDate?.required, "Work permit expiry date is required"),
      workPermitPath: workPermitField("workPermitPath", "Work permit document is required"),
    }),
    labourCard: z.object({
      labourCardNumber: labourCardField("labourCardNumber", "Labour card number is required", numCV("Labour card number")),
      labourCardExpiryDate: mkExpiryDateField(labourCardFields.labourCardExpiryDate?.required, "Labour card expiry date is required"),
      labourCardPath: labourCardField("labourCardPath", "Labour card document is required"),
    }),
  })
}

export const documentsVerificationSchema = createDocumentsVerificationSchema()

export type DocumentsVerificationData = z.infer<typeof documentsVerificationSchema>