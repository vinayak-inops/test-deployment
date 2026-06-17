import { z } from "zod"

const isValidNameChar = (v: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(v)

export const emailTemplateSchema = z.object({
  templateName: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be less than 100 characters")
    .refine(isValidNameChar, {
      message: "Template name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters")
    .refine(isValidNameChar, {
      message: "Subject can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
  body: z
    .string()
    .min(1, "Email content is required")
    .refine((html) => {
      const textContent = html.replace(/<[^>]*>/g, "").trim()
      return textContent.length > 0
    }, "Email content cannot be empty"),
  isActive: z.boolean().default(true),
})

export type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>

export const EMAIL_TEMPLATE_DEFAULT: EmailTemplateFormData = {
  templateName: "",
  subject:      "",
  body:         "",
  isActive:     true,
}
