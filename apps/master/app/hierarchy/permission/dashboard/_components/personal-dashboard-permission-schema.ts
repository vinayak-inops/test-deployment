import * as z from "zod"

export type PersonalDashboardPermissionPayload = {
  dashboard: {
    isActive: boolean
    personaldashboard: {
      isActive: boolean
      permissions: {
        view: boolean
      }
    }
  }
}

const personalDashboardPermissionsSchema = z.object({
  view: z.boolean().default(false),
})

const personalDashboardSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: personalDashboardPermissionsSchema,
})

export const personalDashboardPermissionSchema = z.object({
  dashboard: z.object({
    isActive: z.boolean().default(false),
    personaldashboard: personalDashboardSchema,
  }),
})

export const createPersonalDashboardPermissionSchema = () =>
  personalDashboardPermissionSchema
