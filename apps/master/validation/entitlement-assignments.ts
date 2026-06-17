import { z } from 'zod'

export const hierarchySchema = z.object({
  subsidiary: z.array(z.string()).min(1, 'At least one subsidiary must be selected'),
  divisions: z.array(z.string()).min(1, 'At least one division must be selected'),
})

export const entitlementAssignmentSchema = z.object({
  level: z.number().min(1, 'Level must be at least 1').max(10, 'Level cannot exceed 10'),
  companyEmployeeID: z.string().min(1, 'Employee ID is required'),
  hierarchy: hierarchySchema,
  entitlementCode: z.string().min(1, 'Entitlement code is required'),
})

export type EntitlementAssignment = z.infer<typeof entitlementAssignmentSchema>
export type Hierarchy = z.infer<typeof hierarchySchema>



