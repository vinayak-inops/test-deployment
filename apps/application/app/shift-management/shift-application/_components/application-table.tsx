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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ColumnSortMenu from "../../../_components/column-sort-menu"

interface Application {
  _id: string
  employeeID: string
  appliedDate?: string
  fromDate: string
  toDate: string
  shiftName?: string
  shiftStart?: string
  shiftEnd?: string
  lunchStart?: string
  lunchEnd?: string
  remarks?: string
  status: string
  workflowState: string
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
  const [sortKey, setSortKey] = useState<keyof Application>('appliedDate')
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
      case 'fromDate':
      case 'toDate':
      case 'appliedDate':
        return parseDMY(row[key] as string)
      default:
        return (row[key] ?? '').toString().toLowerCase()
    }
  }

  const sortedData = useMemo(() => {
    if (useExternal) return data // Don't sort when using external pagination
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

  const currentData = useExternal ? data : sortedData.slice(startIndex, endIndex)

  const getStatusBadge = (status: string) => {
    const statusUpper = (status || '').toString().toUpperCase()
    
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
    
    // Show actual workflowState for non-completed states
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
        <Clock className="h-3 w-3 mr-1" />
        {status || 'Pending'}
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

  const toTimeLabel = (v?: string) => {
    if (!v) return ''
    const d = new Date(v)
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
    // Fallback for HH:mm or HH:mm:ss strings
    const m = /^\d{1,2}:\d{2}(:\d{2})?$/.test(v)
    return m ? v.slice(0,5) : v
  }

  const formatTimeRange = (start?: string, end?: string) => {
    const s = toTimeLabel(start)
    const e = toTimeLabel(end)
    if (!s && !e) return '-'
    if (s && e) return `${s} - ${e}`
    return s || e
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-5 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700 mb-0">
              Shift Applications
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
                    <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">Applied Date</TableHead>
                    <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">From Date</TableHead>
                    <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">To Date</TableHead>
                    <TableHead className="w-[160px] px-5 py-2 whitespace-nowrap text-sm">Shift Name</TableHead>
                    <TableHead className="w-[200px] px-5 py-2 whitespace-nowrap text-sm">Shift Timing</TableHead>
                    <TableHead className="w-[200px] px-5 py-2 whitespace-nowrap text-sm">Lunch Break</TableHead>
                    <TableHead className="w-[240px] px-5 py-2 whitespace-nowrap text-sm">Remarks</TableHead>
                    <TableHead className="w-[110px] px-5 py-2 whitespace-nowrap text-sm">Status</TableHead>
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
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 text-sm">
                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
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
              <p className="text-sm text-muted-foreground">No shift applications found</p>
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
                              onSortAsc={() => { setSortKey('employeeID'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onSortDesc={() => { setSortKey('employeeID'); setSortDir('desc'); setInternalCurrentPage(1) }}
                              onAlphaAsc={() => { setSortKey('employeeID'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onAlphaDesc={() => { setSortKey('employeeID'); setSortDir('desc'); setInternalCurrentPage(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Applied Date</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('appliedDate'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onSortDesc={() => { setSortKey('appliedDate'); setSortDir('desc'); setInternalCurrentPage(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">From Date</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('fromDate'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onSortDesc={() => { setSortKey('fromDate'); setSortDir('desc'); setInternalCurrentPage(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">To Date</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('toDate'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onSortDesc={() => { setSortKey('toDate'); setSortDir('desc'); setInternalCurrentPage(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[160px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Shift Name</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('shiftName'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onSortDesc={() => { setSortKey('shiftName'); setSortDir('desc'); setInternalCurrentPage(1) }}
                              onAlphaAsc={() => { setSortKey('shiftName'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onAlphaDesc={() => { setSortKey('shiftName'); setSortDir('desc'); setInternalCurrentPage(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[200px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Shift Timing</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('shiftStart'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onSortDesc={() => { setSortKey('shiftStart'); setSortDir('desc'); setInternalCurrentPage(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[200px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Lunch Break</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('lunchStart'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onSortDesc={() => { setSortKey('lunchStart'); setSortDir('desc'); setInternalCurrentPage(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[240px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Remarks</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('remarks'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onSortDesc={() => { setSortKey('remarks'); setSortDir('desc'); setInternalCurrentPage(1) }}
                              onAlphaAsc={() => { setSortKey('remarks'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onAlphaDesc={() => { setSortKey('remarks'); setSortDir('desc'); setInternalCurrentPage(1) }}
                            />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[110px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1">Status</span>
                          {!useExternal && (
                            <ColumnSortMenu
                              onSortAsc={() => { setSortKey('status'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onSortDesc={() => { setSortKey('status'); setSortDir('desc'); setInternalCurrentPage(1) }}
                              onAlphaAsc={() => { setSortKey('status'); setSortDir('asc'); setInternalCurrentPage(1) }}
                              onAlphaDesc={() => { setSortKey('status'); setSortDir('desc'); setInternalCurrentPage(1) }}
                            />
                          )}
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
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.appliedDate as string)}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.fromDate)}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.toDate)}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.shiftName || '-'}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatTimeRange(row.shiftStart, row.shiftEnd)}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatTimeRange(row.lunchStart, row.lunchEnd)}</TableCell>
                        <TableCell className="max-w-[260px] px-5 py-2 whitespace-nowrap text-sm truncate" title={row.remarks || ''}>
                          {row.remarks || '-'}
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {getStatusBadge(row.status || row.workflowState)}
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
