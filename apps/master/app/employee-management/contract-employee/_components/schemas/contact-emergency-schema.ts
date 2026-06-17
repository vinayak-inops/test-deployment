import * as z from "zod"

// Country, State, City, Taluka, Contact Person names: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

// Address lines: all characters allowed except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type ContactEmergencyFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type ContactEmergencyEmailFieldKey = "primaryEmailID" | "secondaryEmailID"
export type ContactEmergencyContactFieldKey =
  | "primaryContactNo"
  | "secondaryContactNumber"
  | "emergencyContactPerson1"
  | "emergencyContactNo1"
  | "emergencyContactPerson2"
  | "emergencyContactNo2"
export type ContactEmergencyAddressFieldKey =
  | "addressLine1"
  | "addressLine2"
  | "country"
  | "state"
  | "city"
  | "pinCode"
  | "taluka"
  | "isVerified"

export type ContactEmergencyEmailFieldsConfig = Partial<
  Record<ContactEmergencyEmailFieldKey, ContactEmergencyFieldConfig>
>
export type ContactEmergencyContactFieldsConfig = Partial<
  Record<ContactEmergencyContactFieldKey, ContactEmergencyFieldConfig>
>
export type ContactEmergencyAddressFieldsConfig = Partial<
  Record<ContactEmergencyAddressFieldKey, ContactEmergencyFieldConfig>
>

export type ContactEmergencyConfig = {
  tabRequired?: boolean
  fields?: {
    emailID?: { fields?: ContactEmergencyEmailFieldsConfig }
    contactNumber?: { fields?: ContactEmergencyContactFieldsConfig }
    address?: {
      permanentAddress?: { fields?: ContactEmergencyAddressFieldsConfig }
      temporaryAddress?: { fields?: ContactEmergencyAddressFieldsConfig }
    }
  }
  emailID?: { fields?: ContactEmergencyEmailFieldsConfig }
  contactNumber?: { fields?: ContactEmergencyContactFieldsConfig }
  address?: {
    permanentAddress?: { fields?: ContactEmergencyAddressFieldsConfig }
    temporaryAddress?: { fields?: ContactEmergencyAddressFieldsConfig }
  }
}

export function normalizeContactEmergencyConfig(raw: unknown): {
  tabRequired: boolean
  emailID: { fields: ContactEmergencyEmailFieldsConfig }
  contactNumber: { fields: ContactEmergencyContactFieldsConfig }
  address: {
    permanentAddress: { fields: ContactEmergencyAddressFieldsConfig }
    temporaryAddress: { fields: ContactEmergencyAddressFieldsConfig }
  }
} {
  const asObject = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  const extractFields = <T extends Record<string, unknown>>(value: unknown): T => {
    const obj = asObject(value)
    if ("fields" in obj && obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
      return obj.fields as T
    }
    return obj as T
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: true,
      emailID: { fields: {} },
      contactNumber: { fields: {} },
      address: {
        permanentAddress: { fields: {} },
        temporaryAddress: { fields: {} },
      },
    }
  }

  const root = raw as ContactEmergencyConfig
  const source = asObject((root as { fields?: unknown }).fields ?? root)
  const addressSource = asObject(source.address)
  const permanentAddressSource = asObject(addressSource.permanentAddress)
  const temporaryAddressSource = asObject(addressSource.temporaryAddress)

  return {
    tabRequired: root.tabRequired ?? true,
    emailID: {
      fields: extractFields<ContactEmergencyEmailFieldsConfig>(source.emailID),
    },
    contactNumber: {
      fields: extractFields<ContactEmergencyContactFieldsConfig>(source.contactNumber),
    },
    address: {
      permanentAddress: {
        fields: extractFields<ContactEmergencyAddressFieldsConfig>(permanentAddressSource),
      },
      temporaryAddress: {
        fields: extractFields<ContactEmergencyAddressFieldsConfig>(temporaryAddressSource),
      },
    },
  }
}

export function createContactEmergencySchema(rawConfig?: ContactEmergencyConfig) {
  const normalized = normalizeContactEmergencyConfig(rawConfig)
  const emailFields = normalized.emailID.fields
  const contactFields = normalized.contactNumber.fields
  const permanentAddressFields = normalized.address.permanentAddress.fields
  const temporaryAddressFields = normalized.address.temporaryAddress.fields

  const requiredEmail = (
    key: ContactEmergencyEmailFieldKey,
    requiredMsg: string,
    invalidMsg: string
  ) =>
    emailFields[key]?.required
      ? z.string().min(1, requiredMsg).email(invalidMsg)
      : z.string().email(invalidMsg).optional().or(z.literal(""))

  const requiredContact = (
    key: ContactEmergencyContactFieldKey,
    requiredMsg: string,
    exactMsg: string
  ) =>
    (contactFields[key]?.required ?? key === "primaryContactNo")
      ? z.string().min(1, requiredMsg).regex(/^\d{10}$/, exactMsg)
      : z.string().regex(/^\d{10}$/, exactMsg).optional().or(z.literal(""))

  const requiredContactName = (
    key: ContactEmergencyContactFieldKey,
    requiredMsg: string,
    minMsg: string,
    maxMsg: string
  ) =>
    contactFields[key]?.required
      ? z
          .string()
          .min(1, requiredMsg)
          .min(2, minMsg)
          .max(100, maxMsg)
          .refine((val) => isValidNameChar(val), {
            message: "Name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
          })
      : z
          .string()
          .min(2, minMsg)
          .max(100, maxMsg)
          .optional()
          .or(z.literal(""))
          .refine((val) => !val || isValidNameChar(val), {
            message: "Name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
          })

  const pinCodeSchema = (required: boolean) => {
    const base = required ? z.string().min(1, "Pin Code is required") : z.string().optional()
    return base.refine((val) => {
      if (!val) return true
      return /^[0-9]{6}$/.test(val)
    }, "Pin Code must be 6 digits")
  }

  const requiredAddress = (
    key: ContactEmergencyAddressFieldKey,
    msg: string,
    requiredByDefault = false,
    charValidator: { validate: (v: string) => boolean; message: string } = {
      validate: isValidNameChar,
      message: `${msg.replace(" is required", "")} can only contain letters, numbers, spaces, and . , ' \` ( ) / _ -`,
    }
  ) =>
    permanentAddressFields[key]?.required ?? requiredByDefault
      ? z
          .string()
          .min(1, msg)
          .refine((val) => charValidator.validate(val), { message: charValidator.message })
      : z
          .string()
          .optional()
          .default("")
          .refine((val) => !val || charValidator.validate(val), { message: charValidator.message })

  const requiredTemporaryAddress = (
    key: ContactEmergencyAddressFieldKey,
    msg: string,
    charValidator: { validate: (v: string) => boolean; message: string } = {
      validate: isValidNameChar,
      message: `${msg.replace(" is required", "")} can only contain letters, numbers, spaces, and . , ' \` ( ) / _ -`,
    }
  ) =>
    temporaryAddressFields[key]?.required
      ? z
          .string()
          .min(1, msg)
          .refine((val) => charValidator.validate(val), { message: charValidator.message })
      : z
          .string()
          .optional()
          .default("")
          .refine((val) => !val || charValidator.validate(val), { message: charValidator.message })

  return z.object({
    emailID: z.object({
      primaryEmailID: requiredEmail(
        "primaryEmailID",
        "Primary email ID is required",
        "Please enter a valid primary email address"
      ),
      secondaryEmailID: requiredEmail(
        "secondaryEmailID",
        "Secondary email ID is required",
        "Please enter a valid secondary email address"
      ),
    }),
    contactNumber: z.object({
      primaryContactNo: requiredContact(
        "primaryContactNo",
        "Primary contact number is required",
        "Primary contact number must be exactly 10 digits"
      ),
      secondaryContactNumber: requiredContact(
        "secondaryContactNumber",
        "Secondary contact number is required",
        "Secondary contact number must be exactly 10 digits"
      ),
      emergencyContactPerson1: requiredContactName(
        "emergencyContactPerson1",
        "Emergency contact person 1 name is required",
        "Emergency contact person 1 name must be at least 2 characters",
        "Name must be less than 100 characters"
      ),
      emergencyContactNo1: requiredContact(
        "emergencyContactNo1",
        "Emergency contact number 1 is required",
        "Emergency contact number 1 must be exactly 10 digits"
      ),
      emergencyContactPerson2: requiredContactName(
        "emergencyContactPerson2",
        "Emergency contact person 2 name is required",
        "Emergency contact person 2 name must be at least 2 characters",
        "Name must be less than 100 characters"
      ),
      emergencyContactNo2: requiredContact(
        "emergencyContactNo2",
        "Emergency contact number 2 is required",
        "Emergency contact number 2 must be exactly 10 digits"
      ),
    }),
    address: z.object({
      permanentAddress: z.object({
        addressLine1: (permanentAddressFields.addressLine1?.required ?? true)
          ? z.string().min(1, "Address Line 1 is required")
          : z.string().optional().default(""),
        addressLine2: permanentAddressFields.addressLine2?.required
          ? z.string().min(1, "Address Line 2 is required")
          : z.string().optional().default(""),
        country: requiredAddress("country", "Country is required", true),
        state: requiredAddress("state", "State is required", true),
        city: requiredAddress("city", "City is required", true),
        pinCode: pinCodeSchema(Boolean(permanentAddressFields.pinCode?.required)),
        taluka: requiredAddress("taluka", "Taluka is required"),
        isVerified:
          permanentAddressFields.isVerified?.required === true
            ? z.boolean()
            : z.boolean().optional(),
      }),
      temporaryAddress: z
        .object({
          addressLine1: temporaryAddressFields.addressLine1?.required
            ? z.string().min(1, "Address Line 1 is required")
            : z.string().optional().default(""),
          addressLine2: temporaryAddressFields.addressLine2?.required
            ? z.string().min(1, "Address Line 2 is required")
            : z.string().optional().default(""),
          country: requiredTemporaryAddress("country", "Country is required"),
          state: requiredTemporaryAddress("state", "State is required"),
          city: requiredTemporaryAddress("city", "City is required"),
          pinCode: pinCodeSchema(Boolean(temporaryAddressFields.pinCode?.required)),
          taluka: requiredTemporaryAddress("taluka", "Taluka is required"),
          isVerified:
            temporaryAddressFields.isVerified?.required === true
              ? z.boolean()
              : z.boolean().optional(),
        })
        .optional(),
    }),
  })
}

export const contactEmergencySchema = createContactEmergencySchema()

export type ContactEmergencyData = z.infer<typeof contactEmergencySchema>