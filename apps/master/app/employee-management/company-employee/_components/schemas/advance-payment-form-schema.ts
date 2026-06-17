import { z } from "zod"

const DATE_CHARS = /^[\d\-\/]*$/


export type AdvancePaymentFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type AdvancePaymentFieldKey = "date" | "month" | "year" | "amount" | "bonusDescription"
export type AdvancePaymentFieldsConfig = Partial<Record<AdvancePaymentFieldKey, AdvancePaymentFieldConfig>>
export type AdvancePaymentConfig = {
  tabRequired?: boolean
  fields?: AdvancePaymentFieldsConfig
}

export function normalizeAdvancePaymentConfig(raw: unknown): {
  tabRequired: boolean
  fields: AdvancePaymentFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const config = raw as AdvancePaymentConfig
  return {
    tabRequired: config.tabRequired ?? false,
    fields: config.fields ?? {},
  }
}

export function createAdvancePaymentItemSchema(rawConfig?: AdvancePaymentConfig) {
  const normalized = normalizeAdvancePaymentConfig(rawConfig)
  const fields = normalized.fields

  const requiredByDefault = (key: AdvancePaymentFieldKey) =>
    key === "date" || key === "month" || key === "year" || key === "amount" || key === "bonusDescription"

  const isRequired = (key: AdvancePaymentFieldKey) => fields[key]?.required ?? requiredByDefault(key)

  const createDateField = () =>
    isRequired("date")
      ? z.string().min(1, "Advance date is required").refine((v) => DATE_CHARS.test(v), { message: "Advance date must contain only digits and date separators (- or /)" })
      : z.string().optional().default("").refine((v) => !v || DATE_CHARS.test(v), { message: "Advance date must contain only digits and date separators (- or /)" })

  const createDescriptionField = () =>
    isRequired("bonusDescription")
      ? z.string().min(1, "Description is required")
      : z.string().optional().default("")

  const createMonthField = () =>
    (fields.month?.required ?? requiredByDefault("month"))
      ? z.number().min(1, "Month must be between 1-12").max(12, "Month must be between 1-12")
      : z.number().min(1, "Month must be between 1-12").max(12, "Month must be between 1-12").optional().default(1)

  const createYearField = () =>
    (fields.year?.required ?? requiredByDefault("year"))
      ? z.number().min(2000, "Year must be 2000 or later").max(2100, "Year must be 2100 or earlier")
      : z
          .number()
          .min(2000, "Year must be 2000 or later")
          .max(2100, "Year must be 2100 or earlier")
          .optional()
          .default(new Date().getFullYear())

  const createAmountField = () =>
    (fields.amount?.required ?? requiredByDefault("amount"))
      ? z.number().min(0, "Advance amount must be non-negative")
      : z.number().min(0, "Advance amount must be non-negative").optional().default(0)

  return z.object({
    date: createDateField(),
    month: createMonthField(),
    year: createYearField(),
    amount: createAmountField(),
    bonusDescription: createDescriptionField(),
  })
}

export const advancePaymentItemSchema = createAdvancePaymentItemSchema()

export const advancePaymentSchema = z.array(advancePaymentItemSchema)

export type AdvancePaymentItem = z.infer<typeof advancePaymentItemSchema>

export const EMPTY_ADVANCE_PAYMENT: AdvancePaymentItem = {
  date: "",
  month: 1,
  year: new Date().getFullYear(),
  amount: 0,
  bonusDescription: "",
}