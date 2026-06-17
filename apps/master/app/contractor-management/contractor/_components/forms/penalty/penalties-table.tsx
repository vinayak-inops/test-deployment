"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { PenaltyFormPopup } from "./penalty-form-popup"
import { convertToInputDate, type Penalty } from "../../schemas/penalty-form-schema"

type SearchField = "dateOfOffence" | "actOfMisconduct" | "actionTaken" | "witnessName"

interface PenaltiesTableProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  onSaved?: () => void
}

function toInputPenalty(row: any): Penalty {
  return {
    parseID: row?.parseID || undefined,
    dateOfOffence: convertToInputDate(row?.dateOfOffence),
    actOfMisconduct: row?.actOfMisconduct || "",
    actionTaken: row?.actionTaken || "",
    amount: Number(row?.amount || 0),
    month: Number(row?.month || 1),
    witnessName: row?.witnessName || "",
    fineRealisedDate: row?.fineRealisedDate ? convertToInputDate(row.fineRealisedDate) : "",
  }
}

export function PenaltiesTable({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  onSaved,
}: PenaltiesTableProps) {
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchPenalties = Boolean(employeeRecordId) && currentMode !== "add"

  const criteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteria: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "is", value: tenantCode })
    return criteria
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedPenalties, refetch: refetchPenalties } = useAggregateArrayFetch<any>({
    collection: employeeSearchUrl !== "contractor/search" ? "draft/contractor" : "contractor",
    criteriaRequests,
    arrayField: "penalty",
    enabled: canFetchPenalties,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchPenalties) return
    void refetchPenalties()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchPenalties, tenantCode])

  useEffect(() => {
    if (!canFetchPenalties) return
    if (Array.isArray(fetchedPenalties)) {
      setPenalties(fetchedPenalties.map(toInputPenalty))
    }
  }, [canFetchPenalties, fetchedPenalties])

  useEffect(() => {
    if (currentMode === "add") setPenalties([])
  }, [currentMode])

  const openAdd = () => {
    setEditIndex(null)
    setIsFormOpen(true)
  }

  const openEdit = (index: number) => {
    setEditIndex(index)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditIndex(null)
  }

  const handlePopupSubmit = (next: Penalty[]) => {
    setPenalties(next)
  }

  const removePenalty = (index: number) => {
    setPenalties((prev) => prev.filter((_, i) => i !== index))
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<Penalty>[]>(
    () => [
      {
        key: "dateOfOffence",
        label: "Date Of Offence",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.dateOfOffence || "-",
      },
      { key: "actOfMisconduct", label: "Act Of Misconduct", render: (row) => row.actOfMisconduct || "-" },
      { key: "actionTaken", label: "Action Taken", render: (row) => row.actionTaken || "-" },
      { key: "amount", label: "Amount", render: (row) => String(row.amount ?? "-") },
      { key: "month", label: "Month", render: (row) => String(row.month ?? "-") },
      { key: "witnessName", label: "Witness Name", render: (row) => row.witnessName || "-" },
      { key: "fineRealisedDate", label: "Fine Realised Date", render: (row) => row.fineRealisedDate || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<Penalty>[]>(
    () => [
      { value: "dateOfOffence", label: "Date Of Offence", getValue: (row) => row.dateOfOffence || "" },
      { value: "actOfMisconduct", label: "Act Of Misconduct", getValue: (row) => row.actOfMisconduct || "" },
      { value: "actionTaken", label: "Action Taken", getValue: (row) => row.actionTaken || "" },
      { value: "witnessName", label: "Witness Name", getValue: (row) => row.witnessName || "" },
    ],
    []
  )

  const initialValue = editIndex !== null && penalties[editIndex] ? penalties[editIndex] : null
  const displayedPenalties = useMemo(() => [...penalties].reverse(), [penalties])
  const toOriginalIndex = (displayIndex: number) => penalties.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Penalties ({penalties.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit penalties in the popup.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<Penalty>
          rows={displayedPenalties}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"actOfMisconduct" as SearchField}
          isViewMode={isViewMode}
          onAdd={!isViewMode ? openAdd : undefined}
          addButtonLabel="Add Penalty"
          onEdit={!isViewMode ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.dateOfOffence || "penalty"}-${toOriginalIndex(index)}`}
          emptyTitle="No penalties added yet."
          emptyDescription="Use Add Penalty to add details."
        />
      </div>

      <PenaltyFormPopup
        open={isFormOpen && !isViewMode}
        onClose={closeForm}
        initialPenalty={initialValue}
        onSaved={onSaved}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        contractorCollectionUrl={contractorCollectionUrl}
        penalties={penalties}
        editIndex={editIndex}
        refetchPenalties={refetchPenalties}
        onSubmit={handlePopupSubmit}
        disabled={isViewMode}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove penalty</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this penalty?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => removePenalty(deleteIndex)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
