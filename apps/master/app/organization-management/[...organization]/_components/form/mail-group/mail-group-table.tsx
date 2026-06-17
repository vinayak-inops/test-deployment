"use client"

import { useEffect, useMemo, useState } from "react"
import { Mail } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import MailGroupAddFormValidated from "./MailGroupAddFormValidated"

type SearchField = "mailGroupCode" | "mailGroupName"

type MailGroupRow = {
  _id?: string
  id?: string
  mailGroupCode?: string
  mailGroupName?: string
}

interface MailGroupTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function MailGroupTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: MailGroupTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<MailGroupRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: mailGroupArray,
    loading: mailGroupLoading,
    refetch: refetchMailGroup,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "mailGroup",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchMailGroup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(mailGroupArray)) return
    setRows(mailGroupArray)
  }, [mailGroupArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<MailGroupRow>[]>(
    () => [
      { key: "mailGroupCode", label: "Code", render: (row) => row.mailGroupCode || "-" },
      { key: "mailGroupName", label: "Name", render: (row) => row.mailGroupName || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<MailGroupRow>[]>(
    () => [
      { value: "mailGroupCode", label: "Code", getValue: (row) => row.mailGroupCode || "" },
      { value: "mailGroupName", label: "Name", getValue: (row) => row.mailGroupName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Mail className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Mail Groups ({rows.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add, edit and delete mail group records.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {mailGroupLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading mail groups...</div>
        ) : (
          <ActionDataTable<MailGroupRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"mailGroupCode" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Mail Group"
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
            getRowKey={(row, index) => `${row.mailGroupCode || "mail-group"}-${toOriginalIndex(index)}`}
            emptyTitle="No mail group records added yet."
            emptyDescription="Use Add Mail Group to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <MailGroupAddFormValidated
          key={`mail-group-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchMailGroup()
            return null
          }}
        />
      )}
    </div>
  )
}
