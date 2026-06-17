"use client";

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Edit, Trash2, MoreVertical, ChevronLeft, ChevronRight, User } from 'lucide-react';

interface EmployeeShift {
  _id: string;
  employeeID: string;
  shiftGroupCode: string;
  fromDate: string;
  toDate: string;
  shift?: {
    shiftCode: string;
    shiftName: string;
  };
}

interface EmployeeShiftTableProps {
  shiftData: EmployeeShift[];
  loading?: boolean;
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onEdit?: (shift: EmployeeShift) => void;
  onDelete?: (shift: EmployeeShift) => void;
  onView?: (shift: EmployeeShift) => void;
  editMode?: boolean;
  deleteMode?: boolean;
  viewMode?: boolean;
}

type SortField = 'employeeID' | 'shiftGroupCode' | 'shift' | null;
type SortDirection = 'asc' | 'desc' | null;

export default function EmployeeShiftTable({
  shiftData,
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
}: EmployeeShiftTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  // Handle sorting
  const handleSort = (field: 'employeeID' | 'shiftGroupCode' | 'shift') => {
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
    if (!sortField || !sortDirection) return shiftData;

    return [...shiftData].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'employeeID':
          aValue = (a.employeeID || '').toLowerCase();
          bValue = (b.employeeID || '').toLowerCase();
          break;
        case 'shiftGroupCode':
          aValue = (a.shiftGroupCode || '').toLowerCase();
          bValue = (b.shiftGroupCode || '').toLowerCase();
          break;
        case 'shift':
          aValue = (a.shift?.shiftName || a.shift?.shiftCode || '').toLowerCase();
          bValue = (b.shift?.shiftName || b.shift?.shiftCode || '').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortField, sortDirection, shiftData]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      // Handle DD-MM-YYYY format
      if (dateString.includes('-')) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          return dateString; // Return as is if already in DD-MM-YYYY format
        }
      }
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
                <th className="min-w-[150px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  <button
                    onClick={() => handleSort('employeeID')}
                    className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-left"
                  >
                    Employee ID
                    <SortIcon field="employeeID" />
                  </button>
                </th>
                <th className="min-w-[150px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  <button
                    onClick={() => handleSort('shiftGroupCode')}
                    className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-left"
                  >
                    Shift Group Code
                    <SortIcon field="shiftGroupCode" />
                  </button>
                </th>
                <th className="min-w-[200px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  <button
                    onClick={() => handleSort('shift')}
                    className="flex items-center gap-1.5 hover:text-gray-900 transition-colors text-left"
                  >
                    Shift
                    <SortIcon field="shift" />
                  </button>
                </th>
                <th className="min-w-[200px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Date
                </th>
                <th className="w-[60px] min-w-[60px] text-left px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                  Action
                </th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 md:px-5 py-8 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : sortedData.length > 0 ? (
                sortedData.map((shift, index) => (
                  <tr key={shift._id} className="cursor-pointer hover:bg-gray-50/70 border-b border-gray-200">
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-left">
                      {shift.employeeID ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{shift.employeeID}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">
                      {shift.shiftGroupCode || 'N/A'}
                    </td>
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm text-left">
                      {shift.shift ? (
                        <span className="text-sm text-gray-900">
                          {shift.shift.shiftCode || 'N/A'} - {shift.shift.shiftName || 'N/A'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm text-left">
                      <span className="text-sm text-gray-900">
                        {formatDate(shift.fromDate)} - {formatDate(shift.toDate)}
                      </span>
                    </td>
                    <td className="text-left px-3 md:px-5 py-2 whitespace-nowrap sticky right-0 bg-white z-10">
                      <div className="flex items-center justify-start gap-1">
                        {editMode && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEdit?.(shift);
                            }}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {deleteMode && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDelete?.(shift);
                            }}
                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {viewMode && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onView?.(shift);
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 md:px-5 py-8 text-center text-sm text-gray-500">
                    No data available
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

