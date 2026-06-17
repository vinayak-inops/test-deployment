"use client"

import React, { useMemo, useState } from "react"
import { CheckCircle, Clock, XCircle, Calendar, User, Eye } from "lucide-react"
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

interface CompoffApplication {
  _id: string
  employeeID: string
  fromDate: string
  toDate: string
  fromDuration: string
  toDuration: string
  availForDates?: string[]
  workflowState: string
  remarks?: string
  createdOn: string
}

interface ApplicationTableProps {
  data: CompoffApplication[]
  onOpenDetails: (row: CompoffApplication) => void
  loading?: boolean
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

export default function CompoffApplicationTable({
  data,
  onOpenDetails,
  loading = false,
  externalPagination,
}: ApplicationTableProps) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1)
  const itemsPerPage = externalPagination?.itemsPerPage ?? 10

  const useExternal = !!externalPagination
  const currentPage = useExternal ? externalPagination!.currentPage : internalCurrentPage
  const totalPages = useExternal ? externalPagination!.totalPages : Math.ceil(data.length / itemsPerPage)
  const startIndex = useExternal ? externalPagination!.startIndex : (currentPage - 1) * itemsPerPage
  const endIndex = useExternal ? externalPagination!.endIndex : startIndex + itemsPerPage
  const totalItems = useExternal ? externalPagination!.totalItems : data.length
  const handlePageChange = useExternal ? externalPagination!.onPageChange : setInternalCurrentPage

  const currentData = useMemo(() => {
    if (useExternal) return data
    return data.slice(startIndex, endIndex)
  }, [useExternal, data, startIndex, endIndex])

  const getStatusBadge = (status: string) => {
    const statusUpper = status?.toUpperCase() || "PENDING"

    if (statusUpper === "APPROVED") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    }
    if (statusUpper === "REJECTED") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    }
    if (statusUpper === "CANCELLED" || statusUpper === "CANCEL") {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      )
    }
    if (statusUpper === "FAILED") {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 hover:bg-red-150">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
        <Clock className="h-3 w-3 mr-1" />
        {statusUpper}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-5 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700 mb-0">
              Comp Off Applications
            </CardTitle>
            <span className="text-sm font-normal text-muted-foreground">
              {totalItems} request{totalItems !== 1 ? "s" : ""}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow className="bg-blue-50 hover:bg-blue-50">
                    <TableHead className="w-[60px] px-5 py-2 whitespace-nowrap text-sm">Sl No</TableHead>
                    <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">Employee ID</TableHead>
                    <TableHead className="w-[160px] px-5 py-2 whitespace-nowrap text-sm">From</TableHead>
                    <TableHead className="w-[160px] px-5 py-2 whitespace-nowrap text-sm">To</TableHead>
                    <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">Avail For</TableHead>
                    <TableHead className="w-[110px] px-5 py-2 whitespace-nowrap text-sm">Status</TableHead>
                    <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">Created On</TableHead>
                    <TableHead className="w-[220px] px-5 py-2 whitespace-nowrap text-sm">Remarks</TableHead>
                    <TableHead className="w-[60px] text-right px-5 py-2 whitespace-nowrap text-sm sticky right-0 bg-blue-50 border-l z-10">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`loading-${index}`} className="hover:bg-gray-50/70">
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="text-right px-5 py-2 whitespace-nowrap sticky right-0 bg-white border-l z-10">
                        <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No Applications</h3>
              <p className="text-sm text-muted-foreground">No comp off applications found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <Table className="min-w-[1100px]">
                  <TableHeader>
                    <TableRow className="bg-blue-50 hover:bg-blue-50">
                      <TableHead className="w-[60px] px-5 py-2 whitespace-nowrap text-sm">Sl No</TableHead>
                      <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">Employee ID</TableHead>
                      <TableHead className="w-[160px] px-5 py-2 whitespace-nowrap text-sm">From</TableHead>
                      <TableHead className="w-[160px] px-5 py-2 whitespace-nowrap text-sm">To</TableHead>
                      <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">Avail For</TableHead>
                      <TableHead className="w-[110px] px-5 py-2 whitespace-nowrap text-sm">Status</TableHead>
                      <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">Created On</TableHead>
                      <TableHead className="w-[220px] px-5 py-2 whitespace-nowrap text-sm">Remarks</TableHead>
                      <TableHead className="w-[60px] text-right px-5 py-2 whitespace-nowrap text-sm sticky right-0 bg-blue-50 border-l z-10">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((row, index) => (
                      <TableRow
                        key={row._id || index}
                        className="cursor-pointer hover:bg-gray-50/70"
                        onClick={() => onOpenDetails(row)}
                      >
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium px-5 py-2 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {row.employeeID}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {formatDate(row.fromDate)} ({row.fromDuration})
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {formatDate(row.toDate)} ({row.toDuration})
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {row.availForDates && row.availForDates.length > 0
                            ? row.availForDates.map(formatDate).join(", ")
                            : "-"}
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {getStatusBadge(row.workflowState)}
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {formatDate(row.createdOn)}
                        </TableCell>
                        <TableCell
                          className="max-w-[220px] px-5 py-2 whitespace-nowrap text-sm truncate"
                          title={row.remarks || ""}
                        >
                          {row.remarks || "-"}
                        </TableCell>
                        <TableCell className="text-right px-5 py-2 whitespace-nowrap sticky right-0 bg-white border-l z-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              onOpenDetails(row)
                            }}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-2 pb-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


