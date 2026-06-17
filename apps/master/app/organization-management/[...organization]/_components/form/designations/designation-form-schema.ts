import { z } from "zod"

const DESIGNATION_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const DESIGNATION_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createDesignationSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    designationCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Designation code must not contain spaces" })
          .refine((val) => !val || DESIGNATION_CODE_CHARS.test(val), {
            message: "Designation code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Designation code is required")
          .refine((val) => !/\s/.test(val), { message: "Designation code must not contain spaces" })
          .refine((val) => DESIGNATION_CODE_CHARS.test(val), {
            message: "Designation code can only contain letters, numbers, and hyphens (-)",
          }),
    designationName: z
      .string()
      .trim()
      .min(1, "Designation name is required")
      .refine((val) => DESIGNATION_NAME_CHARS.test(val), {
        message: "Designation name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    designationDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}