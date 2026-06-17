import * as z from "zod"

export type CsoDashboardPermissionPayload = {
  csoDashboard: {
    isActive: boolean
    csoDashboard: {
      isActive: boolean
      permissions: {
        view: boolean
      }
    }
  }
}

const csoDashboardPermissionsSchema = z.object({
  view: z.boolean().default(false),
})

const nestedCsoDashboardSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: csoDashboardPermissionsSchema,
})

export const csoDashboardPermissionSchema = z.object({
  csoDashboard: z.object({
    isActive: z.boolean().default(false),
    csoDashboard: nestedCsoDashboardSchema,
  }),
})

export const createCsoDashboardPermissionSchema = () =>
  csoDashboardPermissionSchema
