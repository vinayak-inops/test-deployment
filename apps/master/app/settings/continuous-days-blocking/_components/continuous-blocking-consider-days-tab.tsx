"use client"

import { useMemo, useState } from "react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { Button } from "@repo/ui/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { Input } from "@repo/ui/components/ui/input"
import { Check, CalendarDays, SearchIcon, Trash2, X, ChevronLeft, AlertTriangle } from "lucide-react"

type DayRow = { code: string; name: string }

const DAY_OPTIONS: DayRow[] = [
  { code: "Leave", name: "Leave" },
  { code: "WeekOffs", name: "WeekOffs" },
  { code: "Holidays", name: "Holidays" },
]

interface Props {
  values: string[]
  onChange: (next: string[]) => void
  onSaveAndContinue?: () => void
  continueLabel?: string
  viewMode?: boolean
}

export default function ContinuousBlockingConsiderDaysTab({
  values,
  onChange,
  onSaveAndContinue,
  continueLabel = "Continue",
  viewMode = false,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [addFormOpen, setAddFormOpen] = useState(false)
  const rows = useMemo<DayRow[]>(() => values.map((v) => ({ code: v, name: v })).reverse(), [values])

  const columns = useMemo<ActionTableColumn<DayRow>[]>(() => {
    const base: ActionTableColumn<DayRow>[] = [
      { key: "slNo", label: "Sl No", render: (_row, index) => index + 1 },
      { key: "code", label: "Code", render: (row) => row.code || "-" },
      { key: "name", label: "Name", render: (row) => row.name || "-" },
    ]

    if (viewMode) return base

    return [
      ...base,
      {
        key: "action",
        label: "Action",
        render: (_row, index) => (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-slate-100"
            onClick={() => {
              const next = [...values]
              const realIndex = values.length - 1 - index
              next.splice(realIndex, 1)
              onChange(next)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ]
  }, [onChange, values, viewMode])

  const searchFields = useMemo<ActionTableSearchField<DayRow>[]>(() => [
    { value: "code", label: "Code", getValue: (row) => row.code },
    { value: "name", label: "Name", getValue: (row) => row.name },
  ], [])

  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return DAY_OPTIONS
    return DAY_OPTIONS.filter((d) => d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q))
  }, [searchTerm])

  const toggle = (code: string) => {
    if (viewMode) return
    onChange(values.includes(code) ? values.filter((v) => v !== code) : [...values, code])
  }

  const hasNoDays = values.length === 0

  return (
    <div className="flex flex-col h-full items-center pt-6 w-full">
      <div className="bg-white w-full max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-100 rounded-lg"><CalendarDays className="h-4 w-4 text-blue-600" /></div>
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Consider Days As Present ({values.length})</h2>
          </div>
        </div>
        <div className="px-6 py-4 flex-1">
          <div className="relative">
            {addFormOpen && (
              <div className="absolute z-30 right-0 top-12 w-[min(520px,100%)]">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <button type="button" onClick={() => setAddFormOpen(false)} className="flex items-center gap-1 text-sm text-gray-600"><ChevronLeft className="h-4 w-4" /><span>Back</span></button>
                    <h3 className="text-sm font-medium text-gray-900">Select Days</h3>
                    <div className="w-16" />
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex bg-muted/50 rounded-lg border">
                      <div className="flex-1 relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="pl-10 border-none" />
                      </div>
                      <button type="button" onClick={() => setAddFormOpen(false)} className="px-3"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="border rounded-lg bg-white">
                      <Command shouldFilter={false} className="rounded-lg">
                        <CommandList className="max-h-[200px]">
                          <CommandEmpty className="py-4 text-center text-sm text-gray-500">No options found.</CommandEmpty>
                          <CommandGroup>
                            {filteredOptions.map((item) => (
                              <CommandItem key={item.code} value={item.code} onSelect={() => toggle(item.code)} className="cursor-pointer">
                                <Check className={`mr-2 h-4 w-4 rounded-sm border ${values.includes(item.code) ? "opacity-100 text-green-600 border-green-500" : "opacity-70 text-transparent border-gray-300"}`} />
                                <div className="flex-1"><div className="font-medium text-sm">{item.name}</div></div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <ActionDataTable<DayRow>
              rows={rows}
              columns={columns}
              searchFields={searchFields}
              defaultSearchField="code"
              isViewMode={viewMode}
              onAdd={viewMode ? undefined : () => setAddFormOpen(true)}
              addButtonLabel="Add Day Type"
              onDelete={viewMode ? undefined : undefined}
              emptyTitle="No day types selected"
              emptyDescription='Use "Add Day Type" to select.'
              getRowKey={(row) => `day-${row.code}`}
            />
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 shadow-lg p-6 z-50 mt-auto">
        <div className="max-w-3xl mx-auto">
          <div className="w-[71%] mx-auto space-y-3">
            {hasNoDays && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs font-medium text-red-900">Select at least one option to continue</p>
                </div>
              </div>
            )}
            <Button type="button" className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed" onClick={onSaveAndContinue} disabled={hasNoDays || viewMode}>
              {continueLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
