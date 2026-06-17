"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { ArrowRight, Users, Filter, Search as SearchIcon, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"

interface SelectedEmployee {
  _id: string
  employeeID: string
  firstName: string
  middleName?: string
  lastName?: string
}

interface ContractEmployeeFilterProps {
  fromValue: any
  setFormValue: (value: any) => void
  setMessenger: (value: any) => void
  messenger: any
  subsidiaries?: string[]
  divisions?: string[]
  departments?: string[]
  locations?: string[]
  contractors?: string[]
}

export default function ContractEmployeeFilter({ 
  fromValue, 
  setFormValue, 
  setMessenger, 
  messenger,
  subsidiaries,
  divisions,
  departments,
  locations,
  contractors
}: ContractEmployeeFilterProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<SelectedEmployee[]>([])
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")
  const [selectedField, setSelectedField] = useState<'employeeID' | 'name'>('employeeID')
  const [page, setPage] = useState(1)
  const pageSize = 5
  const [showAddEmployeeField, setShowAddEmployeeField] = useState(false)

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [employeeSearchTerm, selectedEmployees.length])

  // Handle employee selection
  const handleEmployeeSelect = (emp: EmpType) => {
    // Check if employee is already selected
    if (selectedEmployees.some(e => e.employeeID === emp.employeeID)) {
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
    setShowAddEmployeeField(false) // Hide the add employee field after selection
  }

  // Handle employee removal
  const handleRemoveEmployee = (employeeID: string) => {
    setSelectedEmployees(prev => prev.filter(e => e.employeeID !== employeeID))
  }

  // Handle save and continue - KEEP EXISTING LOGIC
  const handleSaveAndContinue = () => {
    const employeeIDs = selectedEmployees.map(emp => emp.employeeID)
    setFormValue((prev: any) => ({
      ...prev,
      employeeID: employeeIDs,
      subsidiaries: ["unKnown"]
    }))
    setMessenger((prev: any) => ({
      ...prev,
      progressbar: "Basic Information",
    }))
  }

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    const query = employeeSearchTerm.toLowerCase().trim()
    if (!query) return selectedEmployees

    return selectedEmployees.filter((emp) => {
      if (selectedField === 'name') {
        const fullName = [
          emp.firstName,
          emp.middleName,
          emp.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return fullName.includes(query)
      }
      return emp.employeeID.toLowerCase().includes(query)
    })
  }, [selectedEmployees, employeeSearchTerm, selectedField])

  // Paginated employees
  const paginatedEmployees = useMemo(() => {
    return filteredEmployees.slice((page - 1) * pageSize, page * pageSize)
  }, [filteredEmployees, page, pageSize])

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      {/* <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Contract Employee Selection</h3>
        <p className="text-sm text-gray-500 mt-1">
          Select contract employees for report generation
        </p>
      </div> */}

      <div className="p-6 space-y-6">
        {/* Employee Selection Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="employeeSearch" className="text-sm font-medium text-gray-700">
              Select Contract Employees <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              {selectedEmployees.length} selected
            </div>
          </div>
          
          <div className="space-y-2.5">
            {/* Filter + Search + Add Button Row */}
            <div className="flex items-center gap-4">
              {/* Filter + Search Bar */}
              <div className="flex bg-muted/50 rounded-lg border flex-1">
                {/* Field Selection */}
                <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                  <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                  <Select
                    value={selectedField}
                    onValueChange={(val: 'employeeID' | 'name') => setSelectedField(val)}
                  >
                    <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employeeID" className="text-sm">
                        ID
                      </SelectItem>
                      <SelectItem value="name" className="text-sm">
                        Name
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Field */}
                <div className="flex-1 flex items-center bg-background rounded-r-lg">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={`Search by ${selectedField === 'employeeID' ? 'ID' : 'name'}...`}
                      value={employeeSearchTerm}
                      onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                      className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Add Button */}
              <Button
                type="button"
                onClick={() => setShowAddEmployeeField(!showAddEmployeeField)}
                className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
              >
                Add Employee
              </Button>
            </div>

            {/* Employee Search Field - Shown when Add button is clicked, above table */}
            {showAddEmployeeField && (
              <div className="flex justify-center">
                <div className="w-full max-w-[50%] space-y-1.5">
                  <Label className="block text-xs font-semibold text-gray-900 uppercase">
                    Add Employee
                  </Label>
                  <EmployeeSearchField
                    label=""
                    required={false}
                    isOpen={true}
                    subsidiaries={subsidiaries}
                    divisions={divisions}
                    departments={departments}
                    locations={locations}
                    contractors={contractors}
                    onSelect={handleEmployeeSelect}
                    // onMultiSelect={(employees: any[]) => {
                    //   // Get current employee IDs
                    //   const currentIDs = new Set(selectedEmployees.map(e => e.employeeID))
                    //   const newIDs = new Set(employees.map(e => e.employeeID))
                      
                    //   // Find employees to add (in new list but not in current)
                    //   const toAdd = employees.filter(emp => !currentIDs.has(emp.employeeID))
                      
                    //   // Find employees to remove (in current but not in new)
                    //   const toRemove = selectedEmployees.filter(emp => !newIDs.has(emp.employeeID))
                      
                    //   // Add new employees
                    //   toAdd.forEach(emp => {
                    //     // Check if already exists to prevent duplicates
                    //     if (!selectedEmployees.some(e => e.employeeID === emp.employeeID)) {
                    //       const newEmployee: SelectedEmployee = {
                    //         _id: emp._id,
                    //         employeeID: emp.employeeID,
                    //         firstName: emp.firstName,
                    //         middleName: emp.middleName,
                    //         lastName: emp.lastName,
                    //       }
                    //       setSelectedEmployees(prev => [newEmployee, ...prev])
                    //     }
                    //   })
                      
                    //   // Remove unselected employees
                    //   toRemove.forEach(emp => {
                    //     handleRemoveEmployee(emp.employeeID)
                    //   })
                    // }}
                    onClear={() => {
                      // Clear handled by component
                    }}
                  />
                  <p className="text-xs text-gray-500">Type at least 2 characters to search and select employees</p>
                </div>
              </div>
            )}

            {/* Table - Always Visible */}
            <div className="border rounded-lg bg-slate-50/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Employee ID
                    </TableHead>
                    <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Name
                    </TableHead>
                    <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.length > 0 ? (
                    paginatedEmployees.map((emp) => {
                      const fullName = [
                        emp.firstName,
                        emp.middleName,
                        emp.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ")
                      return (
                        <TableRow
                          key={emp.employeeID}
                          className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                        >
                          <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                            {emp.employeeID}
                          </TableCell>
                          <TableCell className="py-1.5 text-sm text-gray-900">
                            {fullName || '-'}
                          </TableCell>
                          <TableCell className="py-1.5 pr-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                              onClick={() => handleRemoveEmployee(emp.employeeID)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                        No employees selected. Click "Add Employee" to select employees.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {/* Pagination */}
              {filteredEmployees.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                  <p className="text-[11px] text-gray-500">
                    Showing{' '}
                    <span className="font-semibold">
                      {Math.min((page - 1) * pageSize + 1, filteredEmployees.length)}-
                      {Math.min(page * pageSize, filteredEmployees.length)}
                    </span>{' '}
                    of <span className="font-semibold">{filteredEmployees.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      disabled={page * pageSize >= filteredEmployees.length}
                      onClick={() =>
                        setPage((p) =>
                          p * pageSize >= filteredEmployees.length ? p : p + 1
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center pt-6 border-t border-gray-200">
          <Button
            onClick={handleSaveAndContinue}
            disabled={selectedEmployees.length === 0}
            className="px-8 py-2.5 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
