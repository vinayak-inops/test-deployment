"use client"

import React from "react"
import { Edit, MoreVertical, Trash2, Plus, Loader2, Calendar, ChevronLeft, ChevronRight, User } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/* =======================
   Types (ONLY REQUIRED)
======================= */

interface ContractEmployeeApprover {
  _id: string
  employeeID: string
  employeeName?: string
  leaveApprover?: string[]
  punchApprover?: string[]
  shiftApprover?: string[]
  outDutyApprover?: string[]
  organizationCode?: string
  tenantCode?: string
}

interface ContractEmployeeApproverTableProps {
  data:any[]
  onView: (row: ContractEmployeeApprover) => void
  onEdit?: (row: ContractEmployeeApprover) => void
  onDelete?: (row: ContractEmployeeApprover) => void
  onAdd?: () => void
  permission?: {
    view?: boolean
    edit?: boolean
    add?: boolean
    delete?: boolean
  }
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

const formatApproverList = (approvers: string[] | undefined, maxVisible: number = 3): string => {
  if (!approvers || approvers.length === 0) return "-"
  if (approvers.length <= maxVisible) return approvers.join(", ")
  const visible = approvers.slice(0, maxVisible).join(", ")
  const remaining = approvers.length - maxVisible
  return `${visible} (+${remaining} more)`
}

const renderApproverChips = (approvers: string[] | undefined, maxVisible: number = 2) => {
  if (!approvers || approvers.length === 0) {
    return <span className="text-gray-400">-</span>
  }

  const visible = approvers.slice(0, maxVisible)
  const remaining = approvers.length - visible.length

  return (
    <div className="flex items-center gap-1.5 min-w-0 whitespace-nowrap overflow-hidden">
      {visible.map((item, idx) => (
        <span
          key={`${item}-${idx}`}
          className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 max-w-[180px] truncate"
          title={item}
        >
          {item}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
          +{remaining}
        </span>
      )}
    </div>
  )
}

/* =======================
   Component
======================= */

export default function ContractEmployeeApproverTable({
  data,
  onView,
  onEdit,
  onDelete,
  onAdd,
  permission,
  isLoading = false,
  externalPagination,
}: ContractEmployeeApproverTableProps) {
  const totalItems = externalPagination?.totalItems ?? data.length
  const startIndex = externalPagination?.startIndex ?? 0
  const pagination = externalPagination

  const canView = permission?.view ?? true
  const canEdit = permission?.edit ?? !!onEdit
  const canDelete = permission?.delete ?? !!onDelete
  const canAdd = permission?.add ?? !!onAdd

  return (
    <Card >
      <CardHeader className="border-b px-5 py-2 bg-gray-50/50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-semibold">
            Employee Approvers
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {isLoading ? "Loading..." : `${totalItems} approvers`}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-muted-foreground">
              Loading approvers...
            </p>
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No approvers found
            </p>
          </div>
        ) : (
          <div className="rounded-md border my-3 mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <Table className="min-w-[1400px]">
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead className="px-5 py-2 min-w-[90px] whitespace-nowrap">Sl No</TableHead>
                  <TableHead className="px-5 py-2 min-w-[150px] whitespace-nowrap">Approver Id</TableHead>
                  <TableHead className="px-5 py-2 min-w-[260px] whitespace-nowrap">Leave Applicant(s)</TableHead>
                  <TableHead className="px-5 py-2 min-w-[260px] whitespace-nowrap">Punch Applicant(s)</TableHead>
                  <TableHead className="px-5 py-2 min-w-[260px] whitespace-nowrap">Shift Applicant(s)</TableHead>
                  <TableHead className="px-5 py-2 min-w-[260px] whitespace-nowrap">Out Duty Applicant(s)</TableHead>
                  <TableHead className="w-[60px] min-w-[60px] text-left px-3 md:px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                    <div className="flex items-center justify-start gap-2">
                      <span>Action</span>
                      {canAdd && onAdd && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onAdd()
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                          title="Add"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data.map((row, index) => (
                  <TableRow
                    key={row._id}
                    onClick={() => {
                      if (!canView) return
                      onView(row)
                    }}
                    className={canView ? "cursor-pointer hover:bg-gray-50" : "cursor-default"}
                  >
                    <TableCell className="px-5 py-2">
                      {startIndex + index + 1}
                    </TableCell>

                    <TableCell className="px-5 py-2 font-medium">
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div className="min-w-0 leading-tight">
                          <div className="text-sm font-semibold text-gray-900 tracking-tight">
                            {row.employeeID || "-"}
                          </div>
                          <div className="text-[11px] font-medium text-gray-500 mt-0.5 truncate">
                            {row.employeeName || "No name"}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-5 py-2 text-sm">
                      {renderApproverChips(row.leaveApprover)}
                    </TableCell>

                    <TableCell className="px-5 py-2 text-sm">
                      {renderApproverChips(row.punchApprover)}
                    </TableCell>

                    <TableCell className="px-5 py-2 text-sm">
                      {renderApproverChips(row.shiftApprover)}
                    </TableCell>

                    <TableCell className="px-5 py-2 text-sm">
                      {renderApproverChips(row.outDutyApprover)}
                    </TableCell>

                    <TableCell
                      className="text-left px-3 md:px-5 py-2 whitespace-nowrap sticky right-0 bg-white z-10"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <div className="flex items-center justify-start gap-1">
                        {canEdit && onEdit && (
                          <button
                            type="button"
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
                        {canDelete && onDelete && (
                          <button
                            type="button"
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
                        {canView && (
                          <button
                            type="button"
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-2 pb-3 border-t">
          <div className="text-xs text-muted-foreground">
            Showing {pagination.startIndex + 1} to {Math.min(pagination.endIndex, pagination.totalItems)} of {pagination.totalItems} entries
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="h-7 w-7 p-0 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
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
                        <span className="px-2">...</span>
                        <Button
                          variant={page === pagination.currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => pagination.onPageChange(page)}
                          className={
                            page === pagination.currentPage
                              ? "h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                              : "h-7 w-7 p-0 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          }
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    )
                  }
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => pagination.onPageChange(page)}
                      className={
                        page === pagination.currentPage
                          ? "h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                          : "h-7 w-7 p-0 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      }
                    >
                      {page}
                    </Button>
                  )
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="h-7 w-7 p-0 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

