"use client"

import { useEffect, useMemo, useState } from "react"
import { Award } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import SkillLevelsAddFormValidated from "./SkillLevelsAddFormValidated"

type SearchField = "skilledLevelTitle"

type SkillLevelRow = {
  _id?: string
  id?: string
  skilledLevelTitle?: string
  skilledLevelDescription?: string
}

interface SkillLevelsTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function SkillLevelsTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: SkillLevelsTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<SkillLevelRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: skillLevelsArray,
    loading: skillLevelsLoading,
    refetch: refetchSkillLevels,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "skillLevels",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchSkillLevels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(skillLevelsArray)) return
    setRows(skillLevelsArray)
  }, [skillLevelsArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<SkillLevelRow>[]>(
    () => [
      { key: "skilledLevelTitle", label: "Title", render: (row) => row.skilledLevelTitle || "-" },
      { key: "skilledLevelDescription", label: "Description", render: (row) => row.skilledLevelDescription || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<SkillLevelRow>[]>(
    () => [
      { value: "skilledLevelTitle", label: "Title", getValue: (row) => row.skilledLevelTitle || "" },
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
            Skill Levels ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete skill level records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {skillLevelsLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading skill levels...</div>
        ) : (
          <ActionDataTable<SkillLevelRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"skilledLevelTitle" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Skill Level"
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
            getRowKey={(row, index) => `${row.skilledLevelTitle || "skill-level"}-${toOriginalIndex(index)}`}
            emptyTitle="No skill level records added yet."
            emptyDescription="Use Add Skill Level to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <SkillLevelsAddFormValidated
          key={`skill-levels-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchSkillLevels()
            return null
          }}
        />
      )}
    </div>
  )
}
