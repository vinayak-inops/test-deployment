import { z } from "zod"

const CATEGORY_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const CATEGORY_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/
const EMPLOYEE_ID_CHARS = /^[a-zA-Z0-9_\-]+$/

export const createEmployeeCategorySchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    employeeCategoryCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Employee category code must not contain spaces" })
          .refine((val) => !val || CATEGORY_CODE_CHARS.test(val), {
            message: "Employee category code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Employee category code is required")
          .refine((val) => !/\s/.test(val), { message: "Employee category code must not contain spaces" })
          .refine((val) => CATEGORY_CODE_CHARS.test(val), {
            message: "Employee category code can only contain letters, numbers, and hyphens (-)",
          }),
    employeeCategoryName: z
      .string()
      .trim()
      .min(1, "Employee category name is required")
      .refine((val) => CATEGORY_NAME_CHARS.test(val), {
        message: "Employee category name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    employeeCategoryDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
    firstEmployeeID: z
      .string()
      .trim()
      .min(1, "First Employee ID is required")
      .refine((val) => !/\s/.test(val), { message: "First Employee ID must not contain spaces" })
      .refine((val) => EMPLOYEE_ID_CHARS.test(val), {
        message: "First Employee ID can only contain letters, numbers, underscores (_), and hyphens (-)",
      }),
  })
}