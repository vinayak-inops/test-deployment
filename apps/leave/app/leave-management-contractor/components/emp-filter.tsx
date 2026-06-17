"use client"

import type React from "react"
import { useEffect } from "react"
import { X, User } from "lucide-react"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import EmployeeSearchField, { type Employee } from "@/components/fields/employee-search"

// Props interface
interface EmpFilterProps {
  isOpen: boolean
  onClose: () => void
  onEmployeeSelect: (employeeId: string) => void
  preSelectedEmployeeId?: string
}

// Main Component
export default function EmpFilter({ isOpen, onClose, onEmployeeSelect, preSelectedEmployeeId }: EmpFilterProps) {
  const { hierarchyFilters } = useEmpHierarchy()

  // Handle employee selection from EmployeeSearchField
  const handleEmployeeSelect = (employee: Employee) => {
    onEmployeeSelect(employee.employeeID)
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
            {preSelectedEmployeeId && (
              <div className="mb-2">
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                  Fixed (pre-selected)
                </span>
              </div>
            )}
            <EmployeeSearchField
              label="Employee"
              required={true}
              isOpen={isOpen}
              preSelectedEmployeeId={preSelectedEmployeeId}
              onSelect={handleEmployeeSelect}
              subsidiaries={hierarchyFilters?.subsidiaries}
              divisions={hierarchyFilters?.divisions}
              departments={hierarchyFilters?.departments}
              locations={hierarchyFilters?.locations}
              contractors={hierarchyFilters?.contractors}
            />
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