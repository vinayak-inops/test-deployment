"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2 } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import SuccessAlertCard from "@/components/common/success-alert-card"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import DepartmentAddFormValidated from "./DepartmentAddFormValidated"

type SearchField = "departmentCode" | "departmentName"

type DepartmentRow = {
  _id?: string
  id?: string
  departmentCode?: string
  departmentName?: string
  departmentDescription?: string
  subsidiaryCode?: string
  divisionCode?: string
  locationCode?: string[]
}

interface DepartmentsTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function DepartmentsTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: DepartmentsTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [departments, setDepartments] = useState<DepartmentRow[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: departmentsArray,
    loading: departmentsLoading,
    refetch: refetchDepartments,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "departments",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchDepartments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(departmentsArray)) return
    setDepartments(departmentsArray)
  }, [departmentsArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedDepartments = useMemo(() => [...departments].reverse(), [departments])
  const toOriginalIndex = (displayIndex: number) => departments.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<DepartmentRow>[]>(
    () => [
      {
        key: "departmentCode",
        label: "Department Code",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.departmentCode || "-",
      },
      {
        key: "departmentName",
        label: "Department Name",
        render: (row) => row.departmentName || "-",
      },
      {
        key: "subsidiaryCode",
        label: "Subsidiary",
        render: (row) => row.subsidiaryCode || "-",
      },
      {
        key: "divisionCode",
        label: "Division",
        render: (row) => row.divisionCode || "-",
      },
      {
        key: "locationCode",
        label: "Locations",
        render: (row) =>
          Array.isArray(row.locationCode) && row.locationCode.length > 0
            ? row.locationCode.join(", ")
            : "-",
      },
      {
        key: "departmentDescription",
        label: "Description",
        render: (row) => row.departmentDescription || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<DepartmentRow>[]>(
    () => [
      { value: "departmentCode", label: "Department Code", getValue: (row) => row.departmentCode || "" },
      { value: "departmentName", label: "Department Name", getValue: (row) => row.departmentName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Building2 className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Departments ({departments.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete department records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {departmentsLoading && departments.length === 0 ? (
          <div className="text-sm text-gray-500">Loading departments...</div>
        ) : (
          <ActionDataTable<DepartmentRow>
            rows={displayedDepartments}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"departmentName" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Department"
            onEdit={editMode ? (rowIndex) => {
              setDeleteValue(null)
              setEditData(displayedDepartments[rowIndex])
              setIsEditMode(true)
              setIsAddDrawerOpen(true)
            } : undefined}
            onDelete={deleteMode ? (rowIndex) => {
              const originalIndex = toOriginalIndex(rowIndex)
              setEditData(null)
              setIsEditMode(false)
              setDeleteValue(departments[originalIndex])
              setIsAddDrawerOpen(true)
            } : undefined}
            getRowKey={(row, index) => `${row.departmentCode || "department"}-${toOriginalIndex(index)}`}
            emptyTitle="No department records added yet."
            emptyDescription="Use Add Department to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <DepartmentAddFormValidated
          key={`departments-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
          onAddSuccess={() => {
            setShowSuccessPopup(true)
          }}
          onServerUpdate={async () => {
            await refetchDepartments()
            return null
          }}
        />
      )}

      {showSuccessPopup && (
        <div className="fixed inset-x-0 top-6 z-[60] flex justify-center px-4">
          <SuccessAlertCard
            className="max-w-2xl"
            title="Department stored successfully!"
            description="The department has been added successfully. Update user entitlements if you want the latest department mapping to be reflected in permissions."
            actionLabel=""
            onClose={() => setShowSuccessPopup(false)}
          />
        </div>
      )}
    </div>
  )
}
