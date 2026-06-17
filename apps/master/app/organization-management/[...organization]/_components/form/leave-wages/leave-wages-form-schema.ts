import { z } from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export const createLeaveWagesSchema = (
  organizationData: any,
  isEditMode: boolean,
  editData?: any
) => {
  return z.object({
    skillLevel: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !hasDisallowedChars(val), {
            message: "Skill level can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
          })
      : z
          .string()
          .trim()
          .min(1, "Skill level is required")
          .refine((val) => !hasDisallowedChars(val), {
            message: "Skill level can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
          }),
    basicWage: z.coerce
      .number()
      .min(0, "Basic wage cannot be negative")
      .positive("Basic wage must be positive"),
    VDA: z.coerce.number().min(0, "VDA cannot be negative"),
    total: z.coerce.number(),
    EPF: z.coerce.number(),
    ESI: z.coerce.number(),
    pfAdminCharges: z.coerce.number(),
    includeEPF: z.boolean(),
    includeESI: z.boolean(),
    includePFAdmin: z.boolean(),
  })
}