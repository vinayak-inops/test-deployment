import { z } from "zod"

const CODE_CHARS = /^[a-zA-Z0-9_\-]+$/
const LOCATION_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/
const CITY_CHARS = /^[a-zA-Z0-9\s_\-]+$/

export const createLocationSchema = (
  _organizationData: any,
  isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    locationCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || CODE_CHARS.test(val), {
            message: "Location code can only contain letters, digits, hyphens (-), and underscores (_)",
          })
      : z
          .string()
          .trim()
          .min(1, "Location code is required")
          .refine((val) => !/\s/.test(val), { message: "Location code must not contain spaces" })
          .refine((val) => CODE_CHARS.test(val), {
            message: "Location code can only contain letters, digits, hyphens (-), and underscores (_)",
          }),
    locationName: z
      .string()
      .trim()
      .min(1, "Location name is required")
      .refine((val) => LOCATION_NAME_CHARS.test(val), {
        message: "Location name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    regionCode: z
      .string()
      .trim()
      .min(1, "Region code is required")
      .refine((val) => CODE_CHARS.test(val), {
        message: "Region code can only contain letters, digits, hyphens (-), and underscores (_)",
      }),
    countryCode: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || CODE_CHARS.test(val), {
        message: "Country code can only contain letters, digits, hyphens (-), and underscores (_)",
      }),
    stateCode: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || CODE_CHARS.test(val), {
        message: "State code can only contain letters, digits, hyphens (-), and underscores (_)",
      }),
    city: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || CITY_CHARS.test(val), {
        message: "City can only contain letters, numbers, spaces, underscores (_), and hyphens (-)",
      }),
    pinCode: z
      .string()
      .nullable()
      .optional()
      .refine((val) => !val || !/\s/.test(val), { message: "Pin code must not contain spaces" })
      .refine((val) => !val || /^\d+$/.test(val), { message: "Pin code must contain digits only (0-9)" })
      .refine((val) => !val || val.length >= 6, { message: "Pin code must be exactly 6 digits" })
      .refine((val) => !val || val.length <= 6, { message: "Pin code must be exactly 6 digits" }),
  })
}