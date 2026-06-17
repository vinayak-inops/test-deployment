import * as z from "zod"

export type ReportsPermissionPayload = {
  reports: {
    isActive: boolean
    reportsGenerate: {
      isActive: boolean
      permissions: {
        reportsGenerate: boolean
      }
    }
  }
}

const reportsGeneratePermissionsSchema = z.object({
  reportsGenerate: z.boolean().default(false),
})

const reportsGenerateSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: reportsGeneratePermissionsSchema,
})

export const reportsPermissionSchema = z.object({
  reports: z.object({
    isActive: z.boolean().default(false),
    reportsGenerate: reportsGenerateSchema,
  }),
})

export const createReportsPermissionSchema = () => reportsPermissionSchema
