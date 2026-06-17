"use client"

import React, { useState } from 'react'
import { CheckCircle, Clock, XCircle, Calendar, User, Eye, ChevronLeft, ChevronRight, MessageSquare, LogIn, ArrowUpDown } from 'lucide-react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Application {
  _id: string
  employeeID: string
  attendanceDate: string
  status: string
  workflowState: string
  uploadedBy: string
  createdOn: string
  remarks: string
  inOut: string
  typeOfMovement: string
  punchedTime: string
  transactionTime: string
}

interface ApplicationTableProps {
  data: Application[]
  onOpenDetails: (row: Application) => void
  loading?: boolean
  userMode?: 'user' | 'approver'
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

export default function ApplicationTable({ data, onOpenDetails, loading = false, externalPagination }: ApplicationTableProps) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1)
  const itemsPerPage = externalPagination?.itemsPerPage ?? 10

  // Decide which pagination mode to use
  const useExternal = !!externalPagination
  const currentPage = useExternal ? externalPagination!.currentPage : internalCurrentPage
  const totalPages = useExternal ? externalPagination!.totalPages : Math.ceil(data.length / itemsPerPage)
  const startIndex = useExternal ? externalPagination!.startIndex : (currentPage - 1) * itemsPerPage
  const endIndex = useExternal ? externalPagination!.endIndex : startIndex + itemsPerPage
  const totalItems = useExternal ? externalPagination!.totalItems : data.length
  const handlePageChange = useExternal ? externalPagination!.onPageChange : setInternalCurrentPage

  const currentData = useExternal ? data : data.slice(startIndex, endIndex)
  
  const getStatusBadge = (status: string) => {
    // Default to Pending if no status provided
    if (!status) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
    
    const statusUpper = status.toUpperCase()
    
    // Completed states that should be excluded (matching filter logic: nin operator)
    // Only exact matches count as completed states (e.g., "L1_APPROVED" is NOT "APPROVED")
    const completedStates = ['APPROVED', 'REJECTED', 'CANCELLED', 'CANCEL', 'FAILED']
    // Check if status is NOT equal to any completed state (exact match only)
    const isNotCompletedState = !completedStates.some(completedState => 
      statusUpper === completedState
    )

    
    // If NOT a completed state (NOT equal to APPROVED, REJECTED, CANCELLED, FAILED), show the actual workflowState
    if (isNotCompletedState) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
          <Clock className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      )
    }
    
    // Check for completed states (APPROVED, REJECTED, CANCELLED, FAILED)
    // Use exact match to avoid matching states like "L1_APPROVED"
    if (statusUpper === 'APPROVED') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    }
    if (statusUpper === 'REJECTED') {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    }
    if (statusUpper === 'CANCELLED' || statusUpper === 'CANCEL') {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      )
    }
    if (statusUpper === 'FAILED') {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    }
    
    // Fallback
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
        <Clock className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
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

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-5 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700 mb-0">
              Punch Applications
            </CardTitle>
            <span className="text-sm font-normal text-muted-foreground">
              {totalItems} application{totalItems !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {loading ? (
            <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="bg-blue-50 hover:bg-blue-50">
                    <TableHead className="w-[60px] px-5 py-2 whitespace-nowrap text-sm">Sl No</TableHead>
                    <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">Employee ID</TableHead>
                    <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">Attendance Date</TableHead>
                    <TableHead className="w-[80px] px-5 py-2 whitespace-nowrap text-sm">In/Out</TableHead>
                    <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">Type of Movement</TableHead>
                    <TableHead className="w-[100px] px-5 py-2 whitespace-nowrap text-sm">Punch Time</TableHead>
                    <TableHead className="w-[110px] px-5 py-2 whitespace-nowrap text-sm">Status</TableHead>
                    <TableHead className="w-[200px] px-5 py-2 whitespace-nowrap text-sm">Remarks</TableHead>
                    <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">Applied By</TableHead>
                    <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">Created On</TableHead>
                    <TableHead className="w-[60px] text-right px-5 py-2 whitespace-nowrap text-sm sticky right-0 bg-blue-50 border-l z-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
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
                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 text-sm">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
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
              <p className="text-sm text-muted-foreground">No punch applications found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow className="bg-blue-50 hover:bg-blue-50">
                      <TableHead className="w-[60px] px-5 py-2 whitespace-nowrap text-sm">Sl No</TableHead>
                      <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">Employee ID</TableHead>
                      <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">Attendance Date</TableHead>
                      <TableHead className="w-[80px] px-5 py-2 whitespace-nowrap text-sm">In/Out</TableHead>
                      <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">Type of Movement</TableHead>
                      <TableHead className="w-[100px] px-5 py-2 whitespace-nowrap text-sm">Punch Time</TableHead>
                      <TableHead className="w-[110px] px-5 py-2 whitespace-nowrap text-sm">Status</TableHead>
                      <TableHead className="w-[200px] px-5 py-2 whitespace-nowrap text-sm">Remarks</TableHead>
                      <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">Applied By</TableHead>
                      <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">Created On</TableHead>
                      <TableHead className="w-[60px] text-right px-5 py-2 whitespace-nowrap text-sm sticky right-0 bg-blue-50 border-l z-10">Actions</TableHead>
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
                          {formatDate(row.attendanceDate)}
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <LogIn className="h-3 w-3 mr-1" />
                            {row.inOut || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate px-5 py-2 whitespace-nowrap text-sm">
                          {row.typeOfMovement || '-'}
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatTime(row.punchedTime)}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {getStatusBadge(row.workflowState || row.status)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate px-5 py-2 text-sm">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{row.remarks || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.uploadedBy || '-'}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.createdOn)}</TableCell>
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
                <div className="flex items-center justify-between  px-5 py-2 pb-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
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
                                <span className="px-2">...</span>
                                <Button
                                  variant={page === currentPage ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(page)}
                                  className="h-7 w-7 p-0"
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            )
                          }
                          return (
                            <Button
                              key={page}
                              variant={page === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              className="h-7 w-7 p-0"
                            >
                              {page}
                            </Button>
                          )
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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