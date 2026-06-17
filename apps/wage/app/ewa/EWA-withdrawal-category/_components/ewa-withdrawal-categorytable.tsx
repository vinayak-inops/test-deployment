"use client"

import { Edit, MoreVertical, Loader2, BadgePercent, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader as DataTableHeader, TableRow } from "@/components/ui/table"
import type { EWAWithdrawalCategoryRow } from "./hooks/Useewawithdrawalcategorylogic"

// ─── Types ────────────────────────────────────────────────────────────────────

interface EWAWithdrawalCategoryTableProps {
  rows: EWAWithdrawalCategoryRow[]
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
  EWAWithdrawalCategoryTableProps,
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

function PercentageCell({ value }: { value: number | string }) {
  if (value === "-") return <span className="text-sm text-gray-400">-</span>
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${Math.min(Number(value), 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 tabular-nums">
        {Number(value).toFixed(1)}%
      </span>
    </div>
  )
}

function AmountRangeCell({
  min,
  max,
}: {
  min: number | string
  max: number | string
}) {
  const fmt = (v: number | string) =>
    v === "-"
      ? "-"
      : `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  return (
    <div className="flex items-center gap-1 text-sm text-gray-700 whitespace-nowrap">
      <span className="text-gray-400 text-xs">Min</span>
      <span className="font-medium">{fmt(min)}</span>
      <span className="text-gray-300 mx-0.5">—</span>
      <span className="text-gray-400 text-xs">Max</span>
      <span className="font-medium">{fmt(max)}</span>
    </div>
  )
}

function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center leading-tight" title={label}>
      <span className="text-sm font-semibold text-gray-800 tabular-nums">{value}</span>
      <span className="text-[10px] text-gray-400 whitespace-nowrap">{label}</span>
    </div>
  )
}

// ─── Main table ────────────────────────────────────────────────────────────────

export default function EWAWithdrawalCategoryTable({
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
}: EWAWithdrawalCategoryTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading EWA withdrawal categories...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <BadgePercent className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No EWA withdrawal categories found</p>
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
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Category Title</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Category Code</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Allowed %</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Withdrawal Range</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">Max / Month</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">Cooling (hrs)</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Components</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Status</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                Action
              </TableHead>
            </TableRow>
          </DataTableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row._id || `${row.categoryCode}-${index}`}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                <TableCell className="px-5 py-2 text-sm">{startIndex + index + 1}</TableCell>

                <TableCell className="px-5 py-2 font-medium text-sm">{row.categoryTitle}</TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                    {row.categoryCode}
                  </span>
                </TableCell>

                <TableCell className="px-5 py-2">
                  <PercentageCell value={row.allowedPercentage} />
                </TableCell>

                {/* Min–Max withdrawal range in one cell */}
                <TableCell className="px-5 py-2">
                  <AmountRangeCell
                    min={row.minWithdrawalPerRequest}
                    max={row.maxWithdrawalPerRequest}
                  />
                </TableCell>

                <TableCell className="px-5 py-2 text-center">
                  <StatPill value={row.maxWithdrawalsPerMonth} label="withdrawals" />
                </TableCell>

                <TableCell className="px-5 py-2 text-center">
                  <StatPill value={row.coolingPeriodHours} label="hours" />
                </TableCell>

                {/* Include components — joined tags */}
                <TableCell className="px-5 py-2 text-sm max-w-[140px] truncate" title={row.includeComponents}>
                  {row.includeComponents}
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