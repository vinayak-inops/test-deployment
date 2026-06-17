import { z } from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export const createDocumentTypeSchema = (
  existingDocumentTypes: string[] = [],
  isEditMode: boolean,
  currentValue?: string
) => {
  const normalizedExistingTypes = existingDocumentTypes
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean)

  const normalizedCurrentValue = currentValue?.trim().toLowerCase() || ""

  return z.object({
    documentType: z
      .string()
      .trim()
      .min(1, "Document type is required")
      .refine((val) => !hasDisallowedChars(val), {
        message: "Document type can only contain letters, numbers, spaces, underscores (_), and hyphens (-)"
      })
      .refine((value) => {
        const normalizedValue = value.trim().toLowerCase()
        if (isEditMode && normalizedValue === normalizedCurrentValue) {
          return true
        }
        return !normalizedExistingTypes.includes(normalizedValue)
      }, "Document type already exists"),
  })
}