"use client"

import { Edit, MoreVertical, Loader2, FileSpreadsheet, ChevronLeft, ChevronRight, TrendingUp, Users, Calendar, Clock, Briefcase, Building2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader as DataTableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { ManpowerPlanningRow } from "./hooks/useManpowerPlanningLogic"
import { useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManpowerPlanningTableProps {
  rows: ManpowerPlanningRow[]
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

// ─── Truncated Text Component ─────────────────────────────────────────────────

function TruncatedText({ text, maxWidth = 150 }: { text: string; maxWidth?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="truncate" style={{ maxWidth: `${maxWidth}px` }} title={text}>
        {text}
      </div>
      {isHovered && text.length > 25 && (
        <div className="absolute z-50 left-0 top-full mt-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-normal max-w-md break-words">
          {text}
        </div>
      )}
    </div>
  )
}

// ─── Manpower Summary Badge ───────────────────────────────────────────────────

function ManpowerSummary({ row }: { row: ManpowerPlanningRow }) {
  const [isHovered, setIsHovered] = useState(false)
  const { planned, rotaPlanned, bench, iedRequired, totalManpower } = row

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 border-blue-300 bg-blue-50 text-blue-700 cursor-default">
        <TrendingUp className="h-3 w-3 mr-1" />
        {totalManpower} Total
      </Badge>

      {isHovered && (
        <div className="absolute z-50 left-0 top-full mt-1 p-3 bg-gray-900 text-white text-xs rounded shadow-lg min-w-[220px]">
          <p className="font-semibold mb-2 text-gray-300 uppercase tracking-wide">Breakdown</p>
          <table className="w-full text-xs">
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="py-1 pr-3 text-gray-400">Planned:</td>
                <td className="py-1 text-right font-medium">{planned.toLocaleString()}</td>
               </tr>
              <tr className="border-b border-gray-700">
                <td className="py-1 pr-3 text-gray-400">Rota Planned:</td>
                <td className="py-1 text-right font-medium">{rotaPlanned.toLocaleString()}</td>
               </tr>
              <tr className="border-b border-gray-700">
                <td className="py-1 pr-3 text-gray-400">Bench:</td>
                <td className="py-1 text-right font-medium">{bench.toLocaleString()}</td>
               </tr>
              <tr>
                <td className="py-1 pr-3 text-gray-400">IED Required:</td>
                <td className="py-1 text-right font-medium">{iedRequired.toLocaleString()}</td>
               </tr>
              <tr className="border-t border-gray-600 mt-1 pt-1">
                <td className="py-1 pr-3 font-semibold text-gray-200">Total:</td>
                <td className="py-1 text-right font-bold text-blue-300">{totalManpower.toLocaleString()}</td>
               </tr>
            </tbody>
           </table>
        </div>
      )}
    </div>
  )
}

// ─── Pagination Controls ──────────────────────────────────────────────────────

function PaginationControls({
  totalCount, totalPages, safePage, startIndex, endIndex, setCurrentPage,
}: Pick<ManpowerPlanningTableProps, "totalCount" | "totalPages" | "safePage" | "startIndex" | "endIndex" | "setCurrentPage">) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 flex-wrap gap-2">
      <div className="text-xs text-gray-600">
        {totalCount > 0
          ? <>Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} entries</>
          : <>No entries found</>}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline" size="sm"
          onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          className="h-7 w-7 p-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => page === 1 || page === totalPages || (page >= safePage - 1 && page <= safePage + 1))
            .map((page, index, array) => {
              const needsEllipsis = index > 0 && page - array[index - 1] > 1
              return (
                <div key={page} className="flex items-center gap-1">
                  {needsEllipsis && <span className="px-2 text-xs text-gray-500">...</span>}
                  <Button
                    variant="outline" size="sm"
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
          variant="outline" size="sm"
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

// ─── Main Table Component ─────────────────────────────────────────────────────

export default function ManpowerPlanningTable({
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
}: ManpowerPlanningTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading manpower planning records...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No manpower planning records found</p>
      </div>
    )
  }

  // Column width configuration
  const col = {
    slNo:           { min: 60,  max: 60  },
    subsidiary:     { min: 130, max: 160 },
    division:       { min: 130, max: 160 },
    location:       { min: 120, max: 140 },
    department:     { min: 130, max: 160 },
    dateRange:      { min: 180, max: 200 },
    shiftGroup:     { min: 90,  max: 100 },
    shiftCode:      { min: 80,  max: 90  },
    manpower:       { min: 100, max: 120 },
    action:         { min: 80,  max: 80  },
  }

  return (
    <>
      <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Table className="min-w-[1300px] w-full">
          <DataTableHeader>
            <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.slNo.min, maxWidth: col.slNo.max }}
              >
                Sl No
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.subsidiary.min, maxWidth: col.subsidiary.max }}
              >
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Subsidiary
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.division.min, maxWidth: col.division.max }}
              >
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Division
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.location.min, maxWidth: col.location.max }}
              >
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.department.min, maxWidth: col.department.max }}
              >
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  Department
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.dateRange.min, maxWidth: col.dateRange.max }}
              >
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date Range
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.shiftGroup.min, maxWidth: col.shiftGroup.max }}
              >
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Shift Group
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.shiftCode.min, maxWidth: col.shiftCode.max }}
              >
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Shift
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.manpower.min, maxWidth: col.manpower.max }}
              >
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Manpower
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10"
                style={{ minWidth: col.action.min, maxWidth: col.action.max }}
              >
                Action
              </TableHead>
            </TableRow>
          </DataTableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row._id || `${row.subsidiaryCode}-${index}`}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                {/* Sl No */}
                <TableCell className="px-4 py-2 text-sm text-gray-500">
                  {startIndex + index + 1}
                </TableCell>

                {/* Subsidiary */}
                <TableCell className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">{row.subsidiaryName}</span>
                    <span className="text-xs text-gray-400">{row.subsidiaryCode}</span>
                  </div>
                </TableCell>

                {/* Division */}
                <TableCell className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-800">{row.divisionName}</span>
                    <span className="text-xs text-gray-400">{row.divisionCode}</span>
                  </div>
                </TableCell>

                {/* Location */}
                <TableCell className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-800">{row.locationName}</span>
                    <span className="text-xs text-gray-400">{row.locationCode}</span>
                  </div>
                </TableCell>

                {/* Department */}
                <TableCell className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-800">{row.departmentName}</span>
                    <span className="text-xs text-gray-400">{row.departmentCode}</span>
                  </div>
                </TableCell>

                {/* Date Range */}
                <TableCell className="px-4 py-2">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-800">{row.fromDate}</span>
                    <span className="text-xs text-gray-400">→ {row.toDate}</span>
                  </div>
                </TableCell>

                {/* Shift Group */}
                <TableCell className="px-4 py-2">
                  <Badge variant="outline" className="text-xs font-mono bg-gray-100">
                    {row.shiftGroupCode}
                  </Badge>
                </TableCell>

                {/* Shift Code */}
                <TableCell className="px-4 py-2">
                  <Badge variant="outline" className="text-xs font-mono bg-gray-100">
                    {row.shiftCode}
                  </Badge>
                </TableCell>

                {/* Manpower Summary */}
                <TableCell className="px-4 py-2">
                  <ManpowerSummary row={row} />
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