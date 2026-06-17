"use client"

import { useEffect, useMemo, useState } from "react"
import { Award } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import WorkSkillAddFormValidated from "./WorkSkillAddFormValidated"

type SearchField = "workSkillCode" | "workSkillTitle"

type WorkSkillRow = {
  _id?: string
  id?: string
  workSkillCode?: string
  workSkillTitle?: string
  workSkillDescription?: string
}

interface WorkSkillTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function WorkSkillTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: WorkSkillTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<WorkSkillRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: workSkillArray,
    loading: workSkillLoading,
    refetch: refetchWorkSkill,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "workSkill",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchWorkSkill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(workSkillArray)) return
    setRows(workSkillArray)
  }, [workSkillArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<WorkSkillRow>[]>(
    () => [
      { key: "workSkillCode", label: "Code", render: (row) => row.workSkillCode || "-" },
      { key: "workSkillTitle", label: "Title", render: (row) => row.workSkillTitle || "-" },
      { key: "workSkillDescription", label: "Description", render: (row) => row.workSkillDescription || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<WorkSkillRow>[]>(
    () => [
      { value: "workSkillCode", label: "Code", getValue: (row) => row.workSkillCode || "" },
      { value: "workSkillTitle", label: "Title", getValue: (row) => row.workSkillTitle || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Award className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Work Skill ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete work skill records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {workSkillLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading work skills...</div>
        ) : (
          <ActionDataTable<WorkSkillRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"workSkillTitle" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Work Skill"
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
            getRowKey={(row, index) => `${row.workSkillCode || "work-skill"}-${toOriginalIndex(index)}`}
            emptyTitle="No work skill records added yet."
            emptyDescription="Use Add Work Skill to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <WorkSkillAddFormValidated
          key={`work-skill-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchWorkSkill()
            return null
          }}
        />
      )}
    </div>
  )
}
