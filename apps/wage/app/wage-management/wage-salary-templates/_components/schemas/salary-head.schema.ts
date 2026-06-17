import { z } from "zod"

export const salaryHeadItemSchema = z.object({
  salaryHeadCode: z.string().min(1, "Salary head code is required"),
  salaryHeadName: z.string().min(1, "Salary head name is required"),
  amount: z.number().min(0, "Amount must be non-negative"),
  parseID: z.string().min(1, "Parse ID is required"),
})

export const salaryHeadsSchema = z.array(salaryHeadItemSchema)

export type SalaryHeadItem = z.infer<typeof salaryHeadItemSchema>

export const createEmptySalaryHead = (): SalaryHeadItem => ({
  salaryHeadCode: "",
  salaryHeadName: "",
  amount: 0,
  parseID: crypto.randomUUID(),
})
