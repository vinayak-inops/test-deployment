"use client"

import { useEffect, useMemo, useState } from "react"
import { Users } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import CasteAddFormValidated from "./CasteAddFormValidated"

type SearchField = "casteName" | "casteDescription"

type CasteRow = {
  _id?: string
  id?: string
  casteName?: string
  casteDescription?: string
}

interface CasteTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function CasteTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: CasteTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [castes, setCastes] = useState<CasteRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: casteArray,
    loading: casteLoading,
    refetch: refetchCaste,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "caste",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchCaste()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(casteArray)) return
    setCastes(casteArray)
  }, [casteArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedCastes = useMemo(() => [...castes].reverse(), [castes])
  const toOriginalIndex = (displayIndex: number) => castes.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<CasteRow>[]>(
    () => [
      {
        key: "casteName",
        label: "Caste Name",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.casteName || "-",
      },
      {
        key: "casteDescription",
        label: "Description",
        render: (row) => row.casteDescription || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<CasteRow>[]>(
    () => [
      { value: "casteName", label: "Caste Name", getValue: (row) => row.casteName || "" },
      { value: "casteDescription", label: "Description", getValue: (row) => row.casteDescription || "" },
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
            Caste ({castes.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete caste records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {casteLoading && castes.length === 0 ? (
          <div className="text-sm text-gray-500">Loading caste...</div>
        ) : (
          <ActionDataTable<CasteRow>
            rows={displayedCastes}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"casteName" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Caste"
            onEdit={editMode ? (rowIndex) => {
              setDeleteValue(null)
              setEditData(displayedCastes[rowIndex])
              setIsEditMode(true)
              setIsAddDrawerOpen(true)
            } : undefined}
            onDelete={deleteMode ? (rowIndex) => {
              const originalIndex = toOriginalIndex(rowIndex)
              setEditData(null)
              setIsEditMode(false)
              setDeleteValue(castes[originalIndex])
              setIsAddDrawerOpen(true)
            } : undefined}
            getRowKey={(row, index) => `${row.casteName || "caste"}-${toOriginalIndex(index)}`}
            emptyTitle="No caste records added yet."
            emptyDescription="Use Add Caste to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <CasteAddFormValidated
          key={`caste-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchCaste()
            return null
          }}
        />
      )}
    </div>
  )
}
