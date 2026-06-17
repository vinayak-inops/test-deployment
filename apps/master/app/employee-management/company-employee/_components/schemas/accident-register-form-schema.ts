import { z } from "zod"

// All characters allowed except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type AccidentRegisterFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type AccidentRegisterFieldKey =
  | "dateOfAccident"
  | "dateOfReport"
  | "accidentDescription"
  | "dateOfReturn"
  | "severity"
  | "relatedDocument"
export type AccidentRegisterFieldsConfig = Partial<
  Record<AccidentRegisterFieldKey, AccidentRegisterFieldConfig>
>
export type AccidentRegisterConfig = {
  tabRequired?: boolean
  fields?: AccidentRegisterFieldsConfig
}

export function normalizeAccidentRegisterConfig(raw: unknown): {
  tabRequired: boolean
  fields: AccidentRegisterFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const root = raw as AccidentRegisterConfig
  return {
    tabRequired: root.tabRequired ?? false,
    fields: root.fields ?? {},
  }
}

export function createAccidentRegisterSchema(rawConfig?: AccidentRegisterConfig) {
  const normalized = normalizeAccidentRegisterConfig(rawConfig)
  const fields = normalized.fields
  const requiredByDefault = (key: AccidentRegisterFieldKey) =>
    key === "dateOfAccident" ||
    key === "dateOfReport" ||
    key === "accidentDescription" ||
    key === "dateOfReturn" ||
    key === "severity" ||
    key === "relatedDocument"

  const fieldSchema = (key: AccidentRegisterFieldKey, msg: string) =>
    (fields[key]?.required ?? requiredByDefault(key))
      ? z.string().min(1, msg)
      : z.string().optional().default("")

  const DATE_CHARS = /^[\d\-\/]*$/

  return z
  .object({
    dateOfAccident: fieldSchema("dateOfAccident", "Accident date is required")
      .refine((value) => !value || DATE_CHARS.test(value), {
        message: "Date of Accident must contain only digits and date separators (- or /)",
      })
      .refine((value) => {
        if (!value) return true
        const selectedDate = new Date(value)
        const today = new Date()
        selectedDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)
        return selectedDate <= today
      }, { message: "Date of Accident cannot be in the future" }),
    dateOfReport: fieldSchema("dateOfReport", "Report date is required")
      .refine((value) => !value || DATE_CHARS.test(value), {
        message: "Date of Report must contain only digits and date separators (- or /)",
      }),
    accidentDescription: fieldSchema("accidentDescription", "Accident description is required")
      .refine((value) => !value || hasNoScriptContent(value), {
        message: "Accident description must not contain code or script content",
      }),
    dateOfReturn: fieldSchema("dateOfReturn", "Return date is required")
      .refine((value) => !value || DATE_CHARS.test(value), {
        message: "Date of Return must contain only digits and date separators (- or /)",
      }),
    severity: fieldSchema("severity", "Severity is required")
      .refine((value) => !value || hasNoScriptContent(value), {
        message: "Severity must not contain code or script content",
      }),
    relatedDocument: fieldSchema("relatedDocument", "Related document is required"),
  })
  .superRefine((data, ctx) => {
    if (data.dateOfAccident && data.dateOfReport && data.dateOfReturn) {
      const accidentDate = new Date(data.dateOfAccident)
      const reportDate = new Date(data.dateOfReport)
      const returnDate = new Date(data.dateOfReturn)

      if (!Number.isNaN(accidentDate.getTime()) && !Number.isNaN(reportDate.getTime()) && accidentDate > reportDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of Accident must be earlier than or equal to Date of Report",
          path: ["dateOfReport"],
        })
      }
      if (!Number.isNaN(accidentDate.getTime()) && !Number.isNaN(returnDate.getTime()) && accidentDate > returnDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of Return must be later than or equal to Date of Accident",
          path: ["dateOfReturn"],
        })
      }
    }
  })
}

export const accidentRegisterSchema = createAccidentRegisterSchema()

export type AccidentRegister = z.infer<typeof accidentRegisterSchema>

export const EMPTY_ACCIDENT_REGISTER: AccidentRegister = {
  dateOfAccident: "",
  dateOfReport: "",
  accidentDescription: "",
  dateOfReturn: "",
  severity: "",
  relatedDocument: "",
}
