"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import ReasonCodeAddFormValidated from "./ReasonCodeAddFormValidated"

type SearchField = "reasonCode" | "reasonName"

type ReasonCodeRow = {
  _id?: string
  id?: string
  reasonCode?: string
  reasonName?: string
  reasonDescription?: string
}

interface ReasonCodesTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function ReasonCodesTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: ReasonCodesTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<ReasonCodeRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: reasonCodesArray,
    loading: reasonCodesLoading,
    refetch: refetchReasonCodes,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "reasonCodes",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchReasonCodes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(reasonCodesArray)) return
    setRows(reasonCodesArray)
  }, [reasonCodesArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<ReasonCodeRow>[]>(
    () => [
      { key: "reasonCode", label: "Code", render: (row) => row.reasonCode || "-" },
      { key: "reasonName", label: "Name", render: (row) => row.reasonName || "-" },
      { key: "reasonDescription", label: "Description", render: (row) => row.reasonDescription || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<ReasonCodeRow>[]>(
    () => [
      { value: "reasonCode", label: "Code", getValue: (row) => String(row.reasonCode ?? "") },
      { value: "reasonName", label: "Name", getValue: (row) => String(row.reasonName ?? "") },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Reason Codes ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete reason code records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {reasonCodesLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading reason codes...</div>
        ) : (
          <ActionDataTable<ReasonCodeRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"reasonCode" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Reason Code"
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
            getRowKey={(row, index) => `${row.reasonCode || "reason-code"}-${toOriginalIndex(index)}`}
            emptyTitle="No reason code records added yet."
            emptyDescription="Use Add Reason Code to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <ReasonCodeAddFormValidated
          key={`reason-codes-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchReasonCodes()
            return null
          }}
        />
      )}
    </div>
  )
}
