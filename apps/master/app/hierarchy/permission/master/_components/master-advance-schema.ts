import * as z from "zod"

export type CrudPermission = {
  view: boolean
  edit: boolean
  add: boolean
  delete: boolean
}

export type MasterAdvanceModuleKey =
  | "employeeCategorySetting"
  | "workOrderCompletion"
  | "mailGroupAssociation"
  | "mailGroupAssociationHris"
  | "emailTemplates"
  | "apiIntegrationConfig"
  | "reportTask"
  | "continuousDaysBlocking"
  | "schedulerConfigurationsHris"
  | "schedulerConfigurations"
  | "Notification"

export const masterAdvanceModuleKeys: MasterAdvanceModuleKey[] = [
  "employeeCategorySetting",
  "workOrderCompletion",
  "mailGroupAssociation",
  "mailGroupAssociationHris",
  "emailTemplates",
  "apiIntegrationConfig",
  "reportTask",
  "continuousDaysBlocking",
  "schedulerConfigurationsHris",
  "schedulerConfigurations",
  "Notification",
]

export type MasterAdvanceEntry = {
  isActive: boolean
  permissions: CrudPermission
}

export type MasterAdvanceRecord = {
  isActive: boolean
} & Record<MasterAdvanceModuleKey, MasterAdvanceEntry>

export type MasterAdvancePayload = {
  setting: MasterAdvanceRecord
  isActive: boolean
}

export const createDefaultCrudPermission = (): CrudPermission => ({
  view: false,
  edit: false,
  add: false,
  delete: false,
})

export const createDefaultMasterAdvanceData = (): MasterAdvancePayload => ({
  setting: {
    isActive: false,
    ...masterAdvanceModuleKeys.reduce((acc, key) => {
      acc[key] = {
        isActive: false,
        permissions: createDefaultCrudPermission(),
      }
      return acc
    }, {} as Record<MasterAdvanceModuleKey, MasterAdvanceEntry>),
  },
  isActive: false,
})

const crudPermissionSchema = z.object({
  view: z.boolean(),
  edit: z.boolean(),
  add: z.boolean(),
  delete: z.boolean(),
})

const masterAdvanceEntrySchema = z.object({
  isActive: z.boolean(),
  permissions: crudPermissionSchema,
})

export const masterAdvanceSchema = z.object({
  setting: z.object({
    isActive: z.boolean(),
    employeeCategorySetting: masterAdvanceEntrySchema,
    workOrderCompletion: masterAdvanceEntrySchema,
    mailGroupAssociation: masterAdvanceEntrySchema,
    mailGroupAssociationHris: masterAdvanceEntrySchema,
    emailTemplates: masterAdvanceEntrySchema,
    apiIntegrationConfig: masterAdvanceEntrySchema,
    reportTask: masterAdvanceEntrySchema,
    continuousDaysBlocking: masterAdvanceEntrySchema,
    schedulerConfigurationsHris: masterAdvanceEntrySchema,
    schedulerConfigurations: masterAdvanceEntrySchema,
    Notification: masterAdvanceEntrySchema,
  }),
  isActive: z.boolean(),
})

export const createMasterAdvanceSchema = () => masterAdvanceSchema
