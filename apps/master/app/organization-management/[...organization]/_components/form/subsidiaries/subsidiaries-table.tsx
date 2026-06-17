"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2 } from "lucide-react"
import SubsidiaryAddFormValidated from "./SubsidiaryAddFormValidated"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import SuccessAlertCard from "@/components/common/success-alert-card"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"

type SearchField = "subsidiaryCode" | "subsidiaryName"

type SubsidiaryRow = {
  _id?: string
  id?: string
  subsidiaryCode?: string
  subsidiaryName?: string
  subsidiaryDescription?: string
  locationCode?: string[]
}

interface SubsidiariesTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function SubsidiariesTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: SubsidiariesTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [subsidiaries, setSubsidiaries] = useState<SubsidiaryRow[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: subsidiariesArray,
    loading: subsidiariesLoading,
    refetch: refetchSubsidiaries,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchSubsidiaries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(subsidiariesArray)) return
    setSubsidiaries(subsidiariesArray)
  }, [subsidiariesArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedSubsidiaries = useMemo(() => [...subsidiaries].reverse(), [subsidiaries])
  const toOriginalIndex = (displayIndex: number) => subsidiaries.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<SubsidiaryRow>[]>(
    () => [
      {
        key: "subsidiaryCode",
        label: "Subsidiary Code",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.subsidiaryCode || "-",
      },
      {
        key: "subsidiaryName",
        label: "Subsidiary Name",
        render: (row) => row.subsidiaryName || "-",
      },
      {
        key: "locationCode",
        label: "Location Codes",
        render: (row) =>
          Array.isArray(row.locationCode) && row.locationCode.length > 0 ? row.locationCode.join(", ") : "-",
      },
      {
        key: "subsidiaryDescription",
        label: "Description",
        render: (row) => row.subsidiaryDescription || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<SubsidiaryRow>[]>(
    () => [
      { value: "subsidiaryCode", label: "Subsidiary Code", getValue: (row) => row.subsidiaryCode || "" },
      { value: "subsidiaryName", label: "Subsidiary Name", getValue: (row) => row.subsidiaryName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Building2 className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Subsidiaries ({subsidiaries.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete subsidiary records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {subsidiariesLoading && subsidiaries.length === 0 ? (
          <div className="text-sm text-gray-500">Loading subsidiaries...</div>
        ) : (
          <ActionDataTable<SubsidiaryRow>
            rows={displayedSubsidiaries}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"subsidiaryName" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Subsidiary"
            onEdit={editMode ? (rowIndex) => {
              setDeleteValue(null)
              setEditData(displayedSubsidiaries[rowIndex])
              setIsEditMode(true)
              setIsAddDrawerOpen(true)
            } : undefined}
            onDelete={deleteMode ? (rowIndex) => {
              const originalIndex = toOriginalIndex(rowIndex)
              setEditData(null)
              setIsEditMode(false)
              setDeleteValue(subsidiaries[originalIndex])
              setIsAddDrawerOpen(true)
            } : undefined}
            getRowKey={(row, index) =>
              `${row.subsidiaryCode || "subsidiary"}-${toOriginalIndex(index)}`
            }
            emptyTitle="No subsidiaries added yet."
            emptyDescription="Use Add Subsidiary to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <SubsidiaryAddFormValidated
          key={`subsidiaries-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            if (deleteValue) setDeleteValue(null)
            setIsEditMode(false)
            setEditData(null)
          }}
          onAddSuccess={() => {
            setShowSuccessPopup(true)
          }}
          onServerUpdate={async () => {
            await refetchSubsidiaries()
            return null
          }}
        />
      )}

      {showSuccessPopup && (
        <div className="fixed inset-x-0 top-6 z-[60] flex justify-center px-4">
          <SuccessAlertCard
            className="max-w-2xl"
            title="Subsidiary stored successfully!"
            description="The subsidiary has been added successfully. Update user entitlements if you want the latest subsidiary mapping to be reflected in permissions."
            actionLabel=""
            onClose={() => setShowSuccessPopup(false)}
          />
        </div>
      )}
    </div>
  )
}
