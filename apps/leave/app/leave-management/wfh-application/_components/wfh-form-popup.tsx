"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import { X, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import { SuccessPopup } from "@/components/message/success-popup"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ActionButtons from "@/components/fields/action-buttons"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useKeyclockRoleInfo } from "../../../../hooks/search/keyclock-role-info"

interface WfhFormValues {
  employeeID: string
  fromDate: string
  toDate: string
  fromDuration: string
  toDuration: string
  description: string
}

const DURATION_OPTIONS = [
  { value: "First-Half", label: "First Half" },
  { value: "Second-Half", label: "Second Half" },
  { value: "Full-Day", label: "Full Day" },
]

const schema = yup.object({
  employeeID: yup.string().required("Employee ID is required"),
  fromDate: yup.string().required("From date is required"),
  toDate: yup.string().required("To date is required"),
  fromDuration: yup.string().required("From duration is required"),
  toDuration: yup.string().required("To duration is required"),
  description: yup.string().required("Description is required").max(300, "Description must be at most 300 characters"),
})

const fieldStyles = "h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full"
const fieldErrorStyles = "h-9 border border-red-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 transition w-full"
const selectClassName = "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"

export default function WfhFormPopup({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialValues,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmitSuccess: () => void
  initialValues?: Partial<WfhFormValues>
}) {
  const endErrorRef = useRef<HTMLDivElement | null>(null)
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const [showSuccess, setShowSuccess] = useState(false)

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

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "wfh",
  })

  const canEditEmployeeId = useMemo(() => {
    if (rolePermissions?.all) return true
    if (rolePermissions && Object.keys(rolePermissions).length > 0) return false
    if (!storedRoleInfo && rolePermissions === null) return true
    return false
  }, [rolePermissions, storedRoleInfo])

  // Employee search state
  type Employee = { _id: string; employeeID: string; firstName: string; middleName?: string; lastName: string; isDeleted?: boolean }
  const [employees] = useState<Employee[]>([])
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
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
    clearErrors,
    setError,
  } = useForm<WfhFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      employeeID: initialValues?.employeeID || "",
      fromDate: initialValues?.fromDate || "",
      toDate: initialValues?.toDate || "",
      fromDuration: initialValues?.fromDuration || "First-Half",
      toDuration: initialValues?.toDuration || "Full-Day",
      description: initialValues?.description || "",
    },
  })

  useEffect(() => {
    if (isOpen) {
      const selfId = storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || ""
      reset({
        employeeID: canEditEmployeeId ? initialValues?.employeeID || "" : selfId,
        fromDate: initialValues?.fromDate || "",
        toDate: initialValues?.toDate || "",
        fromDuration: initialValues?.fromDuration || "First-Half",
        toDuration: initialValues?.toDuration || "Full-Day",
        description: initialValues?.description || "",
      })
      clearErrors()
      // Clear UI state
      setSelectedEmployeeLocal(null)
      setSearchText('')
      setResults([])
    }
  }, [isOpen, reset, canEditEmployeeId, initialValues, storedRoleInfo, clearErrors])

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

  const { post, loading } = usePostRequest<any>({
    url: "wfhApplication",
    onSuccess: () => {
      onClose()
      setTimeout(() => {
        setShowSuccess(true)
        onSubmitSuccess()
      }, 100)
    },
    onError: (e) => toast.error((e as any)?.message || "Failed to submit WFH application"),
  })

  const onSubmit = async (v: WfhFormValues) => {
    // Helper functions for date formatting
    const pad = (n: number) => n < 10 ? `0${n}` : n;
    
    // Get current time in Indian Standard Time (IST)
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    
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
    // uploadedBy: get employee ID from hook, fallback to storedRoleInfo
    const uploadedBy = employeeId || storedRoleInfo?.employeeId;
    // createdBy: get employee ID from hook, fallback to storedRoleInfo
    const createdBy = employeeId || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || '';
    // organizationCode and tenantCode from hook
    const organizationCode = tenantCode;

    await post({
      tenant: tenantCode,
      action: "insert",
      id: null,
      event: "application",
      collectionName: "wfhApplication",
      data: {
        employeeID: v.employeeID,
        fromDate: v.fromDate,
        toDate: v.toDate,
        fromDuration: v.fromDuration,
        toDuration: v.toDuration,
        description: v.description,
        tenantCode,
        workflowName: "wfh Application",
        uploadedBy,
        createdBy,
        createdOn,
        uploadTime,
        organizationCode,
        stateEvent: "NEXT",
        workflowState: "INITIATED",
        appliedDate,
      },
    })
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

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-transparent w-full max-w-4xl flex flex-col">
          <Card className="w-full max-h-[80vh] flex flex-col overflow-hidden">
            <CardHeader className="px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-700">WFH Application</CardTitle>
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
              <form id="wfhForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                        <input type="hidden" {...register('employeeID') as any} />
                      </>
                    ) : (
                      <>
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Employee ID <span className="text-red-500 normal-case">*</span>
                        </Label>
                        <Input
                          type="text"
                          value={watch('employeeID') || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || ''}
                          readOnly
                          className="h-9 border-gray-300 px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-600 w-full cursor-not-allowed"
                        />
                        <input type="hidden" {...register('employeeID') as any} />
                      </>
                    )}
                  </div>

                  {/* Date & Duration Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* From Date */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        From Date <span className="text-red-500 normal-case">*</span>
                      </Label>
                      <Input 
                        type="date" 
                        {...register("fromDate")} 
                        className={errors.fromDate ? fieldErrorStyles : fieldStyles}
                      />
                      <ErrorMessage error={errors.fromDate?.message} />
                    </div>

                    {/* To Date */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        To Date <span className="text-red-500 normal-case">*</span>
                      </Label>
                      <Input 
                        type="date" 
                        {...register("toDate")} 
                        className={errors.toDate ? fieldErrorStyles : fieldStyles}
                      />
                      <ErrorMessage error={errors.toDate?.message} />
                    </div>

                    {/* From Duration */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        From Duration <span className="text-red-500 normal-case">*</span>
                      </Label>
                      <select 
                        {...register("fromDuration")} 
                        className={errors.fromDuration ? fieldErrorStyles : fieldStyles}
                      >
                        <option value="">Select Duration</option>
                        {DURATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ErrorMessage error={errors.fromDuration?.message} />
                    </div>

                    {/* To Duration */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        To Duration <span className="text-red-500 normal-case">*</span>
                      </Label>
                      <select 
                        {...register("toDuration")} 
                        className={errors.toDuration ? fieldErrorStyles : fieldStyles}
                      >
                        <option value="">Select Duration</option>
                        {DURATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ErrorMessage error={errors.toDuration?.message} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Description <span className="text-red-500 normal-case">*</span>
                  </Label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Enter description (max 300 characters)"
                    className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.description ? "focus:ring-red-500 focus:border-red-500" : "focus:ring-gray-900 focus:border-gray-900"} shadow-sm resize-none transition`}
                  />
                  <ErrorMessage error={errors.description?.message} />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Required; max 300 characters</span>
                    <span className="text-xs text-gray-500">{watch("description")?.length || 0}/300</span>
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
                primaryLabel="SUBMIT APPLICATION"
                onPrimary={handleSubmit(onSubmit)}
                primaryLoading={isSubmitting || loading}
                className="w-full"
                primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
                secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
              />
            </CardFooter>
          </Card>
        </div>
      </div>

      <SuccessPopup
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Application Submitted"
        message="Your WFH request has been submitted successfully."
      />
    </>
  )
}