import { z } from "zod"

const REASON_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const REASON_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createReasonCodesSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    reasonCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Reason code must not contain spaces" })
          .refine((val) => !val || REASON_CODE_CHARS.test(val), {
            message: "Reason code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Reason code is required")
          .refine((val) => !/\s/.test(val), { message: "Reason code must not contain spaces" })
          .refine((val) => REASON_CODE_CHARS.test(val), {
            message: "Reason code can only contain letters, numbers, and hyphens (-)",
          }),
    reasonName: z
      .string()
      .trim()
      .min(1, "Reason name is required")
      .refine((val) => REASON_NAME_CHARS.test(val), {
        message: "Reason name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    reasonDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}