import { z } from "zod"

const REGION_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const REGION_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createRegionSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    regionCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Region code must not contain spaces" })
          .refine((val) => !val || REGION_CODE_CHARS.test(val), {
            message: "Region code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Region code is required")
          .refine((val) => !/\s/.test(val), { message: "Region code must not contain spaces" })
          .refine((val) => REGION_CODE_CHARS.test(val), {
            message: "Region code can only contain letters, numbers, and hyphens (-)",
          }),
    regionName: z
      .string()
      .trim()
      .min(1, "Region name is required")
      .refine((val) => REGION_NAME_CHARS.test(val), {
        message: "Region name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    regionDescription: z
      .string()
      .trim()
      .optional()
      .default(""),
  })
}