import { z } from "zod"

/**
 * Validation schema for Basic Employee Information (shift assignment) form.
 * Kept in a separate file so validation rules can be reused and tested independently.
 */

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export const basicEmployeeInformationFormSchema = z
  .object({
    shiftGroupCode: z
      .string()
      .min(1, "Shift group is required")
      .refine((val) => !hasDisallowedChars(val), {
        message: "Shift group code can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
      }),
    shiftGroupName: z
      .string()
      .optional()
      .refine((val) => !val || !hasDisallowedChars(val), {
        message: "Shift group name can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
      }),
    shiftCode: z
      .string()
      .min(1, "Shift is required")
      .refine((val) => !hasDisallowedChars(val), {
        message: "Shift code can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
      }),
    shiftName: z
      .string()
      .optional()
      .refine((val) => !val || !hasDisallowedChars(val), {
        message: "Shift name can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
      }),
    shift: z.record(z.unknown()).optional(),
    grace: z.record(z.unknown()).optional(),
    fromDate: z
      .string()
      .min(1, "From date is required")
      .refine((val) => !Number.isNaN(Date.parse(val)), "From date must be a valid date"),
    toDate: z
      .string()
      .min(1, "To date is required")
      .refine((val) => !Number.isNaN(Date.parse(val)), "To date must be a valid date"),
    isAutomatic: z.boolean(),
    isActive: z.boolean(),
    isRotational: z.boolean(),
    isFixedShift: z.boolean(),
  })
  .refine(
    (data) => {
      if (!data.fromDate || !data.toDate) return true
      const from = Date.parse(data.fromDate)
      const to = Date.parse(data.toDate)
      if (Number.isNaN(from) || Number.isNaN(to)) return true
      return to >= from
    },
    { message: "To date must be on or after from date", path: ["toDate"] }
  )

export type BasicEmployeeInformationFormSchema = z.infer<typeof basicEmployeeInformationFormSchema>

/** Result of validating form values: either success with data or failure with field errors */
export interface BasicEmployeeInformationValidationResult {
  success: boolean
  data?: BasicEmployeeInformationFormSchema
  errors?: Partial<Record<keyof BasicEmployeeInformationFormSchema, string>>
}

/**
 * Validates form values and returns either parsed data or field-level error messages.
 * Use this in the form's submit handler to control validation and show errors.
 */
export function validateBasicEmployeeInformationForm(
  values: unknown
): BasicEmployeeInformationValidationResult {
  const result = basicEmployeeInformationFormSchema.safeParse(values)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errors: Partial<Record<string, string>> = {}
  const issueList = result.error.flatten()
  if (issueList.fieldErrors) {
    for (const [field, messages] of Object.entries(issueList.fieldErrors)) {
      if (Array.isArray(messages) && messages.length > 0 && messages[0]) {
        errors[field] = messages[0]
      }
    }
  }
  return { success: false, errors }
}