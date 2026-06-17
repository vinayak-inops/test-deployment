import { z } from "zod"

const SKILL_LEVEL_TITLE_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createSkillLevelsSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    skilledLevelTitle: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || SKILL_LEVEL_TITLE_CHARS.test(val), {
            message: "Skill level title can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Skill level title is required")
          .refine((val) => SKILL_LEVEL_TITLE_CHARS.test(val), {
            message: "Skill level title can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
          }),
    skilledLevelDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}