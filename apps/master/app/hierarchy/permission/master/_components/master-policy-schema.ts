import * as z from "zod"

export type CrudPermission = {
  view: boolean
  edit: boolean
  add: boolean
  delete: boolean
}

export type MasterPolicyKey =
  | "overTime"
  | "holiday"
  | "shiftPolicy"
  | "leavePolicy"
  | "shiftsLists"
  | "compoff"
  | "outduty"
  | "wfhPolicy"

export const masterPolicyKeys: MasterPolicyKey[] = [
  "overTime",
  "holiday",
  "shiftPolicy",
  "leavePolicy",
  "shiftsLists",
  "compoff",
  "outduty",
  "wfhPolicy",
]

export type MasterPolicyEntry = {
  isActive: boolean
  permissions: CrudPermission
}

export type MasterPolicyRecord = {
  isActive: boolean
} & Record<MasterPolicyKey, MasterPolicyEntry>

export type MasterPolicyPayload = {
  _id?: string
  policy: MasterPolicyRecord
  isActive: boolean
}

export const createDefaultCrudPermission = (): CrudPermission => ({
  view: false,
  edit: false,
  add: false,
  delete: false,
})

export const createDefaultMasterPolicyEntry = (): MasterPolicyEntry => ({
  isActive: false,
  permissions: createDefaultCrudPermission(),
})

export const createDefaultMasterPolicyData = (): MasterPolicyPayload => ({
  policy: {
    isActive: false,
    ...masterPolicyKeys.reduce((acc, key) => {
      acc[key] = createDefaultMasterPolicyEntry()
      return acc
    }, {} as Record<MasterPolicyKey, MasterPolicyEntry>),
  },
  isActive: false,
})

const crudPermissionSchema = z.object({
  view: z.boolean(),
  edit: z.boolean(),
  add: z.boolean(),
  delete: z.boolean(),
})

const masterPolicyEntrySchema = z.object({
  isActive: z.boolean(),
  permissions: crudPermissionSchema,
})

export const masterPolicySchema = z.object({
  _id: z.string().optional(),
  policy: z.object({
    isActive: z.boolean(),
    overTime: masterPolicyEntrySchema,
    holiday: masterPolicyEntrySchema,
    shiftPolicy: masterPolicyEntrySchema,
    leavePolicy: masterPolicyEntrySchema,
    shiftsLists: masterPolicyEntrySchema,
    compoff: masterPolicyEntrySchema,
    outduty: masterPolicyEntrySchema,
    wfhPolicy: masterPolicyEntrySchema,
  }),
  isActive: z.boolean(),
})

export const createMasterPolicySchema = () => masterPolicySchema
