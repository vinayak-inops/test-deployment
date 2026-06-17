import { z } from "zod"

const WORK_SKILL_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const WORK_SKILL_TITLE_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createWorkSkillSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    workSkillCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Work skill code must not contain spaces" })
          .refine((val) => !val || WORK_SKILL_CODE_CHARS.test(val), {
            message: "Work skill code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Work skill code is required")
          .refine((val) => !/\s/.test(val), { message: "Work skill code must not contain spaces" })
          .refine((val) => WORK_SKILL_CODE_CHARS.test(val), {
            message: "Work skill code can only contain letters, numbers, and hyphens (-)",
          }),
    workSkillTitle: z
      .string()
      .trim()
      .min(1, "Work skill title is required")
      .refine((val) => WORK_SKILL_TITLE_CHARS.test(val), {
        message: "Work skill title can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    workSkillDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}