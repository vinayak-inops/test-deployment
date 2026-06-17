import { z } from "zod"

// Severity: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

// Description: all characters except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type MedicalCheckupFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type MedicalCheckupFieldKey =
  | "checkupDate"
  | "nextCheckupDate"
  | "description"
  | "severity"
  | "documentPath"
export type MedicalCheckupFieldsConfig = Partial<Record<MedicalCheckupFieldKey, MedicalCheckupFieldConfig>>
export type MedicalCheckupConfig = {
  tabRequired?: boolean
  fields?: MedicalCheckupFieldsConfig
}

export function normalizeMedicalCheckupConfig(raw: unknown): {
  tabRequired: boolean
  fields: MedicalCheckupFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const root = raw as MedicalCheckupConfig
  return {
    tabRequired: root.tabRequired ?? false,
    fields: root.fields ?? {},
  }
}

export function createMedicalCheckupSchema(rawConfig?: MedicalCheckupConfig) {
  const normalized = normalizeMedicalCheckupConfig(rawConfig)
  const fields = normalized.fields
  const requiredByDefault = (key: MedicalCheckupFieldKey) =>
    key === "checkupDate" || key === "nextCheckupDate" || key === "description"

  type CV = { validate: (val: string) => boolean; message: string }

  const fieldSchema = (key: MedicalCheckupFieldKey, msg: string, cv?: CV) =>
    (fields[key]?.required ?? requiredByDefault(key))
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  return z
  .object({
    checkupDate: fieldSchema("checkupDate", "Checkup date is required"),
    nextCheckupDate: fieldSchema("nextCheckupDate", "Next checkup date is required"),
    description: fieldSchema("description", "Description is required", {
      validate: hasNoScriptContent,
      message: "Description must not contain code or script content",
    }),
    severity: fieldSchema("severity", "Severity is required", {
      validate: isValidNameChar,
      message: "Severity can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
    documentPath: fieldSchema("documentPath", "Medical checkup document is required"),
  })
  .superRefine((data, ctx) => {
    if (data.checkupDate && data.nextCheckupDate) {
      const checkup = new Date(data.checkupDate)
      const next = new Date(data.nextCheckupDate)
      if (!Number.isNaN(checkup.getTime()) && !Number.isNaN(next.getTime()) && checkup > next) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Checkup Date must be earlier than or equal to Next Checkup Date",
          path: ["nextCheckupDate"],
        })
      }
    }
  })
}

export const medicalCheckupSchema = createMedicalCheckupSchema()

export type MedicalCheckup = z.infer<typeof medicalCheckupSchema>

export const EMPTY_MEDICAL_CHECKUP: MedicalCheckup = {
  checkupDate: "",
  nextCheckupDate: "",
  description: "",
  severity: "",
  documentPath: "",
}
