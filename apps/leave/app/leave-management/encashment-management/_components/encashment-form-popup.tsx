"use client"

import React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import { X, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"
import { SuccessPopup } from "@/components/message/success-popup"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useSession } from "next-auth/react"
// import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
// import { fetchDynamicQuery } from "@repo/ui/hooks/api/dynamic-graphql"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ActionButtons from "@/components/fields/action-buttons"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useKeyclockRoleInfo } from '../../../../hooks/search/keyclock-role-info'

interface OutDutyFormValues {
  employeeID: string
  leaveCode: string
  balance: number
  remarks?: string
}

const createValidationSchema = (maxBalance?: number) => yup.object({
  employeeID: yup.string().required("Employee ID is required"),
  leaveCode: yup.string().required("Leave code is required").max(10),
  balance: yup
    .number()
    .typeError("Balance must be a number")
    .transform((v) => (Number.isNaN(v) ? 0 : v))
    .min(0, "Balance cannot be negative")
    .test(
      "lte-max-balance",
      maxBalance !== undefined ? `Balance must be less than or equal to ${maxBalance}` : "",
      (value) => {
        if (maxBalance === undefined || value === undefined || value === null) return true
        return Number(value) <= maxBalance
      }
    ),
  remarks: yup.string().transform((v) => (v === "" ? undefined : v)).notRequired().max(300),
})

interface OutDutyApplicationFormProps {
  isOpen: boolean
  onClose: () => void
  initialValues?: Partial<OutDutyFormValues>
  onSubmit?: (payload: any) => void
}

export default function EncashmentManagementFormPopup({ isOpen, onClose, initialValues, onSubmit }: OutDutyApplicationFormProps) {
  const { data: session } = useSession()
  const endErrorRef = useRef<HTMLDivElement | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null)
  
  // Get tenant code from cookie using custom hook
  const tenantCode = useGetTenantCode()
  
  // Get logged-in employee ID from hook
  const { employeeId } = useKeyclockRoleInfo()

 // Role permissions for OT applications
  const { responseData: rolePermissions } = useRolePermissions({
          serviceName: 'applicationApplier',
          screenName: 'encashment'
      });

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
    if (rolePermissions?.all) return true
    if (rolePermissions && Object.keys(rolePermissions).length > 0) return false
    if (!storedRoleInfo && rolePermissions === null) return true
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
  const prevLeaveCodeRef = useRef<string>('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
    clearErrors,
    setError,
    trigger,
  } = useForm<OutDutyFormValues>({
    resolver: yupResolver(createValidationSchema() as any),
    mode: "onChange",
    defaultValues: {
      employeeID: initialValues?.employeeID || "",
      leaveCode: (initialValues as any)?.leaveCode || "",
      balance: (initialValues as any)?.balance ?? 0,
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
        leaveCode: (initialValues as any)?.leaveCode || "",
        balance: (initialValues as any)?.balance ?? 0,
        remarks: initialValues?.remarks || "",
      })
      clearErrors()
      // Clear UI state
      setSelectedEmployeeLocal(null)
      setSearchText('')
      setResults([])
      setLeaveBalances([])
      setLeaveCodeOptions([])
      prevLeaveCodeRef.current = ''
    }
  }, [isOpen, initialValues, reset, clearErrors, canEditEmployeeId, storedRoleInfo])

  const employeeID = watch("employeeID")
  const leaveCodeWatch = watch("leaveCode")
  const balanceWatch = watch("balance")

  // State for leave balances
  const [leaveBalances, setLeaveBalances] = useState<any[]>([])
  const [leaveCodeOptions, setLeaveCodeOptions] = useState<Array<{leaveCode: string; leaveTitle: string; balance: number}>>([])

  // Get max balance from selected leave code
  const maxBalance = useMemo(() => {
    if (!leaveCodeWatch || leaveCodeOptions.length === 0) return undefined
    const selectedOption = leaveCodeOptions.find(opt => opt.leaveCode === leaveCodeWatch)
    return selectedOption?.balance
  }, [leaveCodeWatch, leaveCodeOptions])

  // Create dynamic validation schema with max balance
  const validationSchema = useMemo(() => createValidationSchema(maxBalance), [maxBalance])

  // Revalidate balance when maxBalance changes
  useEffect(() => {
    if (maxBalance !== undefined) {
      trigger('balance')
    }
  }, [maxBalance, trigger])

  // Fetch leave balances when employeeID changes
  const requestData = useMemo(() => {
    if (!employeeID || !tenantCode) return []
    return [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "employeeID",
        operator: "eq",
        value: employeeID
      }
    ]
  }, [employeeID, tenantCode])

  const {
    data: leaveBalanceResponse,
    loading: isLoadingLeaveBalances,
    error: leaveBalanceError
  } = useRequest<any>({
    url: 'leaveBalance/search',
    method: 'POST',
    data: requestData,
    onSuccess: (data: any) => {
      // Only process if we still have an employeeID
      if (!employeeID) {
        setLeaveBalances([])
        setLeaveCodeOptions([])
        return
      }
      if (Array.isArray(data) && data.length > 0) {
        const balances = data[0]?.balances || []
        setLeaveBalances(balances)
        // Create options array with leaveCode, leaveTitle, and balance
        const options = balances.map((bal: any) => ({
          leaveCode: bal.leaveCode,
          leaveTitle: bal.leaveTitle,
          balance: bal.balance || 0
        }))
        setLeaveCodeOptions(options)
      } else {
        setLeaveBalances([])
        setLeaveCodeOptions([])
      }
    },
    onError: (error: any) => {
      console.error("Error fetching leave balances:", error)
      setLeaveBalances([])
      setLeaveCodeOptions([])
    },
    dependencies: [employeeID, tenantCode]
  })

  // Clear leaveCode and balance when employeeID changes
  useEffect(() => {
    if (!employeeID) {
      setValue('leaveCode', '')
      setValue('balance', 0)
      setLeaveBalances([])
      setLeaveCodeOptions([])
    }
  }, [employeeID, setValue])

  // Auto-fill balance when leaveCode changes (only on initial selection)
  useEffect(() => {
    // Only auto-fill if leaveCode just changed (not if balance changed)
    if (leaveCodeWatch && leaveCodeOptions.length > 0 && prevLeaveCodeRef.current !== leaveCodeWatch) {
      const selectedBalance = leaveCodeOptions.find(opt => opt.leaveCode === leaveCodeWatch)
      if (selectedBalance) {
        setValue('balance', selectedBalance.balance, { shouldValidate: true })
      }
      prevLeaveCodeRef.current = leaveCodeWatch
    } else if (!leaveCodeWatch) {
      setValue('balance', 0)
      prevLeaveCodeRef.current = ''
    }
  }, [leaveCodeWatch, leaveCodeOptions, setValue])

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
    // Clear leaveCode and balance when employee changes
    setValue('leaveCode', '')
    setValue('balance', 0)
  }

  const clearEmployee = () => {
    setSelectedEmployeeLocal(null)
    setValue('employeeID', '', { shouldValidate: true })
    setSearchText('')
    setResults(employees)
    // Clear leaveCode and balance when employee is cleared
    setValue('leaveCode', '')
    setValue('balance', 0)
    setLeaveBalances([])
    setLeaveCodeOptions([])
  }

  const selectedEmployee = selectedEmployeeLocal || (() => {
    const id = watch("employeeID")
    if (!id) return null
    return employees.find(e => e.employeeID === id) || null
  })()

  // No derived fields for encashment

  // no date formatting needed

  const { post: postOutDuty, loading: postLoading } = usePostRequest<any>({
    url: "leaveEncashmentApplication",
    onSuccess: (resp) => {
      // Close the form first
      onClose()
      // Then show success popup after a small delay to ensure form closes first
      setTimeout(() => {
        setPendingSubmitData(resp)
        setShowSuccess(true)
        // Call onSubmit callback to trigger parent refresh
        if (onSubmit) {
          onSubmit(resp)
        }
      }, 100)
    },
    onError: (error) => {
      const message = (error as any)?.message || "Failed to submit encashment application"
      toast.error(message)
    },
  })

  const submitForm = (data: OutDutyFormValues) => {
    // Enforce: balance must be less than or equal to maxBalance
    if (maxBalance !== undefined && Number(data.balance) > maxBalance) {
      setError('balance', { type: 'manual', message: `Balance must be less than or equal to ${maxBalance}` })
      // Scroll error summary into view if present
      endErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

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
    // uploadedBy: get employee ID from hook, fallback to storedRoleInfo, then session
    const uploadedBy = employeeId || storedRoleInfo?.employeeId;
    // createdBy: get employee ID from hook, fallback to storedRoleInfo
    const createdBy = employeeId || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || '';
    // organizationCode and tenantCode from hook
    const organizationCode = tenantCode;

    const payload = {
      employeeID: data.employeeID,
      leaveCode: (data as any).leaveCode,
      balance: Number((data as any).balance ?? 0),
      remarks: data.remarks || undefined,
      tenantCode,
      workflowName: "leaveEncashment Application",
      uploadedBy,
      createdBy,
      createdOn,
      uploadTime,
      organizationCode,
      stateEvent:"NEXT",
      appliedDate,
      workflowState: "INITIATED",
    }

    const json = {
      tenant: tenantCode,
      action: "insert",
      id: null,
      event: "leaveEncashmentApplication",
      collectionName: "leaveEncashmentApplication",
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
                  <CardTitle className="text-base font-semibold text-gray-700">Encashment Application</CardTitle>
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
                <form id="encashmentForm" onSubmit={handleSubmit(submitForm)} className="space-y-6">
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
                              // Clear leaveCode and balance when employee changes
                              setValue('leaveCode', '')
                              setValue('balance', 0)
                            }}
                            onClear={() => {
                              setSelectedEmployeeLocal(null)
                              setValue('employeeID', '', { shouldValidate: true })
                              // Clear leaveCode and balance when employee is cleared
                              setValue('leaveCode', '')
                              setValue('balance', 0)
                              setLeaveBalances([])
                              setLeaveCodeOptions([])
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

                    {/* Encashment Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Leave Code <span className="text-red-500 normal-case">*</span></Label>
                        <select
                          {...register("leaveCode") as any}
                          disabled={!employeeID || isLoadingLeaveBalances}
                          className={`${errors.leaveCode ? fieldErrorStyles : fieldStyles} ${!employeeID || isLoadingLeaveBalances ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                          <option value="">{isLoadingLeaveBalances ? 'Loading...' : employeeID ? 'Select Leave Code' : 'Select Employee First'}</option>
                          {leaveCodeOptions.map((option) => (
                            <option key={option.leaveCode} value={option.leaveCode}>
                              {option.leaveCode} - {option.leaveTitle}
                            </option>
                          ))}
                        </select>
                        <ErrorMessage error={errors.leaveCode?.message as any} />
                      </div>
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Balance <span className="text-red-500 normal-case">*</span></Label>
                        <input 
                          type="number" 
                          min={0} 
                          max={maxBalance}
                          step={1} 
                          {...register("balance", {
                            validate: (value) => {
                              if (maxBalance !== undefined && Number(value) > maxBalance) {
                                return `Balance must be less than or equal to ${maxBalance}`
                              }
                              return true
                            }
                          }) as any} 
                          disabled={!leaveCodeWatch}
                          className={`${errors.balance ? fieldErrorStyles : fieldStyles} ${!leaveCodeWatch ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          placeholder={leaveCodeWatch ? maxBalance !== undefined ? `Max: ${maxBalance}` : "Enter balance" : "Select Leave Code First"}
                        />
                        <ErrorMessage error={errors.balance?.message as any} />
                        {maxBalance !== undefined && leaveCodeWatch && (
                          <span className="text-xs text-gray-500">Maximum balance available: {maxBalance}</span>
                        )}
                      </div>
                    </div>
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

      {/* Success popup - shown even when form is closed */}
      <SuccessPopup
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false)
          setPendingSubmitData(null)
        }}
        title="Application Submitted"
        message="Your encashment request has been submitted successfully."
      />
    </>
  )
}
