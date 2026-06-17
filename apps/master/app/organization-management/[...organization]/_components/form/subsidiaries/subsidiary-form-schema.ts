import { z } from "zod"

const SUBSIDIARY_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const SUBSIDIARY_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createSubsidiarySchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    subsidiaryCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Subsidiary code must not contain spaces" })
          .refine((val) => !val || SUBSIDIARY_CODE_CHARS.test(val), {
            message: "Subsidiary code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Subsidiary code is required")
          .refine((val) => !/\s/.test(val), { message: "Subsidiary code must not contain spaces" })
          .refine((val) => SUBSIDIARY_CODE_CHARS.test(val), {
            message: "Subsidiary code can only contain letters, numbers, and hyphens (-)",
          }),
    subsidiaryName: z
      .string()
      .trim()
      .min(1, "Subsidiary name is required")
      .refine((val) => SUBSIDIARY_NAME_CHARS.test(val), {
        message: "Subsidiary name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    subsidiaryDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}