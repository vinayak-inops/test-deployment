"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { X, Calendar, User, MessageSquare, AlertCircle, Clock } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import toast from "react-hot-toast";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// Types
export interface ShiftChangeApplication {
  employeeID: string
  fromDate: string
  toDate: string
  shiftGroupCode: string
  isAutomatic: boolean
  Remarks: string
  appliedDate: string
  workflowState: string
  remarks: string
  uploadedBy: string
  createdOn: string
  uploadTime: string
  organizationCode: string
  tenantCode: string
}

// Validation Schema
const validationSchema = yup.object({
  employeeID: yup
    .string()
    .required("Employee ID is required")
    .matches(/^EMP\d{3}$/, "Employee ID must be in the format EMP001"),

  fromDate: yup
    .string()
    .required("From date is required")
    .test("not-past", "From date cannot be in the past", (value) => {
      if (!value) return true
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selectedDate >= today
    }),

  toDate: yup
    .string()
    .required("To date is required")
    .test("not-before-from", "To date cannot be before from date", function(value) {
      const fromDate = this.parent.fromDate
      if (!value || !fromDate) return true
      const toDate = new Date(value)
      const fromDateObj = new Date(fromDate)
      return toDate >= fromDateObj
    }),

  shiftGroupCode: yup
    .string()
    .required("Shift group code is required"),

  isAutomatic: yup
    .boolean()
    .required("Please specify if this is automatic"),

  Remarks: yup
    .string()
    .required("Remarks are required")
    .min(10, "Remarks must be at least 10 characters")
    .max(500, "Remarks must not exceed 500 characters"),

  remarks: yup
    .string()
    .required("Additional remarks are required")
    .min(5, "Additional remarks must be at least 5 characters")
    .max(300, "Additional remarks must not exceed 300 characters")
})

type FormData = yup.InferType<typeof validationSchema>

// Props interface
interface ShiftChangeFormPopupProps {
  isOpen: boolean
  onClose: () => void
  initialValues?: Partial<ShiftChangeApplication>
  onSubmit: (data: ShiftChangeApplication) => void
}

// Main Component
export default function ShiftChangeFormPopup({ isOpen, onClose, initialValues = {}, onSubmit }: ShiftChangeFormPopupProps) {
  const tenantCode = useGetTenantCode()
  const { data: session } = useSession();
  const [shiftList, setShiftList] = useState<any[]>([]);
  
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
      fromDate: initialValues.fromDate || "",
      toDate: initialValues.toDate || "",
      shiftGroupCode: initialValues.shiftGroupCode || "",
      isAutomatic: initialValues.isAutomatic || false,
      Remarks: initialValues.Remarks || "",
      remarks: initialValues.remarks || "",
    },
    mode: "onChange", // Validate on change for real-time feedback
  })

  const {
    post: postShiftChange,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "shiftChangeApplication",
    onSuccess: (data) => {
      // Show toast on success
      toast.success("Shift change application submitted successfully!");
      onSubmit(data);
      onClose();
    },
    onError: (error) => {
      // Optionally handle error (e.g., show a toast)
      console.error("POST error:", error);
    },
  });

  // Common field styles for consistent height
  const fieldStyles =
    "w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"

  const fieldErrorStyles =
    "w-full h-10 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:shadow-lg shadow-sm transition hover:border-red-400"

  // Reset form when popup opens
  useEffect(() => {
    if (isOpen) {
      reset({
        employeeID: initialValues.employeeID || "EMP001",
        fromDate: initialValues.fromDate || "",
        toDate: initialValues.toDate || "",
        shiftGroupCode: initialValues.shiftGroupCode || "",
        isAutomatic: initialValues.isAutomatic || false,
        Remarks: initialValues.Remarks || "",
        remarks: initialValues.remarks || "",
      })
      clearErrors()
    }
  }, [initialValues, isOpen, reset, clearErrors])

  let employeeID = "EMP001";

  const {
    data,
    error,
    loading,
    refetch
  } = useRequest<any[]>({
    url: `map/employee_shift/search?employeeID=${employeeID}`,
    method: 'GET',
    onSuccess: (data: any) => {
      let lastShift = data[data.length - 1];
      setShiftList(lastShift.shift);
    },
    onError: (error) => {
      
    },
  });

  useEffect(() => {
    if (employeeID) {
      refetch();
    }
  }, [employeeID]);

  // Handle form submission
  const onFormSubmit = (data: FormData) => {
    // Helper functions for date formatting
    const pad = (n: number) => n < 10 ? `0${n}` : n;
    
    // Get current time in Indian Standard Time (IST)
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    const yyyy = istTime.getFullYear();
    const mm = pad(istTime.getMonth() + 1);
    const dd = pad(istTime.getDate());
    const hh = pad(istTime.getHours());
    const min = pad(istTime.getMinutes());
    const ss = pad(istTime.getSeconds());
    const ms = pad(istTime.getMilliseconds());
    
    // Format dates to DD-MM-YYYY format
    const formatDateToDDMMYYYY = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const day = pad(date.getDate());
      const month = pad(date.getMonth() + 1);
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };
    
    // createdOn: 'YYYY-MM-DDTHH:mm:ss.sss+05:30' (IST timezone offset)
    const createdOn = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+05:30`;
    // uploadTime: 'YYYY-MM-DDTHH:mm:ss'
    const uploadTime = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
    // appliedDate: 'YYYY-MM-DD'
    const appliedDate = `${yyyy}-${mm}-${dd}`;
    // uploadedBy: get from token (placeholder for now)
    let uploadedBy = session?.user?.name || 'user';
    // organizationCode and tenantCode
    const organizationCode = tenantCode;

    const formattedData: any = {
      ...data,
      fromDate: formatDateToDDMMYYYY(data.fromDate),
      toDate: formatDateToDDMMYYYY(data.toDate),
      appliedDate,
      workflowState: 'INITIATED',
      uploadedBy,
      createdOn,
      uploadTime,
      shiftList,
      organizationCode,
      tenantCode,
    };

    

    if (typeof window !== "undefined") {
      const json = {
        tenant: tenantCode,
        action: "insert",
        id: null,
        event: "shiftChangeApplication",
        collectionName: "shiftChangeApplication",
        data: formattedData,
      }
      postShiftChange(json);
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
      document.body.style.overflow = "hidden" // Prevent background scroll
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

  const {
    data: shiftGroupsResponse,
    loading: isLoading,
    error: shiftGroupsError,
    refetch: fetchShiftGroups
  } = useRequest<any>({
    url: 'shift/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ],
    onSuccess: (data) => {
    },
    onError: (error) => {
      console.error("Error fetching shift groups:", error);
    },
    dependencies: []
  });

  useEffect(() => {
    fetchShiftGroups();
  }, []);

  // Extract shift groups from backend response
  const shiftGroups = Array.isArray(shiftGroupsResponse) && shiftGroupsResponse.length > 0
    ? shiftGroupsResponse
    : [];

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
              Shift Change Request Details
            </h2>
            <p className="text-blue-100 text-sm mt-1">Enter the details for the shift change request</p>
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
                    value={watch("employeeID")}
                    readOnly
                    className={errors.employeeID ? fieldErrorStyles : fieldStyles}
                  />
                  <ErrorMessage error={errors.employeeID?.message} />
                </div>
              </div>

              {/* Shift Change Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Shift Change Details
                </div>

                {/* Date Range Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* From Date */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      From Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        {...register("fromDate")}
                        min={new Date().toISOString().split("T")[0]}
                        className={errors.fromDate ? fieldErrorStyles : fieldStyles + " pr-10"}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                          <rect x="3" y="6" width="18" height="15" rx="2" fill="white" stroke="currentColor"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                      </span>
                    </div>
                    <ErrorMessage error={errors.fromDate?.message} />
                  </div>

                  {/* To Date */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      To Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        {...register("toDate")}
                        min={watch("fromDate") || new Date().toISOString().split("T")[0]}
                        className={errors.toDate ? fieldErrorStyles : fieldStyles + " pr-10"}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-5 w-5">
                          <rect x="3" y="6" width="18" height="15" rx="2" fill="white" stroke="currentColor"/>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                      </span>
                    </div>
                    <ErrorMessage error={errors.toDate?.message} />
                  </div>
                </div>

                {/* Shift Group and Automatic Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shift Group Code */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Shift Group Code <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="shiftGroupCode"
                      control={control}
                      render={({ field }) => (
                        <select {...field} className={errors.shiftGroupCode ? fieldErrorStyles : fieldStyles} disabled={isLoading || !!shiftGroupsError}>
                          <option value="">{isLoading ? "Loading..." : shiftGroupsError ? "Error loading shift groups" : "Select a Shift Group"}</option>
                          {shiftGroups.map((shift: any) => (
                            <option key={shift.shiftCode} value={shift.shiftCode}>
                              {shift.shiftName} ({shift.shiftCode})
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    <ErrorMessage error={errors.shiftGroupCode?.message} />
                  </div>

                  {/* Is Automatic */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Automatic Assignment <span className="text-red-500">*</span>
                    </label>
                    <Controller
                      name="isAutomatic"
                      control={control}
                      render={({ field }) => (
                        <select 
                          {...field} 
                          value={field.value ? "true" : "false"}
                          onChange={(e) => field.onChange(e.target.value === "true")}
                          className={errors.isAutomatic ? fieldErrorStyles : fieldStyles}
                        >
                          <option value="false">No (Manual)</option>
                          <option value="true">Yes (Automatic)</option>
                        </select>
                      )}
                    />
                    <ErrorMessage error={errors.isAutomatic?.message} />
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Additional Information
                </div>

                {/* Main Remarks */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("Remarks")}
                    placeholder="Enter main remarks (minimum 10 characters)"
                    rows={3}
                    className={`w-full rounded-lg border ${
                      errors.Remarks ? "border-red-300" : "border-gray-200"
                    } bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                      errors.Remarks
                        ? "focus:ring-red-500 focus:border-red-500"
                        : "focus:ring-blue-500 focus:border-blue-500"
                    } focus:shadow-lg shadow-sm resize-none transition hover:border-blue-400`}
                  />
                  <ErrorMessage error={errors.Remarks?.message} />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Minimum 10 characters, maximum 500 characters</span>
                    <span className="text-xs text-gray-500">{watch("Remarks")?.length || 0}/500</span>
                  </div>
                </div>

                {/* Additional Remarks */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Additional Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("remarks")}
                    placeholder="Enter additional remarks (minimum 5 characters)"
                    rows={3}
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
                    <span className="text-xs text-gray-500">Minimum 5 characters, maximum 300 characters</span>
                    <span className="text-xs text-gray-500">{watch("remarks")?.length || 0}/300</span>
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
            disabled={isSubmitting || !isDirty}
            className="px-6 py-2 h-10 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  )
} 