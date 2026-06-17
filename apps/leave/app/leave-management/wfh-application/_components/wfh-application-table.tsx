"use client"

import React, { useMemo, useState } from "react"
import { CheckCircle, Clock, XCircle, Calendar, User, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ColumnSortMenu from "@/components/table/column-sort-menu"

interface WfhApplication {
  _id: string
  employeeID: string
  fromDate: string
  toDate: string
  fromDuration: string
  toDuration: string
  description?: string
  workflowState: string
  uploadedBy?: string
  createdOn?: string
}

interface WfhApplicationTableProps {
  rows?: WfhApplication[]
  data?: WfhApplication[]
  onView?: (row: WfhApplication) => void
  onOpenDetails?: (row: WfhApplication) => void
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

export default function WfhApplicationTable({ rows, data, onView, onOpenDetails, loading = false, externalPagination }: WfhApplicationTableProps) {
  const sourceData = (data || rows || []) as WfhApplication[]
  const openDetails = onOpenDetails || onView || (() => {})

  const [internalCurrentPage, setInternalCurrentPage] = useState(1)
  const itemsPerPage = externalPagination?.itemsPerPage ?? 10
  const [sortKey, setSortKey] = useState<keyof WfhApplication>("createdOn")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const useExternal = !!externalPagination
  const currentPage = useExternal ? externalPagination!.currentPage : internalCurrentPage
  const totalPages = useExternal ? externalPagination!.totalPages : Math.max(1, Math.ceil(sourceData.length / itemsPerPage))
  const startIndex = useExternal ? externalPagination!.startIndex : (currentPage - 1) * itemsPerPage
  const endIndex = useExternal ? externalPagination!.endIndex : startIndex + itemsPerPage
  const totalItems = useExternal ? externalPagination!.totalItems : sourceData.length
  const handlePageChange = useExternal ? externalPagination!.onPageChange : setInternalCurrentPage

  const parseDMY = (v?: string) => {
    if (!v) return 0
    if (/^\d{2}-\d{2}-\d{4}$/.test(v)) {
      const [dd, mm, yyyy] = v.split("-").map(Number)
      return new Date(yyyy, (mm as number) - 1, dd as number).getTime()
    }
    const t = Date.parse(v)
    return Number.isNaN(t) ? 0 : t
  }

  const getValue = (row: WfhApplication, key: keyof WfhApplication): any => {
    switch (key) {
      case "createdOn":
      case "fromDate":
      case "toDate":
        return parseDMY(row[key] as string)
      default:
        return (row[key] ?? "").toString().toLowerCase()
    }
  }

  const sortedData = useMemo(() => {
    if (useExternal) return sourceData
    const copy = [...sourceData]
    copy.sort((a, b) => {
      const va = getValue(a, sortKey)
      const vb = getValue(b, sortKey)
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return copy
  }, [sourceData, sortKey, sortDir, useExternal])

  const currentData = useMemo(() => {
    if (useExternal) return sourceData
    return sortedData.slice(startIndex, endIndex)
  }, [useExternal, sourceData, sortedData, startIndex, endIndex])

  const getStatusBadge = (status: string) => {
    const s = (status || "INITIATED").toUpperCase()
    if (s === "APPROVED") return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
    if (s === "REJECTED") return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
    if (s === "CANCELLED" || s === "CANCEL") return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
    if (s === "FAILED") return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 hover:bg-red-150"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="h-3 w-3 mr-1" />{s}</Badge>
  }

  if (loading) {
    return <div className="py-10 text-center text-sm text-gray-500">Loading WFH applications...</div>
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="bg-gray-50/50 border-b border-gray-200 px-5 py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700 mb-0">WFH Applications</CardTitle>
            <span className="text-sm font-normal text-muted-foreground">{totalItems} application{totalItems !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {currentData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4"><Calendar className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="text-sm font-semibold mb-1">No Applications</h3>
              <p className="text-sm text-muted-foreground">No WFH applications found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                <Table className="min-w-[1100px]">
                  <TableHeader>
                    <TableRow className="bg-blue-50 hover:bg-blue-50">
                      <TableHead className="w-[60px] px-5 py-2 whitespace-nowrap text-sm">Sl No</TableHead>
                      <TableHead className="w-[130px] px-5 py-2 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-between gap-2"><span>Employee ID</span><ColumnSortMenu onSortAsc={() => { setSortKey("employeeID"); setSortDir("asc"); handlePageChange(1) }} onSortDesc={() => { setSortKey("employeeID"); setSortDir("desc"); handlePageChange(1) }} onAlphaAsc={() => { setSortKey("employeeID"); setSortDir("asc"); handlePageChange(1) }} onAlphaDesc={() => { setSortKey("employeeID"); setSortDir("desc"); handlePageChange(1) }} /></div>
                      </TableHead>
                      <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">From Date</TableHead>
                      <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">To Date</TableHead>
                      <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">From Duration</TableHead>
                      <TableHead className="w-[140px] px-5 py-2 whitespace-nowrap text-sm">To Duration</TableHead>
                      <TableHead className="w-[120px] px-5 py-2 whitespace-nowrap text-sm">Status</TableHead>
                      <TableHead className="w-[180px] px-5 py-2 whitespace-nowrap text-sm">Description</TableHead>
                      <TableHead className="w-[60px] text-right px-5 py-2 whitespace-nowrap text-sm sticky right-0 bg-blue-50 border-l z-10">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((row, index) => (
                      <TableRow key={row._id || index} className="cursor-pointer hover:bg-gray-50/70" onClick={() => openDetails(row)}>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-medium px-5 py-2 whitespace-nowrap text-sm"><div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{row.employeeID}</div></TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.fromDate || "-"}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.toDate || "-"}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.fromDuration || "-"}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{row.toDuration || "-"}</TableCell>
                        <TableCell className="px-5 py-2 whitespace-nowrap text-sm">{getStatusBadge(row.workflowState)}</TableCell>
                        <TableCell className="max-w-[180px] px-5 py-2 whitespace-nowrap text-sm truncate" title={row.description || ""}>{row.description || "-"}</TableCell>
                        <TableCell className="text-right px-5 py-2 whitespace-nowrap sticky right-0 bg-white border-l z-10">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDetails(row) }} className="h-7 w-7"><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-2 pb-3 border-t">
                  <div className="text-xs text-muted-foreground">Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries</div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="h-7 w-7 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1))
                        .map((page, index, array) => {
                          if (index > 0 && page - array[index - 1] > 1) {
                            return (
                              <React.Fragment key={page}>
                                <span className="px-2">...</span>
                                <Button variant={page === currentPage ? "default" : "outline"} size="sm" onClick={() => handlePageChange(page)} className="h-7 w-7 p-0">{page}</Button>
                              </React.Fragment>
                            )
                          }
                          return <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" onClick={() => handlePageChange(page)} className="h-7 w-7 p-0">{page}</Button>
                        })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="h-7 w-7 p-0"><ChevronRight className="h-4 w-4" /></Button>
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
