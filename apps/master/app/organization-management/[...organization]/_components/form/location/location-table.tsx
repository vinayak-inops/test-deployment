"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import SuccessAlertCard from "@/components/common/success-alert-card"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import LocationAddFormValidated from "./LocationAddFormValidated"

type SearchField = "locationCode" | "locationName"

type LocationRow = {
  _id?: string
  id?: string
  locationCode?: string
  locationName?: string
  regionCode?: string
  countryCode?: string | null
  stateCode?: string | null
  city?: string | null
  pinCode?: string | null
}

interface LocationTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function LocationTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: LocationTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [rows, setRows] = useState<LocationRow[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: locationArray,
    loading: locationLoading,
    refetch: refetchLocation,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "location",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(locationArray)) return
    setRows(locationArray)
  }, [locationArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedRows = useMemo(() => [...rows].reverse(), [rows])
  const toOriginalIndex = (displayIndex: number) => rows.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<LocationRow>[]>(
    () => [
      { key: "locationCode", label: "Code", render: (row) => row.locationCode || "-" },
      { key: "locationName", label: "Name", render: (row) => row.locationName || "-" },
      { key: "regionCode", label: "Region", render: (row) => row.regionCode || "-" },
      { key: "countryCode", label: "Country", render: (row) => row.countryCode || "-" },
      { key: "stateCode", label: "State", render: (row) => row.stateCode || "-" },
      { key: "city", label: "City", render: (row) => row.city || "-" },
      { key: "pinCode", label: "Pincode", render: (row) => row.pinCode || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<LocationRow>[]>(
    () => [
      { value: "locationCode", label: "Code", getValue: (row) => row.locationCode || "" },
      { value: "locationName", label: "Name", getValue: (row) => row.locationName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <MapPin className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Locations ({rows.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add, edit and delete location records.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {locationLoading && rows.length === 0 ? (
          <div className="text-sm text-gray-500">Loading locations...</div>
        ) : (
          <ActionDataTable<LocationRow>
            rows={displayedRows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"locationCode" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Location"
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
            getRowKey={(row, index) => `${row.locationCode || "location"}-${toOriginalIndex(index)}`}
            emptyTitle="No location records added yet."
            emptyDescription="Use Add Location to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <LocationAddFormValidated
          key={`location-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchLocation()
            return null
          }}
        />
      )}

      {showSuccessPopup && (
        <div className="fixed inset-x-0 top-6 z-[60] flex justify-center px-4">
          <SuccessAlertCard
            className="max-w-2xl"
            title="Location stored successfully!"
            description="The location has been added successfully. Update user entitlements if you want the latest location mapping to be reflected in permissions."
            actionLabel=""
            onClose={() => setShowSuccessPopup(false)}
          />
        </div>
      )}
    </div>
  )
}
