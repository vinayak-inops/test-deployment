import { z } from "zod"

// ─── Sub-schemas ───────────────────────────────────────────────────────────────

export const levelOfApprovalsSchema = z.object({
  leaveApprovalLevel:    z.number({ invalid_type_error: "Must be a number" }).min(0),
  punchApprovalLevel:    z.number({ invalid_type_error: "Must be a number" }).min(0),
  outDutyApprovalLevel:  z.number({ invalid_type_error: "Must be a number" }).min(0),
  shiftApprovalLevel:    z.number({ invalid_type_error: "Must be a number" }).min(0),
})

export const shiftGraceSettingsSchema = z.object({
  lunchHourDeduction:  z.boolean(),
  outAboveMargin:      z.number({ invalid_type_error: "Must be a number" }).min(0),
  lateInAllowedTime:   z.number({ invalid_type_error: "Must be a number" }).min(0),
  inAboveMargin:       z.number({ invalid_type_error: "Must be a number" }).min(0),
  inAheadMargin:       z.number({ invalid_type_error: "Must be a number" }).min(0),
  outAheadMargin:      z.number({ invalid_type_error: "Must be a number" }).min(0),
  graceIn:             z.number({ invalid_type_error: "Must be a number" }).min(0),
  graceOut:            z.number({ invalid_type_error: "Must be a number" }).min(0),
  earlyOutAllowedTime: z.number({ invalid_type_error: "Must be a number" }).min(0),
})

export const genericSettingsSchema = z.object({
  allowMobileApp:                          z.boolean(),
  includeHolidayInPresentDays:             z.boolean(),
  allowAttendanceFromMobileApp:            z.boolean(),
  autoMarkPresent:                         z.boolean(),
  includeLeaveInPresentDays:               z.boolean(),
  allowEmail:                              z.boolean(),
  ceilingLimitApplicableForPFContribution: z.boolean(),
  allowEmailNotification:                  z.boolean(),
  temporaryEmployee:                       z.boolean(),
  allowManualSwipesFromWeb:                z.boolean(),
  excludeWeekOffFromPayableDays:           z.boolean(),
})

// ─── Main Form Schema ──────────────────────────────────────────────────────────

export const employeeCategorySettingSchema = z.object({
  sourceEmailPassward:  z.string().trim().min(1, "Source email password is required"),
  sourceEmailAddess:    z.string().trim().email("Must be a valid email address"),
  employeeCategoryCode: z.string().trim().min(1, "Employee category code is required"),
  levelOfApprovals:     levelOfApprovalsSchema,
  shiftGraceSettings:   shiftGraceSettingsSchema,
  genericSettings:      genericSettingsSchema,
})

// ─── Types ─────────────────────────────────────────────────────────────────────

export type LevelOfApprovalsFormValues       = z.infer<typeof levelOfApprovalsSchema>
export type ShiftGraceSettingsFormValues     = z.infer<typeof shiftGraceSettingsSchema>
export type GenericSettingsFormValues        = z.infer<typeof genericSettingsSchema>
export type EmployeeCategorySettingFormValues = z.infer<typeof employeeCategorySettingSchema>

// ─── Default Values ────────────────────────────────────────────────────────────

export const defaultLevelOfApprovalsValues: LevelOfApprovalsFormValues = {
  leaveApprovalLevel:   0,
  punchApprovalLevel:   0,
  outDutyApprovalLevel: 0,
  shiftApprovalLevel:   0,
}

export const defaultShiftGraceSettingsValues: ShiftGraceSettingsFormValues = {
  lunchHourDeduction:  false,
  outAboveMargin:      0,
  lateInAllowedTime:   0,
  inAboveMargin:       0,
  inAheadMargin:       0,
  outAheadMargin:      0,
  graceIn:             0,
  graceOut:            0,
  earlyOutAllowedTime: 0,
}

export const defaultGenericSettingsValues: GenericSettingsFormValues = {
  allowMobileApp:                          false,
  includeHolidayInPresentDays:             false,
  allowAttendanceFromMobileApp:            false,
  autoMarkPresent:                         false,
  includeLeaveInPresentDays:               false,
  allowEmail:                              false,
  ceilingLimitApplicableForPFContribution: false,
  allowEmailNotification:                  false,
  temporaryEmployee:                       false,
  allowManualSwipesFromWeb:                false,
  excludeWeekOffFromPayableDays:           false,
}

export const defaultEmployeeCategorySettingValues: EmployeeCategorySettingFormValues = {
  sourceEmailPassward:  "",
  sourceEmailAddess:    "",
  employeeCategoryCode: "",
  levelOfApprovals:     defaultLevelOfApprovalsValues,
  shiftGraceSettings:   defaultShiftGraceSettingsValues,
  genericSettings:      defaultGenericSettingsValues,
}