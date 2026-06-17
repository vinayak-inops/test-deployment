import { z } from "zod"

export const mongoObjectIdSchema = z.union([
  z.string(),
  z.object({ $oid: z.string().min(1, "Object ID is required") }),
])

export const independentSalaryHeadItemSchema = z.object({
  salaryHeadCode: z.string().trim().min(1, "Salary head code is required"),
  salaryHeadName: z.string().trim().min(1, "Salary head name is required"),
  amount: z.number().min(0, "Amount cannot be negative"),
  parseID: z.string().min(1, "Parse ID is required"),
})

export const employeeWageTemplateSchema = z
  .object({
    _id: mongoObjectIdSchema.optional(),
    tenantCode: z.string().optional(),
    organizationCode: z.string().optional(),
    employeeID: z.string().trim().min(1, "Employee ID is required"),
    effectiveFrom: z.string().trim().min(1, "Effective From date is required"),
    effectiveTo: z.string().trim().min(1, "Effective To date is required"),
    remark: z.string().optional(),
    dependentSalaryHeads: z.array(z.string()).default([]),
    independentSalaryHeads: z
      .array(independentSalaryHeadItemSchema.omit({ parseID: true }))
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (data.effectiveTo && data.effectiveFrom && data.effectiveTo < data.effectiveFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Effective To must be on or after Effective From",
        path: ["effectiveTo"],
      })
    }
  })

export type MongoObjectId = z.infer<typeof mongoObjectIdSchema>
export type IndependentSalaryHeadItem = z.infer<typeof independentSalaryHeadItemSchema>
export type EmployeeWageTemplateFormValues = z.infer<typeof employeeWageTemplateSchema>

export const createEmptyIndependentSalaryHead = (): IndependentSalaryHeadItem => ({
  salaryHeadCode: "",
  salaryHeadName: "",
  amount: 0,
  parseID: crypto.randomUUID(),
})

export const defaultEmployeeWageTemplateValues: EmployeeWageTemplateFormValues = {
  employeeID: "",
  effectiveFrom: "",
  effectiveTo: "",
  remark: "",
  dependentSalaryHeads: [],
  independentSalaryHeads: [],
}
