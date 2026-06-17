"use client"

import { useEffect, useMemo, useState } from "react"
import { Briefcase } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import NatureOfWorkAddFormValidated from "./NatureOfWorkAddFormValidated"

type SearchField = "natureOfWorkCode" | "natureOfWorkTitle"

type NatureOfWorkRow = {
  _id?: string
  id?: string
  natureOfWorkCode?: string
  natureOfWorkTitle?: string
  natureOfWorkDescription?: string
}

interface NatureOfWorkTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function NatureOfWorkTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: NatureOfWorkTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<NatureOfWorkRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: natureOfWorkArray,
    loading: natureOfWorkLoading,
    refetch: refetchNatureOfWork,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "natureOfWork",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchNatureOfWork()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(natureOfWorkArray)) return
    setRows(natureOfWorkArray)
  }, [natureOfWorkArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<NatureOfWorkRow>[]>(
    () => [
      { key: "natureOfWorkCode", label: "Code", render: (row) => row.natureOfWorkCode || "-" },
      { key: "natureOfWorkTitle", label: "Title", render: (row) => row.natureOfWorkTitle || "-" },
      {
        key: "natureOfWorkDescription",
        label: "Description",
        render: (row) => row.natureOfWorkDescription || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<NatureOfWorkRow>[]>(
    () => [
      { value: "natureOfWorkCode", label: "Code", getValue: (row) => row.natureOfWorkCode || "" },
      { value: "natureOfWorkTitle", label: "Title", getValue: (row) => row.natureOfWorkTitle || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Briefcase className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Nature Of Work ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete nature of work records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {natureOfWorkLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading nature of work...</div>
        ) : (
          <ActionDataTable<NatureOfWorkRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"natureOfWorkCode" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Nature Of Work"
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
            getRowKey={(row, index) => `${row.natureOfWorkCode || "nature-of-work"}-${toOriginalIndex(index)}`}
            emptyTitle="No nature of work records added yet."
            emptyDescription="Use Add Nature Of Work to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <NatureOfWorkAddFormValidated
          key={`nature-of-work-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchNatureOfWork()
            return null
          }}
        />
      )}
    </div>
  )
}
