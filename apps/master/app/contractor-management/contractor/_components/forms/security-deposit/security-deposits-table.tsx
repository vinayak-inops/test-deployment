"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { CreditCard } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { SecurityDepositFormPopup } from "./security-deposit-form-popup"
import { convertToInputDate, type SecurityDeposit } from "../../schemas/security-deposit-form-schema"

type SearchField = "depositDate" | "depositDetail"

interface SecurityDepositsTableProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  onSaved?: () => void
}

export function SecurityDepositsTable({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  onSaved,
}: SecurityDepositsTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [securityDeposits, setSecurityDeposits] = useState<SecurityDeposit[]>([])

  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchDeposits = Boolean(employeeRecordId) && currentMode !== "add"

  const criteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteria: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "is", value: tenantCode })
    return criteria
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedDeposits, refetch: refetchDeposits } = useAggregateArrayFetch<any>({
    collection: employeeSearchUrl !== "contractor/search" ? "draft/contractor" : "contractor",
    criteriaRequests,
    arrayField: "securityDeposit",
    enabled: canFetchDeposits,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchDeposits) return
    void refetchDeposits()
  }, [canFetchDeposits, tenantCode])

  useEffect(() => {
    if (!canFetchDeposits) return
    if (Array.isArray(fetchedDeposits)) {
      const formatted = fetchedDeposits.map((d: any) => ({
        parseID: d.parseID || undefined,
        depositDate: convertToInputDate(d.depositDate),
        depositDetail: d.depositDetail || "",
        depositAmount: d.depositAmount ?? 0,
      }))
      setSecurityDeposits(formatted as SecurityDeposit[])
    }
  }, [canFetchDeposits, fetchedDeposits])

  useEffect(() => {
    if (currentMode === "add") setSecurityDeposits([])
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

  const handlePopupSubmit = (next: SecurityDeposit[]) => {
    setSecurityDeposits(next)
  }

  const removeDeposit = (index: number) => {
    setSecurityDeposits((prev) => prev.filter((_, i) => i !== index))
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<SecurityDeposit>[]>(
    () => [
      {
        key: "depositDate",
        label: "Deposit Date",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.depositDate || "-",
      },
      {
        key: "depositDetail",
        label: "Deposit Detail",
        render: (row) => row.depositDetail || "-",
      },
      {
        key: "depositAmount",
        label: "Deposit Amount",
        render: (row) => (row.depositAmount ?? "-") as any,
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<SecurityDeposit>[]>(
    () => [
      { value: "depositDate", label: "Deposit Date", getValue: (row) => row.depositDate || "" },
      { value: "depositDetail", label: "Deposit Detail", getValue: (row) => row.depositDetail || "" },
    ],
    []
  )

  const initialValue =
    editIndex !== null && securityDeposits[editIndex] ? securityDeposits[editIndex] : null
  const displayedDeposits = useMemo(() => [...securityDeposits].reverse(), [securityDeposits])
  const toOriginalIndex = (displayIndex: number) => securityDeposits.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <CreditCard className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Security Deposits ({securityDeposits.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit security deposits in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<SecurityDeposit>
          rows={displayedDeposits}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"depositDetail" as SearchField}
          isViewMode={isViewMode}
          onAdd={!isViewMode ? openAdd : undefined}
          addButtonLabel="Add Deposit"
          onEdit={!isViewMode ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.depositDetail || "deposit"}-${toOriginalIndex(index)}`}
          emptyTitle="No security deposits added yet."
          emptyDescription="Use Add Deposit to add details."
        />
      </div>

      <SecurityDepositFormPopup
        open={isFormOpen && !isViewMode}
        onClose={closeForm}
        initialDeposit={initialValue}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        contractorCollectionUrl={contractorCollectionUrl}
        securityDeposits={securityDeposits}
        editIndex={editIndex}
        refetchDeposits={refetchDeposits}
        onSubmit={handlePopupSubmit}
        disabled={isViewMode}
        onSaved={onSaved}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <CreditCard className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove security deposit</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this deposit?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => removeDeposit(deleteIndex)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

