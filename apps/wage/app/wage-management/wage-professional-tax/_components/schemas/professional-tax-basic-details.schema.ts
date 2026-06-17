import { z } from "zod"

export const professionalTaxBasicDetailsSchema = z.object({
  country: z.string().trim().min(1, "Country is required"),
  state: z.string().trim().min(1, "State is required"),
  effectiveFrom: z.string().trim().min(1, "Effective from date is required"),
  applicableTo: z.enum(["All", "Male", "Female"], {
    message: "Applicable To is required",
  }),
})

export type ProfessionalTaxBasicDetailsValues = z.infer<typeof professionalTaxBasicDetailsSchema>

export function validateProfessionalTaxBasicDetails(values: ProfessionalTaxBasicDetailsValues) {
  const result = professionalTaxBasicDetailsSchema.safeParse(values)
  if (result.success) {
    return { success: true as const, errors: {} as Partial<Record<keyof ProfessionalTaxBasicDetailsValues, string>> }
  }

  const errors: Partial<Record<keyof ProfessionalTaxBasicDetailsValues, string>> = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ProfessionalTaxBasicDetailsValues | undefined
    if (field && !errors[field]) {
      errors[field] = issue.message
    }
  }

  return { success: false as const, errors }
}
