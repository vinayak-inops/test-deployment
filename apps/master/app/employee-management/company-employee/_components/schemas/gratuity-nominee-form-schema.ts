import { z } from "zod"

// Member name: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

export type GratuityNomineeFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type GratuityNomineeFieldKey = "memberName" | "relation" | "birthDate" | "percentage"
export type GratuityNomineeFieldsConfig = Partial<
  Record<GratuityNomineeFieldKey, GratuityNomineeFieldConfig>
>
export type GratuityNomineeConfig = {
  tabRequired?: boolean
  fields?: GratuityNomineeFieldsConfig
}

export function normalizeGratuityNomineeConfig(raw: unknown): {
  tabRequired: boolean
  fields: GratuityNomineeFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const root = raw as GratuityNomineeConfig
  return {
    tabRequired: root.tabRequired ?? false,
    fields: root.fields ?? {},
  }
}

export function createGratuityNomineeSchema(rawConfig?: GratuityNomineeConfig) {
  const normalized = normalizeGratuityNomineeConfig(rawConfig)
  const fields = normalized.fields

  const requiredByDefault = (key: GratuityNomineeFieldKey) =>
    key === "memberName" || key === "relation"

  type CharValidation = { validate: (val: string) => boolean; message: string }

  const fieldSchema = (key: GratuityNomineeFieldKey, msg: string, cv?: CharValidation) =>
    (fields[key]?.required ?? requiredByDefault(key))
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  const percentageSchema = (fields["percentage"]?.required ?? false)
    ? z.string().min(1, "Percentage is required").regex(/^\d+(\.\d+)?$/, "Percentage must be a valid number")
    : z.string().optional().default("").refine((val) => !val || /^\d+(\.\d+)?$/.test(val), "Percentage must be a valid number")

  return z.object({
    memberName: fieldSchema("memberName", "Nominee name is required", {
      validate: isValidNameChar,
      message: "Nominee name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
    relation: fieldSchema("relation", "Relation is required"),
    birthDate: fieldSchema("birthDate", "Birth date is required").refine(
      (val) => !val || new Date(val) <= new Date(),
      { message: "Birth date cannot be in the future" }
    ),
    percentage: percentageSchema,
  })
}

export const gratuityNomineeSchema = createGratuityNomineeSchema()

export type GratuityNominee = z.infer<typeof gratuityNomineeSchema>

export const EMPTY_GRATUITY_NOMINEE: GratuityNominee = {
  memberName: "",
  relation: "",
  birthDate: "",
  percentage: "",
}