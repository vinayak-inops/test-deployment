"use client"

import React, { useState } from 'react'
import { CheckCircle, Clock, XCircle, Calendar, FileText, Eye, ChevronLeft, ChevronRight, Download, User } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { useRouter } from 'next/navigation'
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"

interface Report {
  _id: string
  reportName?: string
  reportTitle?: string
  fileName?: string
  status?: string
  createdOn?: string
  uploadedBy?: string
  period?: string
  extension?: string
  fromDate?: string
  toDate?: string
  workflowName?: string
  employeeId?: string
  tenantCode?: string
  organization?: string
}

interface ReportsTableProps {
  data: Report[]
  onOpenDetails?: (row: Report) => void
  loading?: boolean
  filters?: {
    searchTerm: string
    selectedFilters: string[]
  }
  externalPagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
    startIndex: number
    endIndex: number
    onPageChange: (page: number) => void
  }
  permission?: any
}

export default function ReportsTable({ 
  data, 
  onOpenDetails, 
  loading = false, 
  filters,
  externalPagination,
  permission 
}: ReportsTableProps) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1)
  const itemsPerPage = externalPagination?.itemsPerPage ?? 10
  const router = useRouter()
  const { employeeId } = useKeyclockRoleInfo()

  // Filter data based on search and filters
  const filteredData = React.useMemo(() => {
    let filtered = [...data]

    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter((report) => {
        const searchableFields = [
          report.reportName,
          report.reportTitle,
          report.fileName,
          report.status,
          report.workflowName,
          report.uploadedBy,
        ].filter(Boolean).map(field => String(field).toLowerCase())
        
        return searchableFields.some(field => field.includes(searchLower))
      })
    }

    if (filters?.selectedFilters?.length) {
      filtered = filtered.filter((report) => {
        return filters.selectedFilters.some(filter => {
          const extension = report.extension?.toLowerCase()
          const status = report.status?.toLowerCase()
          const filterLower = filter.toLowerCase()

          return [extension, status].some(field => 
            field === filterLower
          )
        })
      })
    }

    return filtered
  }, [data, filters])

  // Decide which pagination mode to use
  const useExternal = !!externalPagination
  const currentPage = useExternal ? externalPagination!.currentPage : internalCurrentPage
  const totalPages = useExternal ? externalPagination!.totalPages : Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = useExternal ? externalPagination!.startIndex : (currentPage - 1) * itemsPerPage
  const endIndex = useExternal ? externalPagination!.endIndex : startIndex + itemsPerPage
  const totalItems = useExternal ? externalPagination!.totalItems : filteredData.length
  const handlePageChange = useExternal ? externalPagination!.onPageChange : setInternalCurrentPage

  const currentData = useExternal ? filteredData : filteredData.slice(startIndex, endIndex)

  const getStatusBadge = (status: string) => {
    if (!status) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
    
    const statusUpper = status.toUpperCase()
    
    if (statusUpper === 'COMPLETED') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      )
    }
    if (statusUpper === 'FAILED') {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    }
    if (statusUpper.includes('GENERAT') || statusUpper.includes('PROCESS')) {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100">
          <Clock className="h-3 w-3 mr-1" />
          Generating
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
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const formatDateRange = (fromDate?: string, toDate?: string) => {
    if (!fromDate && !toDate) return '-'
    try {
      const from = fromDate ? new Date(fromDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : ''
      const to = toDate ? new Date(toDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : ''
      return from && to ? `${from} - ${to}` : from || to
    } catch {
      return '-'
    }
  }

  const getReportName = (report: Report) => {
    return report.reportTitle || report.reportName || report.fileName || 'Untitled Report'
  }

  const handleViewReport = (report: Report, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    if (onOpenDetails) {
      onOpenDetails(report)
    } else if (report._id) {
      const encryptedData = encryptEmployeeData({ employeeId: employeeId, _id: report._id })
      router.push(`/reports?mode=all&id=${encryptedData}`)
    }
  }

  const handleRowClick = (report: Report) => {
    handleViewReport(report)
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-5 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700 mb-0">
              Reports
            </CardTitle>
            <span className="text-sm font-normal text-muted-foreground">
              {totalItems} report{totalItems !== 1 ? 's' : ''}
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
                    <TableHead className="w-[200px] px-5 py-2 whitespace-nowrap text-sm">Report Name</TableHead>
                    <TableHead className="w-[100px] px-5 py-2 whitespace-nowrap text-sm">Status</TableHead>
                    <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">Date Range</TableHead>
                    <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">Period</TableHead>
                    <TableHead className="w-[100px] px-5 py-2 whitespace-nowrap text-sm">Extension</TableHead>
                    <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">Created On</TableHead>
                    <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">Uploaded By</TableHead>
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
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="text-right px-5 py-2 whitespace-nowrap sticky right-0 bg-white border-l z-10">
                        <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No Reports</h3>
              <p className="text-sm text-muted-foreground">No reports found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow className="bg-blue-50 hover:bg-blue-50">
                      <TableHead className="w-[60px] px-5 py-2 whitespace-nowrap text-sm">Sl No</TableHead>
                      <TableHead className="w-[200px] px-5 py-2 whitespace-nowrap text-sm">Report Name</TableHead>
                      <TableHead className="w-[100px] px-5 py-2 whitespace-nowrap text-sm">Status</TableHead>
                      <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">Date Range</TableHead>
                      <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">Period</TableHead>
                      <TableHead className="w-[100px] px-5 py-2 whitespace-nowrap text-sm">Extension</TableHead>
                      <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">Created On</TableHead>
                      <TableHead className="w-[150px] px-5 py-2 whitespace-nowrap text-sm">Uploaded By</TableHead>
                      <TableHead className="w-[60px] text-right px-5 py-2 whitespace-nowrap text-sm sticky right-0 bg-blue-50 border-l z-10">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((row, index) => (
                      <TableRow 
                        key={row._id || index}
                        className="cursor-pointer hover:bg-gray-50/70"
                        onClick={() => handleRowClick(row)}
                      >
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium px-5 py-2 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[180px]" title={getReportName(row)}>
                              {getReportName(row)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {getStatusBadge(row.status || '')}
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          {formatDateRange(row.fromDate, row.toDate)}
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {row.period || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 uppercase">
                            {row.extension === 'excel' ? 'xlsx' : (row.extension || 'pdf')}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{formatDate(row.createdOn || '')}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {row.uploadedBy || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-5 py-2 whitespace-nowrap sticky right-0 bg-white border-l z-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleViewReport(row, e)}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-7 w-7 p-0 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
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
                                  className={`h-7 w-7 p-0 ${
                                    page === currentPage 
                                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                                      : "border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                  }`}
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
                              className={`h-7 w-7 p-0 ${
                                page === currentPage 
                                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                                  : "border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
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
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="h-7 w-7 p-0 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50"
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

