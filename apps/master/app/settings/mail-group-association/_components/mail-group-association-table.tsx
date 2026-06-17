"use client"

import { Edit, MoreVertical, Loader2, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface MailGroupRow {
  _id: string
  mailGroup: string
  primaryEmail: string
  ccEmail: string
  createdOn: string
  createdBy: string
  raw: any
}

interface MailGroupAssociationTableProps {
  loading?: boolean
  rows: MailGroupRow[]
  startIndex: number
  totalItems: number
  endIndex: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  canEdit?: boolean
  canView?: boolean
  onEdit?: (row: any) => void
  onView?: (row: any) => void
}

export default function MailGroupAssociationTable({
  loading = false,
  rows,
  startIndex,
  totalItems,
  endIndex,
  currentPage,
  totalPages,
  onPageChange,
  canEdit = false,
  canView = false,
  onEdit,
  onView,
}: MailGroupAssociationTableProps) {
  return (
    <div className="px-8 py-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading associations...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No associations found</p>
          </div>
        ) : (
          <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
                  <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Sl No</TableHead>
                  <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Mail Group</TableHead>
                  <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Primary Email</TableHead>
                  <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">CC Email</TableHead>
                  <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={row._id} className="hover:bg-gray-50/70 border-b border-gray-200">
                    <TableCell className="px-5 py-2">{startIndex + index + 1}</TableCell>
                    <TableCell className="px-5 py-2 font-medium">{row.mailGroup}</TableCell>
                    <TableCell className="px-5 py-2 text-sm">{row.primaryEmail}</TableCell>
                    <TableCell className="px-5 py-2 text-sm">{row.ccEmail}</TableCell>
                    <TableCell className="px-5 py-2 sticky right-0 bg-white z-10" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit?.(row.raw)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canView && (
                          <button
                            type="button"
                            onClick={() => onView?.(row.raw)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="View"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-600">
              {totalItems > 0 ? (
                <>Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries</>
              ) : (
                <>No entries found</>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(page)}
                            className={`h-7 w-7 p-0 text-xs font-medium ${
                              page === currentPage
                                ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </Button>
                        </div>
                      )
                    }
                    return (
                      <Button
                        key={page}
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className={`h-7 w-7 p-0 text-xs font-medium ${
                          page === currentPage
                            ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </Button>
                    )
                  })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
