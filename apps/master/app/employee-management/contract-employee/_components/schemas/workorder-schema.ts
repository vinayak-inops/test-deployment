import { z } from "zod"

// All characters allowed except HTML/script content
const hasNoScriptContent = (str: string) =>
  !/<[^>]*>/.test(str) && !/javascript\s*:/i.test(str) && !/on\w+\s*=/i.test(str)

export type WorkOrderFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type WorkOrderFieldKey =
  | "workOrderNumber"
  | "effectiveFrom"
  | "effectiveTo"
  | "isActive"
  | "remark"
  | "nocByContractor"
export type WorkOrderFieldsConfig = Partial<Record<WorkOrderFieldKey, WorkOrderFieldConfig>>
export type WorkOrderConfig = {
  tabRequired?: boolean
  fields?: WorkOrderFieldsConfig
}

export function normalizeWorkOrderConfig(raw: unknown): {
  tabRequired: boolean
  fields: WorkOrderFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const obj = raw as Record<string, unknown>
  if (obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
    const config = raw as WorkOrderConfig
    return {
      tabRequired: config.tabRequired ?? false,
      fields: config.fields ?? {},
    }
  }

  return {
    tabRequired: false,
    fields: obj as WorkOrderFieldsConfig,
  }
}

export function createWorkOrderItemSchema(rawConfig?: WorkOrderConfig | WorkOrderFieldsConfig) {
  const normalized = normalizeWorkOrderConfig(rawConfig)
  const fields = normalized.fields
  const requiredByDefault = (key: WorkOrderFieldKey) => key === "workOrderNumber"
  const required = (key: WorkOrderFieldKey) => fields[key]?.required ?? requiredByDefault(key)

  const SCRIPT_MSG = "must not contain code or script content"

  const stringField = (key: WorkOrderFieldKey, message: string) =>
    required(key)
      ? z.string().min(1, message).refine(hasNoScriptContent, {
          message: `${message.replace(" is required", "")} ${SCRIPT_MSG}`,
        })
      : z.string().optional().default("").refine((val) => !val || hasNoScriptContent(val), {
          message: `${message.replace(" is required", "")} ${SCRIPT_MSG}`,
        })

  const documentPathField = (required: boolean, message: string) =>
    required
      ? z.string().min(1, message).refine(hasNoScriptContent, {
          message: `${message.replace(" is required", "")} ${SCRIPT_MSG}`,
        })
      : z.string().optional().refine((val) => !val || hasNoScriptContent(val), {
          message: `${message.replace(" is required", "")} ${SCRIPT_MSG}`,
        })

  return z
    .object({
      workOrderNumber: stringField("workOrderNumber", "Work order number is required"),
      effectiveFrom: stringField("effectiveFrom", "Effective From is required"),
      effectiveTo: stringField("effectiveTo", "Effective To is required"),
      isActive: required("isActive") ? z.boolean() : z.boolean().optional().default(false),
      remark: stringField("remark", "Remark is required"),
      nocByContractor: required("nocByContractor")
        ? z.object({
            documentPath: documentPathField(true, "NOC by contractor document is required"),
            documentType: z.string().optional(),
          })
        : z
            .object({
              documentPath: z.string().optional(),
              documentType: z.string().optional(),
            })
            .optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.effectiveFrom || !data.effectiveTo) return

      const effectiveFrom = new Date(data.effectiveFrom)
      const effectiveTo = new Date(data.effectiveTo)
      if (isNaN(effectiveFrom.getTime()) || isNaN(effectiveTo.getTime())) return

      if (effectiveFrom > effectiveTo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Effective From must be less than or equal to Effective To",
          path: ["effectiveTo"],
        })
      }
    })
}

export function createWorkOrderArraySchema(rawConfig?: WorkOrderConfig | WorkOrderFieldsConfig) {
  return z.array(createWorkOrderItemSchema(rawConfig)).min(1, "At least one work order is required")
}

export const workOrderItemSchema = createWorkOrderItemSchema()

export const workOrderArraySchema = createWorkOrderArraySchema()

export type WorkOrderItem = z.infer<typeof workOrderItemSchema>

export const createEmptyWorkOrder = (): WorkOrderItem => ({
  workOrderNumber: "",
  effectiveFrom: "",
  effectiveTo: "",
  isActive: false,
  remark: "",
  nocByContractor: {
    documentPath: "",
    documentType: "",
  },
})