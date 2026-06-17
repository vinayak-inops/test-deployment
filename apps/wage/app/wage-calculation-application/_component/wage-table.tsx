"use client"

import React from "react"
import { CheckCircle, Clock, XCircle, Calendar, Eye, Loader2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/* =======================
   Types (ONLY REQUIRED)
======================= */

interface Application {
  _id: string
  employeeID?: string
  employeeIDList?: string[]
  appliedDate?: string
  fromDate: string
  toDate: string
   month?: number
   year?: number
  remarks?: string
  status?: string
  workflowState: string
  // Role-based selection metadata
  selectAll?: boolean
  designation?: {
    designationCode?: string | null
    designationName?: string | null
  }
  grade?: string[]
  employeeCategory?: string[]
}

interface ApplicationTableProps {
  data: Application[]
  onOpenDetails: (row: Application) => void
  isLoading?: boolean
  externalPagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    startIndex: number
    endIndex: number
    onPageChange: (page: number) => void
  }
}

/* =======================
   UI HELPERS
======================= */

const getStatusBadge = (status?: string) => {
  const s = status?.toUpperCase() || "PENDING"

  if (s === "APPROVED")
    return (
      <Badge className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Approved
      </Badge>
    )

  if (s === "REJECTED")
    return (
      <Badge className="bg-red-50 text-red-700 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Rejected
      </Badge>
    )

  return (
    <Badge className="bg-blue-50 text-blue-700 border-blue-200">
      <Clock className="h-3 w-3 mr-1" />
      Pending
    </Badge>
  )
}

/* =======================
   Component
======================= */

export default function ApplicationTable({
  data,
  onOpenDetails,
  isLoading = false,
  externalPagination,
}: ApplicationTableProps) {
  const totalItems = externalPagination?.totalItems ?? data.length
  const startIndex = externalPagination?.startIndex ?? 0
  const pagination = externalPagination

  return (
    <Card>
      <CardHeader className="border-b px-5 py-2 bg-gray-50/50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold">
            Wage Calculation Applications
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${totalItems} applications`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading applications...
            </p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No applications found
            </p>
          </div>
        ) : (
          <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="px-5 py-2 min-w-[90px] whitespace-nowrap">Sl No</TableHead>
                  <TableHead className="px-5 py-2 min-w-[180px] whitespace-nowrap">Employee ID(s)</TableHead>
                  <TableHead className="px-5 py-2 min-w-[130px] whitespace-nowrap">Applied Date</TableHead>
                  <TableHead className="px-5 py-2 whitespace-nowrap">Month</TableHead>
                  <TableHead className="px-5 py-2 whitespace-nowrap">Year</TableHead>
                  <TableHead className="px-5 py-2 min-w-[200px] whitespace-nowrap">Remarks</TableHead>
                  <TableHead className="px-5 py-2 whitespace-nowrap">Status</TableHead>
                  <TableHead className="px-5 py-2 text-right sticky right-0 bg-blue-50 border-l z-10 whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.map((row, index) => (
                  <TableRow
                    key={row._id}
                    onClick={() => onOpenDetails(row)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell className="px-5 py-2">
                      {startIndex + index + 1}
                    </TableCell>

                    <TableCell className="px-5 py-2 font-medium">
                      {(() => {
                        const ids = (
                          row.employeeIDList && row.employeeIDList.length > 0
                            ? row.employeeIDList
                            : row.employeeID
                            ? [row.employeeID]
                            : []
                        ) as string[]

                        // If explicit IDs exist, show them with read-more
                        if (ids.length > 0) {
                          if (ids.length <= 5) {
                            return ids.join(", ")
                          }

                          const visible = ids.slice(0, 5)
                          const remaining = ids.length - 5
                          return (
                            <span className="text-sm text-gray-900">
                              {visible.join(", ")}{" "}
                              <button
                                type="button"
                                className="text-xs text-blue-600 hover:underline ml-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onOpenDetails(row)
                                }}
                              >
                                +{remaining} more (Read more)
                              </button>
                            </span>
                          )
                        }

                        // If no IDs and selectAll is true, show role criteria summary
                        if (row.selectAll) {
                          const designationLabel =
                            row.designation?.designationCode ||
                            row.designation?.designationName ||
                            "-"
                          const grades = Array.isArray(row.grade) ? row.grade : []
                          const categories = Array.isArray(row.employeeCategory) ? row.employeeCategory : []

                          const makeList = (values: string[], label: string) => {
                            if (!values.length) return `${label}: -`
                            if (values.length <= 3) return `${label}: ${values.join(", ")}`
                            const visible = values.slice(0, 3).join(", ")
                            const remaining = values.length - 3
                            return `${label}: ${visible} +${remaining} more`
                          }

                          const summaryParts = [
                            `Designation: ${designationLabel || "-"}`,
                            makeList(grades, "Grades"),
                            makeList(categories, "employeeCategory"),
                          ]

                          return (
                            <span className="text-sm text-gray-900">
                              {summaryParts.join(" | ")}{" "}
                              <button
                                type="button"
                                className="text-xs text-blue-600 hover:underline ml-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onOpenDetails(row)
                                }}
                              >
                                Read more
                              </button>
                            </span>
                          )
                        }

                        return "-"
                      })()}
                    </TableCell>

                    <TableCell className="px-5 py-2">
                      {row.appliedDate || "-"}
                    </TableCell>

                    <TableCell className="px-5 py-2">
                      {row.month ?? (row.appliedDate ? new Date(row.appliedDate).getMonth() + 1 : "-")}
                    </TableCell>

                    <TableCell className="px-5 py-2">
                      {row.year ?? (row.appliedDate ? new Date(row.appliedDate).getFullYear() : "-")}
                    </TableCell>

                    <TableCell className="px-5 py-2 max-w-[260px] truncate">
                      {row.remarks || "-"}
                    </TableCell>
                    <TableCell className="px-5 py-2">
                      {getStatusBadge(row.status || row.workflowState)}
                    </TableCell>
                    <TableCell
                      className="px-5 py-2 text-right sticky right-0 bg-white border-l z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenDetails(row)}
                        className="h-7 w-7"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-2 pb-3 border-t text-xs text-muted-foreground">
          <div>
            Showing {pagination.startIndex + 1} to {Math.min(pagination.endIndex, pagination.totalItems)} of{" "}
            {pagination.totalItems} entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center border rounded disabled:opacity-50"
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
            >
              {"<"}
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (page === 1 || page === pagination.totalPages) return true
                  if (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1) return true
                  return false
                })
                .map((page, index, array) => {
                  if (index > 0 && page - array[index - 1] > 1) {
                    return (
                      <React.Fragment key={page}>
                        <span className="px-1">...</span>
                        <button
                          type="button"
                          className={`h-7 w-7 flex items-center justify-center border rounded ${
                            page === pagination.currentPage ? "bg-blue-600 text-white" : "bg-white"
                          }`}
                          onClick={() => pagination.onPageChange(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    )
                  }
                  return (
                    <button
                      key={page}
                      type="button"
                      className={`h-7 w-7 flex items-center justify-center border rounded ${
                        page === pagination.currentPage ? "bg-blue-600 text-white" : "bg-white"
                      }`}
                      onClick={() => pagination.onPageChange(page)}
                    >
                      {page}
                    </button>
                  )
                })}
            </div>
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center border rounded disabled:opacity-50"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() =>
                pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage - 1 + 2))
              }
            >
              {">"}
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
