import * as z from "zod"

// Old employee code: letters, numbers, hyphens only — no spaces or underscores
const isValidEmployeeCode = (str: string) => /^[a-zA-Z0-9-]+$/.test(str)

// Background verification remark: all characters except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type EmploymentDetailsFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type EmploymentDetailsFieldKey =
  | "dateOfJoining"
  | "contractFrom"
  | "contractTo"
  | "contractPeriod"
  | "rejoin.isRejoining"
  | "rejoin.oldEmployeeCode"
  | "workSkill.workSkillCode"
  | "workSkill.workSkillTitle"
  | "paymentMode"
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
  | "deployment.employeeCategory.employeeCategoryName"
  | "deployment.grade.gradeCode"
  | "deployment.grade.gradeName"
  | "deployment.designation.designationCode"
  | "deployment.designation.designationName"
  | "deployment.location.locationCode"
  | "deployment.location.locationName"
  | "deployment.location.countryCode"
  | "deployment.location.stateCode"
  | "deployment.skillLevel.skilledLevelTitle"
  | "deployment.skillLevel.skilledLevelDescription"
  | "deployment.contractor.contractorCode"
  | "deployment.contractor.contractorName"
  | "deployment.areas"
  | "deployment.salaryZone"
  | "deployment.effectiveFrom"
  | "natureOfWork.natureOfWorkCode"
  | "natureOfWork.natureOfWorkTitle"
  | "manager"
  | "superviser"
  | "backgroundVerificationRemark"
export type EmploymentDetailsFieldsConfig = Partial<
  Record<EmploymentDetailsFieldKey, EmploymentDetailsFieldConfig>
>
export type EmploymentDetailsTabConfig = {
  tabRequired?: boolean
  fields?: EmploymentDetailsFieldsConfig
}

const DEFAULT_REQUIRED: Partial<Record<EmploymentDetailsFieldKey, boolean>> = {
  contractFrom: true,
  contractTo: true,
  contractPeriod: true,
  "rejoin.isRejoining": true,
  "workSkill.workSkillCode": true,
  "workSkill.workSkillTitle": true,
  paymentMode: true,
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
  "deployment.location.locationCode": true,
  "deployment.location.locationName": true,
  "deployment.contractor.contractorCode": true,
  "deployment.contractor.contractorName": true,
  "deployment.salaryZone": true,
  "natureOfWork.natureOfWorkCode": true,
  "natureOfWork.natureOfWorkTitle": true,
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

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { tabRequired: false, fields: {} }
  }

  const root = asObject(raw)
  const source = asObject(root.fields ?? root)
  const flattened: EmploymentDetailsFieldsConfig = {}

  const setField = (key: EmploymentDetailsFieldKey, nestedValue?: unknown) => {
    const direct = toFieldConfig(source[key])
    const nested = toFieldConfig(nestedValue)
    const value = direct ?? nested
    if (value) {
      flattened[key] = value
    }
  }

  setField("dateOfJoining", source.dateOfJoining)
  setField("contractFrom", source.contractFrom)
  setField("contractTo", source.contractTo)
  setField("contractPeriod", source.contractPeriod)
  setField("paymentMode", source.paymentMode)
  setField("manager", source.manager)
  setField("superviser", source.superviser)
  setField("backgroundVerificationRemark", source.backgroundVerificationRemark)

  const rejoin = groupFields(source.rejoin)
  setField("rejoin.isRejoining", rejoin.isRejoining)
  setField("rejoin.oldEmployeeCode", rejoin.oldEmployeeCode)

  const workSkill = groupFields(source.workSkill)
  setField("workSkill.workSkillCode", workSkill.workSkillCode)
  setField("workSkill.workSkillTitle", workSkill.workSkillTitle)

  const natureOfWork = groupFields(source.natureOfWork)
  setField("natureOfWork.natureOfWorkCode", natureOfWork.natureOfWorkCode)
  setField("natureOfWork.natureOfWorkTitle", natureOfWork.natureOfWorkTitle)

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
  const contractor = groupFields(deployment.contractor)
  setField("deployment.areas", deployment.areas)
  setField("deployment.salaryZone", deployment.salaryZone)
  setField("deployment.effectiveFrom", deployment.effectiveFrom)

  setField("deployment.subsidiary.subsidiaryCode", subsidiary.subsidiaryCode)
  setField("deployment.subsidiary.subsidiaryName", subsidiary.subsidiaryName)
  setField("deployment.division.divisionCode", division.divisionCode)
  setField("deployment.division.divisionName", division.divisionName)
  setField("deployment.department.departmentCode", department.departmentCode)
  setField("deployment.department.departmentName", department.departmentName)
  setField("deployment.subDepartment.subDepartmentCode", subDepartment.subDepartmentCode)
  setField("deployment.subDepartment.subDepartmentName", subDepartment.subDepartmentName)
  setField("deployment.section.sectionCode", section.sectionCode)
  setField("deployment.section.sectionName", section.sectionName)
  setField(
    "deployment.employeeCategory.employeeCategoryCode",
    employeeCategory.employeeCategoryCode
  )
  setField(
    "deployment.employeeCategory.employeeCategoryName",
    employeeCategory.employeeCategoryName
  )
  setField("deployment.grade.gradeCode", grade.gradeCode)
  setField("deployment.grade.gradeName", grade.gradeName)
  setField("deployment.designation.designationCode", designation.designationCode)
  setField("deployment.designation.designationName", designation.designationName)
  setField("deployment.location.locationCode", location.locationCode)
  setField("deployment.location.locationName", location.locationName)
  setField("deployment.location.countryCode", location.countryCode)
  setField("deployment.location.stateCode", location.stateCode)
  setField("deployment.skillLevel.skilledLevelTitle", skillLevel.skilledLevelTitle)
  setField(
    "deployment.skillLevel.skilledLevelDescription",
    skillLevel.skilledLevelDescription
  )
  setField("deployment.contractor.contractorCode", contractor.contractorCode)
  setField("deployment.contractor.contractorName", contractor.contractorName)

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
    minLen = 1,
    charValidation?: { validate: (val: string) => boolean; message: string }
  ) =>
    required(key)
      ? charValidation
        ? z.string().min(minLen, message).refine((val) => charValidation.validate(val), { message: charValidation.message })
        : z.string().min(minLen, message)
      : charValidation
        ? z.string().optional().default("").refine((val) => !val || charValidation.validate(val), { message: charValidation.message })
        : z.string().optional().default("")

  const codeField = (
    key: EmploymentDetailsFieldKey,
    message: string,
    minLen = 1,
    charValidation?: { validate: (val: string) => boolean; message: string }
  ) =>
    required(key)
      ? charValidation
        ? z.string().min(minLen, message).refine((val) => charValidation.validate(val), { message: charValidation.message })
        : z.string().min(minLen, message)
      : charValidation
        ? z.string().optional().default("").refine((val) => !val || charValidation.validate(val), { message: charValidation.message })
        : z.string().optional().default("")

  return z
    .object({
      dateOfJoining: stringField("dateOfJoining", "Date of joining is required"),
      contractFrom: stringField("contractFrom", "Contract from date is required"),
      contractTo: stringField("contractTo", "Contract to date is required"),
      contractPeriod: required("contractPeriod")
        ? z.number().min(0, "Contract period must be positive")
        : z.number().min(0, "Contract period must be positive").optional().default(0),
      rejoin: z.object({
        isRejoining: required("rejoin.isRejoining")
          ? z.boolean()
          : z.boolean().optional().default(false),
        oldEmployeeCode: codeField("rejoin.oldEmployeeCode", "Old employee code is required", 1, {
          validate: isValidEmployeeCode,
          message: "Old employee code can only contain letters, numbers, and hyphens (-). No spaces allowed.",
        }),
      }),
      workSkill: z.object({
        workSkillCode: codeField("workSkill.workSkillCode", "Work skill code is required"),
        workSkillTitle: stringField(
          "workSkill.workSkillTitle",
          "Work skill title must be at least 2 characters",
          2
        ),
      }),
      paymentMode: stringField("paymentMode", "Payment mode is required"),
      deployment: z.object({
        subsidiary: z.object({
          subsidiaryCode: codeField(
            "deployment.subsidiary.subsidiaryCode",
            "Subsidiary code is required"
          ),
          subsidiaryName: stringField(
            "deployment.subsidiary.subsidiaryName",
            "Subsidiary name must be at least 2 characters",
            2
          ),
        }),
        division: z.object({
          divisionCode: codeField(
            "deployment.division.divisionCode",
            "Division code is required"
          ),
          divisionName: stringField(
            "deployment.division.divisionName",
            "Division name must be at least 2 characters",
            2
          ),
        }),
        department: z.object({
          departmentCode: codeField(
            "deployment.department.departmentCode",
            "Department code is required"
          ),
          departmentName: stringField(
            "deployment.department.departmentName",
            "Department name must be at least 2 characters",
            2
          ),
        }),
        subDepartment: z.object({
          subDepartmentCode: codeField(
            "deployment.subDepartment.subDepartmentCode",
            "Sub Department code is required"
          ),
          subDepartmentName: stringField(
            "deployment.subDepartment.subDepartmentName",
            "Sub Department name must be at least 2 characters",
            2
          ),
        }),
        section: z.object({
          sectionCode: codeField(
            "deployment.section.sectionCode",
            "Section code is required"
          ),
          sectionName: stringField(
            "deployment.section.sectionName",
            "Section name must be at least 2 characters",
            2
          ),
        }),
        employeeCategory: z.object({
          employeeCategoryCode: codeField(
            "deployment.employeeCategory.employeeCategoryCode",
            "Employee category code is required"
          ),
          employeeCategoryName: stringField(
            "deployment.employeeCategory.employeeCategoryName",
            "Employee category name is required"
          ),
        }),
        grade: z.object({
          gradeCode: codeField("deployment.grade.gradeCode", "Grade code is required"),
          gradeName: stringField("deployment.grade.gradeName", "Grade name is required"),
        }),
        designation: z.object({
          designationCode: codeField(
            "deployment.designation.designationCode",
            "Designation code is required"
          ),
          designationName: stringField(
            "deployment.designation.designationName",
            "Designation name is required"
          ),
        }),
        location: z.object({
          locationCode: codeField(
            "deployment.location.locationCode",
            "Location code is required"
          ),
          locationName: stringField(
            "deployment.location.locationName",
            "Location name must be at least 2 characters",
            2
          ),
          countryCode: codeField(
            "deployment.location.countryCode",
            "Country code is required"
          ),
          stateCode: codeField(
            "deployment.location.stateCode",
            "State code is required"
          ),
        }),
        skillLevel: z
          .object({
            skilledLevelTitle: stringField(
              "deployment.skillLevel.skilledLevelTitle",
              "Skill level title is required"
            ),
            skilledLevelDescription: stringField(
              "deployment.skillLevel.skilledLevelDescription",
              "Skill level description is required"
            ),
          })
          .optional(),
        contractor: z.object({
          contractorCode: codeField(
            "deployment.contractor.contractorCode",
            "Contractor code is required"
          ),
          contractorName: stringField(
            "deployment.contractor.contractorName",
            "Contractor name is required"
          ),
        }),
        areas: required("deployment.areas")
          ? z.array(z.string().min(1)).min(1, "At least one area is required")
          : z.array(z.string().min(1)).optional().default([]),
        salaryZone: stringField("deployment.salaryZone", "Salary zone is required"),
        effectiveFrom: required("deployment.effectiveFrom")
          ? z.string().min(1, "Effective from date is required")
          : z.string().optional().default(""),
      }),
      natureOfWork: z.object({
        natureOfWorkCode: codeField(
          "natureOfWork.natureOfWorkCode",
          "Nature of work code is required"
        ),
        natureOfWorkTitle: stringField(
          "natureOfWork.natureOfWorkTitle",
          "Nature of work title must be at least 2 characters",
          2
        ),
      }),
      manager: stringField("manager", "Manager is required"),
      superviser: stringField("superviser", "Supervisor is required"),
      backgroundVerificationRemark: stringField(
        "backgroundVerificationRemark",
        "Background verification remark is required",
        1,
        {
          validate: hasNoScriptContent,
          message: "Background verification remark must not contain code or script content",
        }
      ),
    })
    .superRefine((data, ctx) => {
      if (data.contractFrom && data.contractTo) {
        const fromDate = new Date(data.contractFrom)
        const toDate = new Date(data.contractTo)
        if (fromDate > toDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Contract From date must be earlier than or equal to Contract To date",
            path: ["contractTo"],
          })
        }
      }

      if (data.dateOfJoining && data.contractFrom) {
        const joiningDate = new Date(data.dateOfJoining)
        const fromDate = new Date(data.contractFrom)
        if (joiningDate > fromDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Date of Joining must be earlier than or equal to Contract From date",
            path: ["dateOfJoining"],
          })
        }
      }
    })
}

export const employmentDetailsSchema = createEmploymentDetailsSchema()

export type EmploymentDetailsData = z.infer<typeof employmentDetailsSchema>