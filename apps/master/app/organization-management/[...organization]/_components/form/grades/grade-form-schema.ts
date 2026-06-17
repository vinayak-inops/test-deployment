import { z } from "zod"

const GRADE_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const GRADE_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createGradeSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    gradeCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Grade code must not contain spaces" })
          .refine((val) => !val || GRADE_CODE_CHARS.test(val), {
            message: "Grade code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Grade code is required")
          .refine((val) => !/\s/.test(val), { message: "Grade code must not contain spaces" })
          .refine((val) => GRADE_CODE_CHARS.test(val), {
            message: "Grade code can only contain letters, numbers, and hyphens (-)",
          }),
    gradeName: z
      .string()
      .trim()
      .min(1, "Grade name is required")
      .refine((val) => GRADE_NAME_CHARS.test(val), {
        message: "Grade name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    gradeDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}