import { z } from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export const weekOffSchema = z.object({
  week: z.number().min(1, "Week must be at least 1"),
  weekOff: z.array(z.number().min(1).max(7)).default([]),
  _id: z.string().optional(),
  parentID: z.string().optional(),
  parentId: z.string().optional(),
  parseID: z.string().optional(),
}).passthrough()

export type WeekOffItem = z.infer<typeof weekOffSchema>

export const weekOffApplicationSchema = z
  .object({
    employeeID: z
      .string()
      .min(1, "Employee ID is required")
      .refine((val) => !hasDisallowedChars(val), {
        message: "Employee ID can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
      }),
    fromDate: z.string().min(1, "From date is required"),
    toDate: z.string().min(1, "To date is required"),
    weekOffs: z
      .array(weekOffSchema)
      .default([])
      .superRefine((items, ctx) => {
        const seen = new Set<number>()
        items.forEach((item, index) => {
          const week = Number(item?.week ?? 0)
          if (!week) return
          if (seen.has(week)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Duplicate week number: ${week}`,
              path: [index, "week"],
            })
          } else {
            seen.add(week)
          }
        })
      }),
    createdBy: z
      .string()
      .optional()
      .refine((val) => !val || !hasDisallowedChars(val), {
        message: "Created by can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
      }),
    createdOn: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.fromDate || !data.toDate) return true
      const from = Date.parse(data.fromDate)
      const to = Date.parse(data.toDate)
      if (Number.isNaN(from) || Number.isNaN(to)) return false
      return to >= from
    },
    { message: "To date must be on or after from date", path: ["toDate"] },
  )

export type WeekOffApplication = z.infer<typeof weekOffApplicationSchema>

export const EMPTY_WEEK_OFF: WeekOffItem = {
  week: 1,
  weekOff: [],
}

export const EMPTY_WEEK_OFF_APPLICATION: WeekOffApplication = {
  employeeID: "",
  fromDate: "",
  toDate: "",
  weekOffs: [],
}