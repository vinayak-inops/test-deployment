import { z } from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export const createAssetTypeSchema = (
  existingAssetTypes: string[] = [],
  isEditMode: boolean,
  currentValue?: string
) => {
  const normalizedExistingTypes = existingAssetTypes
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean)

  const normalizedCurrentValue = currentValue?.trim().toLowerCase() || ""

  return z.object({
    assetType: z
      .string()
      .trim()
      .min(1, "Asset type is required")
      .refine((val) => !hasDisallowedChars(val), {
        message: "Asset type can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
      })
      .refine((value) => {
        const normalizedValue = value.trim().toLowerCase()
        if (isEditMode && normalizedValue === normalizedCurrentValue) {
          return true
        }
        return !normalizedExistingTypes.includes(normalizedValue)
      }, "Asset type already exists"),
  })
}