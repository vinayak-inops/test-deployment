"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { CreditCard } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { type BankDetail } from "../../schemas/bank-detail-form-schema"
import { BankDetailFormPopup } from "./bank-detail-form-popup"

type SearchField = "bankName" | "branchName" | "ifscNo"

interface BankDetailsTableProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  onSaved?: () => void
}

function toInputBankDetail(row: any): BankDetail {
  return {
    parseID: row?.parseID || undefined,
    bankName: row?.bankName || "",
    branchName: row?.branchName || "",
    micrNo: row?.micrNo || "",
    ifscNo: row?.ifscNo || "",
    bankAccountNo: row?.bankAccountNo || "",
  }
}

export function BankDetailsTable({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  onSaved,
}: BankDetailsTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([])

  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchBankDetails = Boolean(employeeRecordId) && currentMode !== "add"

  const criteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteria: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "is", value: tenantCode })
    return criteria
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedBankDetails, refetch: refetchBankDetails } = useAggregateArrayFetch<any>({
    collection: employeeSearchUrl !== "contractor/search" ? "draft/contractor" : "contractor",
    criteriaRequests,
    arrayField: "bankDetails",
    enabled: canFetchBankDetails,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchBankDetails) return
    void refetchBankDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchBankDetails, tenantCode])

  useEffect(() => {
    if (!canFetchBankDetails) return
    if (Array.isArray(fetchedBankDetails)) {
      setBankDetails(fetchedBankDetails.map(toInputBankDetail))
    }
  }, [canFetchBankDetails, fetchedBankDetails])

  useEffect(() => {
    if (currentMode === "add") setBankDetails([])
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

  const handlePopupSubmit = (next: BankDetail[]) => {
    setBankDetails(next)
  }

  const removeBank = (index: number) => {
    setBankDetails((prev) => prev.filter((_, i) => i !== index))
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<BankDetail>[]>(
    () => [
      {
        key: "bankName",
        label: "Bank Name",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.bankName || "-",
      },
      {
        key: "branchName",
        label: "Branch Name",
        render: (row) => row.branchName || "-",
      },
      {
        key: "micrNo",
        label: "MICR No",
        render: (row) => row.micrNo || "-",
      },
      {
        key: "ifscNo",
        label: "IFSC Code",
        render: (row) => row.ifscNo || "-",
      },
      {
        key: "bankAccountNo",
        label: "Bank Account No",
        render: (row) => row.bankAccountNo || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<BankDetail>[]>(
    () => [
      { value: "bankName", label: "Bank Name", getValue: (row) => row.bankName || "" },
      { value: "branchName", label: "Branch Name", getValue: (row) => row.branchName || "" },
      { value: "ifscNo", label: "IFSC Code", getValue: (row) => row.ifscNo || "" },
    ],
    []
  )

  const initialValue = editIndex !== null && bankDetails[editIndex] ? bankDetails[editIndex] : null
  const displayedBankDetails = useMemo(() => [...bankDetails].reverse(), [bankDetails])
  const toOriginalIndex = (displayIndex: number) => bankDetails.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <CreditCard className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Bank Details ({bankDetails.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit bank details in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<BankDetail>
          rows={displayedBankDetails}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"bankName" as SearchField}
          isViewMode={isViewMode}
          onAdd={!isViewMode ? openAdd : undefined}
          addButtonLabel="Add Bank Detail"
          onEdit={!isViewMode ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.bankName || "bank"}-${toOriginalIndex(index)}`}
          emptyTitle="No bank details added yet."
          emptyDescription="Use Add Bank Detail to add details."
        />
      </div>

      <BankDetailFormPopup
        open={isFormOpen && !isViewMode}
        onClose={closeForm}
        initialBankDetail={initialValue}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        contractorCollectionUrl={contractorCollectionUrl}
        bankDetails={bankDetails}
        editIndex={editIndex}
        refetchBankDetails={refetchBankDetails}
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
                <h3 className="text-sm font-semibold text-red-900">Remove bank detail</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this bank detail?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => removeBank(deleteIndex)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

