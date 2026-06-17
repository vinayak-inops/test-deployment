"use client"

import {
  Edit,
  MoreVertical,
  Loader2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Hash,
  CalendarDays,
  BadgeDollarSign,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader as DataTableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { EwaContractorOutstandingRow } from "./hooks/useEwaContractoroutStandingLogic"
import { formatMonthYear, formatCurrency } from "./hooks/useEwaContractoroutStandingLogic"

// ─── Types ────────────────────────────────────────────────────────────────────

interface EwaContractorOutstandingTableProps {
  rows:           EwaContractorOutstandingRow[]
  loading:        boolean
  countLoading:   boolean
  totalCount:     number
  totalPages:     number
  safePage:       number
  startIndex:     number
  endIndex:       number
  setCurrentPage: (page: number) => void
  viewMode:       boolean
  editMode:       boolean
  onEdit:         (id: string) => void
  onView:         (id: string) => void
}

// ─── Paid Status Badge ────────────────────────────────────────────────────────

function PaidStatusBadge({ paid }: { paid: boolean }) {
  return paid ? (
    <Badge
      variant="outline"
      className="text-xs font-medium px-2 py-0.5 border-green-300 bg-green-50 text-green-700"
    >
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Paid
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="text-xs font-medium px-2 py-0.5 border-red-300 bg-red-50 text-red-700"
    >
      <XCircle className="h-3 w-3 mr-1" />
      Unpaid
    </Badge>
  )
}

// ─── Pagination Controls ──────────────────────────────────────────────────────

function PaginationControls({
  totalCount,
  totalPages,
  safePage,
  startIndex,
  endIndex,
  setCurrentPage,
}: Pick<
  EwaContractorOutstandingTableProps,
  | "totalCount"
  | "totalPages"
  | "safePage"
  | "startIndex"
  | "endIndex"
  | "setCurrentPage"
>) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 flex-wrap gap-2">
      <div className="text-xs text-gray-600">
        {totalCount > 0 ? (
          <>
            Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of{" "}
            {totalCount} entries
          </>
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
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                (page >= safePage - 1 && page <= safePage + 1)
            )
            .map((page, index, array) => {
              const needsEllipsis = index > 0 && page - array[index - 1] > 1
              return (
                <div key={page} className="flex items-center gap-1">
                  {needsEllipsis && (
                    <span className="px-2 text-xs text-gray-500">...</span>
                  )}
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

// ─── Main Table ───────────────────────────────────────────────────────────────

export default function EwaContractorOutstandingTable({
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
}: EwaContractorOutstandingTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">
          Loading EWA contractor outstanding records...
        </p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No EWA contractor outstanding records found
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Table className="min-w-[900px] w-full">
          <DataTableHeader>
            <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">

              {/* Sl No */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 w-14">
                Sl No
              </TableHead>

              {/* Contractor Code */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Contractor Code
                </div>
              </TableHead>

              {/* Month & Year */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Month / Year
                </div>
              </TableHead>

              {/* Total Outstanding */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <BadgeDollarSign className="h-3 w-3" />
                  Total Outstanding
                </div>
              </TableHead>

              {/* Paid Status */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                Status
              </TableHead>

              {/* Paid On */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  Paid On
                </div>
              </TableHead>

              {/* Action */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10 w-20">
                Action
              </TableHead>
            </TableRow>
          </DataTableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row._id || `ewa-${index}`}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                {/* Sl No */}
                <TableCell className="px-4 py-2 text-sm text-gray-500">
                  {startIndex + index + 1}
                </TableCell>

                {/* Contractor Code */}
                <TableCell className="px-4 py-2">
                  <span className="text-sm font-mono font-medium text-gray-800">
                    {row.contractorCode}
                  </span>
                </TableCell>

                {/* Month / Year */}
                <TableCell className="px-4 py-2">
                  <span className="text-sm text-gray-800">
                    {row.month > 0 && row.year > 0
                      ? formatMonthYear(row.month, row.year)
                      : "-"}
                  </span>
                </TableCell>

                {/* Total Outstanding */}
                <TableCell className="px-4 py-2">
                  <span className="text-sm font-medium text-gray-800">
                    {formatCurrency(row.totalOutstanding)}
                  </span>
                </TableCell>

                {/* Paid Status */}
                <TableCell className="px-4 py-2">
                  <PaidStatusBadge paid={row.paid} />
                </TableCell>

                {/* Paid On */}
                <TableCell className="px-4 py-2">
                  <span className="text-sm text-gray-800">{row.paidOn}</span>
                </TableCell>

                {/* Action */}
                <TableCell
                  className="px-4 py-2 sticky right-0 bg-white z-10"
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