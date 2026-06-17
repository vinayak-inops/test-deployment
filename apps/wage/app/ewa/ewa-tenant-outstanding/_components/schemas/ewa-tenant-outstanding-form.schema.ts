import { z } from "zod"

// ─── Main Form Schema ──────────────────────────────────────────────────────────

export const ewaTenantOutstandingSchema = z.object({
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

  paidOn: z.string().nullable().optional(),
})

// ─── Types ─────────────────────────────────────────────────────────────────────

export type EwaTenantOutstandingFormValues = z.infer<
  typeof ewaTenantOutstandingSchema
>

// ─── Default Values ────────────────────────────────────────────────────────────

export const defaultEwaTenantOutstandingValues: EwaTenantOutstandingFormValues =
  {
    month:            new Date().getMonth() + 1,
    year:             new Date().getFullYear(),
    totalOutstanding: 0,
    paid:             false,
    paidOn:           null,
  }