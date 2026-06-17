import * as z from "zod"

export type ExcelUploadPermissionData = {
  excelUpload: {
    isActive: boolean
    excelFileManager: {
      permissions: {
        excelUpload: boolean
      }
      isActive: boolean
    }
  }
  isActive: boolean
}

export const createDefaultExcelUploadData = (): ExcelUploadPermissionData => ({
  excelUpload: {
    isActive: false,
    excelFileManager: {
      permissions: {
        excelUpload: false,
      },
      isActive: false,
    },
  },
  isActive: false,
})

const excelUploadSchema = z.object({
  excelUpload: z.object({
    isActive: z.boolean(),
    excelFileManager: z.object({
      permissions: z.object({
        excelUpload: z.boolean(),
      }),
      isActive: z.boolean(),
    }),
  }),
  isActive: z.boolean(),
})

export const createExcelUploadSchema = () => excelUploadSchema
