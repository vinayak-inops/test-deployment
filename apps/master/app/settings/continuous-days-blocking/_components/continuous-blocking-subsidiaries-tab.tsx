"use client"

import { useMemo, useState } from "react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import SingleSelectField from "@/components/fields/single-select-field"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Label } from "@repo/ui/components/ui/label"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { AlertTriangle, Building2, X } from "lucide-react"

type SubsidiaryItem = {
  subsidiaryCode: string
  isSyncActive: boolean
  isBlockingActive: boolean
}

type SubsidiaryMaster = {
  subsidiaryCode?: string
  subsidiaryName?: string
}

type SubsidiaryOption = {
  code: string
  name: string
}

interface Props {
  values: SubsidiaryItem[]
  onChange: (next: SubsidiaryItem[]) => void
  onContinue?: () => void
  showErrors?: boolean
  errorMessage?: string
  viewMode?: boolean
}

export default function ContinuousBlockingSubsidiariesTab({
  values,
  onChange,
  onContinue,
  showErrors = false,
  errorMessage,
  viewMode = false,
}: Props) {
  const tenantCode = useGetTenantCode()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [newSubsidiaryCode, setNewSubsidiaryCode] = useState("")
  const [isSyncActive, setIsSyncActive] = useState(true)
  const [isBlockingActive, setIsBlockingActive] = useState(true)

  const allSubsidiaryCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const { arrayData: allSubsidiaryArray } = useAggregateArrayFetch<SubsidiaryMaster>({
    collection: "organization",
    criteriaRequests: allSubsidiaryCriteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode) && editorOpen,
    defaultValue: [],
  })

  const availableSubsidiaries = useMemo<SubsidiaryOption[]>(() => {
    const uniqueMap = new Map<string, SubsidiaryOption>()
    for (const item of Array.isArray(allSubsidiaryArray) ? allSubsidiaryArray : []) {
      const code = item.subsidiaryCode || ""
      if (!code || uniqueMap.has(code)) continue
      uniqueMap.set(code, {
        code,
        name: item.subsidiaryName || code,
      })
    }
    return Array.from(uniqueMap.values())
  }, [allSubsidiaryArray])

  const subsidiaryOptions = useMemo(
    () => availableSubsidiaries.map((item) => ({ value: item.code, label: item.name })),
    [availableSubsidiaries]
  )

  const openAdd = () => {
    if (viewMode) return
    setEditIndex(null)
    setNewSubsidiaryCode("")
    setIsSyncActive(true)
    setIsBlockingActive(true)
    setEditorOpen(true)
  }

  const openEdit = (index: number) => {
    if (viewMode) return
    const item = values[index]
    if (!item) return
    setEditIndex(index)
    setNewSubsidiaryCode(item.subsidiaryCode)
    setIsSyncActive(item.isSyncActive)
    setIsBlockingActive(item.isBlockingActive)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditIndex(null)
    setNewSubsidiaryCode("")
    setIsSyncActive(true)
    setIsBlockingActive(true)
  }

  const handleSaveSubsidiary = () => {
    if (viewMode) return
    const code = newSubsidiaryCode.trim()
    if (!code) return
    if (editIndex === null && values.some((s) => s.subsidiaryCode === code)) return

    const next = [...values]
    const payload = { subsidiaryCode: code, isSyncActive, isBlockingActive }
    if (editIndex !== null) next[editIndex] = payload
    else next.push(payload)
    onChange(next)
    closeEditor()
  }

  const rows = useMemo(() => [...values].reverse(), [values])
  const hasNoSubsidiaries = values.length === 0
  const searchFields = useMemo<ActionTableSearchField<SubsidiaryItem>[]>(() => [
    { value: "subsidiaryCode", label: "Subsidiary Code", getValue: (row) => row.subsidiaryCode },
  ], [])
  const columns = useMemo<ActionTableColumn<SubsidiaryItem>[]>(() => [
    { key: "slNo", label: "Sl No", render: (_row, index) => index + 1 },
    { key: "subsidiaryCode", label: "Subsidiary Code", render: (row) => row.subsidiaryCode || "-" },
    { key: "isSyncActive", label: "Sync", render: (row) => (row.isSyncActive ? "Enabled" : "Disabled") },
    { key: "isBlockingActive", label: "Blocking", render: (row) => (row.isBlockingActive ? "Enabled" : "Disabled") },
  ], [])

  return (
    <div className="flex flex-col h-full items-center pt-6 w-full">
      <div className="bg-white w-full max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
              Subsidiaries ({values.length})
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Add or update subsidiary blocking configuration.
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-6">
          <div className="relative">
            {editorOpen && (
              <div className="absolute z-50 right-0 top-12 w-[min(560px,100%)]">
                <Card className="w-full max-h-[80vh] flex flex-col overflow-hidden border border-gray-200 shadow-lg">
                  <CardHeader className="shrink-0 px-6 py-3 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-gray-700">
                        {editIndex !== null ? "Edit Subsidiary" : "Add Subsidiary"}
                      </CardTitle>
                      <button type="button" onClick={closeEditor} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Subsidiary Code"
                        placeholder="Select subsidiary"
                        value={newSubsidiaryCode}
                        onChange={setNewSubsidiaryCode}
                        options={subsidiaryOptions}
                        showOnlyValueInTrigger={true}
                        allowOnlyProvidedOptions={true}
                        className="space-y-0"
                        disabled={viewMode}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2 max-w-xs">
                        <Label htmlFor="syncActive" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Sync Active
                        </Label>
                        <label htmlFor="syncActive" className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            id="syncActive"
                            type="checkbox"
                            checked={isSyncActive}
                            onChange={(e) => setIsSyncActive(e.target.checked)}
                            disabled={viewMode}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Enable sync for this subsidiary</span>
                        </label>
                      </div>
                      <div className="space-y-2 max-w-xs">
                        <Label htmlFor="blockingActive" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Blocking Active
                        </Label>
                        <label htmlFor="blockingActive" className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            id="blockingActive"
                            type="checkbox"
                            checked={isBlockingActive}
                            onChange={(e) => setIsBlockingActive(e.target.checked)}
                            disabled={viewMode}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Enable blocking for this subsidiary</span>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="shrink-0 px-6 py-3 border-t border-gray-200 justify-end bg-white gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={closeEditor} className="h-8 px-3">Cancel</Button>
                    <Button type="button" size="sm" className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveSubsidiary} disabled={!newSubsidiaryCode.trim() || viewMode}>
                      {editIndex !== null ? "Save Changes" : "Add Subsidiary"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
            <ActionDataTable<SubsidiaryItem>
              rows={rows}
              columns={columns}
              searchFields={searchFields}
              defaultSearchField="subsidiaryCode"
              isViewMode={viewMode}
              onAdd={viewMode ? undefined : openAdd}
              addButtonLabel="Add Subsidiary"
              onEdit={viewMode ? undefined : (rowIndex) => openEdit(values.length - 1 - rowIndex)}
              onDelete={viewMode ? undefined : (rowIndex) => onChange(values.filter((_, i) => i !== values.length - 1 - rowIndex))}
              emptyTitle="No subsidiaries configured"
              emptyDescription='Use "Add Subsidiary" to create one.'
              getRowKey={(row, index) => `${row.subsidiaryCode}-${index}`}
            />
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 shadow-lg p-6 z-50 mt-auto">
        <div className="max-w-3xl mx-auto">
          <div className="w-[71%] mx-auto space-y-3">
            {hasNoSubsidiaries && showErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs font-medium text-red-900">
                    {errorMessage || "Add at least one subsidiary to continue"}
                  </p>
                </div>
              </div>
            )}
            <Button
              type="button"
              onClick={onContinue}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={hasNoSubsidiaries || viewMode}
            >
              {viewMode ? "View Only" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
