import { z } from "zod"

const AREA_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const AREA_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/
const SUBSIDIARY_CODE_CHARS = /^[a-zA-Z0-9\-]+$/

export const createAreaSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    areaCode: isEditMode
      ? z
          .string()
          .trim()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Area code must not contain spaces" })
          .refine((val) => !val || AREA_CODE_CHARS.test(val), {
            message: "Area code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Area code is required")
          .refine((val) => !/\s/.test(val), { message: "Area code must not contain spaces" })
          .refine((val) => AREA_CODE_CHARS.test(val), {
            message: "Area code can only contain letters, numbers, and hyphens (-)",
          }),
    areaName: z
      .string()
      .trim()
      .min(1, "Area name is required")
      .refine((val) => AREA_NAME_CHARS.test(val), {
        message: "Area name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    parentArea: z.union([z.string(), z.array(z.string())]).optional(),
    subsidiaryCode: z
      .string()
      .trim()
      .min(1, "Subsidiary is required")
      .refine((val) => !/\s/.test(val), { message: "Subsidiary code must not contain spaces" })
      .refine((val) => SUBSIDIARY_CODE_CHARS.test(val), {
        message: "Subsidiary code can only contain letters, numbers, and hyphens (-)",
      }),
    areaDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}