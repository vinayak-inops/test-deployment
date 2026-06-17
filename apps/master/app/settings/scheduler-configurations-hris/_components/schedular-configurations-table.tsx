"use client"

import { Edit, MoreVertical, Loader2, CalendarClock, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader as DataTableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { SchedulerRow } from "./hooks/useschedulerconfiglogic"
import { useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SchedulerConfigTableProps {
  rows: SchedulerRow[]
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

function formatDateTime(value?: string | null) {
  if (!value || value === "-") return "-"

  const raw = String(value).trim()
  if (!raw) return "-"

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    if (Number.isNaN(date.getTime())) return raw
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// ─── Truncate Text Component ───────────────────────────────────────────────────

function TruncatedText({ text, maxWidth = 200 }: { text: string; maxWidth?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="truncate"
        style={{ maxWidth: `${maxWidth}px` }}
        title={text}
      >
        {text}
      </div>
      {isHovered && text.length > 30 && (
        <div className="absolute z-50 left-0 top-full mt-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-normal max-w-md break-words">
          {text}
        </div>
      )}
    </div>
  )
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
  SchedulerConfigTableProps,
  "totalCount" | "totalPages" | "safePage" | "startIndex" | "endIndex" | "setCurrentPage"
>) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 flex-wrap gap-2">
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

// ─── Active badge ──────────────────────────────────────────────────────────────

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

// ─── Main table ────────────────────────────────────────────────────────────────

export default function SchedulerConfigTable({
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
}: SchedulerConfigTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading scheduler configurations...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <CalendarClock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No scheduler configurations found</p>
      </div>
    )
  }

  // Column width definitions (min-width in px)
  const columnWidths = {
    slNo: { min: 70, max: 70 },
    schedulerName: { min: 150, max: 250 },
    schedulerType: { min: 130, max: 150 },
    task: { min: 180, max: 250 },
    description: { min: 200, max: 300 },
    frequencyType: { min: 120, max: 150 },
    timezone: { min: 130, max: 180 },
    startDate: { min: 150, max: 180 },
    endDate: { min: 150, max: 180 },
    status: { min: 90, max: 90 },
    action: { min: 80, max: 80 },
  }

  return (
    <>
      <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Table className="min-w-[1400px] w-full">
          <DataTableHeader>
            <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
              <TableHead 
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.slNo.min, maxWidth: columnWidths.slNo.max, width: columnWidths.slNo.min }}
              >
                Sl No
              </TableHead>
              <TableHead 
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.schedulerName.min, maxWidth: columnWidths.schedulerName.max }}
              >
                Scheduler Name
              </TableHead>
              <TableHead 
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.schedulerType.min, maxWidth: columnWidths.schedulerType.max }}
              >
                Scheduler Type
              </TableHead>
              <TableHead 
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.task.min, maxWidth: columnWidths.task.max }}
              >
                Task
              </TableHead>
              <TableHead 
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.description.min, maxWidth: columnWidths.description.max }}
              >
                Description
              </TableHead>
              <TableHead 
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.frequencyType.min, maxWidth: columnWidths.frequencyType.max }}
              >
                Frequency Type
              </TableHead>
              <TableHead 
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.timezone.min, maxWidth: columnWidths.timezone.max }}
              >
                Timezone
              </TableHead>
              <TableHead 
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.startDate.min, maxWidth: columnWidths.startDate.max }}
              >
                Start Date
              </TableHead>
              <TableHead 
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.endDate.min, maxWidth: columnWidths.endDate.max }}
              >
                End Date
              </TableHead>
              <TableHead 
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.status.min, maxWidth: columnWidths.status.max, width: columnWidths.status.min }}
              >
                Status
              </TableHead>
              <TableHead 
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10"
                style={{ minWidth: columnWidths.action.min, maxWidth: columnWidths.action.max, width: columnWidths.action.min }}
              >
                Action
              </TableHead>
            </TableRow>
          </DataTableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row._id || `${row.schedulerName}-${index}`}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                <TableCell className="px-5 py-2 text-sm" style={{ width: columnWidths.slNo.min }}>
                  {startIndex + index + 1}
                </TableCell>
                
                <TableCell className="px-5 py-2 font-medium text-sm">
                  <TruncatedText text={row.schedulerName} maxWidth={columnWidths.schedulerName.max} />
                </TableCell>
                
                <TableCell className="px-5 py-2 text-sm">
                  <TruncatedText text={row.schedulerType} maxWidth={columnWidths.schedulerType.max} />
                </TableCell>
                
                <TableCell className="px-5 py-2 text-sm">
                  <TruncatedText text={row.task} maxWidth={columnWidths.task.max} />
                </TableCell>
                
                <TableCell className="px-5 py-2 text-sm">
                  <TruncatedText text={row.description} maxWidth={columnWidths.description.max} />
                </TableCell>
                
                <TableCell className="px-5 py-2 text-sm capitalize">
                  <TruncatedText text={row.frequencyType} maxWidth={columnWidths.frequencyType.max} />
                </TableCell>
                
                <TableCell className="px-5 py-2 text-sm">
                  <TruncatedText text={row.timezone} maxWidth={columnWidths.timezone.max} />
                </TableCell>
                
                <TableCell className="px-5 py-2 text-sm whitespace-nowrap">
                  {formatDateTime(row.startDate)}
                </TableCell>
                
                <TableCell className="px-5 py-2 text-sm whitespace-nowrap">
                  {formatDateTime(row.endDate)}
                </TableCell>
                
                <TableCell className="px-5 py-2">
                  <ActiveBadge isActive={row.isActive} />
                </TableCell>
                
                <TableCell
                  className="px-5 py-2 sticky right-0 bg-white z-10"
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: columnWidths.action.min }}
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