import { z } from "zod"

export const professionalTaxSlabItemSchema = z
  .object({
    from: z.number().min(0, "From must be 0 or greater"),
    to: z.number().min(0, "To must be 0 or greater"),
    amount: z.number().min(0, "Amount must be 0 or greater"),
    parseID: z.string().optional(),
    _id: z.string().optional(),
  })
  .refine((v) => v.to >= v.from, {
    message: "To must be greater than or equal to From",
    path: ["to"],
  })

export const professionalTaxSlabsSchema = z.array(professionalTaxSlabItemSchema).superRefine((items, ctx) => {
  const seen = new Set<string>()
  items.forEach((item, index) => {
    const key = `${item.from}-${item.to}`
    if (seen.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate slab range: ${item.from} - ${item.to}`,
        path: [index, "from"],
      })
    } else {
      seen.add(key)
    }
  })
})

export type ProfessionalTaxSlabItem = z.infer<typeof professionalTaxSlabItemSchema>

export const EMPTY_PROFESSIONAL_TAX_SLAB: ProfessionalTaxSlabItem = {
  from: 0,
  to: 0,
  amount: 0,
  parseID: "",
}
