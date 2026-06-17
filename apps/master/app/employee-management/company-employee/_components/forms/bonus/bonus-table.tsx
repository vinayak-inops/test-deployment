"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Gift, FileText } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { type BonusItem } from "../../schemas/bonus-form-schema"
import BonusSectionForm from "./bonus-form"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "date" | "bonusDescription"

interface BonusTableProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

export function BonusTable({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: BonusTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [bonuses, setBonuses] = useState<BonusItem[]>([])
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const tenantCode = useGetTenantCode()
  const canFetchBonuses = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { post: postBonuses, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Bonus data saved successfully!")
      void refetchBonus()
    },
    onError: (error) => {
      console.error("Error saving bonus data:", error)
    },
  })

  const criteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const requests: Array<{ field: string; operator: string; value: string }> = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      requests.push({ field: "tenantCode", operator: "eq", value: tenantCode })
    }
    return requests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedBonus, refetch: refetchBonus } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests,
    arrayField: "bonus",
    enabled: canFetchBonuses,
    defaultValue: [],
    onError: (error: any) => {
      if (employeeRecordId) {
        console.error("Error fetching contract employee bonuses:", error)
      }
    },
  })

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

  const handlePopupSubmit = (next: BonusItem[]) => {
    setBonuses(next)
    closeForm()
  }

  const removeBonus = (index: number) => {
    const next = bonuses.filter((_, i) => i !== index)
    const shouldUpdate = Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: shouldUpdate ? "update" : "insert",
      ...(shouldUpdate ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        bonus: next,
      },
    }
    postBonuses(payload)
    setBonuses(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<BonusItem>[]>(
    () => [
      {
        key: "date",
        label: "Date",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.date || "-",
      },
      {
        key: "monthYear",
        label: "Month / Year",
        render: (row) => `${row.month || "-"} / ${row.year || "-"}`,
      },
      {
        key: "amount",
        label: "Amount",
        render: (row) => <Badge className="bg-green-100 text-green-800">Rs {row.amount ?? 0}</Badge>,
      },
      {
        key: "bonusDescription",
        label: "Description",
        render: (row) => row.bonusDescription || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<BonusItem>[]>(
    () => [
      { value: "date", label: "Date", getValue: (row) => row.date || "" },
      { value: "bonusDescription", label: "Description", getValue: (row) => row.bonusDescription || "" },
    ],
    []
  )

  useEffect(() => {
    if (!canFetchBonuses) return
    void refetchBonus()
  }, [canFetchBonuses, tenantCode, refetchBonus])

  useEffect(() => {
    if (!canFetchBonuses) return
    if (Array.isArray(fetchedBonus)) {
      setBonuses(fetchedBonus as BonusItem[])
    }
  }, [canFetchBonuses, fetchedBonus])

  useEffect(() => {
    if (currentMode === "add") {
      setBonuses([])
    }
  }, [currentMode])

  const initialValue = editIndex !== null && bonuses[editIndex] ? bonuses[editIndex] : null
  const displayedBonuses = useMemo(() => [...bonuses].reverse(), [bonuses])
  const toOriginalIndex = (displayIndex: number) => bonuses.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Gift className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Bonus ({bonuses.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit bonus records in the popup.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<BonusItem>
          rows={displayedBonuses}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"date" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Bonus"
          onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.date || "bonus"}-${toOriginalIndex(index)}`}
          emptyTitle="No bonus records added yet."
          emptyDescription="Use Add Bonus to add details."
        />
      </div>

      <BonusSectionForm
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        bonuses={bonuses}
        editIndex={editIndex}
        refetchBonus={refetchBonus}
        onSubmit={handlePopupSubmit}
        isViewMode={isViewMode || postLoading}
      />


      {postLoading && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Saving permissions...</span>
          </div>
        </div>
      )}

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <FileText className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove bonus record</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this bonus entry?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={postLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removeBonus(deleteIndex)}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BonusTable
