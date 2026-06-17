"use client"

import { useEffect, useMemo, useState } from "react"
import { Settings } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import SubDepartmentAddFormValidated from "./SubDepartmentAddFormValidated"

type SearchField = "subDepartmentCode" | "subDepartmentName"

type SubDepartmentRow = {
  _id?: string
  id?: string
  subDepartmentCode?: string
  subDepartmentName?: string
  subDepartmentDescription?: string
  subsidiaryCode?: string
  divisionCode?: string
  departmentCode?: string
  locationCode?: string[]
}

interface SubDepartmentsTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function SubDepartmentsTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: SubDepartmentsTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<SubDepartmentRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: subDepartmentsArray,
    loading: subDepartmentsLoading,
    refetch: refetchSubDepartments,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subDepartments",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchSubDepartments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(subDepartmentsArray)) return
    setRows(subDepartmentsArray)
  }, [subDepartmentsArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<SubDepartmentRow>[]>(
    () => [
      { key: "subDepartmentCode", label: "Code", render: (row) => row.subDepartmentCode || "-" },
      { key: "subDepartmentName", label: "Name", render: (row) => row.subDepartmentName || "-" },
      { key: "subsidiaryCode", label: "Subsidiary", render: (row) => row.subsidiaryCode || "-" },
      { key: "divisionCode", label: "Division", render: (row) => row.divisionCode || "-" },
      { key: "departmentCode", label: "Department", render: (row) => row.departmentCode || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<SubDepartmentRow>[]>(
    () => [
      { value: "subDepartmentCode", label: "Code", getValue: (row) => row.subDepartmentCode || "" },
      { value: "subDepartmentName", label: "Name", getValue: (row) => row.subDepartmentName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Settings className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Sub Departments ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete sub department records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {subDepartmentsLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading sub departments...</div>
        ) : (
          <ActionDataTable<SubDepartmentRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"subDepartmentCode" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Sub Department"
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
            getRowKey={(row, index) => `${row.subDepartmentCode || "sub-department"}-${toOriginalIndex(index)}`}
            emptyTitle="No sub department records added yet."
            emptyDescription="Use Add Sub Department to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <SubDepartmentAddFormValidated
          key={`sub-departments-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchSubDepartments()
            return null
          }}
        />
      )}
    </div>
  )
}
