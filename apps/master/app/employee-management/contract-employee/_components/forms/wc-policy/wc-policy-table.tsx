"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Shield, FileText } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { WCPolicyFormPopup } from "./wc-policy-form"
import { type WCPolicyItem } from "../../schemas/wc-policy-form-schema"

interface WCPolicySectionFormProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

type SearchField = "policyNumber" | "company"

export function WCPolicySectionForm({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: WCPolicySectionFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [wcPolicies, setWcPolicies] = useState<WCPolicyItem[]>([])
  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchPolicies = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"

  const wcCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteriaRequests: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      criteriaRequests.push({ field: "tenantCode", operator: "is", value: tenantCode })
    }
    return criteriaRequests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedPolicies, refetch: refetchPolicies } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests: wcCriteriaRequests,
    arrayField: "wcPolicies",
    enabled: canFetchPolicies,
    defaultValue: [],
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

  const handlePopupSubmit = (next: WCPolicyItem[]) => {
    setWcPolicies(next)
    closeForm()
  }

  const removePolicy = (index: number) => {
    const next = wcPolicies.filter((_, i) => i !== index)
    setWcPolicies(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<WCPolicyItem>[]>(
    () => [
      {
        key: "policyNumber",
        label: "Policy Number",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.WCPolicyNumber || "-",
      },
      {
        key: "company",
        label: "Company",
        render: (row) => row.policyCompanyName || "-",
      },
      {
        key: "coverage",
        label: "Coverage",
        render: (row) => `${row.policyStartDate || "-"} ${row.policyExpiryDate ? `to ${row.policyExpiryDate}` : ""}`.trim(),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => (
          <Badge className={row.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
            {row.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<WCPolicyItem>[]>(
    () => [
      { value: "policyNumber", label: "Policy Number", getValue: (row) => row.WCPolicyNumber || "" },
      { value: "company", label: "Company", getValue: (row) => row.policyCompanyName || "" },
    ],
    []
  )

  useEffect(() => {
    if (!canFetchPolicies) return
    void refetchPolicies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchPolicies, tenantCode])

  useEffect(() => {
    if (!canFetchPolicies) return
    if (Array.isArray(fetchedPolicies)) {
      setWcPolicies(fetchedPolicies as WCPolicyItem[])
    }
  }, [canFetchPolicies, fetchedPolicies])

  useEffect(() => {
    if (currentMode === "add") {
      setWcPolicies([])
    }
  }, [currentMode])

  const initialValue = editIndex !== null && wcPolicies[editIndex] ? wcPolicies[editIndex] : null

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Shield className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            WC Policies ({wcPolicies.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit WC policies in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<WCPolicyItem>
          rows={wcPolicies}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"policyNumber" as SearchField}
          isViewMode={isViewMode}
          onAdd={!isViewMode ? openAdd : undefined}
          addButtonLabel="Add WC Policy"
          onEdit={!isViewMode ? openEdit : undefined}
          onDelete={!isViewMode ? setDeleteIndex : undefined}
          getRowKey={(row, index) => `${row.WCPolicyNumber || "wc"}-${index}`}
          emptyTitle="No WC policies added yet."
          emptyDescription="Use Add WC Policy to add details."
        />
      </div>

      <WCPolicyFormPopup
        open={isFormOpen && !isViewMode}
        onClose={closeForm}
        initialValue={initialValue}
        onSubmit={handlePopupSubmit}
        isViewMode={isViewMode}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        wcPolicies={wcPolicies}
        editIndex={editIndex}
        refetchPolicies={refetchPolicies}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <FileText className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove WC policy</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this WC policy?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removePolicy(deleteIndex)}
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
