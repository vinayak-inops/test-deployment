import * as z from "zod"

export type ManagerDashboardPermissionPayload = {
  managerDashboard: {
    isActive: boolean
    managerDashboard: {
      isActive: boolean
      permissions: {
        view: boolean
      }
    }
  }
}

const managerDashboardPermissionsSchema = z.object({
  view: z.boolean().default(false),
})

const nestedManagerDashboardSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: managerDashboardPermissionsSchema,
})

export const managerDashboardPermissionSchema = z.object({
  managerDashboard: z.object({
    isActive: z.boolean().default(false),
    managerDashboard: nestedManagerDashboardSchema,
  }),
})

export const createManagerDashboardPermissionSchema = () =>
  managerDashboardPermissionSchema
