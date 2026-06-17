import { z } from "zod"
import { salaryHeadsSchema } from "./salary-head.schema"

export const minimumWagesSkillLevelSchema = z.object({
  skilledLevelTitle: z.string().min(1, "Skill level title is required"),
  skilledLevelDescription: z.string().min(1, "Skill level description is required"),
})

export const minimumWagesPopupSchema = z.object({
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  zone: z.string().min(1, "Zone is required"),
  location: z.array(z.string().min(1)).min(1, "At least one location is required"),
  skillLevel: minimumWagesSkillLevelSchema,
  effectiveFrom: z.string().min(1, "Effective From is required"),
  salaryHeads: salaryHeadsSchema,
  remark: z.string().optional().default(""),
})

export type MinimumWagesPopupValues = z.infer<typeof minimumWagesPopupSchema>

export const defaultMinimumWagesPopupValues: MinimumWagesPopupValues = {
  country: "INDIA",
  state: "",
  zone: "",
  location: [],
  skillLevel: {
    skilledLevelTitle: "",
    skilledLevelDescription: "",
  },
  effectiveFrom: "",
  salaryHeads: [],
  remark: "",
}
