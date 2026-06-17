"use client"

import { useEffect, useMemo, useState } from "react"
import { Users } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import EmployeeCategoryAddFormValidated from "./EmployeeCategoryAddFormValidated"

type SearchField = "employeeCategoryCode" | "employeeCategoryName"

type EmployeeCategoryRow = {
  _id?: string
  id?: string
  employeeCategoryCode?: string
  employeeCategoryName?: string
  employeeCategoryDescription?: string
  firstEmployeeID?: string
  initialEmployeeID?: string
}

interface EmployeeCategoriesTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function EmployeeCategoriesTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: EmployeeCategoriesTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [categories, setCategories] = useState<EmployeeCategoryRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: categoriesArray,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "employeeCategories",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(categoriesArray)) return
    setCategories(categoriesArray)
  }, [categoriesArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...categories].reverse(), [categories])
  const toOriginalIndex = (displayIndex: number) => categories.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<EmployeeCategoryRow>[]>(
    () => [
      {
        key: "employeeCategoryCode",
        label: "Category Code",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.employeeCategoryCode || "-",
      },
      {
        key: "employeeCategoryName",
        label: "Category Name",
        render: (row) => row.employeeCategoryName || "-",
      },
      {
        key: "firstEmployeeID",
        label: "First Employee ID",
        render: (row) => row.firstEmployeeID || row.initialEmployeeID || "-",
      },
      {
        key: "employeeCategoryDescription",
        label: "Description",
        render: (row) => row.employeeCategoryDescription || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<EmployeeCategoryRow>[]>(
    () => [
      { value: "employeeCategoryCode", label: "Category Code", getValue: (row) => row.employeeCategoryCode || "" },
      { value: "employeeCategoryName", label: "Category Name", getValue: (row) => row.employeeCategoryName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Employee Categories ({categories.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete employee category records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {categoriesLoading && categories.length === 0 ? (
          <div className="text-sm text-gray-500">Loading employee categories...</div>
        ) : (
          <ActionDataTable<EmployeeCategoryRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"employeeCategoryName" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Employee Category"
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
              setDeleteValue(categories[originalIndex])
              setIsAddDrawerOpen(true)
            } : undefined}
            getRowKey={(row, index) => `${row.employeeCategoryCode || "employee-category"}-${toOriginalIndex(index)}`}
            emptyTitle="No employee categories added yet."
            emptyDescription="Use Add Employee Category to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <EmployeeCategoryAddFormValidated
          key={`employee-categories-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchCategories()
            return null
          }}
        />
      )}
    </div>
  )
}
