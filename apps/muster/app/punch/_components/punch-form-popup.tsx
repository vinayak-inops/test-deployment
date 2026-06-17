"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { X, Clock, User, MessageSquare, AlertCircle, Search } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import toast from "react-hot-toast";
import { useAdminRole } from "@inops/store/src/hooks/useAdminRole";
import { fetchDynamicQuery } from "@repo/ui/hooks/api/dynamic-graphql";
import { useGetTenantCode } from "../../../hooks/useGetTenantCode";
import { SuccessPopup } from "../punch-application/_components/success-popup";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ActionButtons from "@/components/common/action-buttons"

// Types
export type TypeOfMovement = string // Now regionCode
export type InOut = "I" | "O"

export interface PunchApplication {
  employeeID: string
  attendanceDate: string
  typeOfMovement: TypeOfMovement
  punchedTime: string
  inOut: InOut
  transactionTime: string
  remarks: string
}

// In/Out options with display labels
const inOutOptions: { value: InOut; label: string }[] = [
  { value: "I", label: "In" },
  { value: "O", label: "Out" }
]

const validationSchema = yup.object({
  employeeID: yup
    .string()
    .required("Employee ID is required"),

  attendanceDate: yup
    .string()
    .required("Attendance date is required")
    .test("not-future", "Attendance date cannot be in the future", (value) => {
      if (!value) return true
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      return selectedDate <= today
    })
    .test("not-too-old", "Attendance date cannot be more than 30 days old", (value) => {
      if (!value) return true
      const selectedDate = new Date(value)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return selectedDate >= thirtyDaysAgo
    }),

  typeOfMovement: yup
    .string()
    .required("Type of movement is required"),

  // ✅ FIXED: Accept datetime with seconds
  punchedTime: yup
    .string()
    .required("Punched time is required")
    .matches(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
      "Please enter a valid date & time"
    ),

  inOut: yup
    .string()
    .required("Swipe mode is required")
    .oneOf(["I", "O"], "Please select a valid swipe mode"),

  // ✅ OPTIONAL: also support seconds here (recommended)
  transactionTime: yup
    .string()
    .required("Transaction time is required")
    .matches(
      /^\d{2}:\d{2}(:\d{2})?$/,
      "Please enter a valid time (HH:MM or HH:MM:SS)"
    ),

  remarks: yup
    .string()
    .required("Remarks are required")
    .min(10, "Remarks must be at least 10 characters")
    .max(500, "Remarks must not exceed 500 characters")
    .test("no-profanity", "Remarks contain inappropriate language", (value) => {
      if (!value) return true
      const profanityWords = ["spam", "inappropriate"]
      return !profanityWords.some((word) =>
        value.toLowerCase().includes(word)
      )
    }),
})

type FormData = yup.InferType<typeof validationSchema>

// Props interface
interface PunchFormPopupProps {
  isOpen: boolean
  onClose: () => void
  initialValues?: Partial<PunchApplication>
  onSubmit: (data: PunchApplication) => void
  refetch?: () => void
}

// Main Component
export default function PunchFormPopup({ isOpen, onClose, initialValues = {}, onSubmit, refetch }: PunchFormPopupProps) {
  const { data: session } = useSession();

  const [allowedServices, setAllowedServices] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [excelService, setExcelService] = useState<any>(null);
  const [editEmployeeId, setEditEmployeeId] = useState<any>(null);
  const [fixedEmployeeId, setFixedEmployeeId] = useState<any>(null);

  // Employee search state
  type Employee = { _id: string; employeeID: string; firstName: string; middleName?: string; lastName: string; isDeleted?: boolean };
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchText, setSearchText] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<Employee[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployeeLocal, setSelectedEmployeeLocal] = useState<any | null>(null);
  const employeeSearchRef = useRef<HTMLDivElement | null>(null);
  const tenantCode = useGetTenantCode();

  // Success popup state
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);

  const contractorEmployee = "muster-punch"

  // Role permissions for OT applications
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: 'applicationApplier',
    screenName: 'punch'
  });

  // Get admin role data from Redux
  const { adminRole } = useAdminRole();

  // Load allowed services from Redux only
  useEffect(() => {
    setIsClient(true);

    if (adminRole?.screenPermissions) {
      setAllowedServices(adminRole.screenPermissions);
    } else {
      setAllowedServices([]);
    }
  }, [adminRole]);

  // Set excel service from allowed services
  useEffect(() => {
    if (!isClient) return;

    const muster = allowedServices.find((service: any) => service.serviceName === "muster");
    setExcelService(muster);
  }, [isClient, allowedServices]);

  // Get permissions for each task
  useEffect(() => {
    if (!excelService) return;

    const musterScreen = excelService.screens.find((screen: any) => screen.componentType === contractorEmployee);

    if (musterScreen) {
      const employeeFixed = musterScreen?.permissions[`punchApplicationsEmployeeIdFixed`];
      const employeeEdit = musterScreen?.permissions[`punchApplicationsEmployeeIdEdit`];

      if (employeeEdit) {
        setEditEmployeeId(true);
      }
      if (employeeFixed) {
        setFixedEmployeeId(true);
      }
      if (employeeEdit && employeeFixed) {
        setEditEmployeeId(null);
        setFixedEmployeeId(true);
      }
    }
  }, [contractorEmployee, excelService]);

  // Get cookie information
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

  // Get stored role information from cookies
  const storedRoleInfo = useMemo(() => {
    try {
      const keyclockroleinfo = getCookie("keyclockroleinfo");
      if (keyclockroleinfo) {
        return JSON.parse(keyclockroleinfo);
      }
    } catch (error) {
      // ignore parse errors
    }
    return null;
  }, []);

  const canEditEmployeeId = useMemo(() => {
    if (rolePermissions?.all) return true
    if (rolePermissions && Object.keys(rolePermissions).length > 0) return false
    if (!storedRoleInfo && rolePermissions === null) return true
    return false
  }, [rolePermissions, storedRoleInfo])

  // Employee loading function
  const loadEmployees = async () => {
    try {
      const employeeFields = {
        fields: [
          '_id',
          'employeeID',
          'firstName',
          'isDeleted'
        ]
      };

      const result = await fetchDynamicQuery(
        employeeFields,
        'contract_employee',
        'FetchAllEmployees',
        'fetchAllEmployees',
        {
          collection: 'contract_employee',
          tenantCode: tenantCode
        }
      )

      if (result?.data && Array.isArray(result.data)) {
        const fetchedEmployees = result.data
        const active = (fetchedEmployees || []).filter((rec: any) => rec?.isDeleted !== true);
        setEmployees(active)
      }
    } catch (err) {
    }
  }

  // Load employees when popup opens
  useEffect(() => {
    if (isOpen) loadEmployees();
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchText.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchText]);

  // Filter employees based on search
  useEffect(() => {
    if (!debounced) {
      setResults(employees);
      setHighlightedIndex(employees.length ? 0 : -1);
      return;
    }
    const filtered = employees.filter(emp => {
      const full = `${emp.firstName} ${emp.middleName || ''} ${emp.lastName}`.toLowerCase();
      return full.includes(debounced) || emp.employeeID.toLowerCase().includes(debounced);
    });
    setResults(filtered);
    setHighlightedIndex(filtered.length ? 0 : -1);
  }, [debounced, employees]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!employeeSearchRef.current) return;
      if (!employeeSearchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Employee selection handlers
  const handleEmployeeSelect = (emp: Employee) => {
    setSelectedEmployeeLocal(emp);
    setValue('employeeID', emp.employeeID, { shouldValidate: true });
    setSearchText(emp.employeeID);
    setShowDropdown(false);
  };

  const clearEmployee = () => {
    setSelectedEmployeeLocal(null);
    setValue('employeeID', '', { shouldValidate: true });
    setSearchText('');
    setResults(employees);
  };

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
    clearErrors,
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      employeeID: "",
      attendanceDate: "",
      typeOfMovement: "",
      punchedTime: "",
      inOut: "I",
      transactionTime: "",
      remarks: "",
    },
    mode: "onChange",
  })

  const {
    post: postShiftZone,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "forgotPunchApplication",
    onSuccess: (data) => {
      setPendingSubmitData(data);
      refetch?.();
      // Reset form after successful submission
      reset({
        employeeID: canEditEmployeeId ? "" : (storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || ""),
        attendanceDate: "",
        typeOfMovement: "",
        punchedTime: "",
        inOut: "I",
        transactionTime: "",
        remarks: "",
      });
      // Close the main popup first
      onClose();
      // Then show success popup after a small delay
      setTimeout(() => {
        setShowSuccess(true);
      }, 200);
    },
    onError: (error) => {
      console.error("POST error:", error);
      const message = (error as any)?.message || "Failed to submit punch application";
      toast.error(message);
    },
  });

  const selectedEmployee = selectedEmployeeLocal || (() => {
    const id = watch("employeeID");
    if (!id) return null;
    return employees.find(e => e.employeeID === id) || null;
  })();

  // Field styles aligned with AddNewPunchForm
  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  // Track previous isOpen state to only reset when popup opens (not on every initialValues change)
  const prevIsOpenRef = useRef<boolean>(false)

  // Reset form when popup opens (only when transitioning from closed to open)
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current
    const isNowOpen = isOpen

    // Only reset when popup transitions from closed to open
    if (!wasOpen && isNowOpen) {
      // Determine employeeID based on permissions
      // If user can edit, use initialValues or empty (allowing selection)
      // If user cannot edit, force their own employeeID from cookie
      const employeeIdValue = canEditEmployeeId
        ? (initialValues?.employeeID || "")
        : (storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || "");

      reset({
        employeeID: employeeIdValue,
        attendanceDate: initialValues?.attendanceDate || "",
        typeOfMovement: initialValues?.typeOfMovement || "",
        punchedTime: initialValues?.punchedTime || "",
        inOut: initialValues?.inOut || "I",
        transactionTime: initialValues?.transactionTime || "",
        remarks: initialValues?.remarks || "",
      }, {
        keepErrors: false,
        keepDirty: false,
        keepIsSubmitted: false,
        keepTouched: false,
        keepIsValid: false,
        keepSubmitCount: false,
      })
      clearErrors()
      setSelectedEmployeeLocal(null);
      setSearchText('');
      setResults([]);
      setShowDropdown(false);
    }

    // Update ref for next render
    prevIsOpenRef.current = isOpen
  }, [isOpen, reset, clearErrors, canEditEmployeeId, storedRoleInfo, initialValues])

  // Handle form submission
  const onFormSubmit = (data: FormData) => {
    if (!data.employeeID || data.employeeID.trim() === '') {
      setError('employeeID', { type: 'manual', message: 'Employee ID is required' });
      return;
    }
    const pad = (n: number) => n < 10 ? `0${n}` : n;

    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    const yyyy = istTime.getFullYear();
    const mm = pad(istTime.getMonth() + 1);
    const dd = pad(istTime.getDate());
    const hh = pad(istTime.getHours());
    const min = pad(istTime.getMinutes());
    const ss = pad(istTime.getSeconds());

    const convertDateTimeLocalToISO = (dateTimeStr: string) => {
      if (!dateTimeStr) return "";
      const normalized = dateTimeStr.length === 16 ? `${dateTimeStr}:00` : dateTimeStr;
      const [datePart, timePart] = normalized.split("T");
      if (!datePart || !timePart) return "";

      const [year, month, day] = datePart.split("-");
      const [hour, minute, second = "00"] = timePart.split(":");
      if (!year || !month || !day || !hour || !minute) return "";
      return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    };

    const convertTimeWithDateToISO = (timeStr: string, dateStr: string) => {
      if (!timeStr || !dateStr) return "";
      const [hour, minute, second = "00"] = timeStr.split(":");
      const [year, month, day] = dateStr.split("-");
      if (!year || !month || !day || !hour || !minute) return "";
      return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    };

    const punchedTimeISO = convertDateTimeLocalToISO(data.punchedTime);
    const transactionTimeISO = convertTimeWithDateToISO(data.transactionTime, data.attendanceDate);
    // Created time in IST without milliseconds or offset (YYYY-MM-DDTHH:mm:ss)
    const createdOn = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
    const uploadTime = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
    const appliedDate = `${yyyy}-${mm}-${dd}`;
    let uploadedBy = storedRoleInfo?.employeeId;

    const formattedData: any = {
      ...data,
      punchedTime: punchedTimeISO,
      transactionTime: transactionTimeISO,
      typeOfMovement: data.typeOfMovement as TypeOfMovement,
      tenantCode: tenantCode,
      workflowName: 'forgotPunch Application',
      stateEvent: 'NEXT',
      organizationCode: tenantCode,
      isDeleted: false,
      workflowState: 'INITIATED',
      createdBy: storedRoleInfo?.employeeId,
      uploadedBy,
      createdOn,
      uploadTime,
      appliedDate,
    };

    if (typeof window !== "undefined") {
      const json = {
        tenant: tenantCode,
        action: "insert",
        id: null,
        event: "application",
        collectionName: "forgotPunchApplication",
        data: formattedData,
      }
      postShiftZone(json);
    }
  }

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle success popup close
  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    if (pendingSubmitData) {
      onSubmit(pendingSubmitData);
      setPendingSubmitData(null);
    }
  }, [pendingSubmitData, onSubmit]);

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
      <div className="text-red-500 text-xs mt-1">
        {error}
      </div>
    )
  }

  const {
    data: attendanceResponse,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: 'organization/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ],
    onSuccess: (data) => { },
    onError: (error) => { },
    dependencies: []
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Extract reasonCodes from backend response
  const reasonCodes = Array.isArray(attendanceResponse) && attendanceResponse[0]?.reasonCodes
    ? attendanceResponse[0].reasonCodes
    : [];

  // Don't render main popup if not open (but allow success popup to render)
  if (!isOpen && !showSuccess) return null

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <div className="bg-transparent w-full max-w-4xl flex flex-col">
            <Card className="w-full max-h-[90vh] flex flex-col overflow-hidden">
              <CardHeader className="px-6 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-700">Punch Application</CardTitle>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                    aria-label="Close popup"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>

              {/* Form Content */}
              <CardContent className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">

                  {/* Employee Information */}
                  <div className="space-y-3">
                    <div className="space-y-2 pb-3">
                      {canEditEmployeeId ? (
                        <EmployeeSearchField
                          isOpen={isOpen}
                          errorText={errors.employeeID?.message}
                          onSelect={(emp: EmpType) => {
                            setSelectedEmployeeLocal({
                              _id: emp._id,
                              employeeID: emp.employeeID,
                              firstName: emp.firstName,
                              middleName: emp.middleName,
                              lastName: emp.lastName,
                            });
                            setValue('employeeID', emp.employeeID, { shouldValidate: true });
                          }}
                          onClear={() => {
                            setSelectedEmployeeLocal(null);
                            setValue('employeeID', '', { shouldValidate: true });
                          }}
                        />
                      ) : (
                        <>
                          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
                            Employee ID <span className="text-red-500 normal-case">*</span>
                          </Label>
                          <Input
                            type="text"
                            value={watch('employeeID') || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || ''}
                            readOnly
                            className="h-9 border-gray-300 px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-600 w-full cursor-not-allowed"
                          />
                        </>
                      )}
                      {/* Keep employeeID registered so validation errors surface even without a visible input */}
                      <input type="hidden" {...register('employeeID')} />
                      {errors.employeeID && (
                        <ErrorMessage error={errors.employeeID?.message} />
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Attendance Date <span className="text-red-500 normal-case">*</span>
                        </Label>
                        <Input
                          type="date"
                          {...register("attendanceDate")}
                          max={new Date().toISOString().split("T")[0]}
                          min={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                          className={
                            errors.attendanceDate
                              ? "h-9 border border-red-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 transition w-full"
                              : fieldStyles
                          }
                        />
                        <ErrorMessage error={errors.attendanceDate?.message} />
                      </div>

                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Type of Movement <span className="text-red-500 normal-case">*</span>
                        </Label>
                        <Controller
                          name="typeOfMovement"
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className={
                                errors.typeOfMovement
                                  ? "h-9 border border-red-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 transition w-full"
                                  : "h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full"
                              }
                              disabled={isLoading || !!attendanceError}
                            >
                              <option value="">{isLoading ? "Loading..." : attendanceError ? "Error loading reasons" : "Select a Reason"}</option>
                              {reasonCodes.map((reason: any) => (
                                <option key={reason.reasonCode} value={reason.reasonCode}>
                                  {reason.reasonName}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                        <ErrorMessage error={errors.typeOfMovement?.message} />
                      </div>
                    </div>
                  </div>

                  {/* Punch Details */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Punched Time <span className="text-red-500 normal-case">*</span>
                        </Label>
                        <Input
                          type="datetime-local"
                          step="1"
                          onChange={(e) => {
                            const iso = e.target.value.length === 16
                              ? e.target.value + ":00"
                              : e.target.value;

                            setValue("punchedTime", iso);
                          }}
                        />
                        <ErrorMessage error={errors.punchedTime?.message} />
                      </div>

                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Swipe Mode <span className="text-red-500 normal-case">*</span>
                        </Label>
                        <Controller
                          name="inOut"
                          control={control}
                          render={({ field }) => (
                            <select
                              {...field}
                              className={
                                errors.inOut
                                  ? "h-9 border border-red-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 transition w-full"
                                  : "h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full"
                              }
                            >
                              <option value="">Select One</option>
                              {inOutOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                        <ErrorMessage error={errors.inOut?.message} />
                      </div>

                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Transaction Time <span className="text-red-500 normal-case">*</span>
                        </Label>
                        <Input
                          type="time"
                          {...register("transactionTime")}
                          className={
                            errors.transactionTime
                              ? "h-9 border border-red-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 transition w-full"
                              : fieldStyles
                          }
                        />
                        <ErrorMessage error={errors.transactionTime?.message} />
                        <p className="text-xs text-gray-500 mt-1">Time when transaction was processed</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Remarks <span className="text-red-500 normal-case">*</span>
                      </Label>
                      <textarea
                        {...register("remarks")}
                        placeholder="Enter remarks (minimum 10 characters)"
                        rows={3}
                        className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 shadow-sm resize-none transition ${errors.remarks ? "border-red-300" : ""
                          }`}
                      />
                      <ErrorMessage error={errors.remarks?.message} />
                      <div className="flex justify-between items-center ">
                        <span className="text-xs text-gray-500">Minimum 10 characters, maximum 500 characters</span>
                        <span className="text-xs text-gray-500">{watch("remarks")?.length || 0}/500</span>
                      </div>
                    </div>
                  </div>


                </form>
              </CardContent>

              {/* Footer */}
              <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
                <ActionButtons
                  layout="end"
                  secondaryLabel="Cancel"
                  onSecondary={onClose}
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
        onClose={handleSuccessClose}
        title="Application Submitted Successfully"
        message="Your punch application has been submitted successfully and is pending approval."
        autoCloseDelay={2000}
      />
    </>
  )
}
