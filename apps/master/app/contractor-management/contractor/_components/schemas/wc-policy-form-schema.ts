import { z } from "zod"

const ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9\s.,`'()/_-]+$/
const ALLOWED_CHARS_MSG = "can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -"

export type WCPolicyFieldConfig = { required?: boolean; visible?: boolean; label?: string }
export type WCPolicyFieldKey =
  | "policyNumber"
  | "policyStartDate"
  | "policyExpiryDate"
  | "policyCompanyName"
  | "maximumWorkmen"
export type WCPolicyFieldsConfig = Partial<Record<WCPolicyFieldKey, WCPolicyFieldConfig>>

export type WCPolicyRootConfig = {
  tabRequired?: boolean
  meta?: {
    minItems?: number
    maxItems?: number
  }
  fields?: WCPolicyFieldsConfig
}

const DEFAULT_REQUIRED: Record<WCPolicyFieldKey, boolean> = {
  policyNumber: true,
  policyStartDate: true,
  policyExpiryDate: true,
  policyCompanyName: true,
  maximumWorkmen: true,
}

export function normalizeWCPolicyConfig(
  rawConfig: WCPolicyFieldsConfig | WCPolicyRootConfig | undefined
): WCPolicyRootConfig {
  if (rawConfig && typeof rawConfig === "object" && "fields" in rawConfig) {
    return rawConfig as WCPolicyRootConfig
  }
  return {
    tabRequired: true,
    fields: (rawConfig ?? {}) as WCPolicyFieldsConfig,
  }
}

export function createWCPolicySchema(rawConfig?: WCPolicyFieldsConfig | WCPolicyRootConfig) {
  const normalized = normalizeWCPolicyConfig(rawConfig)
  const fields = normalized.fields ?? {}

  const isFieldRequired = (fieldKey: WCPolicyFieldKey) =>
    fields[fieldKey]?.required ?? DEFAULT_REQUIRED[fieldKey]

  // Text fields: extended allowed chars
  const textField = (fieldKey: WCPolicyFieldKey, requiredMsg: string, label: string) =>
    isFieldRequired(fieldKey)
      ? z.string().min(1, requiredMsg).refine((val) => ALLOWED_CHARS_REGEX.test(val), { message: `${label} ${ALLOWED_CHARS_MSG}` })
      : z.string().optional().refine((val) => !val || ALLOWED_CHARS_REGEX.test(val), { message: `${label} ${ALLOWED_CHARS_MSG}` })

  // Date fields: plain string, no char validation
  const dateField = (fieldKey: WCPolicyFieldKey, requiredMsg: string) =>
    isFieldRequired(fieldKey) ? z.string().min(1, requiredMsg) : z.string().optional()

  return z
    .object({
      parseID: z.string().optional(),
      policyNumber: textField("policyNumber", "Policy number is required", "Policy number"),
      policyStartDate: dateField("policyStartDate", "Policy start date is required"),
      policyExpiryDate: dateField("policyExpiryDate", "Policy expiry date is required"),
      policyCompanyName: textField("policyCompanyName", "Policy company name is required", "Policy company name"),
      maximumWorkmen: isFieldRequired("maximumWorkmen")
        ? z
            .number({
              required_error: "Maximum workmen is required",
              invalid_type_error: "Maximum workmen is required",
            })
            .min(1, "Maximum workmen must be positive")
        : z
            .number()
            .optional()
            .refine((val) => val === undefined || val >= 1, "Maximum workmen must be positive"),
    })
    .refine(
      (data) => {
        if (data.policyStartDate && data.policyExpiryDate) {
          const startDate = new Date(data.policyStartDate)
          const expiryDate = new Date(data.policyExpiryDate)
          return expiryDate >= startDate
        }
        return true
      },
      {
        message: "Policy expiry date must be greater than or equal to policy start date",
        path: ["policyExpiryDate"],
      }
    )
}

export const wcPolicySchema = createWCPolicySchema()

export type WCPolicy = z.infer<typeof wcPolicySchema>

export const EMPTY_WC_POLICY: WCPolicy = {
  policyNumber: "",
  policyStartDate: "",
  policyExpiryDate: "",
  policyCompanyName: "",
  maximumWorkmen: 0,
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
  return ""
}

export function convertToBackendDate(inputDate?: string | null): string {
  if (!inputDate) return ""
  return inputDate
}