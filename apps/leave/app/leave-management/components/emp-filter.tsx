"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { X, User, AlertCircle, Search } from "lucide-react"
import { fetchDynamicQuery } from '@repo/ui/hooks/api/dynamic-graphql'
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

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

// Props interface
interface EmpFilterProps {
  isOpen: boolean
  onClose: () => void
  onEmployeeSelect: (employeeId: string) => void
  preSelectedEmployeeId?: string
}

// Main Component
export default function EmpFilter({ isOpen, onClose, onEmployeeSelect, preSelectedEmployeeId }: EmpFilterProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  
  // Employee search states
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const tenantCode = useGetTenantCode()

  // Fetch employees using GraphQL
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const employeeFields = {
        fields: [
          '_id',
          'organizationCode',
          'contractorCode',
          'tenantCode',
          'employeeID',
          'firstName',
          'aadharNumber',
          'UANNumber',
          'ESINumber',
          'PFNumber',
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
        const fetchedEmployees = result.data.filter((emp: any) => emp.isDeleted !== true)
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

  // Handle search functionality
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

  // Reset form when popup opens
  useEffect(() => {
    if (isOpen) {
      if (preSelectedEmployeeId) {
        setSelectedEmployeeId(preSelectedEmployeeId)
        setSearch("")
      } else {
        setSearch("")
        setSelectedEmployeeId("")
      }
      setSearchResults(employees)
    }
  }, [isOpen, employees, preSelectedEmployeeId])

  // Handle employee selection
  const handleEmployeeSelect = (emp: Employee) => {
    setSelectedEmployeeId(emp.employeeID)
    setSearch(`${emp.firstName} ${emp.middleName || ''} ${emp.lastName}`.trim())
    onEmployeeSelect(emp.employeeID)
    // Do not call onClose() here; parent will close without redirect
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

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Employee
            </h2>
            <p className="text-blue-100 text-sm mt-1">Choose an employee to view details</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Employee <span className="text-red-500">*</span>
              {preSelectedEmployeeId && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                  Fixed (pre-selected)
                </span>
              )}
            </label>
            <div className="relative">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={loading ? "Loading employees..." : preSelectedEmployeeId ? "Employee pre-selected" : "Search employee by name or ID"}
                  disabled={loading || !!preSelectedEmployeeId}
                  className={`w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                  tabIndex={-1}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </button>
              </div>
              {/* Dropdown results */}
              {!preSelectedEmployeeId && search && searchResults.length > 0 && !loading && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {searchResults.map(emp => (
                    <div
                      key={emp._id}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                      onClick={() => handleEmployeeSelect(emp)}
                    >
                      {emp.firstName} {emp.middleName || ''} {emp.lastName} <span className="text-gray-400">({emp.employeeID})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedEmployeeId && (
              <div className="text-green-700 text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-green-600" />
                Selected Employee ID: {selectedEmployeeId}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 h-9 rounded-md font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}