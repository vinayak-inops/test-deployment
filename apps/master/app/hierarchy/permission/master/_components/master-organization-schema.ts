import * as z from "zod"

export type CrudPermission = {
  view: boolean
  edit: boolean
  add: boolean
  delete: boolean
}

export type MasterModuleKey =
  | "organization"
  | "location"
  | "subsidiaries"
  | "divisions"
  | "areas"
  | "departments"
  | "designations"
  | "grades"
  | "subDepartments"
  | "sections"
  | "employeeCategories"
  | "workSkill"
  | "natureOfWork"
  | "assetMaster"
  | "leaveWages"
  | "wagePeriod"
  | "documentMaster"
  | "skillLevels"
  | "reasonCodes"
  | "region"
  | "country"
  | "state"
  | "caste"
  | "mailGroup"
  | "centralServerDetails"
  | "maxEmployeesPerSubsidiary"
  | "globalServerDetails"
  | "communicationSoftware"

export const masterModuleKeys: MasterModuleKey[] = [
  "organization",
  "location",
  "subsidiaries",
  "divisions",
  "areas",
  "departments",
  "designations",
  "grades",
  "subDepartments",
  "sections",
  "employeeCategories",
  "workSkill",
  "natureOfWork",
  "assetMaster",
  "leaveWages",
  "wagePeriod",
  "documentMaster",
  "skillLevels",
  "reasonCodes",
  "region",
  "country",
  "state",
  "caste",
  "mailGroup",
  "centralServerDetails",
  "maxEmployeesPerSubsidiary",
  "globalServerDetails",
  "communicationSoftware",
]

export type MasterOrganizationEntry = {
  isActive: boolean
  permissions: CrudPermission
}

export type MasterOrganizationRecord = {
  isActive: boolean
} & Record<MasterModuleKey, MasterOrganizationEntry>


export type MasterOrganizationPayload = {
  _id?: string
  organization: MasterOrganizationRecord
  isActive: boolean
}

export const createDefaultCrudPermission = (): CrudPermission => ({
  view: false,
  edit: false,
  add: false,
  delete: false,
})

export const createDefaultMasterOrganizationEntry = (): MasterOrganizationEntry => ({
  isActive: false,
  permissions: createDefaultCrudPermission(),
})

export const createDefaultMasterOrganizationData = (): MasterOrganizationPayload => ({
  organization: {
    isActive: false,
    ...masterModuleKeys.reduce((acc, key) => {
      acc[key] = createDefaultMasterOrganizationEntry()
      return acc
    }, {} as Record<MasterModuleKey, MasterOrganizationEntry>),
  },
  isActive: false,
})

const crudPermissionSchema = z.object({
  view: z.boolean(),
  edit: z.boolean(),
  add: z.boolean(),
  delete: z.boolean(),
})

const masterOrganizationEntrySchema = z.object({
  isActive: z.boolean(),
  permissions: crudPermissionSchema,
})

export const masterOrganizationSchema = z.object({
  _id: z.string().optional(),
  organization: z.object({
    isActive: z.boolean(),
    organization: masterOrganizationEntrySchema,
    location: masterOrganizationEntrySchema,
    subsidiaries: masterOrganizationEntrySchema,
    divisions: masterOrganizationEntrySchema,
    areas: masterOrganizationEntrySchema,
    departments: masterOrganizationEntrySchema,
    designations: masterOrganizationEntrySchema,
    grades: masterOrganizationEntrySchema,
    subDepartments: masterOrganizationEntrySchema,
    sections: masterOrganizationEntrySchema,
    employeeCategories: masterOrganizationEntrySchema,
    workSkill: masterOrganizationEntrySchema,
    natureOfWork: masterOrganizationEntrySchema,
    assetMaster: masterOrganizationEntrySchema,
    leaveWages: masterOrganizationEntrySchema,
    wagePeriod: masterOrganizationEntrySchema,
    documentMaster: masterOrganizationEntrySchema,
    skillLevels: masterOrganizationEntrySchema,
    reasonCodes: masterOrganizationEntrySchema,
    region: masterOrganizationEntrySchema,
    country: masterOrganizationEntrySchema,
    state: masterOrganizationEntrySchema,
    caste: masterOrganizationEntrySchema,
    mailGroup: masterOrganizationEntrySchema,
    centralServerDetails: masterOrganizationEntrySchema,
    maxEmployeesPerSubsidiary: masterOrganizationEntrySchema,
    globalServerDetails: masterOrganizationEntrySchema,
    communicationSoftware: masterOrganizationEntrySchema,
  }),
  isActive: z.boolean(),
})

export const createMasterOrganizationSchema = () => masterOrganizationSchema
