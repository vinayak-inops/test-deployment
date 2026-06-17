"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { LicenseFormPopup } from "./license-form-popup"
import { type License } from "../../schemas/license-form-schema"

type SearchField =
  | "licenseNo"
  | "licenseFromDate"
  | "licenseToDate"
  | "workmen"
  | "issuedOn"
  | "natureOfWork"

interface LicensesTableProps {
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  onSaved?: () => void
}

const toIsoDate = (value: any): string => {
  if (!value) return ""
  if (typeof value === "string") return value.includes("T") ? value.split("T")[0] : value
  if (typeof value === "object" && value.$date) {
    try {
      return new Date(value.$date).toISOString().split("T")[0]
    } catch {
      return ""
    }
  }
  return ""
}

export function LicensesTable({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  onSaved,
}: LicensesTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [licenses, setLicenses] = useState<License[]>([])

  const tenantCode = useGetTenantCode()
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const canFetchLicenses = Boolean(employeeRecordId) && currentMode !== "add"

  const criteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const criteria: any[] = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "is", value: tenantCode })
    return criteria
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedLicenses, refetch: refetchLicenses } = useAggregateArrayFetch<any>({
    collection: employeeSearchUrl !== "contractor/search" ? "draft/contractor" : "contractor",
    criteriaRequests,
    arrayField: "licenses",
    enabled: canFetchLicenses,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchLicenses) return
    void refetchLicenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchLicenses, tenantCode])

  useEffect(() => {
    if (!canFetchLicenses) return
    if (Array.isArray(fetchedLicenses)) {
      const formatted = fetchedLicenses.map((license: any) => ({
        parseID: license.parseID || undefined,
        licenseNo: license.licenseNo || "",
        licenseFromDate: toIsoDate(license.licenseFromDate),
        licenseToDate: toIsoDate(license.licenseToDate),
        workmen: Number(license.workmen ?? 0),
        issuedOn: toIsoDate(license.issuedOn),
        natureOfWork: license.natureOfWork || "",
      }))
      setLicenses(formatted as License[])
    }
  }, [canFetchLicenses, fetchedLicenses])

  useEffect(() => {
    if (currentMode === "add") setLicenses([])
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

  const applyLicenses = (next: License[]) => {
    setLicenses(next)
  }

  const confirmRemoveLicense = (index: number) => {
    setLicenses((prev) => prev.filter((_, i) => i !== index))
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<License>[]>(
    () => [
      {
        key: "licenseNo",
        label: "License No",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.licenseNo || "-",
      },
      { key: "licenseFromDate", label: "From Date", render: (row) => row.licenseFromDate || "-" },
      { key: "licenseToDate", label: "To Date", render: (row) => row.licenseToDate || "-" },
      { key: "workmen", label: "Workmen", render: (row) => String(row.workmen ?? "-") },
      { key: "issuedOn", label: "Issued On", render: (row) => row.issuedOn || "-" },
      { key: "natureOfWork", label: "Nature Of Work", render: (row) => row.natureOfWork || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<License>[]>(
    () => [
      { value: "licenseNo", label: "License No", getValue: (row) => row.licenseNo || "" },
      { value: "natureOfWork", label: "Nature Of Work", getValue: (row) => row.natureOfWork || "" },
      { value: "licenseFromDate", label: "From Date", getValue: (row) => row.licenseFromDate || "" },
      { value: "licenseToDate", label: "To Date", getValue: (row) => row.licenseToDate || "" },
      { value: "workmen", label: "Workmen", getValue: (row) => String(row.workmen ?? "") },
      { value: "issuedOn", label: "Issued On", getValue: (row) => row.issuedOn || "" },
    ],
    []
  )

  const initialValue = editIndex !== null && licenses[editIndex] ? licenses[editIndex] : null
  const displayedLicenses = useMemo(() => [...licenses].reverse(), [licenses])
  const toOriginalIndex = (displayIndex: number) => licenses.length - 1 - displayIndex

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Shield className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Licenses & Permits ({licenses.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit licenses in the popup.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<License>
          rows={displayedLicenses}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"licenseNo" as SearchField}
          isViewMode={isViewMode}
          onAdd={!isViewMode ? openAdd : undefined}
          addButtonLabel="Add License"
          onEdit={!isViewMode ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
          onDelete={!isViewMode ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
          getRowKey={(row, index) => `${row.licenseNo || "license"}-${toOriginalIndex(index)}`}
          emptyTitle="No licenses added yet."
          emptyDescription="Use Add License to add details."
        />
      </div>

      <LicenseFormPopup
        open={isFormOpen && !isViewMode}
        onClose={closeForm}
        initialLicense={initialValue}
        onSaved={onSaved}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        contractorCollectionUrl={contractorCollectionUrl}
        licenses={licenses}
        editIndex={editIndex}
        refetchLicenses={refetchLicenses}
        onSubmit={applyLicenses}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove license</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this license?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => confirmRemoveLicense(deleteIndex)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

