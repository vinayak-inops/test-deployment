"use client"

import { useEffect, useMemo, useState } from "react"
import { GraduationCap } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import GradeAddFormValidated from "./GradeAddFormValidated"

type SearchField = "gradeCode" | "gradeName"

type GradeRow = {
  _id?: string
  id?: string
  gradeCode?: string
  gradeName?: string
  gradeDescription?: string
}

interface GradesTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function GradesTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: GradesTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [grades, setGrades] = useState<GradeRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: gradesArray,
    loading: gradesLoading,
    refetch: refetchGrades,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "grades",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchGrades()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(gradesArray)) return
    setGrades(gradesArray)
  }, [gradesArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...grades].reverse(), [grades])
  const toOriginalIndex = (displayIndex: number) => grades.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<GradeRow>[]>(
    () => [
      {
        key: "gradeCode",
        label: "Grade Code",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.gradeCode || "-",
      },
      { key: "gradeName", label: "Grade Name", render: (row) => row.gradeName || "-" },
      { key: "gradeDescription", label: "Description", render: (row) => row.gradeDescription || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<GradeRow>[]>(
    () => [
      { value: "gradeCode", label: "Grade Code", getValue: (row) => row.gradeCode || "" },
      { value: "gradeName", label: "Grade Name", getValue: (row) => row.gradeName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <GraduationCap className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Grades ({grades.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete grade records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {gradesLoading && grades.length === 0 ? (
          <div className="text-sm text-gray-500">Loading grades...</div>
        ) : (
          <ActionDataTable<GradeRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"gradeName" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Grade"
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
              setDeleteValue(grades[originalIndex])
              setIsAddDrawerOpen(true)
            } : undefined}
            getRowKey={(row, index) => `${row.gradeCode || "grade"}-${toOriginalIndex(index)}`}
            emptyTitle="No grade records added yet."
            emptyDescription="Use Add Grade to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <GradeAddFormValidated
          key={`grades-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchGrades()
            return null
          }}
        />
      )}
    </div>
  )
}
