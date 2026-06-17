"use client"

import React from "react"
import { Edit, MoreVertical, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import type { EmployeeCategoryTrainingDetailsItem } from "./types"

interface EmployeeCategoryTrainingDetailsTableProps {
  data: EmployeeCategoryTrainingDetailsItem[]
  loading?: boolean
  currentPage: number
  totalCount: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onEdit?: (row: EmployeeCategoryTrainingDetailsItem) => void
  onDelete?: (row: EmployeeCategoryTrainingDetailsItem) => void
  onView?: (row: EmployeeCategoryTrainingDetailsItem) => void
  editMode?: boolean
  deleteMode?: boolean
  viewMode?: boolean
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
  } catch {
    return dateString
  }
}

export default function EmployeeCategoryTrainingDetailsTable({
  data,
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
}: EmployeeCategoryTrainingDetailsTableProps) {
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  return (
    <div className="px-8 py-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          <table className="w-full border-collapse" style={{ minWidth: "max-content", width: "100%" }}>
            <thead>
              <tr className="bg-gray-50/80 border-b-2 border-gray-300">
                <th className="min-w-[60px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center border-r-2 border-gray-300 sticky left-0 bg-gray-50/80 z-10">
                  #
                </th>
                <th className="min-w-[180px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center border-r border-gray-200">
                  Category Code
                </th>
                <th className="min-w-[140px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center border-r border-gray-200">
                  Training Code
                </th>
                <th className="min-w-[220px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center border-r border-gray-200">
                  Training Name
                </th>
                <th className="min-w-[130px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center border-r border-gray-200">
                  Start Date
                </th>
                <th className="min-w-[130px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center border-r border-gray-200">
                  End Date
                </th>
                <th className="min-w-[130px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center border-r border-gray-200">
                  Valid Till
                </th>
                <th className="min-w-[140px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center border-r border-gray-200">
                  Notify Prior Days
                </th>
                <th className="min-w-[140px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center border-r border-gray-200">
                  Blocking
                </th>
                <th className="min-w-[160px] px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center border-r border-gray-200">
                  Notification
                </th>
                <th className="w-[60px] min-w-[60px] text-left px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {data.length > 0 ? (
                data.flatMap((row, idx) => {
                  const trainings = Array.isArray(row.traninings) ? row.traninings : []

                  // If no trainings, still show a single row
                  if (trainings.length === 0) {
                    return (
                      <tr key={row._id || `${idx}`} className="bg-white border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-3 md:px-5 py-3 text-sm text-gray-900 text-center border-r-2 border-gray-300 bg-white sticky left-0 z-10">
                          {startIndex + idx + 1}
                        </td>
                        <td className="px-3 md:px-5 py-3 text-sm font-semibold text-gray-900 text-center border-r border-gray-200">
                          {row.employeeCategoryCode || "-"}
                        </td>
                        <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">-</td>
                        <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">-</td>
                        <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">-</td>
                        <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">-</td>
                        <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">-</td>
                        <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">-</td>
                        <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">-</td>
                        <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">-</td>
                        <td className="text-left px-3 md:px-5 py-2 whitespace-nowrap sticky right-0 bg-white z-10">
                          <div className="flex items-center justify-start gap-1">
                            {editMode && onEdit && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  onEdit(row)
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
                                  onDelete(row)
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
                                  onView(row)
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
                    )
                  }

                  const visibleTrainings = trainings.slice(0, 5)
                  const hasMore = trainings.length > visibleTrainings.length
                  const rowSpanCount = hasMore ? visibleTrainings.length + 1 : visibleTrainings.length

                  const rowsForCategory = visibleTrainings.map((t, tIndex) => (
                    <tr
                      key={`${row._id || idx}-${tIndex}`}
                      className="bg-white border-b border-gray-200 hover:bg-gray-50"
                    >
                      {/* Category index - show once per category */}
                      {tIndex === 0 && (
                        <td
                          rowSpan={rowSpanCount}
                          className="px-3 md:px-5 py-3 text-sm text-gray-900 text-center border-r-2 border-gray-300 bg-white sticky left-0 z-10 align-middle"
                        >
                          {startIndex + idx + 1}
                        </td>
                      )}

                      {/* Category Code - show once per category */}
                      {tIndex === 0 && (
                        <td
                          rowSpan={rowSpanCount}
                          className="px-3 md:px-5 py-3 text-sm font-semibold text-gray-900 text-center border-r border-gray-200 align-middle"
                        >
                          {row.employeeCategoryCode || "-"}
                        </td>
                      )}

                      <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">
                        {t?.trainingCode || "-"}
                      </td>
                      <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">
                        {t?.trainingName || "-"}
                      </td>
                      <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">
                        {formatDate(t?.startDate)}
                      </td>
                      <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">
                        {formatDate(t?.endDate)}
                      </td>
                      <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">
                        {formatDate(t?.validTill)}
                      </td>
                      <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">
                        {typeof t?.notifyPriorDays === "number" ? t.notifyPriorDays : "-"}
                      </td>
                      <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">
                        {typeof t?.blockingEnabled === "boolean" ? (t.blockingEnabled ? "Yes" : "No") : "-"}
                      </td>
                      <td className="px-3 md:px-5 py-3 text-sm text-gray-700 text-center border-r border-gray-200">
                        {typeof t?.notificationEnabled === "boolean" ? (t.notificationEnabled ? "Yes" : "No") : "-"}
                      </td>

                      {/* Action - show once per category */}
                      {tIndex === 0 && (
                        <td
                          rowSpan={rowSpanCount}
                          className="text-left px-3 md:px-5 py-2 whitespace-nowrap sticky right-0 bg-white z-10 align-middle"
                        >
                          <div className="flex items-center justify-start gap-1">
                            {editMode && onEdit && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  onEdit(row)
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
                                  onDelete(row)
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
                                  onView(row)
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
                  ))

                  if (!hasMore) {
                    return rowsForCategory
                  }

                  const remaining = trainings.length - visibleTrainings.length

                  // Summary "Read more" row (uses the same rowSpan as above via rowSpanCount)
                  rowsForCategory.push(
                    <tr
                      key={`${row._id || idx}-read-more`}
                      className="bg-slate-50 border-b border-gray-200 hover:bg-slate-100/70"
                    >
                      <td
                        colSpan={8}
                        className="px-3 md:px-5 py-2 text-xs text-blue-700 text-center border-r border-gray-200"
                      >
                        {remaining} more trainings not shown.&nbsp;
                        {onView && viewMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onView(row)
                            }}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline"
                          >
                            Read more
                          </button>
                        )}
                      </td>
                    </tr>
                  )

                  return rowsForCategory
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-3 md:px-5 py-8 text-center text-sm text-gray-500">
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
                              page === currentPage ? "bg-blue-600 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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
                          page === currentPage ? "bg-blue-600 text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
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


