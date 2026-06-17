"use client"

import { Edit, MoreVertical, Loader2, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader as DataTableHeader, TableRow } from "@/components/ui/table"
import type { ContinuousDaysBlockingRow } from "./hooks/Usecontinuousdaysblockinglogic"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContinuousDaysBlockingTableProps {
  rows: ContinuousDaysBlockingRow[]
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
  ContinuousDaysBlockingTableProps,
  "totalCount" | "totalPages" | "safePage" | "startIndex" | "endIndex" | "setCurrentPage"
>) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
      <div className="text-xs text-gray-600">
        {totalCount > 0 ? (
          <>
            Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} entries
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

function EnabledBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium px-2 py-0.5 ${
        enabled
          ? "border-blue-300 bg-blue-50 text-blue-700"
          : "border-gray-300 bg-gray-50 text-gray-500"
      }`}
    >
      {enabled ? `${label} On` : `${label} Off`}
    </Badge>
  )
}

function DaysCell({ value, label }: { value: number | string; label: string }) {
  return (
    <span
      title={label}
      className="inline-flex items-center gap-1 text-sm font-medium text-gray-700"
    >
      <span className="inline-flex items-center justify-center h-6 min-w-[28px] px-1.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
        {value}
      </span>
      <span className="text-xs text-gray-400">days</span>
    </span>
  )
}

// ─── Main table ────────────────────────────────────────────────────────────────

export default function ContinuousDaysBlockingTable({
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
}: ContinuousDaysBlockingTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading continuous days blocking configs...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No continuous days blocking configs found</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Table className="min-w-[1200px]">
          <DataTableHeader>
            <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                Sl No
              </TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                Subsidiary Codes
              </TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                Present Blocking Days
              </TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                Absent Blocking Days
              </TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                Consider As Present
              </TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                Notification
              </TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                Blocking
              </TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                Status
              </TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                Action
              </TableHead>
            </TableRow>
          </DataTableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row._id || index}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                <TableCell className="px-5 py-2 text-sm">{startIndex + index + 1}</TableCell>

                {/* Subsidiary codes — joined string with tooltip if multiple */}
                <TableCell className="px-5 py-2 text-sm">
                  <span
                    className="font-medium"
                    title={row.subsidiaryCount > 1 ? row.subsidiaryCodes : undefined}
                  >
                    {row.subsidiaryCodes}
                  </span>
                  {row.subsidiaryCount > 1 && (
                    <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-gray-600 text-[10px] font-medium">
                      {row.subsidiaryCount}
                    </span>
                  )}
                </TableCell>

                {/* Present blocking days */}
                <TableCell className="px-5 py-2 text-center">
                  <DaysCell
                    value={row.daysForContinuousPresentBlocking}
                    label="Continuous Present Blocking Days"
                  />
                </TableCell>

                {/* Absent blocking days */}
                <TableCell className="px-5 py-2 text-center">
                  <DaysCell
                    value={row.daysForContinuousAbsentBlocking}
                    label="Continuous Absent Blocking Days"
                  />
                </TableCell>

                {/* Consider as present tags */}
                <TableCell className="px-5 py-2 text-sm max-w-[180px] truncate" title={row.considerDaysAsPresent}>
                  {row.considerDaysAsPresent}
                </TableCell>

                {/* Notification toggle */}
                <TableCell className="px-5 py-2">
                  <EnabledBadge enabled={row.notificationEnabled} label="Notif." />
                </TableCell>

                {/* Blocking toggle */}
                <TableCell className="px-5 py-2">
                  <EnabledBadge enabled={row.blockingEnabled} label="Block" />
                </TableCell>

                {/* Active status */}
                <TableCell className="px-5 py-2">
                  <ActiveBadge isActive={row.isActive} />
                </TableCell>

                {/* Actions */}
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