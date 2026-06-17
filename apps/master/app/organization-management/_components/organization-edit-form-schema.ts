import { z } from "zod"

// Field-specific regex patterns
const ORG_NAME_CHARS = /^[a-zA-Z0-9\s_\-.,]+$/
const CODE_CHARS = /^[a-zA-Z0-9_\-]+$/
const NAME_CHARS = /^[a-zA-Z0-9\s_\-]+$/
const CITY_CHARS = /^[a-zA-Z0-9\s_\-]+$/

// Optional trimmed string — returns "" when empty (used for free-text fields)
const optionalFreeText = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : ""),
  z.string().default("")
)

// Optional trimmed string — returns undefined when empty (used for structured fields)
const optionalTrimmedString = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value
    const trimmedValue = value.trim()
    return trimmedValue === "" ? undefined : trimmedValue
  },
  z.string().optional()
)

export const organizationEditFormSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters")
    .refine((val) => ORG_NAME_CHARS.test(val), {
      message: "Organization name can only contain letters, numbers, spaces, underscores (_), hyphens (-), periods (.), and commas (,)",
    }),

  organizationCode: z
    .string()
    .refine((val) => !val || CODE_CHARS.test(val), {
      message: "Organization code can only contain letters, digits, hyphens (-), and underscores (_)",
    }),

  addressLine1: optionalFreeText
    .refine((value) => !value || value.length <= 200, "Address line 1 must not exceed 200 characters"),

  addressLine2: optionalFreeText
    .refine((value) => !value || value.length <= 200, "Address line 2 must not exceed 200 characters"),

  city: optionalTrimmedString
    .refine((value) => !value || value.length >= 2, "City must be at least 2 characters")
    .refine((value) => !value || value.length <= 50, "City must not exceed 50 characters")
    .refine((value) => !value || CITY_CHARS.test(value), {
      message: "City can only contain letters, numbers, spaces, underscores (_), and hyphens (-)",
    }),

  pinCode: optionalTrimmedString
    .refine((value) => !value || !/\s/.test(value), { message: "Pin code must not contain spaces" })
    .refine((value) => !value || /^\d+$/.test(value), { message: "Pin code must contain digits only (0-9)" })
    .refine((value) => !value || value.length >= 6, { message: "Pin code must be exactly 6 digits" })
    .refine((value) => !value || value.length <= 6, { message: "Pin code must be exactly 6 digits" }),

  description: optionalFreeText
    .refine((value) => !value || value.length <= 500, "Description must not exceed 500 characters"),

  logoFileName: optionalTrimmedString,

  emailId: z
    .string()
    .trim()
    .min(1, "Email ID is required")
    .email("Please enter a valid email address"),

  contactPersonContactNumber: z
    .string()
    .trim()
    .min(1, "Contact number is required")
    .refine((val) => /^\d+$/.test(val), { message: "Contact number must contain digits only" })
    .refine((val) => /^\d{10,15}$/.test(val), { message: "Contact number must be between 10-15 digits" }),

  registrationNo: z
    .string()
    .trim()
    .min(1, "Registration number is required")
    .min(2, "Registration number must be at least 2 characters")
    .max(50, "Registration number must not exceed 50 characters")
    .refine((val) => NAME_CHARS.test(val), {
      message: "Registration number can only contain letters, numbers, spaces, underscores (_), and hyphens (-)",
    }),

  tenantCode: z
    .string()
    .refine((val) => !val || CODE_CHARS.test(val), {
      message: "Tenant code can only contain letters, digits, hyphens (-), and underscores (_)",
    }),

  isActive: z.coerce
    .number()
    .refine((value) => value === 0 || value === 1, "Active status must be either 0 or 1"),

  firstMonthOfFinancialYear: z.coerce
    .number()
    .min(1, "First month must be at least 1")
    .max(12, "First month must not exceed 12"),
})

export type OrganizationEditFormData = z.infer<typeof organizationEditFormSchema>