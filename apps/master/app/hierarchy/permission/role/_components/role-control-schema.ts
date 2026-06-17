import * as z from "zod"

export type CrudPermission = {
  view: boolean
  edit: boolean
  add: boolean
  delete: boolean
}

export type RoleControlKey =
  | "rolePermissions"
  | "userEntitlements"
  | "userEntitlementsHris"
  | "contractEmployeeApprover"
  | "contractEmployeeApproverHris"

export type RoleControlEntry = {
  permissions: CrudPermission
  isActive: boolean
}

export type RoleControlData = {
  _id?: string
  roleControl: {
    isActive: boolean
  } & Record<RoleControlKey, RoleControlEntry>
  isActive: boolean
}

export const roleControlKeys: RoleControlKey[] = [
  "rolePermissions",
  "userEntitlements",
  "userEntitlementsHris",
  "contractEmployeeApprover",
  "contractEmployeeApproverHris",
]

export const createDefaultCrudPermission = (): CrudPermission => ({
  view: false,
  edit: false,
  add: false,
  delete: false,
})

export const createDefaultRoleControlEntry = (): RoleControlEntry => ({
  permissions: createDefaultCrudPermission(),
  isActive: false,
})

export const createDefaultRoleControl = (): Record<RoleControlKey, RoleControlEntry> => ({
  rolePermissions: createDefaultRoleControlEntry(),
  userEntitlements: createDefaultRoleControlEntry(),
  userEntitlementsHris: createDefaultRoleControlEntry(),
  contractEmployeeApprover: createDefaultRoleControlEntry(),
  contractEmployeeApproverHris: createDefaultRoleControlEntry(),
})

export const createDefaultRoleControlData = (): RoleControlData => ({
  roleControl: {
    isActive: false,
    ...createDefaultRoleControl(),
  },
  isActive: false,
})

const crudPermissionSchema = z.object({
  view: z.boolean(),
  edit: z.boolean(),
  add: z.boolean(),
  delete: z.boolean(),
})

const roleControlEntrySchema = z.object({
  permissions: crudPermissionSchema,
  isActive: z.boolean(),
})

export const roleControlSchema = z.object({
  _id: z.string().optional(),
  roleControl: z.object({
    isActive: z.boolean(),
    rolePermissions: roleControlEntrySchema,
    userEntitlements: roleControlEntrySchema,
    userEntitlementsHris: roleControlEntrySchema,
    contractEmployeeApprover: roleControlEntrySchema,
    contractEmployeeApproverHris: roleControlEntrySchema,
  }),
  isActive: z.boolean(),
})

export const createRoleControlSchema = () => roleControlSchema
