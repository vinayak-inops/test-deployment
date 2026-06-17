"use client"

import React, { useMemo, useState } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ColumnSortMenu from "@/components/table/column-sort-menu"

interface Application {
  _id: string
  tenantCode?: string
  workflowName?: string
  stateEvent?: string
  uploadedBy: string
  createdOn: string
  employeeID: string
  fromDate?: string
  toDate?: string
  uploadTime?: string
  organizationCode?: string
  appliedDate?: string
  workflowState: string
  remarks?: string
}

interface ApplicationTableProps {
  data: Application[]
  onOpenDetails: (row: Application) => void
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

export default function ApplicationTable({ data, onOpenDetails, loading = false, externalPagination }: ApplicationTableProps) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1)
  const itemsPerPage = externalPagination?.itemsPerPage ?? 10
  const [sortKey, setSortKey] = useState<keyof Application>('createdOn')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  
  // Decide which pagination mode to use
  const useExternal = !!externalPagination
  const currentPage = useExternal ? externalPagination!.currentPage : internalCurrentPage
  const totalPages = useExternal ? externalPagination!.totalPages : Math.ceil(data.length / itemsPerPage)
  const startIndex = useExternal ? externalPagination!.startIndex : (currentPage - 1) * itemsPerPage
  const endIndex = useExternal ? externalPagination!.endIndex : startIndex + itemsPerPage
  const totalItems = useExternal ? externalPagination!.totalItems : data.length
  const handlePageChange = useExternal ? externalPagination!.onPageChange : setInternalCurrentPage

  const parseDMY = (v?: string) => {
    if (!v) return 0
    if (/^\d{2}-\d{2}-\d{4}$/.test(v)) {
      const [dd, mm, yyyy] = v.split('-').map(Number)
      return new Date(yyyy, (mm as number) - 1, dd as number).getTime()
    }
    const t = Date.parse(v)
    return Number.isNaN(t) ? 0 : t
  }

  const getValue = (row: Application, key: keyof Application): any => {
    switch (key) {
      case 'createdOn':
      case 'appliedDate':
      case 'uploadTime':
        return parseDMY(row[key] as string)
      // no numeric fields now
      case 'fromDate':
      case 'toDate':
        return parseDMY(row[key] as string)
      default:
        return (row[key] ?? '').toString().toLowerCase()
    }
  }

  // Only sort when using internal pagination (external pagination means data is already sorted on server)
  const sortedData = useMemo(() => {
    if (useExternal) {
      // When using external pagination, data is already sorted on server, return as-is
      return data
    }
    // When using internal pagination, sort the data
    const copy = [...data]
    copy.sort((a, b) => {
      const va = getValue(a, sortKey)
      const vb = getValue(b, sortKey)
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [data, sortKey, sortDir, useExternal])

  const currentData = useExternal ? sortedData : sortedData.slice(startIndex, endIndex)

  const toggleSort = (key: keyof Application) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    handlePageChange(1)
  }
  
  const getStatusBadge = (status: string) => {
    // Display the workflowState exactly as it comes from the backend
    const displayStatus = status || '-'
    const statusUpper = status?.toUpperCase() || ''
    
    // Apply conditional styling based on status while displaying exact backend value
    if (statusUpper.includes('APPROVED')) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          {displayStatus}
        </Badge>
      )
    }
    if (statusUpper.includes('REJECTED')) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          {displayStatus}
        </Badge>
      )
    }
    if (statusUpper.includes('CANCELLED') || statusUpper.includes('CANCEL')) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200">
          <XCircle className="h-3 w-3 mr-1" />
          {displayStatus}
        </Badge>
      )
    }

    if (statusUpper.includes('FAILED')) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 hover:bg-red-150">
          <XCircle className="h-3 w-3 mr-1" />
          {displayStatus}
        </Badge>
      )
    }
    
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
        <Clock className="h-3 w-3 mr-1" />
        {displayStatus}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      // Handle DD-MM-YYYY specifically
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [dd, mm, yyyy] = dateStr.split('-').map(Number)
        const d = new Date(yyyy, (mm as number) - 1, dd as number)
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      }
      return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const formatDuration = (duration?: { noOfDays?: number; noOfHours?: number }) => {
    const days = duration?.noOfDays ?? 0
    const hours = duration?.noOfHours ?? 0
    const dayLabel = days === 1 ? 'day' : 'days'
    const hourLabel = hours === 1 ? 'hour' : 'hours'
    return `${days} ${dayLabel}, ${hours} ${hourLabel}`
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-5 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700 mb-0">
              Leave Applications
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
                    <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">From Date</TableHead>
                    <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">To Date</TableHead>
                    <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">Applied Date</TableHead>
                    <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">Upload Time</TableHead>
                    <TableHead className="w-[110px] px-5 py-2 whitespace-nowrap text-sm">Status</TableHead>
                    <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">Applied By</TableHead>
                    <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">Created On</TableHead>
                    <TableHead className="w-[220px] px-5 py-2 whitespace-nowrap text-sm">Remarks</TableHead>
                    <TableHead className="w-[60px] text-right px-5 py-2 whitespace-nowrap text-sm sticky right-0 bg-blue-50 border-l z-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      <TableCell className="px-5 py-2"><div className="h-4 bg-gray-200 rounded w-8"></div></TableCell>
                      <TableCell className="px-5 py-2"><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                      <TableCell className="px-5 py-2"><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                      <TableCell className="px-5 py-2"><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                      <TableCell className="px-5 py-2"><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                      <TableCell className="px-5 py-2"><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                      <TableCell className="px-5 py-2"><div className="h-4 bg-gray-200 rounded w-16"></div></TableCell>
                      <TableCell className="px-5 py-2"><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                      <TableCell className="px-5 py-2"><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                      <TableCell className="px-5 py-2"><div className="h-4 bg-gray-200 rounded w-32"></div></TableCell>
                      <TableCell className="px-5 py-2"><div className="h-4 bg-gray-200 rounded w-8"></div></TableCell>
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
              <p className="text-sm text-muted-foreground">No leave applications found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow className="bg-blue-50 hover:bg-blue-50">
                      <TableHead className="w-[60px] px-5 py-2 whitespace-nowrap text-sm">Sl No</TableHead>
                      <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Employee ID</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('employeeID'); setSortDir('asc'); handlePageChange(1) }}
                              onSortDesc={() => { setSortKey('employeeID'); setSortDir('desc'); handlePageChange(1) }}
                              onAlphaAsc={() => { setSortKey('employeeID'); setSortDir('asc'); handlePageChange(1) }}
                              onAlphaDesc={() => { setSortKey('employeeID'); setSortDir('desc'); handlePageChange(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">From Date</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('fromDate'); setSortDir('asc'); handlePageChange(1) }}
                              onSortDesc={() => { setSortKey('fromDate'); setSortDir('desc'); handlePageChange(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">To Date</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('toDate'); setSortDir('asc'); handlePageChange(1) }}
                              onSortDesc={() => { setSortKey('toDate'); setSortDir('desc'); handlePageChange(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Applied Date</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('appliedDate'); setSortDir('asc'); handlePageChange(1) }}
                              onSortDesc={() => { setSortKey('appliedDate'); setSortDir('desc'); handlePageChange(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Upload Time</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('uploadTime'); setSortDir('asc'); handlePageChange(1) }}
                              onSortDesc={() => { setSortKey('uploadTime'); setSortDir('desc'); handlePageChange(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[110px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Status</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('workflowState'); setSortDir('asc'); handlePageChange(1) }}
                              onSortDesc={() => { setSortKey('workflowState'); setSortDir('desc'); handlePageChange(1) }}
                              onAlphaAsc={() => { setSortKey('workflowState'); setSortDir('asc'); handlePageChange(1) }}
                              onAlphaDesc={() => { setSortKey('workflowState'); setSortDir('desc'); handlePageChange(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Applied By</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('uploadedBy'); setSortDir('asc'); handlePageChange(1) }}
                              onSortDesc={() => { setSortKey('uploadedBy'); setSortDir('desc'); handlePageChange(1) }}
                              onAlphaAsc={() => { setSortKey('uploadedBy'); setSortDir('asc'); handlePageChange(1) }}
                              onAlphaDesc={() => { setSortKey('uploadedBy'); setSortDir('desc'); handlePageChange(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Created On</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('createdOn'); setSortDir('asc'); handlePageChange(1) }}
                              onSortDesc={() => { setSortKey('createdOn'); setSortDir('desc'); handlePageChange(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[220px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Remarks</span>
                        </div>
                      </TableHead>
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
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.fromDate as string)}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.toDate as string)}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.appliedDate as string)}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.uploadTime || '')}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {getStatusBadge(row.workflowState)}
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.uploadedBy || '-'}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.createdOn)}</TableCell>
                        <TableCell className="max-w-[220px] px-5 py-2 whitespace-nowrap text-sm truncate" title={row.remarks || ''}>
                          {row.remarks || '-'}
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