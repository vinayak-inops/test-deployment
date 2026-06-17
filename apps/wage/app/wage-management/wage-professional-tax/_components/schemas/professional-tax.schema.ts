import { z } from "zod"

export const professionalTaxSlabSchema = z.object({
  from: z.number().min(0),
  to: z.number().min(0),
  amount: z.number().min(0),
  parseID: z.string().min(1),
}).refine((v) => v.to >= v.from, {
  message: "To must be greater than or equal to From",
  path: ["to"],
})

export const professionalTaxFormSchema = z.object({
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  effectiveFrom: z.string().min(1, "Effective from date is required"),
  applicableTo: z.enum(["All", "Male", "Female"]),
  slabs: z.array(professionalTaxSlabSchema).min(1, "At least one slab is required"),
})

export type ProfessionalTaxSlab = z.infer<typeof professionalTaxSlabSchema>
export type ProfessionalTaxFormValues = z.infer<typeof professionalTaxFormSchema>

export const defaultProfessionalTaxFormValues: ProfessionalTaxFormValues = {
  country: "",
  state: "",
  effectiveFrom: "",
  applicableTo: "All",
  slabs: [],
}

