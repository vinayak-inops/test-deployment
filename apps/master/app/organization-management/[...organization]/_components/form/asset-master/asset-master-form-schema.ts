import { z } from "zod"

const ASSET_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const ASSET_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/
const ASSET_TYPE_CHARS = /^[a-zA-Z0-9\s_\-]+$/

export const createAssetMasterSchema = (
  existingAssetCodes: string[] = [],
  isEditMode: boolean,
  _editData?: any
) => {
  const normalizedExistingCodes = existingAssetCodes
    .map((code) => code.trim().toLowerCase())
    .filter(Boolean)

  return z.object({
    assetCode: isEditMode
      ? z
          .string()
          .trim()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Asset code must not contain spaces" })
          .refine((val) => !val || ASSET_CODE_CHARS.test(val), {
            message: "Asset code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Asset code is required")
          .refine((val) => !/\s/.test(val), { message: "Asset code must not contain spaces" })
          .refine((val) => ASSET_CODE_CHARS.test(val), {
            message: "Asset code can only contain letters, numbers, and hyphens (-)",
          })
          .refine(
            (value) => !normalizedExistingCodes.includes(value.trim().toLowerCase()),
            "Asset code already exists"
          ),
    assetName: z
      .string()
      .trim()
      .min(1, "Asset name is required")
      .refine((val) => ASSET_NAME_CHARS.test(val), {
        message: "Asset name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
    assetType: z
      .string()
      .trim()
      .min(1, "Asset type is required")
      .refine((val) => ASSET_TYPE_CHARS.test(val), {
        message: "Asset type can only contain letters, numbers, spaces, underscores (_), and hyphens (-)",
      }),
  })
}