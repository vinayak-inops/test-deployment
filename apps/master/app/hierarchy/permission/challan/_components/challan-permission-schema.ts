import * as z from "zod"

export type ChallanPermissionPayload = {
  challan: {
    isActive: boolean
    challanUpload: {
      isActive: boolean
      permissions: {
        upload: boolean
        view: boolean
      }
    }
  }
}

const challanUploadPermissionsSchema = z.object({
  upload: z.boolean().default(false),
  view: z.boolean().default(false),
})

const challanUploadSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: challanUploadPermissionsSchema,
})

export const challanPermissionSchema = z.object({
  challan: z.object({
    isActive: z.boolean().default(false),
    challanUpload: challanUploadSchema,
  }),
})

export const createChallanPermissionSchema = () => challanPermissionSchema
