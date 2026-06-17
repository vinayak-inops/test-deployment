import * as z from "zod"

const DATE_CHARS = /^[\d\-\/]*$/
const CODE_CHARS = /^[a-zA-Z0-9\-_]*$/
const STATUS_CHARS = /^[a-zA-Z0-9\s]*$/

// Remark: all characters allowed except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type ActionsStatusFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type ActionsStatusRootFieldKey =
  | "remark"
  | "defaultShiftGroupCode"
  | "resignationDate"
  | "relievingDate"
  | "dateOfLeaving"
export type ActionsStatusNestedFieldKey =
  | "currentStatus"
  | "resignationDate"
  | "relievingDate"
  | "dateOfLeaving"
  | "notToReHire"
  | "onNoticePeriod"
export type ActionsStatusRootFieldsConfig = Partial<
  Record<ActionsStatusRootFieldKey, ActionsStatusFieldConfig>
>
export type ActionsStatusNestedFieldsConfig = Partial<
  Record<ActionsStatusNestedFieldKey, ActionsStatusFieldConfig>
>
export type ActionsStatusConfig = {
  tabRequired?: boolean
  fields?: ActionsStatusRootFieldsConfig
  status?: { fields?: ActionsStatusNestedFieldsConfig }
}

export function normalizeActionsStatusConfig(raw: unknown): {
  tabRequired: boolean
  fields: ActionsStatusRootFieldsConfig
  status: { fields: ActionsStatusNestedFieldsConfig }
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
      status: { fields: {} },
    }
  }

  const config = raw as ActionsStatusConfig
  return {
    tabRequired: config.tabRequired ?? false,
    fields: config.fields ?? {},
    status: { fields: config.status?.fields ?? {} },
  }
}

export function createActionsStatusSchema(rawConfig?: ActionsStatusConfig) {
  const normalized = normalizeActionsStatusConfig(rawConfig)
  const fields = normalized.fields
  const statusFields = normalized.status.fields

  const isRequired = (key: ActionsStatusRootFieldKey) => fields[key]?.required ?? (key === "defaultShiftGroupCode")
  const isStatusRequired = (key: ActionsStatusNestedFieldKey) => statusFields[key]?.required ?? (key === "currentStatus")

  const dateField = (key: ActionsStatusRootFieldKey, msg: string) =>
    isRequired(key)
      ? z.string().min(1, msg).refine((v) => DATE_CHARS.test(v), { message: `${msg.replace(" is required", "")} must contain only digits and date separators (- or /)` })
      : z.string().optional().default("").refine((v) => !v || DATE_CHARS.test(v), { message: `${msg.replace(" is required", "")} must contain only digits and date separators (- or /)` })

  const statusDateField = (key: ActionsStatusNestedFieldKey, msg: string) =>
    isStatusRequired(key)
      ? z.string().min(1, msg).refine((v) => DATE_CHARS.test(v), { message: `${msg.replace(" is required", "")} must contain only digits and date separators (- or /)` })
      : z.string().optional().default("").refine((v) => !v || DATE_CHARS.test(v), { message: `${msg.replace(" is required", "")} must contain only digits and date separators (- or /)` })

  const remarkField = isRequired("remark")
    ? z.string().min(1, "Remark is required").refine(hasNoScriptContent, { message: "Remark must not contain code or script content" })
    : z.string().optional().default("").refine((v) => !v || hasNoScriptContent(v), { message: "Remark must not contain code or script content" })

  const codeField = isRequired("defaultShiftGroupCode")
    ? z.string().min(1, "Shift Group Code is required").refine((v) => CODE_CHARS.test(v), { message: "Shift Group Code must contain only letters, digits, hyphens (-), and underscores (_)" })
    : z.string().optional().default("").refine((v) => !v || CODE_CHARS.test(v), { message: "Shift Group Code must contain only letters, digits, hyphens (-), and underscores (_)" })

  const currentStatusField = isStatusRequired("currentStatus")
    ? z.string().min(1, "Current status is required").refine((v) => STATUS_CHARS.test(v), { message: "Current status must contain only letters, digits, and spaces" })
    : z.string().optional().default("").refine((v) => !v || STATUS_CHARS.test(v), { message: "Current status must contain only letters, digits, and spaces" })

  return z.object({
    remark: remarkField,
    defaultShiftGroupCode: codeField,
    resignationDate: dateField("resignationDate", "Resignation Date is required"),
    relievingDate: dateField("relievingDate", "Relieving Date is required"),
    dateOfLeaving: dateField("dateOfLeaving", "Date of Leaving is required"),
    status: z
      .object({
        currentStatus: currentStatusField,
        resignationDate: statusDateField("resignationDate", "Resignation Date is required"),
        relievingDate: statusDateField("relievingDate", "Relieving Date is required"),
        dateOfLeaving: statusDateField("dateOfLeaving", "Date of Leaving is required"),
        notToReHire: z.boolean(),
        onNoticePeriod: z.boolean(),
      })
      .superRefine((data, ctx) => {
        if (data.resignationDate && data.relievingDate) {
          const resignationDate = new Date(data.resignationDate)
          const relievingDate = new Date(data.relievingDate)
          if (resignationDate > relievingDate) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Resignation Date must be equal to or earlier than Relieving Date",
              path: ["resignationDate"],
            })
          }
        }

        if (data.relievingDate && data.dateOfLeaving) {
          const relievingDate = new Date(data.relievingDate)
          const dateOfLeaving = new Date(data.dateOfLeaving)
          if (relievingDate > dateOfLeaving) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Date of Leaving must be equal to or later than Relieving Date",
              path: ["dateOfLeaving"],
            })
          }
        }
      }),
  })
}

export const actionsStatusSchema = createActionsStatusSchema()

export type ActionsStatusFormData = z.infer<typeof actionsStatusSchema>

export const EMPTY_ACTIONS_STATUS_FORM_VALUES: ActionsStatusFormData = {
  remark: "",
  defaultShiftGroupCode: "",
  resignationDate: "",
  relievingDate: "",
  dateOfLeaving: "",
  status: {
    currentStatus: "Active",
    resignationDate: "",
    relievingDate: "",
    dateOfLeaving: "",
    notToReHire: false,
    onNoticePeriod: false,
  },
}