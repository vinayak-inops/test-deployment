"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Filter, Pencil, Plus, Search, Trash2 } from "lucide-react"

export interface ActionTableColumn<T> {
  key: string
  label: string
  render: (row: T, index: number) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

export interface ActionTableSearchField<T> {
  value: string
  label: string
  getValue: (row: T) => string
}

interface ActionDataTableProps<T> {
  rows: T[]
  columns: ActionTableColumn<T>[]
  searchFields?: ActionTableSearchField<T>[]
  defaultSearchField?: string
  pageSize?: number
  isViewMode?: boolean
  onAdd?: () => void
  addButtonLabel?: string
  onEdit?: (index: number) => void
  onDelete?: (index: number) => void
  getRowKey?: (row: T, index: number) => string
  emptyTitle?: string
  emptyDescription?: string
}

export function ActionDataTable<T>({
  rows,
  columns,
  searchFields = [],
  defaultSearchField,
  pageSize = 5,
  isViewMode = false,
  onAdd,
  addButtonLabel = "Add",
  onEdit,
  onDelete,
  getRowKey,
  emptyTitle = "No records found.",
  emptyDescription = "Add a record to get started.",
}: ActionDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [expandedCells, setExpandedCells] = useState<Record<string, boolean>>({})

  const defaultField = useMemo(() => {
    if (defaultSearchField && searchFields.some((f) => f.value === defaultSearchField)) {
      return defaultSearchField
    }
    return searchFields[0]?.value ?? ""
  }, [defaultSearchField, searchFields])

  const [selectedField, setSelectedField] = useState(defaultField)

  useEffect(() => {
    setSelectedField(defaultField)
  }, [defaultField])

  const filtered = useMemo(() => {
    const mapped = rows.map((row, index) => ({ row, index }))
    const q = searchTerm.toLowerCase().trim()
    if (!q || searchFields.length === 0 || !selectedField) return mapped
    const activeField = searchFields.find((f) => f.value === selectedField)
    if (!activeField) return mapped
    return mapped.filter(({ row }) => (activeField.getValue(row) || "").toLowerCase().includes(q))
  }, [rows, searchFields, selectedField, searchTerm])

  const paginated = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [rows.length, searchTerm, selectedField])

  const showActions = !isViewMode && (Boolean(onEdit) || Boolean(onDelete))
  const toggleExpanded = (key: string) => {
    setExpandedCells((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (rows.length === 0) {
    return (
      <div className="border rounded-lg bg-gray-50 px-6 py-10 flex flex-col items-center justify-center text-center space-y-3">
        <p className="text-sm text-gray-700 font-medium">{emptyTitle}</p>
        <p className="text-xs text-gray-500 max-w-md">{emptyDescription}</p>
        {!isViewMode && onAdd && (
          <Button type="button" size="sm" className="mt-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-1" />
            {addButtonLabel}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {searchFields.length > 0 && (
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
              <Filter className="w-4 h-4 text-muted-foreground mr-2" />
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {searchFields.map((field) => (
                    <SelectItem key={field.value} value={field.value} className="text-sm">
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-center bg-background rounded-r-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
        )}
        {!isViewMode && onAdd && (
          <Button type="button" size="default" className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-1" />
            {addButtonLabel}
          </Button>
        )}
      </div>

      <div className="border rounded-lg bg-slate-50/40 overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={
                    column.headerClassName ??
                    "py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap"
                  }
                >
                  {column.label}
                </TableHead>
              ))}
              {showActions && (
                <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right sticky right-0 bg-slate-50 z-10">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showActions ? 1 : 0)} className="py-8 text-center text-gray-500">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map(({ row, index }) => (
                <TableRow key={getRowKey ? getRowKey(row, index) : `row-${index}`} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                  {columns.map((column) => {
                    const rendered = column.render(row, index)
                    const isPrimitiveText =
                      typeof rendered === "string" || typeof rendered === "number"
                    const isPrimitiveArray =
                      Array.isArray(rendered) &&
                      rendered.every((item) => typeof item === "string" || typeof item === "number")
                    const textValue = isPrimitiveText
                      ? String(rendered)
                      : isPrimitiveArray
                      ? (rendered as Array<string | number>).map(String).join(", ")
                      : ""
                    const isLongTextValue = textValue.length > 60
                    const shouldConstrainWidth = isLongTextValue
                    const canExpand = textValue.length > 0 && shouldConstrainWidth
                    const rowKey = getRowKey ? getRowKey(row, index) : `row-${index}`
                    const cellKey = `${rowKey}:${column.key}`
                    const isExpanded = Boolean(expandedCells[cellKey])

                    return (
                      <TableCell
                        key={column.key}
                        className={
                          column.cellClassName ??
                          `py-1.5 text-sm text-gray-900 align-top ${shouldConstrainWidth ? "min-w-[400px] max-w-[400px]" : ""}`
                        }
                      >
                        {canExpand ? (
                          <div className={`${isExpanded ? "space-y-1" : "flex items-center gap-2 min-w-0"}`}>
                            <p
                              className={
                                isExpanded
                                  ? "whitespace-normal break-words"
                                  : "truncate min-w-0 flex-1"
                              }
                            >
                              {textValue}
                            </p>
                            {textValue.length > 60 && (
                              <button
                                type="button"
                                className="text-[11px] font-medium text-blue-600 hover:text-blue-700 shrink-0"
                                onClick={() => toggleExpanded(cellKey)}
                              >
                                {isExpanded ? "Read less" : "Read more"}
                              </button>
                            )}
                          </div>
                        ) : (
                          rendered
                        )}
                      </TableCell>
                    )
                  })}
                  {showActions && (
                    <TableCell className="py-1.5 pr-4 text-right sticky right-0 bg-white z-10">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-full"
                            onClick={() => onEdit(index)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                            onClick={() => onDelete(index)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filtered.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
            <p className="text-[11px] text-gray-500">
              Showing{" "}
              <span className="font-semibold">
                {Math.min((page - 1) * pageSize + 1, filtered.length)}-{Math.min(page * pageSize, filtered.length)}
              </span>{" "}
              of <span className="font-semibold">{filtered.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px]"
                disabled={page * pageSize >= filtered.length}
                onClick={() => setPage((p) => (p * pageSize >= filtered.length ? p : p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActionDataTable
