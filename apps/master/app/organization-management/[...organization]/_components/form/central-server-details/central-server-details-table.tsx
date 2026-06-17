"use client"

import { useEffect, useMemo, useState } from "react"
import { Network } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import CentralServerDetailsAddFormValidated from "./CentralServerDetailsAddFormValidated"

type SearchField = "subsidiaryCode" | "ipAddress" | "userID"

type CentralServerDetailsRow = {
  _id?: string
  id?: string
  subsidiaryCode?: string
  ipAddress?: string
  port?: string
  userID?: string
  password?: string
}

interface CentralServerDetailsTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function CentralServerDetailsTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: CentralServerDetailsTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<CentralServerDetailsRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: centralServerDetailsArray,
    loading: centralServerDetailsLoading,
    refetch: refetchCentralServerDetails,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "centralServerDetails",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchCentralServerDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(centralServerDetailsArray)) return
    setRows(centralServerDetailsArray)
  }, [centralServerDetailsArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<CentralServerDetailsRow>[]>(
    () => [
      { key: "subsidiaryCode", label: "Subsidiary Code", render: (row) => row.subsidiaryCode || "-" },
      { key: "ipAddress", label: "IP Address", render: (row) => row.ipAddress || "-" },
      { key: "port", label: "Port", render: (row) => row.port || "-" },
      { key: "userID", label: "User ID", render: (row) => row.userID || "-" },
      { key: "password", label: "Password", render: (row) => row.password || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<CentralServerDetailsRow>[]>(
    () => [
      { value: "subsidiaryCode", label: "Subsidiary Code", getValue: (row) => row.subsidiaryCode || "" },
      { value: "ipAddress", label: "IP Address", getValue: (row) => row.ipAddress || "" },
      { value: "userID", label: "User ID", getValue: (row) => row.userID || "" },
    ],
    []
  )

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3">
        <div className="rounded-lg bg-blue-100 p-1.5">
          <Network className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="leading-none text-[13px] font-semibold text-gray-900">
            Central Server Details ({rows.length})
          </h2>
          <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
            Add, edit and delete central server detail records.
          </p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-4">
        {centralServerDetailsLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading central server details...</div>
        ) : (
          <ActionDataTable<CentralServerDetailsRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"subsidiaryCode" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Central Server Detail"
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
            getRowKey={(row, index) => `${row.subsidiaryCode || "central-server"}-${toOriginalIndex(index)}`}
            emptyTitle="No central server details added yet."
            emptyDescription="Use Add Central Server Detail to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <CentralServerDetailsAddFormValidated
          key={`central-server-details-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchCentralServerDetails()
            return null
          }}
        />
      )}
    </div>
  )
}
