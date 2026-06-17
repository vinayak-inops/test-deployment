"use client"

import { useEffect, useMemo, useState } from "react"
import { GitBranch } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import SuccessAlertCard from "@/components/common/success-alert-card"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import DivisionAddFormValidated from "./DivisionAddFormValidated"

type SearchField = "divisionCode" | "divisionName"

type DivisionRow = {
  _id?: string
  id?: string
  divisionCode?: string
  divisionName?: string
  divisionDescription?: string
  subsidiaryCode?: string
  locationCode?: string[]
}

interface DivisionsTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function DivisionsTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: DivisionsTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [divisions, setDivisions] = useState<DivisionRow[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: divisionsArray,
    loading: divisionsLoading,
    refetch: refetchDivisions,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "divisions",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchDivisions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(divisionsArray)) return
    setDivisions(divisionsArray)
  }, [divisionsArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedDivisions = useMemo(() => [...divisions].reverse(), [divisions])
  const toOriginalIndex = (displayIndex: number) => divisions.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<DivisionRow>[]>(
    () => [
      {
        key: "divisionCode",
        label: "Division Code",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.divisionCode || "-",
      },
      {
        key: "divisionName",
        label: "Division Name",
        render: (row) => row.divisionName || "-",
      },
      {
        key: "subsidiaryCode",
        label: "Subsidiary",
        render: (row) => row.subsidiaryCode || "-",
      },
      {
        key: "locationCode",
        label: "Locations",
        render: (row) =>
          Array.isArray(row.locationCode) && row.locationCode.length > 0
            ? row.locationCode.join(", ")
            : "-",
      },
      {
        key: "divisionDescription",
        label: "Description",
        render: (row) => row.divisionDescription || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<DivisionRow>[]>(
    () => [
      { value: "divisionCode", label: "Division Code", getValue: (row) => row.divisionCode || "" },
      { value: "divisionName", label: "Division Name", getValue: (row) => row.divisionName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <GitBranch className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Divisions ({divisions.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete division records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {divisionsLoading && divisions.length === 0 ? (
          <div className="text-sm text-gray-500">Loading divisions...</div>
        ) : (
          <ActionDataTable<DivisionRow>
            rows={displayedDivisions}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"divisionName" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Division"
            onEdit={editMode ? (rowIndex) => {
              setDeleteValue(null)
              setEditData(displayedDivisions[rowIndex])
              setIsEditMode(true)
              setIsAddDrawerOpen(true)
            } : undefined}
            onDelete={deleteMode ? (rowIndex) => {
              const originalIndex = toOriginalIndex(rowIndex)
              setEditData(null)
              setIsEditMode(false)
              setDeleteValue(divisions[originalIndex])
              setIsAddDrawerOpen(true)
            } : undefined}
            getRowKey={(row, index) => `${row.divisionCode || "division"}-${toOriginalIndex(index)}`}
            emptyTitle="No division records added yet."
            emptyDescription="Use Add Division to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <DivisionAddFormValidated
          key={`divisions-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
          open={isAddDrawerOpen}
          organizationId={organizationId}
          deleteValue={deleteValue}
          setOpen={(open: boolean) => {
            setIsAddDrawerOpen(open)
            if (!open) {
              setIsEditMode(false)
              setEditData(null)
              setDeleteValue(null)
            }
          }}
          editData={editData}
          isEditMode={isEditMode}
          onSuccess={() => {
            setIsEditMode(false)
            setEditData(null)
            setDeleteValue(null)
          }}
          onAddSuccess={() => {
            setShowSuccessPopup(true)
          }}
          onServerUpdate={async () => {
            await refetchDivisions()
            return null
          }}
        />
      )}

      {showSuccessPopup && (
        <div className="fixed inset-x-0 top-6 z-[60] flex justify-center px-4">
          <SuccessAlertCard
            className="max-w-2xl"
            title="Division stored successfully!"
            description="The division has been added successfully. Update user entitlements if you want the latest division mapping to be reflected in permissions."
            actionLabel=""
            onClose={() => setShowSuccessPopup(false)}
          />
        </div>
      )}
    </div>
  )
}
