"use client"

import { Edit, MoreVertical, Loader2, FileBarChart2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader as DataTableHeader, TableRow } from "@/components/ui/table"
import type { ReportTaskRow } from "./hooks/Usereporttasklogic"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportTaskTableProps {
  rows: ReportTaskRow[]
  loading: boolean
  countLoading: boolean
  totalCount: number
  totalPages: number
  safePage: number
  startIndex: number
  endIndex: number
  setCurrentPage: (page: number) => void
  viewMode: boolean
  editMode: boolean
  onEdit: (id: string) => void
  onView: (id: string) => void
}

// ─── Pagination ────────────────────────────────────────────────────────────────

function PaginationControls({
  totalCount,
  totalPages,
  safePage,
  startIndex,
  endIndex,
  setCurrentPage,
}: Pick<
  ReportTaskTableProps,
  "totalCount" | "totalPages" | "safePage" | "startIndex" | "endIndex" | "setCurrentPage"
>) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
      <div className="text-xs text-gray-600">
        {totalCount > 0 ? (
          <>Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} entries</>
        ) : (
          <>No entries found</>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          className="h-7 w-7 p-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (page === 1 || page === totalPages) return true
              return page >= safePage - 1 && page <= safePage + 1
            })
            .map((page, index, array) => {
              const needsEllipsis = index > 0 && page - array[index - 1] > 1
              return (
                <div key={page} className="flex items-center gap-1">
                  {needsEllipsis && <span className="px-2 text-xs text-gray-500">...</span>}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-7 w-7 p-0 text-xs font-medium ${
                      page === safePage
                        ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </Button>
                </div>
              )
            })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          className="h-7 w-7 p-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium px-2 py-0.5 ${
        isActive
          ? "border-green-300 bg-green-50 text-green-700"
          : "border-red-300 bg-red-50 text-red-700"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  )
}

const EXTENSION_STYLES: Record<string, string> = {
  PDF: "border-red-300 bg-red-50 text-red-700",
  XLSX: "border-green-300 bg-green-50 text-green-700",
  CSV: "border-blue-300 bg-blue-50 text-blue-700",
  DOCX: "border-indigo-300 bg-indigo-50 text-indigo-700",
}

function ExtensionBadge({ extension }: { extension: string }) {
  const style = EXTENSION_STYLES[extension?.toUpperCase()] ?? "border-gray-300 bg-gray-50 text-gray-700"
  return (
    <Badge variant="outline" className={`text-xs font-semibold px-2 py-0.5 font-mono ${style}`}>
      {extension}
    </Badge>
  )
}

function CountPill({ count, title }: { count: number; title: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
    >
      {count}
    </span>
  )
}

// ─── Main table ────────────────────────────────────────────────────────────────

export default function ReportTaskTable({
  rows,
  loading,
  countLoading,
  totalCount,
  totalPages,
  safePage,
  startIndex,
  endIndex,
  setCurrentPage,
  viewMode,
  editMode,
  onEdit,
  onView,
}: ReportTaskTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading report tasks...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <FileBarChart2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No report tasks found</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Table className="min-w-[1200px]">
          <DataTableHeader>
            <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Sl No</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Scheduler Name</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Period</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">From Date</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">To Date</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Extension</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">Reports</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">Mail Groups</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Status</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                Action
              </TableHead>
            </TableRow>
          </DataTableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row._id || `${row.reportSchedulerName}-${index}`}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                <TableCell className="px-5 py-2 text-sm">{startIndex + index + 1}</TableCell>
                <TableCell className="px-5 py-2 font-medium text-sm max-w-[200px] truncate" title={row.reportSchedulerName}>
                  {row.reportSchedulerName}
                </TableCell>
                <TableCell className="px-5 py-2 text-sm whitespace-nowrap">{row.period}</TableCell>
                <TableCell className="px-5 py-2 text-sm whitespace-nowrap">{row.fromDate}</TableCell>
                <TableCell className="px-5 py-2 text-sm whitespace-nowrap">{row.toDate}</TableCell>
                <TableCell className="px-5 py-2">
                  <ExtensionBadge extension={row.extension} />
                </TableCell>
                <TableCell className="px-5 py-2 text-center">
                  <CountPill count={row.reportCount} title={`${row.reportCount} report(s)`} />
                </TableCell>
                <TableCell className="px-5 py-2 text-center">
                  <CountPill count={row.mailGroupCount} title={`${row.mailGroupCount} mail group(s)`} />
                </TableCell>
                <TableCell className="px-5 py-2">
                  <ActiveBadge isActive={row.isActive} />
                </TableCell>
                <TableCell
                  className="px-5 py-2 sticky right-0 bg-white z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    {editMode && (
                      <button
                        type="button"
                        onClick={() => onEdit(String(row._id))}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {viewMode && (
                      <button
                        type="button"
                        onClick={() => onView(String(row._id))}
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

      <PaginationControls
        totalCount={totalCount}
        totalPages={totalPages}
        safePage={safePage}
        startIndex={startIndex}
        endIndex={endIndex}
        setCurrentPage={setCurrentPage}
      />
    </>
  )
}