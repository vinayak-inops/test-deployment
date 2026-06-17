import { z } from "zod"

// Subsidiary Schema
export const subsidiarySchema = z.object({
  subsidiaryCode: z.string().trim().min(1, "Subsidiary code is required"),
  subsidiaryName: z.string().trim().min(1, "Subsidiary name is required"),
})

// Division Schema
export const divisionSchema = z.object({
  divisionCode: z.string().trim().min(1, "Division code is required"),
  divisionName: z.string().trim().min(1, "Division name is required"),
})

// Location Schema
export const locationSchema = z.object({
  locationCode: z.string().trim().min(1, "Location code is required"),
  locationName: z.string().trim().min(1, "Location name is required"),
})

// Department Schema
export const departmentSchema = z.object({
  departmentCode: z.string().trim().min(1, "Department code is required"),
  departmentName: z.string().trim().min(1, "Department name is required"),
})

// Manpower Schema
export const manpowerSchema = z.object({
  planned: z.number().int().min(0, "Planned manpower cannot be negative").default(0),
  rotaPlanned: z.number().int().min(0, "Rota planned manpower cannot be negative").default(0),
  bench: z.number().int().min(0, "Bench manpower cannot be negative").default(0),
  iedRequired: z.number().int().min(0, "IED required manpower cannot be negative").default(0),
})

// Main Form Schema
export const manpowerPlanningSchema = z.object({
  subsidiary: subsidiarySchema,
  division: divisionSchema,
  location: locationSchema,
  department: departmentSchema,
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  shiftGroupCode: z.string().trim().min(1, "Shift group code is required"),
  shiftCode: z.string().trim().min(1, "Shift code is required"),
  manpower: manpowerSchema,
}).refine(
  (data) => {
    const from = new Date(data.fromDate)
    const to = new Date(data.toDate)
    return from <= to
  },
  {
    message: "From date must be before or equal to To date",
    path: ["toDate"],
  }
)

// Types
export type SubsidiaryFormValues = z.infer<typeof subsidiarySchema>
export type DivisionFormValues = z.infer<typeof divisionSchema>
export type LocationFormValues = z.infer<typeof locationSchema>
export type DepartmentFormValues = z.infer<typeof departmentSchema>
export type ManpowerFormValues = z.infer<typeof manpowerSchema>
export type ManpowerPlanningFormValues = z.infer<typeof manpowerPlanningSchema>

// Default Values
export const defaultSubsidiaryValues: SubsidiaryFormValues = {
  subsidiaryCode: "",
  subsidiaryName: "",
}

export const defaultDivisionValues: DivisionFormValues = {
  divisionCode: "",
  divisionName: "",
}

export const defaultLocationValues: LocationFormValues = {
  locationCode: "",
  locationName: "",
}

export const defaultDepartmentValues: DepartmentFormValues = {
  departmentCode: "",
  departmentName: "",
}

export const defaultManpowerValues: ManpowerFormValues = {
  planned: 0,
  rotaPlanned: 0,
  bench: 0,
  iedRequired: 0,
}

export const defaultManpowerPlanningValues: ManpowerPlanningFormValues = {
  subsidiary: defaultSubsidiaryValues,
  division: defaultDivisionValues,
  location: defaultLocationValues,
  department: defaultDepartmentValues,
  fromDate: "",
  toDate: "",
  shiftGroupCode: "",
  shiftCode: "",
  manpower: defaultManpowerValues,
}