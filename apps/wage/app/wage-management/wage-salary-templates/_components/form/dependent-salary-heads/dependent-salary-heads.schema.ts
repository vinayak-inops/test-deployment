import { z } from "zod"

export const dependentSalaryHeadItemSchema = z.object({
  value: z.string().trim().min(1, "Dependent salary head is required"),
})

export type DependentSalaryHeadFormValues = z.infer<typeof dependentSalaryHeadItemSchema>
