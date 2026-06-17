import { z } from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export const weekOffSchema = z.object({
  parseID: z
    .string()
    .optional()
    .refine((val) => !val || !hasDisallowedChars(val), {
      message: "Parse ID can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
    }),
  week: z.number().min(1, "Week must be at least 1"),
  weekOff: z.array(z.number().min(1).max(7)).default([]),
})

export type WeekOffItem = z.infer<typeof weekOffSchema>

export const EMPTY_WEEK_OFF: WeekOffItem = {
  parseID: "",
  week: 1,
  weekOff: [],
}