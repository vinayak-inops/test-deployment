import * as z from "zod"

export type ApproverPermission = {
  cancel: boolean
  reject: boolean
  approve: boolean
}

export type ApplicationApproverKey =
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

export const applicationApproverKeys: ApplicationApproverKey[] = [
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

export type ApplicationApproverEntry = {
  permissions: ApproverPermission
  isActive: boolean
}

export type ApplicationApproverRecord = { isActive: boolean } & Record<
  ApplicationApproverKey,
  ApplicationApproverEntry
>

export type ApplicationApproverPayload = {
  _id?: string
  applicationApprover: ApplicationApproverRecord
}

export const createDefaultApproverPermission = (): ApproverPermission => ({
  cancel: false,
  reject: false,
  approve: false,
})

export const createDefaultApplicationApproverData = (): ApplicationApproverPayload => ({
  applicationApprover: applicationApproverKeys.reduce(
    (acc, key) => {
      acc[key] = {
        permissions: createDefaultApproverPermission(),
        isActive: false,
      }
      return acc
    },
    { isActive: false } as ApplicationApproverRecord,
  ),
})

const approverPermissionSchema = z.object({
  cancel: z.boolean(),
  reject: z.boolean(),
  approve: z.boolean(),
})

const applicationApproverEntrySchema = z.object({
  permissions: approverPermissionSchema,
  isActive: z.boolean(),
})

export const applicationApproverSchema = z.object({
  _id: z.string().optional(),
  applicationApprover: z.object({
    isActive: z.boolean(),
    punch: applicationApproverEntrySchema,
    editPunchApplication: applicationApproverEntrySchema,
    outDuty: applicationApproverEntrySchema,
    leave: applicationApproverEntrySchema,
    shiftChange: applicationApproverEntrySchema,
    overtime: applicationApproverEntrySchema,
    encashment: applicationApproverEntrySchema,
    compOff: applicationApproverEntrySchema,
    specialLeave: applicationApproverEntrySchema,
    wfh: applicationApproverEntrySchema,
  }),
})

export const createApplicationApproverSchema = () => applicationApproverSchema
