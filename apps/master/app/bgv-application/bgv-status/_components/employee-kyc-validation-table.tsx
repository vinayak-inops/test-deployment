"use client";

import React from 'react';
import { Edit, Trash2, MoreVertical, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface EmployeeKycValidation {
  _id: string;
  employeeID: string;
  systemFirstName: string;
  systemMiddleName: string;
  systemLastName: string;
  systemPanNumber: string;
  systemUanNumber: string;
  equalPanStatus: string;
  equalUanStatus: string;
  equalAadharStatus: string;
  aadharNameVerificationResult: string;
  panVerificationMessage: string;
  uanVerificationMessage: string;
  aadharVerificationMessage: string;
  createdOn?: string;
  createdBy?: string;
}

interface EmployeeKycValidationTableProps {
  kycData: EmployeeKycValidation[];
  loading?: boolean;
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onEdit?: (record: EmployeeKycValidation) => void;
  onDelete?: (record: EmployeeKycValidation) => void;
  onView?: (record: EmployeeKycValidation) => void;
  editMode?: boolean;
  deleteMode?: boolean;
  viewMode?: boolean;
}

function StatusBadge({ status }: { status: string }) {
  const upper = (status || '').toUpperCase();

  if (upper === 'VERIFIED' || upper === 'NAME VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="h-3 w-3" />
        {status}
      </span>
    );
  }

  if (upper === 'CHECKED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <CheckCircle2 className="h-3 w-3" />
        {status}
      </span>
    );
  }

  if (upper === 'FAILED' || upper === 'REJECTED' || upper === 'MISMATCH') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
        <XCircle className="h-3 w-3" />
        {status}
      </span>
    );
  }

  if (upper === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
        <Clock className="h-3 w-3" />
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
      {status || 'N/A'}
    </span>
  );
}

export default function EmployeeKycValidationTable({
  kycData,
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
}: EmployeeKycValidationTableProps) {
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const fullName = (record: EmployeeKycValidation) =>
    [record.systemFirstName, record.systemMiddleName, record.systemLastName]
      .filter(Boolean)
      .join(' ') || 'N/A';

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
                <th className="min-w-[130px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Employee ID
                </th>
                <th className="min-w-[180px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Full Name
                </th>
                <th className="min-w-[150px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  PAN Number
                </th>
                <th className="min-w-[160px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  UAN Number
                </th>
                <th className="min-w-[140px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  PAN Status
                </th>
                <th className="min-w-[140px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  UAN Status
                </th>
                <th className="min-w-[150px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Aadhaar Status
                </th>
                {/* <th className="min-w-[190px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-left">
                  Aadhaar Name Result
                </th> */}
                <th className="w-[60px] min-w-[60px] text-left px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                  Action
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {kycData.length > 0 ? (
                kycData.map((record, index) => (
                  <tr
                    key={record._id}
                    className="cursor-pointer hover:bg-gray-50/70 border-b border-gray-200"
                  >
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-left">
                      {record.employeeID || 'N/A'}
                    </td>
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left">
                      {fullName(record)}
                    </td>
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left font-mono tracking-wide">
                      {record.systemPanNumber || 'N/A'}
                    </td>
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-sm font-normal text-gray-700 text-left font-mono tracking-wide">
                      {record.systemUanNumber || 'N/A'}
                    </td>
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-left">
                      <StatusBadge status={record.equalPanStatus} />
                    </td>
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-left">
                      <StatusBadge status={record.equalUanStatus} />
                    </td>
                    <td className="px-3 md:px-5 py-2 whitespace-nowrap text-left">
                      <StatusBadge status={record.equalAadharStatus} />
                    </td>
                    {/* <td className="px-3 md:px-5 py-2 whitespace-nowrap text-left">
                      <StatusBadge status={record.aadharNameVerificationResult} />
                    </td> */}
                    <td className="text-left px-3 md:px-5 py-2 whitespace-nowrap sticky right-0 bg-white z-10">
                      <div className="flex items-center justify-start gap-1">
                        {editMode && onEdit && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEdit(record);
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
                              onDelete(record);
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
                              onView(record);
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
                  <td colSpan={10} className="px-3 md:px-5 py-8 text-center text-sm text-gray-500">
                    {loading ? 'Loading...' : 'No KYC validation records found'}
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
                  .filter((page) => {
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