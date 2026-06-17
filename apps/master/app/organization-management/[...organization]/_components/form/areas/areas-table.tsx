"use client"

import { useEffect, useMemo, useState } from "react"
import { GitBranch } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import SuccessAlertCard from "@/components/common/success-alert-card"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import AreaAddFormValidated from "./AreaAddFormValidated"

type SearchField = "areaCode" | "areaName"

type AreaRow = {
  _id?: string
  id?: string
  areaCode?: string
  areaName?: string
  parentArea?: string | string[] | null
  areaDescription?: string
  subsidiaryCode?: string
}

interface AreasTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function AreasTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: AreasTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [areas, setAreas] = useState<AreaRow[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: areasArray,
    loading: areasLoading,
    refetch: refetchAreas,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "areas",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchAreas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(areasArray)) return
    setAreas(areasArray)
  }, [areasArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedAreas = useMemo(() => [...areas].reverse(), [areas])
  const toOriginalIndex = (displayIndex: number) => areas.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<AreaRow>[]>(
    () => [
      {
        key: "areaCode",
        label: "Area Code",
        render: (row) => row.areaCode || "-",
      },
      {
        key: "areaName",
        label: "Area Name",
        render: (row) => row.areaName || "-",
      },
      {
        key: "parentArea",
        label: "Parent Area",
        render: (row) =>
          Array.isArray(row.parentArea)
            ? row.parentArea.length > 0
              ? row.parentArea.join(", ")
              : "-"
            : row.parentArea || "-",
      },
      {
        key: "subsidiaryCode",
        label: "Subsidiary",
        render: (row) => row.subsidiaryCode || "-",
      },
      {
        key: "areaDescription",
        label: "Description",
        render: (row) => row.areaDescription || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<AreaRow>[]>(
    () => [
      { value: "areaCode", label: "Area Code", getValue: (row) => row.areaCode || "" },
      { value: "areaName", label: "Area Name", getValue: (row) => row.areaName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <GitBranch className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Areas ({areas.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete area records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {areasLoading && areas.length === 0 ? (
          <div className="text-sm text-gray-500">Loading areas...</div>
        ) : (
          <ActionDataTable<AreaRow>
            rows={displayedAreas}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"areaName" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Area"
            onEdit={editMode ? (rowIndex) => {
              setDeleteValue(null)
              setEditData(displayedAreas[rowIndex])
              setIsEditMode(true)
              setIsAddDrawerOpen(true)
            } : undefined}
            onDelete={deleteMode ? (rowIndex) => {
              const originalIndex = toOriginalIndex(rowIndex)
              setEditData(null)
              setIsEditMode(false)
              setDeleteValue(areas[originalIndex])
              setIsAddDrawerOpen(true)
            } : undefined}
            getRowKey={(row, index) => `${row.areaCode || "area"}-${toOriginalIndex(index)}`}
            emptyTitle="No area records added yet."
            emptyDescription="Use Add Area to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <AreaAddFormValidated
          key={`areas-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
          open={isAddDrawerOpen}
          organizationId={organizationId}
          deleteValue={deleteValue}
          setOpen={(isOpen: boolean) => {
            setIsAddDrawerOpen(isOpen)
            if (!isOpen) {
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
            await refetchAreas()
            return null
          }}
        />
      )}

      {showSuccessPopup && (
        <div className="fixed inset-x-0 top-6 z-[60] flex justify-center px-4">
          <SuccessAlertCard
            className="max-w-2xl"
            title="Area stored successfully!"
            description="The area has been added successfully."
            actionLabel=""
            onClose={() => setShowSuccessPopup(false)}
          />
        </div>
      )}
    </div>
  )
}
