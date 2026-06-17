"use client"

import { useMemo, useState } from "react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { Button } from "@repo/ui/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { Check, Mail, SearchIcon, Trash2, X, ChevronLeft, AlertTriangle } from "lucide-react"
import type { ReportTaskTabProps } from "../reports-task-controller"

type MailGroupMaster = {
  mailGroupCode?: string
  mailGroupName?: string
}

type MailGroupRow = {
  code: string
  name: string
}

export default function ReportTaskMailGroupsTab({
  form,
  viewMode,
  onSaveAndContinue,
  continueLabel = "Continue",
}: ReportTaskTabProps & { onSaveAndContinue?: () => void; continueLabel?: string }) {
  const values = form.watch("mailGroup") || []
  const tenantCode = useGetTenantCode()
  const [searchTerm, setSearchTerm] = useState("")
  const [addFormOpen, setAddFormOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<"code" | "name">("code")

  const mailGroupCriteriaRequests = useMemo(
    () => {
      if (!tenantCode || values.length === 0) return []

      return [
        { field: "tenantCode", operator: "is", value: tenantCode },
        { field: "mailGroup.mailGroupCode", operator: "in", value: values },
      ]
    },
    [tenantCode, values]
  )

  const { arrayData: mailGroupArray } = useAggregateArrayFetch<MailGroupMaster>({
    collection: "organization",
    criteriaRequests: mailGroupCriteriaRequests,
    arrayField: "mailGroup",
    enabled: Boolean(tenantCode) && values.length > 0,
    defaultValue: [],
  })

  const allMailGroupCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const { arrayData: allMailGroupArray } = useAggregateArrayFetch<MailGroupMaster>({
    collection: "organization",
    criteriaRequests: allMailGroupCriteriaRequests,
    arrayField: "mailGroup",
    enabled: Boolean(tenantCode) && addFormOpen && !viewMode,
    defaultValue: [],
  })

  const rows = useMemo<MailGroupRow[]>(() => {
    if (viewMode) {
      const mailGroupMap = new Map(
        (Array.isArray(mailGroupArray) ? mailGroupArray : []).map((item) => [
          item.mailGroupCode || "",
          item.mailGroupName || item.mailGroupCode || "",
        ])
      )

      return values
        .map((value: string) => ({
          code: value,
          name: mailGroupMap.get(value) || value,
        }))
        .reverse()
    }

    return values.map((value: string) => ({ code: value, name: value })).reverse()
  }, [mailGroupArray, values, viewMode])

  const columns = useMemo<ActionTableColumn<MailGroupRow>[]>(
    () => [
      { key: "slNo", label: "Sl No", render: (_row, index) => index + 1 },
      { key: "code", label: "Mail Group Code", render: (row: MailGroupRow) => row.code || "-" },
      { key: "name", label: "Mail Group Name", render: (row: MailGroupRow) => row.name || "-" },
      {
        key: "action",
        label: "Action",
        render: (_row, index) =>
          viewMode ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-slate-100"
              title="Remove"
              onClick={() => {
                const next = [...values]
                const realIndex = values.length - 1 - index
                next.splice(realIndex, 1)
                form.setValue("mailGroup", next, { shouldDirty: true })
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ),
      },
    ],
    [form, values, viewMode]
  )

  const searchFields = useMemo<ActionTableSearchField<MailGroupRow>[]>(
    () => [
      { value: "code", label: "Mail Group Code", getValue: (row) => row.code },
      { value: "name", label: "Mail Group Name", getValue: (row) => row.name },
    ],
    []
  )

  const availableMailGroups = useMemo(() => {
    const uniqueMap = new Map<string, MailGroupRow>()

    for (const item of Array.isArray(allMailGroupArray) ? allMailGroupArray : []) {
      const code = item.mailGroupCode || ""
      if (!code || uniqueMap.has(code)) continue
      uniqueMap.set(code, {
        code,
        name: item.mailGroupName || code,
      })
    }

    return Array.from(uniqueMap.values())
  }, [allMailGroupArray])

  const filteredAvailableMailGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return availableMailGroups

    return availableMailGroups.filter(
      (item) =>
        item.code.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query)
    )
  }, [availableMailGroups, searchTerm])

  const handleSelectMailGroup = (code: string) => {
    const next = values.includes(code)
      ? values.filter((value: string) => value !== code)
      : [...values, code]

    form.setValue("mailGroup", next, { shouldDirty: true })
  }

  const handleSelectAll = () => {
    const allCodes = filteredAvailableMailGroups.map(item => item.code)
    const allSelected = allCodes.every(code => values.includes(code))
    
    if (allSelected) {
      // Remove all filtered mail groups
      const next = values.filter((value: string) => !allCodes.includes(value))
      form.setValue("mailGroup", next, { shouldDirty: true })
    } else {
      // Add all filtered mail groups that aren't already selected
      const codesToAdd = allCodes.filter(code => !values.includes(code))
      const next = [...values, ...codesToAdd]
      form.setValue("mailGroup", next, { shouldDirty: true })
    }
  }

  const handleClose = () => {
    setAddFormOpen(false)
    setSearchTerm("")
  }

  const isAllSelected = filteredAvailableMailGroups.length > 0 && 
    filteredAvailableMailGroups.every(item => values.includes(item.code))
  const hasNoMailGroups = values.length === 0

  return (
    <div className="flex flex-col h-full items-center pt-6 w-full">
      <div className="bg-white w-full max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Mail className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
              Mail Groups ({values.length})
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Add or remove report notification groups.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 flex-1">
          <div className="relative">
            {addFormOpen && !viewMode && (
              <div className="absolute z-30 right-0 top-12 w-[min(520px,100%)]">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
                  {/* Header with back button */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>
                    <h3 className="text-sm font-medium text-gray-900">Select Mail Groups</h3>
                    <div className="w-16" /> {/* Spacer for alignment */}
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Search Input */}
                    <div className="flex bg-muted/50 rounded-lg border">
                      <div className="flex-1 flex items-center bg-background rounded-l-lg">
                        <div className="relative flex-1">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder={`Search by ${selectedField === 'code' ? 'code' : 'name'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Command Component */}
                    <div className="border rounded-lg bg-white">
                      <Command shouldFilter={false} className="rounded-lg">
                        {filteredAvailableMailGroups.length > 0 && (
                          <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                            <button
                              type="button"
                              onClick={handleSelectAll}
                              className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700 transition-colors"
                            >
                              <Check
                                className={`h-4 w-4 rounded-sm border ${
                                  isAllSelected
                                    ? 'opacity-100 text-green-600 border-green-500'
                                    : 'opacity-70 text-transparent border-gray-300'
                                }`}
                              />
                              <span>Select all ({filteredAvailableMailGroups.length})</span>
                            </button>
                            <span className="text-xs text-gray-500">
                              {values.filter(code => filteredAvailableMailGroups.some(item => item.code === code)).length} selected
                            </span>
                          </div>
                        )}

                        <CommandList className="max-h-[200px]">
                          <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                            No mail groups found.
                          </CommandEmpty>
                          <CommandGroup>
                            {filteredAvailableMailGroups.map((item) => (
                              <CommandItem
                                key={item.code}
                                value={item.code}
                                onSelect={() => handleSelectMailGroup(item.code)}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 rounded-sm border ${
                                    values.includes(item.code)
                                      ? 'opacity-100 text-green-600 border-green-500'
                                      : 'opacity-70 text-transparent border-gray-300'
                                  }`}
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{item.name || 'N/A'}</div>
                                  <div className="text-xs text-gray-500">Code: {item.code}</div>
                                </div>
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

            <ActionDataTable<MailGroupRow>
              rows={rows}
              columns={viewMode ? columns.filter((c) => c.key !== "action") : columns}
              searchFields={searchFields}
              defaultSearchField="code"
              isViewMode={viewMode}
              onAdd={!viewMode ? () => setAddFormOpen(true) : undefined}
              addButtonLabel="Add Mail Group"
              emptyTitle="No mail groups configured"
              emptyDescription='Use "Add Mail Group" to create one.'
              getRowKey={(row) => `mail-group-${row.code}`}
            />
          </div>
        </div>
      </div>

      {/* Unified Save Button - Sticky to bottom */}
      {!viewMode && onSaveAndContinue && (
        <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 shadow-lg p-6 z-50 mt-auto">
          <div className="max-w-3xl mx-auto">
            <div className="w-[71%] mx-auto space-y-3">
              {hasNoMailGroups && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <p className="text-xs font-medium text-red-900">
                      Select at least one mail group to continue
                    </p>
                  </div>
                </div>
              )}
              <Button
                type="button"
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onSaveAndContinue}
                disabled={hasNoMailGroups}
              >
                {continueLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
