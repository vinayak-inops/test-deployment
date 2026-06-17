import { z } from "zod"

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const nonNegative = (msg: string) => z.number().min(0, msg)
const optionalBool = z.boolean()
const isValidCode = (v: string) => /^[a-zA-Z0-9-]+$/.test(v)
const isValidNameChar = (v: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(v)

// ─────────────────────────────────────────────
// Main Schema (Single Form)
// ─────────────────────────────────────────────

export const leavePolicySchema = z.object({
    // ── Basic Info ─────────────────────────────
    leaveCode: z.string().min(1, "Leave code is required")
        .refine((v) => !/\s/.test(v), { message: "Leave code must not contain spaces" })
        .refine(isValidCode, { message: "Leave code must contain only letters, digits, and hyphens (-)" }),
    leaveTitle: z.string().refine((v) => !v || isValidNameChar(v), {
        message: "Leave title can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),

    // ── Policy Details ─────────────────────────
    effectiveFrom: z.string().min(1, "Effective from date is required"),
    genderAllowed: z.enum(["All", "Male", "Female"]),
    leaveType: z.enum(["paid", "unpaid"]),
    leaveCategory: z.enum(["Time Away", "Leave of Absence"]),

    maritalStatus: z.array(z.string()).min(1, "Marital status is required"),

    minimumServicePeriodRequired: z.number().min(0).max(120),

    maximumLeaveAllowed: z.array(
        z.object({
            type: z.enum(["once", "monthly", "yearly"]),
            daysAllowed: z.number().min(0).max(365),
        })
    ),

    minimumDaysPerApplication: z.number().min(1).max(30),
    maximumDaysPerApplication: z.number().min(0).max(365),

    maximumApplicationAllowed: z.array(
        z.object({
            type: z.enum(["once", "monthly", "yearly"]),
            count: z.number().min(0).max(100),
        })
    ),

    halfDayAllowed: optionalBool,
    alertManagerDaysBeforeLeaveStart: z.number().min(0).max(30),

    // ── Rules & Restrictions ──────────────────
    sandwichHolidayAsLeave: z.object({
        countAsLeave: optionalBool,
        minimumLeaveDays: nonNegative("Minimum leave days must be 0 or greater"),
    }),

    sandwichWeekOffAsLeave: z.object({
        countAsLeave: optionalBool,
        minimumLeaveDays: nonNegative("Minimum leave days must be 0 or greater"),
    }),

    canStartOrEndOnHoliday: optionalBool,
    canStartOrEndOnWeekOff: optionalBool,

    preApplication: z.object({
        leaveDaysMoreThan: nonNegative("Leave days must be 0 or greater"),
        applyBeforeDays: nonNegative("Apply before days must be 0 or greater"),
    }),

    maximumBackDaysApplicationAllowed: nonNegative("Must be 0 or greater"),
    maximumFutureDaysApplicationAllowed: nonNegative("Must be 0 or greater"),
    requireDocsIfLeaveDaysExceeds: nonNegative("Must be 0 or greater"),

    allowedInNoticePeriod: optionalBool,
    alertManagerAfterApproval: optionalBool,
    delegateApplicable: optionalBool,

    reminderFrequencyToApprover: nonNegative("Must be 0 or greater"),
    alertApprover: optionalBool,

    autoApproval: z.object({
        autoApprovalAllowed: optionalBool,
        autoApproveIfDateCrossed: optionalBool,
        daysForAutoApproval: nonNegative("Must be 0 or greater"),
    }),

    cannotCombineWith: z.object({
        prefix: z.array(z.string()),
        postfix: z.array(z.string()),
    }),

    // ── Accrual Settings ───────────────────────
    leaveAccrual: z.object({
        accrualType: z.string(),
        dayId: nonNegative("Must be 0 or greater"),

        accrualPolicy: z.object({
            accrualDays: nonNegative("Must be 0 or greater"),
            workingDays: nonNegative("Must be 0 or greater"),
        }),

        accrualInAdvance: optionalBool,
        maximumBalanceCarriedForward: nonNegative("Must be 0 or greater"),

        excludedDaysForAccrual: z.array(z.string()),
    }),

    // ── Balance ────────────────────────────────
    balance: z.object({
        balanceValidation: optionalBool,
        allowedNegativeBalance: nonNegative("Must be 0 or greater"),
        minServicePeriodRequired: nonNegative("Must be 0 or greater"),
        lapseLeaveBalanceAtYearEnd: z.string().refine(
            (v) => v === "" || /^\d+(\.\d+)?$/.test(v),
            { message: "Lapse leave balance at year end must be a number" }
        ),
        maximumBalanceAllowed: nonNegative("Must be 0 or greater"),
    }),

    // ── Encashment ────────────────────────────
    encashment: z.object({
        encashmentAllowed: optionalBool,
        autoEncashment: optionalBool,
        minimumBalanceRequired: nonNegative("Must be 0 or greater"),
        maximumAllowedEncashment: nonNegative("Must be 0 or greater"),
        applicationRequired: optionalBool,
        maximumApplicationAllowedYearly: nonNegative("Must be 0 or greater"),
        maximumEncashmentPerApplication: nonNegative("Must be 0 or greater"),
    }),
})

// ─────────────────────────────────────────────
// Wrapper (API Payload)
// ─────────────────────────────────────────────

export const leavePolicyDocumentSchema = z.object({
    employeeCategory: z.array(z.string()),
    location: z.object({
        locationCode: z.string(),
        locationName: z.string(),
    }),
    designation: z.object({
        designationCode: z.string(),
        designationName: z.string(),
    }),
    leavePolicy: leavePolicySchema,
    subsidiary: z.object({
        subsidiaryCode: z.string(),
        subsidiaryName: z.string(),
    }),
})

export const leavePolicyFormSchema = leavePolicySchema.extend({
    employeeCategory: z.array(z.string()),
    location: z.object({
        locationCode: z.string(),
        locationName: z.string(),
    }),
    designation: z.object({
        designationCode: z.string(),
        designationName: z.string(),
    }),
    subsidiary: z.object({
        subsidiaryCode: z.string(),
        subsidiaryName: z.string(),
    }),
})

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type LeavePolicyFormData = z.infer<typeof leavePolicySchema>
export type LeavePolicyWithOrganizationFormData = z.infer<typeof leavePolicyFormSchema>
export type LeavePolicyDocument = z.infer<typeof leavePolicyDocumentSchema>

// ─────────────────────────────────────────────
// Default Values (Single Form Ready)
// ─────────────────────────────────────────────

export const defaultLeavePolicyValues: LeavePolicyFormData = {
    leaveCode: "",
    leaveTitle: "",

    effectiveFrom: "",
    genderAllowed: "" as any,
    leaveType: "" as any,
    leaveCategory: "" as any,

    maritalStatus: [],
    minimumServicePeriodRequired: 0,

    maximumLeaveAllowed: [],

    minimumDaysPerApplication: 1,
    maximumDaysPerApplication: 0,

    maximumApplicationAllowed: [],

    halfDayAllowed: false,
    alertManagerDaysBeforeLeaveStart: 0,

    sandwichHolidayAsLeave: { countAsLeave: false, minimumLeaveDays: 0 },
    sandwichWeekOffAsLeave: { countAsLeave: false, minimumLeaveDays: 0 },

    canStartOrEndOnHoliday: false,
    canStartOrEndOnWeekOff: false,

    preApplication: { leaveDaysMoreThan: 0, applyBeforeDays: 0 },

    maximumBackDaysApplicationAllowed: 0,
    maximumFutureDaysApplicationAllowed: 0,
    requireDocsIfLeaveDaysExceeds: 0,

    allowedInNoticePeriod: false,
    alertManagerAfterApproval: false,
    delegateApplicable: false,

    reminderFrequencyToApprover: 0,
    alertApprover: false,

    autoApproval: {
        autoApprovalAllowed: false,
        autoApproveIfDateCrossed: false,
        daysForAutoApproval: 0,
    },

    cannotCombineWith: {
        prefix: [],
        postfix: [],
    },

    leaveAccrual: {
        accrualType: "",
        dayId: 0,
        accrualPolicy: { accrualDays: 0, workingDays: 0 },
        accrualInAdvance: false,
        maximumBalanceCarriedForward: 0,
        excludedDaysForAccrual: [],
    },

    balance: {
        balanceValidation: false,
        allowedNegativeBalance: 0,
        minServicePeriodRequired: 0,
        lapseLeaveBalanceAtYearEnd: "",
        maximumBalanceAllowed: 0,
    },

    encashment: {
        encashmentAllowed: false,
        autoEncashment: false,
        minimumBalanceRequired: 0,
        maximumAllowedEncashment: 0,
        applicationRequired: false,
        maximumApplicationAllowedYearly: 0,
        maximumEncashmentPerApplication: 0,
    },
}

export const defaultLeavePolicyDocumentValues: LeavePolicyDocument = {
    employeeCategory: [],
    location: {
        locationCode: "",
        locationName: "",
    },
    designation: {
        designationCode: "",
        designationName: "",
    },
    leavePolicy: defaultLeavePolicyValues,
    subsidiary: {
        subsidiaryCode: "",
        subsidiaryName: "",
    },
}

export const defaultLeavePolicyFormValues: LeavePolicyWithOrganizationFormData = {
    ...defaultLeavePolicyValues,
    employeeCategory: [],
    location: {
        locationCode: "",
        locationName: "",
    },
    designation: {
        designationCode: "",
        designationName: "",
    },
    subsidiary: {
        subsidiaryCode: "",
        subsidiaryName: "",
    },
}