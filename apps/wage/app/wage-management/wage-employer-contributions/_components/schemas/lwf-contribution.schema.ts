import { z } from "zod"

export const lwfContributionTypeSchema = z.enum(["employer", "employee"])

export const lwfContributionItemSchema = z.object({
  contributionType: lwfContributionTypeSchema,
  contribution: z.number().min(0, "Contribution cannot be negative"),
  country: z.string().trim().min(1, "Country is required"),
  state: z.string().trim().min(1, "State is required"),
  effectiveFrom: z.string().trim().min(1, "Effective from date is required"),
  parseID: z.string().min(1, "Parse ID is required"),
})

export const lwfContributionCollectionSchema = z.object({
  employer: z.array(lwfContributionItemSchema.omit({ contributionType: true, parseID: true })),
  employee: z.array(lwfContributionItemSchema.omit({ contributionType: true, parseID: true })),
})

export type LWFContributionType = z.infer<typeof lwfContributionTypeSchema>
export type LWFContributionItem = z.infer<typeof lwfContributionItemSchema>

export type LWFContributionCollection = {
  employer: Array<Pick<LWFContributionItem, "contribution" | "country" | "state" | "effectiveFrom">>
  employee: Array<Pick<LWFContributionItem, "contribution" | "country" | "state" | "effectiveFrom">>
}

// REMOVED default values - now creates empty contribution
export const createEmptyLWFContribution = (type: LWFContributionType = "employer"): LWFContributionItem => ({
  contributionType: type,
  contribution: 0,
  country: "", // Changed from "IN" to empty string
  state: "",
  effectiveFrom: "", // Changed from current date to empty string
  parseID: crypto.randomUUID(),
})

// REMOVED default values in normalize function
export const normalizeLWFCollection = (value: any): LWFContributionCollection => ({
  employer: Array.isArray(value?.employer)
    ? value.employer.map((item: any) => ({
        contribution: Number(item?.contribution) || 0,
        country: item?.country ?? "", // Changed from "IN" to empty string
        state: item?.state ?? "",
        effectiveFrom: typeof item?.effectiveFrom === "string" && item.effectiveFrom.includes("T")
          ? item.effectiveFrom.split("T")[0]
          : item?.effectiveFrom ?? "",
      }))
    : [],
  employee: Array.isArray(value?.employee)
    ? value.employee.map((item: any) => ({
        contribution: Number(item?.contribution) || 0,
        country: item?.country ?? "", // Changed from "IN" to empty string
        state: item?.state ?? "",
        effectiveFrom: typeof item?.effectiveFrom === "string" && item.effectiveFrom.includes("T")
          ? item.effectiveFrom.split("T")[0]
          : item?.effectiveFrom ?? "",
      }))
    : [],
})

// No changes needed for flatten and toCollection functions
export const flattenLWFCollection = (value: LWFContributionCollection): LWFContributionItem[] => [
  ...value.employer.map((item, index) => ({
    ...item,
    contributionType: "employer" as const,
    parseID: `employer-${item.state || "state"}-${item.effectiveFrom || "date"}-${index}`,
  })),
  ...value.employee.map((item, index) => ({
    ...item,
    contributionType: "employee" as const,
    parseID: `employee-${item.state || "state"}-${item.effectiveFrom || "date"}-${index}`,
  })),
]

export const toLWFCollection = (items: LWFContributionItem[]): LWFContributionCollection => ({
  employer: items
    .filter((item) => item.contributionType === "employer")
    .map(({ contribution, country, state, effectiveFrom }) => ({ contribution, country, state, effectiveFrom })),
  employee: items
    .filter((item) => item.contributionType === "employee")
    .map(({ contribution, country, state, effectiveFrom }) => ({ contribution, country, state, effectiveFrom })),
})