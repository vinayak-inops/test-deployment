"use client"
import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ContractorTableBody from './contrctor-table'

// Employee data type with all fields
export interface Employee {
  _id: { $oid: string }
  employeeID: string
  firstName: string
  middleName: string
  lastName: string
  gender: string
  birthDate: string
  nationality: string
  photo?: string
  address: {
    permanentAddress: {
      addressLine1: string
      addressLine2: string
      country: string
      state: string
      city: string
      pinCode: string
    }
    temporaryAddress?: {
      addressLine1: string
      addressLine2: string
      country: string
      state: string
      city: string
      pinCode: string
    }
  }
  deployment: {
    subsidiary: { subsidiaryCode: string; subsidiaryName: string }
    division: { divisionCode: string; divisionName: string }
    department: { departmentCode: string; departmentName: string }
    subDepartment?: { subDepartmentCode: string; subDepartmentName: string }
    section: { sectionCode: string; sectionName: string }
    employeeCategory: { employeeCategoryCode: string; employeeCategoryName: string }
    grade: { gradeCode: string; gradeName: string }
    designation: { designationCode: string; designationName: string }
    location: { locationCode: string; locationName: string }
    skillLevel?: { skilledLevelTitle: string; skilledLevelDescription: string }
    contractor?: { contractorCode: string; contractorName: string }
  }
  workOrder?: Array<{
    workOrderNumber: string
    effectiveFrom: string
    effectiveTo: string
  }>
  dateOfJoining: string
  contractFrom?: string
  contractTo?: string
  contractPeriod?: number
  paymentMode?: string
  status: {
    currentStatus: string
    resignationDate?: string
    relievingDate?: string
    notToReHire?: boolean
  }
  contactNumber: {
    primaryContactNo: string
    secondarContactNumber?: string
    emergencyContactPerson1?: string
    emergencyContactNo1?: string
    emergencyContactPerson2?: string
    emergencyContactNo2?: string
  }
  emailID: {
    primaryEmailID: string
    secondaryEmailID?: string
  }
  bankDetails?: {
    bankName: string
    ifscCode: string
    branchName: string
    accountNumber: string
  }
  workSkill?: {
    workSkillCode: string
    workSkillTitle: string
  }
  natureOfWork?: {
    natureOfWorkCode: string
    natureOfWorkTitle: string
  }
  manager?: string
  superviser?: string
  aadharNumber?: string
  passport?: {
    passportNumber: string
    passportExpiryDate: string
    passportPath: string
  }
  policeVerification?: Array<{
    verificationDate: string
    nextVerificationDate: string
    description: string
    policeStationDetail: string
    policeStationPinCode: string
    documentPath: string
  }>
  cards?: Array<{
    cardNumber: string
    workOrderNumber: string
    issueDate: string
    expiryDate: string
    isPrimaryCard: boolean
    isActive: boolean
  }>
}

type SortField = 'employeeID' | 'name' | 'department' | 'designation' | 'location' | 'dateOfJoining' | 'status' | null
type SortDirection = 'asc' | 'desc' | null

interface ContractorTableWrapperProps {
  employeeData?: Employee[]
  loading?: boolean
  externalPagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    startIndex: number
    endIndex: number
    onPageChange: (page: number) => void
  }
  rolePermissions?: {
    view?: boolean
    edit?: boolean
    delete?: boolean
  }
  onEdit?: (employee: Employee) => void
  onView?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
}

export default function ContractorTableWrapper({ 
  employeeData,
  loading = false,
  externalPagination,
  rolePermissions = { view: true, edit: true, delete: true },
  onEdit,
  onView,
  onDelete
}: ContractorTableWrapperProps) {
  const data = employeeData || []
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortField(null)
        setSortDirection(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return data

    return [...data].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'employeeID':
          aValue = a.employeeID
          bValue = b.employeeID
          break
        case 'name':
          aValue = `${a.firstName} ${a.middleName} ${a.lastName}`.trim()
          bValue = `${b.firstName} ${b.middleName} ${b.lastName}`.trim()
          break
        case 'department':
          aValue = a.deployment.department.departmentName
          bValue = b.deployment.department.departmentName
          break
        case 'designation':
          aValue = a.deployment.designation.designationName
          bValue = b.deployment.designation.designationName
          break
        case 'location':
          aValue = a.deployment.location.locationName
          bValue = b.deployment.location.locationName
          break
        case 'dateOfJoining':
          aValue = new Date(a.dateOfJoining).getTime()
          bValue = new Date(b.dateOfJoining).getTime()
          break
        case 'status':
          aValue = a.status.currentStatus
          bValue = b.status.currentStatus
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [sortField, sortDirection, data])

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data.map(emp => emp._id.$oid)))
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <div className="flex flex-col ml-1">
          <ChevronUp className="h-3 w-3 text-gray-400" />
          <ChevronDown className="h-3 w-3 text-gray-400 -mt-1" />
        </div>
      )
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="h-4 w-4 text-blue-600 ml-1" />
    }
    return <ChevronDown className="h-4 w-4 text-blue-600 ml-1" />
  }

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Card className="border-gray-200 overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === data.length && data.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-blue-600 w-56"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Employee
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-80">
                    Deployment
                  </th>
                  {/* <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-72">
                    Work Order
                  </th> */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-48">
                    Contact Information
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-72">
                    Security Card
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Action
                  </th>
                </tr>
              </thead>
              {/* Table Body */}
              <ContractorTableBody
                employeeData={sortedData}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                rolePermissions={rolePermissions}
                onEdit={onEdit}
                onView={onView}
                onDelete={onDelete}
              />
            </table>
          </div>
          
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg transition-all duration-300 ease-in-out">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-medium text-gray-700">Loading contractor employees...</span>
              </div>
            </div>
          )}
          
          {/* Pagination */}
          {externalPagination && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600">
                {externalPagination.totalItems > 0 ? (
                  <>Showing {externalPagination.startIndex + 1} to {Math.min(externalPagination.endIndex, externalPagination.totalItems)} of {externalPagination.totalItems} entries</>
                ) : (
                  <>No entries found</>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    externalPagination.onPageChange(Math.max(1, externalPagination.currentPage - 1))
                  }}
                  disabled={externalPagination.currentPage === 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: externalPagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (page === 1 || page === externalPagination.totalPages) return true
                      if (page >= externalPagination.currentPage - 1 && page <= externalPagination.currentPage + 1) return true
                      return false
                    })
                    .map((page, index, array) => {
                      if (index > 0 && page - array[index - 1] > 1) {
                        return (
                          <div key={page} className="flex items-center gap-1">
                            <span className="px-2 text-xs text-gray-500">...</span>
                            <Button
                              type="button"
                              variant={page === externalPagination.currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                externalPagination.onPageChange(page)
                              }}
                              className="h-7 w-7 p-0"
                            >
                              {page}
                            </Button>
                          </div>
                        )
                      }
                      return (
                        <Button
                          key={page}
                          type="button"
                          variant={page === externalPagination.currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            externalPagination.onPageChange(page)
                          }}
                          className="h-7 w-7 p-0"
                        >
                          {page}
                        </Button>
                      )
                    })}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    externalPagination.onPageChange(Math.min(externalPagination.totalPages, externalPagination.currentPage + 1))
                  }}
                  disabled={externalPagination.currentPage === externalPagination.totalPages}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
