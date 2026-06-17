import * as z from "zod";

// employeeID: only letters, numbers, hyphens — no spaces or underscores
const hasDisallowedCharsEmployeeID = (str: string) => {
  const regex = /^[a-zA-Z0-9\-]+$/
  return !regex.test(str)
}

// Name/nationality fields: letters, numbers, spaces, . , ' ` ( ) / _ -
const hasDisallowedCharsName = (str: string) => {
  const regex = /^[a-zA-Z0-9\s.,`'()/_\-]+$/
  return !regex.test(str)
}

export type FieldConfig = {
  required?: boolean;
  visible?: boolean;
  label?: string;
};

export type BasicInformationFieldKey =
  | "employeeID"
  | "firstName"
  | "middleName"
  | "lastName"
  | "gender"
  | "birthDate"
  | "bloodGroup"
  | "photo"
  | "nationality"
  | "maritalStatus"
  | "joiningDate"
  | "emailID"
  | "aadharNumber"
  | "status";

export type BasicInformationFieldsConfig = Partial<
  Record<BasicInformationFieldKey, FieldConfig>
>;

export type BasicInformationTabConfig = {
  tabRequired?: boolean;
  fields?: BasicInformationFieldsConfig;
};

export type BasicInformationData = {
  employeeID: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  gender?: "Male" | "Female" | "Other" | "Prefer not to say";
  birthDate?: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  photo?: string;
  nationality?: string;
  maritalStatus?: "Unmarried" | "Married" | "Divorced" | "Widowed";
  joiningDate: string;
  emailID?: string;
  aadharNumber: string;
  status?: "active" | "pending" | "inactive";
};

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"] as const;
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const MARITAL_STATUS_OPTIONS = ["Unmarried", "Married", "Divorced", "Widowed"] as const;
const STATUS_OPTIONS = ["active", "pending", "inactive"] as const;

export function normalizeBasicInformationConfig(
  rawConfig: BasicInformationFieldsConfig | BasicInformationTabConfig | undefined
): BasicInformationTabConfig {
  if (rawConfig && typeof rawConfig === "object" && "fields" in rawConfig) {
    return rawConfig as BasicInformationTabConfig;
  }
  return {
    tabRequired: true,
    fields: (rawConfig ?? {}) as BasicInformationFieldsConfig,
  };
}

export function createBasicInformationSchema(
  rawConfig?: BasicInformationFieldsConfig | BasicInformationTabConfig
) {
  const tabConfig = normalizeBasicInformationConfig(rawConfig);
  const fieldConfig = tabConfig.fields ?? {};

  const isActiveRequired = (key: BasicInformationFieldKey) =>
    (fieldConfig[key]?.visible ?? true) && (fieldConfig[key]?.required ?? true);

  const NAME_CHARS_MSG = "can only contain letters, numbers, spaces, . , ' ` ( ) / _ -";

  const requiredNameString = (key: BasicInformationFieldKey, msg: string) =>
    isActiveRequired(key)
      ? z.string().min(1, msg).refine((val) => !hasDisallowedCharsName(val), {
          message: `${msg.replace(" is required", "")} ${NAME_CHARS_MSG}`
        })
      : z.string().optional().refine((val) => !val || !hasDisallowedCharsName(val), {
          message: `${msg.replace(" is required", "")} ${NAME_CHARS_MSG}`
        });

  return z.object({
    employeeID: isActiveRequired("employeeID")
      ? z.string().min(1, "Employee ID is required").refine((val) => !hasDisallowedCharsEmployeeID(val), {
          message: "Employee ID can only contain letters, numbers, and hyphens (-). Spaces and underscores are not allowed."
        })
      : z.string().optional().refine((val) => !val || !hasDisallowedCharsEmployeeID(val), {
          message: "Employee ID can only contain letters, numbers, and hyphens (-). Spaces and underscores are not allowed."
        }),
    firstName: isActiveRequired("firstName")
      ? z
          .string()
          .min(2, "First name must be at least 2 characters")
          .max(50, "First name must be less than 50 characters")
          .refine((val) => !hasDisallowedCharsName(val), {
            message: `First name ${NAME_CHARS_MSG}`
          })
      : z
          .string()
          .optional()
          .refine((val) => !val || !hasDisallowedCharsName(val), {
            message: `First name ${NAME_CHARS_MSG}`
          }),
    middleName: z
      .string()
      .optional()
      .refine((val) => !val || !hasDisallowedCharsName(val), {
        message: `Middle name ${NAME_CHARS_MSG}`
      }),
    lastName: isActiveRequired("lastName")
      ? z
          .string()
          .min(1, "Last name must be at least 1 characters")
          .max(50, "Last name must be less than 50 characters")
          .refine((val) => !hasDisallowedCharsName(val), {
            message: `Last name ${NAME_CHARS_MSG}`
          })
      : z
          .string()
          .optional()
          .refine((val) => !val || !hasDisallowedCharsName(val), {
            message: `Last name ${NAME_CHARS_MSG}`
          }),
    gender: isActiveRequired("gender")
      ? z.enum(GENDER_OPTIONS, { required_error: "Please select a gender" })
      : z.enum(GENDER_OPTIONS).optional(),
    birthDate: isActiveRequired("birthDate")
      ? z
          .string()
          .min(1, "Birth date is required")
          .refine((date) => {
            const birthDate = new Date(date);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return birthDate <= today;
          }, "Birth date cannot be in the future")
          .refine((date) => {
            const birthDate = new Date(date);
            const today = new Date();
            const age18 = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
            return birthDate <= age18;
          }, "Employee must be at least 18 years old")
      : z
          .string()
          .optional()
          .refine((date) => {
            if (!date) return true;
            const birthDate = new Date(date);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return birthDate <= today;
          }, "Birth date cannot be in the future")
          .refine((date) => {
            if (!date) return true;
            const birthDate = new Date(date);
            const today = new Date();
            const age18 = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
            return birthDate <= age18;
          }, "Employee must be at least 18 years old"),
    bloodGroup: isActiveRequired("bloodGroup")
      ? z.enum(BLOOD_GROUP_OPTIONS, { required_error: "Please select a blood group" })
      : z.enum(BLOOD_GROUP_OPTIONS).optional(),
    photo: isActiveRequired("photo") 
      ? z.string().min(1, "Photo is required") 
      : z.string().optional(),
    nationality: requiredNameString("nationality", "Nationality is required"),
    maritalStatus: isActiveRequired("maritalStatus")
      ? z.enum(MARITAL_STATUS_OPTIONS, { required_error: "Please select marital status" })
      : z.enum(MARITAL_STATUS_OPTIONS).optional(),
    joiningDate: isActiveRequired("joiningDate")
      ? z
          .string()
          .min(1, "Joining date is required")
          .refine((date) => {
            const joiningDate = new Date(date);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return joiningDate <= today;
          }, "Joining date cannot be in the future")
      : z
          .string()
          .optional()
          .refine((date) => {
            if (!date) return true;
            const joiningDate = new Date(date);
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            return joiningDate <= today;
          }, "Joining date cannot be in the future"),
    emailID: isActiveRequired("emailID")
      ? z.string().min(1, "Email is required").email("Please enter a valid email address")
      : z.string().email("Please enter a valid email address").optional().or(z.literal("")),
    aadharNumber: isActiveRequired("aadharNumber")
      ? z
          .string()
          .min(12, "Aadhar number must be 12 digits")
          .max(12, "Aadhar number must be 12 digits")
          .regex(/^\d{12}$/, "Aadhar number must contain only digits")
      : z
          .string()
          .optional()
          .refine((value) => !value || /^\d{12}$/.test(value), "Aadhar number must contain 12 digits"),
    status: isActiveRequired("status")
      ? z.enum(STATUS_OPTIONS, { required_error: "Please select a status" })
      : z.enum(STATUS_OPTIONS).optional(),
  }).superRefine((data, ctx) => {
    if (data.joiningDate && data.birthDate) {
      const joining = new Date(data.joiningDate);
      const birth = new Date(data.birthDate);
      if (joining <= birth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Joining date must be after date of birth",
          path: ["joiningDate"],
        });
      }
    }
  });
}

export const basicInformationSchema = createBasicInformationSchema();