// schemas/wage-salary-template-form.schema.ts
import { z } from "zod"

export const wageSalaryTemplateFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .regex(/^[a-zA-Z0-9\s.'-]+$/, "Name can only contain letters, numbers, spaces, apostrophe ('), period (.), and hyphen (-)"),
  code: z
    .string()
    .min(1, "Code is required")
    .max(20, "Code must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Code can only contain letters, numbers, underscore (_), and hyphen (-)"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  zone: z.string().min(1, "Zone is required"),

  subsidiaryCode: z.string().min(1, "Subsidiary is required"),
  subsidiaryName: z.string().optional(),
  locationCode: z.string().min(1, "Location is required"),
  locationName: z.string().optional(),
  designationCode: z.string().min(1, "Designation is required"),
  designationName: z.string().optional(),
  gradeCode: z.string().min(1, "Grade is required"),
  gradeName: z.string().optional(),
  categoryCode: z.string().min(1, "Category is required"),
  categoryName: z.string().optional(),

  skillLevelCode: z.string().min(1, "Skill level is required"),
  skillLevelDescription: z.string().optional(),

  effectiveFrom: z.string().min(1, "Effective from is required"),
  effectiveTo: z.string().min(1, "Effective to is required"),

  asPerMinimumWages: z.boolean().default(false),
  remark: z.string().optional().default(""),

  independentSalaryHeads: z
    .array(
      z.object({
        salaryHeadCode: z.string().optional().default(""),
        salaryHeadName: z.string().optional().default(""),
        amount: z.number().min(0).default(0),
        parseID: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  dependentSalaryHeads: z.array(z.string()).optional().default([]),
})

export type WageSalaryTemplateFormValues = z.infer<typeof wageSalaryTemplateFormSchema>

export type WageSalaryTemplatePayload = {
  name: string
  code: string
  country: string
  state: string
  zone: string
  subsidiary: { subsidiaryCode: string; subsidiaryName: string }
  location: { locationCode: string; locationName: string }
  designation: { designationCode: string; designationName: string }
  grade: { gradeCode: string; gradeName: string }
  category: { categoryCode: string; categoryName: string }
  skillLevel: { skilledLevelTitle: string; skilledLevelDescription: string }
  effectiveFrom: string
  effectiveTo: string
  asPerMinimumWages: boolean
  remark: string
  independentSalaryHeads: Array<{
    salaryHeadCode: string
    salaryHeadName: string
    amount: number
    parseID?: string
  }>
  dependentSalaryHeads: string[]
}

export const defaultWageSalaryTemplateFormValues: WageSalaryTemplateFormValues = {
  name: "",
  code: "",
  country: "",
  state: "",
  zone: "",
  subsidiaryCode: "",
  subsidiaryName: "",
  locationCode: "",
  locationName: "",
  designationCode: "",
  designationName: "",
  gradeCode: "",
  gradeName: "",
  categoryCode: "",
  categoryName: "",
  skillLevelCode: "",
  skillLevelDescription: "",
  effectiveFrom: "",
  effectiveTo: "",
  asPerMinimumWages: false,
  remark: "",
  independentSalaryHeads: [],
  dependentSalaryHeads: [],
}

const normalizeIndependentSalaryHeads = (
  value: any,
): WageSalaryTemplateFormValues["independentSalaryHeads"] =>
  Array.isArray(value)
    ? value.map((item: any) => ({
        salaryHeadCode: item?.salaryHeadCode ?? "",
        salaryHeadName: item?.salaryHeadName ?? "",
        amount: Number(item?.amount) || 0,
        parseID: item?.parseID,
      }))
    : []

export const mapWageSalaryTemplateToFormValues = (
  value?: Partial<WageSalaryTemplateFormValues> | any,
): WageSalaryTemplateFormValues => ({
  ...defaultWageSalaryTemplateFormValues,
  ...(value || {}),
  subsidiaryCode: value?.subsidiaryCode ?? value?.subsidiary?.subsidiaryCode ?? "",
  subsidiaryName: value?.subsidiaryName ?? value?.subsidiary?.subsidiaryName ?? "",
  locationCode: value?.locationCode ?? value?.location?.locationCode ?? "",
  locationName: value?.locationName ?? value?.location?.locationName ?? "",
  designationCode: value?.designationCode ?? value?.designation?.designationCode ?? "",
  designationName: value?.designationName ?? value?.designation?.designationName ?? "",
  gradeCode: value?.gradeCode ?? value?.grade?.gradeCode ?? "",
  gradeName: value?.gradeName ?? value?.grade?.gradeName ?? "",
  categoryCode: value?.categoryCode ?? value?.category?.categoryCode ?? "",
  categoryName: value?.categoryName ?? value?.category?.categoryName ?? "",
  skillLevelCode: value?.skillLevelCode ?? value?.skillLevel?.skilledLevelTitle ?? "",
  skillLevelDescription: value?.skillLevelDescription ?? value?.skillLevel?.skilledLevelDescription ?? "",
  independentSalaryHeads: normalizeIndependentSalaryHeads(value?.independentSalaryHeads),
  dependentSalaryHeads: Array.isArray(value?.dependentSalaryHeads) ? value.dependentSalaryHeads : [],
})

export const buildWageSalaryTemplatePayload = (
  values: WageSalaryTemplateFormValues,
): WageSalaryTemplatePayload => ({
  name: values.name,
  code: values.code,
  country: values.country,
  state: values.state,
  zone: values.zone,
  subsidiary: {
    subsidiaryCode: values.subsidiaryCode,
    subsidiaryName: values.subsidiaryName ?? "",
  },
  location: {
    locationCode: values.locationCode,
    locationName: values.locationName ?? "",
  },
  designation: {
    designationCode: values.designationCode,
    designationName: values.designationName ?? "",
  },
  grade: {
    gradeCode: values.gradeCode,
    gradeName: values.gradeName ?? "",
  },
  category: {
    categoryCode: values.categoryCode,
    categoryName: values.categoryName ?? "",
  },
  skillLevel: {
    skilledLevelTitle: values.skillLevelCode,
    skilledLevelDescription: values.skillLevelDescription ?? "",
  },
  effectiveFrom: values.effectiveFrom,
  effectiveTo: values.effectiveTo,
  asPerMinimumWages: values.asPerMinimumWages,
  remark: values.remark ?? "",
  independentSalaryHeads: normalizeIndependentSalaryHeads(values.independentSalaryHeads),
  dependentSalaryHeads: values.dependentSalaryHeads?.length
    ? values.dependentSalaryHeads
    : ["OT", "BONUS", "PAID_LEAVE", "NFH"],
})
