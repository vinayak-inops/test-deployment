"use client"

import { useEffect, useMemo, useState } from "react"
import { Globe } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import RegionAddFormValidated from "./RegionAddFormValidated"

type SearchField = "regionCode" | "regionName"

type RegionRow = {
  _id?: string
  id?: string
  regionCode?: string
  regionName?: string
  regionDescription?: string
}

interface RegionTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function RegionTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: RegionTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<RegionRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: regionArray,
    loading: regionLoading,
    refetch: refetchRegion,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "region",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchRegion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(regionArray)) return
    setRows(regionArray)
  }, [regionArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<RegionRow>[]>(
    () => [
      { key: "regionCode", label: "Code", render: (row) => row.regionCode || "-" },
      { key: "regionName", label: "Name", render: (row) => row.regionName || "-" },
      { key: "regionDescription", label: "Description", render: (row) => row.regionDescription || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<RegionRow>[]>(
    () => [
      { value: "regionCode", label: "Code", getValue: (row) => row.regionCode || "" },
      { value: "regionName", label: "Name", getValue: (row) => row.regionName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Globe className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Regions ({rows.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add, edit and delete region records.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {regionLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading regions...</div>
        ) : (
          <ActionDataTable<RegionRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"regionCode" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Region"
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
            getRowKey={(row, index) => `${row.regionCode || "region"}-${toOriginalIndex(index)}`}
            emptyTitle="No region records added yet."
            emptyDescription="Use Add Region to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <RegionAddFormValidated
          key={`region-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchRegion()
            return null
          }}
        />
      )}
    </div>
  )
}
