"use client"

import { useEffect, useMemo, useState } from "react"
import { Calculator } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import LeaveWagesFormModal from "./LeaveWagesAddFormValidated"

type SearchField = "skillLevel"

type LeaveWagesRow = {
  _id?: string
  id?: string
  skillLeavel?: {
    skilledLevelTitle?: string
    skilledLevelDescription?: string
  }
  skillLevel?: string
  basicWage?: number
  VDA?: number
  total?: number
  EPF?: number
  ESI?: number
  pfAdminCharges?: number
}

interface LeaveWagesTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function LeaveWagesTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: LeaveWagesTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<LeaveWagesRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: wagesArray,
    loading: wagesLoading,
    refetch: refetchWages,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "leaveWages",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchWages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(wagesArray)) return
    setRows(wagesArray)
  }, [wagesArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<LeaveWagesRow>[]>(
    () => [
      {
        key: "skillLevel",
        label: "Skill Level",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.skillLeavel?.skilledLevelTitle || row.skillLevel || "-",
      },
      { key: "basicWage", label: "Basic Wage", render: (row) => row.basicWage ?? "-" },
      { key: "VDA", label: "VDA", render: (row) => row.VDA ?? "-" },
      { key: "total", label: "Total", render: (row) => row.total ?? "-" },
      { key: "EPF", label: "EPF", render: (row) => row.EPF ?? "-" },
      { key: "ESI", label: "ESI", render: (row) => row.ESI ?? "-" },
      { key: "pfAdminCharges", label: "PF Admin", render: (row) => row.pfAdminCharges ?? "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<LeaveWagesRow>[]>(
    () => [
      {
        value: "skillLevel",
        label: "Skill Level",
        getValue: (row) => row.skillLeavel?.skilledLevelTitle || row.skillLevel || "",
      },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Calculator className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Leave Wages ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete leave wages records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {wagesLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading leave wages...</div>
        ) : (
          <ActionDataTable<LeaveWagesRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"skillLevel" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Leave Wages"
            onEdit={editMode ? (rowIndex) => {
              setDeleteValue(null)
              setEditData(displayedRows[rowIndex])
              setIsEditMode(true)
              setIsAddDrawerOpen(true)
            } : undefined}
            onDelete={deleteMode ? (rowIndex) => {
              const originalIndex = toOriginalIndex(rowIndex)
              setEditData(null)
              setIsEditMode(false)
              setDeleteValue(rows[originalIndex])
              setIsAddDrawerOpen(true)
            } : undefined}
            getRowKey={(row, index) =>
              `${row.skillLeavel?.skilledLevelTitle || row.skillLevel || "leave-wages"}-${toOriginalIndex(index)}`
            }
            emptyTitle="No leave wages records added yet."
            emptyDescription="Use Add Leave Wages to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <LeaveWagesFormModal
          key={`leave-wages-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchWages()
            return null
          }}
        />
      )}
    </div>
  )
}
