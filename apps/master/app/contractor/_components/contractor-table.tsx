"use client"
import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Edit, Trash2, MoreVertical } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

// Contractor data type
export interface Contractor {
  _id: string | { $oid: string }
  contractorName: string
  contractorCode: string
  typeOfCompany?: string
  organizationCode?: string
  workLocation?: string
  serviceSince?: string
  workOrders?: Array<{
    workOrderNumber: string
    contractPeriodFrom?: string
    contractPeriodTo?: string
    NumberOfEmployee?: number
    departments?: Array<{
      departmentCode: string
      departmentName: string
    }>
  }>
  contactPersonName?: string
  contactPersonContactNo?: string
  contactPersonEmailId?: string
  ownerName?: string
  licenses?: Array<{
    licenseNo: string
    licenseFromDate?: string
    licenseToDate?: string
  }>
  securityDeposit?: Array<{
    depositAmount?: number
    depositDetail?: string
  }>
  contractorImage?: string
}

type SortField = 'contractorCode' | 'contractorName' | 'organizationCode' | 'workLocation' | null
type SortDirection = 'asc' | 'desc' | null

interface ContractorTableProps {
  contractorData?: Contractor[]
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
  onEdit?: (contractor: Contractor) => void
  onView?: (contractor: Contractor) => void
  onDelete?: (contractor: Contractor) => void
}

export default function ContractorTable({ 
  contractorData = [],
  loading = false,
  externalPagination,
  rolePermissions = { view: true, edit: true, delete: true },
  onEdit,
  onView,
  onDelete
}: ContractorTableProps) {
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

  const getContractorId = (contractor: Contractor): string => {
    if (typeof contractor._id === 'string') return contractor._id
    return contractor._id?.$oid || ''
  }

  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return contractorData

    return [...contractorData].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'contractorCode':
          aValue = a.contractorCode
          bValue = b.contractorCode
          break
        case 'contractorName':
          aValue = a.contractorName
          bValue = b.contractorName
          break
        case 'organizationCode':
          aValue = a.organizationCode || ''
          bValue = b.organizationCode || ''
          break
        case 'workLocation':
          aValue = a.workLocation || ''
          bValue = b.workLocation || ''
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [sortField, sortDirection, contractorData])

  const handleSelectAll = () => {
    if (selectedRows.size === contractorData.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(contractorData.map(contractor => getContractorId(contractor))))
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

  const getInitials = (name: string) => {
    if (!name) return 'CN'
    const words = name.trim().split(' ')
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
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
                      checked={selectedRows.size === contractorData.length && contractorData.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-blue-600 w-44"
                    onClick={() => handleSort('contractorName')}
                  >
                    <div className="flex items-center gap-1">
                      Contractor
                      <SortIcon field="contractorName" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-80">
                    Company Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-72">
                    Work Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-72">
                    Contact Information
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-72">
                    Compliance / Security
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                    Action
                  </th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((contractor) => {
                  const contractorId = getContractorId(contractor)
                  const isSelected = selectedRows.has(contractorId)
                  const initials = getInitials(contractor.contractorName || '')
                  const lastWorkOrder = contractor.workOrders && contractor.workOrders.length > 0 
                    ? contractor.workOrders[contractor.workOrders.length - 1] 
                    : null
                  const lastLicense = contractor.licenses && contractor.licenses.length > 0 
                    ? contractor.licenses[contractor.licenses.length - 1] 
                    : null
                  const primarySecurityDeposit = contractor.securityDeposit && contractor.securityDeposit.length > 0 ? contractor.securityDeposit[0] : null
                  
                  return (
                    <tr key={contractorId} className={`border-b border-gray-200 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      {/* Checkbox Column */}
                      <td className="px-4 py-5 align-top w-12">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(contractorId)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      
                      {/* Contractor Column */}
                      <td className="px-4 py-5 align-top w-44">
                        <div className="flex items-start">
                          <div className="flex-1">
                            {/* Profile Picture */}
                            <Avatar className="h-16 w-16 mb-2">
                              {contractor.contractorImage ? (
                                <AvatarImage src={contractor.contractorImage} alt={contractor.contractorName} />
                              ) : null}
                              <AvatarFallback className="bg-gray-200 text-gray-600 text-base font-semibold">
                                {initials}
                              </AvatarFallback>
                            </Avatar>

                            {/* Name */}
                            <h2 className="text-base font-semibold text-gray-900 mb-1 leading-tight">{contractor.contractorName || 'N/A'}</h2>
                            
                            {/* Contractor Code */}
                            <p className="text-xs text-gray-700">
                              <span className="font-medium">Contractor Code:</span> {contractor.contractorCode || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Company Details Column */}
                      <td className="px-4 py-5 align-top w-80">
                        <div className="space-y-1.5">
                          {contractor.typeOfCompany && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Type:</span> {contractor.typeOfCompany}
                            </p>
                          )}
                          {contractor.organizationCode && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Organization:</span> {contractor.organizationCode}
                            </p>
                          )}
                          {contractor.workLocation && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Work Location:</span> {contractor.workLocation}
                            </p>
                          )}
                          {contractor.serviceSince && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Service Since:</span> {formatDate(contractor.serviceSince)}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Work Order Column */}
                      <td className="px-4 py-5 align-top w-72">
                        <div className="space-y-1.5">
                          {lastWorkOrder && (
                            <>
                              {lastWorkOrder.workOrderNumber && (
                                <p className="text-sm text-gray-900">
                                  <span className="font-semibold">Work Order No:</span> {lastWorkOrder.workOrderNumber}
                                </p>
                              )}
                              {lastWorkOrder.contractPeriodFrom && lastWorkOrder.contractPeriodTo && (
                                <p className="text-sm text-gray-900">
                                  <span className="font-semibold">Contract Period:</span> {formatDate(lastWorkOrder.contractPeriodFrom)} – {formatDate(lastWorkOrder.contractPeriodTo)}
                                </p>
                              )}
                              {lastWorkOrder.NumberOfEmployee !== undefined && (
                                <p className="text-sm text-gray-900">
                                  <span className="font-semibold">No. of Employees:</span> {lastWorkOrder.NumberOfEmployee}
                                </p>
                              )}
                              {lastWorkOrder.departments && lastWorkOrder.departments.length > 0 && (
                                <p className="text-sm text-gray-900">
                                  <span className="font-semibold">Department:</span> {lastWorkOrder.departments[0].departmentName}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Contact Information Column */}
                      <td className="px-4 py-5 align-top w-72">
                        <div className="space-y-1.5">
                          {contractor.contactPersonName && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Contact Person:</span> {contractor.contactPersonName}
                            </p>
                          )}
                          {contractor.contactPersonContactNo && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Phone:</span> {contractor.contactPersonContactNo}
                            </p>
                          )}
                          {contractor.contactPersonEmailId && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Email:</span> <a href={`mailto:${contractor.contactPersonEmailId}`} className="text-blue-600 hover:underline">{contractor.contactPersonEmailId}</a>
                            </p>
                          )}
                          {contractor.ownerName && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Owner:</span> {contractor.ownerName}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Compliance / Security Column */}
                      <td className="px-4 py-5 align-top w-72">
                        <div className="space-y-1.5">
                          {lastLicense && lastLicense.licenseNo && (
                            <p className="text-sm text-gray-900 break-words">
                              <span className="font-semibold">License No:</span> {lastLicense.licenseNo}
                            </p>
                          )}
                          {lastLicense && lastLicense.licenseFromDate && lastLicense.licenseToDate && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">License Valid:</span> {formatDate(lastLicense.licenseFromDate)} – {formatDate(lastLicense.licenseToDate)}
                            </p>
                          )}
                          {primarySecurityDeposit && primarySecurityDeposit.depositAmount !== undefined && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Security Deposit:</span> ₹{primarySecurityDeposit.depositAmount.toLocaleString('en-IN')}
                            </p>
                          )}
                          {primarySecurityDeposit && primarySecurityDeposit.depositDetail && (
                            <p className="text-sm text-gray-900">
                              <span className="font-semibold">Deposit Type:</span> {primarySecurityDeposit.depositDetail}
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
                                  onEdit(contractor)
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
                                  onDelete(contractor)
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
                                  onView(contractor)
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
                <span className="text-sm font-medium text-gray-700">Loading contractors...</span>
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

