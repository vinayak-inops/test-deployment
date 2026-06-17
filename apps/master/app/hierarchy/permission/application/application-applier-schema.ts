import * as z from "zod"

export type ApplicationPermission = {
  cancel: boolean
  reject: boolean
  approve: boolean
  self: boolean
  all: boolean
}

export type ApplicationApplierKey =
  | "punch"
  | "editPunchApplication"
  | "outDuty"
  | "leave"
  | "shiftChange"
  | "overtime"
  | "encashment"
  | "compOff"
  | "specialLeave"
  | "wfh"

export const applicationApplierKeys: ApplicationApplierKey[] = [
  "punch",
  "editPunchApplication",
  "outDuty",
  "leave",
  "shiftChange",
  "overtime",
  "encashment",
  "compOff",
  "specialLeave",
  "wfh",
]

export type ApplicationApplierEntry = {
  permissions: ApplicationPermission
  isActive: boolean
}

export type ApplicationApplierRecord = { isActive: boolean } & Record<
  ApplicationApplierKey,
  ApplicationApplierEntry
>

export type ApplicationApplierPayload = {
  _id?: string
  applicationApplier: ApplicationApplierRecord
}

export const createDefaultApplicationPermission = (): ApplicationPermission => ({
  cancel: false,
  reject: false,
  approve: false,
  self: false,
  all: false,
})

export const createDefaultApplicationApplierData = (): ApplicationApplierPayload => ({
  applicationApplier: applicationApplierKeys.reduce(
    (acc, key) => {
      acc[key] = {
        permissions: createDefaultApplicationPermission(),
        isActive: false,
      }
      return acc
    },
    { isActive: false } as ApplicationApplierRecord,
  ),
})

const applicationPermissionSchema = z.object({
  cancel: z.boolean(),
  reject: z.boolean(),
  approve: z.boolean(),
  self: z.boolean(),
  all: z.boolean(),
})

const applicationApplierEntrySchema = z.object({
  permissions: applicationPermissionSchema,
  isActive: z.boolean(),
})

export const applicationApplierSchema = z.object({
  _id: z.string().optional(),
  applicationApplier: z.object({
    isActive: z.boolean(),
    punch: applicationApplierEntrySchema,
    editPunchApplication: applicationApplierEntrySchema,
    outDuty: applicationApplierEntrySchema,
    leave: applicationApplierEntrySchema,
    shiftChange: applicationApplierEntrySchema,
    overtime: applicationApplierEntrySchema,
    encashment: applicationApplierEntrySchema,
    compOff: applicationApplierEntrySchema,
    specialLeave: applicationApplierEntrySchema,
    wfh: applicationApplierEntrySchema,
  }),
})

export const createApplicationApplierSchema = () => applicationApplierSchema
