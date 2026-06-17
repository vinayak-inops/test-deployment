import { z } from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

const toOptionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}, z.number().optional())

export type WCPolicyFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type WCPolicyFieldKey =
  | "WCPolicyNumber"
  | "policyNumber"
  | "policyCompanyName"
  | "policyStartDate"
  | "policyExpiryDate"
  | "maximumWorkmen"
  | "isActive"
export type WCPolicyFieldsConfig = Partial<Record<WCPolicyFieldKey, WCPolicyFieldConfig>>
export type WCPolicyConfig = {
  tabRequired?: boolean
  fields?: WCPolicyFieldsConfig
}

export function normalizeWCPolicyConfig(raw: unknown): {
  tabRequired: boolean
  fields: WCPolicyFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const root = raw as WCPolicyConfig
  return {
    tabRequired: root.tabRequired ?? false,
    fields: root.fields ?? {},
  }
}

export function createWCPolicyItemSchema(rawConfig?: WCPolicyConfig) {
  const normalized = normalizeWCPolicyConfig(rawConfig)
  const fields = normalized.fields

  const isRequiredByDefault = (key: WCPolicyFieldKey) => key === "WCPolicyNumber"

  const stringField = (key: Exclude<WCPolicyFieldKey, "maximumWorkmen" | "isActive">, msg: string) =>
    (fields[key]?.required ?? isRequiredByDefault(key))
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

  const numberField = (fields.maximumWorkmen?.required
    ? z.preprocess(
        (value) => {
          if (value === "" || value === null || value === undefined) return undefined
          const parsed = Number(value)
          return Number.isNaN(parsed) ? undefined : parsed
        },
        z.number({ required_error: "Maximum workmen is required" }).min(0, "Maximum workmen must be positive")
      )
    : toOptionalNumber.refine((val) => val === undefined || val >= 0, "Maximum workmen must be positive"))

  const booleanField = fields.isActive?.required ? z.boolean() : z.boolean().optional().default(true)

  return z.object({
    WCPolicyNumber: stringField("WCPolicyNumber", "WC Policy number is required"),
    policyNumber: stringField("policyNumber", "Policy number is required"),
    policyCompanyName: stringField("policyCompanyName", "Policy company name is required"),
    policyStartDate: stringField("policyStartDate", "Policy start date is required"),
    policyExpiryDate: stringField("policyExpiryDate", "Policy expiry date is required"),
    maximumWorkmen: numberField,
    isActive: booleanField,
  })
}

export const wcPolicyItemSchema = createWCPolicyItemSchema()

export const wcPolicySchema = z.array(wcPolicyItemSchema)

export type WCPolicyItem = z.infer<typeof wcPolicyItemSchema>

export const EMPTY_WC_POLICY: WCPolicyItem = {
  WCPolicyNumber: "",
  policyNumber: "",
  policyCompanyName: "",
  policyStartDate: "",
  policyExpiryDate: "",
  maximumWorkmen: undefined,
  isActive: true,
}