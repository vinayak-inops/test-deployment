"use client"

import * as yup from "yup"

export const ccEmailSectionSchema = {
  ccEmail: yup.array().of(yup.string().email("Invalid email")).optional(),
}
