import * as z from "zod"

const crudPermissionsSchema = z.object({
  view: z.boolean().default(false),
  edit: z.boolean().default(false),
  add: z.boolean().default(false),
  delete: z.boolean().default(false),
})

const ewaCrudModuleSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: crudPermissionsSchema,
})

export const ewaPermissionSchema = z.object({
  ewa: z.object({
    isActive: z.boolean().default(false),
    EWAEmployeeSettings: ewaCrudModuleSchema,
    EWAWithdrawalCategory: ewaCrudModuleSchema,
    EWAAllowedWithdrawal: ewaCrudModuleSchema,
    ewaTenantOutstanding: ewaCrudModuleSchema,
    ewaContractorOutstanding: ewaCrudModuleSchema,
  }),
})

export type EwaPermissionPayload = z.infer<typeof ewaPermissionSchema>

export const createEwaPermissionSchema = () => ewaPermissionSchema