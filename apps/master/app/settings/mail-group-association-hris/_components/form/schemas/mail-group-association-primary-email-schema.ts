"use client"

import * as yup from "yup"

export const primaryEmailSectionSchema = {
  primaryEmail: yup.array().of(yup.string().email("Invalid email")).min(1, "At least one primary email required"),
}
