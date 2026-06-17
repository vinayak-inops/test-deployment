"use client"
import React, { useState } from 'react'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Employee } from './contractor-table-wrapper'

interface ContractorTableBodyProps {
  employeeData: Employee[]
  selectedRows: Set<string>
  setSelectedRows: React.Dispatch<React.SetStateAction<Set<string>>>
  rolePermissions?: {
    view?: boolean
    edit?: boolean
    delete?: boolean
  }
  onEdit?: (employee: Employee) => void
  onView?: (employee: Employee) => void
  onDelete?: (employee: Employee) => void
}

export default function ContractorTableBody({ 
  employeeData,
  selectedRows,
  setSelectedRows,
  rolePermissions = { view: true, edit: true, delete: true },
  onEdit,
  onView,
  onDelete
}: ContractorTableBodyProps) {
  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(new Set())
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

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
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {employeeData.map((employee) => {
        const fullName = `${employee.firstName} ${employee.middleName} ${employee.lastName}`.trim()
        const isSelected = selectedRows.has(employee._id.$oid)
        const initials = getInitials(employee.firstName, employee.lastName)
        
        return (
          <tr key={employee._id.$oid} className={`border-b border-gray-200 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
            {/* Checkbox Column */}
            <td className="px-4 py-5 align-top w-12">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectRow(employee._id.$oid)}
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
                  <h2 className="text-base font-semibold text-gray-900 mb-1 leading-tight">{fullName}</h2>
                  
                  {/* Employee ID */}
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Employee ID:</span> {employee.employeeID}
                  </p>
                </div>
              </div>
            </td>

            {/* Deployment Column */}
            <td className="px-4 py-5 align-top w-80">
              <div className="space-y-1.5">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Subsidiary:</span> {employee.deployment.subsidiary.subsidiaryName}
                </p>
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Division:</span> {employee.deployment.division.divisionName}
                </p>
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Department:</span> {employee.deployment.department.departmentName}
                </p>
                {employee.deployment.subDepartment && (
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Sub Department:</span> {employee.deployment.subDepartment.subDepartmentName}
                  </p>
                )}
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Section:</span> {employee.deployment.section.sectionName}
                </p>
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Location:</span> {employee.deployment.location.locationName}
                </p>
              </div>
            </td>

            {/* Work Order Column */}
            {/* <td className="px-4 py-5 align-top w-72">
              <div className="space-y-1.5">
                {employee.workOrder && employee.workOrder.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Work Order:</p>
                    {employee.workOrder.map((wo, idx) => (
                      <div key={idx} className="text-sm text-gray-900 space-y-0.5 mb-2 pl-4">
                        <p><span className="font-semibold">Number:</span> {wo.workOrderNumber}</p>
                        <p><span className="font-semibold">Effective From:</span> {formatDate(wo.effectiveFrom)}</p>
                        <p><span className="font-semibold">Effective To:</span> {formatDate(wo.effectiveTo)}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">Employee Category:</span> {employee.deployment.employeeCategory.employeeCategoryName}
                </p> 
                
                {employee.workSkill && (
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Work Skill:</span> {employee.workSkill.workSkillTitle}
                  </p>
                )}
              </div>
            </td> */}

            {/* Contact Information Column */}
            <td className="px-4 py-5 align-top w-72">
              <div className="space-y-1.5">
                {employee.emailID.primaryEmailID && (
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Email:</span> <a href={`mailto:${employee.emailID.primaryEmailID}`} className="text-blue-600 hover:underline">{employee.emailID.primaryEmailID}</a>
                  </p>
                )}
                
                {employee.contactNumber.primaryContactNo && (
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Phone:</span> {employee.contactNumber.primaryContactNo}
                  </p>
                )}
                
                {employee.contactNumber.secondarContactNumber && (
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Mobile:</span> {employee.contactNumber.secondarContactNumber}
                  </p>
                )}
                
                {employee.contactNumber.emergencyContactPerson1 && (
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Emergency Contact 1:</span> {employee.contactNumber.emergencyContactPerson1}
                    {employee.contactNumber.emergencyContactNo1 && ` - ${employee.contactNumber.emergencyContactNo1}`}
                  </p>
                )}
                
                {employee.contactNumber.emergencyContactPerson2 && (
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">Emergency Contact 2:</span> {employee.contactNumber.emergencyContactPerson2}
                    {employee.contactNumber.emergencyContactNo2 && ` - ${employee.contactNumber.emergencyContactNo2}`}
                  </p>
                )}
                
                {employee.address.permanentAddress && (() => {
                  const addressId = employee._id.$oid
                  const isExpanded = expandedAddresses.has(addressId)
                  const addressLines = [
                    employee.address.permanentAddress.addressLine1,
                    employee.address.permanentAddress.addressLine2,
                    `${employee.address.permanentAddress.city}, ${employee.address.permanentAddress.state} ${employee.address.permanentAddress.pinCode}`,
                    employee.address.permanentAddress.country
                  ].filter(Boolean)
                  
                  // Show read more if we have more than 3 lines or if addressLine2 exists (which means 4+ lines)
                  const shouldShowReadMore = addressLines.length > 3 || employee.address.permanentAddress.addressLine2
                  
                  const toggleAddress = (e: React.MouseEvent) => {
                    e.stopPropagation()
                    const newExpanded = new Set(expandedAddresses)
                    if (isExpanded) {
                      newExpanded.delete(addressId)
                    } else {
                      newExpanded.add(addressId)
                    }
                    setExpandedAddresses(newExpanded)
                  }
                  
                  return (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Address:</p>
                      <div className={`text-sm text-gray-700 space-y-0.5 ${!isExpanded && shouldShowReadMore ? 'line-clamp-3' : ''}`}>
                        {addressLines.map((line, idx) => (
                          <p key={idx}>{line}</p>
                        ))}
                      </div>
                      {shouldShowReadMore && (
                        <button
                          onClick={toggleAddress}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors focus:outline-none"
                          type="button"
                        >
                          {isExpanded ? 'Read less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  )
                })()}
              </div>
            </td>

            {/* Security Card Column */}
            <td className="px-4 py-5 align-top w-56">
              <div className="space-y-1.5">
                {employee.aadharNumber && (
                  <p className="text-sm text-gray-900 break-words">
                    <span className="font-semibold">Aadhar Number:</span> {employee.aadharNumber}
                  </p>
                )}
                
                {employee.cards && employee.cards.filter(card => card.isActive).length > 0 && (() => {
                  const activeCards = employee.cards!.filter(card => card.isActive)
                  const cardId = employee._id.$oid
                  const isExpanded = expandedCards.has(cardId)
                  const hasMoreCards = activeCards.length > 1
                  const cardsToShow = isExpanded ? activeCards : [activeCards[0]]
                  
                  const toggleCards = (e: React.MouseEvent) => {
                    e.stopPropagation()
                    const newExpanded = new Set(expandedCards)
                    if (isExpanded) {
                      newExpanded.delete(cardId)
                    } else {
                      newExpanded.add(cardId)
                    }
                    setExpandedCards(newExpanded)
                  }
                  
                  return (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 mb-2">Security Cards:</p>
                      {cardsToShow.map((card, idx) => (
                        <div key={idx} className="text-sm text-gray-900 space-y-0.5 mb-2 pl-4">
                          <p><span className="font-semibold">Card Number:</span> {card.cardNumber}</p>
                          <p><span className="font-semibold">WON:</span> {card.workOrderNumber}</p>
                          <p><span className="font-semibold">Issue Date:</span> {formatDate(card.issueDate)}</p>
                          <p><span className="font-semibold">Expiry Date:</span> {formatDate(card.expiryDate)}</p>
                          <p className="text-green-600">
                            <span className="font-semibold">Status:</span> Active
                          </p>
                        </div>
                      ))}
                      {hasMoreCards && (
                        <button
                          onClick={toggleCards}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors focus:outline-none"
                          type="button"
                        >
                          {isExpanded ? 'Read less' : `Read more (${activeCards.length - 1} more)`}
                        </button>
                      )}
                    </div>
                  )
                })()}
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
  )
}
