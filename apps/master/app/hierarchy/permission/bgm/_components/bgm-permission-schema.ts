import * as z from "zod"

const applyPermissionSchema = z.object({
  apply: z.boolean().default(false),
})

const bgmVerificationSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: applyPermissionSchema,
})

export const bgmPermissionSchema = z.object({
  bgm: z.object({
    isActive: z.boolean().default(false),
    verfication: bgmVerificationSchema,
  }),
})

export type BgmPermissionPayload = z.infer<typeof bgmPermissionSchema>

export const createBgmPermissionSchema = () => bgmPermissionSchema
