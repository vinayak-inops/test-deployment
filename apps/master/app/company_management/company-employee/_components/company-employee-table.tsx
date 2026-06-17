"use client"
import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Edit, Trash2, MoreVertical } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

// Employee data type with all fields
export interface Employee {
  _id: string | { $oid: string }
  employeeID: string
  firstName: string
  middleName: string
  lastName: string
  gender?: string
  birthDate?: string
  nationality?: string
  photo?: string
  address?: {
    permanentAddress?: {
      addressLine1?: string
      addressLine2?: string
      country?: string
      state?: string
      city?: string
      pinCode?: string
    }
    temporaryAddress?: {
      addressLine1?: string
      addressLine2?: string
      country?: string
      state?: string
      city?: string
      pinCode?: string
    }
  }
  deployment?: {
    subsidiary?: { subsidiaryCode: string; subsidiaryName: string }
    division?: { divisionCode: string; divisionName: string }
    department?: { departmentCode: string; departmentName: string }
    subDepartment?: { subDepartmentCode: string; subDepartmentName: string }
    section?: { sectionCode: string; sectionName: string }
    employeeCategory?: { employeeCategoryCode: string; employeeCategoryName?: string; employeeCategoryTitle?: string }
    grade?: { gradeCode: string; gradeName?: string; gradeTitle?: string }
    designation?: { designationCode: string; designationName: string }
    location?: { locationCode: string; locationName: string }
    skillLevel?: { skillLevelTitle?: string; skillLevelDescription?: string }
    effectiveFrom?: string
  }
  dateOfJoining?: string
  joiningDate?: string
  status?: {
    currentStatus?: string
    resignationDate?: string
    relievingDate?: string
    notToReHire?: boolean
  }
  contactNumber?: {
    primaryContactNo?: string
    secondarContactNumber?: string
    emergencyContactPerson1?: string
    emergencyContactNo1?: string
    emergencyContactPerson2?: string
    emergencyContactNo2?: string
  }
  emailID?: {
    primaryEmailID?: string
    secondaryEmailID?: string
  }
  aadharNumber?: string
  manager?: string
  superviser?: string
  wasContractEmployee?: boolean
}

type SortField = 'employeeID' | 'name' | 'department' | 'designation' | 'location' | 'dateOfJoining' | null
type SortDirection = 'asc' | 'desc' | null

interface CompanyEmployeeTableProps {
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

export default function CompanyEmployeeTable({ 
  employeeData = [],
  loading = false,
  externalPagination,
  rolePermissions = { view: true, edit: true, delete: true },
  onEdit,
  onView,
  onDelete
}: CompanyEmployeeTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(new Set())

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

  const getEmployeeId = (employee: Employee): string => {
    if (typeof employee._id === 'string') return employee._id
    return employee._id?.$oid || ''
  }

  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return employeeData

    return [...employeeData].sort((a, b) => {
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
          aValue = a.deployment?.department?.departmentName || ''
          bValue = b.deployment?.department?.departmentName || ''
          break
        case 'designation':
          aValue = a.deployment?.designation?.designationName || ''
          bValue = b.deployment?.designation?.designationName || ''
          break
        case 'location':
          aValue = a.deployment?.location?.locationName || ''
          bValue = b.deployment?.location?.locationName || ''
          break
        case 'dateOfJoining':
          const aDate = a.joiningDate || a.dateOfJoining || ''
          const bDate = b.joiningDate || b.dateOfJoining || ''
          // Handle DD-MM-YYYY format
          if (aDate.includes('-') && aDate.split('-')[0].length === 2) {
            const [aDay, aMonth, aYear] = aDate.split('-')
            const [bDay, bMonth, bYear] = bDate.split('-')
            aValue = new Date(`${aYear}-${aMonth}-${aDay}`).getTime()
            bValue = new Date(`${bYear}-${bMonth}-${bDay}`).getTime()
          } else {
            aValue = new Date(aDate).getTime()
            bValue = new Date(bDate).getTime()
          }
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [sortField, sortDirection, employeeData])

  const handleSelectAll = () => {
    if (selectedRows.size === employeeData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(employeeData.map(emp => getEmployeeId(emp))))
    }
  }

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    // Handle DD-MM-YYYY format
    if (dateString.includes('-') && dateString.split('-')[0].length === 2) {
      const [day, month, year] = dateString.split('-')
      const date = new Date(`${year}-${month}-${day}`)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      }
    }
    // Handle standard date format
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return `${first}${last}`.toUpperCase()
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
    <div className="p-6 pb-0 pt-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Table */}
        <Card className="border-gray-200 overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === employeeData.length && employeeData.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-blue-600 w-44"
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-72">
                    Manager & Employment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-72">
                    Basic Information
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-72">
                    Contact Information
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Action
                  </th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((employee) => {
                  const fullName = `${employee.firstName || ''} ${employee.middleName || ''} ${employee.lastName || ''}`.trim()
                  const employeeId = getEmployeeId(employee)
                  const isSelected = selectedRows.has(employeeId)
                  const initials = getInitials(employee.firstName || '', employee.lastName || '')
                  
                  return (
                    <tr key={employeeId} className={`border-b border-gray-200 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      {/* Checkbox Column */}
                      <td className="px-4 py-5 align-top w-12">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(employeeId)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      
                      {/* Employee Column */}
                      <td className="px-4 py-5 align-top w-44">
                        <div className="flex items-start">
                          <div className="flex-1">
                            {/* Profile Picture */}
                            <Avatar className="h-16 w-16 mb-2">
                              {employee.photo ? (
                                <AvatarImage src={employee.photo} alt={fullName} />
                              ) : null}
                              <AvatarFallback className="bg-gray-200 text-gray-600 text-base font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>

                            {/* Name */}
                            <h2 className="text-base font-semibold text-gray-900 mb-1 leading-tight">{fullName || 'N/A'}</h2>
                            
                            {/* Employee ID */}
                            <p className="text-xs text-gray-700">
                              <span className="font-medium">Employee ID:</span> {employee.employeeID || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Deployment Column */}
                      <td className="px-4 py-5 align-top w-80">
                        <div className="space-y-1.5">
                          {employee.deployment?.subsidiary?.subsidiaryName && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Subsidiary:</span> {employee.deployment.subsidiary.subsidiaryName}
                            </p>
                          )}
                          {employee.deployment?.division?.divisionName && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Division:</span> {employee.deployment.division.divisionName}
                            </p>
                          )}
                          {employee.deployment?.department?.departmentName && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Department:</span> {employee.deployment.department.departmentName}
                            </p>
                          )}
                          {employee.deployment?.subDepartment?.subDepartmentName && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Sub Department:</span> {employee.deployment.subDepartment.subDepartmentName}
                            </p>
                          )}
                          {employee.deployment?.section?.sectionName && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Section:</span> {employee.deployment.section.sectionName}
                            </p>
                          )}
                          {employee.deployment?.location?.locationName && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Location:</span> {employee.deployment.location.locationName}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Manager & Employment Column */}
                      <td className="px-4 py-5 align-top w-72">
                        <div className="space-y-1.5">
                          {employee.manager && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Manager:</span> {employee.manager}
                            </p>
                          )}
                          {employee.deployment?.effectiveFrom && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Effective From:</span> {formatDate(employee.deployment.effectiveFrom)}
                            </p>
                          )}
                          {(employee.joiningDate || employee.dateOfJoining) && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Joining Date:</span> {formatDate(employee.joiningDate || employee.dateOfJoining || '')}
                            </p>
                          )}
                          {employee.wasContractEmployee !== undefined && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Was Contract Employee:</span> {employee.wasContractEmployee ? 'Yes' : 'No'}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Basic Information Column */}
                      <td className="px-4 py-5 align-top w-72">
                        <div className="space-y-1.5">
                          {employee.aadharNumber && (
                            <p className="text-sm text-gray-900 break-words">
                              <span className="font-semibold">Aadhar Number:</span> {employee.aadharNumber}
                            </p>
                          )}
                          {employee.deployment?.designation?.designationName && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Designation:</span> {employee.deployment.designation.designationName}
                            </p>
                          )}
                          {employee.deployment?.employeeCategory && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Employee Category:</span> {employee.deployment.employeeCategory.employeeCategoryTitle || employee.deployment.employeeCategory.employeeCategoryName || ''}
                            </p>
                          )}
                          {employee.deployment?.grade && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Grade:</span> {employee.deployment.grade.gradeTitle || employee.deployment.grade.gradeName || ''} ({employee.deployment.grade.gradeCode})
                            </p>
                          )}
                          {employee.deployment?.skillLevel && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Skill Level:</span> {employee.deployment.skillLevel.skillLevelTitle || ''} {employee.deployment.skillLevel.skillLevelDescription ? `- ${employee.deployment.skillLevel.skillLevelDescription}` : ''}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Contact Information Column */}
                      <td className="px-4 py-5 align-top w-72">
                        <div className="space-y-1.5">
                          {employee.contactNumber?.primaryContactNo && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Phone:</span> {employee.contactNumber.primaryContactNo}
                            </p>
                          )}
                          {employee.emailID?.primaryEmailID && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Email:</span> <a href={`mailto:${employee.emailID.primaryEmailID}`} className="text-blue-600 hover:underline">{employee.emailID.primaryEmailID}</a>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Action Column */}
                      <td className="px-4 py-5 align-top w-24">
                        <div className="flex items-start justify-end">
                          <div className="flex flex-col gap-2">
                            {rolePermissions?.edit && onEdit && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  onEdit(employee)
                                }}
                                className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {rolePermissions?.delete && onDelete && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  onDelete(employee)
                                }}
                                className="p-2 rounded-md hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {rolePermissions?.view && onView && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  onView(employee)
                                }}
                                className="p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                                title="View More"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg transition-all duration-300 ease-in-out">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-medium text-gray-700">Loading company employees...</span>
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