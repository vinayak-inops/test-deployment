import { z } from "zod"

// ─── Main Form Schema ──────────────────────────────────────────────────────────

export const ewaContractorOutstandingSchema = z.object({
  contractorCode: z
    .string()
    .trim()
    .min(1, "Contractor code is required"),

  month: z
    .number({ invalid_type_error: "Month is required" })
    .int()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),

  year: z
    .number({ invalid_type_error: "Year is required" })
    .int()
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),

  totalOutstanding: z
    .number({ invalid_type_error: "Total outstanding is required" })
    .min(0, "Total outstanding must be 0 or more"),

  paid: z.boolean(),

  paidOn: z
    .string()
    .nullable()
    .optional(),
})

// ─── Types ─────────────────────────────────────────────────────────────────────

export type EwaContractorOutstandingFormValues = z.infer<
  typeof ewaContractorOutstandingSchema
>

// ─── Default Values ────────────────────────────────────────────────────────────

export const defaultEwaContractorOutstandingValues: EwaContractorOutstandingFormValues =
  {
    contractorCode:   "",
    month:            new Date().getMonth() + 1,
    year:             new Date().getFullYear(),
    totalOutstanding: 0,
    paid:             false,
    paidOn:           null,
  }