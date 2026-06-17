import { z } from "zod"

export type OrganizationFieldKey =
  | "leaveCode"
  | "leaveTitle"
  | "subsidiary.subsidiaryCode"
  | "subsidiary.subsidiaryName"
  | "location.locationCode"
  | "location.locationName"
  | "designation.designationCode"
  | "designation.designationName"
  | "employeeCategory"

type FieldConfig = {
  label: string
  required?: boolean
  visible?: boolean
}

export type OrganizationFormConfig = {
  fields: Partial<Record<OrganizationFieldKey, FieldConfig>>
}

const defaultFields: Record<OrganizationFieldKey, FieldConfig> = {
  leaveCode: { label: "Leave Code", visible: true, required: true },
  leaveTitle: { label: "Leave Title", visible: true, required: true },
  "subsidiary.subsidiaryCode": { label: "Subsidiary Code", visible: true, required: true },
  "subsidiary.subsidiaryName": { label: "Subsidiary Name", visible: true, required: true },
  "location.locationCode": { label: "Location Code", visible: true, required: true },
  "location.locationName": { label: "Location Name", visible: true, required: true },
  "designation.designationCode": { label: "Designation Code", visible: true, required: true },
  "designation.designationName": { label: "Designation Name", visible: true, required: true },
  employeeCategory: { label: "Category Codes", visible: true, required: true },
}

export const normalizeOrganizationConfig = (config?: OrganizationFormConfig) => {
  const merged = {} as Record<OrganizationFieldKey, FieldConfig>
  ;(Object.keys(defaultFields) as OrganizationFieldKey[]).forEach((key) => {
    const fromConfig = config?.fields?.[key]
    merged[key] = {
      label: fromConfig?.label || defaultFields[key].label,
      required: fromConfig?.required ?? defaultFields[key].required ?? false,
      visible: fromConfig?.visible ?? defaultFields[key].visible ?? true,
    }
  })
  return { fields: merged }
}

export const createOrganizationSchema = (config: ReturnType<typeof normalizeOrganizationConfig>) =>
  z
    .object({
      leaveCode: z.string(),
      leaveTitle: z.string(),
      subsidiary: z.object({
        subsidiaryCode: z.string(),
        subsidiaryName: z.string(),
      }),
      location: z.object({
        locationCode: z.string(),
        locationName: z.string(),
      }),
      designation: z.object({
        designationCode: z.string(),
        designationName: z.string(),
      }),
      employeeCategory: z.array(z.string()),
    })
    .superRefine((values, ctx) => {
      const getValue = (field: OrganizationFieldKey) => {
        switch (field) {
          case "leaveCode":
            return values.leaveCode
          case "leaveTitle":
            return values.leaveTitle
          case "subsidiary.subsidiaryCode":
            return values.subsidiary.subsidiaryCode
          case "subsidiary.subsidiaryName":
            return values.subsidiary.subsidiaryName
          case "location.locationCode":
            return values.location.locationCode
          case "location.locationName":
            return values.location.locationName
          case "designation.designationCode":
            return values.designation.designationCode
          case "designation.designationName":
            return values.designation.designationName
          case "employeeCategory":
            return values.employeeCategory
        }
      }

      const getPath = (field: OrganizationFieldKey): (string | number)[] => {
        if (field.includes(".")) return field.split(".")
        return [field]
      }

      ;(Object.keys(config.fields) as OrganizationFieldKey[]).forEach((field) => {
        const fieldConfig = config.fields[field]
        if (!fieldConfig?.required) return
        const value = getValue(field)
        const isEmptyString = typeof value === "string" && value.trim().length === 0
        const isEmptyArray = Array.isArray(value) && value.length === 0
        if (isEmptyString || isEmptyArray) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: getPath(field),
            message: `${fieldConfig.label} is required`,
          })
        }
      })
    })

export const organizationSchema = createOrganizationSchema(normalizeOrganizationConfig())

export type OrganizationData = z.infer<typeof organizationSchema>

// Payload schema used while persisting add-leave-policy popup data
export const organizationPayloadSchema = z.object({
  leaveCode: z.string(),
  leaveTitle: z.string(),
  leavePolicy: z.object({
    leaveCode: z.string(),
    leaveTitle: z.string(),
  }),
  subsidiary: z.object({
    subsidiaryCode: z.string(),
    subsidiaryName: z.string(),
  }),
  location: z.object({
    locationCode: z.string(),
    locationName: z.string(),
  }),
  designation: z.object({
    designationCode: z.string(),
    designationName: z.string(),
  }),
  employeeCategory: z.array(z.string()),
})

export type OrganizationPayloadData = z.infer<typeof organizationPayloadSchema>