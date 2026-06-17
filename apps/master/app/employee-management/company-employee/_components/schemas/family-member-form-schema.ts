import { z } from "zod"

// Member name: letters, numbers, spaces, . , ' ` ( ) / _ -
const isValidNameChar = (str: string) => /^[a-zA-Z0-9\s.,`'()\/_-]+$/.test(str)

// Card numbers: letters, numbers, underscore, hyphen only
const isValidCardNumber = (str: string) => /^[a-zA-Z0-9_-]+$/.test(str)

export type FamilyMemberFieldConfig = {
  required?: boolean
  visible?: boolean
  label?: string
}
export type FamilyMemberRootFieldKey =
  | "memberName"
  | "relation"
  | "gender"
  | "birthDate"
  | "remark"
  | "isDependent"
export type FamilyMemberAadharFieldKey = "aadharCardNumber" | "aadharCardPath"
export type FamilyMemberElectionFieldKey = "electionCardNumber" | "electionCardPath"
export type FamilyMemberPanFieldKey = "panCardNumber" | "panCardPath"

export type FamilyMemberRootFieldsConfig = Partial<
  Record<FamilyMemberRootFieldKey, FamilyMemberFieldConfig>
>
export type FamilyMemberAadharFieldsConfig = Partial<
  Record<FamilyMemberAadharFieldKey, FamilyMemberFieldConfig>
>
export type FamilyMemberElectionFieldsConfig = Partial<
  Record<FamilyMemberElectionFieldKey, FamilyMemberFieldConfig>
>
export type FamilyMemberPanFieldsConfig = Partial<
  Record<FamilyMemberPanFieldKey, FamilyMemberFieldConfig>
>

export type FamilyMemberConfig = {
  tabRequired?: boolean
  fields?: FamilyMemberRootFieldsConfig
  aadharCard?: { fields?: FamilyMemberAadharFieldsConfig }
  electionCard?: { fields?: FamilyMemberElectionFieldsConfig }
  panCard?: { fields?: FamilyMemberPanFieldsConfig }
}

export function normalizeFamilyMemberConfig(raw: unknown): {
  tabRequired: boolean
  fields: FamilyMemberRootFieldsConfig
  aadharCard: { fields: FamilyMemberAadharFieldsConfig }
  electionCard: { fields: FamilyMemberElectionFieldsConfig }
  panCard: { fields: FamilyMemberPanFieldsConfig }
} {
  const asObject = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  const extractFields = <T extends Record<string, unknown>>(value: unknown): T => {
    const obj = asObject(value)
    if ("fields" in obj && obj.fields && typeof obj.fields === "object" && !Array.isArray(obj.fields)) {
      return obj.fields as T
    }
    return obj as T
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      tabRequired: false,
      fields: {},
      aadharCard: { fields: {} },
      electionCard: { fields: {} },
      panCard: { fields: {} },
    }
  }

  const root = raw as FamilyMemberConfig
  const source = asObject((root as { fields?: unknown }).fields ?? root)
  const rootFields = extractFields<FamilyMemberRootFieldsConfig>(source)
  return {
    tabRequired: root.tabRequired ?? false,
    fields: {
      memberName: rootFields.memberName,
      relation: rootFields.relation,
      gender: rootFields.gender,
      birthDate: rootFields.birthDate,
      remark: rootFields.remark,
      isDependent: rootFields.isDependent,
    },
    aadharCard: { fields: extractFields<FamilyMemberAadharFieldsConfig>(source.aadharCard) },
    electionCard: {
      fields: extractFields<FamilyMemberElectionFieldsConfig>(source.electionCard),
    },
    panCard: { fields: extractFields<FamilyMemberPanFieldsConfig>(source.panCard) },
  }
}

export function createFamilyMemberSchema(rawConfig?: FamilyMemberConfig) {
  const normalized = normalizeFamilyMemberConfig(rawConfig)
  const fields = normalized.fields
  const aadharFields = normalized.aadharCard.fields
  const electionFields = normalized.electionCard.fields
  const panFields = normalized.panCard.fields

  const rootRequiredByDefault = (key: FamilyMemberRootFieldKey) =>
    key === "memberName" || key === "relation" || key === "isDependent"

  type CharValidation = { validate: (val: string) => boolean; message: string }

  const rootField = (key: FamilyMemberRootFieldKey, msg: string, cv?: CharValidation) =>
    (fields[key]?.required ?? rootRequiredByDefault(key))
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  const aadharField = (key: FamilyMemberAadharFieldKey, msg: string) =>
    aadharFields[key]?.required
      ? z.string().min(1, msg)
      : z.string().optional().default("")

  const electionField = (key: FamilyMemberElectionFieldKey, msg: string, cv?: CharValidation) =>
    electionFields[key]?.required
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  const panField = (key: FamilyMemberPanFieldKey, msg: string, cv?: CharValidation) =>
    panFields[key]?.required
      ? cv
        ? z.string().min(1, msg).refine((val) => cv.validate(val), { message: cv.message })
        : z.string().min(1, msg)
      : cv
        ? z.string().optional().default("").refine((val) => !val || cv.validate(val), { message: cv.message })
        : z.string().optional().default("")

  return z.object({
    memberName: rootField("memberName", "Member name is required", {
      validate: isValidNameChar,
      message: "Member name can only contain letters, numbers, spaces, and . , ' ` ( ) / _ -",
    }),
    relation: rootField("relation", "Relation is required"),
    gender: rootField("gender", "Gender is required"),
    birthDate: rootField("birthDate", "Birth date is required").refine((val) => !val || new Date(val) <= new Date(), {
      message: "Birth date cannot be in the future",
    }),
    aadharCard: z.object({
      aadharCardNumber: aadharField("aadharCardNumber", "Aadhar number is required").refine(
        (val) => !val || /^\d{12}$/.test(val),
        "Aadhar number must be exactly 12 digits"
      ),
      aadharCardPath: aadharField("aadharCardPath", "Aadhar document is required"),
    }),
    electionCard: z.object({
      electionCardNumber: electionField("electionCardNumber", "Election card number is required", {
        validate: isValidCardNumber,
        message: "Election card number can only contain letters, numbers, underscore (_), and hyphen (-)",
      }),
      electionCardPath: electionField("electionCardPath", "Election card document is required"),
    }),
    panCard: z.object({
      panCardNumber: panField("panCardNumber", "PAN number is required", {
        validate: isValidCardNumber,
        message: "PAN card number can only contain letters, numbers, underscore (_), and hyphen (-)",
      }).refine(
        (val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val),
        "PAN number must be in format: ABCDE1234F"
      ),
      panCardPath: panField("panCardPath", "PAN card document is required"),
    }),
    remark: rootField("remark", "Remark is required"),
    isDependent: fields.isDependent?.required === false ? z.boolean().optional().default(false) : z.boolean(),
  })
}

export const familyMemberSchema = createFamilyMemberSchema()

export type FamilyMember = z.infer<typeof familyMemberSchema>

export const EMPTY_FAMILY_MEMBER: FamilyMember = {
  memberName: "",
  relation: "",
  gender: "",
  birthDate: "",
  aadharCard: { aadharCardNumber: "", aadharCardPath: "" },
  electionCard: { electionCardNumber: "", electionCardPath: "" },
  panCard: { panCardNumber: "", panCardPath: "" },
  remark: "",
  isDependent: false,
}

export function formatAadharNumber(value: string): string {
  const digits = value.replace(/\D/g, "").substring(0, 12)
  return digits.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3").trim()
}

export function getUnformattedAadhar(value: string): string {
  return value.replace(/\s/g, "")
}

export function formatPanNumber(value: string): string {
  return value.replace(/[^A-Z0-9]/gi, "").toUpperCase().substring(0, 10)
}