import { z } from "zod"

// Witness name: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

// All characters allowed except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type PenaltyFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type PenaltyFieldKey =
  | "dateOfOffence"
  | "offenceDescription"
  | "actionTaken"
  | "fineImposed"
  | "month"
  | "isCauseShownAgainstFine"
  | "witnessName"
  | "fineRealisedDate"
export type PenaltyFieldsConfig = Partial<Record<PenaltyFieldKey, PenaltyFieldConfig>>
export type PenaltyConfig = {
  tabRequired?: boolean
  fields?: PenaltyFieldsConfig
}

export function normalizePenaltyConfig(raw: unknown): {
  tabRequired: boolean
  fields: PenaltyFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const config = raw as PenaltyConfig
  return {
    tabRequired: config.tabRequired ?? false,
    fields: config.fields ?? {},
  }
}

export function createPenaltyItemSchema(rawConfig?: PenaltyConfig) {
  const normalized = normalizePenaltyConfig(rawConfig)
  const fields = normalized.fields

  const requiredByDefault = (field: PenaltyFieldKey) =>
    field === "dateOfOffence" ||
    field === "offenceDescription" ||
    field === "actionTaken" ||
    field === "fineImposed" ||
    field === "month"

  type CV = { validate: (val: string) => boolean; message: string }

  const createStringField = (field: PenaltyFieldKey, message: string, cv?: CV) =>
    (fields[field]?.required ?? requiredByDefault(field))
      ? cv
        ? z.string().min(1, message).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, message)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  const createMonthField = () =>
    (fields.month?.required ?? requiredByDefault("month"))
      ? z.number().min(1, "Month is required").max(12, "Month must be between 1-12")
      : z.number().min(1, "Month is required").max(12, "Month must be between 1-12").optional().default(1)

  const createFineField = () =>
    (fields.fineImposed?.required ?? requiredByDefault("fineImposed"))
      ? z.number().min(0, "Fine amount must be non-negative")
      : z.number().min(0, "Fine amount must be non-negative").optional().default(0)

  return z
  .object({
    dateOfOffence: createStringField("dateOfOffence", "Date of offence is required"),
    offenceDescription: createStringField("offenceDescription", "Offence description is required", {
      validate: hasNoScriptContent,
      message: "Offence description must not contain code or script content",
    }),
    actionTaken: createStringField("actionTaken", "Action taken is required", {
      validate: hasNoScriptContent,
      message: "Action taken must not contain code or script content",
    }),
    fineImposed: createFineField(),
    month: createMonthField(),
    isCauseShownAgainstFine: z.boolean(),
    witnessName: createStringField("witnessName", "Witness name is required", {
      validate: isValidNameChar,
      message: "Witness name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
    fineRealisedDate: createStringField("fineRealisedDate", "Fine realised date is required"),
  })
  .superRefine((data, ctx) => {
    if (data.dateOfOffence && data.fineRealisedDate) {
      const dateOfOffence = new Date(data.dateOfOffence)
      const fineRealisedDate = new Date(data.fineRealisedDate)

      if (dateOfOffence > fineRealisedDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of Offence must be equal to or earlier than Fine Realised Date",
          path: ["dateOfOffence"],
        })
      }
    }
    
    // Additional validation: Check if fineRealisedDate is not in the future
    if (data.fineRealisedDate) {
      const fineRealisedDate = new Date(data.fineRealisedDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (fineRealisedDate > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fine Realised Date cannot be in the future",
          path: ["fineRealisedDate"],
        })
      }
    }
    
    // Additional validation: Check if dateOfOffence is not in the future
    if (data.dateOfOffence) {
      const dateOfOffence = new Date(data.dateOfOffence)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (dateOfOffence > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of Offence cannot be in the future",
          path: ["dateOfOffence"],
        })
      }
    }
  })
}

export const penaltyItemSchema = createPenaltyItemSchema()

export const penaltySchema = z.array(penaltyItemSchema)

export type PenaltyItem = z.infer<typeof penaltyItemSchema>

export const EMPTY_PENALTY: PenaltyItem = {
  dateOfOffence: "",
  offenceDescription: "",
  actionTaken: "",
  fineImposed: 0,
  month: 1,
  isCauseShownAgainstFine: false,
  witnessName: "",
  fineRealisedDate: "",
}