import { z } from "zod"

// All characters allowed except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type PoliceVerificationFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type PoliceVerificationFieldKey =
  | "verificationDate"
  | "nextVerificationDate"
  | "description"
  | "policeStationDetail"
  | "policeStationPinCode"
  | "documentPath"
  | "isActive"
export type PoliceVerificationFieldsConfig = Partial<
  Record<PoliceVerificationFieldKey, PoliceVerificationFieldConfig>
>
export type PoliceVerificationConfig = {
  tabRequired?: boolean
  fields?: PoliceVerificationFieldsConfig
}

export function normalizePoliceVerificationConfig(raw: unknown): {
  tabRequired: boolean
  fields: PoliceVerificationFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const config = raw as PoliceVerificationConfig
  return {
    tabRequired: config.tabRequired ?? false,
    fields: config.fields ?? {},
  }
}

export function createPoliceVerificationItemSchema(rawConfig?: PoliceVerificationConfig) {
  const normalized = normalizePoliceVerificationConfig(rawConfig)
  const fields = normalized.fields

  const requiredByDefault = (field: PoliceVerificationFieldKey) =>
    field === "verificationDate" ||
    field === "nextVerificationDate" ||
    field === "description" ||
    field === "policeStationDetail"

  const createStringField = (field: PoliceVerificationFieldKey, message: string) =>
    (fields[field]?.required ?? requiredByDefault(field))
      ? z.string().min(1, message).refine(hasNoScriptContent, {
          message: `${message.replace(" is required", "")} must not contain code or script content`,
        })
      : z.string().optional().default("").refine((val) => !val || hasNoScriptContent(val), {
          message: `${message.replace(" is required", "")} must not contain code or script content`,
        })

  const pinCodeSchema = (field: PoliceVerificationFieldKey, message: string) =>
    (fields[field]?.required ?? requiredByDefault(field))
      ? z
          .string()
          .min(1, message)
          .refine((val) => /^\d{6}$/.test(val), "Pin code must be exactly 6 digits")
      : z
          .string()
          .optional()
          .default("")
          .refine((val) => !val || /^\d{6}$/.test(val), "Pin code must be exactly 6 digits")

  return z
  .object({
    verificationDate: createStringField("verificationDate", "Verification date is required"),
    nextVerificationDate: createStringField("nextVerificationDate", "Next verification date is required"),
    description: createStringField("description", "Description is required"),
    policeStationDetail: createStringField("policeStationDetail", "Police station detail is required"),
    policeStationPinCode: pinCodeSchema("policeStationPinCode", "Police station pin code is required"),
    documentPath: (fields["documentPath"]?.required ?? requiredByDefault("documentPath"))
      ? z.string().min(1, "Document is required")
      : z.string().optional().default(""),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.verificationDate && data.nextVerificationDate) {
      const verificationDate = new Date(data.verificationDate)
      const nextVerificationDate = new Date(data.nextVerificationDate)

      if (verificationDate > nextVerificationDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Verification Date must be equal to or earlier than Expiry Date",
          path: ["verificationDate"],
        })
      }
    }

    if (data.verificationDate) {
      const verificationDate = new Date(data.verificationDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (verificationDate > today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Verification Date cannot be in the future",
          path: ["verificationDate"],
        })
      }
    }
  })
}

export const policeVerificationItemSchema = createPoliceVerificationItemSchema()

export const policeVerificationSchema = z.object({
  policeVerification: z
    .array(policeVerificationItemSchema)
    .min(1, "At least one police verification is required"),
})

export type PoliceVerificationFormData = z.infer<typeof policeVerificationSchema>
export type PoliceVerification = z.infer<typeof policeVerificationItemSchema>

export const EMPTY_POLICE_VERIFICATION: PoliceVerificationFormData["policeVerification"][number] = {
  verificationDate: "",
  nextVerificationDate: "",
  description: "",
  policeStationDetail: "",
  policeStationPinCode: "",
  documentPath: "",
  isActive: true,
}