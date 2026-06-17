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
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  ClipboardList,
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
import type { WfhPolicyRow } from "./hooks/useWfhPolicyLogic"

// ─── Types ────────────────────────────────────────────────────────────────────

interface WfhPolicyTableProps {
  rows: WfhPolicyRow[]
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

// ─── Boolean Chip ─────────────────────────────────────────────────────────────

function BoolChip({ value, label }: { value: boolean; label: string }) {
  return value ? (
    <span className="inline-flex items-center gap-0.5 text-xs text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
      <XCircle className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

// ─── WFH Policy Flags Hover Card ─────────────────────────────────────────────

function WfhFlagsSummary({ row }: { row: WfhPolicyRow }) {
  const [isHovered, setIsHovered] = useState(false)

  const flags = [
    { label: "Half Day",      value: row.halfDayAllowed        },
    { label: "Auto Approval", value: row.autoApproval          },
    { label: "Back Date",     value: row.backDateAllowed        },
    { label: "Notice Period", value: row.allowedInNoticePeriod },
  ]

  const activeCount = flags.filter((f) => f.value).length

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Badge
        variant="outline"
        className="text-xs font-medium px-2 py-0.5 border-purple-300 bg-purple-50 text-purple-700 cursor-default"
      >
        {activeCount}/{flags.length} Active
      </Badge>

      {isHovered && (
        <div className="absolute z-50 left-0 top-full mt-1 p-3 bg-gray-900 text-white text-xs rounded shadow-lg min-w-[190px]">
          <p className="font-semibold mb-2 text-gray-300 uppercase tracking-wide">
            Policy Flags
          </p>
          <div className="space-y-1.5">
            {flags.map((f) => (
              <div key={f.label} className="flex items-center justify-between gap-3">
                <span className="text-gray-400">{f.label}:</span>
                {f.value ? (
                  <span className="text-green-400 font-medium">Yes</span>
                ) : (
                  <span className="text-gray-500">No</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Category Pills with Read More ───────────────────────────────────────────

function CategoryPills({ categories }: { categories: string[] }) {
  const [showAll, setShowAll] = useState(false)
  const DISPLAY_LIMIT = 5
  const hasMore = categories.length > DISPLAY_LIMIT
  const displayCategories = showAll ? categories : categories.slice(0, DISPLAY_LIMIT)

  if (!categories.length)
    return <span className="text-xs text-gray-400">—</span>

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
          {showAll ? "Show less" : `Read more (+${categories.length - DISPLAY_LIMIT} more)`}
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
  WfhPolicyTableProps,
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

export default function WfhPolicyTable({
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
}: WfhPolicyTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">
          Loading WFH policy records...
        </p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No WFH policy records found
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

              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 w-14">
                Sl No
              </TableHead>

              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Subsidiary
                </div>
              </TableHead>

              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location
                </div>
              </TableHead>

              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Designation
                </div>
              </TableHead>

              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Category
                </div>
              </TableHead>

              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1">
                  <ClipboardList className="h-3 w-3" />
                  Policy
                </div>
              </TableHead>

              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                Max / Week
              </TableHead>

              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 text-center">
                Max / Month
              </TableHead>

              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">
                Flags
              </TableHead>

              <TableHead className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10 w-20">
                Action
              </TableHead>
            </TableRow>
          </DataTableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row._id || `wfh-${index}`}
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
                      {row.locationCode} · {row.stateCode}, {row.countryCode}
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

                {/* Employee Category */}
                <TableCell className="px-4 py-2">
                  <CategoryPills categories={row.employeeCategory} />
                </TableCell>

                {/* Policy */}
                <TableCell className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">
                      {row.wfhPolicyTitle}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {row.wfhPolicyCode}
                    </span>
                  </div>
                </TableCell>

                {/* Max / Week */}
                <TableCell className="px-4 py-2 text-center">
                  <Badge
                    variant="outline"
                    className="text-xs font-medium bg-blue-50 border-blue-200 text-blue-700"
                  >
                    {row.maxDaysPerWeek} days
                  </Badge>
                </TableCell>

                {/* Max / Month */}
                <TableCell className="px-4 py-2 text-center">
                  <Badge
                    variant="outline"
                    className="text-xs font-medium bg-indigo-50 border-indigo-200 text-indigo-700"
                  >
                    {row.maxDaysPerMonth} days
                  </Badge>
                </TableCell>

                {/* Flags */}
                <TableCell className="px-4 py-2">
                  <WfhFlagsSummary row={row} />
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