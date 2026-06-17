import { z } from "zod"

const isValidShiftCode = (v: string) => /^[a-zA-Z0-9-]+$/.test(v)
const isValidNameChar = (v: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(v)

const TIME_PATTERN = /^([01]?[0-9]|2[0-4]):[0-5][0-9]$/
const TIME_ERROR_MESSAGE = "Please enter a valid time (HH:MM) - supports 24:00 for midnight"

const requiredTime = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(TIME_PATTERN, TIME_ERROR_MESSAGE)

const requiredNumber = (field: string, requiredMessage: string) =>
  z
    .number({
      required_error: requiredMessage,
      invalid_type_error: `${field} must be a valid number`,
    })
    .finite(requiredMessage)

const nonNegativeNumber = (field: string, minMessage: string) =>
  z
    .number({
      invalid_type_error: `${field} must be a valid number`,
    })
    .finite(`${field} must be a valid number`)
    .min(0, minMessage)

const shiftFormBaseSchema = z.object({
  shiftCode: z
    .string()
    .min(1, "Shift code is required")
    .refine((v) => !/\s/.test(v), { message: "Shift code must not contain spaces" })
    .refine(isValidShiftCode, { message: "Shift code must contain only letters, digits, and hyphens (-)" }),
  shiftName: z
    .string()
    .min(1, "Shift name is required")
    .max(50, "Shift name must not exceed 50 characters")
    .refine(isValidNameChar, { message: "Shift name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -" }),
  shiftStart: requiredTime("Shift start time"),
  shiftEnd: requiredTime("Shift end time"),
  firstHalfStart: requiredTime("First half start time"),
  firstHalfEnd: requiredTime("First half end time"),
  secondHalfStart: requiredTime("Second half start time"),
  secondHalfEnd: requiredTime("Second half end time"),
  lunchStart: requiredTime("Lunch start time"),
  lunchEnd: requiredTime("Lunch end time"),
  duration: requiredNumber("Duration", "Duration is required"),
  crossDay: z.boolean(),
  flexible: z.boolean(),
  flexiFullDayDuration: nonNegativeNumber("Flexi full day duration", "Flexi full day duration cannot be negative"),
  flexiHalfDayDuration: nonNegativeNumber(
    "Flexi half day duration",
    "Flexi half day duration cannot be negative"
  ),
  inAheadMargin: nonNegativeNumber("In ahead margin", "In ahead margin cannot be negative"),
  inAboveMargin: nonNegativeNumber("In above margin", "In above margin cannot be negative"),
  outAheadMargin: nonNegativeNumber("Out ahead margin", "Out ahead margin cannot be negative"),
  outAboveMargin: nonNegativeNumber("Out above margin", "Out above margin cannot be negative"),
  lateInAllowedTime: nonNegativeNumber("Late in allowed time", "Late in allowed time cannot be negative"),
  earlyOutAllowedTime: nonNegativeNumber("Early out allowed time", "Early out allowed time cannot be negative"),
  graceIn: nonNegativeNumber("Grace in", "Grace in cannot be negative"),
  graceOut: nonNegativeNumber("Grace out", "Grace out cannot be negative"),
  earlyOutTime: nonNegativeNumber("Early out time", "Early out time cannot be negative"),
  minimumDurationForFullDay: nonNegativeNumber(
    "Minimum duration for full day",
    "Minimum duration for full day cannot be negative"
  ),
  minimumDurationForHalfDay: nonNegativeNumber(
    "Minimum duration for half day",
    "Minimum duration for half day cannot be negative"
  ),
  minimumExtraMinutesForExtraHours: nonNegativeNumber(
    "Minimum extra minutes",
    "Minimum extra minutes must be at least 15 minutes"
  ),
})

export type ShiftFormData = z.infer<typeof shiftFormBaseSchema>

const normalizeTime = (time: string) => (time === "24:00" ? "00:00" : time)

export function createShiftFormSchema() {
  return shiftFormBaseSchema.superRefine((data, ctx) => {
    if (normalizeTime(data.lunchEnd) <= normalizeTime(data.lunchStart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lunch end time must be after lunch start time",
        path: ["lunchEnd"],
      })
    }
  })
}
