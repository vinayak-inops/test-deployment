import * as z from "zod"

// Code fields: only letters, numbers, hyphens — no spaces or underscores
const hasDisallowedCharsCode = (str: string) => {
  const regex = /^[a-zA-Z0-9\-]+$/
  return !regex.test(str)
}

// Name/location fields: letters, numbers, spaces, . , ' ` ( ) / _ -
const hasDisallowedCharsName = (str: string) => {
  const regex = /^[a-zA-Z0-9\s.,`'()/_\-]+$/
  return !regex.test(str)
}

export type FieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}

export type BasicInformationFieldKey =
  | "contractorName"
  | "contractorCode"
  | "aadharNumber"
  | "panNumber"
  | "ownerName"
  | "ownerContactNo"
  | "ownerEmailId"
  | "fatherName"
  | "contactPersonName"
  | "contactPersonContactNo"
  | "contactPersonEmailId"
  | "birthDate"
  | "workLocation"
  | "contractorImage"
  | "serviceSince"
  | "isActive"

export type BasicInformationFieldsConfig = Partial<
  Record<BasicInformationFieldKey, FieldConfig>
>

export type BasicInformationTabConfig = {
  tabRequired?: boolean
  fields?: BasicInformationFieldsConfig
}

export type BasicInformationData = {
  contractorName: string
  contractorCode: string
  aadharNumber?: string
  panNumber?: string
  ownerName: string
  ownerContactNo?: string
  ownerEmailId?: string
  fatherName?: string
  contactPersonName?: string
  contactPersonContactNo?: string
  contactPersonEmailId?: string
  birthDate?: string
  workLocation?: string
  contractorImage?: string
  serviceSince?: string
  isActive?: boolean
}

export function normalizeBasicInformationConfig(
  rawConfig: BasicInformationFieldsConfig | BasicInformationTabConfig | undefined
): BasicInformationTabConfig {
  if (rawConfig && typeof rawConfig === "object" && "fields" in rawConfig) {
    return rawConfig as BasicInformationTabConfig
  }
  return {
    tabRequired: true,
    fields: (rawConfig ?? {}) as BasicInformationFieldsConfig,
  }
}

export function createBasicInformationSchema(
  rawConfig?: BasicInformationFieldsConfig | BasicInformationTabConfig
) {
  const tabConfig = normalizeBasicInformationConfig(rawConfig)
  const fieldConfig = tabConfig.fields ?? {}

  const NAME_CHARS_MSG = "can only contain letters, numbers, spaces, . , ' ` ( ) / _ -"

  const requiredName = (key: BasicInformationFieldKey, msg: string) =>
    (fieldConfig[key]?.required ?? true)
      ? z.string().min(1, msg).refine((val) => !hasDisallowedCharsName(val), {
          message: `${msg.replace(" is required", "")} ${NAME_CHARS_MSG}`,
        })
      : z.string().optional().refine((val) => !val || !hasDisallowedCharsName(val), {
          message: `${msg.replace(" is required", "")} ${NAME_CHARS_MSG}`,
        })

  const optionalEmail = () =>
    z.union([z.string().email("Invalid email format"), z.literal("")]).optional()

  return z.object({
    contractorName: requiredName("contractorName", "Contractor name is required"),
    contractorCode:
      (fieldConfig.contractorCode?.required ?? true)
        ? z.string().min(1, "Contractor code is required").refine((val) => !hasDisallowedCharsCode(val), {
            message: "Contractor code can only contain letters, numbers, and hyphens (-). Spaces and underscores are not allowed.",
          })
        : z.string().optional().refine((val) => !val || !hasDisallowedCharsCode(val), {
            message: "Contractor code can only contain letters, numbers, and hyphens (-). Spaces and underscores are not allowed.",
          }),
    aadharNumber: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{12}$/.test(val), "Aadhar number must be exactly 12 digits"),
    panNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val),
        "PAN number must be in format: ABCDE1234F"
      ),
    ownerName: requiredName("ownerName", "Owner name is required"),
    ownerContactNo:
      fieldConfig.ownerContactNo?.required ?? true
        ? z
            .string()
            .min(1, "Owner contact number is required")
            .regex(/^\d{10}$/, "Contact number must be exactly 10 digits")
        : z
            .string()
            .optional()
            .refine((val) => !val || /^\d{10}$/.test(val), "Contact number must be exactly 10 digits"),
    ownerEmailId:
      fieldConfig.ownerEmailId?.required ?? true
        ? z.string().min(1, "Owner email is required").email("Invalid email format")
        : optionalEmail(),
    fatherName: requiredName("fatherName", "Father name is required"),
    contactPersonName: requiredName("contactPersonName", "Contact person name is required"),
    contactPersonContactNo:
      fieldConfig.contactPersonContactNo?.required ?? true
        ? z
            .string()
            .min(1, "Contact person number is required")
            .regex(/^\d{10}$/, "Contact number must be exactly 10 digits")
        : z
            .string()
            .optional()
            .refine((val) => !val || /^\d{10}$/.test(val), "Contact number must be exactly 10 digits"),
    contactPersonEmailId:
      fieldConfig.contactPersonEmailId?.required ?? true
        ? z.string().min(1, "Contact person email is required").email("Invalid email format")
        : optionalEmail(),
    birthDate:
      fieldConfig.birthDate?.required ?? true
        ? z
            .string()
            .min(1, "Birth date is required")
            .refine((val) => {
              const birthDate = new Date(val)
              const today = new Date()
              today.setHours(23, 59, 59, 999)
              return birthDate <= today
            }, "Birth date cannot be in the future")
        : z
            .string()
            .optional()
            .refine((val) => {
              if (!val) return true
              const birthDate = new Date(val)
              const today = new Date()
              today.setHours(23, 59, 59, 999)
              return birthDate <= today
            }, "Birth date cannot be in the future"),
    workLocation: requiredName("workLocation", "Work location is required"),
    contractorImage:
      fieldConfig.contractorImage?.required ?? true
        ? z.string().min(1, "Contractor image is required")
        : z.string().optional().or(z.literal("")),
    serviceSince:
      fieldConfig.serviceSince?.required ?? true
        ? z
            .string()
            .min(1, "Service since date is required")
            .refine((val) => {
              const serviceDate = new Date(val)
              const today = new Date()
              today.setHours(23, 59, 59, 999)
              return serviceDate <= today
            }, "Service since date cannot be in the future")
        : z
            .string()
            .optional()
            .refine((val) => {
              if (!val) return true
              const serviceDate = new Date(val)
              const today = new Date()
              today.setHours(23, 59, 59, 999)
              return serviceDate <= today
            }, "Service since date cannot be in the future"),
    isActive: z.boolean().optional().default(true),
  })
}

export const basicInformationSchema = createBasicInformationSchema()