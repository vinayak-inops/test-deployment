import { z } from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export type SecurityDepositFieldConfig = { required?: boolean; visible?: boolean; label?: string }
export type SecurityDepositFieldKey = "depositDate" | "depositDetail" | "depositAmount"
export type SecurityDepositFieldsConfig = Partial<
  Record<SecurityDepositFieldKey, SecurityDepositFieldConfig>
>
export type SecurityDepositMetaConfig = {
  minItems?: number
  maxItems?: number
}
export type SecurityDepositRootConfig = {
  tabRequired?: boolean
  meta?: SecurityDepositMetaConfig
  fields?: SecurityDepositFieldsConfig
}

export type SecurityDeposit = {
  parseID?: string
  depositDate: string
  depositDetail: string
  depositAmount?: number
}

const DEFAULT_REQUIRED: Record<SecurityDepositFieldKey, boolean> = {
  depositDate: true,
  depositDetail: true,
  depositAmount: true,
}

export function normalizeSecurityDepositConfig(raw: unknown): {
  tabRequired: boolean
  meta: SecurityDepositMetaConfig
  fields: SecurityDepositFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { tabRequired: true, meta: {}, fields: {} }
  }

  const obj = raw as Record<string, unknown>
  if (obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
    const root = raw as SecurityDepositRootConfig
    return {
      tabRequired: root.tabRequired ?? true,
      meta: root.meta ?? {},
      fields: root.fields ?? {},
    }
  }

  return {
    tabRequired: true,
    meta: {},
    fields: obj as SecurityDepositFieldsConfig,
  }
}

export function createSecurityDepositSchema(
  rawConfig?: SecurityDepositFieldsConfig | SecurityDepositRootConfig
) {
  const normalized = normalizeSecurityDepositConfig(rawConfig)
  const fields = normalized.fields

  const isFieldRequired = (fieldKey: SecurityDepositFieldKey) =>
    fields[fieldKey]?.required ?? DEFAULT_REQUIRED[fieldKey]

  const requiredString = (fieldKey: SecurityDepositFieldKey, requiredMessage: string) =>
    isFieldRequired(fieldKey) 
      ? z
          .string()
          .min(1, requiredMessage)
          .refine((val) => !hasDisallowedChars(val), {
            message: `${requiredMessage.replace(" is required", "")} can only contain letters, numbers, spaces, underscores (_), and hyphens (-)`
          })
      : z
          .string()
          .optional()
          .refine((val) => !val || !hasDisallowedChars(val), {
            message: `${requiredMessage.replace(" is required", "")} can only contain letters, numbers, spaces, underscores (_), and hyphens (-)`
          })

  return z.object({
    parseID: z.string().optional(),
    depositDate: requiredString("depositDate", "Deposit date is required"),
    depositDetail: requiredString("depositDetail", "Deposit detail is required"),
    depositAmount: isFieldRequired("depositAmount")
      ? z
          .number({
            required_error: "Deposit amount is required",
            invalid_type_error: "Deposit amount is required",
          })
          .min(0, "Deposit amount must be positive")
      : z
          .number()
          .optional()
          .refine((val) => val === undefined || val >= 0, "Deposit amount must be positive"),
  })
}

export const securityDepositSchema = createSecurityDepositSchema()

export const EMPTY_SECURITY_DEPOSIT: SecurityDeposit = {
  depositDate: "",
  depositDetail: "",
  depositAmount: 0,
}

export function convertToInputDate(dateValue: unknown): string {
  if (!dateValue) return ""
  if (typeof dateValue === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue
    try {
      return new Date(dateValue).toISOString().split("T")[0]
    } catch {
      return ""
    }
  }
  if (typeof dateValue === "object" && dateValue !== null && "$date" in dateValue) {
    const d = (dateValue as { $date: string }).$date
    try {
      return new Date(d).toISOString().split("T")[0]
    } catch {
      return ""
    }
  }
  if (typeof dateValue === "number") {
    try {
      return new Date(dateValue).toISOString().split("T")[0]
    } catch {
      return ""
    }
  }
  return ""
}

/** Convert form deposit to backend shape with depositDate as yyyy-mm-dd string */
export function toBackendDeposit(deposit: SecurityDeposit): {
  parseID?: string
  depositDate: string
  depositDetail: string
  depositAmount: number
} {
  const input = (deposit.depositDate || "").trim()
  let formattedDate = ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    formattedDate = input
  } else if (input) {
    try {
      const parsed = new Date(input)
      if (!isNaN(parsed.getTime())) {
        formattedDate = parsed.toISOString().split("T")[0]
      }
    } catch {
      // keep empty
    }
  }
  return {
    parseID: deposit.parseID || undefined,
    depositDate: formattedDate,
    depositDetail: deposit.depositDetail || "",
    depositAmount: deposit.depositAmount ?? 0,
  }
}