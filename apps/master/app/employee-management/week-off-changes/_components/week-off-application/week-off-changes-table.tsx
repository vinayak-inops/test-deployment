"use client"

import React from "react"
import { Edit, Trash2, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react"

interface WeekOffItem {
  week: number
  weekOff: number[]
}

interface WeekOffChange {
  _id: string
  employeeID: string
  fromDate?: string
  toDate?: string
  weekOffs: WeekOffItem[]
  organizationCode?: string
  tenantCode?: string
  isActive?: boolean
}

interface WeekOffChangesTableProps {
  employeeData: WeekOffChange[]
  loading?: boolean
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onEdit?: (employee: WeekOffChange) => void
  onDelete?: (employee: WeekOffChange) => void
  onView?: (employee: WeekOffChange) => void
  editMode?: boolean
  deleteMode?: boolean
  viewMode?: boolean
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

function formatWeekOff(arr: number[]) {
  if (!Array.isArray(arr) || arr.length === 0) return "—"
  return arr
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES[d - 1] ?? String(d))
    .join(", ")
}

export default function WeekOffChangesTable({
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
}: WeekOffChangesTableProps) {
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      if (Number.isNaN(date.getTime())) return dateString
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch {
      return dateString
    }
  }

  return (
    <div className="">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full border-collapse" style={{ minWidth: "max-content", width: "100%" }}>
            <thead>
              <tr className="bg-gray-50/80 border-b-2 border-gray-300">
                <th className="min-w-[140px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  Employee ID
                </th>
                <th className="min-w-[120px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  From Date
                </th>
                <th className="min-w-[120px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  To Date
                </th>
                <th className="min-w-[360px] px-3 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                  Week Offs
                </th>
                <th className="w-[60px] min-w-[60px] text-left px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {employeeData.length > 0 ? (
                employeeData.map((employee) => (
                  <tr key={employee._id} className="bg-white border-b border-gray-200 hover:bg-gray-50 align-top">
                    <td className="px-3 py-2 text-sm text-gray-700 text-center border-r border-gray-200">
                      {employee.employeeID || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 text-center border-r border-gray-200">
                      {formatDate(employee.fromDate)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 text-center border-r border-gray-200">
                      {formatDate(employee.toDate)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-700 text-center border-r border-gray-200">
                      {Array.isArray(employee.weekOffs) && employee.weekOffs.length > 0 ? (
                        <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="w-[90px] min-w-[90px] px-3 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide text-center border-r border-gray-200">
                                  Week
                                </th>
                                <th className="px-3 py-1.5 text-[11px] font-semibold text-gray-600 uppercase tracking-wide text-center">
                                  Week Off
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {employee.weekOffs.map((w, idx) => (
                                <tr key={`${employee._id}-week-${idx}`} className="border-b border-gray-100 last:border-b-0">
                                  <td className="w-[90px] min-w-[90px] px-3 py-2 text-xs text-gray-900 text-center border-r border-gray-200">
                                    {w?.week ?? "-"}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-gray-900 text-center">
                                    {formatWeekOff(Array.isArray(w?.weekOff) ? w.weekOff : [])}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No week offs</span>
                      )}
                    </td>
                    <td className="text-left px-3 md:px-5 py-2 whitespace-nowrap sticky right-0 bg-white z-10 align-top">
                      <div className="flex items-center justify-start gap-1">
                        {editMode && onEdit && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onEdit(employee)
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
                              e.preventDefault()
                              e.stopPropagation()
                              onDelete(employee)
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
                              e.preventDefault()
                              e.stopPropagation()
                              onView(employee)
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
                  <td colSpan={5} className="px-3 md:px-5 py-8 text-center text-sm text-gray-500">
                    {loading ? "Loading..." : "No data available"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
                    if (page === 1 || page === totalPages) return true
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true
                    return false
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
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      )
                    }
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => onPageChange(page)}
                        className={`h-7 w-7 p-0 flex items-center justify-center rounded-md text-xs font-medium ${
                          page === currentPage
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
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
  )
}
