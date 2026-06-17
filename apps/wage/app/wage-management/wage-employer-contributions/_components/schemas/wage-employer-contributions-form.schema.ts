import { z } from "zod"

const optionalNonEmptyStringSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
)

const nonNegativeNumberSchema = (message: string) =>
  z.preprocess(
    (value) => (value === undefined || value === null || value === "" ? 0 : value),
    z.number().min(0, message),
  )

// MongoDB ObjectId Schema
export const mongoObjectIdSchema = z.union([
  z.string(),
  z.object({
    $oid: z.string().min(1, "Object ID is required"),
  }),
])

// LWF State Configuration Schema
export const lwfStateConfigSchema = z.object({
  contribution: nonNegativeNumberSchema("Contribution cannot be negative"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
})

// PF EDLI Schema - Removed defaults
export const pfEdliSchema = z.object({
  enabled: z.boolean(),
  contributionRate: nonNegativeNumberSchema("Contribution rate cannot be negative"),
  maxWages: nonNegativeNumberSchema("Max wages cannot be negative"),
  maxContribution: nonNegativeNumberSchema("Max contribution cannot be negative"),
  adminCharges: z.object({
    rate: nonNegativeNumberSchema("Admin charges rate cannot be negative"),
  }),
})

// PF Employer Breakdown Schema - Removed defaults
export const pfEmployerBreakdownSchema = z.object({
  eps: z.object({
    rate: nonNegativeNumberSchema("EPS rate cannot be negative"),
  }),
  epf: z.object({
    rate: nonNegativeNumberSchema("EPF rate cannot be negative"),
    description: z.string().optional(),
  }),
})

// PF Employer Schema - Removed defaults
export const pfEmployerSchema = z.object({
  totalContributionRate: nonNegativeNumberSchema("Total contribution rate cannot be negative"),
  breakdown: pfEmployerBreakdownSchema,
  adminCharges: z.object({
    rate: nonNegativeNumberSchema("Admin charges rate cannot be negative"),
    appliedOn: z.string(),
  }),
})

// PF Employee Schema - Removed defaults
export const pfEmployeeSchema = z.object({
  contributionRate: nonNegativeNumberSchema("Contribution rate cannot be negative"),
})

// PF Main Schema - Removed defaults
export const pfSchema = z.object({
  enabled: z.boolean(),
  applicableSalaryHeads: z.array(z.string()),
  maxWageLimit: nonNegativeNumberSchema("Max wage limit cannot be negative"),
  employee: pfEmployeeSchema,
  employer: pfEmployerSchema,
  edli: pfEdliSchema,
})

// ESI Schemas - Removed defaults
export const esiEmployeeSchema = z.object({
  contributionRate: nonNegativeNumberSchema("Contribution rate cannot be negative"),
})

export const esiEmployerSchema = z.object({
  contributionRate: nonNegativeNumberSchema("Contribution rate cannot be negative"),
})

export const esiSchema = z.object({
  enabled: z.boolean(),
  maxGrossSalaryLimit: nonNegativeNumberSchema("Max gross salary limit cannot be negative"),
  employee: esiEmployeeSchema,
  employer: esiEmployerSchema,
  applicableSalaryHeads: z.array(z.string()),
})

// LWF Main Schema
export const lwfSchema = z.object({
  employer: z.array(z.unknown()).default([]),
  employee: z.array(z.unknown()).default([]),
}).default({
  employer: [],
  employee: [],
})

// Main Form Schema
export const wageEmployerContributionsSchema = z.object({
  _id: mongoObjectIdSchema.optional(),
  organizationCode: optionalNonEmptyStringSchema,
  tenantCode: optionalNonEmptyStringSchema,
  pf: pfSchema,
  esi: esiSchema,
  lwf: lwfSchema,
}).superRefine((data, ctx) => {
  if (!data.pf.enabled && !data.esi.enabled) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enable at least one contribution type: PF or ESI",
      path: ["pf", "enabled"],
    })
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enable at least one contribution type: PF or ESI",
      path: ["esi", "enabled"],
    })
  }
})

// Types
export type MongoObjectId = z.infer<typeof mongoObjectIdSchema>
export type LWFStateConfig = z.infer<typeof lwfStateConfigSchema>
export type PFEdli = z.infer<typeof pfEdliSchema>
export type PFEmployerBreakdown = z.infer<typeof pfEmployerBreakdownSchema>
export type PFEmployer = z.infer<typeof pfEmployerSchema>
export type PFEmployee = z.infer<typeof pfEmployeeSchema>
export type PFSchema = z.infer<typeof pfSchema>
export type ESIEmployee = z.infer<typeof esiEmployeeSchema>
export type ESIEmployer = z.infer<typeof esiEmployerSchema>
export type ESISchema = z.infer<typeof esiSchema>
export type LWFSchema = z.infer<typeof lwfSchema>
export type WageEmployerContributionsFormValues = z.infer<typeof wageEmployerContributionsSchema>

// Default Values (for initial form state only, not for validation)
export const defaultLWFStateConfig: LWFStateConfig = {
  contribution: 0,
  country: "",
  state: "",
  effectiveFrom: "",
}

export const defaultPFEdli: PFEdli = {
  enabled: false,
  contributionRate: 0,
  maxWages: 0,
  maxContribution: 0,
  adminCharges: {
    rate: 0,
  },
}

export const defaultPFEmployerBreakdown: PFEmployerBreakdown = {
  eps: {
    rate: 0,
  },
  epf: {
    rate: 0,
    description: "",
  },
}

export const defaultPFEmployer: PFEmployer = {
  totalContributionRate: 0,
  breakdown: defaultPFEmployerBreakdown,
  adminCharges: {
    rate: 0,
    appliedOn: "",
  },
}

export const defaultPFEmployee: PFEmployee = {
  contributionRate: 0,
}

export const defaultPFSchema: PFSchema = {
  enabled: false,
  applicableSalaryHeads: [],
  maxWageLimit: 0,
  employee: defaultPFEmployee,
  employer: defaultPFEmployer,
  edli: defaultPFEdli,
}

export const defaultESIEmployee: ESIEmployee = {
  contributionRate: 0,
}

export const defaultESIEmployer: ESIEmployer = {
  contributionRate: 0,
}

export const defaultESISchema: ESISchema = {
  enabled: false,
  maxGrossSalaryLimit: 0,
  employee: defaultESIEmployee,
  employer: defaultESIEmployer,
  applicableSalaryHeads: [],
}

export const defaultLWFSchema: LWFSchema = {
  employer: [],
  employee: [],
}

export const defaultWageEmployerContributionsValues: WageEmployerContributionsFormValues = {
  pf: defaultPFSchema,
  esi: defaultESISchema,
  lwf: defaultLWFSchema,
}
