"use client";

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, FileText, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Employee {
  _id: string;
  employeeID: string;
  firstName: string;
  middleName: string;
  lastName: string;
  photo?: string;
  deployment?: {
    contractor?: {
      contractorCode: string;
      contractorName: string;
    };
    department?: {
      departmentCode: string;
      departmentName: string;
    };
  };
  workOrder?: Array<{
    workOrderNumber: string;
    effectiveFrom: string;
    effectiveTo: string;
    isActive: boolean;
  }>;
  policeVerification?: Array<{
    verificationDate: string;
    nextVerificationDate: string;
    isActive: boolean;
  }>;
  cards?: Array<{
    cardNumber: string;
    issueDate: string;
    expiryDate: string;
    isActive: boolean;
  }>;
}

interface SecurityPassTableProps {
  employeeData: Employee[];
  loading?: boolean;
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onFormView?: (employee: Employee) => void;
  onVerification?: (employee: Employee) => void;
}

type SortField = 'employee' | 'contractor' | 'department' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function SecurityPassTable({
  employeeData,
  loading = false,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  onFormView,
  onVerification,
}: SecurityPassTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  // Handle sorting
  const handleSort = (field: 'employee' | 'contractor' | 'department') => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return employeeData;

    return [...employeeData].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'employee':
          aValue = `${a.firstName || ''} ${a.middleName || ''} ${a.lastName || ''}`.trim().toLowerCase();
          bValue = `${b.firstName || ''} ${b.middleName || ''} ${b.lastName || ''}`.trim().toLowerCase();
          break;
        case 'contractor':
          aValue = (a.deployment?.contractor?.contractorName || '').toLowerCase();
          bValue = (b.deployment?.contractor?.contractorName || '').toLowerCase();
          break;
        case 'department':
          aValue = (a.deployment?.department?.departmentCode || '').toLowerCase();
          bValue = (b.deployment?.department?.departmentCode || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortField, sortDirection, employeeData]);

  // Helper functions
  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const getActiveCards = (employee: Employee) => {
    return employee.cards?.filter((card) => card.isActive) || [];
  };

  const getActiveWorkOrders = (employee: Employee) => {
    return employee.workOrder?.filter((wo) => wo.isActive) || [];
  };

  const getActivePoliceVerifications = (employee: Employee) => {
    return employee.policeVerification?.filter((pv) => pv.isActive) || [];
  };

  const toggleExpansion = (employeeId: string, type: 'workOrder' | 'policeVerification' | 'card') => {
    const key = `${employeeId}-${type}`;
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const isExpanded = (employeeId: string, type: 'workOrder' | 'policeVerification' | 'card') => {
    return expandedItems.has(`${employeeId}-${type}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <div className="flex flex-col ml-1">
          <ChevronUp className="h-3 w-3 text-gray-400" />
          <ChevronDown className="h-3 w-3 text-gray-400 -mt-1" />
        </div>
      );
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="h-4 w-4 text-blue-600 ml-1" />;
    }
    return <ChevronDown className="h-4 w-4 text-blue-600 ml-1" />;
  };

  return (
    <div className="px-8 py-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
            {/* Table Header */}
            <thead>
              <tr className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-200">
                <th className="min-w-[60px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  S.No
                </th>
                <th className="min-w-[200px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  <button
                    onClick={() => handleSort('employee')}
                    className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-left"
                  >
                    Employee
                    <SortIcon field="employee" />
                  </button>
                </th>
                <th className="min-w-[200px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  <button
                    onClick={() => handleSort('contractor')}
                    className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-left"
                  >
                    Contractor
                    <SortIcon field="contractor" />
                  </button>
                </th>
                <th className="min-w-[150px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  <button
                    onClick={() => handleSort('department')}
                    className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-left"
                  >
                    Department
                    <SortIcon field="department" />
                  </button>
                </th>
                <th className="min-w-[250px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Active Work Orders
                </th>
                <th className="min-w-[250px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Police Verification Active
                </th>
                <th className="min-w-[200px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Active Cards
                </th>
                <th className="w-[60px] min-w-[60px] text-left px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                  Action
                </th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody>
              {sortedData.length > 0 ? (
                sortedData.map((employee, index) => {
                  const fullName = `${employee.firstName || ''} ${employee.middleName || ''} ${employee.lastName || ''}`.trim();
                  const initials = getInitials(employee.firstName || '', employee.lastName || '');
                  const activeWorkOrders = getActiveWorkOrders(employee);
                  const activePoliceVerifications = getActivePoliceVerifications(employee);
                  const activeCards = getActiveCards(employee);

                  return (
                    <tr key={employee._id} className="cursor-pointer hover:bg-gray-50/70 border-b border-gray-200">
                      <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm text-left">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            {employee.photo ? (
                              <AvatarImage src={employee.photo} alt={fullName} />
                            ) : null}
                            <AvatarFallback className="text-xs font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{fullName}</div>
                            <div className="text-xs text-gray-600 truncate">
                              <span className="font-medium">ID:</span> {employee.employeeID}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm text-left">
                        {employee.deployment?.contractor ? (
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {employee.deployment.contractor.contractorName}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              <span className="font-medium">ID:</span> {employee.deployment.contractor.contractorCode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">N/A</span>
                        )}
                      </td>
                      <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">
                        {employee.deployment?.department?.departmentCode || 'N/A'}
                      </td>
                      <td className="px-3 md:px-5 py-2 text-sm text-left">
                        {activeWorkOrders.length > 0 ? (
                          <div className="space-y-1">
                            {(isExpanded(employee._id, 'workOrder') ? activeWorkOrders : activeWorkOrders.slice(0, 1)).map((wo, idx) => (
                              <div key={idx} className="text-sm text-gray-900">
                                <div>
                                  <span className="font-medium">WO:</span> {wo.workOrderNumber}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center gap-2">
                                  <span>{formatDate(wo.effectiveFrom)} - {formatDate(wo.effectiveTo)}</span>
                                  {idx === 0 && activeWorkOrders.length > 1 && !isExpanded(employee._id, 'workOrder') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpansion(employee._id, 'workOrder');
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                      Read More
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {isExpanded(employee._id, 'workOrder') && activeWorkOrders.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpansion(employee._id, 'workOrder');
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                              >
                                Show Less
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No active work orders</span>
                        )}
                      </td>
                      <td className="px-3 md:px-5 py-2 text-sm text-left">
                        {activePoliceVerifications.length > 0 ? (
                          <div className="space-y-1">
                            {(isExpanded(employee._id, 'policeVerification') ? activePoliceVerifications : activePoliceVerifications.slice(0, 1)).map((pv, idx) => (
                              <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                                <span>{formatDate(pv.verificationDate)} - {formatDate(pv.nextVerificationDate)}</span>
                                {idx === 0 && activePoliceVerifications.length > 1 && !isExpanded(employee._id, 'policeVerification') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpansion(employee._id, 'policeVerification');
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                  >
                                    Read More
                                  </button>
                                )}
                              </div>
                            ))}
                            {isExpanded(employee._id, 'policeVerification') && activePoliceVerifications.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpansion(employee._id, 'policeVerification');
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                              >
                                Show Less
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No active verification</span>
                        )}
                      </td>
                      <td className="px-3 md:px-5 py-2 text-sm text-left">
                        {activeCards.length > 0 ? (
                          <div className="space-y-1">
                            {(isExpanded(employee._id, 'card') ? activeCards : activeCards.slice(0, 1)).map((card, idx) => (
                              <div key={idx} className="text-sm text-gray-900">
                                <div>
                                  <span className="font-medium">Card:</span> {card.cardNumber}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center gap-2">
                                  <span>{formatDate(card.issueDate)} - {formatDate(card.expiryDate)}</span>
                                  {idx === 0 && activeCards.length > 1 && !isExpanded(employee._id, 'card') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpansion(employee._id, 'card');
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                      Read More
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {isExpanded(employee._id, 'card') && activeCards.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpansion(employee._id, 'card');
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
                              >
                                Show Less
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No active cards</span>
                        )}
                      </td>
                      <td className="text-left px-3 md:px-5 py-2 whitespace-nowrap sticky right-0 bg-white z-10">
                        <div className="flex items-center justify-start gap-1">
                          {onFormView && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onFormView(employee);
                              }}
                              className="p-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                              title="Form View"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {onVerification && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onVerification(employee);
                              }}
                              className="p-1.5 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                              title="Verification"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 md:px-5 py-8 text-center text-sm text-gray-500">
                    {loading ? 'Loading...' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-600">
              {totalCount > 0 ? (
                <>Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} entries</>
              ) : (
                <>No entries found</>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    if (index > 0 && page - array[index - 1] > 1) {
                      return (
                        <div key={page} className="flex items-center gap-1">
                          <span className="px-2 text-xs text-gray-500">...</span>
                          <button
                            type="button"
                            onClick={() => onPageChange(page)}
                            className={`h-7 w-7 p-0 flex items-center justify-center rounded-md text-xs font-medium ${
                              page === currentPage
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className={`h-7 w-7 p-0 flex items-center justify-center rounded-md text-xs font-medium ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
              </div>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

