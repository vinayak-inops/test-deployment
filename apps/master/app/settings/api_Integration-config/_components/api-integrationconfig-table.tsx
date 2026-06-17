"use client"

import { Edit, MoreVertical, Loader2, Plug, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader as DataTableHeader, TableRow } from "@/components/ui/table"
import type { ApiIntegrationRow } from "./hooks/Useapiintegrationconfiglogic"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiIntegrationConfigTableProps {
  rows: ApiIntegrationRow[]
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
  ApiIntegrationConfigTableProps,
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

// ─── Method badge ──────────────────────────────────────────────────────────────

const METHOD_STYLES: Record<string, string> = {
  GET: "border-blue-300 bg-blue-50 text-blue-700",
  POST: "border-green-300 bg-green-50 text-green-700",
  PUT: "border-yellow-300 bg-yellow-50 text-yellow-700",
  PATCH: "border-orange-300 bg-orange-50 text-orange-700",
  DELETE: "border-red-300 bg-red-50 text-red-700",
}

function MethodBadge({ method }: { method: string }) {
  const style = METHOD_STYLES[method?.toUpperCase()] ?? "border-gray-300 bg-gray-50 text-gray-700"
  return (
    <Badge variant="outline" className={`text-xs font-semibold px-2 py-0.5 font-mono ${style}`}>
      {method}
    </Badge>
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

export default function ApiIntegrationConfigTable({
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
}: ApiIntegrationConfigTableProps) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading API integration configs...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <Plug className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No API integration configs found</p>
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
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">API Name</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Server</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Method</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">URL</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Body Type</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Fields</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600">Status</TableHead>
              <TableHead className="px-5 py-2.5 whitespace-nowrap text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10">
                Action
              </TableHead>
            </TableRow>
          </DataTableHeader>

          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row._id || `${row.apiName}-${index}`}
                className="hover:bg-gray-50/70 border-b border-gray-200"
              >
                <TableCell className="px-5 py-2 text-sm">{startIndex + index + 1}</TableCell>
                <TableCell className="px-5 py-2 font-medium text-sm">{row.apiName}</TableCell>
                <TableCell className="px-5 py-2 text-sm">{row.server}</TableCell>
                <TableCell className="px-5 py-2">
                  <MethodBadge method={row.method} />
                </TableCell>
                <TableCell
                  className="px-5 py-2 text-sm font-mono text-xs max-w-[220px] truncate"
                  title={row.url}
                >
                  {row.url}
                </TableCell>
                <TableCell className="px-5 py-2 text-sm">{row.requestBodyType}</TableCell>
                <TableCell className="px-5 py-2 text-sm text-center">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                    {row.requestBodyFieldCount}
                  </span>
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