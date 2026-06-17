import * as z from "zod"

export type FieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}

export type HrApproverFieldKey =
  | "contractEmployeeApproverApprove"
  | "companyEmployeeApproverApprove"
  | "contracerApproverApprove"

type HrApproverPermissionFieldConfig = {
  fields?: {
    permissions?: {
      fields?: {
        approve?: FieldConfig
      }
    }
  }
}

export type HrApproverFieldsConfig = Partial<
  Record<HrApproverFieldKey, FieldConfig | HrApproverPermissionFieldConfig>
>

export type HrApproverTabConfig = {
  tabRequired?: boolean
  fields?: HrApproverFieldsConfig
}

export type HrApproverData = {
  _id?: string
  hrapprover?: {
    isActive?: boolean
    contractEmployeeApprover?: {
      permissions?: {
        approve?: boolean
      }
      isActive?: boolean
    }
    companyEmployeeApprover?: {
      permissions?: {
        approve?: boolean
      }
      isActive?: boolean
    }
    contracerApprover?: {
      permissions?: {
        approve?: boolean
      }
      isActive?: boolean
    }
  }
}

export const createDefaultHrApproverData = (): HrApproverData => ({
  _id: "",
  hrapprover: {
    isActive: false,
    contractEmployeeApprover: {
      permissions: {
        approve: false,
      },
      isActive: false,
    },
    companyEmployeeApprover: {
      permissions: {
        approve: false,
      },
      isActive: false,
    },
    contracerApprover: {
      permissions: {
        approve: false,
      },
      isActive: false,
    },
  },
})

export function normalizeHrApproverConfig(
  rawConfig: HrApproverFieldsConfig | HrApproverTabConfig | undefined
): HrApproverTabConfig {
  const normalizeFields = (fields?: HrApproverFieldsConfig): HrApproverFieldsConfig => {
    if (!fields) return {}

    const normalized = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => {
        const legacy = value as FieldConfig | undefined
        const nested = value as HrApproverPermissionFieldConfig | undefined
        const approveConfig = nested?.fields?.permissions?.fields?.approve

        return [
          key,
          approveConfig ?? {
            label: legacy?.label,
            visible: legacy?.visible,
            required: legacy?.required,
          },
        ]
      }),
    ) as HrApproverFieldsConfig

    return normalized
  }

  if (rawConfig && typeof rawConfig === "object" && "fields" in rawConfig) {
    return {
      ...(rawConfig as HrApproverTabConfig),
      fields: normalizeFields((rawConfig as HrApproverTabConfig).fields),
    }
  }
  return {
    tabRequired: true,
    fields: normalizeFields((rawConfig ?? {}) as HrApproverFieldsConfig),
  }
}

export function createHrApproverSchema(
  rawConfig?: HrApproverFieldsConfig | HrApproverTabConfig
) {
  const tabConfig = normalizeHrApproverConfig(rawConfig)
  const fieldConfig = tabConfig.fields ?? {}

  const makeApproveSchema = (requiredKey: HrApproverFieldKey) => {
    const config = fieldConfig[requiredKey]
    const isRequired = (config as FieldConfig)?.required ?? false
    return isRequired
      ? z.boolean().refine((val) => val === true, "Approve permission is required")
      : z.boolean().optional()
  }

  return z.object({
    _id: z.string().optional(),
    hrapprover: z
      .object({
        isActive: z.boolean(),
        contractEmployeeApprover: z.object({
          permissions: z.object({
            approve: makeApproveSchema("contractEmployeeApproverApprove"),
          }),
          isActive: z.boolean().optional(),
        }),
        companyEmployeeApprover: z.object({
          permissions: z.object({
            approve: makeApproveSchema("companyEmployeeApproverApprove"),
          }),
          isActive: z.boolean().optional(),
        }),
        contracerApprover: z.object({
          permissions: z.object({
            approve: makeApproveSchema("contracerApproverApprove"),
          }),
          isActive: z.boolean().optional(),
        }),
      })
      .optional(),
  })
}

export const hrApproverSchema = createHrApproverSchema()
