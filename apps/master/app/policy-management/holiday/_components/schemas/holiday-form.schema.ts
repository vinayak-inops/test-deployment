import { z } from "zod"

const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

// ─── Sub-schemas ───────────────────────────────────────────────────────────────

export const locationSchema = z.object({
  locationCode: z.string().trim().min(1, "Location code is required"),
  locationName: z.string().trim().min(1, "Location name is required"),
})

export const subsidiarySchema = z.object({
  subsidiaryCode: z.string().trim().min(1, "Subsidiary code is required"),
  subsidiaryName: z.string().trim().min(1, "Subsidiary name is required"),
})

export const holidayDetailSchema = z.object({
  holidayType: z.string().trim().min(1, "Holiday type is required"),
  holidayName: z.string().trim().min(1, "Holiday name is required").refine(isValidNameChar, {
    message: "Holiday name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
  }),
  holidayDate: z.string().min(1, "Holiday date is required"),
})

// ─── Main Form Schema ──────────────────────────────────────────────────────────

export const holidaySchema = z.object({
  employeeCategory: z
    .array(z.string().trim().min(1))
    .min(1, "At least one employee category is required"),
  location: locationSchema,
  holiday: holidayDetailSchema,
  subsidiary: subsidiarySchema,
  // organizationCode is NOT in schema - it will be added during submission like tenantCode
})

// ─── Types ─────────────────────────────────────────────────────────────────────

export type LocationFormValues     = z.infer<typeof locationSchema>
export type SubsidiaryFormValues   = z.infer<typeof subsidiarySchema>
export type HolidayDetailFormValues = z.infer<typeof holidayDetailSchema>
export type HolidayFormValues      = z.infer<typeof holidaySchema>

// ─── Default Values ────────────────────────────────────────────────────────────

export const defaultLocationValues: LocationFormValues = {
  locationCode: "",
  locationName: "",
}

export const defaultSubsidiaryValues: SubsidiaryFormValues = {
  subsidiaryCode: "",
  subsidiaryName: "",
}

export const defaultHolidayDetailValues: HolidayDetailFormValues = {
  holidayType: "",
  holidayName: "",
  holidayDate: "",
}

export const defaultHolidayValues: HolidayFormValues = {
  employeeCategory: [],
  location: defaultLocationValues,
  holiday: defaultHolidayDetailValues,
  subsidiary: defaultSubsidiaryValues,
}