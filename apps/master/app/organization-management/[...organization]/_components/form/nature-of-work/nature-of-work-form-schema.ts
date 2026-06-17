import { z } from "zod"

const NATURE_OF_WORK_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const NATURE_OF_WORK_TITLE_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createNatureOfWorkSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    natureOfWorkCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Nature of work code must not contain spaces" })
          .refine((val) => !val || NATURE_OF_WORK_CODE_CHARS.test(val), {
            message: "Nature of work code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Nature of work code is required")
          .refine((val) => !/\s/.test(val), { message: "Nature of work code must not contain spaces" })
          .refine((val) => NATURE_OF_WORK_CODE_CHARS.test(val), {
            message: "Nature of work code can only contain letters, numbers, and hyphens (-)",
          }),
    natureOfWorkTitle: z
      .string()
      .trim()
      .min(1, "Nature of work title is required")
      .refine((val) => NATURE_OF_WORK_TITLE_CHARS.test(val), {
        message: "Nature of work title can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    natureOfWorkDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}