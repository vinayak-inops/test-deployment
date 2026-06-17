"use client"

import { z } from "zod"

const ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9\s.,`'()/_-]+$/
const ALLOWED_CHARS_MSG = "can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -"

const hasDisallowedChars = (str: string) => !ALLOWED_CHARS_REGEX.test(str)

// Blocks HTML/script tags only — allows everything else
const hasScriptChars = (str: string) => /[<>]/.test(str)

export type WorkOrderFieldConfig = { required?: boolean; visible?: boolean; label?: string }
export type WorkOrderFieldKey =
  | "workOrderNumber"
  | "workOrderDate"
  | "proposalReferenceNumber"
  | "NumberOfEmployee"
  | "contractPeriodFrom"
  | "contractPeriodTo"
  | "workOrderDocumentFilePath"
  | "annexureFilePath"
  | "serviceChargeAmount"
  | "workOrderType"
  | "workOrderLineItems"
  | "serviceLineItems"
  | "serviceCode"
  | "wcChargesPerEmployee"
  | "remarks"
export type WorkOrderFieldsConfig = Partial<Record<WorkOrderFieldKey, WorkOrderFieldConfig>>

export type WorkOrderDepartmentFieldKey = "departmentCode" | "departmentName"
export type WorkOrderDepartmentFieldsConfig = Partial<
  Record<WorkOrderDepartmentFieldKey, WorkOrderFieldConfig>
>

export type WorkOrderAssetChargeFieldKey = "assetCode" | "assetName" | "assetCharges"
export type WorkOrderAssetChargeFieldsConfig = Partial<
  Record<WorkOrderAssetChargeFieldKey, WorkOrderFieldConfig>
>

export type WorkOrderEmployeeWagesFieldKey = "wageType" | "wageAmount"
export type WorkOrderEmployeeWagesFieldsConfig = Partial<
  Record<WorkOrderEmployeeWagesFieldKey, WorkOrderFieldConfig>
>

export type WorkOrderAllocatedManPowerFieldKey =
  | "skilledLevelTitle"
  | "skilledLevelDescription"
  | "manPower"
export type WorkOrderAllocatedManPowerFieldsConfig = Partial<
  Record<WorkOrderAllocatedManPowerFieldKey, WorkOrderFieldConfig>
>

export type WorkOrderRootConfig = {
  tabRequired?: boolean
  fields?: WorkOrderFieldsConfig
  departments?: {
    meta?: {
      minItems?: number
      maxItems?: number
    }
    fields?: WorkOrderDepartmentFieldsConfig
  }
  assetChargesPerDay?: {
    meta?: {
      minItems?: number
      maxItems?: number
    }
    fields?: WorkOrderAssetChargeFieldsConfig
  }
  employeeWages?: {
    fields?: WorkOrderEmployeeWagesFieldsConfig
  }
  allocatedManPower?: {
    meta?: {
      minItems?: number
      maxItems?: number
    }
    fields?: WorkOrderAllocatedManPowerFieldsConfig
  }
}

const DEFAULT_REQUIRED: Record<WorkOrderFieldKey, boolean> = {
  workOrderNumber: true,
  workOrderDate: true,
  proposalReferenceNumber: false,
  NumberOfEmployee: true,
  contractPeriodFrom: true,
  contractPeriodTo: true,
  workOrderDocumentFilePath: false,
  annexureFilePath: false,
  serviceChargeAmount: false,
  workOrderType: true,
  workOrderLineItems: false,
  serviceLineItems: false,
  serviceCode: false,
  wcChargesPerEmployee: false,
  remarks: false,
}

export function normalizeWorkOrderConfig(
  rawConfig: WorkOrderFieldsConfig | WorkOrderRootConfig | undefined
): WorkOrderRootConfig {
  if (rawConfig && typeof rawConfig === "object" && "fields" in rawConfig) {
    const root = rawConfig as WorkOrderRootConfig
    return {
      tabRequired: root.tabRequired ?? true,
      fields: root.fields ?? {},
      departments: root.departments,
      assetChargesPerDay: root.assetChargesPerDay,
      employeeWages: root.employeeWages,
      allocatedManPower: root.allocatedManPower,
    }
  }
  const obj = (rawConfig ?? {}) as Record<string, unknown>
  const fieldKeys: WorkOrderFieldKey[] = [
    "workOrderNumber",
    "workOrderDate",
    "proposalReferenceNumber",
    "NumberOfEmployee",
    "contractPeriodFrom",
    "contractPeriodTo",
    "workOrderDocumentFilePath",
    "annexureFilePath",
    "serviceChargeAmount",
    "workOrderType",
    "workOrderLineItems",
    "serviceLineItems",
    "serviceCode",
    "wcChargesPerEmployee",
    "remarks",
  ]
  const flatFields: WorkOrderFieldsConfig = {}
  fieldKeys.forEach((key) => {
    const value = obj[key]
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatFields[key] = value as WorkOrderFieldConfig
    }
  })
  return {
    tabRequired: true,
    fields: flatFields,
    departments: obj.departments as WorkOrderRootConfig["departments"],
    assetChargesPerDay: obj.assetChargesPerDay as WorkOrderRootConfig["assetChargesPerDay"],
    employeeWages: obj.employeeWages as WorkOrderRootConfig["employeeWages"],
    allocatedManPower: obj.allocatedManPower as WorkOrderRootConfig["allocatedManPower"],
  }
}

const assetChargeSchema = z.object({
  assetCode: z
    .string()
    .min(1, "Asset code is required")
    .refine((val) => !hasDisallowedChars(val), { message: `Asset code ${ALLOWED_CHARS_MSG}` }),
  assetName: z
    .string()
    .min(1, "Asset name is required")
    .refine((val) => !hasDisallowedChars(val), { message: `Asset name ${ALLOWED_CHARS_MSG}` }),
  assetCharges: z.number().min(0, "Asset charges must be positive"),
})

const employeeWagesSchema = z.object({
  wageType: z
    .string()
    .optional()
    .refine((val) => !val || !hasDisallowedChars(val), {
      message: `Wage type ${ALLOWED_CHARS_MSG}`,
    }),
  wageAmount: z.number().min(0, "Wage amount must be positive").optional(),
})

const allocatedManPowerDetailSchema = z.object({
  skillLevel: z.object({
    skilledLevelTitle: z
      .string()
      .min(1, "Title is required")
      .refine((val) => !hasDisallowedChars(val), {
        message: `Skill level title ${ALLOWED_CHARS_MSG}`,
      }),
    skilledLevelDescription: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((val) => !val || !hasDisallowedChars(val), {
        message: `Skill level description ${ALLOWED_CHARS_MSG}`,
      }),
  }),
  manPower: z.number().min(0, "Man power must be positive"),
})

export function createWorkOrderSchema(rawConfig?: WorkOrderFieldsConfig | WorkOrderRootConfig) {
  const normalized = normalizeWorkOrderConfig(rawConfig)
  const fields = normalized.fields ?? {}

  const isFieldRequired = (fieldKey: WorkOrderFieldKey) =>
    fields[fieldKey]?.required ?? DEFAULT_REQUIRED[fieldKey]

  const requiredString = (fieldKey: WorkOrderFieldKey, requiredMessage: string) => {
    const label = requiredMessage.replace(" is required", "")
    return isFieldRequired(fieldKey)
      ? z
          .string()
          .min(1, requiredMessage)
          .refine((val) => !hasDisallowedChars(val), { message: `${label} ${ALLOWED_CHARS_MSG}` })
      : z
          .string()
          .optional()
          .refine((val) => !val || !hasDisallowedChars(val), {
            message: `${label} ${ALLOWED_CHARS_MSG}`,
          })
  }

  return z
    .object({
      workOrderNumber: requiredString("workOrderNumber", "Work order number is required"),
      workOrderDate: requiredString("workOrderDate", "Work order date is required"),
      proposalReferenceNumber: z
        .string()
        .nullable()
        .optional()
        .or(z.literal(""))
        .refine((val) => !val || !hasDisallowedChars(val), {
          message: `Proposal reference number ${ALLOWED_CHARS_MSG}`,
        }),
      NumberOfEmployee: isFieldRequired("NumberOfEmployee")
        ? z
            .number({
              required_error: "Number of employees is required",
              invalid_type_error: "Number of employees is required",
            })
            .min(0, "Number of employees must be positive")
        : z
            .number()
            .optional()
            .refine((val) => val === undefined || val >= 0, "Number of employees must be positive"),
      contractPeriodFrom: requiredString("contractPeriodFrom", "Contract period from is required"),
      contractPeriodTo: requiredString("contractPeriodTo", "Contract period to is required"),
      workOrderDocumentFilePath: z.string().nullable().optional().or(z.literal("")),
      annexureFilePath: z.string().nullable().optional().or(z.literal("")),
      serviceChargeAmount: z.number().min(0, "Service charge amount must be positive").optional(),
      workOrderType: requiredString("workOrderType", "Work order type is required"),
      workOrderLineItems: z
        .string()
        .nullable()
        .optional()
        .or(z.literal(""))
        .refine((val) => !val || !hasScriptChars(val), {
          message: "Work order line items must not contain < or >",
        }),
      serviceLineItems: z
        .string()
        .nullable()
        .optional()
        .or(z.literal(""))
        .refine((val) => !val || !hasScriptChars(val), {
          message: "Service line items must not contain < or >",
        }),
      serviceCode: z
        .string()
        .nullable()
        .optional()
        .or(z.literal(""))
        .refine((val) => !val || !hasDisallowedChars(val), {
          message: `Service code ${ALLOWED_CHARS_MSG}`,
        }),
      wcChargesPerEmployee: z.number().min(0, "WC charges per employee must be positive").optional(),
      assetChargesPerDay: z.array(assetChargeSchema),
      employeeWages: employeeWagesSchema.optional(),
      allocatedManPower: z.array(allocatedManPowerDetailSchema).optional(),
      remarks: z
        .string()
        .nullable()
        .optional()
        .or(z.literal(""))
        .refine((val) => !val || !hasDisallowedChars(val), {
          message: `Remarks ${ALLOWED_CHARS_MSG}`,
        }),
    })
    .superRefine((data, ctx) => {
      if (data.contractPeriodFrom && data.contractPeriodTo) {
        const fromDate = new Date(data.contractPeriodFrom)
        const toDate = new Date(data.contractPeriodTo)
        if (fromDate > toDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Contract Period From date must be earlier than or equal to Contract Period To date",
            path: ["contractPeriodTo"],
          })
        }
      }

      if (data.workOrderDate && data.contractPeriodFrom) {
        const workOrderDate = new Date(data.workOrderDate)
        const contractPeriodFrom = new Date(data.contractPeriodFrom)
        if (workOrderDate > contractPeriodFrom) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Work Order Date must be less than or equal to Contract Period From date",
            path: ["workOrderDate"],
          })
        }
      }

      if (
        data.workOrderType === "Man Power" &&
        data.allocatedManPower &&
        data.allocatedManPower.length > 0
      ) {
        const seenAlloc = new Set<string>()
        for (let i = 0; i < data.allocatedManPower.length; i++) {
          const curr = data.allocatedManPower[i]
          const title = (curr?.skillLevel?.skilledLevelTitle || "").trim()
          const desc = (curr?.skillLevel?.skilledLevelDescription || "").trim()
          const key = `${title}|||${desc}`.toLowerCase()
          if (title) {
            if (seenAlloc.has(key)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Duplicate skill level not allowed",
                path: ["allocatedManPower", i, "skillLevel", "skilledLevelTitle"],
              })
            }
            seenAlloc.add(key)
          }
        }
      }
    })
}

export const workOrderSchema = createWorkOrderSchema()

type AssetCharge = z.infer<typeof assetChargeSchema>
type EmployeeWages = z.infer<typeof employeeWagesSchema>
type AllocatedManPowerDetail = z.infer<typeof allocatedManPowerDetailSchema>

export type WorkOrder = {
  parseID?: string
  workOrderNumber: string
  workOrderDate: string
  proposalReferenceNumber?: string
  NumberOfEmployee: number
  contractPeriodFrom: string
  contractPeriodTo: string
  workOrderDocumentFilePath?: string
  annexureFilePath?: string
  serviceChargeAmount?: number
  workOrderType: string
  workOrderLineItems?: string
  serviceLineItems?: string
  serviceCode?: string
  wcChargesPerEmployee?: number
  assetChargesPerDay: AssetCharge[]
  employeeWages?: EmployeeWages
  allocatedManPower?: AllocatedManPowerDetail[]
  departments?: Array<{ departmentCode: string; departmentName: string }>
  remarks?: string
  showAllManPower?: boolean
  showAllAssetCharges?: boolean
}

export const EMPTY_WORK_ORDER: WorkOrder = {
  workOrderNumber: "",
  workOrderDate: "",
  proposalReferenceNumber: "",
  NumberOfEmployee: 0,
  contractPeriodFrom: "",
  contractPeriodTo: "",
  workOrderDocumentFilePath: "",
  annexureFilePath: "",
  serviceChargeAmount: 0,
  workOrderType: "Standard",
  workOrderLineItems: "",
  serviceLineItems: "",
  serviceCode: "",
  wcChargesPerEmployee: 0,
  assetChargesPerDay: [],
  employeeWages: { wageType: "", wageAmount: 0 },
  remarks: "",
}