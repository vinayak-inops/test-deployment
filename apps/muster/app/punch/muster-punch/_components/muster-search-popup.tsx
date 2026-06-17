"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { Calendar, AlertCircle, Info, X } from "lucide-react"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import ActionButtons from "@/components/common/action-buttons"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"

const validationSchema = yup.object({
  employeeId: yup.string().required("Employee is required"),
  month: yup.string().required("Month is required"),
  year: yup.string().required("Year is required"),
})

type FormData = yup.InferType<typeof validationSchema>

interface MusterSearchPopupProps {
  isOpen: boolean
  onClose: () => void
  preSelectedEmployeeId?: string
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

export default function MusterSearchPopup({ isOpen, onClose, preSelectedEmployeeId }: MusterSearchPopupProps) {
  const router = useRouter()
  // Permissions for muster module
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
  const canSearch = !!(permissions?.all);
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | any>(null)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    clearErrors,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      employeeId: "",
      month: "",
      year: "",
    },
    mode: "onChange",
  })

  // Optionally fetch employees if needed for any local filtering (EmployeeSearchField already handles search)
  const fetchEmployees = async () => {
    setEmployees([])
    setSearchResults([])
  }

  // Fetch employees when component mounts or popup opens
  useEffect(() => {
    if (isOpen) {
      fetchEmployees()
    }
  }, [isOpen])

  // Handle search functionality
  useEffect(() => {
    if (search.trim() === "") {
      setSearchResults(employees)
    } else {
      setSearchResults(
        employees.filter((emp) => {
          const fullName = [emp.firstName, emp.middleName, emp.lastName]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
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
    setValue("employeeId", employee.employeeID)
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
        setValue("employeeId", "")
      }
    }
  }

  // Clear search and selection
  const clearSearch = () => {
    setSearch("")
    setSelectedEmployee(null)
    setValue("employeeId", "")
    setSearchResults(employees)
  }

  // Reset form when popup opens or preSelectedEmployeeId changes
  useEffect(() => {
    if (isOpen) {
      if (preSelectedEmployeeId) {
        // Pre-fill the employee ID and disable editing
        setValue("employeeId", preSelectedEmployeeId)
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
        setValue("employeeId", cookieEmployeeId)
        setSearch(cookieEmployeeId)
      } else {
        // Reset form for normal search
        reset({ employeeId: "", month: "", year: "" })
        setSearch("")
        setSelectedEmployee(null)
      }
      clearErrors()
      setSearchResults(employees)
    }
  }, [isOpen, reset, clearErrors, employees, preSelectedEmployeeId, setValue, canSearch, cookieEmployeeId])

  const onFormSubmit = (data: FormData) => {
    // Create query parameters from form data
    const queryParams = new URLSearchParams({
      employeeId: data.employeeId,
      month: data.month,
      year: data.year
    })
    
    router.push(`/punch/individual-punch/calendar/information?${queryParams.toString()}`)
    onClose()
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

  // Month and year options
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => `${currentYear - i}`)

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Escape key close behavior
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-lg">
        <CardHeader className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">Muster Search</CardTitle>
            <button
              onClick={() => { onClose();router.push('/punch'); }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              aria-label="Close popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-4 space-y-5">
          <Alert className="border-0 p-0 text-xs text-gray-600 [&>svg]:text-gray-500 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:left-0 [&>svg]:top-0.5 [&>svg~*]:pl-5">
            <Info />
            <AlertDescription className="m-0">
              Select an employee, month and year to view muster calendar.
            </AlertDescription>
          </Alert>

          {permissions && !(permissions.self || permissions.all) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs">
              You don’t have permission to view muster roll. Contact your administrator.
            </div>
          )}

          {canSearch ? (
            <EmployeeSearchField
              isOpen={isOpen}
              preSelectedEmployeeId={preSelectedEmployeeId}
              errorText={errors.employeeId?.message}
              onSelect={(emp: EmpType) => {
                setSelectedEmployee(emp)
                setValue("employeeId", emp.employeeID, { shouldValidate: true })
                setSearch([emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' '))
              }}
              onClear={() => {
                setSelectedEmployee(null)
                setValue("employeeId", "", { shouldValidate: true })
                setSearch("")
              }}
            />
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Employee
              </label>
              <input
                value={cookieEmployeeId}
                readOnly
                className="h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-600 w-full cursor-not-allowed"
              />
              <input type="hidden" {...register("employeeId")} value={cookieEmployeeId} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Month <span className="text-red-500 normal-case">*</span>
              </label>
              <select
                {...register("month")}
                className={`h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full ${errors.month ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""}`}
              >
                <option value="">Select month</option>
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <ErrorMessage error={errors.month?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Year <span className="text-red-500 normal-case">*</span>
              </label>
              <select
                {...register("year")}
                className={`h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full ${errors.year ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""}`}
              >
                <option value="">Select year</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ErrorMessage error={errors.year?.message} />
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-1 text-red-800 font-medium text-xs">
                <AlertCircle className="h-4 w-4" />
                Please fix the errors above
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
          <ActionButtons
            layout="end"
            secondaryLabel="Cancel"
            onSecondary={() => { onClose(); router.push('/punch'); }}
            primaryLabel="Submit"
            onPrimary={handleSubmit(onFormSubmit)}
            primaryVariant="default"
            secondaryVariant="secondary"
            primaryLoading={isSubmitting}
            className="w-full"
            primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
            secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
            primaryDisabled={!permissions || !(permissions.self || permissions.all)}
          />
        </CardFooter>
      </Card>
    </div>
  )
}