"use client"

import React from 'react'
import { CheckCircle, Clock, XCircle, Calendar, User, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
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

interface Application {
  _id: string
  employeeID: string
  punchedTime: string
  transactionTime: string
  inOut: string
  typeOfMovement: string
  newAttendanceDate: string
  attendanceDate: string
  remarks: string
  workflowState?: string
  status?: string
}

interface ApplicationTableProps {
  data: Application[]
  loading: boolean
  searchValue: string
  currentPage: number
  itemsPerPage: number
  totalPages: number
  startIndex: number
  endIndex: number
  totalItems: number
  onPageChange: (page: number) => void
  onOpenDetails: (row: Application) => void
}

export default function ApplicationTable({
  data,
  loading,
  searchValue,
  currentPage,
  itemsPerPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPageChange,
  onOpenDetails,
}: ApplicationTableProps) {
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-'
    return timeStr.split('T')[1]?.substring(0, 5) || timeStr.substring(0, 5)
  }

  const getStatusBadge = (status: string) => {
    const s = (status || '').toString().toUpperCase()
    if (s === 'APPROVED') return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
        <CheckCircle className="h-3 w-3 mr-1" />Approved
      </Badge>
    )
    if (s === 'REJECTED') return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
        <XCircle className="h-3 w-3 mr-1" />Rejected
      </Badge>
    )
    if (s === 'CANCELLED' || s === 'CANCEL') return (
      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200">
        <XCircle className="h-3 w-3 mr-1" />Cancelled
      </Badge>
    )
    if (s === 'FAILED') return (
      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">
        <XCircle className="h-3 w-3 mr-1" />Failed
      </Badge>
    )
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
        <Clock className="h-3 w-3 mr-1" />{status || 'Pending'}
      </Badge>
    )
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-5 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700 mb-0">
              Edit Punch Applications
            </CardTitle>
            <span className="text-sm font-normal text-muted-foreground">
              {totalItems} application{totalItems !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow className="bg-blue-50 hover:bg-blue-50">
                    <TableHead className="w-[60px] px-5 py-2 whitespace-nowrap text-sm">Sl No</TableHead>
                    <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1">Employee ID</span>
                    </TableHead>
                    <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1">Punched Time</span>
                    </TableHead>
                    <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1">Transaction Time</span>
                    </TableHead>
                    <TableHead className="w-[100px] px-5 py-2 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1">In/Out</span>
                    </TableHead>
                    <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1">Movement Type</span>
                    </TableHead>
                    <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1">Attendance Date</span>
                    </TableHead>
                    <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1">New Attendance Date</span>
                    </TableHead>
                    <TableHead className="w-[240px] px-5 py-2 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1">Remarks</span>
                    </TableHead>
                    <TableHead className="w-[110px] px-5 py-2 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1">Status</span>
                    </TableHead>
                    <TableHead className="w-[60px] text-right px-5 py-2 whitespace-nowrap text-sm sticky right-0 bg-blue-50 border-l z-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={`loading-${index}`} className="hover:bg-gray-50/70">
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 text-sm">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="text-right px-5 py-2 whitespace-nowrap sticky right-0 bg-white border-l z-10">
                        <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
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
              <p className="text-sm text-muted-foreground">
                {searchValue ? "No applications found matching your search" : "No punch applications found"}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full animate-in fade-in duration-300">
                <Table className="min-w-[1000px]">
                  <TableHeader>
                    <TableRow className="bg-blue-50 hover:bg-blue-50">
                      <TableHead className="w-[60px] px-5 py-2 whitespace-nowrap text-sm">Sl No</TableHead>
                      <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center gap-1">Employee ID</span>
                      </TableHead>
                      <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center gap-1">Punched Time</span>
                      </TableHead>
                      <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center gap-1">Transaction Time</span>
                      </TableHead>
                      <TableHead className="w-[100px] px-5 py-2 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center gap-1">In/Out</span>
                      </TableHead>
                      <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center gap-1">Movement Type</span>
                      </TableHead>
                      <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center gap-1">Attendance Date</span>
                      </TableHead>
                      <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center gap-1">New Attendance Date</span>
                      </TableHead>
                      <TableHead className="w-[240px] px-5 py-2 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center gap-1">Remarks</span>
                      </TableHead>
                      <TableHead className="w-[110px] px-5 py-2 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center gap-1">Status</span>
                      </TableHead>
                      <TableHead className="w-[60px] text-right px-5 py-2 whitespace-nowrap text-sm sticky right-0 bg-blue-50 border-l z-10">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow
                        key={row._id || `row-${index}`}
                        className="cursor-pointer hover:bg-gray-50/70 transition-colors duration-150"
                        onClick={() => onOpenDetails(row)}
                      >
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium px-5 py-2 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {row.employeeID}
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatTime(row.punchedTime)}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatTime(row.transactionTime)}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.inOut || '-'}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.typeOfMovement || '-'}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.attendanceDate)}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.newAttendanceDate)}</TableCell>
                        <TableCell className="max-w-[240px] px-5 py-2 whitespace-nowrap text-sm truncate" title={row.remarks || ''}>
                          {row.remarks || '-'}
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {getStatusBadge(row.status || row.workflowState || '')}
                        </TableCell>
                        <TableCell className="text-right px-5 py-2 whitespace-nowrap sticky right-0 bg-white border-l z-10">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onOpenDetails(row);
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
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        goToPage(Math.max(1, currentPage - 1));
                      }}
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center h-7 w-7 p-0 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (page === 1 || page === totalPages) return true
                          if (page >= currentPage - 1 && page <= currentPage + 1) return true
                          return false
                        })
                        .map((page, index, array) => {
                          if (index > 0 && page - array[index - 1] > 1) {
                            return (
                              <React.Fragment key={page}>
                                <span className="px-2 text-gray-500">...</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    goToPage(page);
                                  }}
                                  className={`h-7 w-7 px-0 py-0 text-sm font-medium rounded-lg transition-colors ${
                                    currentPage === page
                                      ? "bg-blue-600 text-white"
                                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                  }`}
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
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                goToPage(page);
                              }}
                              className={`h-7 w-7 px-0 py-0 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === page
                                  ? "bg-blue-600 text-white"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          )
                        })}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        goToPage(Math.min(totalPages, currentPage + 1));
                      }}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center justify-center h-7 w-7 p-0 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
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
