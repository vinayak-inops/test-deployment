"use client"

import { Edit, MoreVertical, Loader2, FileSpreadsheet, ChevronLeft, ChevronRight, TrendingUp, Users, DollarSign, Building2, Shield, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader as DataTableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { WageEmployerContributionsRow } from "./hooks/useWageEmployerContributionsLogic"
import { useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface WageEmployerContributionsTableProps {
  rows: WageEmployerContributionsRow[]
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

// ─── Status Badge Component ─────────────────────────────────────────────────

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <Badge
      variant={enabled ? "default" : "secondary"}
      className={`text-xs font-medium ${
        enabled
          ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200"
      }`}
    >
      {enabled ? "Enabled" : "Disabled"}
    </Badge>
  )
}

// ─── Contribution Summary Badge ───────────────────────────────────────────────────

function ContributionSummary({ pfRate, esiRate, lwfCount }: { pfRate: number; esiRate: number; lwfCount: number }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 border-purple-300 bg-purple-50 text-purple-700 cursor-default">
        <TrendingUp className="h-3 w-3 mr-1" />
        {pfRate + esiRate}% Total
      </Badge>

      {isHovered && (
        <div className="absolute z-50 left-0 top-full mt-1 p-3 bg-gray-900 text-white text-xs rounded shadow-lg min-w-[240px]">
          <p className="font-semibold mb-2 text-gray-300 uppercase tracking-wide">Contribution Details</p>
          <table className="w-full text-xs">
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="py-1 pr-3 text-gray-400">PF Employer Rate:</td>
                <td className="py-1 text-right font-medium">{pfRate}%</td>
              </tr>
              <tr className="border-b border-gray-700">
                <td className="py-1 pr-3 text-gray-400">ESI Employer Rate:</td>
                <td className="py-1 text-right font-medium">{esiRate}%</td>
              </tr>
              <tr>
                <td className="py-1 pr-3 text-gray-400">LWF Configurations:</td>
                <td className="py-1 text-right font-medium">{lwfCount}</td>
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
}: Pick<WageEmployerContributionsTableProps, "totalCount" | "totalPages" | "safePage" | "startIndex" | "endIndex" | "setCurrentPage">) {
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

export default function WageEmployerContributionsTable({
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
}: WageEmployerContributionsTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading wage employer contributions records...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No wage employer contributions found</p>
      </div>
    )
  }

  // Column width configuration
  const col = {
    slNo: { min: 60, max: 60 },
    pfStatus: { min: 100, max: 120 },
    pfLimit: { min: 120, max: 140 },
    pfRate: { min: 100, max: 120 },
    esiStatus: { min: 100, max: 120 },
    esiLimit: { min: 120, max: 140 },
    esiRate: { min: 100, max: 120 },
    contributions: { min: 120, max: 140 },
    lwfStates: { min: 120, max: 150 },
    action: { min: 80, max: 80 },
  }

  return (
    <>
      <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Table className="min-w-[1200px] w-full">
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
                style={{ minWidth: col.pfStatus.min, maxWidth: col.pfStatus.max }}
              >
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  PF Status
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.pfLimit.min, maxWidth: col.pfLimit.max }}
              >
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  PF Wage Limit
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.pfRate.min, maxWidth: col.pfRate.max }}
              >
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  PF Employer Rate
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.esiStatus.min, maxWidth: col.esiStatus.max }}
              >
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  ESI Status
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.esiLimit.min, maxWidth: col.esiLimit.max }}
              >
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ESI Salary Limit
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.esiRate.min, maxWidth: col.esiRate.max }}
              >
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  ESI Employer Rate
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.contributions.min, maxWidth: col.contributions.max }}
              >
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Total Contribution
                </div>
              </TableHead>
              <TableHead
                className="px-4 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: col.lwfStates.min, maxWidth: col.lwfStates.max }}
              >
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  LWF States
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
                key={row._id || `${row.organizationCode}-${index}`}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                <TableCell className="px-4 py-2 text-sm text-gray-500">
                  {startIndex + index + 1}
                </TableCell>

                <TableCell className="px-4 py-2">
                  <StatusBadge enabled={row.pfEnabled} />
                </TableCell>

                <TableCell className="px-4 py-2">
                  <span className="text-sm text-gray-800">
                    {row.pfMaxWageLimit ? `₹${row.pfMaxWageLimit.toLocaleString()}` : "-"}
                  </span>
                </TableCell>

                <TableCell className="px-4 py-2">
                  <span className="text-sm font-medium text-gray-800">{row.pfEmployerRate}%</span>
                </TableCell>

                <TableCell className="px-4 py-2">
                  <StatusBadge enabled={row.esiEnabled} />
                </TableCell>

                <TableCell className="px-4 py-2">
                  <span className="text-sm text-gray-800">
                    {row.esiMaxGrossSalaryLimit ? `₹${row.esiMaxGrossSalaryLimit.toLocaleString()}` : "-"}
                  </span>
                </TableCell>

                <TableCell className="px-4 py-2">
                  <span className="text-sm font-medium text-gray-800">{row.esiEmployerRate}%</span>
                </TableCell>

                <TableCell className="px-4 py-2">
                  <ContributionSummary
                    pfRate={row.pfEmployerRate}
                    esiRate={row.esiEmployerRate}
                    lwfCount={row.lwfStateCount}
                  />
                </TableCell>

                <TableCell className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {row.lwfStates.slice(0, 2).map((state:any, idx:number) => (
                      <Badge key={idx} variant="outline" className="text-xs bg-gray-50">
                        {state}
                      </Badge>
                    ))}
                    {row.lwfStates.length > 2 && (
                      <Badge variant="outline" className="text-xs bg-gray-50">
                        +{row.lwfStates.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>

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