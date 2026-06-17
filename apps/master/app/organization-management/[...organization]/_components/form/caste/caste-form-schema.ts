import { z } from "zod"

const CASTE_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createCasteSchema = (
  _organizationData: any,
  _isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    casteName: z
      .string()
      .trim()
      .min(1, "Caste name is required")
      .refine((val) => CASTE_NAME_CHARS.test(val), {
        message: "Caste name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    casteDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}