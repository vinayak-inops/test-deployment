"use client"

import { useState } from "react"

interface FormData {
  dateRange: string
  fromDate: Date | undefined
  toDate: Date | undefined
  reportTitle: string
  extension: string
}

interface FormErrors {
  fromDate?: string
  toDate?: string
  reportTitle?: string
  extension?: string
}

export function useFormValidation() {
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (formData: FormData): boolean => {
    const newErrors: FormErrors = {}

    if (formData.dateRange === "custom") {
      if (!formData.fromDate) {
        newErrors.fromDate = "From date is required"
      }
      if (!formData.toDate) {
        newErrors.toDate = "To date is required"
      }
      if (formData.fromDate && formData.toDate && formData.fromDate > formData.toDate) {
        newErrors.toDate = "To date must be after from date"
      }
    }

    if (!formData.reportTitle.trim()) {
      newErrors.reportTitle = "Report title is required"
    } else if (formData.reportTitle.trim().length < 3) {
      newErrors.reportTitle = "Report title must be at least 3 characters"
    }

    if (!formData.extension) {
      newErrors.extension = "File extension is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const clearAllErrors = () => {
    setErrors({})
  }

  return {
    errors,
    validateForm,
    clearError,
    clearAllErrors,
  }
}
