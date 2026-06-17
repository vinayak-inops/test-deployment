"use client"

import React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import { X, Calendar, MessageSquare, AlertCircle, Clock, MapPin, FileText, User, Search } from "lucide-react"
import toast from "react-hot-toast"
import { SuccessPopup } from "@/app/_components/success-popup"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { fetchDynamicQuery } from "@repo/ui/hooks/api/dynamic-graphql"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ActionButtons from "@/components/fields/action-buttons"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissions"

type OutDutyType = "days" | "hours"

interface OutDutyFormValues {
  employeeID: string
  fromDate: string
  outDutyType: OutDutyType
  toDate: string
  duration: {
    noOfDays: number
    noOfHours: number
  }
  Reason: string
  OutDutyAddress: string
  remarks?: string
}

const validationSchema = yup.object({
  employeeID: yup.string().required("Employee ID is required"),
  fromDate: yup.string().required("From date is required"),
  outDutyType: yup.mixed<OutDutyType>().oneOf(["days", "hours"]).required("Out-duty type is required"),
  toDate: yup
    .string()
    .required("To date is required")
    .test("not-before-from", "To date cannot be before from date", function (value) {
      const fromDate = this.parent.fromDate
      if (!value || !fromDate) return true
      return new Date(value) >= new Date(fromDate)
    }),
  duration: yup.object({
    noOfDays: yup
      .number()
      .transform((v) => (Number.isNaN(v) ? 0 : v))
      .min(0)
      .when("$type", {
        is: "days",
        then: (schema) => schema.min(1, "No. of days must be at least 1"),
      }),
    noOfHours: yup
      .number()
      .transform((v) => (Number.isNaN(v) ? 0 : v))
      .min(0)
      .when("$type", {
        is: "hours",
        then: (schema) => schema.min(1, "No. of hours must be at least 1"),
      }),
  }),
  Reason: yup.string().required("Reason is required").min(5).max(300),
  OutDutyAddress: yup.string().required("Address is required").min(3).max(200),
  remarks: yup.string().transform((v) => (v === "" ? undefined : v)).notRequired().max(300),
})

interface OutDutyApplicationFormProps {
  isOpen: boolean
  onClose: () => void
  initialValues?: Partial<OutDutyFormValues>
  onSubmit?: (payload: any) => void
}

export default function otFormPopup({ isOpen, onClose, initialValues, onSubmit }: OutDutyApplicationFormProps) {
  const endErrorRef = useRef<HTMLDivElement | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null)
  
  // Get tenant code from cookie using custom hook
  const tenantCode = useGetTenantCode()
  
  // Get logged-in employee ID from hook
  const { employeeId } = useKeyclockRoleInfo()

  // Role permissions for OT applications
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: 'OT',
    screenName: 'otManagement',
  })

  // Cookie helpers to get self employee id
  const getCookie = (name: string): string | undefined => {
    if (typeof window === 'undefined') return undefined
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.startsWith(name + '=')) {
        const value = cookie.substring(name.length + 1)
        try {
          return decodeURIComponent(value)
        } catch {
          return value
        }
      }
    }
    return undefined
  }

  const storedRoleInfo = useMemo(() => {
    try {
      const raw = getCookie('keyclockroleinfo')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  const canEditEmployeeId = useMemo(() => {
    if (rolePermissions?.otApplicationsAll) return true
    if (rolePermissions && Object.keys(rolePermissions).length > 0) return false
    if (!storedRoleInfo?.employeeId && !storedRoleInfo?.employeeID && rolePermissions === null) return true
    return false
  }, [rolePermissions, storedRoleInfo])

  // Employee search state
  type Employee = { _id: string; employeeID: string; firstName: string; middleName?: string; lastName: string; isDeleted?: boolean }
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchText, setSearchText] = useState("")
  const [debounced, setDebounced] = useState("")
  const [results, setResults] = useState<Employee[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedEmployeeLocal, setSelectedEmployeeLocal] = useState<Employee | null>(null)
  const employeeSearchRef = useRef<HTMLDivElement | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
    clearErrors,
  } = useForm<OutDutyFormValues>({
    resolver: yupResolver(validationSchema as any),
    context: { type: initialValues?.outDutyType || "days" },
    mode: "onChange",
    defaultValues: {
      employeeID: initialValues?.employeeID || "",
      fromDate: initialValues?.fromDate || "",
      outDutyType: (initialValues?.outDutyType as OutDutyType) || "days",
      toDate: initialValues?.toDate || "",
      duration: {
        noOfDays: initialValues?.duration?.noOfDays ?? 1,
        noOfHours: initialValues?.duration?.noOfHours ?? 0,
      },
      Reason: initialValues?.Reason || "",
      OutDutyAddress: initialValues?.OutDutyAddress || "",
      remarks: initialValues?.remarks || "",
    },
  })

  const fieldStyles = "h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full"
  const fieldErrorStyles = "h-9 border border-red-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 transition w-full"

  useEffect(() => {
    if (isOpen) {
      const selfId = storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || ""
      reset({
        employeeID: canEditEmployeeId ? (initialValues?.employeeID || "") : selfId,
        fromDate: initialValues?.fromDate || "",
        outDutyType: (initialValues?.outDutyType as OutDutyType) || "days",
        toDate: initialValues?.toDate || "",
        duration: {
          noOfDays: initialValues?.duration?.noOfDays ?? 1,
          noOfHours: initialValues?.duration?.noOfHours ?? 0,
        },
        Reason: initialValues?.Reason || "",
        OutDutyAddress: initialValues?.OutDutyAddress || "",
        remarks: initialValues?.remarks || "",
      })
      clearErrors()
      // Clear UI state
      setSelectedEmployeeLocal(null)
      setSearchText('')
      setResults([])
    }
  }, [isOpen, initialValues, reset, clearErrors, canEditEmployeeId, storedRoleInfo])

  const outDutyType = watch("outDutyType")
  const employeeID = watch("employeeID")
  const fromDate = watch("fromDate")
  const toDate = watch("toDate")

  

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchText.trim().toLowerCase()), 200)
    return () => clearTimeout(t)
  }, [searchText])

  useEffect(() => {
    if (!debounced) { 
      setResults(employees)
      setHighlightedIndex(employees.length ? 0 : -1)
      return
    }
    const filtered = employees.filter(emp => {
      const full = `${emp.firstName} ${emp.middleName || ''} ${emp.lastName}`.toLowerCase()
      return full.includes(debounced) || emp.employeeID.toLowerCase().includes(debounced)
    })
    setResults(filtered)
    setHighlightedIndex(filtered.length ? 0 : -1)
  }, [debounced, employees])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!employeeSearchRef.current) return
      if (!employeeSearchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEmployeeSelect = (emp: Employee) => {
    setSelectedEmployeeLocal(emp)
    setValue('employeeID', emp.employeeID, { shouldValidate: true })
    setSearchText(emp.employeeID)
    setShowDropdown(false)
  }

  const clearEmployee = () => {
    setSelectedEmployeeLocal(null)
    setValue('employeeID', '', { shouldValidate: true })
    setSearchText('')
    setResults(employees)
  }

  const selectedEmployee = selectedEmployeeLocal || (() => {
    const id = watch("employeeID")
    if (!id) return null
    return employees.find(e => e.employeeID === id) || null
  })()

  // Calculate number of days based on date range
  useEffect(() => {
    if (fromDate && toDate) {
      const from = new Date(fromDate)
      const to = new Date(toDate)
      const diffTime = Math.abs(to.getTime() - from.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end dates
      
      if (diffDays > 0) {
        setValue("duration.noOfDays", diffDays, { shouldValidate: true })
      }
    }
  }, [fromDate, toDate, setValue])

  const formatDateToDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`
  }

  const { post: postOutDuty, loading: postLoading } = usePostRequest<any>({
    url: "outDutyApplication",
    onSuccess: (resp) => {
      toast.success("Out-duty application submitted successfully!")
      // Set success data first
      setPendingSubmitData(resp)
      setShowSuccess(true)
      // Then close form
      onClose()
    },
    onError: (error) => {
      const message = (error as any)?.message || "Failed to submit out-duty application"
      toast.error(message)
    },
  })

  const submitForm = (data: OutDutyFormValues) => {
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
    
    // createdOn: 'YYYY-MM-DDTHH:mm:ss.sss+05:30' (IST timezone offset)
    const createdOn = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+05:30`;
    // uploadTime: 'YYYY-MM-DDTHH:mm:ss'
    const uploadTime = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
    // appliedDate: 'YYYY-MM-DD'
    const appliedDate = `${yyyy}-${mm}-${dd}`;
    // uploadedBy and createdBy: use employeeId from hook
    const uploadedBy = employeeId || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || '';
    const createdBy = employeeId || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || '';
    // organizationCode and tenantCode from hook
    const organizationCode = tenantCode;

    const payload = {
      employeeID: data.employeeID,
      fromDate: formatDateToDDMMYYYY(data.fromDate),
      outDutyType: data.outDutyType,
      toDate: formatDateToDDMMYYYY(data.toDate),
      duration: {
        noOfDays: data.duration.noOfDays,
        noOfHours: data.duration.noOfHours,
      },
      Reason: data.Reason,
      OutDutyAddress: data.OutDutyAddress,
      remarks: data.remarks || undefined,
      tenantCode,
      workflowName: "outDuty Application",
      uploadedBy,
      createdBy,
      createdOn,
      uploadTime,
      organizationCode,
      appliedDate,
      workflowState: "VALIDATED",
    }

    const json = {
      tenant: tenantCode,
      action: "insert",
      id: null,
      event: "outDutyApplication",
      collectionName: "outDutyApplication",
      data: payload,
    }

    postOutDuty(json)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null
    return (
      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </div>
    )
  }

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
              <CardTitle className="text-base font-semibold text-gray-700">Out Duty Application</CardTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
            <form id="outDutyForm" onSubmit={handleSubmit(submitForm)} className="space-y-6">
              {/* Employee Information */}
              <div className="space-y-3">
                <div className="space-y-2 pb-3">
                  {canEditEmployeeId ? (
                    <>
                      <EmployeeSearchField
                        isOpen={isOpen}
                        errorText={errors.employeeID?.message}
                        onSelect={(emp: EmpType) => {
                          setSelectedEmployeeLocal({
                            _id: (emp as any)._id,
                            employeeID: emp.employeeID,
                            firstName: emp.firstName,
                            middleName: (emp as any).middleName,
                            lastName: (emp as any).lastName,
                          } as any)
                          setValue('employeeID', emp.employeeID, { shouldValidate: true })
                        }}
                        onClear={() => {
                          setSelectedEmployeeLocal(null)
                          setValue('employeeID', '', { shouldValidate: true })
                        }}
                      />
                      <input type="hidden" {...(register('employeeID') as any)} />
                    </>
                  ) : (
                    <>
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Employee ID <span className="text-red-500 normal-case">*</span></Label>
                      <Input
                        type="text"
                        value={watch('employeeID') || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || ''}
                        readOnly
                        className="h-9 border-gray-300 px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-600 w-full cursor-not-allowed"
                      />
                      <input type="hidden" {...(register('employeeID') as any)} />
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Out Duty Type <span className="text-red-500 normal-case">*</span></Label>
                    <Controller
                      name="outDutyType"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(e) => field.onChange(e.target.value as OutDutyType)}
                          className={errors.outDutyType ? fieldErrorStyles : fieldStyles}
                        >
                          <option value="days">Days</option>
                          <option value="hours">Hours</option>
                        </select>
                      )}
                    />
                    <ErrorMessage error={errors.outDutyType?.message as any} />
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">From Date <span className="text-red-500 normal-case">*</span></Label>
                  <input type="date" {...register("fromDate") as any} className={errors.fromDate ? fieldErrorStyles : fieldStyles} />
                  <ErrorMessage error={errors.fromDate?.message} />
                </div>
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">To Date <span className="text-red-500 normal-case">*</span></Label>
                  <input type="date" {...register("toDate") as any} min={watch("fromDate")} className={errors.toDate ? fieldErrorStyles : fieldStyles} />
                  <ErrorMessage error={errors.toDate?.message} />
                </div>
              </div>

              {/* Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">No. of Days {outDutyType === "days" && <span className="text-red-500 normal-case">*</span>}</Label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    {...register("duration.noOfDays") as any}
                    readOnly
                    aria-readonly="true"
                    className={`${errors.duration?.noOfDays ? fieldErrorStyles : fieldStyles} bg-gray-50 cursor-not-allowed`}
                    placeholder="Auto-calculated from dates"
                  />
                  <ErrorMessage error={errors.duration?.noOfDays?.message as any} />
                  <span className="text-xs text-gray-500">Auto-calculated from date range</span>
                </div>
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">No. of Hours {outDutyType === "hours" && <span className="text-red-500 normal-case">*</span>}</Label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    {...register("duration.noOfHours") as any}
                    readOnly={outDutyType !== "hours"}
                    aria-readonly={outDutyType !== "hours" ? "true" : "false"}
                    className={`${errors.duration?.noOfHours ? fieldErrorStyles : fieldStyles} ${outDutyType !== "hours" ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    placeholder={outDutyType === "hours" ? "Enter hours" : "Select 'Hours' type to edit"}
                  />
                  <ErrorMessage error={errors.duration?.noOfHours?.message as any} />
                  <span className="text-xs text-gray-500">{outDutyType === "hours" ? "Enter number of hours" : "Only editable when type is 'Hours'"}</span>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Reason <span className="text-red-500 normal-case">*</span></Label>
                <div className="relative">
                  <FileText className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input type="text" {...register("Reason") as any} placeholder="Enter reason" className={errors.Reason ? fieldErrorStyles : fieldStyles} />
                </div>
                <ErrorMessage error={errors.Reason?.message} />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Out Duty Address <span className="text-red-500 normal-case">*</span></Label>
                <div className="relative">
                  <MapPin className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input type="text" {...register("OutDutyAddress") as any} placeholder="Enter address/location" className={errors.OutDutyAddress ? fieldErrorStyles : fieldStyles} />
                </div>
                <ErrorMessage error={errors.OutDutyAddress?.message} />
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Remarks</Label>
                <textarea
                  {...register("remarks") as any}
                  rows={3}
                  placeholder="Optional remarks (minimum 5 characters)"
                  className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.remarks ? "focus:ring-red-500 focus:border-red-500" : "focus:ring-gray-900 focus:border-gray-900"} shadow-sm resize-none transition`}
                />
                <ErrorMessage error={errors.remarks?.message} />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Optional; min 5, max 300 characters</span>
                  <span className="text-xs text-gray-500">{watch("remarks")?.length || 0}/300</span>
                </div>
              </div>

              {/* Error Summary */}
              {Object.keys(errors).length > 0 && (
                <div ref={endErrorRef} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                    <AlertCircle className="h-4 w-4" />
                    Please fix the following errors:
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>• {field}: {(error as any)?.message || "Invalid value"}</li>
                    ))}
                  </ul>
                </div>
              )}
            </form>
          </CardContent>

          <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel="SAVE APPLICATION"
              onPrimary={handleSubmit(submitForm)}
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

      {/* Success popup - rendered outside form popup so it persists after form closes */}
      <SuccessPopup
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false)
          if (pendingSubmitData) {
            onSubmit?.(pendingSubmitData)
            setPendingSubmitData(null)
          }
        }}
        title="Application Submitted"
        message="Your out-duty request has been submitted successfully."
      />
    </>
  )
}
