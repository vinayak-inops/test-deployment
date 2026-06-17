import { z } from "zod"

const hasDisallowedChars = (str: string) => {
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

export const createSalaryHeadSchema = (isEditMode: boolean) => {
  return z.object({
    parseID: z.string().optional(),
    salaryHeadCode: isEditMode
      ? z.string().optional()
      : z.string()
          .min(1, "Salary head code is required")
          .refine((val) => !hasDisallowedChars(val), {
            message: "Salary head code can only contain letters, numbers, spaces, underscores (_), and hyphens (-)",
          }),
    salaryHeadName: z.string().min(1, "Salary head name is required"),
    amount: z.number().min(0, "Amount must be non-negative"),
  })
}

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

