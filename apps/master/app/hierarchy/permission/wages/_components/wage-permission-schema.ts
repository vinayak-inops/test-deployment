import * as z from "zod"

const crudPermissionsSchema = z.object({
  view: z.boolean().default(false),
  edit: z.boolean().default(false),
  add: z.boolean().default(false),
  delete: z.boolean().default(false),
})

const applyPermissionsSchema = z.object({
  view: z.boolean().default(false),
  apply: z.boolean().default(false),
})

const wageCrudModuleSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: crudPermissionsSchema,
})

const wageApplyModuleSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: applyPermissionsSchema,
})

export const wagePermissionSchema = z.object({
  wage: z.object({
    isActive: z.boolean().default(false),
    wageMinimumWages: wageCrudModuleSchema,
    wageProfessionalTax: wageCrudModuleSchema,
    wageSalaryHeads: wageCrudModuleSchema,
    wageSalaryTemplates: wageCrudModuleSchema,
    employeeAdvances: wageCrudModuleSchema,
    employeePenalties: wageCrudModuleSchema,
    wageEmployerContributions: wageCrudModuleSchema,
    employeeWageTemplate: wageCrudModuleSchema,
    wageCalculationApplication: wageApplyModuleSchema,
  }),
})

export type WagePermissionPayload = z.infer<typeof wagePermissionSchema>

export const createWagePermissionSchema = () => wagePermissionSchema
