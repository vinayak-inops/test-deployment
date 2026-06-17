import { z } from "zod"

const CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const STATE_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createStateSchema = (
  _organizationData: any,
  _isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    countryCode: z
      .string()
      .trim()
      .min(1, "Country code is required")
      .refine((val) => !/\s/.test(val), { message: "Country code must not contain spaces" })
      .refine((val) => CODE_CHARS.test(val), {
        message: "Country code can only contain letters, numbers, and hyphens (-)",
      }),
    countryName: z
      .string()
      .trim()
      .min(1, "Country name is required")
      .refine((val) => STATE_NAME_CHARS.test(val), {
        message: "Country name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    stateCode: z
      .string()
      .trim()
      .min(1, "State code is required")
      .refine((val) => !/\s/.test(val), { message: "State code must not contain spaces" })
      .refine((val) => CODE_CHARS.test(val), {
        message: "State code can only contain letters, numbers, and hyphens (-)",
      }),
    stateName: z
      .string()
      .trim()
      .min(1, "State name is required")
      .refine((val) => STATE_NAME_CHARS.test(val), {
        message: "State name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
  })
}