"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import StateAddFormValidated from "./StateAddFormValidated"

type SearchField = "stateCode" | "stateName" | "countryName"

type StateRow = {
  _id?: string
  id?: string
  countryCode?: string
  countryName?: string
  stateCode?: string
  stateName?: string
}

interface StateTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function StateTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: StateTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<StateRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: statesArray,
    loading: statesLoading,
    refetch: refetchStates,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "state",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })


  useEffect(() => {
    if (!tenantCode) return
    void refetchStates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(statesArray)) return
    setRows(statesArray)
  }, [statesArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<StateRow>[]>(
    () => [
      { key: "countryCode", label: "Country Code", render: (row) => row.countryCode || "-" },
      { key: "countryName", label: "Country Name", render: (row) => row.countryName || "-" },
      { key: "stateCode", label: "State Code", render: (row) => row.stateCode || "-" },
      { key: "stateName", label: "State Name", render: (row) => row.stateName || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<StateRow>[]>(
    () => [
      { value: "stateCode", label: "State Code", getValue: (row) => row.stateCode || "" },
      { value: "stateName", label: "State Name", getValue: (row) => row.stateName || "" },
      { value: "countryName", label: "Country Name", getValue: (row) => row.countryName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <MapPin className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            State ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete state records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {statesLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading states...</div>
        ) : (
          <ActionDataTable<StateRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"stateName" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add State"
            onEdit={
              editMode
                ? (rowIndex) => {
                    setDeleteValue(null)
                    setEditData(displayedRows[rowIndex])
                    setIsEditMode(true)
                    setIsAddDrawerOpen(true)
                  }
                : undefined
            }
            onDelete={
              deleteMode
                ? (rowIndex) => {
                    const originalIndex = toOriginalIndex(rowIndex)
                    setEditData(null)
                    setIsEditMode(false)
                    setDeleteValue(rows[originalIndex])
                    setIsAddDrawerOpen(true)
                  }
                : undefined
            }
            getRowKey={(row, index) => `${row.stateCode || "state"}-${toOriginalIndex(index)}`}
            emptyTitle="No state records added yet."
            emptyDescription="Use Add State to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <StateAddFormValidated
          key={`state-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchStates()
            return null
          }}
        />
      )}
    </div>
  )
}
