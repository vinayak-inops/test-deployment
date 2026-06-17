import * as z from "zod"

export type DashboardPermissionPayload = {
  dashboard: {
    isActive: boolean
    liveDashboard: {
      isActive: boolean
      permissions: {
        totalCount: boolean
        workOrderCount: boolean
        contractorCount: boolean
        departmentCount: boolean
      }
    }
  }
}

const liveDashboardPermissionsSchema = z.object({
  totalCount: z.boolean().default(false),
  workOrderCount: z.boolean().default(false),
  contractorCount: z.boolean().default(false),
  departmentCount: z.boolean().default(false),
})

const liveDashboardSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: liveDashboardPermissionsSchema,
})

export const dashboardPermissionSchema = z.object({
  dashboard: z.object({
    isActive: z.boolean().default(false),
    liveDashboard: liveDashboardSchema,
  }),
})

export const createDashboardPermissionSchema = () => dashboardPermissionSchema
