import { z } from "zod"

// Training code: letters, numbers, hyphen only (no spaces)
const isValidTrainingCode = (str: string) => /^[a-zA-Z0-9-]+$/.test(str)

// Name fields: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

// Description: all characters except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export const trainingSchema = z
  .object({
    trainingCode: z
      .string()
      .min(1, "Training code is required")
      .refine(isValidTrainingCode, {
        message: "Training code can only contain letters, numbers, and hyphens (-)",
      }),
    trainingName: z
      .string()
      .min(1, "Training name is required")
      .refine(isValidNameChar, {
        message: "Training name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
      }),
    trainingDescrition: z
      .string()
      .optional()
      .default("")
      .refine((val) => !val || hasNoScriptContent(val), {
        message: "Description must not contain code or script content",
      }),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    validTill: z.string().min(1, "Valid till is required"),
    notifyPriorDays: z
      .number({ invalid_type_error: "Notify prior days must be a number" })
      .min(0, "Notify prior days must be 0 or greater")
      .max(9999, "Notify prior days must be at most 4 digits (0–9999)"),
    blockingEnabled: z.boolean(),
    notificationEnabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const start = data.startDate ? new Date(data.startDate).getTime() : NaN
    const end = data.endDate ? new Date(data.endDate).getTime() : NaN
    const valid = data.validTill ? new Date(data.validTill).getTime() : NaN

    if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be the same as or after start date",
        path: ["endDate"],
      })
    }

    if (!Number.isNaN(end) && !Number.isNaN(valid) && end > valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid till must be the same as or after end date",
        path: ["validTill"],
      })
    }
  })

export type TrainingFormValues = z.infer<typeof trainingSchema>

export const EMPTY_TRAINING: TrainingFormValues = {
  trainingCode: "",
  trainingName: "",
  trainingDescrition: "",
  startDate: "",
  endDate: "",
  validTill: "",
  notifyPriorDays: 0,
  blockingEnabled: false,
  notificationEnabled: false,
}
