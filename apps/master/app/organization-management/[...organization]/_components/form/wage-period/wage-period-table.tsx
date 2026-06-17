"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import WagePeriodAddFormValidated from "./WagePeriodAddFormValidated"

type SearchField = "employeeCategoryCode" | "employeeCategoryName"

type WagePeriodRow = {
  parseID?: string
  _id?: string
  id?: string
  employeeCategory?: {
    employeeCategoryCode?: string
    employeeCategoryName?: string
  }
  wagePeriod?: {
    from?: number
    to?: number
  }
}

interface WagePeriodTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function WagePeriodTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: WagePeriodTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<WagePeriodRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: wagePeriodsArray,
    loading: wagePeriodsLoading,
    refetch: refetchWagePeriods,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "wagePeriod",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchWagePeriods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(wagePeriodsArray)) return
    setRows(wagePeriodsArray)
  }, [wagePeriodsArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<WagePeriodRow>[]>(
    () => [
      {
        key: "employeeCategoryCode",
        label: "Category Code",
        render: (row) => row.employeeCategory?.employeeCategoryCode || "-",
      },
      {
        key: "employeeCategoryName",
        label: "Category Name",
        render: (row) => row.employeeCategory?.employeeCategoryName || "-",
      },
      {
        key: "from",
        label: "From",
        render: (row) => row.wagePeriod?.from ?? "-",
      },
      {
        key: "to",
        label: "To",
        render: (row) => row.wagePeriod?.to ?? "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<WagePeriodRow>[]>(
    () => [
      {
        value: "employeeCategoryCode",
        label: "Category Code",
        getValue: (row) => row.employeeCategory?.employeeCategoryCode || "",
      },
      {
        value: "employeeCategoryName",
        label: "Category Name",
        getValue: (row) => row.employeeCategory?.employeeCategoryName || "",
      },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Calendar className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Wage Period ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete wage period records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {wagePeriodsLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading wage periods...</div>
        ) : (
          <ActionDataTable<WagePeriodRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"employeeCategoryName" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Wage Period"
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
            getRowKey={(row, index) =>
              `${row.parseID || row.employeeCategory?.employeeCategoryCode || "wage-period"}-${toOriginalIndex(index)}`
            }
            emptyTitle="No wage period records added yet."
            emptyDescription="Use Add Wage Period to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <WagePeriodAddFormValidated
          key={`wage-period-${isEditMode ? "edit" : "add"}-${editData?.parseID || editData?._id || editData?.id || "new"}`}
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
            await refetchWagePeriods()
            return null
          }}
        />
      )}
    </div>
  )
}
