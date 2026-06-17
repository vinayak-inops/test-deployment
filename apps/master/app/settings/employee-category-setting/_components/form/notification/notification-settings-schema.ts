import { z } from "zod"

// Property name: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (v: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(v)

export const notificationSettingsSchema = z.object({
  parseID:          z.string().optional(),
  propertyName:     z.string().min(1, "Property name is required")
    .refine(isValidNameChar, { message: "Property name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -" }),
  mailGroup:        z.string().min(1, "Mail group is required"),
  notifyPriorDays:  z.number().min(0, "Must be 0 or greater"),
  notifyEnabled:    z.boolean(),
  autoBlockEnabled: z.boolean(),
  isActive:         z.boolean(),
})

export type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>

export const NOTIFICATION_SETTINGS_DEFAULT: NotificationSettingsFormData = {
  propertyName:     "",
  mailGroup:        "",
  notifyPriorDays:  0,
  notifyEnabled:    false,
  autoBlockEnabled: false,
  isActive:         false,
}
