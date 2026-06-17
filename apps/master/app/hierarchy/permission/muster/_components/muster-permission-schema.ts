import * as z from "zod"

export type MusterPermissionPayload = {
  muster: {
    isActive: boolean
    musterPunch: {
      isActive: boolean
      permissions: {
        self: boolean
        all: boolean
      }
    }
    rawPunch: {
      isActive: boolean
      permissions: {
        self: boolean
        all: boolean
      }
    }
    addNewPunch: {
      isActive: boolean
      permissions: {
        self: boolean
        all: boolean
        addPunchSelf: boolean
        addPunchAll: boolean
      }
    }
    suspectedPunches: {
      isActive: boolean
      permissions: {
        approve: boolean
        all: boolean
        self: boolean
      }
    }
  }
}

const musterPunchPermissionsSchema = z.object({
  self: z.boolean().default(false),
  all: z.boolean().default(false),
})

const rawPunchPermissionsSchema = z.object({
  self: z.boolean().default(false),
  all: z.boolean().default(false),
})

const addNewPunchPermissionsSchema = z.object({
  self: z.boolean().default(false),
  all: z.boolean().default(false),
  addPunchSelf: z.boolean().default(false),
  addPunchAll: z.boolean().default(false),
})

const suspectedPunchPermissionsSchema = z.object({
  approve: z.boolean().default(false),
  all: z.boolean().default(false),
  self: z.boolean().default(false),
})

const musterPunchSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: musterPunchPermissionsSchema,
})

const rawPunchSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: rawPunchPermissionsSchema,
})

const addNewPunchSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: addNewPunchPermissionsSchema,
})

const suspectedPunchesSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: suspectedPunchPermissionsSchema,
})

export const musterPermissionSchema = z.object({
  muster: z.object({
    isActive: z.boolean().default(false),
    musterPunch: musterPunchSchema,
    rawPunch: rawPunchSchema,
    addNewPunch: addNewPunchSchema,
    suspectedPunches: suspectedPunchesSchema,
  }),
})

export const createMusterPermissionSchema = () => musterPermissionSchema
