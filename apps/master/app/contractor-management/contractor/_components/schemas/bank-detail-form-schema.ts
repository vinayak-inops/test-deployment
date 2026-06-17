import * as z from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export type BankDetailFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type BankDetailFieldKey =
  | "bankName"
  | "branchName"
  | "micrNo"
  | "ifscNo"
  | "bankAccountNo"
export type BankDetailFieldsConfig = Partial<Record<BankDetailFieldKey, BankDetailFieldConfig>>
export type BankDetailMetaConfig = {
  minItems?: number
  maxItems?: number
}
export type BankDetailRootConfig = {
  tabRequired?: boolean
  meta?: BankDetailMetaConfig
  fields?: BankDetailFieldsConfig
}

export type BankDetail = {
  parseID?: string
  bankName: string
  branchName: string
  micrNo: string
  ifscNo: string
  bankAccountNo: string
}

export function normalizeBankDetailConfig(raw: unknown): {
  tabRequired: boolean
  meta: BankDetailMetaConfig
  fields: BankDetailFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { tabRequired: true, meta: {}, fields: {} }
  }

  const obj = raw as Record<string, unknown>
  if (obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
    const root = raw as BankDetailRootConfig
    return {
      tabRequired: root.tabRequired ?? true,
      meta: root.meta ?? {},
      fields: root.fields ?? {},
    }
  }

  return {
    tabRequired: true,
    meta: {},
    fields: obj as BankDetailFieldsConfig,
  }
}

export function createBankDetailSchema(rawConfig?: BankDetailFieldsConfig | BankDetailRootConfig) {
  const normalized = normalizeBankDetailConfig(rawConfig)
  const fields = normalized.fields

  const fieldSchema = (key: BankDetailFieldKey, msg: string) =>
    fields[key]?.required !== false 
      ? z
          .string()
          .min(1, msg)
          .refine((val) => !hasDisallowedChars(val), {
            message: `${msg.replace(" is required", "")} can only contain letters, numbers, spaces, underscores (_), and hyphens (-)`
          })
      : z
          .string()
          .optional()
          .default("")
          .refine((val) => !val || !hasDisallowedChars(val), {
            message: `${msg.replace(" is required", "")} can only contain letters, numbers, spaces, underscores (_), and hyphens (-)`
          })

  return z.object({
    parseID: z.string().optional(),
    bankName: fieldSchema("bankName", "Bank name is required"),
    branchName: fieldSchema("branchName", "Branch name is required"),
    micrNo: fieldSchema("micrNo", "MICR number is required"),
    ifscNo: fieldSchema("ifscNo", "IFSC code is required"),
    bankAccountNo: fieldSchema("bankAccountNo", "Bank account number is required"),
  })
}

export const bankDetailSchema = createBankDetailSchema()

export const EMPTY_BANK_DETAIL: BankDetail = {
  parseID: undefined,
  bankName: "",
  branchName: "",
  micrNo: "",
  ifscNo: "",
  bankAccountNo: "",
}