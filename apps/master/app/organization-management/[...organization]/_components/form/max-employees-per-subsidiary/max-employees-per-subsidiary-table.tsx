"use client"

import { useEffect, useMemo, useState } from "react"
import { Users } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import MaxEmployeesPerSubsidiaryAddFormValidated from "./MaxEmployeesPerSubsidiaryAddFormValidated"

type SearchField = "subsidiaryCode" | "parseID"

type MaxEmployeesPerSubsidiaryRow = {
  _id?: string
  id?: string
  subsidiaryCode?: string
  maxActiveCountAllowed?: number
  active?: boolean
  parseID?: string
}

interface MaxEmployeesPerSubsidiaryTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function MaxEmployeesPerSubsidiaryTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: MaxEmployeesPerSubsidiaryTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<MaxEmployeesPerSubsidiaryRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: maxEmployeesPerSubsidiaryArray,
    loading: maxEmployeesPerSubsidiaryLoading,
    refetch: refetchMaxEmployeesPerSubsidiary,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "maxEmployeesPerSubsidiary",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: subsidiariesArray } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const getSubsidiaryName = (subsidiaryCode: string) => {
    const found = (subsidiariesArray || []).find((s: any) => s.subsidiaryCode === subsidiaryCode)
    return found?.subsidiaryName || "-"
  }

  useEffect(() => {
    if (!tenantCode) return
    void refetchMaxEmployeesPerSubsidiary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(maxEmployeesPerSubsidiaryArray)) return
    setRows(maxEmployeesPerSubsidiaryArray)
  }, [maxEmployeesPerSubsidiaryArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<MaxEmployeesPerSubsidiaryRow>[]>(
    () => [
      { key: "subsidiaryCode", label: "Subsidiary Code", render: (row) => row.subsidiaryCode || "-" },
      {
        key: "subsidiaryName",
        label: "Subsidiary Name",
        render: (row) => getSubsidiaryName(row.subsidiaryCode || ""),
      },
      {
        key: "maxActiveCountAllowed",
        label: "Max Active Count",
        render: (row) => row.maxActiveCountAllowed ?? "-",
      },
      {
        key: "active",
        label: "Status",
        render: (row) => (row.active ? "Active" : "Inactive"),
      },
    ],
    [subsidiariesArray]
  )

  const searchFields = useMemo<ActionTableSearchField<MaxEmployeesPerSubsidiaryRow>[]>(
    () => [
      { value: "subsidiaryCode", label: "Subsidiary Code", getValue: (row) => row.subsidiaryCode || "" },
      { value: "parseID", label: "Parse ID", getValue: (row) => row.parseID || "" },
    ],
    []
  )

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3">
        <div className="rounded-lg bg-blue-100 p-1.5">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="leading-none text-[13px] font-semibold text-gray-900">
            Max Employees Per Subsidiary ({rows.length})
          </h2>
          <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
            Add, edit and delete subsidiary employee limit records.
          </p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-4">
        {maxEmployeesPerSubsidiaryLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading employee limits...</div>
        ) : (
          <ActionDataTable<MaxEmployeesPerSubsidiaryRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"subsidiaryCode" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Employee Limit"
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
            getRowKey={(row, index) => `${row.parseID || row.subsidiaryCode || "employee-limit"}-${toOriginalIndex(index)}`}
            emptyTitle="No employee limit records added yet."
            emptyDescription="Use Add Employee Limit to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <MaxEmployeesPerSubsidiaryAddFormValidated
          key={`max-employees-per-subsidiary-${isEditMode ? "edit" : "add"}-${editData?.parseID || editData?._id || editData?.id || "new"}`}
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
            await refetchMaxEmployeesPerSubsidiary()
            return null
          }}
        />
      )}
    </div>
  )
}
