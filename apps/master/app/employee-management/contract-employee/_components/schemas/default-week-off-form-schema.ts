import * as z from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export type DefaultWeekOffFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type DefaultWeekOffFieldKey = "from" | "to" | "isActive"
export type DefaultWeekOffFieldsConfig = Partial<Record<DefaultWeekOffFieldKey, DefaultWeekOffFieldConfig>>
export type DefaultWeekOffConfig = {
  tabRequired?: boolean
  fields?: DefaultWeekOffFieldsConfig
}

export function normalizeDefaultWeekOffConfig(raw: unknown): {
  tabRequired: boolean
  fields: DefaultWeekOffFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const obj = raw as Record<string, unknown>
  if (obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
    const config = raw as DefaultWeekOffConfig
    return {
      tabRequired: config.tabRequired ?? false,
      fields: config.fields ?? {},
    }
  }

  return {
    tabRequired: false,
    fields: obj as DefaultWeekOffFieldsConfig,
  }
}

export function createDefaultWeekOffItemSchema(rawConfig?: DefaultWeekOffConfig | DefaultWeekOffFieldsConfig) {
  const normalized = normalizeDefaultWeekOffConfig(rawConfig)
  const fields = normalized.fields
  const requiredByDefault = (key: DefaultWeekOffFieldKey) => key === "from" || key === "to"

  const createDateField = (key: "from" | "to", message: string) =>
    (fields[key]?.required ?? requiredByDefault(key))
      ? z.string().min(1, message)
      : z.string().optional().default("")

  const isActiveSchema =
    (fields.isActive?.required ?? requiredByDefault("isActive"))
      ? z.boolean()
      : z.boolean().default(true)

  return z
    .object({
      from: createDateField("from", "From date is required"),
      to: createDateField("to", "To date is required"),
      isActive: isActiveSchema,
    })
    .superRefine((data, ctx) => {
      if (data.from && data.to) {
        const fromDate = new Date(data.from)
        const toDate = new Date(data.to)
        if (fromDate > toDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "From date must be equal to or earlier than To date",
            path: ["from"],
          })
        }
      }
    })
}

export function createDefaultWeekOffSchema(rawConfig?: DefaultWeekOffConfig | DefaultWeekOffFieldsConfig) {
  return z.object({
    doNotConsiderWeekOff: z.array(createDefaultWeekOffItemSchema(rawConfig)).optional(),
  })
}

export const defaultWeekOffSchema = createDefaultWeekOffSchema()

export type DefaultWeekOffFormData = z.infer<typeof defaultWeekOffSchema>

export const EMPTY_DEFAULT_WEEK_OFF_FORM_VALUES: DefaultWeekOffFormData = {
  doNotConsiderWeekOff: [],
}