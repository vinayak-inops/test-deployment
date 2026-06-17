import { z } from "zod"

const isValidCode = (v: string) => /^[a-zA-Z0-9-]+$/.test(v)
const isValidNameChar = (v: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(v)
const hasNoScriptContent = (v: string) =>
  !/<[^>]*>/.test(v) && !/javascript\s*:/i.test(v) && !/on\w+\s*=/i.test(v)

// ─── Sub-schemas ───────────────────────────────────────────────────────────────

export const locationSchema = z.object({
  locationCode: z.string().trim().min(1, "Location code is required"),
  locationName: z.string().trim().min(1, "Location name is required"),
})

export const subsidiarySchema = z.object({
  subsidiaryCode: z.string().trim().min(1, "Subsidiary code is required"),
  subsidiaryName: z.string().trim().min(1, "Subsidiary name is required"),
})

export const otPolicyDetailSchema = z.object({
  otPolicyCode:                        z.string().trim().min(1, "OT Policy code is required")
    .refine((v) => !/\s/.test(v), { message: "OT Policy code must not contain spaces" })
    .refine(isValidCode, { message: "OT Policy code must contain only letters, digits, and hyphens (-)" }),
  otPolicyName:                        z.string().trim().min(1, "OT Policy name is required")
    .refine(isValidNameChar, { message: "OT Policy name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -" }),
  calculateOnTheBasisOf:               z.string().trim().min(1, "Calculate on the basis of is required")
    .refine(isValidNameChar, { message: "Calculate on the basis of can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -" }),
  multiplierForWorkingDay:             z.number({ invalid_type_error: "Must be a number" }),
  multiplierForNationalHoliday:        z.number({ invalid_type_error: "Must be a number" }),
  multiplierForHoliday:                z.number({ invalid_type_error: "Must be a number" }),
  multiplierForWeeklyOff:              z.number({ invalid_type_error: "Must be a number" }),
  dailyMaximumAllowedHours:            z.number({ invalid_type_error: "Must be a number" }),
  weeklyMaximumAllowedHours:           z.number({ invalid_type_error: "Must be a number" }),
  monthlyMaximumAllowedHours:          z.number({ invalid_type_error: "Must be a number" }),
  quaterlyMaximumAllowedHours:         z.number({ invalid_type_error: "Must be a number" }),
  yearlyMaximumAllowedHours:           z.number({ invalid_type_error: "Must be a number" }),
  maximumHoursOnHoliday:               z.number({ invalid_type_error: "Must be a number" }),
  maximumHoursOnWeekend:               z.number({ invalid_type_error: "Must be a number" }),
  maximumHoursOnWeekday:               z.number({ invalid_type_error: "Must be a number" }),
  minimumExtraMinutesConsideredForOT:  z.number({ invalid_type_error: "Must be a number" }),
  roundingEnabled:                     z.boolean(),
  afterRoundingOff:                    z.boolean(),
  beforeRoundingOff:                   z.boolean(),
  doThisWhenCrossedAllocatedLimit:     z.string().trim().min(1, "This field is required"),
  approvalRequired:                    z.boolean(),
  minimumFixedMinutesToAllowOvertime:  z.number({ invalid_type_error: "Must be a number" }),
  status:                              z.string().trim().min(1, "Status is required"),
  rounding:                            z.array(z.any()).default([]),
  remark:                              z.string().trim().optional().default("")
    .refine((v) => !v || hasNoScriptContent(v), { message: "Remark must not contain code or script content" }),
  isConsideredForHoliday:              z.boolean(),
  isConsideredForNationalHoliday:      z.boolean(),
  isConsideredForWeeklyOff:            z.boolean(),
  isConsideredForWorkingDay:           z.boolean(),
  isConsideredBeforeShift:             z.boolean(),
  isConsideredAfterShift:              z.boolean(),
  perHourRate:                         z.number({ invalid_type_error: "Must be a number" }).min(0, "Per hour rate must be ≥ 0"),
})

// ─── Main Form Schema ──────────────────────────────────────────────────────────

export const otPolicySchema = z.object({
  employeeCategory: z
    .array(z.string().trim().min(1))
    .min(1, "At least one employee category is required"),
  location:  locationSchema,
  subsidiary: subsidiarySchema,
  otPolicy:  otPolicyDetailSchema,
})

// ─── Types ─────────────────────────────────────────────────────────────────────

export type LocationFormValues      = z.infer<typeof locationSchema>
export type SubsidiaryFormValues    = z.infer<typeof subsidiarySchema>
export type OtPolicyDetailFormValues = z.infer<typeof otPolicyDetailSchema>
export type OtPolicyFormValues      = z.infer<typeof otPolicySchema>

// ─── Default Values ────────────────────────────────────────────────────────────

export const defaultLocationValues: LocationFormValues = {
  locationCode: "",
  locationName: "",
}

export const defaultSubsidiaryValues: SubsidiaryFormValues = {
  subsidiaryCode: "",
  subsidiaryName: "",
}

export const defaultOtPolicyDetailValues: OtPolicyDetailFormValues = {
  otPolicyCode:                       "",
  otPolicyName:                       "",
  calculateOnTheBasisOf:              "",
  multiplierForWorkingDay:            0,
  multiplierForNationalHoliday:       0,
  multiplierForHoliday:               0,
  multiplierForWeeklyOff:             0,
  dailyMaximumAllowedHours:           0,
  weeklyMaximumAllowedHours:          0,
  monthlyMaximumAllowedHours:         0,
  quaterlyMaximumAllowedHours:        0,
  yearlyMaximumAllowedHours:          0,
  maximumHoursOnHoliday:              0,
  maximumHoursOnWeekend:              0,
  maximumHoursOnWeekday:              0,
  minimumExtraMinutesConsideredForOT: 0,
  roundingEnabled:                    false,
  afterRoundingOff:                   false,
  beforeRoundingOff:                  false,
  doThisWhenCrossedAllocatedLimit:    "",
  approvalRequired:                   false,
  minimumFixedMinutesToAllowOvertime: 0,
  status:                             "active",
  rounding:                           [],
  remark:                             "",
  isConsideredForHoliday:             false,
  isConsideredForNationalHoliday:     false,
  isConsideredForWeeklyOff:           false,
  isConsideredForWorkingDay:          false,
  isConsideredBeforeShift:            false,
  isConsideredAfterShift:             false,
  perHourRate:                        0,
}

export const defaultOtPolicyValues: OtPolicyFormValues = {
  employeeCategory: [],
  location:         defaultLocationValues,
  subsidiary:       defaultSubsidiaryValues,
  otPolicy:         defaultOtPolicyDetailValues,
}