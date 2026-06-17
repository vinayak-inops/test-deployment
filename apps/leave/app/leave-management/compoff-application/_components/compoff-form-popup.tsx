"use client"

import React from "react"
import { useEffect, useRef, useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import { X, AlertCircle, Plus, Trash2, Search, ChevronsUpDown, Check, Calendar, Clock } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import toast from "react-hot-toast"
import { SuccessPopup } from "./success-popup"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useSession } from "next-auth/react"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ActionButtons from "@/components/fields/action-buttons"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useKeyclockRoleInfo } from '../../../../hooks/search/keyclock-role-info'
import { Button } from "@/components/ui/button"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { Badge } from "@/components/ui/badge"

interface CompOffFormValues {
  employeeID: string
  fromDate: string
  toDate: string
  fromDuration: "Full-Day" | "First-Half" | "Second-Half"
  toDuration: "Full-Day" | "First-Half" | "Second-Half"
  availForDates: string[]
  remarks?: string
}

interface CompOffTransaction {
  _id: string
  date: string
  employeeID: string
  availed: boolean
  availedOn: string
  calculatedCompOff: number
  expireOn: string
  organizationCode: string
  tenantCode: string
  availedCompOff: number
}

const getRemainingCompOff = (tx: Partial<CompOffTransaction>) => {
  const total = Number(tx.calculatedCompOff ?? 0)
  const availed = Number(tx.availedCompOff ?? 0)
  return Math.max(total - availed, 0)
}

const validationSchema = yup.object({
  employeeID: yup.string().required("Employee ID is required"),
  fromDate: yup.string().required("From date is required"),
  toDate: yup.string().required("To date is required"),
  fromDuration: yup.string().oneOf(["Full-Day", "First-Half", "Second-Half"]).required("From duration is required"),
  toDuration: yup.string().oneOf(["Full-Day", "First-Half", "Second-Half"]).required("To duration is required"),
  availForDates: yup.array().of(yup.string().required()).min(1, "At least one available date is required").required("Available dates are required"),
  remarks: yup.string().transform((v) => (v === "" ? undefined : v)).notRequired().max(300),
})

interface CompOffApplicationFormProps {
  isOpen: boolean
  onClose: () => void
  initialValues?: Partial<CompOffFormValues>
  onSubmit?: (payload: any) => void
}

export default function CompoffFormPopup({ isOpen, onClose, initialValues, onSubmit }: CompOffApplicationFormProps) {
  const { data: session } = useSession()
  const endErrorRef = useRef<HTMLDivElement | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null)
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
  const [selectedItemsPopoverOpen, setSelectedItemsPopoverOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()

  // Role permissions for OT applications
  const { responseData: rolePermissions } = useRolePermissions({
          serviceName: 'applicationApplier',
          screenName: 'compOff'
      });

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

  function getTodayDateIST() {
    const now = new Date();
  
    // Convert to IST (UTC + 5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
  
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(istDate.getUTCDate()).padStart(2, "0");
  
    return `${year}-${month}-${day}`;
  }
  
  // Example usage
  const todayDate = getTodayDateIST();

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

  type Employee = { _id: string; employeeID: string; firstName: string; middleName?: string; lastName: string; isDeleted?: boolean }
  const [employees, setEmployees] = useState<Employee[]>([])
  const [searchText, setSearchText] = useState("")
  const [selectedEmployeeLocal, setSelectedEmployeeLocal] = useState<Employee | null>(null)
  const [compOffTransactions, setCompOffTransactions] = useState<CompOffTransaction[]>([])

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
  } = useForm<CompOffFormValues>({
    resolver: yupResolver(validationSchema as any),
    mode: "onChange",
    defaultValues: {
      employeeID: initialValues?.employeeID || "",
      fromDate: initialValues?.fromDate || "",
      toDate: initialValues?.toDate || "",
      fromDuration: initialValues?.fromDuration || "Full-Day",
      toDuration: initialValues?.toDuration || "Full-Day",
      availForDates: initialValues?.availForDates || [],
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
        toDate: initialValues?.toDate || "",
        fromDuration: initialValues?.fromDuration || "Full-Day",
        toDuration: initialValues?.toDuration || "Full-Day",
        availForDates: initialValues?.availForDates || [],
        remarks: initialValues?.remarks || "",
      })
      clearErrors()
      setSelectedEmployeeLocal(null)
      setSearchText('')
      setSearchQuery('')
    }
  }, [isOpen, initialValues, reset, clearErrors, canEditEmployeeId, storedRoleInfo])

  const employeeID = watch("employeeID")
  const availForDates = watch("availForDates") || []

  const { post: postCompOff, loading: postLoading } = usePostRequest<any>({
    url: "compOffApplication",
    onSuccess: (resp) => {
      onClose()
      setTimeout(() => {
        setPendingSubmitData(resp)
        setShowSuccess(true)
        if (onSubmit) {
          onSubmit(resp)
        }
      }, 100)
    },
    onError: (error) => {
      const message = (error as any)?.message || "Failed to submit comp off application"
      toast.error(message)
    },
  })

  // Fetch comp-off transactions
  const {
    loading: isLoadingTransactions,
    error: transactionsError,
    refetch: fetchCompOffTransactions
  } = useRequest<any>({
    url: `muster/compOffTransaction/search`,
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "employeeID",
        operator: "eq",
        value: employeeID
      },
      {
        field: "expireOn",
        operator: "gte",
        value: todayDate
      },
    ],
    onSuccess: (data) => {
      // Handle both array response and wrapped response
      const rawData = Array.isArray(data) ? data : (data?.data || [])
      
      if (Array.isArray(rawData) && rawData.length > 0) {
        const transactions = rawData
          .filter((tx: Partial<CompOffTransaction>) =>
            !!tx?._id &&
            !!tx?.date &&
            !!tx?.expireOn &&
            getRemainingCompOff(tx) > 0
          )
          .sort((a: CompOffTransaction, b: CompOffTransaction) => 
            new Date(a.expireOn).getTime() - new Date(b.expireOn).getTime()
          )
        setCompOffTransactions(transactions)
      } else {
        setCompOffTransactions([])
      }
    },
    onError: (error) => {
      console.error("Error fetching comp off data:", error);
      setCompOffTransactions([])
    },
  });


  useEffect(() => {
      if (employeeID) {
        fetchCompOffTransactions()
      } else {
        setCompOffTransactions([])
      }
  }, [employeeID])

  // Filter transactions based on search
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return compOffTransactions
    
    const query = searchQuery.toLowerCase()
    return compOffTransactions.filter(tx => 
      tx.date.toLowerCase().includes(query) ||
      tx.expireOn.toLowerCase().includes(query) ||
      tx.calculatedCompOff.toString().includes(query)
    )
  }, [compOffTransactions, searchQuery])

  const submitForm = (data: CompOffFormValues) => {
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
    
    const createdOn = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+05:30`;
    const uploadedBy = employeeId || storedRoleInfo?.employeeId;
    const createdBy = employeeId || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || '';
    const organizationCode = tenantCode;

    const payload = {
      employeeID: data.employeeID,
      fromDate: data.fromDate,
      toDate: data.toDate,
      fromDuration: data.fromDuration,
      toDuration: data.toDuration,
      availForDates: data.availForDates,
      remarks: data.remarks || undefined,
      tenantCode,
      workflowName: "compOff Application",
      uploadedBy,
      createdBy,
      createdOn,
      organizationCode,
      stateEvent: "NEXT",
      workflowState: "INITIATED",
    }

    const json = {
      tenant: tenantCode,
      action: "insert",
      id: null,
      event: "application",
      collectionName: "leaveApplication",
      data: payload,
    }

    postCompOff(json)
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

  // Add date from selection
  const addDate = (date: string) => {
    const currentDates = watch("availForDates") || []
    if (!currentDates.includes(date)) {
      setValue("availForDates", [...currentDates, date], { shouldValidate: true })
    }
  }

  // Remove date
  const removeDate = (dateToRemove: string) => {
    const currentDates = watch("availForDates") || []
    setValue("availForDates", currentDates.filter(d => d !== dateToRemove), { shouldValidate: true })
  }

  // Select all available dates
  const selectAllDates = () => {
    const allDates = compOffTransactions.map(tx => tx.date)
    setValue("availForDates", allDates, { shouldValidate: true })
  }

  // Clear all selected dates
  const clearAllDates = () => {
    setValue("availForDates", [], { shouldValidate: true })
  }

  // Get selected transactions
  const selectedTransactions = useMemo(() => {
    return compOffTransactions.filter(tx => availForDates.includes(tx.date))
  }, [compOffTransactions, availForDates])

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
                  <CardTitle className="text-base font-semibold text-gray-700">Comp Off Application</CardTitle>
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
                <form id="compOffForm" onSubmit={handleSubmit(submitForm)} className="space-y-6">
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

                    {/* Date Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">From Date <span className="text-red-500 normal-case">*</span></Label>
                        <input 
                          type="date" 
                          {...register("fromDate") as any}
                          className={errors.fromDate ? fieldErrorStyles : fieldStyles}
                        />
                        <ErrorMessage error={errors.fromDate?.message as any} />
                      </div>
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">To Date <span className="text-red-500 normal-case">*</span></Label>
                        <input 
                          type="date" 
                          {...register("toDate") as any}
                          className={errors.toDate ? fieldErrorStyles : fieldStyles}
                        />
                        <ErrorMessage error={errors.toDate?.message as any} />
                      </div>
                    </div>

                    {/* Duration Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">From Duration <span className="text-red-500 normal-case">*</span></Label>
                        <select
                          {...register("fromDuration") as any}
                          className={errors.fromDuration ? fieldErrorStyles : fieldStyles}
                        >
                          <option value="Full-Day">Full-Day</option>
                          <option value="First-Half">First Half</option>
                          <option value="Second-Half">Second Half</option>
                        </select>
                        <ErrorMessage error={errors.fromDuration?.message as any} />
                      </div>
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">To Duration <span className="text-red-500 normal-case">*</span></Label>
                        <select
                          {...register("toDuration") as any}
                          className={errors.toDuration ? fieldErrorStyles : fieldStyles}
                        >
                          <option value="Full-Day">Full-Day</option>
                          <option value="First-Half">First Half</option>
                          <option value="Second-Half">Second Half</option>
                        </select>
                        <ErrorMessage error={errors.toDuration?.message as any} />
                      </div>
                    </div>

                    {/* Available Dates - Searchable Select Field */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Available Dates <span className="text-red-500 normal-case">*</span>
                        {availForDates.length > 0 && (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            ({availForDates.length} selected)
                          </span>
                        )}
                      </Label>
                      
                      <div className="space-y-2">
                        <div className="relative">
                          <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                disabled={!employeeID || isLoadingTransactions}
                                className={`relative w-full h-10 border rounded-lg pl-10 pr-10 text-left transition-all ${
                                  !employeeID || isLoadingTransactions
                                    ? "bg-gray-50 cursor-not-allowed border-gray-200" 
                                    : "bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                }`}
                              >
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <span className="block truncate text-sm text-gray-500 pl-1">
                                  {!employeeID
                                    ? 'Select Employee ID first'
                                    : isLoadingTransactions
                                    ? 'Loading available comp-off days...'
                                    : 'Search available comp-off days'}
                                </span>
                                <ChevronsUpDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${isDatePopoverOpen ? 'rotate-180' : ''}`} />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl">
                              <Command shouldFilter={false} className="bg-white">
                                <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <CommandInput
                                      value={searchQuery}
                                      onValueChange={setSearchQuery}
                                      placeholder="Search by date or comp-off value..."
                                      className="pl-8 h-9"
                                    />
                                  </div>
                                </div>
                                <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                                  {filteredTransactions.length === 0 ? (
                                    <CommandEmpty>
                                      {isLoadingTransactions 
                                        ? 'Loading...' 
                                        : transactionsError 
                                          ? 'Error loading data' 
                                          : 'No available comp-off days found'}
                                    </CommandEmpty>
                                  ) : (
                                    <CommandGroup>
                                      {/* Select All Option */}
                                      {filteredTransactions.length > 0 && (
                                        <div className="flex items-center justify-between px-2 py-1.5 mt-2 mb-1 border border-dashed border-gray-200 rounded-md bg-gray-50">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const allDates = filteredTransactions.map(tx => tx.date)
                                              const currentSelections = availForDates
                                              const allSelected = allDates.every(date => currentSelections.includes(date))
                                              if (allSelected) {
                                                // Deselect all visible
                                                setValue("availForDates", 
                                                  currentSelections.filter(date => !allDates.includes(date)), 
                                                  { shouldValidate: true }
                                                )
                                              } else {
                                                // Select all visible (merge, avoid duplicates)
                                                setValue("availForDates", 
                                                  Array.from(new Set([...currentSelections, ...allDates])), 
                                                  { shouldValidate: true }
                                                )
                                              }
                                            }}
                                            className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                          >
                                            <Check
                                              className={`h-4 w-4 rounded-sm border ${
                                                filteredTransactions.length > 0 &&
                                                filteredTransactions.every(tx => availForDates.includes(tx.date))
                                                  ? 'opacity-100 text-green-600 border-green-500'
                                                  : 'opacity-70 text-transparent border-gray-300'
                                              }`}
                                            />
                                            <span>Select all ({filteredTransactions.length})</span>
                                          </button>
                                        </div>
                                      )}

                                      {filteredTransactions.map((tx) => {
                                        const isSelected = availForDates.includes(tx.date)
                                        const isExpiringSoon = new Date(tx.expireOn) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Within 7 days
                                        const isExpired = new Date(tx.expireOn) < new Date()
                                        const remainingCompOff = getRemainingCompOff(tx)

                                        return (
                                          <CommandItem
                                            key={tx._id}
                                            value={`${tx.date} - Remaining: ${remainingCompOff} - Expires: ${tx.expireOn} - Total: ${tx.calculatedCompOff}`}
                                            onSelect={() => {
                                              if (isSelected) {
                                                removeDate(tx.date)
                                              } else {
                                                addDate(tx.date)
                                              }
                                            }}
                                            className="cursor-pointer"
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 rounded-sm border ${
                                                isSelected
                                                  ? 'opacity-100 text-green-600 border-green-500'
                                                  : 'opacity-70 text-transparent border-gray-300'
                                              }`}
                                            />
                                            <div className="flex-1">
                                              <div className="font-medium text-sm flex items-center gap-2">
                                                <span>Date: {tx.date}</span>
                                                <Badge 
                                                  variant={isExpired ? "destructive" : isExpiringSoon ? "secondary" : "outline"}
                                                  className="text-xs"
                                                >
                                                  {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Valid'}
                                                </Badge>
                                              </div>
                                              <div className="flex flex-wrap gap-4 mt-1">
                                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                                  <Calendar className="h-3 w-3" />
                                                  <span>Availed On: {tx.availedOn || "-"}</span>
                                                </div>
                                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                                  <Calendar className="h-3 w-3" />
                                                  <span>Expires: {tx.expireOn}</span>
                                                </div>
                                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                                  <Clock className="h-3 w-3" />
                                                  <span>Remaining: {remainingCompOff}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </CommandItem>
                                        )
                                      })}
                                    </CommandGroup>
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          
                          {availForDates.length > 0 && (
                            <Popover 
                              open={selectedItemsPopoverOpen} 
                              onOpenChange={setSelectedItemsPopoverOpen}
                            >
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="absolute right-0 top-0 bottom-0 inline-flex items-center justify-center min-w-[40px] px-3 bg-blue-600 text-white text-xs font-medium rounded-r-lg shadow-sm hover:bg-blue-700 transition-colors z-10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedItemsPopoverOpen(!selectedItemsPopoverOpen)
                                  }}
                                >
                                  {availForDates.length}
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0 w-80 max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl" align="end">
                                <Command shouldFilter={false} className="bg-white">
                                  <div className="p-3 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-semibold text-gray-700">Selected Dates</h4>
                                      <span className="text-xs text-gray-500">{availForDates.length} selected</span>
                                    </div>
                                  </div>
                                  <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                                    {selectedTransactions.length === 0 ? (
                                      <CommandEmpty>No dates selected</CommandEmpty>
                                    ) : (
                                      <CommandGroup>
                                        {selectedTransactions.map((tx) => (
                                          <CommandItem
                                            key={tx._id}
                                            value={`${tx.date}`}
                                            className="flex items-center justify-between cursor-pointer"
                                          >
                                            <div className="flex items-center gap-2 flex-1">
                                              <Check className="h-4 w-4 text-green-600" />
                                              <div>
                                                <span className="truncate font-medium">Date: {tx.date}</span>
                                                <div className="text-xs text-gray-500">
                                                  Remaining: {getRemainingCompOff(tx)} • Expires: {tx.expireOn} • Total: {tx.calculatedCompOff}
                                                </div>
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                removeDate(tx.date)
                                              }}
                                              className="text-gray-400 hover:text-red-600 ml-2 p-1 rounded hover:bg-red-50 transition-colors"
                                            >
                                              <X className="h-4 w-4" />
                                            </button>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    )}
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        
                        

                        {/* Display selected dates */}
                        {availForDates.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {selectedTransactions.map((tx) => (
                              <div key={tx._id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                                <div>
                                  <span className="text-sm text-gray-700 font-medium">Date: {tx.date}</span>
                                  <div className="text-xs text-gray-500">
                                    Remaining: {getRemainingCompOff(tx)} • Expires: {tx.expireOn} • Total: {tx.calculatedCompOff}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeDate(tx.date)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <ErrorMessage error={errors.availForDates?.message as any} />
                      </div>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Remarks</Label>
                    <textarea
                      {...register("remarks") as any}
                      rows={3}
                      placeholder="Optional remarks"
                      className={`w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 ${errors.remarks ? "focus:ring-red-500 focus:border-red-500" : "focus:ring-gray-900 focus:border-gray-900"} shadow-sm resize-none transition`}
                    />
                    <ErrorMessage error={errors.remarks?.message} />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Optional; max 300 characters</span>
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

      <SuccessPopup
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false)
          setPendingSubmitData(null)
        }}
        title="Application Submitted"
        message="Your comp off request has been submitted successfully."
      />
    </>
  )
}
