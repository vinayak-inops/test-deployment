import { z } from "zod"

const DOC_CATEGORY_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const DOC_CATEGORY_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createDocumentMasterSchema = (
  existingCategories: Array<{
    documentCategoryCode?: string
    documentCategoryName?: string
  }> = [],
  isEditMode: boolean,
  editData?: any
) => {
  const normalizedExistingCodes = existingCategories
    .map((category) => category.documentCategoryCode?.trim().toLowerCase() || "")
    .filter(Boolean)

  const normalizedExistingNames = existingCategories
    .map((category) => category.documentCategoryName?.trim().toLowerCase() || "")
    .filter(Boolean)

  const normalizedCurrentCode = editData?.documentCategoryCode?.trim().toLowerCase() || ""
  const normalizedCurrentName = editData?.documentCategoryName?.trim().toLowerCase() || ""

  return z.object({
    documentCategoryCode: isEditMode
      ? z
          .string()
          .optional()
          .refine((val) => !val || !/\s/.test(val), { message: "Document category code must not contain spaces" })
          .refine((val) => !val || DOC_CATEGORY_CODE_CHARS.test(val), {
            message: "Document category code can only contain letters, numbers, and hyphens (-)",
          })
      : z
          .string()
          .trim()
          .min(1, "Document category code is required")
          .refine((val) => !/\s/.test(val), { message: "Document category code must not contain spaces" })
          .refine((val) => DOC_CATEGORY_CODE_CHARS.test(val), {
            message: "Document category code can only contain letters, numbers, and hyphens (-)",
          })
          .refine((value) => !normalizedExistingCodes.includes(value.trim().toLowerCase()), {
            message: "Document category code already exists",
          }),
    documentCategoryName: z
      .string()
      .trim()
      .min(1, "Document category name is required")
      .refine((val) => DOC_CATEGORY_NAME_CHARS.test(val), {
        message: "Document category name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      })
      .refine((value) => {
        const normalizedValue = value.trim().toLowerCase()
        if (isEditMode && normalizedValue === normalizedCurrentName) {
          return true
        }
        return !normalizedExistingNames.includes(normalizedValue)
      }, "Document category name already exists"),
    documentType: z.array(z.string().min(1)).optional(),
  }).superRefine((value, ctx) => {
    if (!isEditMode || !value.documentCategoryCode) return

    const normalizedValue = value.documentCategoryCode.trim().toLowerCase()
    if (normalizedValue === normalizedCurrentCode) return

    if (normalizedExistingCodes.includes(normalizedValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["documentCategoryCode"],
        message: "Document category code already exists",
      })
    }
  })
}