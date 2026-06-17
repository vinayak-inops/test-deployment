"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { X, Calendar, User, AlertCircle, Search, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ActionButtons from "@/components/common/action-buttons"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"
import { useRouter } from "next/navigation"
import { fetchDynamicQuery } from '@repo/ui/hooks/api/dynamic-graphql'
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"

// Types
export interface AttendanceRequest {
  name: string
  employeeId: string
}

// Interface for employee data from GraphQL
interface Employee {
  _id: string
  organizationCode: string
  contractorCode: string
  tenantCode: string
  employeeID: string
  firstName: string
  middleName?: string
  lastName: string
}

// Validation Schema
const validationSchema = yup.object({
  name: yup.string().required("Name is required"),
  employeeId: yup.string().when([], {
    is: () => false,
    then: (schema) => schema,
    otherwise: (schema) => schema,
  }),
})

type FormData = yup.InferType<typeof validationSchema>

// Props interface
interface AttendancePopupProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AttendanceRequest) => void
  preSelectedEmployeeId?: string
}

// Main Component
export default function AttendancePopup({ isOpen, onClose, onSubmit, preSelectedEmployeeId }: AttendancePopupProps) {
  const router = useRouter()
  // Permissions for raw punch module
  const { responseData: permissions } = useRolePermissions({ serviceName: "muster", screenName: "musterPunch" })
  // Read employeeId from cookie for self access
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
  const cookieEmployeeId = (() => {
    try {
      const raw = getCookie('keyclockroleinfo');
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return parsed?.employeeId || parsed?.employeeID || "";
    } catch {
      return "";
    }
  })();
  const [showEmployerFilter, setShowEmployerFilter] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [filterErrors, setFilterErrors] = useState<{employeeId?: string, fromDate?: string, toDate?: string}>({})
  
  // Employee search states (from MusterSearchPopup)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const tenantCode = useGetTenantCode()
  
  // Determine search capability based on permissions
  const canSearch = !!(permissions?.all);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    clearErrors,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: "",
      employeeId: "",
    },
    mode: "onChange",
  })

  // Fetch employees using GraphQL (from MusterSearchPopup)
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const employeeFields = {
        fields: [
        '_id',
        'employeeID',
        'firstName',
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
        setEmployees(fetchedEmployees)
        setSearchResults(fetchedEmployees)
      } else {
        console.error("No employee data found in response:", result)
        setError("No employee data found")
      }
    } catch (err) {
      setError("Failed to fetch employees")
    } finally {
      setLoading(false)
    }
  }

  // Fetch employees when component mounts or popup opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees()
    }
  }, [isOpen])

  // Handle search functionality (from MusterSearchPopup)
  useEffect(() => {
    if (search.trim() === "") {
      setSearchResults(employees)
    } else {
      setSearchResults(
        employees.filter((emp) => {
          const fullName = `${emp.firstName} ${emp.middleName || ''} ${emp.lastName}`.toLowerCase()
          const employeeId = emp.employeeID.toLowerCase()
          const searchTerm = search.toLowerCase()
          
          return fullName.includes(searchTerm) || employeeId.includes(searchTerm)
        })
      )
    }
  }, [search, employees])

  // Handle employee selection from dropdown
  const handleEmployeeSelection = (employee: Employee) => {
    setSelectedEmployee(employee)
    setSelectedEmployeeId(employee.employeeID)
    const fullName = [employee.firstName, employee.middleName, employee.lastName]
      .filter(Boolean)
      .join(' ')
    setSearch(fullName)
    setSearchResults([]) // Hide dropdown after selection
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    
    // Clear selection if user starts typing something different
    if (selectedEmployee) {
      const currentDisplayName = [selectedEmployee.firstName, selectedEmployee.middleName, selectedEmployee.lastName]
        .filter(Boolean)
        .join(' ')
      if (!value.includes(selectedEmployee.employeeID) && !currentDisplayName.toLowerCase().includes(value.toLowerCase())) {
        setSelectedEmployee(null)
        setSelectedEmployeeId("")
      }
    }
  }

  // Clear search and selection
  const clearSearch = () => {
    setSearch("")
    setSelectedEmployee(null)
    setSelectedEmployeeId("")
    setSearchResults(employees)
  }

  // Field styles
  const fieldStyles =
    "w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"
  const fieldErrorStyles =
    "w-full h-10 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:shadow-lg shadow-sm transition hover:border-red-400"

  // Reset form when popup opens
  useEffect(() => {
    if (isOpen) {
      reset()
      clearErrors()
      if (preSelectedEmployeeId) {
        setSelectedEmployeeId(preSelectedEmployeeId)
        // Find the employee object for pre-selected ID
        const preSelectedEmp = employees.find(emp => emp.employeeID === preSelectedEmployeeId)
        if (preSelectedEmp) {
          setSelectedEmployee(preSelectedEmp)
          const fullName = [preSelectedEmp.firstName, preSelectedEmp.middleName, preSelectedEmp.lastName]
            .filter(Boolean)
            .join(' ')
          setSearch(fullName)
        } else {
          setSearch(preSelectedEmployeeId)
        }
      } else if (!canSearch) {
        // Self-only access: lock to cookie employeeId
        setSelectedEmployeeId(cookieEmployeeId)
        setSearch(cookieEmployeeId)
      } else {
        setSearch("")
        setSelectedEmployee(null)
      }
      setSearchResults(employees)
    }
  }, [isOpen, reset, clearErrors, employees, preSelectedEmployeeId, canSearch, cookieEmployeeId])

  // Handle form submission
  const onFormSubmit = (data: FormData) => {
    setShowEmployerFilter(true)
  }

  // Handle Employer Filter Submit
  const handleEmployerFilterSubmit = () => {
    const errors: {employeeId?: string, fromDate?: string, toDate?: string} = {}
    if (!selectedEmployeeId) {
      errors.employeeId = "Employee ID is required"
    }
    if (!fromDate) {
      errors.fromDate = "From date is required"
    }
    if (!toDate) {
      errors.toDate = "To date is required"
    } else if (fromDate && new Date(toDate) < new Date(fromDate)) {
      errors.toDate = "To date must be after from date"
    }
    setFilterErrors(errors)
    if (Object.keys(errors).length === 0) {
      // No errors, proceed with submission logic
      router.push(
        `/punch/individual-punch/table/information?employeeId=${selectedEmployeeId}&fromdate=${fromDate}&todate=${toDate}`
      );
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-lg">
        {/* Header */}
        <CardHeader className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">View Attendance</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onClose(); }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>

        {/* Form Content */}
        <CardContent className="px-6 py-4 space-y-5">
          {/* Info Section using shadcn Alert */}
          <Alert className="border-0 p-0 text-xs text-gray-600 [&>svg]:text-gray-500 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:left-0 [&>svg]:top-0.5 [&>svg~*]:pl-5">
            <Info />
            <AlertDescription className="m-0">
              Select an employee and date range to view their attendance records and punch history.
            </AlertDescription>
          </Alert>

          {/* Employee Field (shared component) */}
          {canSearch ? (
            <EmployeeSearchField
              isOpen={isOpen}
              preSelectedEmployeeId={preSelectedEmployeeId}
              errorText={filterErrors.employeeId}
              onSelect={(emp: EmpType) => {
                setSelectedEmployee(emp)
                setSelectedEmployeeId(emp.employeeID)
                setSearch(`${emp.firstName} ${emp.middleName||''} ${emp.lastName||''}`.trim())
              }}
              onClear={() => {
                setSelectedEmployee(null)
                setSelectedEmployeeId("")
                setSearch("")
              }}
            />
          ) : (
            <div className="space-y-1.5">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Employee
              </Label>
              <Input
                value={selectedEmployeeId || cookieEmployeeId}
                readOnly
                className="h-9 border-gray-300 px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-600 w-full cursor-not-allowed"
              />
            </div>
          )}

          {/* Date Range Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                From Date <span className="text-red-500 normal-case">*</span>
              </Label>
              <Input
                type="date"
                className="h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
              />
              {filterErrors.fromDate && (
                <div className="flex items-center gap-1 text-red-500 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {filterErrors.fromDate}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                To Date <span className="text-red-500 normal-case">*</span>
              </Label>
              <Input
                type="date"
                className="h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
              />
              {filterErrors.toDate && (
                <div className="flex items-center gap-1 text-red-500 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {filterErrors.toDate}
                </div>
              )}
            </div>
          </div>

          {/* Removed date range info line to simplify UI */}

        </CardContent>

        {/* Footer */}
        <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
          <ActionButtons
            layout="end"
            secondaryLabel="Cancel"
            onSecondary={() => { onClose(); }}
            primaryLabel="View"
            onPrimary={handleEmployerFilterSubmit}
            primaryVariant="default"
            secondaryVariant="secondary"
            primaryLoading={isSubmitting}
            className="w-full"
            primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
            secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
          />
        </CardFooter>
      </Card>
    </div>
  )
}