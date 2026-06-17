import { z } from "zod"

// Asset type title: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

export type AssetAllocationFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type AssetAllocationRootFieldKey = "issueDate" | "returnDate"
export type AssetAllocationAssetFieldKey = "assetCode" | "assetName" | "assetTypeCode" | "assetTypeTitle"
export type AssetAllocationRootFieldsConfig = Partial<
  Record<AssetAllocationRootFieldKey, AssetAllocationFieldConfig>
>
export type AssetAllocationAssetFieldsConfig = Partial<
  Record<AssetAllocationAssetFieldKey, AssetAllocationFieldConfig>
>
export type AssetAllocationConfig = {
  tabRequired?: boolean
  fields?: AssetAllocationRootFieldsConfig
  asset?: { fields?: AssetAllocationAssetFieldsConfig }
}

export function normalizeAssetAllocationConfig(raw: unknown): {
  tabRequired: boolean
  fields: AssetAllocationRootFieldsConfig
  asset: { fields: AssetAllocationAssetFieldsConfig }
} {
  const asObject = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  const extractFields = <T extends Record<string, unknown>>(value: unknown): T => {
    const obj = asObject(value)
    if ("fields" in obj && obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
      return obj.fields as T
    }
    return obj as T
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
      asset: { fields: {} },
    }
  }

  const root = raw as AssetAllocationConfig
  const source = asObject((root as { fields?: unknown }).fields ?? root)
  const rootFields = extractFields<AssetAllocationRootFieldsConfig>(source)
  const assetNode = asObject(source.asset ?? (root as Record<string, unknown>).asset)
  const assetFields = extractFields<AssetAllocationAssetFieldsConfig>(assetNode)
  const assetTypeNode = asObject(assetNode.assetType)
  const assetTypeFields = extractFields<AssetAllocationAssetFieldsConfig>(assetTypeNode)

  return {
    tabRequired: root.tabRequired ?? false,
    fields: {
      issueDate: rootFields.issueDate,
      returnDate: rootFields.returnDate,
    },
    asset: {
      fields: {
        assetCode: assetFields.assetCode,
        assetName: assetFields.assetName,
        assetTypeCode: assetFields.assetTypeCode ?? assetTypeFields.assetTypeCode,
        assetTypeTitle: assetFields.assetTypeTitle ?? assetTypeFields.assetTypeTitle,
      },
    },
  }
}

export function createAssetAllocationItemSchema(rawConfig?: AssetAllocationConfig) {
  const normalized = normalizeAssetAllocationConfig(rawConfig)
  const fields = normalized.fields
  const assetFields = normalized.asset.fields

  const rootField = (key: AssetAllocationRootFieldKey, msg: string) =>
    fields[key]?.required
      ? z.string().min(1, msg)
      : z.string().optional().default("")

  const assetRequiredByDefault = (key: AssetAllocationAssetFieldKey) =>
    key === "assetCode" || key === "assetName"

  type CV = { validate: (val: string) => boolean; message: string }

  const assetField = (key: AssetAllocationAssetFieldKey, msg: string, cv?: CV) =>
    (assetFields[key]?.required ?? assetRequiredByDefault(key))
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  return z
  .object({
    asset: z.object({
      assetCode: assetField("assetCode", "Asset code is required"),
      assetName: assetField("assetName", "Asset name is required"),
      assetType: z.object({
        assetTypeCode: assetField("assetTypeCode", "Asset type code is required"),
        assetTypeTitle: assetField("assetTypeTitle", "Asset type is required", {
          validate: isValidNameChar,
          message: "Asset type title can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
        }),
      }),
    }),
    issueDate: rootField("issueDate", "Issue date is required"),
    returnDate: rootField("returnDate", "Return date is required"),
  })
  .superRefine((data, ctx) => {
    if (data.issueDate && data.returnDate && new Date(data.issueDate) > new Date(data.returnDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Issue Date must be less than or equal to Return Date",
        path: ["returnDate"],
      })
    }
  })
}

export const assetAllocationItemSchema = createAssetAllocationItemSchema()

export const assetAllocationSchema = z.array(assetAllocationItemSchema)

export type AssetAllocationItem = z.infer<typeof assetAllocationItemSchema>

export const EMPTY_ASSET_ALLOCATION: AssetAllocationItem = {
  asset: {
    assetCode: "",
    assetName: "",
    assetType: {
      assetTypeCode: "",
      assetTypeTitle: "",
    },
  },
  issueDate: "",
  returnDate: "",
}