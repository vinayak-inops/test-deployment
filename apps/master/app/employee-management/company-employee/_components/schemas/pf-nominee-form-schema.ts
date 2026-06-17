import { z } from "zod"

const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

export type PfNomineeFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type PfNomineeFieldKey = "memberName" | "relation" | "birthDate" | "percentage"
export type PfNomineeFieldsConfig = Partial<Record<PfNomineeFieldKey, PfNomineeFieldConfig>>
export type PfNomineeConfig = {
  tabRequired?: boolean
  fields?: PfNomineeFieldsConfig
}

export function normalizePfNomineeConfig(raw: unknown): {
  tabRequired: boolean
  fields: PfNomineeFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const root = raw as PfNomineeConfig
  return {
    tabRequired: root.tabRequired ?? false,
    fields: root.fields ?? {},
  }
}

export function createPfNomineeSchema(rawConfig?: PfNomineeConfig) {
  const normalized = normalizePfNomineeConfig(rawConfig)
  const fields = normalized.fields

  const requiredByDefault = (key: PfNomineeFieldKey) =>
    key === "memberName" || key === "relation"

  type CV = { validate: (val: string) => boolean; message: string }

  const fieldSchema = (key: PfNomineeFieldKey, msg: string, cv?: CV) =>
    (fields[key]?.required ?? requiredByDefault(key))
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  const nameCV: CV = {
    validate: isValidNameChar,
    message: "Only letters, numbers, spaces, and . , ' ` ( ) / _ - are allowed",
  }

  const percentageSchema = (fields.percentage?.required ?? false)
    ? z.string().min(1, "Percentage is required").refine((val) => /^\d+(\.\d+)?$/.test(val), {
        message: "Percentage must be a number",
      })
    : z.string().optional().default("").refine((val) => !val || /^\d+(\.\d+)?$/.test(val), {
        message: "Percentage must be a number",
      })

  return z.object({
    memberName: fieldSchema("memberName", "Nominee name is required", nameCV),
    relation: fieldSchema("relation", "Relation is required", nameCV),
    birthDate: fieldSchema("birthDate", "Birth date is required").refine(
      (val) => !val || new Date(val) <= new Date(),
      { message: "Birth date cannot be in the future" }
    ),
    percentage: percentageSchema,
  })
}

export const pfNomineeSchema = createPfNomineeSchema()

export type PfNominee = z.infer<typeof pfNomineeSchema>

export const EMPTY_PF_NOMINEE: PfNominee = {
  memberName: "",
  relation: "",
  birthDate: "",
  percentage: "",
}
