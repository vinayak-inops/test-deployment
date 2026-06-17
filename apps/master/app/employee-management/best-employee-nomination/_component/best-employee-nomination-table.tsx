"use client";

import React from 'react';
import { Edit, Trash2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';

interface Nomination {
  _id: string;
  nominationYear: string;
  date: string;
  employeeID: string;
  createdOn: string;
  createdBy: string;
}

interface BestEmployeeNominationTableProps {
  nominationData: Nomination[];
  loading?: boolean;
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onEdit?: (nomination: Nomination) => void;
  onDelete?: (nomination: Nomination) => void;
  onView?: (nomination: Nomination) => void;
  editMode?: boolean;
  deleteMode?: boolean;
  viewMode?: boolean;
}

export default function BestEmployeeNominationTable({
  nominationData,
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
}: BestEmployeeNominationTableProps) {
  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

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
                  Employee ID
                </th>
                <th className="min-w-[150px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Nomination Year
                </th>
                <th className="min-w-[150px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Date
                </th>
                <th className="min-w-[150px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Created On
                </th>
                <th className="min-w-[150px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Created By
                </th>
                <th className="w-[60px] min-w-[60px] text-left px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                  Action
                </th>
              </tr>
            </thead>
            {/* Table Body */}
            <tbody>
              {nominationData.length > 0 ? (
                nominationData.map((nomination, index) => {
                  return (
                    <tr key={nomination._id} className="cursor-pointer hover:bg-gray-50/70 border-b border-gray-200">
                      <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-left">
                        {nomination.employeeID || 'N/A'}
                      </td>
                      <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">
                        {nomination.nominationYear || 'N/A'}
                      </td>
                      <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">
                        {nomination.date || 'N/A'}
                      </td>
                      <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">
                        {nomination.createdOn || 'N/A'}
                      </td>
                      <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">
                        {nomination.createdBy || 'N/A'}
                      </td>
                      <td className="text-left px-3 md:px-5 py-2 whitespace-nowrap sticky right-0 bg-white z-10">
                        <div className="flex items-center justify-start gap-1">
                          {editMode && onEdit && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onEdit(nomination);
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
                                onDelete(nomination);
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
                                onView(nomination);
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
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 md:px-5 py-8 text-center text-sm text-gray-500">
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

