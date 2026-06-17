import { z } from "zod"

const CODE_CHARS = /^[a-zA-Z0-9-]*$/
const NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_-]*$/

export type ShiftZoneSchemaOptions = {
  existingShiftGroupCodes?: string[]
  existingShiftGroupNames?: string[]
  isEdit?: boolean
  initialShiftGroupCode?: string
  initialShiftGroupName?: string
}

export function createShiftZoneSchema(options?: ShiftZoneSchemaOptions) {
  const {
    existingShiftGroupCodes = [],
    existingShiftGroupNames = [],
    isEdit = false,
    initialShiftGroupCode = "",
    initialShiftGroupName = "",
  } = options ?? {}

  return z.object({
    shiftGroupCode: z
      .string()
      .min(1, "Shift Group Code is required")
      .refine((v) => !/\s/.test(v), {
        message: "Shift Group Code must not contain spaces",
      })
      .refine((v) => CODE_CHARS.test(v), {
        message: "Shift Group Code must contain only letters, digits, and hyphens (-)",
      })
      .refine(
        (v) => {
          if (isEdit && v.toLowerCase() === initialShiftGroupCode.toLowerCase()) return true
          return !existingShiftGroupCodes.includes(v.toLowerCase())
        },
        { message: "Shift Group Code already exists" }
      ),
    shiftGroupName: z
      .string()
      .min(1, "Shift Group Name is required")
      .refine((v) => NAME_CHARS.test(v), {
        message: "Shift Group Name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
      })
      .refine(
        (v) => {
          if (isEdit && v.toLowerCase() === initialShiftGroupName.toLowerCase()) return true
          return !existingShiftGroupNames.includes(v.toLowerCase())
        },
        { message: "Shift Group Name already exists" }
      ),
    subsidiary: z.object({
      subsidiaryCode: z.string().min(1, "Subsidiary Code is required"),
      subsidiaryName: z.string().min(1, "Subsidiary Name is required"),
    }),
    location: z.object({
      locationCode: z.string().min(1, "Location Code is required"),
      locationName: z.string().min(1, "Location Name is required"),
    }),
    employeeCategory: z
      .array(z.string())
      .min(1, "At least one category required"),
  })
}

export const shiftZoneSchema = createShiftZoneSchema()

export type ShiftZoneFormData = z.infer<typeof shiftZoneSchema>

export const EMPTY_SHIFT_ZONE: ShiftZoneFormData = {
  shiftGroupCode: "",
  shiftGroupName: "",
  subsidiary: { subsidiaryCode: "", subsidiaryName: "" },
  location: { locationCode: "", locationName: "" },
  employeeCategory: [],
}
