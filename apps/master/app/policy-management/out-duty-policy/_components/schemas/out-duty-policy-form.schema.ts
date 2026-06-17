import { z } from "zod"

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

export const hourlyPolicySchema = z.object({
  minimumMinutesPerApplication: z.number().min(0).default(0),
  maximumMinutesPerApplication: z.number().min(0).default(0),
})

export const dailyPolicySchema = z.object({
  minimumDaysPerApplication: z.number().min(0).default(0),
  maximumDaysPerApplication: z.number().min(0).default(0),
})

export const autoApprovalSchema = z.object({
  autoApprovalAllowed:      z.boolean().default(false),
  autoApproveIfDateCrossed: z.boolean().default(false),
  daysForAutoApproval:      z.number().min(0).default(0),
})

export const outDutyPolicyDetailSchema = z.object({
  hourlyPolicy:              hourlyPolicySchema.default({ minimumMinutesPerApplication: 0, maximumMinutesPerApplication: 0 }),
  dailyPolicy:               dailyPolicySchema.default({ minimumDaysPerApplication: 0, maximumDaysPerApplication: 0 }),
  sandwichHolidayAsOutDuty:  z.boolean().default(false),
  sandwichWeekOffAsOutDuty:  z.boolean().default(false),
  isAllowedInNoticePeriod:   z.boolean().default(false),
  allowStartOrEndOnHoliday:  z.boolean().default(false),
  allowStartOrEndOnWeekOff:  z.boolean().default(false),
  autoApproval:              autoApprovalSchema.default({ autoApprovalAllowed: false, autoApproveIfDateCrossed: false, daysForAutoApproval: 0 }),
})

// ─── Main Form Schema ──────────────────────────────────────────────────────────

export const outDutyPolicyFormSchema = z.object({
  subsidiary:       subsidiarySchema,
  location:         locationSchema,
  designation:      designationSchema,
  employeeCategory: z
    .array(z.string().trim().min(1))
    .min(1, "At least one employee category is required"),
  policy: outDutyPolicyDetailSchema,
})

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SubsidiaryFormValues        = z.infer<typeof subsidiarySchema>
export type LocationFormValues          = z.infer<typeof locationSchema>
export type DesignationFormValues       = z.infer<typeof designationSchema>
export type OutDutyPolicyDetailValues   = z.infer<typeof outDutyPolicyDetailSchema>
export type OutDutyPolicyFormValues     = z.infer<typeof outDutyPolicyFormSchema>

// ─── Default Values ────────────────────────────────────────────────────────────

export const defaultOutDutyPolicyValues: OutDutyPolicyFormValues = {
  subsidiary:       { subsidiaryCode: "", subsidiaryName: "" },
  location:         { locationCode: "",   locationName: "" },
  designation:      { designationCode: "", designationName: "" },
  employeeCategory: [],
  policy: {
    hourlyPolicy: {
      minimumMinutesPerApplication: 0,
      maximumMinutesPerApplication: 0,
    },
    dailyPolicy: {
      minimumDaysPerApplication: 0,
      maximumDaysPerApplication: 0,
    },
    sandwichHolidayAsOutDuty: false,
    sandwichWeekOffAsOutDuty: false,
    isAllowedInNoticePeriod:  false,
    allowStartOrEndOnHoliday: false,
    allowStartOrEndOnWeekOff: false,
    autoApproval: {
      autoApprovalAllowed:      false,
      autoApproveIfDateCrossed: false,
      daysForAutoApproval:      0,
    },
  },
}
