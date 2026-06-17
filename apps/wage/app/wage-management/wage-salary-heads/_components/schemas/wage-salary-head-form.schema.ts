import { z } from "zod"

export const wageSalaryHeadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(/^[a-zA-Z0-9\s.'-]+$/, "Name can only contain letters, numbers, spaces, apostrophe ('), period (.), and hyphen (-)"),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(20, "Code must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Code can only contain letters, numbers, underscore (_), and hyphen (-)"),
  description: z.string().optional().default(""),
  salaryType: z.enum(["earning", "deduction"], { message: "Salary type is required" }),
  primarySalaryHead: z.object({
    name: z.string().trim().optional().default(""),
    code: z.string().trim().optional().default(""),
  }).optional().default({ name: "", code: "" }),
  calculationType: z.object({
    type: z.enum(["fixed", "percentage"], { message: "Calculation type is required" }),
  }),
  printable: z.boolean().default(true),
  salaryCalculationBasis: z.string().trim().min(1, "Salary calculation basis is required"),
  excludedDays: z.array(z.string()).default([]),
  applicableMonths: z.array(z.number().int().min(1).max(12)).min(1, "At least one applicable month is required"),
})

export type WageSalaryHeadFormValues = z.infer<typeof wageSalaryHeadSchema>

export const defaultWageSalaryHeadValues: WageSalaryHeadFormValues = {
  name: "",
  code: "",
  description: "",
  salaryType: "earning",
  primarySalaryHead: { name: "", code: "" },
  calculationType: { type: "fixed" },
  printable: true,
  salaryCalculationBasis: "present days",
  excludedDays: [], 
  applicableMonths: [], 
}