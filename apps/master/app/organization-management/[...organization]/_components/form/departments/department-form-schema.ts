import { z } from "zod"

const DEPARTMENT_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const DEPARTMENT_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/
const CODE_CHARS = /^[a-zA-Z0-9\-]+$/

export const createDepartmentSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    departmentCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Department code must not contain spaces" })
          .refine((val) => !val || DEPARTMENT_CODE_CHARS.test(val), {
            message: "Department code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Department code is required")
          .refine((val) => !/\s/.test(val), { message: "Department code must not contain spaces" })
          .refine((val) => DEPARTMENT_CODE_CHARS.test(val), {
            message: "Department code can only contain letters, numbers, and hyphens (-)",
          }),
    departmentName: z
      .string()
      .trim()
      .min(1, "Department name is required")
      .refine((val) => DEPARTMENT_NAME_CHARS.test(val), {
        message: "Department name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    subsidiaryCode: z
      .string()
      .trim()
      .min(1, "Subsidiary is required")
      .refine((val) => !/\s/.test(val), { message: "Subsidiary code must not contain spaces" })
      .refine((val) => CODE_CHARS.test(val), {
        message: "Subsidiary code can only contain letters, numbers, and hyphens (-)",
      }),
    divisionCode: z
      .string()
      .trim()
      .min(1, "Division is required")
      .refine((val) => !/\s/.test(val), { message: "Division code must not contain spaces" })
      .refine((val) => CODE_CHARS.test(val), {
        message: "Division code can only contain letters, numbers, and hyphens (-)",
      }),
    departmentDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}