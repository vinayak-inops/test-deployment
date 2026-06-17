import { z } from "zod"

const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type ChildrenAdmissionFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type ChildrenAdmissionFieldKey =
  | "name"
  | "gender"
  | "dateOfBirth"
  | "dateOfAdmission"
  | "nameOfSchool"
  | "schoolAddress"
export type ChildrenAdmissionFieldsConfig = Partial<
  Record<ChildrenAdmissionFieldKey, ChildrenAdmissionFieldConfig>
>
export type ChildrenAdmissionConfig = {
  tabRequired?: boolean
  fields?: ChildrenAdmissionFieldsConfig
}

export function normalizeChildrenAdmissionConfig(raw: unknown): {
  tabRequired: boolean
  fields: ChildrenAdmissionFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const root = raw as ChildrenAdmissionConfig
  return {
    tabRequired: root.tabRequired ?? false,
    fields: root.fields ?? {},
  }
}

export function createChildrenAdmissionSchema(rawConfig?: ChildrenAdmissionConfig) {
  const normalized = normalizeChildrenAdmissionConfig(rawConfig)
  const fields = normalized.fields

  const requiredByDefault = (key: ChildrenAdmissionFieldKey) =>
    key === "name" || key === "gender" || key === "dateOfBirth"

  type CV = { validate: (val: string) => boolean; message: string }

  const fieldSchema = (key: ChildrenAdmissionFieldKey, msg: string, cv?: CV) =>
    (fields[key]?.required ?? requiredByDefault(key))
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  return z.object({
    name: fieldSchema("name", "Child name is required", {
      validate: isValidNameChar,
      message: "Child name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
    gender: fieldSchema("gender", "Gender is required"),
    dateOfBirth: fieldSchema("dateOfBirth", "Date of birth is required").refine(
      (val) => !val || new Date(val) <= new Date(),
      { message: "Date of birth cannot be in the future" }
    ),
    dateOfAdmission: fieldSchema("dateOfAdmission", "Date of admission is required").refine(
      (val) => !val || new Date(val) <= new Date(),
      { message: "Date of admission cannot be in the future" }
    ),
    nameOfSchool: fieldSchema("nameOfSchool", "School name is required", {
      validate: hasNoScriptContent,
      message: "School name must not contain code or script content",
    }),
    schoolAddress: fieldSchema("schoolAddress", "School address is required", {
      validate: hasNoScriptContent,
      message: "School address must not contain code or script content",
    }),
  })
}

export const childrenAdmissionSchema = createChildrenAdmissionSchema()

export type ChildrenAdmission = z.infer<typeof childrenAdmissionSchema>

export const EMPTY_CHILDREN_ADMISSION: ChildrenAdmission = {
  name: "",
  gender: "",
  dateOfBirth: "",
  dateOfAdmission: "",
  nameOfSchool: "",
  schoolAddress: "",
}
