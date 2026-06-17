import { z } from "zod"

// Helper function to check for disallowed special characters
const hasDisallowedChars = (str: string) => {
  // Allow only letters (a-z, A-Z), numbers (0-9), spaces, underscores (_), and hyphens (-)
  const regex = /^[a-zA-Z0-9\s_\-]+$/
  return !regex.test(str)
}

const toOptionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}, z.number().optional())

export type TrainingProgramFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type TrainingProgramFieldKey =
  | "trainingProgramCode"
  | "trainingProgramTitle"
  | "fromDate"
  | "toDate"
  | "totalDays"
  | "totalHours"
  | "validUpto"
  | "conductedByFaculty"
  | "conductedByCompany"
  | "filePath"
export type TrainingProgramFieldsConfig = Partial<Record<TrainingProgramFieldKey, TrainingProgramFieldConfig>>
export type TrainingProgramsConfig = {
  tabRequired?: boolean
  fields?: TrainingProgramFieldsConfig
}

export function normalizeTrainingProgramsConfig(raw: unknown): {
  tabRequired: boolean
  fields: TrainingProgramFieldsConfig
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
    }
  }

  const root = raw as TrainingProgramsConfig
  return {
    tabRequired: root.tabRequired ?? false,
    fields: root.fields ?? {},
  }
}

export function createTrainingProgramItemSchema(rawConfig?: TrainingProgramsConfig) {
  const normalized = normalizeTrainingProgramsConfig(rawConfig)
  const fields = normalized.fields

  const requiredByDefault = (field: TrainingProgramFieldKey) =>
    field === "trainingProgramCode" || field === "trainingProgramTitle"

  const stringField = (field: TrainingProgramFieldKey, message: string) =>
    (fields[field]?.required ?? requiredByDefault(field))
      ? z
          .string()
          .min(1, message)
          .refine((val) => !hasDisallowedChars(val), {
            message: `${message.replace(" is required", "")} can only contain letters, numbers, spaces, underscores (_), and hyphens (-)`
          })
      : z
          .string()
          .optional()
          .default("")
          .refine((val) => !val || !hasDisallowedChars(val), {
            message: `${message.replace(" is required", "")} can only contain letters, numbers, spaces, underscores (_), and hyphens (-)`
          })

  return z
    .object({
      trainingProgram: z.object({
        trainingProgramCode: stringField("trainingProgramCode", "Training program code is required"),
        trainingProgramTitle: stringField("trainingProgramTitle", "Training program title is required"),
      }),
      fromDate: stringField("fromDate", "From date is required"),
      toDate: stringField("toDate", "To date is required"),
      totalDays: (fields.totalDays?.required ?? false)
        ? z.preprocess((value) => {
            if (value === "" || value === null || value === undefined) return NaN
            return Number(value)
          }, z.number({ invalid_type_error: "Total days is required" }))
        : toOptionalNumber,
      totalHours: stringField("totalHours", "Total hours is required"),
      validUpto: stringField("validUpto", "Valid up to is required"),
      conductedByFaculty: stringField("conductedByFaculty", "Conducted by faculty is required"),
      conductedByCompany: stringField("conductedByCompany", "Conducted by company is required"),
      filePath: stringField("filePath", "Training certificate is required"),
    })
    .superRefine((data, ctx) => {
      if (data.fromDate && data.toDate && new Date(data.fromDate) > new Date(data.toDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "From Date must be less than or equal to To Date",
          path: ["toDate"],
        })
      }
    })
}

export const trainingProgramItemSchema = createTrainingProgramItemSchema()

export const trainingProgramsSchema = z.array(trainingProgramItemSchema)

export type TrainingProgramItem = z.infer<typeof trainingProgramItemSchema>

export const EMPTY_TRAINING_PROGRAM: TrainingProgramItem = {
  trainingProgram: {
    trainingProgramCode: "",
    trainingProgramTitle: "",
  },
  fromDate: "",
  toDate: "",
  totalDays: undefined,
  totalHours: "",
  validUpto: "",
  conductedByFaculty: "",
  conductedByCompany: "",
  filePath: "",
}