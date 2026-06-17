import { z } from "zod"

export const salaryHeadItemSchema = z.object({
  salaryHeadCode: z.string().trim().min(1, "Salary head code is required"),
  salaryHeadName: z.string().trim().min(1, "Salary head name is required"),
  amount: z.number().min(0, "Amount must be non-negative"),
  parseID: z.string().optional(),
})

export type SalaryHeadItem = z.infer<typeof salaryHeadItemSchema>

export const createEmptySalaryHead = (): SalaryHeadItem => ({
  salaryHeadCode: "",
  salaryHeadName: "",
  amount: 0,
  parseID: crypto.randomUUID?.() || Math.random().toString(36),
})