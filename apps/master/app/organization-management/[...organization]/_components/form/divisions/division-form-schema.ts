import { z } from "zod"

const DIVISION_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const DIVISION_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/
const SUBSIDIARY_CODE_CHARS = /^[a-zA-Z0-9\-]+$/

export const createDivisionSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    divisionCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Division code must not contain spaces" })
          .refine((val) => !val || DIVISION_CODE_CHARS.test(val), {
            message: "Division code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Division code is required")
          .refine((val) => !/\s/.test(val), { message: "Division code must not contain spaces" })
          .refine((val) => DIVISION_CODE_CHARS.test(val), {
            message: "Division code can only contain letters, numbers, and hyphens (-)",
          }),
    divisionName: z
      .string()
      .trim()
      .min(1, "Division name is required")
      .refine((val) => DIVISION_NAME_CHARS.test(val), {
        message: "Division name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    subsidiaryCode: z
      .string()
      .trim()
      .min(1, "Subsidiary is required")
      .refine((val) => !/\s/.test(val), { message: "Subsidiary code must not contain spaces" })
      .refine((val) => SUBSIDIARY_CODE_CHARS.test(val), {
        message: "Subsidiary code can only contain letters, numbers, and hyphens (-)",
      }),
    divisionDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}