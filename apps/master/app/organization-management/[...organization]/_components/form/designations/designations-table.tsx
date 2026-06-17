"use client"

import { useEffect, useMemo, useState } from "react"
import { UserCheck } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import DesignationAddFormValidated from "./DesignationAddFormValidated"

type SearchField = "designationCode" | "designationName"

type DesignationRow = {
  _id?: string
  id?: string
  designationCode?: string
  designationName?: string
  designationDescription?: string
}

interface DesignationsTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function DesignationsTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: DesignationsTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [designations, setDesignations] = useState<DesignationRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: designationsArray,
    loading: designationsLoading,
    refetch: refetchDesignations,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "designations",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchDesignations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(designationsArray)) return
    setDesignations(designationsArray)
  }, [designationsArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedDesignations = useMemo(() => [...designations].reverse(), [designations])
  const toOriginalIndex = (displayIndex: number) => designations.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<DesignationRow>[]>(
    () => [
      {
        key: "designationCode",
        label: "Designation Code",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.designationCode || "-",
      },
      {
        key: "designationName",
        label: "Designation Name",
        render: (row) => row.designationName || "-",
      },
      {
        key: "designationDescription",
        label: "Description",
        render: (row) => row.designationDescription || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<DesignationRow>[]>(
    () => [
      { value: "designationCode", label: "Designation Code", getValue: (row) => row.designationCode || "" },
      { value: "designationName", label: "Designation Name", getValue: (row) => row.designationName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <UserCheck className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Designations ({designations.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete designation records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {designationsLoading && designations.length === 0 ? (
          <div className="text-sm text-gray-500">Loading designations...</div>
        ) : (
          <ActionDataTable<DesignationRow>
            rows={displayedDesignations}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"designationName" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Designation"
            onEdit={editMode ? (rowIndex) => {
              setDeleteValue(null)
              setEditData(displayedDesignations[rowIndex])
              setIsEditMode(true)
              setIsAddDrawerOpen(true)
            } : undefined}
            onDelete={deleteMode ? (rowIndex) => {
              const originalIndex = toOriginalIndex(rowIndex)
              setEditData(null)
              setIsEditMode(false)
              setDeleteValue(designations[originalIndex])
              setIsAddDrawerOpen(true)
            } : undefined}
            getRowKey={(row, index) => `${row.designationCode || "designation"}-${toOriginalIndex(index)}`}
            emptyTitle="No designation records added yet."
            emptyDescription="Use Add Designation to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <DesignationAddFormValidated
          key={`designations-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
          onServerUpdate={async () => {
            await refetchDesignations()
            return null
          }}
        />
      )}
    </div>
  )
}
