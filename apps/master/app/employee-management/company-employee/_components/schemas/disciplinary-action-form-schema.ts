import { z } from "zod"

// All characters allowed except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type DisciplinaryActionFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type DisciplinaryActionFieldKey =
  | "actionTakenOn"
  | "issueReportedOn"
  | "issuedescription"
  | "actionDescription"
  | "remark"
  | "status"
  | "documentPath"
export type DisciplinaryActionFieldsConfig = Partial<
  Record<DisciplinaryActionFieldKey, DisciplinaryActionFieldConfig>
>
export type DisciplinaryActionConfig = {
  tabRequired?: boolean
  fields?: DisciplinaryActionFieldsConfig
}

export function normalizeDisciplinaryActionConfig(raw: unknown): {
  tabRequired: boolean
  fields: DisciplinaryActionFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const obj = raw as Record<string, unknown>
  if (obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
    const config = raw as DisciplinaryActionConfig
    return {
      tabRequired: config.tabRequired ?? false,
      fields: config.fields ?? {},
    }
  }

  return {
    tabRequired: false,
    fields: obj as DisciplinaryActionFieldsConfig,
  }
}

export function createDisciplinaryActionItemSchema(
  rawConfig?: DisciplinaryActionConfig | DisciplinaryActionFieldsConfig
) {
  const normalized = normalizeDisciplinaryActionConfig(rawConfig)
  const fields = normalized.fields

  const requiredByDefault = (field: DisciplinaryActionFieldKey) =>
    field === "actionTakenOn" ||
    field === "issueReportedOn" ||
    field === "issuedescription" ||
    field === "actionDescription" ||
    field === "status"

  const createField = (field: DisciplinaryActionFieldKey, message: string) =>
    (fields[field]?.required ?? requiredByDefault(field))
      ? z.string().min(1, message).refine(hasNoScriptContent, {
          message: `${message.replace(" is required", "")} must not contain code or script content`,
        })
      : z.string().optional().default("").refine((val) => !val || hasNoScriptContent(val), {
          message: `${message.replace(" is required", "")} must not contain code or script content`,
        })

  return z
  .object({
    actionTakenOn: createField("actionTakenOn", "Action taken date is required"),
    issueReportedOn: createField("issueReportedOn", "Issue reported date is required"),
    issuedescription: createField("issuedescription", "Issue description is required"),
    actionDescription: createField("actionDescription", "Action description is required"),
    remark: createField("remark", "Remark is required"),
    status: createField("status", "Status is required"),
    documentPath: createField("documentPath", "Document is required"),
  })
  .superRefine((data, ctx) => {
    if (data.issueReportedOn && data.actionTakenOn) {
      const issueReportedDate = new Date(data.issueReportedOn)
      const actionTakenDate = new Date(data.actionTakenOn)

      if (issueReportedDate > actionTakenDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Issue Reported On must be earlier than or equal to Action Taken On",
          path: ["actionTakenOn"],
        })
      }
    }
  })
}

export const disciplinaryActionItemSchema = createDisciplinaryActionItemSchema()

export const disciplinaryActionSchema = z.array(disciplinaryActionItemSchema)

export type DisciplinaryActionItem = z.infer<typeof disciplinaryActionItemSchema>

export const EMPTY_DISCIPLINARY_ACTION: DisciplinaryActionItem = {
  actionTakenOn: "",
  issueReportedOn: "",
  issuedescription: "",
  actionDescription: "",
  remark: "",
  status: "Open",
  documentPath: "",
}