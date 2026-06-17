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
  countryCode:  z.string().trim().min(1, "Country code is required"),
  stateCode:    z.string().trim().min(1, "State code is required"),
})

export const designationSchema = z.object({
  designationCode: z.string().trim().min(1, "Designation code is required"),
  designationName: z.string().trim().min(1, "Designation name is required"),
})

export const wfhPolicyDetailSchema = z.object({
  wfhPolicyCode:         z.string().trim().min(1, "WFH policy code is required")
    .refine((v) => !/\s/.test(v), { message: "Policy code must not contain spaces" })
    .refine(isValidCode, { message: "Policy code must contain only letters, digits, and hyphens (-)" }),
  wfhPolicyTitle:        z.string().trim().min(1, "WFH policy title is required")
    .refine(isValidNameChar, { message: "Policy title can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -" }),
  maxDaysPerWeek:        z
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Cannot be negative")
    .max(7, "Cannot exceed 7 days"),
  maxDaysPerMonth:       z
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Cannot be negative")
    .max(31, "Cannot exceed 31 days"),
  halfDayAllowed:        z.boolean().default(false),
  autoApproval:          z.boolean().default(false),
  backDateAllowed:       z.boolean().default(false),
  allowedInNoticePeriod: z.boolean().default(false),
})

// ─── Main Form Schema ──────────────────────────────────────────────────────────

export const wfhPolicySchema = z.object({
  subsidiary:       subsidiarySchema,
  location:         locationSchema,
  designation:      designationSchema,
  employeeCategory: z
    .array(z.string().trim().min(1))
    .min(1, "At least one employee category is required"),
  wfhPolicy:        wfhPolicyDetailSchema,
})

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SubsidiaryFormValues      = z.infer<typeof subsidiarySchema>
export type LocationFormValues        = z.infer<typeof locationSchema>
export type DesignationFormValues     = z.infer<typeof designationSchema>
export type WfhPolicyDetailFormValues = z.infer<typeof wfhPolicyDetailSchema>
export type WfhPolicyFormValues       = z.infer<typeof wfhPolicySchema>

// ─── Default Values ────────────────────────────────────────────────────────────

export const defaultSubsidiaryValues: SubsidiaryFormValues = {
  subsidiaryCode: "",
  subsidiaryName: "",
}

export const defaultLocationValues: LocationFormValues = {
  locationCode: "",
  locationName: "",
  countryCode:  "",
  stateCode:    "",
}

export const defaultDesignationValues: DesignationFormValues = {
  designationCode: "",
  designationName: "",
}

export const defaultWfhPolicyDetailValues: WfhPolicyDetailFormValues = {
  wfhPolicyCode:         "",
  wfhPolicyTitle:        "",
  maxDaysPerWeek:        0,
  maxDaysPerMonth:       0,
  halfDayAllowed:        false,
  autoApproval:          false,
  backDateAllowed:       false,
  allowedInNoticePeriod: false,
}

export const defaultWfhPolicyValues: WfhPolicyFormValues = {
  subsidiary:       defaultSubsidiaryValues,
  location:         defaultLocationValues,
  designation:      defaultDesignationValues,
  employeeCategory: [],
  wfhPolicy:        defaultWfhPolicyDetailValues,
}