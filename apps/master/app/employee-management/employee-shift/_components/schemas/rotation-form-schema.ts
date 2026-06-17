import { z } from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export const rotationSchema = z.object({
  parseID: z.string().optional(),
  days: z.number().min(1, "Days must be at least 1"),
  priority: z.number().min(1, "Priority must be at least 1"),
  shiftGroupCode: z
    .string()
    .min(1, "Shift group is required")
    .refine((val) => !hasDisallowedChars(val), {
      message: "Shift group code can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
    }),
  shiftCode: z
    .string()
    .min(1, "Shift is required")
    .refine((val) => !hasDisallowedChars(val), {
      message: "Shift code can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
    }),
})

export type RotationItem = z.infer<typeof rotationSchema>

export const EMPTY_ROTATION: RotationItem = {
  parseID: "",
  days: 5,
  priority: 1,
  shiftGroupCode: "",
  shiftCode: "",
}