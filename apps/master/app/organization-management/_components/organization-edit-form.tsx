"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Building2, AlertCircle } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import OrganizationLogoUploadField from "@/components/fields/organization-logo-upload-field"
import { organizationEditFormSchema, type OrganizationEditFormData as FormData } from "./organization-edit-form-schema"

type OrganizationFormField =
  | "organizationName"
  | "organizationCode"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "pinCode"
  | "description"
  | "logoFileName"
  | "emailId"
  | "contactPersonContactNumber"
  | "registrationNo"
  | "tenantCode"
  | "isActive"
  | "firstMonthOfFinancialYear"

// Props interface
interface OrganizationEditFormProps {
  isOpen: boolean
  onClose: () => void
  initialValues?: Partial<any>
  onSubmit: (data: any) => void
}

// Main Component
export default function OrganizationEditForm({ isOpen, onClose, initialValues = {}, onSubmit }: OrganizationEditFormProps) {
  const tenantCode = useGetTenantCode()
  const router = useRouter()
  const [logoChanged, setLogoChanged] = useState(false)
  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
    clearErrors,
    setError,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(organizationEditFormSchema),
    defaultValues: {
      organizationName: initialValues.organizationName || "",
      organizationCode: initialValues.organizationCode || "",
      addressLine1: initialValues.addressLine1 || "",
      addressLine2: initialValues.addressLine2 || "",
      city: initialValues.city || "",
      pinCode: initialValues.pinCode || "",
      description: initialValues.description || "",
      logoFileName: initialValues.logoFileName || "",
      emailId: initialValues.emailId || "",
      contactPersonContactNumber: initialValues.contactPersonContactNumber || "",
      registrationNo: initialValues.registrationNo || "",
      tenantCode: initialValues.tenantCode || "",
      isActive: initialValues.isActive ?? 1,
      firstMonthOfFinancialYear: initialValues.firstMonthOfFinancialYear ?? 1,
    },
    mode: "onChange", // Validate on change for real-time feedback
  })

  const { post: postOrganization, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const fieldMap: Record<string, OrganizationFormField> = {
          organizationName: "organizationName",
          organizationCode: "organizationCode",
          addressLine1: "addressLine1",
          addressLine2: "addressLine2",
          city: "city",
          pinCode: "pinCode",
          description: "description",
          logoFileName: "logoFileName",
          emailId: "emailId",
          contactPersonContactNumber: "contactPersonContactNumber",
          registrationNo: "registrationNo",
          tenantCode: "tenantCode",
          isActive: "isActive",
          firstMonthOfFinancialYear: "firstMonthOfFinancialYear",
        }

        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField, { type: "server", message })
        })
        return
      }

      toast.success("Organization information updated successfully!");
      onSubmit(response);
      router.refresh();
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to update organization information");
      console.error("POST error:", error);
    },
  });


  // Common field styles for consistent height
  const fieldStyles =
    "w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"

  const fieldErrorStyles =
    "w-full h-10 rounded-lg border border-red-400 bg-white px-3 py-2 text-sm shadow-sm transition hover:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"

  const labelClass = "block text-xs font-medium uppercase tracking-wide text-gray-700"
  const sectionTitleClass = "text-sm font-semibold text-gray-900"

  // Reset form when popup opens
  useEffect(() => {
    if (isOpen) {
      setLogoChanged(false)
      reset({
        organizationName: initialValues.organizationName || "",
        organizationCode: initialValues.organizationCode || "",
        addressLine1: initialValues.addressLine1 || "",
        addressLine2: initialValues.addressLine2 || "",
        city: initialValues.city || "",
        pinCode: initialValues.pinCode || "",
        description: initialValues.description || "",
        logoFileName: initialValues.logoFileName || "",
        emailId: initialValues.emailId || "",
        contactPersonContactNumber: initialValues.contactPersonContactNumber || "",
        registrationNo: initialValues.registrationNo || "",
        tenantCode: initialValues.tenantCode || "",
        isActive: initialValues.isActive ?? 1,
        firstMonthOfFinancialYear: initialValues.firstMonthOfFinancialYear ?? 1,
      })
      clearErrors()
    }
  }, [initialValues, isOpen, reset, clearErrors])

  // Handle form submission
  const onFormSubmit = (data: FormData) => {
    clearErrors()
    if (typeof window !== "undefined") {
      const json = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        id: initialValues._id,
        ruleId: "",
        data,
      }
      postOrganization(json);
    }
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

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gray-100 p-1.5">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Edit Organization Information</h2>
              <p className="mt-0.5 text-[11px] text-gray-500">Update the organization details.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
              {/* Basic Information Section */}
              <div className="space-y-3">
                <h3 className={sectionTitleClass}>Basic Information</h3>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                  <div className="lg:col-span-1 space-y-2">
                    <Controller
                      control={control}
                      name="logoFileName"
                      render={({ field }) => (
                        <OrganizationLogoUploadField
                          id="organizationLogoFile"
                          label="Organization Logo"
                          organizationCode={watch("organizationCode") || "organization"}
                          value={{
                            documentPath: String(field.value || ""),
                            documentType: "",
                          }}
                          onChange={(doc) => {
                            const nextPath = doc.documentPath || ""
                            setLogoChanged(true)
                            field.onChange(nextPath)
                            setValue("logoFileName", nextPath, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }}
                          disabled={false}
                          uploadPrefix="logo"
                          uploadPath="organization"
                        />
                      )}
                    />
                    <ErrorMessage error={errors.logoFileName?.message} />
                  </div>

                  <div className="lg:col-span-4 space-y-3">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <div className="space-y-2">
                        <label className={labelClass}>
                          Organization Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register("organizationName")}
                          placeholder="Enter organization name"
                          className={errors.organizationName ? fieldErrorStyles : fieldStyles}
                        />
                        <ErrorMessage error={errors.organizationName?.message} />
                      </div>

                      <div className="space-y-2">
                        <label className={labelClass}>
                          Organization Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register("organizationCode")}
                          placeholder="Enter organization code"
                          className={errors.organizationCode ? fieldErrorStyles : fieldStyles}
                          readOnly
                          disabled
                        />
                        <ErrorMessage error={errors.organizationCode?.message} />
                      </div>

                      <div className="space-y-2">
                        <label className={labelClass}>
                          Registration Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register("registrationNo")}
                          placeholder="Enter registration number"
                          className={errors.registrationNo ? fieldErrorStyles : fieldStyles}
                        />
                        <ErrorMessage error={errors.registrationNo?.message} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>Description</label>
                      <textarea
                        {...register("description")}
                        placeholder="Enter organization description (optional)"
                        rows={3}
                        className={`min-h-[96px] w-full resize-none rounded-lg border ${
                          errors.description ? "border-red-400" : "border-gray-300"
                        } bg-white px-3 py-2 text-sm shadow-sm transition hover:border-blue-400 focus:outline-none ${
                          errors.description
                            ? "focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            : "focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        }`}
                      />
                      <ErrorMessage error={errors.description?.message} />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Maximum 500 characters</span>
                        <span className="text-xs text-gray-500">{watch("description")?.length || 0}/500</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <h3 className={sectionTitleClass}>Contact Information</h3>

                {/* Email and Contact Number */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className={labelClass}>
                      Email ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("emailId")}
                      type="email"
                      placeholder="Enter email address"
                      className={errors.emailId ? fieldErrorStyles : fieldStyles}
                    />
                    <ErrorMessage error={errors.emailId?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("contactPersonContactNumber")}
                      placeholder="Enter contact number"
                      className={errors.contactPersonContactNumber ? fieldErrorStyles : fieldStyles}
                    />
                    <ErrorMessage error={errors.contactPersonContactNumber?.message} />
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <h3 className={sectionTitleClass}>Address Information</h3>
                <div className="px-0 py-1">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                      <div className="col-span-6 space-y-2">
                        <label className={labelClass}>Address Line 1</label>
                        <textarea
                          {...register("addressLine1")}
                          placeholder="Enter address line 1"
                          rows={2}
                          className={`min-h-[56px] w-full resize-none rounded-md border px-3 py-2 text-sm ${
                            errors.addressLine1
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-300 focus:border-gray-900"
                          } focus:outline-none`}
                        />
                        <ErrorMessage error={errors.addressLine1?.message} />
                      </div>

                      <div className="col-span-6 space-y-2">
                        <label className={labelClass}>Address Line 2</label>
                        <textarea
                          {...register("addressLine2")}
                          placeholder="Enter address line 2"
                          rows={2}
                          className={`min-h-[56px] w-full resize-none rounded-md border px-3 py-2 text-sm ${
                            errors.addressLine2
                              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-300 focus:border-gray-900"
                          } focus:outline-none`}
                        />
                        <ErrorMessage error={errors.addressLine2?.message} />
                      </div>

                      <div className="col-span-2 space-y-2">
                        <label className={labelClass}>City</label>
                        <input
                          {...register("city")}
                          placeholder="Enter city"
                          className={errors.city ? fieldErrorStyles : fieldStyles}
                        />
                        <ErrorMessage error={errors.city?.message} />
                      </div>

                      <div className="col-span-2 space-y-2">
                        <label className={labelClass}>Pin Code</label>
                        <input
                          {...register("pinCode")}
                          placeholder="Enter 6-digit pin code"
                          maxLength={6}
                          className={errors.pinCode ? fieldErrorStyles : fieldStyles}
                        />
                        <ErrorMessage error={errors.pinCode?.message} />
                      </div>
                    </div>
                </div>
              </div>
              {/* System Information Section */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <h3 className={sectionTitleClass}>System Information</h3>

                {/* Active Status and Financial Year */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className={labelClass}>
                      Active Status <span className="text-red-500">*</span>
                    </label>
                    <div className="w-full">
                      <Controller
                        name="isActive"
                        control={control}
                        render={({ field }) => (
                          <select {...field} className={errors.isActive ? fieldErrorStyles : fieldStyles}>
                            <option value={1}>Active</option>
                            <option value={0}>Inactive</option>
                          </select>
                        )}
                      />
                    </div>
                    <ErrorMessage error={errors.isActive?.message} />
                  </div>

                  <div className="space-y-2">
                    <label className={labelClass}>
                      First Month of Financial Year <span className="text-red-500">*</span>
                    </label>
                    <div className="w-full">
                      <Controller
                        name="firstMonthOfFinancialYear"
                        control={control}
                        render={({ field }) => (
                          <select {...field} className={errors.firstMonthOfFinancialYear ? fieldErrorStyles : fieldStyles}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                              <option key={month} value={month}>
                                {new Date(2024, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </div>
                    <ErrorMessage error={errors.firstMonthOfFinancialYear?.message} />
                  </div>
                </div>
              </div>

              {/* Form Status */}
              {Object.keys(errors).length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="mb-2 flex items-center gap-2 font-medium text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    Please fix the following errors:
                  </div>
                  <ul className="space-y-1 text-sm text-red-700">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>• {error?.message}</li>
                    ))}
                  </ul>
                </div>
              )}

            </form>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 rounded-b-lg border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-9 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting || postLoading || (!isDirty && !logoChanged)}
            className="h-9 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting || postLoading ? "Updating..." : "Update Organization"}
          </button>
        </div>
      </div>
    </div>
  )
}
