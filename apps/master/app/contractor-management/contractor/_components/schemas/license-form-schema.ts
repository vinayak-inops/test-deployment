import * as z from "zod"

const hasDisallowedChars = (str: string) => {
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

// licenseNo and natureOfWork: letters, numbers, spaces, . , ' ` ( ) / _ -
const hasInvalidTextChars = (str: string) => {
  const regex = /^[a-zA-Z0-9\s.,'\`()/\-_]+$/
  return !regex.test(str)
}

export type LicenseFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type LicenseFieldKey =
  | "licenseNo"
  | "licenseFromDate"
  | "licenseToDate"
  | "workmen"
  | "issuedOn"
  | "natureOfWork"
export type LicenseFieldsConfig = Partial<Record<LicenseFieldKey, LicenseFieldConfig>>
export type LicenseMetaConfig = {
  minItems?: number
  maxItems?: number
}
export type LicenseRootConfig = {
  tabRequired?: boolean
  meta?: LicenseMetaConfig
  fields?: LicenseFieldsConfig
}

export type License = {
  parseID?: string
  licenseNo: string
  licenseFromDate: string
  licenseToDate: string
  workmen?: number
  issuedOn: string
  natureOfWork: string
}

export function normalizeLicenseConfig(raw: unknown): {
  tabRequired: boolean
  meta: LicenseMetaConfig
  fields: LicenseFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { tabRequired: true, meta: {}, fields: {} }
  }

  const obj = raw as Record<string, unknown>

  if (obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
    const root = raw as LicenseRootConfig
    return {
      tabRequired: root.tabRequired ?? true,
      meta: root.meta ?? {},
      fields: root.fields ?? {},
    }
  }

  return {
    tabRequired: true,
    meta: {},
    fields: obj as LicenseFieldsConfig,
  }
}

export function createLicenseSchema(rawConfig?: LicenseFieldsConfig | LicenseRootConfig) {
  const normalized = normalizeLicenseConfig(rawConfig)
  const fields = normalized.fields

  const fieldStr = (key: LicenseFieldKey, msg: string) =>
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

  const fieldText = (key: LicenseFieldKey, label: string) => {
    const msg = `${label} is required`
    return fields[key]?.required !== false
      ? z
          .string()
          .min(1, msg)
          .refine((val) => !hasInvalidTextChars(val), {
            message: `${label} can only contain letters, numbers, spaces, and . , ' \` ( ) / _ -`
          })
      : z
          .string()
          .optional()
          .default("")
          .refine((val) => !val || !hasInvalidTextChars(val), {
            message: `${label} can only contain letters, numbers, spaces, and . , ' \` ( ) / _ -`
          })
  }

  const fieldNum = (key: LicenseFieldKey, msg: string) =>
    fields[key]?.required !== false
      ? z.number({ required_error: msg, invalid_type_error: msg }).min(0, msg)
      : z.number().optional().refine((val) => val === undefined || val >= 0, msg)

  const baseSchema = z.object({
    licenseNo: fieldText("licenseNo", "License number"),
    licenseFromDate: fieldStr("licenseFromDate", "License from date is required"),
    licenseToDate: fieldStr("licenseToDate", "License to date is required"),
    workmen: fieldNum("workmen", "Number of workmen must be positive"),
    issuedOn: fieldStr("issuedOn", "Issued on date is required"),
    natureOfWork: fieldText("natureOfWork", "Nature of work"),
  })

  return baseSchema.superRefine((data, ctx) => {
    if (data.licenseFromDate && data.licenseToDate) {
      const fromDate = new Date(data.licenseFromDate)
      const toDate = new Date(data.licenseToDate)
      if (fromDate > toDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "License From Date must be earlier than or equal to License To Date",
          path: ["licenseToDate"],
        })
      }
    }
    if (data.issuedOn && data.licenseFromDate) {
      const issuedDate = new Date(data.issuedOn)
      const fromDate = new Date(data.licenseFromDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (issuedDate > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Issued On Date cannot be in the future",
          path: ["issuedOn"],
        })
      }
      if (issuedDate > fromDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Issued On Date must be less than or equal to License From Date",
          path: ["issuedOn"],
        })
      }
    }
  })
}

export const licenseSchema = createLicenseSchema()

export const EMPTY_LICENSE: License = {
  licenseNo: "",
  licenseFromDate: "",
  licenseToDate: "",
  workmen: 0,
  issuedOn: "",
  natureOfWork: "",
}