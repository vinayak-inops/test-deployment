"use client"

import { useEffect, useMemo, useState } from "react"
import { FolderOpen } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import SectionAddFormValidated from "./SectionAddFormValidated"

type SearchField = "sectionCode" | "sectionName"

type SectionRow = {
  _id?: string
  id?: string
  sectionCode?: string
  sectionName?: string
  sectionDescription?: string
  subsidiaryCode?: string
  divisionCode?: string
  departmentCode?: string
  subDepartmentCode?: string
  locationCode?: string[]
}

interface SectionsTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function SectionsTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: SectionsTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<SectionRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: sectionsArray,
    loading: sectionsLoading,
    refetch: refetchSections,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "sections",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchSections()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(sectionsArray)) return
    setRows(sectionsArray)
  }, [sectionsArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<SectionRow>[]>(
    () => [
      { key: "sectionCode", label: "Code", render: (row) => row.sectionCode || "-" },
      { key: "sectionName", label: "Name", render: (row) => row.sectionName || "-" },
      { key: "subsidiaryCode", label: "Subsidiary", render: (row) => row.subsidiaryCode || "-" },
      { key: "divisionCode", label: "Division", render: (row) => row.divisionCode || "-" },
      { key: "departmentCode", label: "Department", render: (row) => row.departmentCode || "-" },
      { key: "subDepartmentCode", label: "Sub Dept", render: (row) => row.subDepartmentCode || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<SectionRow>[]>(
    () => [
      { value: "sectionCode", label: "Code", getValue: (row) => row.sectionCode || "" },
      { value: "sectionName", label: "Name", getValue: (row) => row.sectionName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <FolderOpen className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Sections ({rows.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add, edit and delete section records.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {sectionsLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading sections...</div>
        ) : (
          <ActionDataTable<SectionRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"sectionCode" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Section"
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
            getRowKey={(row, index) => `${row.sectionCode || "section"}-${toOriginalIndex(index)}`}
            emptyTitle="No section records added yet."
            emptyDescription="Use Add Section to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <SectionAddFormValidated
          key={`sections-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchSections()
            return null
          }}
        />
      )}
    </div>
  )
}
