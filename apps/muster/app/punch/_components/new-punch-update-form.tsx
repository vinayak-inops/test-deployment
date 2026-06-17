"use client"

import type React from "react"
import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { X, Clock, User, MessageSquare, AlertCircle, Calendar } from "lucide-react"

// Types
export type InOutType = "I" | "O"
export type MovementType = "P" | "A" | "L" | "H"
export type StatusType = "NEW" | "APPROVED" | "REJECTED" | "PENDING"

export interface PunchUpdateData {
  employeeID: string
  punchedTime: string
  transactionTime: string
  inOut: InOutType
  typeOfMovement: MovementType
  uploadTime: string
  attendanceDate: string
  previosAttendanceDate: string
  Status: StatusType
  isDeleted: boolean
  remarks: string
}

// Constants
const inOutOptions: InOutType[] = ["I", "O"]
const movementOptions: MovementType[] = ["P", "A", "L", "H"]
const statusOptions: StatusType[] = ["NEW", "APPROVED", "REJECTED", "PENDING"]

// Validation Schema
const validationSchema = yup.object({
  employeeID: yup
    .string()
    .required("Employee ID is required")
    .matches(/^[A-Z0-9]{3,10}$/, "Employee ID must be 3-10 characters (letters and numbers only)"),

  punchedTime: yup
    .string()
    .required("Punched time is required")
    .test("valid-datetime", "Please enter a valid date and time", (value) => {
      if (!value) return true
      const date = new Date(value)
      return !isNaN(date.getTime())
    })
    .test("not-future", "Punched time cannot be in the future", (value) => {
      if (!value) return true
      const selectedDate = new Date(value)
      const now = new Date()
      return selectedDate <= now
    }),

  transactionTime: yup
    .string()
    .required("Transaction time is required")
    .test("valid-datetime", "Please enter a valid date and time", (value) => {
      if (!value) return true
      const date = new Date(value)
      return !isNaN(date.getTime())
    })
    .test("not-future", "Transaction time cannot be in the future", (value) => {
      if (!value) return true
      const selectedDate = new Date(value)
      const now = new Date()
      return selectedDate <= now
    }),

  inOut: yup
    .string()
    .required("In/Out selection is required")
    .oneOf(["I", "O"], "Please select a valid In/Out option"),

  typeOfMovement: yup
    .string()
    .required("Type of movement is required")
    .oneOf(["P", "A", "L", "H"], "Please select a valid movement type"),

  uploadTime: yup
    .string()
    .required("Upload time is required")
    .test("valid-datetime", "Please enter a valid date and time", (value) => {
      if (!value) return true
      const date = new Date(value)
      return !isNaN(date.getTime())
    }),

  attendanceDate: yup
    .string()
    .required("Attendance date is required")
    .test("not-future", "Attendance date cannot be in the future", (value) => {
      if (!value) return true
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return selectedDate <= today
    }),

  previosAttendanceDate: yup
    .string()
    .required("Previous attendance date is required")
    .test("not-future", "Previous attendance date cannot be in the future", (value) => {
      if (!value) return true
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return selectedDate <= today
    }),

  Status: yup
    .string()
    .required("Status is required")
    .oneOf(["NEW", "APPROVED", "REJECTED", "PENDING"], "Please select a valid status"),

  isDeleted: yup.boolean().required("Deleted status is required"),

  remarks: yup
    .string()
    .required("Remarks are required")
    .min(5, "Remarks must be at least 5 characters")
    .max(500, "Remarks must not exceed 500 characters"),
})

type FormData = yup.InferType<typeof validationSchema>

// Props interface
interface NewPunchUpdateFormProps {
  isOpen: boolean
  onClose: () => void
  initialValues?: Partial<PunchUpdateData>
  onSubmit: (data: PunchUpdateData) => void
  disableInOut?: boolean
}

// Main Component
export default function NewPunchUpdateForm({ isOpen, onClose, initialValues = {}, onSubmit, disableInOut = false }: NewPunchUpdateFormProps) {
  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
    clearErrors,
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      employeeID: initialValues.employeeID || "",
      punchedTime: initialValues.punchedTime || "",
      transactionTime: initialValues.transactionTime || "",
      inOut: initialValues.inOut || "I",
      typeOfMovement: initialValues.typeOfMovement || "P",
      uploadTime: initialValues.uploadTime || "",
      attendanceDate: initialValues.attendanceDate || "",
      previosAttendanceDate: initialValues.previosAttendanceDate || "",
      Status: initialValues.Status || "NEW",
      isDeleted: initialValues.isDeleted ?? false,
      remarks: initialValues.remarks || "",
    },
    mode: "onChange",
  })

  // Common field styles for consistent height
  const fieldStyles =
    "w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"

  const fieldErrorStyles =
    "w-full h-10 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:shadow-lg shadow-sm transition hover:border-red-400"

  // Reset form when popup opens
  useEffect(() => {
    if (isOpen) {
      reset({
        employeeID: initialValues.employeeID || "",
        punchedTime: initialValues.punchedTime || "",
        transactionTime: initialValues.transactionTime || "",
        inOut: initialValues.inOut || "I",
        typeOfMovement: initialValues.typeOfMovement || "P",
        uploadTime: initialValues.uploadTime || "",
        attendanceDate: initialValues.attendanceDate || "",
        previosAttendanceDate: initialValues.previosAttendanceDate || "",
        Status: initialValues.Status || "NEW",
        isDeleted: initialValues.isDeleted ?? false,
        remarks: initialValues.remarks || "",
      })
      clearErrors()
    }
  }, [initialValues, isOpen, reset, clearErrors])

  // Handle form submission
  const onFormSubmit = (data: FormData) => {
    const formattedData: PunchUpdateData = {
      ...data,
      inOut: data.inOut as InOutType,
      typeOfMovement: data.typeOfMovement as MovementType,
      Status: data.Status as StatusType,
    }
    onSubmit(formattedData)
    onClose()
  }

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  // Error message component
  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null
    return (
      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </div>
    )
  }

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 -mt-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Punch Update Form
            </h2>
            <p className="text-blue-100 text-sm mt-1">Update punch details and attendance information</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              {/* Employee Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Employee Information
                </div>

                {/* Employee ID */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("employeeID")}
                    placeholder="e.g., EMP001"
                    className={errors.employeeID ? fieldErrorStyles : fieldStyles}
                  />
                  <ErrorMessage error={errors.employeeID?.message} />
                </div>
              </div>

              {/* Punch Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Punch Details
                </div>

                {/* First Row: Punched Time, Transaction Time, In/Out */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Punched Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...register("punchedTime")}
                      className={errors.punchedTime ? fieldErrorStyles : fieldStyles}
                    />
                    <ErrorMessage error={errors.punchedTime?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Transaction Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...register("transactionTime")}
                      className={errors.transactionTime ? fieldErrorStyles : fieldStyles}
                    />
                    <ErrorMessage error={errors.transactionTime?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      In/Out <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="inOut"
                      control={control}
                      render={({ field }) => (
                        <select 
                          {...field} 
                          disabled={disableInOut}
                          className={`${errors.inOut ? fieldErrorStyles : fieldStyles} ${disableInOut ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`}
                        >
                          <option value="">Select In/Out</option>
                          {inOutOptions.map((option) => (
                            <option key={option} value={option}>
                              {option === "I" ? "In" : "Out"}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    <ErrorMessage error={errors.inOut?.message} />
                  </div>
                </div>

                {/* Second Row: Type of Movement, Upload Time, Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Type of Movement <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="typeOfMovement"
                      control={control}
                      render={({ field }) => (
                        <select {...field} className={errors.typeOfMovement ? fieldErrorStyles : fieldStyles}>
                          <option value="">Select Movement Type</option>
                          {movementOptions.map((option) => (
                            <option key={option} value={option}>
                              {option === "P" ? "Present" : option === "A" ? "Absent" : option === "L" ? "Leave" : "Holiday"}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    <ErrorMessage error={errors.typeOfMovement?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Upload Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      {...register("uploadTime")}
                      className={errors.uploadTime ? fieldErrorStyles : fieldStyles}
                    />
                    <ErrorMessage error={errors.uploadTime?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="Status"
                      control={control}
                      render={({ field }) => (
                        <select {...field} className={errors.Status ? fieldErrorStyles : fieldStyles}>
                          <option value="">Select Status</option>
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    <ErrorMessage error={errors.Status?.message} />
                  </div>
                </div>
              </div>

              {/* Attendance Dates Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Attendance Dates
                </div>

                {/* Date Row: Attendance Date, Previous Attendance Date, Deleted Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Attendance Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register("attendanceDate")}
                      max={new Date().toISOString().split("T")[0]}
                      className={errors.attendanceDate ? fieldErrorStyles : fieldStyles}
                    />
                    <ErrorMessage error={errors.attendanceDate?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Previous Attendance Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      {...register("previosAttendanceDate")}
                      max={new Date().toISOString().split("T")[0]}
                      className={errors.previosAttendanceDate ? fieldErrorStyles : fieldStyles}
                    />
                    <ErrorMessage error={errors.previosAttendanceDate?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Deleted Status</label>
                    <div className="flex gap-4 h-10 items-center">
                      <Controller
                        name="isDeleted"
                        control={control}
                        render={({ field }) => (
                          <>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                value="false"
                                checked={!field.value}
                                onChange={() => field.onChange(false)}
                                className="accent-blue-600"
                              />
                              Active
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                value="true"
                                checked={field.value}
                                onChange={() => field.onChange(true)}
                                className="accent-blue-600"
                              />
                              Deleted
                            </label>
                          </>
                        )}
                      />
                    </div>
                    <ErrorMessage error={errors.isDeleted?.message} />
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Additional Information
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("remarks")}
                    placeholder="Enter remarks (minimum 5 characters)"
                    rows={4}
                    className={`w-full rounded-lg border ${
                      errors.remarks ? "border-red-300" : "border-gray-200"
                    } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errors.remarks
                        ? "focus:ring-red-500 focus:border-red-500"
                        : "focus:ring-blue-500 focus:border-blue-500"
                    } focus:shadow-lg shadow-sm resize-none transition hover:border-blue-400`}
                  />
                  <ErrorMessage error={errors.remarks?.message} />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Minimum 5 characters, maximum 500 characters</span>
                    <span className="text-xs text-gray-500">{watch("remarks")?.length || 0}/500</span>
                  </div>
                </div>
              </div>

              {/* Form Status */}
              {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                    <AlertCircle className="h-4 w-4" />
                    Please fix the following errors:
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>• {error?.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bottom padding for scroll */}
              <div className="pb-4"></div>
            </form>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 flex-shrink-0 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 h-10 rounded-md font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            className="px-6 py-2 h-10 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Punch Update"}
          </button>
        </div>
      </div>
    </div>
  )
} 