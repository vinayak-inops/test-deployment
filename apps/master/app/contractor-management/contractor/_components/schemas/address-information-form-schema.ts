import * as z from "zod"

const ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9\s.,`'()/_-]+$/

const hasDisallowedChars = (str: string) => !ALLOWED_CHARS_REGEX.test(str)

const ALLOWED_CHARS_MSG =
  "can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -"

export type AddressFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type AddressFieldKey =
  | "localAddressLine1"
  | "localAddressLine2"
  | "localCountry"
  | "localState"
  | "localCity"
  | "localDistrict"
  | "localPincode"
  | "localContactNumber"
  | "corporateAddressLine1"
  | "corporateAddressLine2"
  | "corporateCountry"
  | "corporateState"
  | "corporateCity"
  | "corporateDistrict"
  | "corporatePincode"
  | "corporateContactNumber"

export type AddressFieldsConfig = Partial<Record<AddressFieldKey, AddressFieldConfig>>

export type AddressInformationTabConfig = {
  tabRequired?: boolean
  fields?: AddressFieldsConfig
}

export function normalizeAddressConfig(
  raw: AddressFieldsConfig | AddressInformationTabConfig | unknown
): AddressInformationTabConfig {
  if (!raw) return { tabRequired: true, fields: {} }

  const assignIfConfig = (
    acc: AddressFieldsConfig,
    fieldKey: AddressFieldKey,
    source: unknown,
    key: string
  ) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) return
    const value = (source as Record<string, unknown>)[key]
    if (value && typeof value === "object" && !Array.isArray(value)) {
      acc[fieldKey] = value as AddressFieldConfig
    }
  }

  if (typeof raw === "object" && !Array.isArray(raw)) {
    const maybeTab = raw as Record<string, unknown>
    const root =
      maybeTab.fields && typeof maybeTab.fields === "object" && !Array.isArray(maybeTab.fields)
        ? (maybeTab as AddressInformationTabConfig)
        : { tabRequired: true, fields: maybeTab as AddressFieldsConfig }

    const obj = (root.fields ?? {}) as Record<string, unknown>
    const acc: AddressFieldsConfig = {}

    // Flat format (backward compatible):
    // { localAddressLine1: { required: true }, ... }
    assignIfConfig(acc, "localAddressLine1", obj, "localAddressLine1")
    assignIfConfig(acc, "localAddressLine2", obj, "localAddressLine2")
    assignIfConfig(acc, "localCountry", obj, "localCountry")
    assignIfConfig(acc, "localState", obj, "localState")
    assignIfConfig(acc, "localCity", obj, "localCity")
    assignIfConfig(acc, "localDistrict", obj, "localDistrict")
    assignIfConfig(acc, "localPincode", obj, "localPincode")
    assignIfConfig(acc, "localContactNumber", obj, "localContactNumber")
    assignIfConfig(acc, "corporateAddressLine1", obj, "corporateAddressLine1")
    assignIfConfig(acc, "corporateAddressLine2", obj, "corporateAddressLine2")
    assignIfConfig(acc, "corporateCountry", obj, "corporateCountry")
    assignIfConfig(acc, "corporateState", obj, "corporateState")
    assignIfConfig(acc, "corporateCity", obj, "corporateCity")
    assignIfConfig(acc, "corporateDistrict", obj, "corporateDistrict")
    assignIfConfig(acc, "corporatePincode", obj, "corporatePincode")
    assignIfConfig(acc, "corporateContactNumber", obj, "corporateContactNumber")

    // Nested format:
    // { local: {...}, corporate: {...} }
    const local = obj.local
    const corporate = obj.corporate

    // Supports both prefixed keys and short keys inside local/corporate
    assignIfConfig(acc, "localAddressLine1", local, "localAddressLine1")
    assignIfConfig(acc, "localAddressLine1", local, "addressLine1")
    assignIfConfig(acc, "localAddressLine2", local, "localAddressLine2")
    assignIfConfig(acc, "localAddressLine2", local, "addressLine2")
    assignIfConfig(acc, "localCountry", local, "localCountry")
    assignIfConfig(acc, "localCountry", local, "country")
    assignIfConfig(acc, "localState", local, "localState")
    assignIfConfig(acc, "localState", local, "state")
    assignIfConfig(acc, "localCity", local, "localCity")
    assignIfConfig(acc, "localCity", local, "city")
    assignIfConfig(acc, "localDistrict", local, "localDistrict")
    assignIfConfig(acc, "localDistrict", local, "district")
    assignIfConfig(acc, "localPincode", local, "localPincode")
    assignIfConfig(acc, "localPincode", local, "pincode")
    assignIfConfig(acc, "localContactNumber", local, "localContactNumber")
    assignIfConfig(acc, "localContactNumber", local, "contactNumber")

    assignIfConfig(acc, "corporateAddressLine1", corporate, "corporateAddressLine1")
    assignIfConfig(acc, "corporateAddressLine1", corporate, "addressLine1")
    assignIfConfig(acc, "corporateAddressLine2", corporate, "corporateAddressLine2")
    assignIfConfig(acc, "corporateAddressLine2", corporate, "addressLine2")
    assignIfConfig(acc, "corporateCountry", corporate, "corporateCountry")
    assignIfConfig(acc, "corporateCountry", corporate, "country")
    assignIfConfig(acc, "corporateState", corporate, "corporateState")
    assignIfConfig(acc, "corporateState", corporate, "state")
    assignIfConfig(acc, "corporateCity", corporate, "corporateCity")
    assignIfConfig(acc, "corporateCity", corporate, "city")
    assignIfConfig(acc, "corporateDistrict", corporate, "corporateDistrict")
    assignIfConfig(acc, "corporateDistrict", corporate, "district")
    assignIfConfig(acc, "corporatePincode", corporate, "corporatePincode")
    assignIfConfig(acc, "corporatePincode", corporate, "pincode")
    assignIfConfig(acc, "corporateContactNumber", corporate, "corporateContactNumber")
    assignIfConfig(acc, "corporateContactNumber", corporate, "contactNumber")

    return {
      tabRequired: root.tabRequired ?? true,
      fields: acc,
    }
  }

  // Supports array format too:
  // [{ localAddressLine1: { required: true } }, { localCountry: { required: false } }]
  if (Array.isArray(raw)) {
    const fields = raw.reduce((acc, item) => {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        Object.assign(acc, item)
      }
      return acc
    }, {} as AddressFieldsConfig)
    return { tabRequired: true, fields }
  }

  return { tabRequired: true, fields: {} }
}

const defaultRequired: Partial<Record<AddressFieldKey, boolean>> = {
  localAddressLine1: true,
  localCountry: true,
  localState: true,
  localCity: true,
  corporateAddressLine1: true,
  corporateCountry: true,
  corporateState: true,
  corporateCity: true,
}

export function createAddressInformationSchema(
  rawConfig?: AddressFieldsConfig | AddressInformationTabConfig
) {
  const normalizedConfig = normalizeAddressConfig(rawConfig)
  const fields = normalizedConfig.fields ?? {}

  const isAddressFieldRequired = (fieldKey: AddressFieldKey) =>
    fields[fieldKey]?.required ?? defaultRequired[fieldKey]

  const requiredString = (fieldKey: AddressFieldKey, message: string) => {
    const label = message.replace(" is required", "")
    return isAddressFieldRequired(fieldKey)
      ? z
          .string()
          .min(1, message)
          .refine((val) => !hasDisallowedChars(val), { message: `${label} ${ALLOWED_CHARS_MSG}` })
      : z
          .string()
          .optional()
          .refine((val) => !val || !hasDisallowedChars(val), {
            message: `${label} ${ALLOWED_CHARS_MSG}`,
          })
  }

  const optionalStringWithSpecialChars = (fieldKey: AddressFieldKey, refineMsg?: string) => {
    const label = refineMsg || "Field"
    const isRequired = isAddressFieldRequired(fieldKey)
    return isRequired
      ? z
          .string()
          .min(1, `${label} is required`)
          .refine((val) => !hasDisallowedChars(val), { message: `${label} ${ALLOWED_CHARS_MSG}` })
      : z
          .string()
          .optional()
          .refine((val) => !val || !hasDisallowedChars(val), {
            message: `${label} ${ALLOWED_CHARS_MSG}`,
          })
  }

  return z.object({
    address: z.object({
      local: z.object({
        addressLine1: isAddressFieldRequired("localAddressLine1")
          ? z.string().min(1, "Local address line 1 is required")
          : z.string().optional(),
        addressLine2: isAddressFieldRequired("localAddressLine2")
          ? z.string().min(1, "Local address line 2 is required")
          : z.string().optional(),
        country: requiredString("localCountry", "Local country is required"),
        state: requiredString("localState", "Local state is required"),
        city: requiredString("localCity", "Local city is required"),
        district: optionalStringWithSpecialChars("localDistrict", "Local district"),
        pincode: z
          .string()
          .optional()
          .refine((val) => !val || /^[0-9]{6}$/.test(val), "Pin Code must be 6 digits"),
        contactNumber: z
          .string()
          .optional()
          .refine((val) => !val || /^\d{10}$/.test(val), "Contact number must be exactly 10 digits"),
      }),
      corporate: z.object({
        addressLine1: isAddressFieldRequired("corporateAddressLine1")
          ? z.string().min(1, "Corporate address line 1 is required")
          : z.string().optional(),
        addressLine2: isAddressFieldRequired("corporateAddressLine2")
          ? z.string().min(1, "Corporate address line 2 is required")
          : z.string().optional(),
        country: requiredString("corporateCountry", "Corporate country is required"),
        state: requiredString("corporateState", "Corporate state is required"),
        city: requiredString("corporateCity", "Corporate city is required"),
        district: optionalStringWithSpecialChars("corporateDistrict", "Corporate district"),
        pincode: z
          .string()
          .optional()
          .refine((val) => !val || /^[0-9]{6}$/.test(val), "Pin Code must be 6 digits"),
        contactNumber: z
          .string()
          .optional()
          .refine((val) => !val || /^\d{10}$/.test(val), "Contact number must be exactly 10 digits"),
      }),
    }),
  })
}

export const addressInformationSchema = createAddressInformationSchema()

export type AddressInformationFormData = z.infer<typeof addressInformationSchema>

export const EMPTY_ADDRESS_INFORMATION: AddressInformationFormData = {
  address: {
    local: {
      addressLine1: "",
      addressLine2: "",
      country: "",
      state: "",
      city: "",
      district: "",
      pincode: "",
      contactNumber: "",
    },
    corporate: {
      addressLine1: "",
      addressLine2: "",
      country: "",
      state: "",
      city: "",
      district: "",
      pincode: "",
      contactNumber: "",
    },
  },
}