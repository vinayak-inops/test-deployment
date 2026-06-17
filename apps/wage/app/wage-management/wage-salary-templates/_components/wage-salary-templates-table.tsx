"use client"

import { Edit, MoreVertical, Loader2, FileSpreadsheet, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader as DataTableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { WageSalaryTemplateRow, SalaryHead } from "./hooks/useWagesalaryTemplateslogic"
import { useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface WageSalaryTemplatesTableProps {
  rows: WageSalaryTemplateRow[]
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value?: string | null) {
  if (!value || value === "-") return "-"
  const raw = String(value).trim()
  if (!raw) return "-"

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    if (Number.isNaN(date.getTime())) return raw
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString("en-IN", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: true,
  })
}

// ─── Truncate Text ────────────────────────────────────────────────────────────

function TruncatedText({ text, maxWidth = 200 }: { text: string; maxWidth?: number }) {
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
      {isHovered && text.length > 30 && (
        <div className="absolute z-50 left-0 top-full mt-1 p-2 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-normal max-w-md break-words">
          {text}
        </div>
      )}
    </div>
  )
}

// ─── Salary Heads Summary ─────────────────────────────────────────────────────

function SalaryHeadsSummary({ heads, label }: { heads: SalaryHead[]; label: string }) {
  const [isHovered, setIsHovered] = useState(false)
  const valid = heads.filter((h) => h.salaryHeadName || h.salaryHeadCode)

  if (!valid.length) return <span className="text-gray-400">-</span>

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 border-indigo-300 bg-indigo-50 text-indigo-700 cursor-default">
        {valid.length} {label}
      </Badge>

      {isHovered && (
        <div className="absolute z-50 left-0 top-full mt-1 p-3 bg-gray-900 text-white text-xs rounded shadow-lg min-w-[280px]">
          <p className="font-semibold mb-2 text-gray-300 uppercase tracking-wide">{label}</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left pb-1 pr-3">Code</th>
                <th className="text-left pb-1 pr-3">Name</th>
                <th className="text-left pb-1">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {valid.map((h) => (
                <tr key={h.parseID} className="border-b border-gray-800">
                  <td className="py-1 pr-3">{h.salaryHeadCode || "-"}</td>
                  <td className="py-1 pr-3">{h.salaryHeadName || "-"}</td>
                  <td className="py-1">{h.amount.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Dependent Heads Summary ──────────────────────────────────────────────────

function DependentHeadsSummary({ heads }: { heads: string[] }) {
  const [isHovered, setIsHovered] = useState(false)
  const valid = heads.filter(Boolean)

  if (!valid.length) return <span className="text-gray-400">-</span>

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 border-amber-300 bg-amber-50 text-amber-700 cursor-default">
        {valid.length} head{valid.length > 1 ? "s" : ""}
      </Badge>

      {isHovered && (
        <div className="absolute z-50 left-0 top-full mt-1 p-3 bg-gray-900 text-white text-xs rounded shadow-lg min-w-[180px]">
          <p className="font-semibold mb-2 text-gray-300 uppercase tracking-wide">Dependent Heads</p>
          <ul className="space-y-1">
            {valid.map((h, i) => (
              <li key={i} className="text-gray-200">{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Nested Info Cell ─────────────────────────────────────────────────────────

function NestedInfo({ primary, secondary }: { primary: string; secondary?: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {secondary && secondary !== "-" && <span className="w-fit font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{secondary}</span>}
      <span className="text-sm font-medium text-gray-800 truncate">{primary}</span>
    </div>
  )
}

// ─── Pagination ────────────────────────────────────────────────────────────────

function PaginationControls({
  totalCount, totalPages, safePage, startIndex, endIndex, setCurrentPage,
}: Pick<WageSalaryTemplatesTableProps, "totalCount" | "totalPages" | "safePage" | "startIndex" | "endIndex" | "setCurrentPage">) {
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

// ─── Main Table ───────────────────────────────────────────────────────────────

export default function WageSalaryTemplatesTable({
  rows, loading, countLoading, totalCount, totalPages, safePage,
  startIndex, endIndex, setCurrentPage, viewMode, editMode, onEdit, onView,
}: WageSalaryTemplatesTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading salary templates...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No salary templates found</p>
      </div>
    )
  }

  const col = {
    slNo:          { min: 70,  max: 70  },
    name:          { min: 180, max: 220 },
    code:          { min: 110, max: 130 },
    subsidiary:    { min: 150, max: 180 },
    location:      { min: 150, max: 180 },
    state:         { min: 110, max: 140 },
    zone:          { min: 100, max: 130 },
    designation:   { min: 160, max: 200 },
    grade:         { min: 140, max: 180 },
    category:      { min: 130, max: 160 },
    skillLevel:    { min: 140, max: 180 },
    effectiveFrom: { min: 130, max: 150 },
    effectiveTo:   { min: 130, max: 150 },
    salaryHeads:   { min: 110, max: 130 },
    indHeads:      { min: 120, max: 140 },
    depHeads:      { min: 110, max: 130 },
    minWages:      { min: 110, max: 120 },
    updatedOn:     { min: 170, max: 200 },
    action:        { min: 80,  max: 80  },
  }

  return (
    <>
      <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Table className="min-w-[2400px] w-full">
          <DataTableHeader>
            <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
              {[
                ["Sl No",        col.slNo],
                ["Name",         col.name],
                ["Code",         col.code],
                ["Subsidiary",   col.subsidiary],
                ["Location",     col.location],
                ["State",        col.state],
                ["Zone",         col.zone],
                ["Designation",  col.designation],
                ["Grade",        col.grade],
                ["Category",     col.category],
                ["Skill Level",  col.skillLevel],
                ["Effective From", col.effectiveFrom],
                ["Effective To", col.effectiveTo],
                ["Salary Heads", col.salaryHeads],
                ["Indep. Heads", col.indHeads],
                ["Dep. Heads",   col.depHeads],
                ["Min. Wages",   col.minWages],
                ["Updated On",   col.updatedOn],
              ].map(([label, width]: any) => (
                <TableHead
                  key={label}
                  className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600"
                  style={{ minWidth: width.min, maxWidth: width.max }}
                >
                  {label}
                </TableHead>
              ))}
              <TableHead
                className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10"
                style={{ minWidth: col.action.min, maxWidth: col.action.max, width: col.action.min }}
              >
                Action
              </TableHead>
            </TableRow>
          </DataTableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row._id || `${row.code}-${index}`}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                <TableCell className="px-5 py-2 text-sm" style={{ width: col.slNo.min }}>
                  {startIndex + index + 1}
                </TableCell>

                <TableCell className="px-5 py-2 font-medium text-sm">
                  <TruncatedText text={row.name} maxWidth={col.name.max} />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                    {row.code}
                  </span>
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <NestedInfo primary={row.subsidiaryName} secondary={row.subsidiaryCode} />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <NestedInfo primary={row.locationName} secondary={row.locationCode} />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <TruncatedText text={row.state} maxWidth={col.state.max} />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <TruncatedText text={row.zone} maxWidth={col.zone.max} />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <NestedInfo primary={row.designationName} secondary={row.designationCode} />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <NestedInfo primary={row.gradeName} secondary={row.gradeCode} />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <NestedInfo primary={row.categoryName} secondary={row.categoryCode} />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* {row.skilledLevelDescription && row.skilledLevelDescription !== "-" && (
                      <span className="w-fit font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                        {row.skilledLevelDescription}
                      </span>
                    )} */}
                    <span className="text-sm font-medium text-gray-800 truncate" style={{ maxWidth: col.skillLevel.max }}>
                      {row.skilledLevelTitle}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="px-5 py-2 text-sm whitespace-nowrap">
                  {formatDate(row.effectiveFrom)}
                </TableCell>

                <TableCell className="px-5 py-2 text-sm whitespace-nowrap">
                  {formatDate(row.effectiveTo)}
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <SalaryHeadsSummary heads={row.salaryHeads} label="heads" />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <SalaryHeadsSummary heads={row.independentSalaryHeads} label="indep." />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  <DependentHeadsSummary heads={row.dependentSalaryHeads} />
                </TableCell>

                <TableCell className="px-5 py-2 text-sm">
                  {row.asPerMinimumWages ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </TableCell>

                <TableCell className="px-5 py-2 text-sm whitespace-nowrap">
                  {formatDate(row.updatedOn)}
                </TableCell>

                <TableCell
                  className="px-5 py-2 sticky right-0 bg-white z-10"
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: col.action.min }}
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
