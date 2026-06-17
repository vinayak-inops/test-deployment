import * as z from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

// Blocks script/code injection patterns in free-text fields like remark
const hasScriptOrCodeInjection = (str: string) => {
  const patterns = [
    /<\s*script[\s\S]*?>/i,           // <script ...>
    /<\s*\/\s*script\s*>/i,           // </script>
    /<\s*[a-z][^>]*\s+on\w+\s*=/i,   // HTML event handlers: <tag onclick=...>
    /javascript\s*:/i,                 // javascript: URI
    /vbscript\s*:/i,                   // vbscript: URI
    /data\s*:\s*text\/html/i,          // data:text/html
    /expression\s*\(/i,                // CSS expression()
    /\beval\s*\(/i,                    // eval(
    /\bexec\s*\(/i,                    // exec(
    /\bFunction\s*\(/i,                // Function(
    /\bsetTimeout\s*\(/i,              // setTimeout(
    /\bsetInterval\s*\(/i,             // setInterval(
    /\bdocument\s*\.\s*(write|cookie|location)/i, // document.write / cookie / location
    /\bwindow\s*\.\s*location/i,       // window.location
    /`[\s\S]*`/,                       // template literals
    /\$\{[\s\S]*?\}/,                  // template literal expressions ${...}
  ]
  return patterns.some((pattern) => pattern.test(str))
}

export type EmploymentDetailsFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}

export type EmploymentDetailsFieldKey =
  | "manager"
  | "wasContractEmployee"
  | "deployment.subsidiary.subsidiaryCode"
  | "deployment.subsidiary.subsidiaryName"
  | "deployment.division.divisionCode"
  | "deployment.division.divisionName"
  | "deployment.department.departmentCode"
  | "deployment.department.departmentName"
  | "deployment.subDepartment.subDepartmentCode"
  | "deployment.subDepartment.subDepartmentName"
  | "deployment.section.sectionCode"
  | "deployment.section.sectionName"
  | "deployment.employeeCategory.employeeCategoryCode"
  | "deployment.employeeCategory.employeeCategoryTitle"
  | "deployment.grade.gradeCode"
  | "deployment.grade.gradeTitle"
  | "deployment.designation.designationCode"
  | "deployment.designation.designationName"
  | "deployment.location.locationCode"
  | "deployment.location.locationName"
  | "deployment.skillLevel.skillLevelTitle"
  | "deployment.skillLevel.skillLevelDescription"
  | "deployment.effectiveFrom"
  | "deployment.remark"

export type EmploymentDetailsFieldsConfig = Partial<
  Record<EmploymentDetailsFieldKey, EmploymentDetailsFieldConfig>
>

export type EmploymentDetailsTabConfig = {
  tabRequired?: boolean
  fields?: EmploymentDetailsFieldsConfig
}

const DEFAULT_REQUIRED: Partial<Record<EmploymentDetailsFieldKey, boolean>> = {
  manager: true,
  wasContractEmployee: true,
  "deployment.subsidiary.subsidiaryCode": true,
  "deployment.subsidiary.subsidiaryName": true,
  "deployment.division.divisionCode": true,
  "deployment.division.divisionName": true,
  "deployment.department.departmentCode": true,
  "deployment.department.departmentName": true,
  "deployment.subDepartment.subDepartmentCode": true,
  "deployment.subDepartment.subDepartmentName": true,
  "deployment.section.sectionCode": true,
  "deployment.section.sectionName": true,
  "deployment.employeeCategory.employeeCategoryCode": true,
  "deployment.employeeCategory.employeeCategoryTitle": true,
  "deployment.grade.gradeCode": true,
  "deployment.grade.gradeTitle": true,
  "deployment.designation.designationCode": true,
  "deployment.designation.designationName": true,
  "deployment.location.locationCode": true,
  "deployment.location.locationName": true,
  "deployment.skillLevel.skillLevelTitle": true,
  "deployment.skillLevel.skillLevelDescription": true,
}

export function normalizeEmploymentDetailsConfig(raw: unknown): {
  tabRequired: boolean
  fields: EmploymentDetailsFieldsConfig
} {
  const asObject = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  const toFieldConfig = (value: unknown): EmploymentDetailsFieldConfig | undefined => {
    const obj = asObject(value)
    if (Object.keys(obj).length === 0) return undefined
    const cfg: EmploymentDetailsFieldConfig = {}
    if (typeof obj.required === "boolean") cfg.required = obj.required
    if (typeof obj.visible === "boolean") cfg.visible = obj.visible
    if (typeof obj.label === "string") cfg.label = obj.label
    if (Object.keys(cfg).length === 0) return undefined
    return cfg
  }

  const groupFields = (value: unknown): Record<string, unknown> => {
    const obj = asObject(value)
    return asObject(obj.fields ?? obj)
  }

  const mergeConfigs = (
    ...configs: Array<EmploymentDetailsFieldConfig | undefined>
  ): EmploymentDetailsFieldConfig | undefined => {
    const merged: EmploymentDetailsFieldConfig = {}
    for (const cfg of configs) {
      if (!cfg) continue
      if (typeof cfg.required === "boolean") merged.required = cfg.required
      if (typeof cfg.visible === "boolean") merged.visible = cfg.visible
      if (typeof cfg.label === "string") merged.label = cfg.label
    }
    return Object.keys(merged).length > 0 ? merged : undefined
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { tabRequired: false, fields: {} }
  }

  const root = asObject(raw)
  const source = asObject(root.fields ?? root)
  const flattened: EmploymentDetailsFieldsConfig = {}

  const setField = (key: EmploymentDetailsFieldKey, nestedValue?: unknown) => {
    const direct = toFieldConfig(source[key])
    const nested = toFieldConfig(nestedValue)
    const value = mergeConfigs(direct, nested)
    if (value) {
      flattened[key] = value
    }
  }

  const setDeploymentField = (
    key: EmploymentDetailsFieldKey,
    sectionValue: unknown,
    fieldValue: unknown
  ) => {
    const direct = toFieldConfig(source[key])
    const section = toFieldConfig(sectionValue)
    const nested = toFieldConfig(fieldValue)
    const value = mergeConfigs(section, nested, direct)
    if (value) {
      flattened[key] = value
    }
  }

  setField("manager", source.manager)
  setField("wasContractEmployee", source.wasContractEmployee)

  const deployment = asObject(source.deployment)
  const subsidiary = groupFields(deployment.subsidiary)
  const division = groupFields(deployment.division)
  const department = groupFields(deployment.department)
  const subDepartment = groupFields(deployment.subDepartment)
  const section = groupFields(deployment.section)
  const employeeCategory = groupFields(deployment.employeeCategory)
  const grade = groupFields(deployment.grade)
  const designation = groupFields(deployment.designation)
  const location = groupFields(deployment.location)
  const skillLevel = groupFields(deployment.skillLevel)

  setDeploymentField(
    "deployment.subsidiary.subsidiaryCode",
    deployment.subsidiary,
    subsidiary.subsidiaryCode
  )
  setDeploymentField(
    "deployment.subsidiary.subsidiaryName",
    deployment.subsidiary,
    subsidiary.subsidiaryName
  )
  setDeploymentField(
    "deployment.division.divisionCode",
    deployment.division,
    division.divisionCode
  )
  setDeploymentField(
    "deployment.division.divisionName",
    deployment.division,
    division.divisionName
  )
  setDeploymentField(
    "deployment.department.departmentCode",
    deployment.department,
    department.departmentCode
  )
  setDeploymentField(
    "deployment.department.departmentName",
    deployment.department,
    department.departmentName
  )
  setDeploymentField(
    "deployment.subDepartment.subDepartmentCode",
    deployment.subDepartment,
    subDepartment.subDepartmentCode
  )
  setDeploymentField(
    "deployment.subDepartment.subDepartmentName",
    deployment.subDepartment,
    subDepartment.subDepartmentName
  )
  setDeploymentField(
    "deployment.section.sectionCode",
    deployment.section,
    section.sectionCode
  )
  setDeploymentField(
    "deployment.section.sectionName",
    deployment.section,
    section.sectionName
  )
  setDeploymentField(
    "deployment.employeeCategory.employeeCategoryCode",
    deployment.employeeCategory,
    employeeCategory.employeeCategoryCode
  )
  setDeploymentField(
    "deployment.employeeCategory.employeeCategoryTitle",
    deployment.employeeCategory,
    employeeCategory.employeeCategoryTitle
  )
  setDeploymentField("deployment.grade.gradeCode", deployment.grade, grade.gradeCode)
  setDeploymentField("deployment.grade.gradeTitle", deployment.grade, grade.gradeTitle)
  setDeploymentField(
    "deployment.designation.designationCode",
    deployment.designation,
    designation.designationCode
  )
  setDeploymentField(
    "deployment.designation.designationName",
    deployment.designation,
    designation.designationName
  )
  setDeploymentField(
    "deployment.location.locationCode",
    deployment.location,
    location.locationCode
  )
  setDeploymentField(
    "deployment.location.locationName",
    deployment.location,
    location.locationName
  )
  setDeploymentField(
    "deployment.skillLevel.skillLevelTitle",
    deployment.skillLevel,
    skillLevel.skillLevelTitle
  )
  setDeploymentField(
    "deployment.skillLevel.skillLevelDescription",
    deployment.skillLevel,
    skillLevel.skillLevelDescription
  )
  setDeploymentField("deployment.effectiveFrom", deployment, deployment.effectiveFrom)
  setDeploymentField("deployment.remark", deployment, deployment.remark)

  return {
    tabRequired: (raw as EmploymentDetailsTabConfig).tabRequired ?? true,
    fields: flattened,
  }
}

export function createEmploymentDetailsSchema(
  rawConfig?: EmploymentDetailsFieldsConfig | EmploymentDetailsTabConfig
) {
  const normalized = normalizeEmploymentDetailsConfig(rawConfig)
  const fields = normalized.fields
  const required = (key: EmploymentDetailsFieldKey) =>
    fields[key]?.required ?? DEFAULT_REQUIRED[key] ?? false

  const stringField = (
    key: EmploymentDetailsFieldKey,
    message: string,
    minLen = 1
  ) =>
    required(key)
      ? z
          .string()
          .min(minLen, message)
          .refine((val) => !hasDisallowedChars(val), {
            message: `${message.replace(" is required", "")} can only contain letters, numbers, spaces, underscores (_), and hyphens (-)`
          })
      : z
          .string()
          .optional()
          .default("")
          .refine((val) => !val || !hasDisallowedChars(val), {
            message: `${message.replace(" is required", "")} can only contain letters, numbers, spaces, underscores (_), and hyphens (-)`
          })

  return z.object({
    manager: stringField("manager", "Manager is required"),
    wasContractEmployee: required("wasContractEmployee")
      ? z.boolean()
      : z.boolean().optional().default(false),
    deployment: z.object({
      subsidiary: z.object({
        subsidiaryCode: stringField(
          "deployment.subsidiary.subsidiaryCode",
          "Subsidiary code is required"
        ),
        subsidiaryName: stringField(
          "deployment.subsidiary.subsidiaryName",
          "Subsidiary name is required"
        ),
      }),
      division: z.object({
        divisionCode: stringField("deployment.division.divisionCode", "Division code is required"),
        divisionName: stringField("deployment.division.divisionName", "Division name is required"),
      }),
      department: z.object({
        departmentCode: stringField(
          "deployment.department.departmentCode",
          "Department code is required"
        ),
        departmentName: stringField(
          "deployment.department.departmentName",
          "Department name is required"
        ),
      }),
      subDepartment: z.object({
        subDepartmentCode: stringField(
          "deployment.subDepartment.subDepartmentCode",
          "Sub Department code is required"
        ),
        subDepartmentName: stringField(
          "deployment.subDepartment.subDepartmentName",
          "Sub Department name is required"
        ),
      }),
      section: z.object({
        sectionCode: stringField("deployment.section.sectionCode", "Section code is required"),
        sectionName: stringField("deployment.section.sectionName", "Section name is required"),
      }),
      employeeCategory: z.object({
        employeeCategoryCode: stringField(
          "deployment.employeeCategory.employeeCategoryCode",
          "Employee category code is required"
        ),
        employeeCategoryTitle: stringField(
          "deployment.employeeCategory.employeeCategoryTitle",
          "Employee category title is required"
        ),
      }),
      grade: z.object({
        gradeCode: stringField("deployment.grade.gradeCode", "Grade code is required"),
        gradeTitle: stringField("deployment.grade.gradeTitle", "Grade title is required"),
      }),
      designation: z.object({
        designationCode: stringField(
          "deployment.designation.designationCode",
          "Designation code is required"
        ),
        designationName: stringField(
          "deployment.designation.designationName",
          "Designation name is required"
        ),
      }),
      location: z.object({
        locationCode: stringField("deployment.location.locationCode", "Location code is required"),
        locationName: stringField("deployment.location.locationName", "Location name is required"),
      }),
      skillLevel: z.object({
        skillLevelTitle: stringField(
          "deployment.skillLevel.skillLevelTitle",
          "Skill level title is required"
        ),
        skillLevelDescription: stringField(
          "deployment.skillLevel.skillLevelDescription",
          "Skill level description is required"
        ),
      }),
      effectiveFrom: stringField("deployment.effectiveFrom", "Effective from date is required"),
      remark: required("deployment.remark")
        ? z.string().min(1, "Remark is required").refine((val) => !hasScriptOrCodeInjection(val), {
            message: "Remark must not contain scripts or code",
          })
        : z.string().optional().default("").refine((val) => !val || !hasScriptOrCodeInjection(val), {
            message: "Remark must not contain scripts or code",
          }),
    }),
  })
}

export const employmentDetailsSchema = createEmploymentDetailsSchema()

export type EmploymentDetailsData = z.infer<typeof employmentDetailsSchema>