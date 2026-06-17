import { z } from "zod"

const SUB_DEPT_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const SUB_DEPT_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/
const CODE_CHARS = /^[a-zA-Z0-9\-]+$/

export const createSubDepartmentSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    subDepartmentCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Sub Department code must not contain spaces" })
          .refine((val) => !val || SUB_DEPT_CODE_CHARS.test(val), {
            message: "Sub Department code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Sub Department code is required")
          .refine((val) => !/\s/.test(val), { message: "Sub Department code must not contain spaces" })
          .refine((val) => SUB_DEPT_CODE_CHARS.test(val), {
            message: "Sub Department code can only contain letters, numbers, and hyphens (-)",
          }),
    subDepartmentName: z
      .string()
      .trim()
      .min(1, "Sub Department name is required")
      .refine((val) => SUB_DEPT_NAME_CHARS.test(val), {
        message: "Sub Department name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
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
    departmentCode: z
      .string()
      .trim()
      .min(1, "Department is required")
      .refine((val) => !/\s/.test(val), { message: "Department code must not contain spaces" })
      .refine((val) => CODE_CHARS.test(val), {
        message: "Department code can only contain letters, numbers, and hyphens (-)",
      }),
    subDepartmentDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
    locationCode: z.array(z.string().min(1)).optional(),
  })
}