import { z } from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export const createWagePeriodSchema = (
  organizationData: any,
  isEditMode: boolean,
  editData?: any
) => {
  return z.object({
    employeeCategory: z.object({
      employeeCategoryCode: isEditMode
        ? z
            .string()
            .optional()
            .refine((val) => !val || !hasDisallowedChars(val), {
              message: "Employee category code can only contain letters, numbers, spaces, underscores (_), and hyphens (-)",
            })
        : z
            .string()
            .trim()
            .min(1, "Employee category code is required")
            .refine((val) => !hasDisallowedChars(val), {
              message: "Employee category code can only contain letters, numbers, spaces, underscores (_), and hyphens (-)",
            }),
      employeeCategoryName: isEditMode
        ? z.string().optional()
        : z.string().trim().min(1, "Employee category name is required"),
    }),
    from: z.coerce
      .number()
      .min(1, "From must be at least 1")
      .max(31, "From must be at most 31"),
    to: z.coerce
      .number()
      .min(1, "To must be at least 1")
      .max(31, "To must be at most 31"),
  })
}