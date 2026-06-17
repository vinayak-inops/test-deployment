import { z } from "zod"

const isValidCode = (v: string) => /^[a-zA-Z0-9-]+$/.test(v)
const isValidNameChar = (v: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(v)

// ─── Sub-schemas ───────────────────────────────────────────────────────────────

export const subsidiarySchema = z.object({
  subsidiaryCode: z.string().trim().min(1, "Subsidiary code is required"),
  subsidiaryName: z.string().trim().min(1, "Subsidiary name is required"),
})

export const locationSchema = z.object({
  locationCode: z.string().trim().min(1, "Location code is required"),
  locationName: z.string().trim().min(1, "Location name is required"),
})

export const designationSchema = z.object({
  designationCode: z.string().trim().min(1, "Designation code is required"),
  designationName: z.string().trim().min(1, "Designation name is required"),
})

export const cannotCombineWithSchema = z.object({
  prefix:  z.array(z.string()).default([]),
  postfix: z.array(z.string()).default([]),
})

export const overlapMultiplierSchema = z.object({
  multiplierWithoutWorking: z.number().min(0),
  multiplierForWorking:     z.number().min(0),
})

export const roundingSchema = z.object({
  from:   z.number(),
  to:     z.number(),
  roundTo: z.number(),
})

export const compOffPolicySchema = z.object({
  compOffPolicyCode:  z.string().trim().min(1, "Policy code is required")
    .refine((v) => !/\s/.test(v), { message: "Policy code must not contain spaces" })
    .refine(isValidCode, { message: "Policy code must contain only letters, digits, and hyphens (-)" }),
  compOffPolicyTitle: z.string().trim().min(1, "Policy title is required")
    .refine(isValidNameChar, { message: "Policy title can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -" }),

  // Boolean toggles
  generateOnWeekDay:          z.boolean().default(false),
  generateOnWeekOff:          z.boolean().default(false),
  generateOnHoliday:          z.boolean().default(false),
  halfDayCompOffApplicable:   z.boolean().default(false),
  expireCompOffAtYearEnd:     z.boolean().default(false),
  backDateCompOffAllowed:     z.boolean().default(false),
  allowDuringNoticePeriod:    z.boolean().default(false),
  deductLunchBreakForCompOff: z.boolean().default(false),
  compOffApplicationRequired: z.boolean().default(false),
  autoApprove:                z.boolean().default(false),

  // Numeric fields
  compOffExpiryDays:               z.number().min(0).default(0),
  maxBackDaysAllowed:              z.number().min(0).default(0),
  compOffMonthlyLimit:             z.number().min(0).default(0),
  minimumMinutesToGetFullCompOff:  z.number().min(0).default(0),
  minimumMinutesToGetHalfCompOff:  z.number().min(0).default(0),
  multiplierForWeekDay:            z.number().min(0).default(1),
  multiplierForWeekOff:            z.number().min(0).default(1),
  multiplierForHoliday:            z.number().min(0).default(1),
  daysUntilAutoApproval:           z.number().min(0).default(0),

  // Enum
  compOffGenerationUnit: z.enum(["days", "hours"]).default("days"),

  // Nested objects
  forHolidayAndWeekOffOverlap: overlapMultiplierSchema.default({
    multiplierWithoutWorking: 0,
    multiplierForWorking:     0,
  }),
  cannotCombineWith: cannotCombineWithSchema.default({ prefix: [], postfix: [] }),

  // Array — no validation; managed externally
  rounding: z.array(z.any()).default([]),
})

// ─── Main Form Schema ──────────────────────────────────────────────────────────

export const compOffPolicyFormSchema = z.object({
  subsidiary:       subsidiarySchema,
  location:         locationSchema,
  designation:      designationSchema,
  employeeCategory: z
    .array(z.string().trim().min(1))
    .min(1, "At least one employee category is required"),
  compOffPolicy: compOffPolicySchema,
})

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SubsidiaryFormValues     = z.infer<typeof subsidiarySchema>
export type LocationFormValues       = z.infer<typeof locationSchema>
export type DesignationFormValues    = z.infer<typeof designationSchema>
export type CompOffPolicyValues      = z.infer<typeof compOffPolicySchema>
export type CompOffPolicyFormValues  = z.infer<typeof compOffPolicyFormSchema>

// ─── Default Values ────────────────────────────────────────────────────────────

export const defaultCompOffPolicyValues: CompOffPolicyFormValues = {
  subsidiary:       { subsidiaryCode: "", subsidiaryName: "" },
  location:         { locationCode: "",   locationName: "" },
  designation:      { designationCode: "", designationName: "" },
  employeeCategory: [],
  compOffPolicy: {
    compOffPolicyCode:  "",
    compOffPolicyTitle: "",
    generateOnWeekDay:          false,
    generateOnWeekOff:          false,
    generateOnHoliday:          false,
    halfDayCompOffApplicable:   false,
    expireCompOffAtYearEnd:     false,
    backDateCompOffAllowed:     false,
    allowDuringNoticePeriod:    false,
    deductLunchBreakForCompOff: false,
    compOffApplicationRequired: false,
    autoApprove:                false,
    compOffExpiryDays:               0,
    maxBackDaysAllowed:              0,
    compOffMonthlyLimit:             0,
    minimumMinutesToGetFullCompOff:  0,
    minimumMinutesToGetHalfCompOff:  0,
    multiplierForWeekDay:            1,
    multiplierForWeekOff:            1,
    multiplierForHoliday:            1,
    daysUntilAutoApproval:           0,
    compOffGenerationUnit:           "days",
    forHolidayAndWeekOffOverlap: { multiplierWithoutWorking: 0, multiplierForWorking: 0 },
    cannotCombineWith:           { prefix: [], postfix: [] },
    rounding:                    [],
  },
}