import * as z from "zod"

// Employee ID: letters, numbers, hyphens only — no spaces or underscores
const isValidEmployeeID = (str: string) => /^[a-zA-Z0-9-]+$/.test(str)

// Names & Nationality: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

// Identification mark: all characters allowed except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type PersonalInformationFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type PersonalInformationFieldKey =
  | "photo"
  | "employeeID"
  | "firstName"
  | "middleName"
  | "lastName"
  | "fatherHusbandName"
  | "gender"
  | "birthDate"
  | "bloodGroup"
  | "nationality"
  | "maritalStatus"
  | "caste"
  | "identificationMark"
export type PersonalInformationFieldsConfig = Partial<
  Record<PersonalInformationFieldKey, PersonalInformationFieldConfig>
>
export type PersonalInformationTabConfig = {
  tabRequired?: boolean
  fields?: PersonalInformationFieldsConfig
}

const DEFAULT_REQUIRED: Partial<Record<PersonalInformationFieldKey, boolean>> = {
  employeeID: true,
  firstName: true,
  gender: true,
  nationality: true,
  identificationMark: true,
}

export function normalizePersonalInformationConfig(raw: unknown): {
  tabRequired: boolean
  fields: PersonalInformationFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { tabRequired: true, fields: {} }
  }

  const obj = raw as Record<string, unknown>
  if (obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
    const root = raw as PersonalInformationTabConfig
    return {
      tabRequired: root.tabRequired ?? true,
      fields: root.fields ?? {},
    }
  }

  return {
    tabRequired: true,
    fields: obj as PersonalInformationFieldsConfig,
  }
}

export function createPersonalInformationSchema(
  rawConfig?: PersonalInformationFieldsConfig | PersonalInformationTabConfig
) {
  const normalized = normalizePersonalInformationConfig(rawConfig)
  const fields = normalized.fields
  const required = (key: PersonalInformationFieldKey) =>
    fields[key]?.required ?? DEFAULT_REQUIRED[key] ?? false

  const isAtLeast18 = (dateString: string) => {
    const birthDate = new Date(dateString)
    if (Number.isNaN(birthDate.getTime())) return false
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (birthDate > today) return false
    const eighteenYearsAgo = new Date(today)
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18)
    return birthDate <= eighteenYearsAgo
  }

  const birthDateSchema = z.string().optional().refine((date) => {
    if (!date) return true
    return isAtLeast18(date)
  }, "Employee must be at least 18 years old")

  const stringFieldWithValidation = (
    key: PersonalInformationFieldKey,
    message: string,
    minLen?: number,
    maxLen?: number,
    charValidation?: { validate: (val: string) => boolean; message: string }
  ) => {
    if (required(key)) {
      let schema = z.string().min(minLen || 1, message)
      if (maxLen) {
        schema = schema.max(maxLen, `Must be less than ${maxLen} characters`)
      }
      if (charValidation) {
        return schema.refine((val) => charValidation.validate(val), { message: charValidation.message })
      }
      return schema
    } else {
      let schema: z.ZodTypeAny = z.string().optional()
      if (minLen) {
        schema = schema.refine((val) => !val || val.length >= minLen, message)
      }
      if (maxLen) {
        schema = schema.refine((val) => !val || val.length <= maxLen, `Must be less than ${maxLen} characters`)
      }
      if (charValidation) {
        return schema.refine((val) => !val || charValidation.validate(val), { message: charValidation.message })
      }
      return schema
    }
  }

  return z.object({
    photo: required("photo") ? z.string().min(1, "Photo is required") : z.string().optional(),
    employeeID: stringFieldWithValidation("employeeID", "Employee ID is required", 1, 20, {
      validate: isValidEmployeeID,
      message: "Employee ID can only contain letters, numbers, and hyphens (-). No spaces allowed.",
    }),
    firstName: stringFieldWithValidation("firstName", "First name must be at least 2 characters", 2, 50, {
      validate: isValidNameChar,
      message: "First name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
    middleName: stringFieldWithValidation("middleName", "Middle name is required", 1, 50, {
      validate: isValidNameChar,
      message: "Middle name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
    lastName: stringFieldWithValidation("lastName", "Last name is required", 1, 50, {
      validate: isValidNameChar,
      message: "Last name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
    fatherHusbandName: stringFieldWithValidation("fatherHusbandName", "Father / Husband name is required", 1, 100, {
      validate: isValidNameChar,
      message: "Father / Husband name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
    gender: required("gender")
      ? z.enum(["Male", "Female", "Other", "Prefer not to say"], {
          required_error: "Please select a gender",
        })
      : z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional(),
    birthDate: required("birthDate")
      ? z.string().min(1, "Birth date is required").refine((date) => {
          if (!date) return false
          return isAtLeast18(date)
        }, "Employee must be at least 18 years old")
      : birthDateSchema,
    bloodGroup: required("bloodGroup")
      ? z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
          required_error: "Please select a blood group",
        })
      : z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]).optional(),
    nationality: stringFieldWithValidation("nationality", "Nationality must be at least 2 characters", 2, 50, {
      validate: isValidNameChar,
      message: "Nationality can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
    maritalStatus: required("maritalStatus")
      ? z.enum(["Married", "Unmarried", "Divorced", "Widowed"], {
          required_error: "Please select marital status",
        })
      : z.enum(["Married", "Unmarried", "Divorced", "Widowed"]).optional(),
    caste: stringFieldWithValidation("caste", "Caste is required", 1, 100),
    identificationMark: stringFieldWithValidation("identificationMark", "Identification mark is required", 1, 200, {
      validate: hasNoScriptContent,
      message: "Code or script content is not allowed in identification mark",
    }),
  })
}

export const personalInformationSchema = createPersonalInformationSchema()

export type PersonalInformationData = z.infer<typeof personalInformationSchema>