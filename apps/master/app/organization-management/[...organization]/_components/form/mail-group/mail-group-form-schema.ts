import { z } from "zod"

const MAIL_GROUP_CODE_CHARS = /^[a-zA-Z0-9\-]+$/
const MAIL_GROUP_NAME_CHARS = /^[a-zA-Z0-9\s.,`'()\/_\-]+$/

export const createMailGroupSchema = (
  _organizationData: any,
  _isEditMode: boolean,
  _editData?: any
) => {
  return z.object({
    mailGroupCode: z
      .string()
      .trim()
      .min(1, "Mail group code is required")
      .refine((val) => !/\s/.test(val), { message: "Mail group code must not contain spaces" })
      .refine((val) => MAIL_GROUP_CODE_CHARS.test(val), {
        message: "Mail group code can only contain letters, numbers, and hyphens (-)",
      }),
    mailGroupName: z
      .string()
      .trim()
      .min(1, "Mail group name is required")
      .refine((val) => MAIL_GROUP_NAME_CHARS.test(val), {
        message: "Mail group name can only contain letters, numbers, spaces, dots (.), commas (,), apostrophes ('), parentheses (), slashes (/), underscores (_), and hyphens (-)",
      }),
  })
}