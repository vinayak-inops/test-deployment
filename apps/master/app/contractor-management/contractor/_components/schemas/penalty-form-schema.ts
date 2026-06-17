import { z } from "zod"

// Letters, numbers, spaces, . , ' ` ( ) / _ -
const ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9\s.,`'()/_-]+$/
const ALLOWED_CHARS_MSG = "can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -"

// Blocks HTML/script tags only — allows everything else
const hasScriptChars = (val: string) => /[<>]/.test(val)

export type PenaltyFieldConfig = { required?: boolean; visible?: boolean; label?: string }
export type PenaltyFieldKey =
  | "dateOfOffence"
  | "actOfMisconduct"
  | "actionTaken"
  | "amount"
  | "month"
  | "witnessName"
  | "fineRealisedDate"
export type PenaltyFieldsConfig = Partial<Record<PenaltyFieldKey, PenaltyFieldConfig>>

export type PenaltyRootConfig = {
  tabRequired?: boolean
  meta?: {
    minItems?: number
    maxItems?: number
  }
  fields?: PenaltyFieldsConfig
}

const DEFAULT_REQUIRED: Record<PenaltyFieldKey, boolean> = {
  dateOfOffence: true,
  actOfMisconduct: true,
  actionTaken: true,
  amount: true,
  month: false,
  witnessName: true,
  fineRealisedDate: false,
}

export function normalizePenaltyConfig(
  rawConfig: PenaltyFieldsConfig | PenaltyRootConfig | undefined
): PenaltyRootConfig {
  if (rawConfig && typeof rawConfig === "object" && "fields" in rawConfig) {
    return rawConfig as PenaltyRootConfig
  }
  return {
    tabRequired: true,
    fields: (rawConfig ?? {}) as PenaltyFieldsConfig,
  }
}

export function createPenaltySchema(rawConfig?: PenaltyFieldsConfig | PenaltyRootConfig) {
  const normalized = normalizePenaltyConfig(rawConfig)
  const fields = normalized.fields ?? {}

  const isFieldRequired = (fieldKey: PenaltyFieldKey) =>
    fields[fieldKey]?.required ?? DEFAULT_REQUIRED[fieldKey]

  // Date fields: plain string, no char validation
  const dateField = (fieldKey: PenaltyFieldKey, requiredMsg: string) =>
    isFieldRequired(fieldKey) ? z.string().min(1, requiredMsg) : z.string().optional()

  // Free-text fields: block < > only
  const freeTextField = (fieldKey: PenaltyFieldKey, requiredMsg: string, label: string) =>
    isFieldRequired(fieldKey)
      ? z.string().min(1, requiredMsg).refine((val) => !hasScriptChars(val), { message: `${label} must not contain < or >` })
      : z.string().optional().refine((val) => !val || !hasScriptChars(val), { message: `${label} must not contain < or >` })

  // Name fields: extended allowed chars
  const nameField = (fieldKey: PenaltyFieldKey, requiredMsg: string, label: string) =>
    isFieldRequired(fieldKey)
      ? z.string().min(1, requiredMsg).refine((val) => ALLOWED_CHARS_REGEX.test(val), { message: `${label} ${ALLOWED_CHARS_MSG}` })
      : z.string().optional().refine((val) => !val || ALLOWED_CHARS_REGEX.test(val), { message: `${label} ${ALLOWED_CHARS_MSG}` })

  return z
    .object({
      parseID: z.string().optional(),
      dateOfOffence: dateField("dateOfOffence", "Date of offence is required"),
      actOfMisconduct: freeTextField("actOfMisconduct", "Act of misconduct is required", "Act of misconduct"),
      actionTaken: freeTextField("actionTaken", "Action taken is required", "Action taken"),
      amount: isFieldRequired("amount")
        ? z
            .number({ required_error: "Amount is required", invalid_type_error: "Amount is required" })
            .min(0, "Amount must be positive")
        : z
            .number()
            .optional()
            .refine((val) => val === undefined || val >= 0, "Amount must be positive"),
      month: isFieldRequired("month")
        ? z
            .number({ required_error: "Month is required", invalid_type_error: "Month is required" })
            .min(1, "Month must be between 1-12")
            .max(12, "Month must be between 1-12")
        : z
            .number()
            .optional()
            .refine((val) => val === undefined || (val >= 1 && val <= 12), "Month must be between 1-12"),
      witnessName: nameField("witnessName", "Witness name is required", "Witness name"),
      fineRealisedDate: dateField("fineRealisedDate", "Fine realised date is required"),
    })
    .refine(
      (data) => {
        if (!data.dateOfOffence) return true
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const offence = new Date(data.dateOfOffence as string)
        offence.setHours(0, 0, 0, 0)
        return offence <= today
      },
      {
        message: "Date of offence cannot be in the future",
        path: ["dateOfOffence"],
      }
    )
    .refine(
      (data) => {
        if (!data.fineRealisedDate || !data.dateOfOffence) return true
        const offence = new Date(data.dateOfOffence as string)
        offence.setHours(0, 0, 0, 0)
        const realised = new Date(data.fineRealisedDate as string)
        realised.setHours(0, 0, 0, 0)
        return realised >= offence
      },
      {
        message: "Fine realised date must be on or after date of offence",
        path: ["fineRealisedDate"],
      }
    )
}

export const penaltySchema = createPenaltySchema()

export type Penalty = z.infer<typeof penaltySchema>

export const EMPTY_PENALTY: Penalty = {
  dateOfOffence: "",
  actOfMisconduct: "",
  actionTaken: "",
  amount: 0,
  month: undefined,
  witnessName: "",
  fineRealisedDate: "",
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