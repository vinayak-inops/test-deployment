import { z } from "zod"

// All characters allowed except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type BonusFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type BonusFieldKey = "date" | "month" | "year" | "amount" | "bonusDescription"
export type BonusFieldsConfig = Partial<Record<BonusFieldKey, BonusFieldConfig>>
export type BonusConfig = {
  tabRequired?: boolean
  fields?: BonusFieldsConfig
}

export function normalizeBonusConfig(raw: unknown): {
  tabRequired: boolean
  fields: BonusFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const obj = raw as Record<string, unknown>
  if (obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
    const config = raw as BonusConfig
    return {
      tabRequired: config.tabRequired ?? false,
      fields: config.fields ?? {},
    }
  }

  return {
    tabRequired: false,
    fields: obj as BonusFieldsConfig,
  }
}

export function createBonusItemSchema(rawConfig?: BonusFieldsConfig | BonusConfig) {
  const normalized = normalizeBonusConfig(rawConfig)
  const fields = normalized.fields

  const requiredByDefault = (key: BonusFieldKey) =>
    key === "date" || key === "month" || key === "year" || key === "amount" || key === "bonusDescription"

  const createStringField = (key: BonusFieldKey, message: string) =>
    (fields[key]?.required ?? requiredByDefault(key))
      ? z.string().min(1, message).refine(hasNoScriptContent, {
          message: `${message.replace(" is required", "")} must not contain code or script content`,
        })
      : z.string().optional().default("").refine((val) => !val || hasNoScriptContent(val), {
          message: `${message.replace(" is required", "")} must not contain code or script content`,
        })

  const createMonthField = () =>
    (fields.month?.required ?? requiredByDefault("month"))
      ? z.number().min(1, "Month is required").max(12, "Month must be between 1-12")
      : z.number().min(1, "Month is required").max(12, "Month must be between 1-12").optional().default(1)

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
      ? z.number().min(0, "Bonus amount must be non-negative")
      : z.number().min(0, "Bonus amount must be non-negative").optional().default(0)

  return z.object({
    date: createStringField("date", "Bonus date is required"),
    month: createMonthField(),
    year: createYearField(),
    amount: createAmountField(),
    bonusDescription: createStringField("bonusDescription", "Bonus description is required"),
  })
}

export const bonusItemSchema = createBonusItemSchema()

export const bonusSchema = z.array(bonusItemSchema)

export type BonusItem = z.infer<typeof bonusItemSchema>

export const EMPTY_BONUS: BonusItem = {
  date: "",
  month: 1,
  year: new Date().getFullYear(),
  amount: 0,
  bonusDescription: "",
}