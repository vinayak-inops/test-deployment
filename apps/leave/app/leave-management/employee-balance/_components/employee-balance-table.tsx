"use client";

import React from 'react';
import { Edit, Trash2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';

interface Balance {
  leaveTitle: string;
  leaveCode: string;
  unitOfTime?: string;
  beginningYearBalance?: number;
  carryoverBalance?: number;
  absencePaidYearToDate?: number;
  absencePaidInPeriod?: number;
  beginningPeriodBalance?: number;
  accruedInPeriod?: number;
  carryoverForfeitedInPeriod?: number;
  encashed?: number;
  includeEventsAwaitingApproval?: number;
  asOfPeriod?: string;
  balance?: number;
  encashable?: number;
}

interface EmployeeBalance {
  _id: string;
  employeeID: string;
  balances: Balance[];
  organizationCode?: string;
  tenantCode?: string;
}

interface EmployeeBalanceTableProps {
  employeeData: EmployeeBalance[];
  loading?: boolean;
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onEdit?: (employee: EmployeeBalance) => void;
  onDelete?: (employee: EmployeeBalance) => void;
  onView?: (employee: EmployeeBalance) => void;
  editMode?: boolean;
  deleteMode?: boolean;
  viewMode?: boolean;
}

export default function EmployeeBalanceTable({
  employeeData,
  loading = false,
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  onEdit,
  onDelete,
  onView,
  editMode = false,
  deleteMode = false,
  viewMode = false,
}: EmployeeBalanceTableProps) {
  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatNumber = (value?: number) => {
    if (value === undefined || value === null) return '0.00';
    return parseFloat(value.toFixed(2));
  };

  // Calculate totals for each employee
  const getTotalEncashable = (balances: Balance[]) => {
    const total = balances.reduce((sum, balance) => {
      const val = Number(balance?.encashable || 0);
      return sum + (val < 0 ? 0 : val);
    }, 0);
    return parseFloat(total.toFixed(2));
  };

  return (
    <div className="px-8 py-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full border-collapse" style={{ minWidth: 'max-content', width: '100%' }}>
            {/* Main Header Row with all 11 columns */}
            <thead>
              <tr className="bg-gray-50/80 border-b-2 border-gray-300">
                <th className="min-w-[150px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center border-r-2 border-gray-300 sticky left-0 bg-gray-50/80 z-10">
                  Employee ID
                </th>
                <th className="min-w-[150px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  Leave Title
                </th>
                <th className="min-w-[120px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  Leave Code
                </th>
                <th className="min-w-[100px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  Unit
                </th>
                <th className="min-w-[130px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  Beginning Year
                </th>
                <th className="min-w-[120px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  Carryover
                </th>
                <th className="min-w-[120px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  Accrued
                </th>
                <th className="min-w-[120px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  Encashed
                </th>
                <th className="min-w-[120px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  Balance
                </th>
                <th className="min-w-[130px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  Encashable
                </th>
                <th className="min-w-[150px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  As Of Period
                </th>
                <th className="w-[60px] min-w-[60px] text-left px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                  Action
                </th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody>
              {employeeData.length > 0 ? (
                employeeData.flatMap((employee, employeeIndex) => {
                  if (!employee.balances || employee.balances.length === 0) {
                    return (
                      <tr key={employee._id} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-3 md:px-5 py-4 text-sm font-semibold text-gray-900 text-center border-r-2 border-gray-300 bg-white sticky left-0 z-10">
                          {employee.employeeID || 'N/A'}
                        </td>
                        <td colSpan={10} className="px-3 py-2 text-sm text-gray-500 text-center">
                          No leave balances available
                        </td>
                        <td className="text-left px-3 md:px-5 py-2 whitespace-nowrap sticky right-0 bg-white z-10">
                          <div className="flex items-center justify-start gap-1">
                            {editMode && onEdit && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onEdit(employee);
                                }}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {deleteMode && onDelete && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onDelete(employee);
                                }}
                                className="p-1.5 rounded-md hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {viewMode && onView && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onView(employee);
                                }}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                                title="View More"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return employee.balances.map((balance, balanceIndex) => (
                    <tr key={`${employee._id}-${balanceIndex}`} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                      {/* Employee ID - Merged cell spanning all balance rows */}
                      {balanceIndex === 0 && (
                        <td 
                          rowSpan={employee.balances.length} 
                          className="px-3 md:px-5 py-4 text-sm font-semibold text-gray-900 text-center border-r-2 border-gray-300 bg-white sticky left-0 z-10 align-middle"
                        >
                          <div className="flex items-center justify-center h-full">
                            {employee.employeeID || 'N/A'}
                          </div>
                        </td>
                      )}
                      {/* Leave Balance Details */}
                      <td className="px-3 py-2 text-sm text-gray-900 text-center border-r border-gray-200">{balance.leaveTitle || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 text-center border-r border-gray-200">{balance.leaveCode || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 text-center border-r border-gray-200">{balance.unitOfTime || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">{formatNumber(balance.beginningYearBalance)}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">{formatNumber(balance.carryoverBalance)}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">{formatNumber(balance.accruedInPeriod)}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 text-right border-r border-gray-200">{formatNumber(balance.encashed)}</td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right border-r border-gray-200">{formatNumber(balance.balance)}</td>
                      <td className="px-3 py-2 text-sm font-medium text-blue-600 text-right border-r border-gray-200">{formatNumber(balance.encashable)}</td>
                      <td className="px-3 py-2 text-sm text-gray-700 text-center">{formatDate(balance.asOfPeriod)}</td>
                      {/* Action buttons - only on first row */}
                      {balanceIndex === 0 && (
                        <td 
                          rowSpan={employee.balances.length} 
                          className="text-left px-3 md:px-5 py-2 whitespace-nowrap sticky right-0 bg-white z-10 align-middle"
                        >
                          <div className="flex items-center justify-start gap-1">
                            {editMode && onEdit && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onEdit(employee);
                                }}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {deleteMode && onDelete && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onDelete(employee);
                                }}
                                className="p-1.5 rounded-md hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {viewMode && onView && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onView(employee);
                                }}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                                title="View More"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ));
                })
              ) : (
                <tr>
                  <td colSpan={12} className="px-3 md:px-5 py-8 text-center text-sm text-gray-500">
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

