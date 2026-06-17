"use client"

import {
  Edit,
  MoreVertical,
  Loader2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  Tag,
  Users,
  Briefcase,
  Clock,
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
import { useState } from "react"
import type { CompOffPolicyRow } from "./hooks/useCompOffPolicyLogic"

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompOffPolicyTableProps {
  rows: CompOffPolicyRow[]
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

// ─── Generation Unit Badge ────────────────────────────────────────────────────

const UNIT_STYLES: Record<string, string> = {
  days:  "border-blue-300  bg-blue-50  text-blue-700",
  hours: "border-violet-300 bg-violet-50 text-violet-700",
}

function GenerationUnitBadge({ unit }: { unit: string }) {
  const cls = UNIT_STYLES[unit] ?? "border-gray-300 bg-gray-50 text-gray-700"
  return (
    <Badge variant="outline" className={`text-xs font-medium px-2 py-0.5 ${cls}`}>
      <Clock className="h-3 w-3 mr-1" />
      {unit}
    </Badge>
  )
}

// ─── Generate-On Flags ────────────────────────────────────────────────────────

function GenerateOnFlags({
  weekDay,
  weekOff,
  holiday,
}: {
  weekDay: boolean
  weekOff: boolean
  holiday: boolean
}) {
  const flags = [
    { label: "Week Day", active: weekDay },
    { label: "Week Off", active: weekOff },
    { label: "Holiday",  active: holiday },
  ]
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map(({ label, active }) => (
        <span
          key={label}
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
            active
              ? "bg-green-50 border-green-300 text-green-700"
              : "bg-gray-50 border-gray-200 text-gray-400"
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  )
}

// ─── Employee Category Pills with Read More ───────────────────────────────────

function CategoryPills({ categories }: { categories: string[] }) {
  const [showAll, setShowAll] = useState(false)
  const DISPLAY_LIMIT = 3
  const hasMore = categories.length > DISPLAY_LIMIT
  const displayCategories = showAll ? categories : categories.slice(0, DISPLAY_LIMIT)

  if (!categories.length) return <span className="text-xs text-gray-400">—</span>

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {displayCategories.map((cat) => (
          <Badge
            key={cat}
            variant="outline"
            className="text-xs font-mono bg-gray-100 px-1.5 py-0"
          >
            {cat}
          </Badge>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-left w-fit"
        >
          {showAll
            ? "Show less"
            : `Read more (+${categories.length - DISPLAY_LIMIT} more)`}
        </button>
      )}
    </div>
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
  CompOffPolicyTableProps,
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

export default function CompOffPolicyTable({
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
}: CompOffPolicyTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">
          Loading comp-off policy records...
        </p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No comp-off policy records found
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Table className="min-w-[1300px] w-full">
          <DataTableHeader>
            <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
              {/* Sl No */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 w-14">
                Sl No
              </TableHead>

              {/* Subsidiary */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Subsidiary
                </div>
              </TableHead>

              {/* Location */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location
                </div>
              </TableHead>

              {/* Designation */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Designation
                </div>
              </TableHead>

              {/* Policy Code & Title */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Policy
                </div>
              </TableHead>

              {/* Generation Unit */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Unit
                </div>
              </TableHead>

              {/* Generate On */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                Generate On
              </TableHead>

              {/* Employee Category */}
              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Employee Category
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
                key={row._id || `compoff-${index}`}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                {/* Sl No */}
                <TableCell className="px-4 py-2 text-sm text-gray-500">
                  {startIndex + index + 1}
                </TableCell>

                {/* Subsidiary */}
                <TableCell className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">
                      {row.subsidiaryName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {row.subsidiaryCode}
                    </span>
                  </div>
                </TableCell>

                {/* Location */}
                <TableCell className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-800">
                      {row.locationName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {row.locationCode}
                    </span>
                  </div>
                </TableCell>

                {/* Designation */}
                <TableCell className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-800">
                      {row.designationName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {row.designationCode}
                    </span>
                  </div>
                </TableCell>

                {/* Policy */}
                <TableCell className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">
                      {row.compOffPolicyTitle}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {row.compOffPolicyCode}
                    </span>
                  </div>
                </TableCell>

                {/* Generation Unit */}
                <TableCell className="px-4 py-2">
                  <GenerationUnitBadge unit={row.compOffGenerationUnit} />
                </TableCell>

                {/* Generate On */}
                <TableCell className="px-4 py-2">
                  <GenerateOnFlags
                    weekDay={row.generateOnWeekDay}
                    weekOff={row.generateOnWeekOff}
                    holiday={row.generateOnHoliday}
                  />
                </TableCell>

                {/* Employee Category */}
                <TableCell className="px-4 py-2">
                  <CategoryPills categories={row.employeeCategory} />
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