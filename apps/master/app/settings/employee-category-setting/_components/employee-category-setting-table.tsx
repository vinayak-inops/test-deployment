"use client"

import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Edit,
  FileSpreadsheet,
  Loader2,
  Mail,
  MoreVertical,
  Settings,
  Tag,
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
import type { EmpCategorySettingRow } from "./hooks/useEmployeeCategorySettingLogic"

type Props = {
  rows: EmpCategorySettingRow[]
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

function FlagBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={`text-xs px-2 py-0.5 ${active ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-gray-50 text-gray-400"}`}
    >
      <BadgeCheck className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  )
}

function PaginationControls({
  totalCount,
  totalPages,
  safePage,
  startIndex,
  endIndex,
  setCurrentPage,
}: Pick<Props, "totalCount" | "totalPages" | "safePage" | "startIndex" | "endIndex" | "setCurrentPage">) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 flex-wrap gap-2">
      <div className="text-xs text-gray-600">
        {totalCount > 0 ? <>Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} entries</> : <>No entries found</>}
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, safePage - 1))} disabled={safePage === 1} className="h-7 w-7 p-0">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-xs text-gray-600">{safePage} / {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))} disabled={safePage === totalPages} className="h-7 w-7 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function EmpCategorySettingTable({
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
}: Props) {
  if (loading || countLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto mb-2 h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading employee category settings...</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center">
        <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No employee category settings found</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border my-3 mx-2 md:mx-3 overflow-x-auto">
        <Table className="min-w-[900px] w-full">
          <DataTableHeader>
            <TableRow className="bg-gray-50/80 border-b border-gray-200 hover:bg-gray-50/80">
              <TableHead className="px-4 py-2.5 text-xs font-medium text-gray-600 w-14">Sl No</TableHead>
              <TableHead className="px-4 py-2.5 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1"><Tag className="h-3 w-3" />Category</div>
              </TableHead>
              <TableHead className="px-4 py-2.5 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1"><Mail className="h-3 w-3" />Source Email</div>
              </TableHead>
              <TableHead className="px-4 py-2.5 text-xs font-medium text-gray-600">
                <div className="flex items-center gap-1"><Settings className="h-3 w-3" />Settings</div>
              </TableHead>
              <TableHead className="px-4 py-2.5 text-xs font-medium text-gray-600">Created</TableHead>
              <TableHead className="px-4 py-2.5 text-xs font-medium text-gray-600 sticky right-0 bg-gray-50/80 z-10 w-20">Action</TableHead>
            </TableRow>
          </DataTableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row._id || index} className="hover:bg-gray-50/70 border-b border-gray-200">
                <TableCell className="px-4 py-2 text-sm text-gray-500">{startIndex + index + 1}</TableCell>
                <TableCell className="px-4 py-2 text-sm font-medium text-gray-800">{row.employeeCategoryCode}</TableCell>
                <TableCell className="px-4 py-2 text-sm text-gray-700">{row.sourceEmailAddess}</TableCell>
                <TableCell className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    <FlagBadge active={row.allowMobileApp} label="Mobile App" />
                    <FlagBadge active={row.includeHolidayInPresentDays} label="Holiday Present" />
                  </div>
                </TableCell>
                <TableCell className="px-4 py-2 text-xs text-gray-500">{row.createdOn}</TableCell>
                <TableCell className="px-4 py-2 sticky right-0 bg-white z-10" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {editMode && (
                      <button type="button" onClick={() => onEdit(String(row._id))} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {viewMode && (
                      <button type="button" onClick={() => onView(String(row._id))} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600" title="View">
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
      <PaginationControls totalCount={totalCount} totalPages={totalPages} safePage={safePage} startIndex={startIndex} endIndex={endIndex} setCurrentPage={setCurrentPage} />
    </>
  )
}
