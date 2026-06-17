import * as z from "zod"

export type CrudPermission = {
  view: boolean
  edit: boolean
  add: boolean
  delete: boolean
}

export type MasterEmployeeModuleKey =
  | "securityPass"
  | "employeeShift"
  | "weekOffChanges"
  | "bestEmployeeNomination"
  | "employeeBalance"
  | "employeeCategoryTrainingDetails"
  | "employeeTrainingCompletion"

export const masterEmployeeModuleKeys: MasterEmployeeModuleKey[] = [
  "securityPass",
  "employeeShift",
  "weekOffChanges",
  "bestEmployeeNomination",
  "employeeBalance",
  "employeeCategoryTrainingDetails",
  "employeeTrainingCompletion",
]

export type MasterEmployeeEntry = {
  isActive: boolean
  permissions: CrudPermission
}

export type ManualComputationEntry = {
  isActive: boolean
  permissions: {
    view: boolean
    apply: boolean
  }
}
export type MasterEmployeeManagement = {
  isActive: boolean
} & Record<MasterEmployeeModuleKey, MasterEmployeeEntry> & {
  manualComputation: ManualComputationEntry
}

export type MasterEmployeePayload = {
  employeeManagement: MasterEmployeeManagement
  isActive: boolean
}

export const createDefaultCrudPermission = (): CrudPermission => ({
  view: false,
  edit: false,
  add: false,
  delete: false,
})

export const createDefaultMasterEmployeeData = (): MasterEmployeePayload => ({
  employeeManagement: {
    isActive: false,
    ...masterEmployeeModuleKeys.reduce((acc, key) => {
      acc[key] = {
        isActive: false,
        permissions: createDefaultCrudPermission(),
      }
      return acc
    }, {} as Record<MasterEmployeeModuleKey, MasterEmployeeEntry>),
    manualComputation: {
      isActive: false,
      permissions: {
        view: false,
        apply: false,
      },
    },
  },
  isActive: false,
})

const crudPermissionSchema = z.object({
  view: z.boolean(),
  edit: z.boolean(),
  add: z.boolean(),
  delete: z.boolean(),
})

const masterEmployeeEntrySchema = z.object({
  isActive: z.boolean(),
  permissions: crudPermissionSchema,
})
const manualComputationSchema = z.object({
  isActive: z.boolean(),
  permissions: z.object({
    view: z.boolean(),
    apply: z.boolean(),
  }),
})

export const masterEmployeeSchema = z.object({
  employeeManagement: z.object({
    isActive: z.boolean(),
    securityPass: masterEmployeeEntrySchema,
    employeeShift: masterEmployeeEntrySchema,
    weekOffChanges: masterEmployeeEntrySchema,
    bestEmployeeNomination: masterEmployeeEntrySchema,
    employeeBalance: masterEmployeeEntrySchema,
    employeeCategoryTrainingDetails: masterEmployeeEntrySchema,
    employeeTrainingCompletion: masterEmployeeEntrySchema,
    manualComputation: manualComputationSchema,
  }),
  isActive: z.boolean(),
})

export const createMasterEmployeeSchema = () => masterEmployeeSchema
