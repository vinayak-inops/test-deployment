"use client"

import type React from "react"
import { useEffect, useState, useRef, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { X, AlertCircle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ActionButtons from "@/components/fields/action-buttons"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import toast from "react-hot-toast";
import { fetchDynamicQuery } from "@repo/ui/hooks/api/dynamic-graphql";
import { SuccessPopup } from "@/app/_components/success-popup";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useKeyclockRoleInfo } from '@/hooks/api/search/keyclock-role-info';
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search";
import { useEmployeeShiftGraphql } from "@/hooks/api/useEmployeeShiftGraphql";
import { SingleSelectField } from "@/components/fields/single-select-field";

// Types
export interface ShiftChangeApplication {
  employeeID: string
  fromDate: string
  toDate: string
  shiftGroupCode: string
  shift: string
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
    .required("Employee ID is required"),

  fromDate: yup
    .string()
    .required("From date is required"),

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

  shift: yup
    .string()
    .required("Shift is required"),

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
    .transform((value) => (value === "" ? undefined : value))
    .notRequired()
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
  const { data: session } = useSession();
  const [selectedShiftObj, setSelectedShiftObj] = useState<any | null>(null);
  const endErrorRef = useRef<HTMLDivElement | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);
  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const { responseData: rolePermissions } = useRolePermissions({
          serviceName: 'applicationApplier',
          screenName: 'shiftChange'
      });
  
  // Get stored role information from cookies
  const getCookie = (name: string): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        const value = cookie.substring(name.length + 1);
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
    return undefined;
  };

  const storedRoleInfo = useMemo(() => {
    try {
      const keyclockroleinfo = getCookie("keyclockroleinfo");
      if (keyclockroleinfo) {
        return JSON.parse(keyclockroleinfo);
      }
    } catch {
      // ignore
    }
    return null as any;
  }, []);
  
  const fieldLabels: Record<string, string> = {
    employeeID: "Employee ID",
    fromDate: "From Date",
    toDate: "To Date",
    shiftGroupCode: "Shift Group Code",
    shift: "Shift",
    isAutomatic: "Automatic Assignment",
    Remarks: "Remarks",
    remarks: "Additional Remarks",
  };
  
  // Optional: prefill from session, but user can search/select
  const employeeIdFromSession: string =
    ((session as any)?.user?.employeeID as string) || "";
  const canEditEmployeeId = useMemo(() => {
    if (rolePermissions?.all) return true
    if (rolePermissions && Object.keys(rolePermissions).length > 0) return false
    if (!employeeIdFromSession && rolePermissions === null) return true
    return false
  }, [rolePermissions, employeeIdFromSession])
  
  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    mode: "onChange",
    reValidateMode: "onSubmit",
    shouldFocusError: true,
    defaultValues: {
      employeeID: initialValues.employeeID || "",
      fromDate: initialValues.fromDate || "",
      toDate: initialValues.toDate || "",
      shiftGroupCode: initialValues.shiftGroupCode || "",
      shift: initialValues.shift || "",
      isAutomatic: initialValues.isAutomatic || false,
      Remarks: initialValues.Remarks || "",
      remarks: initialValues.remarks || "",
    },
  })

  const {
    post: postShiftChange,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "shiftChangeApplication",
    onSuccess: (data) => {
      setPendingSubmitData(data);
      setShowSuccess(true);
      onClose();
    },
    onError: (error) => {
      const message = (error as any)?.message || "Failed to submit shift change application";
      toast.error(message);
    },
  });

  // Common field styles for consistent height
  const fieldStyles =
    "h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full"

  const fieldErrorStyles =
    "h-9 border border-red-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 transition w-full"

  // Reset form when popup opens
  useEffect(() => {
    if (isOpen) {
      setIsSubmitAttempted(false);
      reset({
        employeeID: canEditEmployeeId ? (initialValues.employeeID || "") : employeeIdFromSession,
        fromDate: initialValues.fromDate || "",
        toDate: initialValues.toDate || "",
        shiftGroupCode: initialValues.shiftGroupCode || "",
        shift: initialValues.shift || "",
        isAutomatic: initialValues.isAutomatic || false,
        Remarks: initialValues.Remarks || "",
        remarks: initialValues.remarks || "",
      })
      clearErrors()
      setSelectedShiftObj(null);
    }
  }, [initialValues, isOpen, reset, clearErrors, employeeIdFromSession, canEditEmployeeId])

  const employeeID = watch("employeeID") || employeeIdFromSession || "";

  // Handle form submission
  const onFormSubmit = (data: FormData) => {
    setIsSubmitAttempted(true);
    
    // Validate that shift group and shift are selected
    if (!data.shiftGroupCode || !data.shift) {
      toast.error("Please select both Shift Group and Shift");
      return;
    }
    
    // Helper functions for date formatting
    const pad = (n: number) => n < 10 ? `0${n}` : n;
    
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    const yyyy = istTime.getFullYear();
    const mm = pad(istTime.getMonth() + 1);
    const dd = pad(istTime.getDate());
    const hh = pad(istTime.getHours());
    const min = pad(istTime.getMinutes());
    const ss = pad(istTime.getSeconds());
    const ms = pad(istTime.getMilliseconds());
    
    const formatDateToDDMMYYYY = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const day = pad(date.getDate());
      const month = pad(date.getMonth() + 1);
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };
    
    const createdOn = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+05:30`;
    const uploadTime = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
    const appliedDate = `${yyyy}-${mm}-${dd}`;
    const uploadedBy = employeeId || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || '';
    const createdBy = employeeId || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || '';
    const organizationCode = tenantCode;

    const formattedData: any = {
      ...data,
      fromDate: formatDateToDDMMYYYY(data.fromDate),
      toDate: formatDateToDDMMYYYY(data.toDate),
      appliedDate,
      workflowState: 'INITIATED',
      uploadedBy,
      createdBy,
      createdOn,
      uploadTime,
      shift: selectedShiftObj,
      organizationCode,
      tenantCode,
      workflowName:"shiftChange Application",
      stateEvent:"NEXT"
    };

    const json = {
      tenant: tenantCode,
      action: "insert",
      id: null,
      event: "application",
      collectionName: "shiftChangeApplication",
      data: formattedData,
    }
    postShiftChange(json);
  }

  const handleLocalClose = () => {
    setIsSubmitAttempted(false);
    reset({
      employeeID: initialValues.employeeID || "",
      fromDate: initialValues.fromDate || "",
      toDate: initialValues.toDate || "",
      shiftGroupCode: initialValues.shiftGroupCode || "",
      shift: initialValues.shift || "",
      isAutomatic: initialValues.isAutomatic || false,
      Remarks: initialValues.Remarks || "",
      remarks: initialValues.remarks || "",
    })
    setSelectedShiftObj(null);
    clearErrors();
    onClose();
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleLocalClose()
    }
  }

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

  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null
    return (
      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </div>
    )
  }

  const selectedGroupCode = watch('shiftGroupCode');
  const canEditShiftGroup = Boolean(employeeID?.trim());
  
  const {
    shiftGroups,
    shiftGroupsLoading: isLoading,
    shiftGroupsError,
    shiftOptions,
  } = useEmployeeShiftGraphql({
    tenantCode: canEditShiftGroup ? tenantCode : undefined,
    employeeId: employeeID,
    shiftGroupCode: selectedGroupCode,
    shiftGroupSearch: "",
  });

  useEffect(() => {
    if (!shiftGroupsError) return;
    const message = shiftGroupsError.message || "Failed to load shift groups";
    toast.error(message);
  }, [shiftGroupsError]);

  // Transform shift groups for SingleSelectField
  const shiftGroupOptions = useMemo(() => {
    return shiftGroups.map((group) => ({
      value: group.shiftGroupCode,
      label: group.shiftGroupName || group.shiftGroupCode,
      tooltip: `${group.shiftGroupName} (${group.shiftGroupCode})`
    }));
  }, [shiftGroups]);

  // Transform shifts for SingleSelectField
  const shiftOptionsForSelect = useMemo(() => {
    return shiftOptions.map((shift:any) => ({
      value: shift.shiftCode || shift.code || '',
      label: shift.shiftName || shift.name || shift.shiftCode || shift.code || '',
      tooltip: `${shift.shiftName || shift.name} (${shift.shiftCode || shift.code})`
    }));
  }, [shiftOptions]);

  // Helper function to determine if an error should be shown
  const shouldShowError = (fieldName: keyof FormData) => {
    if (fieldName === 'shiftGroupCode' || fieldName === 'shift') {
      return isSubmitAttempted && errors[fieldName];
    }
    return errors[fieldName];
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <div className="bg-transparent w-full max-w-4xl flex flex-col">
            <Card className="w-full max-h-[80vh] flex flex-col overflow-hidden">
              <CardHeader className="px-6 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-700">Shift Change Application</CardTitle>
                  <button
                    onClick={handleLocalClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                    aria-label="Close popup"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
                <form
                  id="shiftChangeForm"
                  onSubmit={handleSubmit(onFormSubmit, (formErrors) => {
                    setIsSubmitAttempted(true);
                    toast.error("Please fix the highlighted errors");
                    setTimeout(() => {
                      endErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 0);
                  })}
                  className="space-y-6"
                >
                  {/* Employee Information Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {canEditEmployeeId ? (
                        <EmployeeSearchField
                          isOpen={isOpen}
                          errorText={errors.employeeID?.message}
                          onSelect={(emp: EmpType) => {
                            setValue('employeeID', emp.employeeID, { shouldValidate: true })
                            setValue('shiftGroupCode', '', { shouldValidate: false })
                            setValue('shift', '', { shouldValidate: false })
                            setSelectedShiftObj(null)
                            setIsSubmitAttempted(false)
                          }}
                          onClear={() => {
                            setValue('employeeID', '', { shouldValidate: true })
                            setValue('shiftGroupCode', '', { shouldValidate: false })
                            setValue('shift', '', { shouldValidate: false })
                            setSelectedShiftObj(null)
                            setIsSubmitAttempted(false)
                          }}
                          preSelectedEmployeeId={initialValues?.employeeID}
                          label="Employee ID"
                        />
                      ) : (
                        <>
                          <label className="block text-sm font-semibold text-gray-700">Employee ID <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={watch('employeeID') || employeeIdFromSession}
                            readOnly
                            className="h-9 border-gray-300 px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-600 w-full cursor-not-allowed"
                          />
                          <input type="hidden" {...register('employeeID')} />
                          {errors.employeeID && (
                            <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.employeeID?.message}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Shift Change Details Section */}
                  <div className="space-y-4">
                    {/* Date Range Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        </div>
                        <ErrorMessage error={errors.fromDate?.message} />
                      </div>

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
                        </div>
                        <ErrorMessage error={errors.toDate?.message} />
                      </div>
                    </div>

                    {/* Shift Group and Shift using SingleSelectField */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Shift Group Code */}
                      <SingleSelectField
                        id="shiftGroupCode"
                        label="Shift Group Code"
                        required={true}
                        placeholder={!canEditShiftGroup ? "Select employee first" : "Select shift group"}
                        disabled={!canEditShiftGroup || isLoading}
                        value={watch('shiftGroupCode')}
                        onChange={(value) => {
                          setValue('shiftGroupCode', value, { shouldValidate: false });
                          setValue('shift', '', { shouldValidate: false });
                          setSelectedShiftObj(null);
                        }}
                        options={shiftGroupOptions}
                        errorMessage={shouldShowError('shiftGroupCode') ? errors.shiftGroupCode?.message : undefined}
                        isLoading={isLoading}
                        showOnlyValueInTrigger={false}
                        showValueInOptions={true}
                      />

                      {/* Shift */}
                      <SingleSelectField
  id="shift"
  label="Shift"
  required={true}
  placeholder={!selectedGroupCode ? "Select shift group first" : "Select shift"}
  disabled={!selectedGroupCode || shiftOptionsForSelect.length === 0}
  value={watch('shift')}
  onChange={(value) => {
    setValue('shift', value, { shouldValidate: false });
    // Find and store the selected shift object
    const selectedShift:any = shiftOptions.find(
      (s: any) => (s.shiftCode || s.code) === value
    );
    
    // Remove __typename property and any nested shift/grace if present
    if (selectedShift) {
      let shiftToStore = selectedShift;
      
      // If selectedShift has a nested 'shift' property, use that
      if (selectedShift.shift) {
        shiftToStore = selectedShift.shift;
      }
      
      // Remove __typename property
      const { __typename, ...cleanedShift } = shiftToStore;
      setSelectedShiftObj(cleanedShift);
    } else {
      setSelectedShiftObj(null);
    }
  }}
  options={shiftOptionsForSelect}
  errorMessage={shouldShowError('shift') ? errors.shift?.message : undefined}
  showOnlyValueInTrigger={false}
  showValueInOptions={true}
/>
                    </div>

                    {/* Automatic toggle */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </div>

                  {/* Form Status - Only show errors after submit attempt */}
                  {isSubmitAttempted && Object.keys(errors).length > 0 && (
                    <div ref={endErrorRef} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                        <AlertCircle className="h-4 w-4" />
                        Please fix the following errors:
                      </div>
                      <ul className="text-sm text-red-700 space-y-1">
                        {Object.entries(errors).map(([field, error]) => (
                          <li key={field}>• {fieldLabels[field] || field}: {error?.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pb-4"></div>
                </form>
              </CardContent>

              <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
                <ActionButtons
                  layout="end"
                  secondaryLabel="Cancel"
                  onSecondary={handleLocalClose}
                  primaryLabel="SAVE APPLICATION"
                  onPrimary={handleSubmit(onFormSubmit)}
                  primaryLoading={isSubmitting}
                  className="w-full"
                  primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
                  secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
                />
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
      <SuccessPopup
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          if (pendingSubmitData) {
            onSubmit(pendingSubmitData);
            setPendingSubmitData(null);
          }
        }}
        title="Application Submitted"
        message="Your shift change request has been submitted successfully."
      />
    </>
  )
}