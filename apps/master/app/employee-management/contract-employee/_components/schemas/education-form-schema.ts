import { z } from "zod"

// Education title, course, stream, college: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

export type EducationFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type EducationFieldKey =
  | "educationTitle"
  | "courseTitle"
  | "stream"
  | "college"
  | "yearOfPassing"
  | "monthOfPassing"
  | "percentage"
  | "isVerified"
export type EducationFieldsConfig = Partial<Record<EducationFieldKey, EducationFieldConfig>>
export type EducationConfig = {
  tabRequired?: boolean
  fields?: EducationFieldsConfig
}

export function normalizeEducationConfig(raw: unknown): {
  tabRequired: boolean
  fields: EducationFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const root = raw as EducationConfig
  return {
    tabRequired: root.tabRequired ?? false,
    fields: root.fields ?? {},
  }
}

export function createEducationSchema(rawConfig?: EducationConfig) {
  const normalized = normalizeEducationConfig(rawConfig)
  const fields = normalized.fields

  type CharValidation = { validate: (val: string) => boolean; message: string }

  const stringField = (key: Exclude<EducationFieldKey, "monthOfPassing" | "isVerified" | "yearOfPassing" | "percentage">, msg: string, cv?: CharValidation) =>
    fields[key]?.required
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  const numberStringField = (key: "yearOfPassing" | "percentage", msg: string, hint: string) =>
    fields[key]?.required
      ? z.string().min(1, msg).regex(/^\d+(\.\d+)?$/, hint)
      : z.string().optional().default("").refine((val) => !val || /^\d+(\.\d+)?$/.test(val), hint)

  const monthField = (fields.monthOfPassing?.required
    ? z.number().min(1, "Month of passing is required").max(12, "Month of passing must be between 1 and 12")
    : z.number().min(1).max(12).optional().default(1))

  const verifiedField = fields.isVerified?.required
    ? z.boolean()
    : z.boolean().optional().default(false)

  const NAME_CV: CharValidation = {
    validate: isValidNameChar,
    message: "can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
  }

  return z.object({
    educationTitle: stringField("educationTitle", "Education title is required", {
      ...NAME_CV, message: `Education title ${NAME_CV.message}`,
    }),
    courseTitle: stringField("courseTitle", "Course title is required", {
      ...NAME_CV, message: `Course title ${NAME_CV.message}`,
    }),
    stream: stringField("stream", "Stream is required", {
      ...NAME_CV, message: `Stream ${NAME_CV.message}`,
    }),
    college: stringField("college", "College/University is required", {
      ...NAME_CV, message: `College/University ${NAME_CV.message}`,
    }),
    yearOfPassing: numberStringField("yearOfPassing", "Year of passing is required", "Year of passing must contain numbers only"),
    monthOfPassing: monthField,
    percentage: numberStringField("percentage", "Percentage/CGPA is required", "Percentage/CGPA must contain numbers only"),
    isVerified: verifiedField,
  })
}

export const educationSchema = createEducationSchema()

export type Education = z.infer<typeof educationSchema>

export const EMPTY_EDUCATION: Education = {
  educationTitle: "",
  courseTitle: "",
  stream: "",
  college: "",
  yearOfPassing: "",
  monthOfPassing: 1,
  percentage: "",
  isVerified: false,
}

export const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]