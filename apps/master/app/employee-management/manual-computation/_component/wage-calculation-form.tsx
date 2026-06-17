"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { X } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { type Employee as EmpType } from "@/components/fields/employee-search"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import WageCalculationPeriodForm from "./wage-calculation-period-form"
import RemarksForm from "./remarks-form"
import AddEmployeeByRole from "./add-employee-by-role"
import AddEmployeeIndividual from "./add-employee-individual"

interface WageCalculationFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<boolean>
  initialValues?: any
}

interface SelectedEmployee {
  _id: string
  employeeID: string
  firstName: string
  middleName?: string
  lastName?: string
}

export default function WageCalculationForm({ isOpen, onClose, onSubmit, initialValues }: WageCalculationFormProps) {
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const [formData, setFormData] = useState({
    month: "",
    year: "",
    remarks: "",
    employeeIDList: [] as string[],
  })

  const [selectedEmployees, setSelectedEmployees] = useState<SelectedEmployee[]>([])
  const [currentEmployeeSearch, setCurrentEmployeeSearch] = useState("")
  const [showAddEmployeeField, setShowAddEmployeeField] = useState(true)
  const [showRoleFilter, setShowRoleFilter] = useState(false)
  const [isSelectAllByRole, setIsSelectAllByRole] = useState(false)
  const [roleFilter, setRoleFilter] = useState<{
    subsidiary: { subsidiaryCode: string | null; subsidiaryName: string | null }
    division: { divisionCode: string | null; divisionName: string | null }
    department: { departmentCode: string | null; departmentName: string | null }
    subDepartment: { subDepartmentCode: string | null; subDepartmentName: string | null }
    section: { sectionCode: string | null; sectionName: string | null }
    locations: string[]
    selectAll: boolean
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    month?: string
    year?: string
    employeeIDList?: string
    remarks?: string
  }>({})
  const postSuccessRef = useRef<boolean>(false)

  // Helper function to get current time in IST format (YYYY-MM-DDTHH:mm:ss.sss+05:30)
  // This function is called dynamically each time to get the current time (not static)
  const getCurrentTimeIST = (): string => {
    // Always get fresh current time - creates new Date object each time function is called
    const now = new Date()
    
    // Get IST time using toLocaleString with Asia/Kolkata timezone
    const istString = now.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    
    // Parse the IST string (format: "MM/DD/YYYY, HH:mm:ss")
    const [datePart, timePart] = istString.split(", ")
    const [month, day, year] = datePart.split("/")
    const [hours, minutes, seconds] = timePart.split(":")
    
    // Get milliseconds from current time
    const pad3 = (n: number) => {
      const str = String(n)
      return str.length === 1 ? `00${str}` : str.length === 2 ? `0${str}` : str
    }
    const ms = pad3(now.getMilliseconds())
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}+05:30`
  }

  // Initialize form with current date values
  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
      const currentYear = String(now.getFullYear())

      setFormData({
        month: initialValues?.month || currentMonth,
        year: initialValues?.year || currentYear,
        remarks: initialValues?.remarks || "",
        employeeIDList: initialValues?.employeeIDList || [],
      })

      // If initialValues has employeeIDList, we might need to fetch employee details
      // For now, just set the IDs
      if (initialValues?.employeeIDList && Array.isArray(initialValues.employeeIDList)) {
        setSelectedEmployees([]) // Will be populated when employees are selected
      } else {
        setSelectedEmployees([])
      }
      setCurrentEmployeeSearch("")
      setShowAddEmployeeField(true)
      setFormErrors({})
      setShowRoleFilter(false)
      setIsSelectAllByRole(false)
      setRoleFilter(null)
    }
  }, [isOpen, initialValues])


  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear field error on change
    setFormErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleEmployeeSelect = (emp: EmpType) => {
    // Check if employee is already selected
    if (selectedEmployees.some(e => e.employeeID === emp.employeeID)) {
      // Employee already selected, clear search
      setCurrentEmployeeSearch("")
      return
    }

    const newEmployee: SelectedEmployee = {
      _id: emp._id,
      employeeID: emp.employeeID,
      firstName: emp.firstName,
      middleName: emp.middleName,
      lastName: emp.lastName,
    }

    // Add new employee at the top of the list
    setSelectedEmployees(prev => [newEmployee, ...prev])
    setFormData(prev => ({
      ...prev,
      employeeIDList: [emp.employeeID, ...prev.employeeIDList]
    }))
    setCurrentEmployeeSearch("")
    setShowAddEmployeeField(false) // Hide the add employee field after selection
  }

  const handleRemoveEmployee = (employeeID: string) => {
    setSelectedEmployees(prev => prev.filter(e => e.employeeID !== employeeID))
    setFormData(prev => ({
      ...prev,
      employeeIDList: prev.employeeIDList.filter(id => id !== employeeID)
    }))
  }

  const {
    post: postWageApplication,
  } = usePostRequest<any>({
    url: "manualComputation",
    onSuccess: (data) => {
      postSuccessRef.current = true
    },
    onError: (error) => {
      console.error("POST error:", error)
      postSuccessRef.current = false
    },
  })

  const submitForm = async () => {
    // Validation
    const errors: typeof formErrors = {}
    if (!formData.month) errors.month = 'Month is required'
    if (!formData.year) errors.year = 'Year is required'

    // Employee validation:
    // - If Select All by Role is active, employeeIDList must be [] (handled by child),
    //   and it's still considered valid even though the list is empty.
    // - If Select All is NOT active, we require at least one employee ID.
    if (!isSelectAllByRole && formData.employeeIDList.length === 0) {
      errors.employeeIDList = 'At least one employee is required'
    }

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)

    // Get current time in IST format
    const createdOn = getCurrentTimeIST()
    // Get uploadedBy from logged-in employee ID
    const uploadedBy = employeeId || ""
    // Get current date in YYYY-MM-DD format for appliedDate
    const now = new Date()
    const appliedDate = now.toISOString().split('T')[0] // YYYY-MM-DD format

    // Default role filter JSON when no role-based selection is used
    const defaultRoleFilter = {
      subsidiary: {
        subsidiaryCode: null as string | null,
        subsidiaryName: null as string | null,
      },
      division: {
        divisionCode: null as string | null,
        divisionName: null as string | null,
      },
      department: {
        departmentCode: null as string | null,
        departmentName: null as string | null,
      },
      subDepartment: {
        subDepartmentCode: null as string | null,
        subDepartmentName: null as string | null,
      },
      section: {
        sectionCode: null as string | null,
        sectionName: null as string | null,
      },
      locations: [] as string[],
      selectAll: false,
    }

    const effectiveRoleFilter = roleFilter || defaultRoleFilter

    const data = {
      tenant: tenantCode,
      action: "insert",
      id: null,
      event: "application",
      collectionName: "manualComputation",
      data: {
        employeeIDList: formData.employeeIDList,
        month: parseInt(formData.month),
        year: parseInt(formData.year),
        appliedDate: appliedDate,
        remarks: formData.remarks,
        tenantCode: tenantCode,
        organizationCode: tenantCode,
        workflowName: "manualComputation",
        workflowState: "INITIATED",
        stateEvent: "NEXT",
        uploadedBy: uploadedBy,
        createdOn: createdOn,
        // Hierarchy-based filters JSON (subsidiary / division / department / subDepartment / section / locations / selectAll)
        subsidiary: effectiveRoleFilter.subsidiary,
        division: effectiveRoleFilter.division,
        department: effectiveRoleFilter.department,
        subDepartment: effectiveRoleFilter.subDepartment,
        section: effectiveRoleFilter.section,
        locations: effectiveRoleFilter.locations,
        selectAll: effectiveRoleFilter.selectAll,
      }
    }

    try {
      // Reset success flag
      postSuccessRef.current = false
      // Await the POST request to complete
      await postWageApplication(data)
      
      // Check if POST was successful
      if (!postSuccessRef.current) {
        console.error('Error submitting form: POST request failed')
        setLoading(false)
        return
      }

      // Only call onSubmit if POST was successful
      const success = await onSubmit(data.data)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
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


  // Input styles aligned with add-new-punch-form.tsx
  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition rounded-md border bg-white w-full"



  if (!isOpen) return null
 
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Right-side slide-over panel */}
      <div className="w-full max-w-4xl h-full ml-auto bg-transparent flex flex-col">
        <Card className="w-full h-full max-h-screen flex flex-col overflow-hidden rounded-none shadow-2xl">
          <CardHeader className="px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">Manual Computation Applications</CardTitle>
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
            <form onSubmit={(e) => { e.preventDefault(); void submitForm(); }} className="space-y-6">
              {/* Wage Calculation Period Sub-Form */}
              <WageCalculationPeriodForm
                month={formData.month}
                year={formData.year}
                onMonthChange={(value) => handleInputChange('month', value)}
                onYearChange={(value) => handleInputChange('year', value)}
                errors={{
                  month: formErrors.month,
                  year: formErrors.year
                }}
              />

              {/* Employee Selection Section */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Employees <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-sm text-gray-500">Add employees individually or by role-based filters</p>
                  </div>
                  
                  {/* Action Buttons Row - Right side of heading */}
                  <div className="flex items-center gap-3">
                    {/* Add Employee Button */}
                    <Button
                      type="button"
                      onClick={() => {
                        if (showAddEmployeeField) {
                          setShowAddEmployeeField(false)
                        } else {
                          setShowAddEmployeeField(true)
                          setShowRoleFilter(false)
                          // Clear selected employees when switching to Add Employee mode
                          setSelectedEmployees([])
                          setFormData(prev => ({
                            ...prev,
                            employeeIDList: []
                          }))
                        }
                      }}
                      className={`h-9 px-4 whitespace-nowrap rounded-md font-medium transition-colors ${
                        showAddEmployeeField
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-white border border-blue-600 text-blue-700 hover:bg-blue-50'
                      }`}
                    >
                      Add Employee
                    </Button>

                    {/* Add By Role Button (Hierarchy filters) */}
                    <Button
                      type="button"
                      onClick={() => {
                        if (showRoleFilter) {
                          setShowRoleFilter(false)
                        } else {
                          setShowRoleFilter(true)
                          setShowAddEmployeeField(false)
                          // Clear selected employees when switching to Add by Role mode
                          setSelectedEmployees([])
                          setFormData(prev => ({
                            ...prev,
                            employeeIDList: []
                          }))
                        }
                      }}
                      className={`h-9 px-4 whitespace-nowrap rounded-md font-medium transition-colors ${
                        showRoleFilter
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-white border border-blue-600 text-blue-700 hover:bg-blue-50'
                      }`}
                    >
                      Add by Role
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">

                  {/* Add Employee Individual Component */}
                  {showAddEmployeeField && (
                    <AddEmployeeIndividual
                      isOpen={isOpen && showAddEmployeeField}
                      onEmployeeSelect={handleEmployeeSelect}
                      onMultiSelect={(employees) => {
                        // Get current employee IDs
                        const currentIDs = new Set(selectedEmployees.map(e => e.employeeID))
                        const newIDs = new Set(employees.map(e => e.employeeID))
                        
                        // Find employees to add (in new list but not in current)
                        const toAdd = employees.filter(emp => !currentIDs.has(emp.employeeID))
                        
                        // Find employees to remove (in current but not in new)
                        const toRemove = selectedEmployees.filter(emp => !newIDs.has(emp.employeeID))
                        
                        // Add new employees
                        toAdd.forEach(emp => {
                          // Check if already exists to prevent duplicates
                          if (!selectedEmployees.some(e => e.employeeID === emp.employeeID)) {
                            const newEmployee: SelectedEmployee = {
                              _id: emp._id,
                              employeeID: emp.employeeID,
                              firstName: emp.firstName,
                              middleName: emp.middleName,
                              lastName: emp.lastName,
                            }
                            setSelectedEmployees(prev => [newEmployee, ...prev])
                            setFormData(prev => ({
                              ...prev,
                              employeeIDList: [emp.employeeID, ...prev.employeeIDList]
                            }))
                          }
                        })
                        
                        // Remove unselected employees
                        toRemove.forEach(emp => {
                          handleRemoveEmployee(emp.employeeID)
                        })
                      }}
                      onRemoveEmployee={handleRemoveEmployee}
                      onClear={() => {
                        setCurrentEmployeeSearch("")
                      }}
                      selectedEmployees={selectedEmployees}
                      errorText={formErrors.employeeIDList}
                    />
                  )}

                  {/* Role-based filters: Designation (single), Grades & employeeCategory (multi) */}
                  {showRoleFilter && (
                    <AddEmployeeByRole
                      isOpen={isOpen && showRoleFilter}
                      tenantCode={tenantCode}
                      onEmployeeSelect={handleEmployeeSelect}
                      onMultiSelect={(employees) => {
                        // When employees array is empty, it means Select All is active
                        // In that case, set employeeIDList to empty array
                        if (employees.length === 0) {
                          setSelectedEmployees([])
                          setFormData(prev => ({
                            ...prev,
                            employeeIDList: []
                          }))
                          return
                        }
                        
                        // Get current employee IDs
                        const currentIDs = new Set(selectedEmployees.map(e => e.employeeID))
                        const newIDs = new Set(employees.map(e => e.employeeID))
                        
                        // Find employees to add (in new list but not in current)
                        const toAdd = employees.filter(emp => !currentIDs.has(emp.employeeID))
                        
                        // Find employees to remove (in current but not in new)
                        const toRemove = selectedEmployees.filter(emp => !newIDs.has(emp.employeeID))
                        
                        // Add new employees
                        toAdd.forEach(emp => {
                          // Check if already exists to prevent duplicates
                          if (!selectedEmployees.some(e => e.employeeID === emp.employeeID)) {
                            const newEmployee: SelectedEmployee = {
                              _id: emp._id,
                              employeeID: emp.employeeID,
                              firstName: emp.firstName,
                              middleName: emp.middleName,
                              lastName: emp.lastName,
                            }
                            setSelectedEmployees(prev => [newEmployee, ...prev])
                            setFormData(prev => ({
                              ...prev,
                              employeeIDList: [emp.employeeID, ...prev.employeeIDList]
                            }))
                          }
                        })
                        
                        // Remove unselected employees
                        toRemove.forEach(emp => {
                          handleRemoveEmployee(emp.employeeID)
                        })
                      }}
                      // Track Select All state in parent for validation
                      onSelectAllChange={(active: boolean) => {
                        setIsSelectAllByRole(active)
                        // When Select All becomes active, ensure employeeIDList is []
                        if (active) {
                          setFormData(prev => ({
                            ...prev,
                            employeeIDList: [],
                          }))
                          setSelectedEmployees([])
                        }
                      }}
                      // Capture hierarchy filter JSON / selectAll
                      onRoleFilterChange={(filter) => {
                        setRoleFilter(filter)
                      }}
                      onClear={() => {
                        setCurrentEmployeeSearch("")
                      }}
                      selectedEmployees={selectedEmployees}
                      errorText={formErrors.employeeIDList}
                    />
                  )}
                  
                  {!showAddEmployeeField && !showRoleFilter && (
                    <div className="border rounded-lg bg-gray-50/40 p-8 text-center">
                      <p className="text-sm text-gray-500">
                        Click "Add Employee" to select employees individually, or "Add by Role" to filter by subsidiary, division, department, sub department, section, and locations.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks Sub-Form */}
              <RemarksForm
                remarks={formData.remarks}
                onRemarksChange={(value) => handleInputChange('remarks', value)}
                error={formErrors.remarks}
              />

            </form>
          </CardContent>

          {/* Footer */}
          <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel="Submit Application"
              onPrimary={submitForm}
              primaryLoading={loading}
              className="w-full"
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
