import * as z from "zod"

const hasDisallowedChars = (str: string) => {
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

// Code fields: no spaces, only letters, numbers, hyphens
const hasInvalidCodeChars = (str: string) => {
  const regex = /^[a-zA-Z0-9\-]+$/
  return !regex.test(str)
}

const codeHasSpaces = (str: string) => /\s/.test(str)

// Title fields: letters, numbers, spaces, . , ' ` ( ) / _ -
const hasInvalidTitleChars = (str: string) => {
  const regex = /^[a-zA-Z0-9\s.,'\`()/\-_]+$/
  return !regex.test(str)
}

export type CompanyDetailsFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}

export type CompanyDetailsFieldKey =
  | "typeOfCompany"
  | "workTypeCode"
  | "workTypeTitle"
  | "areaOfWorkCode"
  | "areaOfWorkTitle"

export type CompanyDetailsFieldsConfig = Partial<
  Record<CompanyDetailsFieldKey, CompanyDetailsFieldConfig>
>

export type CompanyDetailsTabConfig = {
  tabRequired?: boolean
  fields?: CompanyDetailsFieldsConfig
}

export type CompanyDetailsFormData = {
  typeOfCompany: string
  workType: {
    workTypeCode: string
    workTypeTitle: string
  }
  areaOfWork: {
    areaOfWorkCode: string
    areaOfWorkTitle: string
  }
}

export function normalizeCompanyDetailsConfig(
  rawConfig: CompanyDetailsFieldsConfig | CompanyDetailsTabConfig | undefined
): CompanyDetailsTabConfig {
  if (rawConfig && typeof rawConfig === "object" && "fields" in rawConfig) {
    return rawConfig as CompanyDetailsTabConfig
  }
  return {
    tabRequired: true,
    fields: (rawConfig ?? {}) as CompanyDetailsFieldsConfig,
  }
}

export function createCompanyDetailsSchema(
  rawConfig?: CompanyDetailsFieldsConfig | CompanyDetailsTabConfig
) {
  const tabConfig = normalizeCompanyDetailsConfig(rawConfig)
  const fieldConfig = tabConfig.fields ?? {}

  const codeField = (key: CompanyDetailsFieldKey, label: string) => {
    const isRequired = fieldConfig[key]?.required === true
    const base = isRequired
      ? z.string().min(1, `${label} is required`)
      : z.string().optional().default("")
    return base
      .refine((val) => !val || !codeHasSpaces(val), {
        message: `${label} must not contain spaces`,
      })
      .refine((val) => !val || !hasInvalidCodeChars(val), {
        message: `${label} can only contain letters, numbers, and hyphens (-)`,
      })
  }

  const titleField = (key: CompanyDetailsFieldKey, label: string) => {
    const isRequired = fieldConfig[key]?.required === true
    const base = isRequired
      ? z.string().min(1, `${label} is required`)
      : z.string().optional().default("")
    return base.refine((val) => !val || !hasInvalidTitleChars(val), {
      message: `${label} can only contain letters, numbers, spaces, and . , ' \` ( ) / _ -`,
    })
  }

  const typeOfCompanySchema =
    fieldConfig.typeOfCompany?.required !== false
      ? z
          .string()
          .min(1, "Type of company is required")
          .refine((val) => !hasDisallowedChars(val), {
            message: "Type of company can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
          })
      : z
          .string()
          .optional()
          .default("")
          .refine((val) => !val || !hasDisallowedChars(val), {
            message: "Type of company can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
          })

  return z.object({
    typeOfCompany: typeOfCompanySchema,
    workType: z.object({
      workTypeCode: codeField("workTypeCode", "Work type code"),
      workTypeTitle: titleField("workTypeTitle", "Work type title"),
    }),
    areaOfWork: z.object({
      areaOfWorkCode: codeField("areaOfWorkCode", "Area of work code"),
      areaOfWorkTitle: titleField("areaOfWorkTitle", "Area of work title"),
    }),
  })
}

export const companyDetailsSchema = createCompanyDetailsSchema()
