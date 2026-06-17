"use client"

import { Edit, MoreVertical, Loader2, Receipt, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader as DataTableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { ProfessionalTaxRow } from "./hooks/useProfessionaltaxlogic"
import { useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfessionalTaxTableProps {
  rows: ProfessionalTaxRow[]
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

function formatDate(value?: string | null) {
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

function formatCurrency(value?: number | null) {
  if (value == null) return "-"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
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

// ─── Slabs Summary Component ───────────────────────────────────────────────────

interface Slab {
  from: number
  to: number
  amount: number
  parseID: string
}

function SlabsSummary({ slabs }: { slabs: Slab[] }) {
  const [isHovered, setIsHovered] = useState(false)

  if (!slabs || slabs.length === 0) return <span className="text-gray-400">-</span>

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Badge
        variant="outline"
        className="text-xs font-medium px-2 py-0.5 border-blue-300 bg-blue-50 text-blue-700 cursor-default"
      >
        {slabs.length} slab{slabs.length > 1 ? "s" : ""}
      </Badge>

      {isHovered && (
        <div className="absolute z-50 left-0 top-full mt-1 p-3 bg-gray-900 text-white text-xs rounded shadow-lg min-w-[260px]">
          <p className="font-semibold mb-2 text-gray-300 uppercase tracking-wide">Slab Details</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left pb-1 pr-3">From (₹)</th>
                <th className="text-left pb-1 pr-3">To (₹)</th>
                <th className="text-left pb-1">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {slabs.map((slab) => (
                <tr key={slab.parseID} className="border-b border-gray-800">
                  <td className="py-1 pr-3">{slab.from.toLocaleString("en-IN")}</td>
                  <td className="py-1 pr-3">{slab.to.toLocaleString("en-IN")}</td>
                  <td className="py-1">{slab.amount.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  ProfessionalTaxTableProps,
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

// ─── Main table ────────────────────────────────────────────────────────────────

export default function ProfessionalTaxTable({
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
}: ProfessionalTaxTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading professional tax configurations...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <Receipt className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No professional tax configurations found</p>
      </div>
    )
  }

  // Column width definitions (min-width in px)
  const columnWidths = {
    slNo: { min: 70, max: 70 },
    country: { min: 120, max: 160 },
    state: { min: 140, max: 180 },
    applicableTo: { min: 130, max: 160 },
    effectiveFrom: { min: 140, max: 160 },
    slabs: { min: 110, max: 130 },
    updatedOn: { min: 170, max: 200 },
    action: { min: 80, max: 80 },
  }

  return (
    <>
      <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Table className="min-w-[1000px] w-full">
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
                style={{ minWidth: columnWidths.country.min, maxWidth: columnWidths.country.max }}
              >
                Country
              </TableHead>
              <TableHead
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.state.min, maxWidth: columnWidths.state.max }}
              >
                State
              </TableHead>
              <TableHead
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.applicableTo.min, maxWidth: columnWidths.applicableTo.max }}
              >
                Applicable To
              </TableHead>
              <TableHead
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.effectiveFrom.min, maxWidth: columnWidths.effectiveFrom.max }}
              >
                Effective From
              </TableHead>
              <TableHead
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.slabs.min, maxWidth: columnWidths.slabs.max }}
              >
                Slabs
              </TableHead>
              <TableHead
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                style={{ minWidth: columnWidths.updatedOn.min, maxWidth: columnWidths.updatedOn.max }}
              >
                Updated On
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
                key={row._id || `${row.country}-${row.state}-${index}`}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                <TableCell className="px-5 py-2 text-sm" style={{ width: columnWidths.slNo.min }}>
                  {startIndex + index + 1}
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <TruncatedText text={row.country} maxWidth={columnWidths.country.max} />
                </TableCell>

                <TableCell className="px-5 py-2 font-medium text-sm">
                  <TruncatedText text={row.state} maxWidth={columnWidths.state.max} />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium px-2 py-0.5 ${
                      row.applicableTo === "Female"
                        ? "border-pink-300 bg-pink-50 text-pink-700"
                        : row.applicableTo === "Male"
                        ? "border-sky-300 bg-sky-50 text-sky-700"
                        : "border-gray-300 bg-gray-50 text-gray-700"
                    }`}
                  >
                    {row.applicableTo}
                  </Badge>
                </TableCell>

                <TableCell className="px-5 py-2 text-sm whitespace-nowrap">
                  {formatDate(row.effectiveFrom)}
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <SlabsSummary slabs={row.slabs} />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm whitespace-nowrap">
                  {formatDate(row.updatedOn)}
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