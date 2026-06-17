"use client"

import { useState, useMemo, useEffect } from "react"
import { X, Trash2, Search as SearchIcon, Filter } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/multiple-employee-search"

interface SelectedEmployee {
  _id: string
  employeeID: string
  firstName: string
  middleName?: string
  lastName?: string
}

interface AddEmployeeIndividualProps {
  isOpen: boolean
  onEmployeeSelect: (emp: EmpType) => void
  onMultiSelect: (employees: EmpType[]) => void
  onRemoveEmployee: (employeeID: string) => void
  onClear: () => void
  selectedEmployees: SelectedEmployee[]
  errorText?: string
}

export default function AddEmployeeIndividual({
  isOpen,
  onEmployeeSelect,
  onMultiSelect,
  onRemoveEmployee,
  onClear,
  selectedEmployees,
  errorText,
}: AddEmployeeIndividualProps) {
  const [page, setPage] = useState(1)
  const [employeeIDFilter, setEmployeeIDFilter] = useState("")
  const pageSize = 5

  if (!isOpen) return null

  // Filter employees by employeeID
  const filteredEmployees = useMemo(() => {
    if (!employeeIDFilter.trim()) {
      return selectedEmployees
    }
    const searchTerm = employeeIDFilter.toLowerCase().trim()
    return selectedEmployees.filter(emp => 
      emp.employeeID.toLowerCase().includes(searchTerm)
    )
  }, [selectedEmployees, employeeIDFilter])

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [employeeIDFilter])

  const displayedEmployees = filteredEmployees
  const paginatedEmployees = displayedEmployees.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-4">
      {/* Employee Search Field */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="mb-3">
          <Label className="text-sm font-medium text-gray-900">
            Add Employee
          </Label>
          <p className="text-xs text-gray-500 mt-0.5">Type at least 2 characters to search and select employees</p>
        </div>
        <EmployeeSearchField
          label=""
          required={false}
          isOpen={isOpen}
          multiSelect={true}
          errorText={errorText}
          onSelect={onEmployeeSelect}
          onMultiSelect={onMultiSelect}
          onClear={onClear}
        />
      </div>

      {/* Employee ID Filter */}
      <div className="flex bg-muted/50 rounded-lg border">
        {/* Field Selection */}
        <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
          <Filter className="w-4 h-4 text-muted-foreground mr-2" />
          <span className="text-sm font-medium text-foreground">Employee ID</span>
        </div>

        {/* Search Field */}
        <div className="flex-1 flex items-center bg-background rounded-r-lg">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Employee ID..."
              value={employeeIDFilter}
              onChange={(e) => {
                setEmployeeIDFilter(e.target.value)
                setPage(1)
              }}
              className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Selected Employees Table */}
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
                        onClick={() => onRemoveEmployee(emp.employeeID)}
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
                  No employees selected. Search and select employees above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* Pagination */}
        {displayedEmployees.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
            <p className="text-[11px] text-gray-500">
              Showing{' '}
              <span className="font-semibold">
                {Math.min((page - 1) * pageSize + 1, displayedEmployees.length)}-
                {Math.min(page * pageSize, displayedEmployees.length)}
              </span>{' '}
              of <span className="font-semibold">{displayedEmployees.length}</span>
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
                disabled={page * pageSize >= displayedEmployees.length}
                onClick={() =>
                  setPage((p) =>
                    p * pageSize >= displayedEmployees.length ? p : p + 1
                  )
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {errorText && (
        <p className="text-sm text-red-600 mt-2">{errorText}</p>
      )}
    </div>
  )
}

