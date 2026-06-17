"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { WCPolicyFormPopup } from "./wc-policy-form-popup"
import { convertToInputDate, type WCPolicy } from "../../schemas/wc-policy-form-schema"

type SearchField = "policyNumber" | "policyCompanyName"

interface WCPoliciesTableProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  onSaved?: () => void
}

function toInputPolicy(row: any): WCPolicy {
  return {
    parseID: row?.parseID || undefined,
    policyNumber: row?.policyNumber || "",
    policyStartDate: convertToInputDate(row?.policyStartDate),
    policyExpiryDate: convertToInputDate(row?.policyExpiryDate),
    policyCompanyName: row?.policyCompanyName || "",
    maximumWorkmen: Number(row?.maximumWorkmen || 0),
  }
}

export function WCPoliciesTable({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  onSaved,
}: WCPoliciesTableProps) {
  const [policies, setPolicies] = useState<WCPolicy[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchPolicies = Boolean(employeeRecordId) && currentMode !== "add"

  const criteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteria: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "is", value: tenantCode })
    return criteria
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedPolicies, refetch: refetchPolicies } = useAggregateArrayFetch<any>({
    collection: employeeSearchUrl !== "contractor/search" ? "draft/contractor" : "contractor",
    criteriaRequests,
    arrayField: "wcPolicies",
    enabled: canFetchPolicies,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchPolicies) return
    void refetchPolicies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchPolicies, tenantCode])

  useEffect(() => {
    if (!canFetchPolicies) return
    if (Array.isArray(fetchedPolicies)) {
      setPolicies(fetchedPolicies.map(toInputPolicy))
    }
  }, [canFetchPolicies, fetchedPolicies])

  useEffect(() => {
    if (currentMode === "add") setPolicies([])
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

  const handlePopupSubmit = (next: WCPolicy[]) => {
    setPolicies(next)
  }

  const removePolicy = (index: number) => {
    setPolicies((prev) => prev.filter((_, i) => i !== index))
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<WCPolicy>[]>(
    () => [
      {
        key: "policyNumber",
        label: "Policy Number",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.policyNumber || "-",
      },
      { key: "policyStartDate", label: "Start Date", render: (row) => row.policyStartDate || "-" },
      { key: "policyExpiryDate", label: "Expiry Date", render: (row) => row.policyExpiryDate || "-" },
      { key: "policyCompanyName", label: "Company Name", render: (row) => row.policyCompanyName || "-" },
      { key: "maximumWorkmen", label: "Max Workmen", render: (row) => String(row.maximumWorkmen ?? "-") },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<WCPolicy>[]>(
    () => [
      { value: "policyNumber", label: "Policy Number", getValue: (row) => row.policyNumber || "" },
      { value: "policyCompanyName", label: "Company Name", getValue: (row) => row.policyCompanyName || "" },
    ],
    []
  )

  const initialValue = editIndex !== null && policies[editIndex] ? policies[editIndex] : null
  const displayedPolicies = useMemo(() => [...policies].reverse(), [policies])
  const toOriginalIndex = (displayIndex: number) => policies.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Workmen Compensation Policies ({policies.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit WC policies in the popup.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<WCPolicy>
          rows={displayedPolicies}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"policyNumber" as SearchField}
          isViewMode={isViewMode}
          onAdd={!isViewMode ? openAdd : undefined}
          addButtonLabel="Add WC Policy"
          onEdit={!isViewMode ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.policyNumber || "wc-policy"}-${toOriginalIndex(index)}`}
          emptyTitle="No WC policies added yet."
          emptyDescription="Use Add WC Policy to add details."
        />
      </div>

      <WCPolicyFormPopup
        open={isFormOpen && !isViewMode}
        onClose={closeForm}
        initialPolicy={initialValue}
        onSaved={onSaved}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        contractorCollectionUrl={contractorCollectionUrl}
        policies={policies}
        editIndex={editIndex}
        refetchPolicies={refetchPolicies}
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
                <h3 className="text-sm font-semibold text-red-900">Remove WC policy</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this policy?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => removePolicy(deleteIndex)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
