import * as z from "zod"

export type AiPermissionPayload = {
  ai: {
    isActive: boolean
    aiChat: {
      isActive: boolean
      permissions: {
        view: boolean
      }
    }
  }
}

const aiChatPermissionsSchema = z.object({
  view: z.boolean().default(false),
})

const aiChatSchema = z.object({
  isActive: z.boolean().default(false),
  permissions: aiChatPermissionsSchema,
})

export const aiPermissionSchema = z.object({
  ai: z.object({
    isActive: z.boolean().default(false),
    aiChat: aiChatSchema,
  }),
})

export const createAiPermissionSchema = () => aiPermissionSchema
