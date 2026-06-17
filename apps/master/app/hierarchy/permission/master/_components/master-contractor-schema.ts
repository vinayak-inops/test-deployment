import * as z from "zod"

export type CrudPermission = {
  view: boolean
  edit: boolean
  add: boolean
  delete: boolean
}

export type MasterContractorModuleKey =
  | "contractorEmployee"
  | "contractor"
  | "companyEmployee"
  | "companyEmployeeHris"

export const masterContractorModuleKeys: MasterContractorModuleKey[] = [
  "contractorEmployee",
  "contractor",
  "companyEmployee",
  "companyEmployeeHris",
]

export type MasterContractorScreenPermission = {
  screenName: MasterContractorModuleKey
  permissions: CrudPermission
}

export type MasterContractorEntry = {
  isActive: boolean
  permissions: CrudPermission
}

export type MasterContractorRecord = {
  isActive: boolean
} & Record<MasterContractorModuleKey, MasterContractorEntry>

export type MasterContractorPayload = {
  user: MasterContractorRecord
  isActive: boolean
}

export const createDefaultCrudPermission = (): CrudPermission => ({
  view: false,
  edit: false,
  add: false,
  delete: false,
})

export const createDefaultMasterContractorData = (): MasterContractorPayload => ({
  user: {
    isActive: false,
    ...masterContractorModuleKeys.reduce((acc, key) => {
      acc[key] = {
        isActive: false,
        permissions: createDefaultCrudPermission(),
      }
      return acc
    }, {} as Record<MasterContractorModuleKey, MasterContractorEntry>),
  },
  isActive: false,
})

const crudPermissionSchema = z.object({
  view: z.boolean(),
  edit: z.boolean(),
  add: z.boolean(),
  delete: z.boolean(),
})

const masterContractorEntrySchema = z.object({
  isActive: z.boolean(),
  permissions: crudPermissionSchema,
})

export const masterContractorSchema = z.object({
  user: z.object({
    isActive: z.boolean(),
    contractorEmployee: masterContractorEntrySchema,
    contractor: masterContractorEntrySchema,
    companyEmployee: masterContractorEntrySchema,
    companyEmployeeHris: masterContractorEntrySchema,
  }),
  isActive: z.boolean(),
})

export const createMasterContractorSchema = () => masterContractorSchema
