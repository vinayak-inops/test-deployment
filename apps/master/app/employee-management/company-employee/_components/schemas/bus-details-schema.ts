import * as z from "zod"

// Bus/registration numbers: letters, numbers, underscore, hyphen only
const isValidBusNumber = (str: string) => /^[a-zA-Z0-9_-]+$/.test(str)

// Route: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

export type BusDetailsFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type BusDetailsFieldKey = "busNumber" | "busRegistrationNumber" | "route"
export type BusDetailsFieldsConfig = Partial<Record<BusDetailsFieldKey, BusDetailsFieldConfig>>
export type BusDetailsConfig = {
  tabRequired?: boolean
  busDetail?: { fields?: BusDetailsFieldsConfig }
}

export function normalizeBusDetailsConfig(raw: unknown): {
  tabRequired: boolean
  busDetail: { fields: BusDetailsFieldsConfig }
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      busDetail: { fields: {} },
    }
  }

  const obj = raw as Record<string, unknown>

  if (obj.busDetail && typeof obj.busDetail === "object" && !Array.isArray(obj.busDetail)) {
    const root = raw as BusDetailsConfig
    return {
      tabRequired: root.tabRequired ?? false,
      busDetail: { fields: root.busDetail?.fields ?? {} },
    }
  }

  if (obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
    return {
      tabRequired: false,
      busDetail: { fields: obj.fields as BusDetailsFieldsConfig },
    }
  }

  return {
    tabRequired: false,
    busDetail: { fields: obj as BusDetailsFieldsConfig },
  }
}

export function createBusDetailsSchema(
  rawConfig?: BusDetailsConfig | { fields?: BusDetailsFieldsConfig } | BusDetailsFieldsConfig
) {
  const normalized = normalizeBusDetailsConfig(rawConfig)
  const fields = normalized.busDetail.fields

  type CV = { validate: (val: string) => boolean; message: string }

  const fieldSchema = (key: BusDetailsFieldKey, msg: string, cv?: CV) =>
    fields[key]?.required
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  return z.object({
    busDetail: z.object({
      busNumber: fieldSchema("busNumber", "Bus number is required", {
        validate: isValidBusNumber,
        message: "Bus number can only contain letters, numbers, underscore (_), and hyphen (-)",
      }),
      busRegistrationNumber: fieldSchema("busRegistrationNumber", "Bus registration number is required", {
        validate: isValidBusNumber,
        message: "Bus registration number can only contain letters, numbers, underscore (_), and hyphen (-)",
      }),
      route: fieldSchema("route", "Route is required", {
        validate: isValidNameChar,
        message: "Route can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
      }),
    }),
  })
}

export const busDetailsSchema = createBusDetailsSchema()

export type BusDetailsData = z.infer<typeof busDetailsSchema>
