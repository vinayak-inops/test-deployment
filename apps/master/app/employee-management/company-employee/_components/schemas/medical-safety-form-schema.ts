import * as z from "zod"

// Remark: all characters allowed except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type MedicalSafetyFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type MedicalSafetyFieldKey =
  | "vaccine1"
  | "vaccine2"
  | "vaccine3"
  | "vaccine1Certificate"
  | "vaccine2Certificate"
  | "vaccine3Certificate"
  | "medicalVerificationRemark"
export type MedicalSafetyFieldsConfig = Partial<Record<MedicalSafetyFieldKey, MedicalSafetyFieldConfig>>
export type MedicalSafetyConfig = {
  tabRequired?: boolean
  fields?: MedicalSafetyFieldsConfig
}

export function normalizeMedicalSafetyConfig(raw: unknown): {
  tabRequired: boolean
  fields: MedicalSafetyFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const root = raw as MedicalSafetyConfig
  return {
    tabRequired: root.tabRequired ?? false,
    fields: root.fields ?? {},
  }
}

export function createCovidVaccineSchema(rawConfig?: MedicalSafetyConfig) {
  const normalized = normalizeMedicalSafetyConfig(rawConfig)
  const fields = normalized.fields

  const booleanField = (key: "vaccine1" | "vaccine2" | "vaccine3") =>
    (fields[key]?.required ?? true) ? z.boolean() : z.boolean().optional().default(false)

  const certificateField = (
    key: "vaccine1Certificate" | "vaccine2Certificate" | "vaccine3Certificate",
    msg: string
  ) =>
    fields[key]?.required ? z.string().min(1, msg) : z.string().optional().default("")

  const remarkSchema = fields["medicalVerificationRemark"]?.required
    ? z.string().min(1, "Medical verification remark is required").refine(hasNoScriptContent, {
        message: "Medical verification remark must not contain code or script content",
      })
    : z.string().optional().default("").refine((val) => !val || hasNoScriptContent(val), {
        message: "Medical verification remark must not contain code or script content",
      })

  return z.object({
    vaccine1: booleanField("vaccine1"),
    vaccine2: booleanField("vaccine2"),
    vaccine3: booleanField("vaccine3"),
    vaccine1Certificate: certificateField("vaccine1Certificate", "First dose certificate is required"),
    vaccine2Certificate: certificateField("vaccine2Certificate", "Second dose certificate is required"),
    vaccine3Certificate: certificateField("vaccine3Certificate", "Booster dose certificate is required"),
    medicalVerificationRemark: remarkSchema,
  })
}

export const covidVaccineSchema = createCovidVaccineSchema()

export type CovidVaccine = z.infer<typeof covidVaccineSchema>

export const EMPTY_COVID_VACCINE: CovidVaccine = {
  vaccine1: false,
  vaccine2: false,
  vaccine3: false,
  vaccine1Certificate: "",
  vaccine2Certificate: "",
  vaccine3Certificate: "",
  medicalVerificationRemark: "",
}