import * as z from "zod"

// Letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidFieldChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

export type BankDetailsFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type BankDetailsRootFieldKey = "aadharNumber" | "panNumber" | "esiNumber" | "uanNumber" | "pfNumber"
export type BankDetailsNestedFieldKey = "bankName" | "ifscCode" | "branchName" | "accountNumber"
export type BankDetailsRootFieldsConfig = Partial<Record<BankDetailsRootFieldKey, BankDetailsFieldConfig>>
export type BankDetailsNestedFieldsConfig = Partial<Record<BankDetailsNestedFieldKey, BankDetailsFieldConfig>>
export type BankDetailsConfig = {
  tabRequired?: boolean
  fields?: BankDetailsRootFieldsConfig
  bankDetails?: {
    fields?: BankDetailsNestedFieldsConfig
  }
}

export function normalizeBankDetailsConfig(raw: unknown): {
  tabRequired: boolean
  fields: BankDetailsRootFieldsConfig
  bankDetails: { fields: BankDetailsNestedFieldsConfig }
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
      tabRequired: true,
      fields: {},
      bankDetails: { fields: {} },
    }
  }

  const root = raw as BankDetailsConfig
  const source = asObject((root as { fields?: unknown }).fields ?? root)
  const rootFields = extractFields<BankDetailsRootFieldsConfig>(source)
  const nestedBankDetails = asObject(source.bankDetails)
  return {
    tabRequired: root.tabRequired ?? true,
    fields: {
      aadharNumber: rootFields.aadharNumber,
      panNumber: rootFields.panNumber,
      esiNumber: rootFields.esiNumber,
      uanNumber: rootFields.uanNumber,
      pfNumber: rootFields.pfNumber,
    },
    bankDetails: {
      fields: extractFields<BankDetailsNestedFieldsConfig>(nestedBankDetails),
    },
  }
}

export function createBankDetailsSchema(rawConfig?: BankDetailsConfig) {
  const normalized = normalizeBankDetailsConfig(rawConfig)
  const rootFields = normalized.fields
  const nestedFields = normalized.bankDetails.fields
  const isRootDefaultRequired = (key: BankDetailsRootFieldKey) => key === "aadharNumber"
  const isNestedDefaultRequired = (key: BankDetailsNestedFieldKey) =>
    key === "bankName" || key === "ifscCode" || key === "branchName" || key === "accountNumber"

  const CHAR_MSG = "can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -"

  const rootField = (key: BankDetailsRootFieldKey, msg: string) =>
    (rootFields[key]?.required ?? isRootDefaultRequired(key))
      ? z
          .string()
          .min(1, msg)
          .refine((val) => isValidFieldChar(val), {
            message: `${msg.replace(" is required", "")} ${CHAR_MSG}`,
          })
      : z
          .string()
          .optional()
          .default("")
          .refine((val) => !val || isValidFieldChar(val), {
            message: `${msg.replace(" is required", "")} ${CHAR_MSG}`,
          })

  const bankField = (key: BankDetailsNestedFieldKey, msg: string) =>
    (nestedFields[key]?.required ?? isNestedDefaultRequired(key))
      ? z
          .string()
          .min(1, msg)
          .refine((val) => isValidFieldChar(val), {
            message: `${msg.replace(" is required", "")} ${CHAR_MSG}`,
          })
      : z
          .string()
          .optional()
          .default("")
          .refine((val) => !val || isValidFieldChar(val), {
            message: `${msg.replace(" is required", "")} ${CHAR_MSG}`,
          })

  return z.object({
    aadharNumber: rootField("aadharNumber", "Aadhar number is required")
      .refine((val) => !val || val.length === 12, "Aadhar number must be 12 digits"),
    aadharNumberDocumentPath: z.string().optional().default(""),
    panNumber: rootField("panNumber", "PAN number is required")
      .refine((val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), "PAN number must be in valid format (e.g., ABCDE1234F)"),
    panNumberDocumentPath: z.string().optional().default(""),
    bankDetails: z.object({
      bankName: bankField("bankName", "Bank name is required"),
      ifscCode: bankField("ifscCode", "IFSC code is required"),
      branchName: bankField("branchName", "Branch name is required"),
      accountNumber: bankField("accountNumber", "Account number is required"),
    }),
    esiNumber: rootField("esiNumber", "ESI number is required"),
    uanNumber: rootField("uanNumber", "UAN number is required"),
    pfNumber: rootField("pfNumber", "PF number is required"),
  })
}

export const bankDetailsSchema = createBankDetailsSchema()

export type BankDetailsData = z.infer<typeof bankDetailsSchema>