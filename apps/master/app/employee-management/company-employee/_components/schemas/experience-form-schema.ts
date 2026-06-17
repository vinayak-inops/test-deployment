import { z } from "zod"

// Company name: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

// Designation: all characters except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type ExperienceFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type ExperienceFieldKey = "companyName" | "fromDate" | "toDate" | "designation" | "filePath"
export type ExperienceFieldsConfig = Partial<Record<ExperienceFieldKey, ExperienceFieldConfig>>
export type ExperienceConfig = {
  tabRequired?: boolean
  fields?: ExperienceFieldsConfig
}

export function normalizeExperienceConfig(raw: unknown): {
  tabRequired: boolean
  fields: ExperienceFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const root = raw as ExperienceConfig
  return {
    tabRequired: root.tabRequired ?? false,
    fields: root.fields ?? {},
  }
}

export function createExperienceSchema(rawConfig?: ExperienceConfig) {
  const normalized = normalizeExperienceConfig(rawConfig)
  const fields = normalized.fields

  type CharValidation = { validate: (val: string) => boolean; message: string }

  const fieldSchema = (key: ExperienceFieldKey, msg: string, cv?: CharValidation) =>
    fields[key]?.required
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  return z
  .object({
    companyName: fieldSchema("companyName", "Company name is required", {
      validate: isValidNameChar,
      message: "Company name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
    fromDate: fieldSchema("fromDate", "From date is required"),
    toDate: fieldSchema("toDate", "To date is required"),
    designation: fieldSchema("designation", "Designation is required", {
      validate: hasNoScriptContent,
      message: "Designation must not contain code or script content",
    }),
    filePath: fieldSchema("filePath", "Experience document is required"),
  })
  .superRefine((data, ctx) => {
    if (data.fromDate && data.toDate) {
      const from = new Date(data.fromDate)
      const to = new Date(data.toDate)
      if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from > to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "From Date must be less than or equal to To Date",
          path: ["toDate"],
        })
      }
    }
  })
}

export const experienceSchema = createExperienceSchema()

export type Experience = z.infer<typeof experienceSchema>

export const EMPTY_EXPERIENCE: Experience = {
  companyName: "",
  fromDate: "",
  toDate: "",
  designation: "",
  filePath: "",
}