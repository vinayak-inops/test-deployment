"use client"

import { Edit, MoreVertical, Loader2, Wallet, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader as DataTableHeader, TableRow } from "@/components/ui/table"
import type { EmployeeAdvanceRow } from "./hooks/Useemployeeadvanceslogic"

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmployeeAdvancesTableProps {
  rows: EmployeeAdvanceRow[]
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
  EmployeeAdvancesTableProps,
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

function StatusBadge({ value, trueLabel, falseLabel, trueStyle, falseStyle }: {
  value: boolean
  trueLabel: string
  falseLabel: string
  trueStyle: string
  falseStyle: string
}) {
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium px-2 py-0.5 ${value ? trueStyle : falseStyle}`}
    >
      {value ? trueLabel : falseLabel}
    </Badge>
  )
}

function AmountCell({ amount }: { amount: number | string }) {
  if (amount === "-") return <span className="text-sm text-gray-400">-</span>
  return (
    <span className="text-sm font-semibold text-gray-800">
      ₹{Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  )
}

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

function AdjustmentPeriodCell({ month, year }: { month: number | string; year: number | string }) {
  const monthName = typeof month === "number" && month >= 1 && month <= 12
    ? MONTH_NAMES[month]
    : month
  return (
    <span className="text-sm text-gray-700 whitespace-nowrap">
      {monthName} {year}
    </span>
  )
}

// ─── Main table ────────────────────────────────────────────────────────────────

export default function EmployeeAdvancesTable({
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
}: EmployeeAdvancesTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading employee advances...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No employee advances found</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Table className="min-w-[1100px]">
          <DataTableHeader>
            <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Sl No</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Employee ID</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Transaction Date</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Amount</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Adjustment Period</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Description</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Adjusted</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">In Payroll</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                Action
              </TableHead>
            </TableRow>
          </DataTableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row._id || `${row.employeeID}-${index}`}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                <TableCell className="px-5 py-2 text-sm">{startIndex + index + 1}</TableCell>

                <TableCell className="px-5 py-2 font-medium text-sm">{row.employeeID}</TableCell>

                <TableCell className="px-5 py-2 text-sm whitespace-nowrap">
                  {row.transactionDate}
                </TableCell>

                <TableCell className="px-5 py-2">
                  <AmountCell amount={row.amount} />
                </TableCell>

                <TableCell className="px-5 py-2">
                  <AdjustmentPeriodCell
                    month={row.adjustmentMonth}
                    year={row.adjustmentYear}
                  />
                </TableCell>

                <TableCell
                  className="px-5 py-2 text-sm max-w-[200px] truncate"
                  title={row.description !== "-" ? row.description : undefined}
                >
                  {row.description}
                </TableCell>

                <TableCell className="px-5 py-2">
                  <StatusBadge
                    value={row.isAdjusted}
                    trueLabel="Adjusted"
                    falseLabel="Pending"
                    trueStyle="border-green-300 bg-green-50 text-green-700"
                    falseStyle="border-yellow-300 bg-yellow-50 text-yellow-700"
                  />
                </TableCell>

                <TableCell className="px-5 py-2">
                  <StatusBadge
                    value={row.isIncludedInPayroll}
                    trueLabel="Included"
                    falseLabel="Excluded"
                    trueStyle="border-blue-300 bg-blue-50 text-blue-700"
                    falseStyle="border-gray-300 bg-gray-50 text-gray-500"
                  />
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