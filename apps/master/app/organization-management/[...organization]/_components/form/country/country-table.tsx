"use client"

import { useEffect, useMemo, useState } from "react"
import { Globe } from "lucide-react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import CountryAddFormValidated from "./CountryAddFormValidated"

type SearchField = "countryCode" | "countryName"

type CountryRow = {
  _id?: string
  id?: string
  countryCode?: string
  countryName?: string
}

interface CountryTableProps {
  addMode: boolean
  editMode: boolean
  deleteMode: boolean
  organizationId?: string
}

export default function CountryTable({
  addMode,
  editMode,
  deleteMode,
  organizationId,
}: CountryTableProps) {
  const tenantCode = useGetTenantCode()
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
  const [editData, setEditData] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [deleteValue, setDeleteValue] = useState<any>(null)
  const [countries, setCountries] = useState<CountryRow[]>([])

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const {
    arrayData: countriesArray,
    loading: countriesLoading,
    refetch: refetchCountries,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "country",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchCountries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!Array.isArray(countriesArray)) return
    setCountries(countriesArray)
  }, [countriesArray])

  const openAdd = () => {
    setDeleteValue(null)
    setEditData(null)
    setIsEditMode(false)
    setIsAddDrawerOpen(true)
  }

  const displayedCountries = useMemo(() => [...countries].reverse(), [countries])
  const toOriginalIndex = (displayIndex: number) => countries.length - 1 - displayIndex

  const columns = useMemo<ActionTableColumn<CountryRow>[]>(
    () => [
      {
        key: "countryCode",
        label: "Country Code",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.countryCode || "-",
      },
      {
        key: "countryName",
        label: "Country Name",
        render: (row) => row.countryName || "-",
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<CountryRow>[]>(
    () => [
      { value: "countryCode", label: "Country Code", getValue: (row) => row.countryCode || "" },
      { value: "countryName", label: "Country Name", getValue: (row) => row.countryName || "" },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Globe className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Country ({countries.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add, edit and delete country records.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {countriesLoading && countries.length === 0 ? (
          <div className="text-sm text-gray-500">Loading countries...</div>
        ) : (
          <ActionDataTable<CountryRow>
            rows={displayedCountries}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"countryName" as SearchField}
            pageSize={10}
            isViewMode={!editMode && !deleteMode && !addMode}
            onAdd={addMode ? openAdd : undefined}
            addButtonLabel="Add Country"
            onEdit={editMode ? (rowIndex) => {
              setDeleteValue(null)
              setEditData(displayedCountries[rowIndex])
              setIsEditMode(true)
              setIsAddDrawerOpen(true)
            } : undefined}
            onDelete={deleteMode ? (rowIndex) => {
              const originalIndex = toOriginalIndex(rowIndex)
              setEditData(null)
              setIsEditMode(false)
              setDeleteValue(countries[originalIndex])
              setIsAddDrawerOpen(true)
            } : undefined}
            getRowKey={(row, index) => `${row.countryCode || "country"}-${toOriginalIndex(index)}`}
            emptyTitle="No country records added yet."
            emptyDescription="Use Add Country to create records."
          />
        )}
      </div>

      {isAddDrawerOpen && (
        <CountryAddFormValidated
          key={`country-${isEditMode ? "edit" : "add"}-${editData?._id || editData?.id || "new"}`}
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
            await refetchCountries()
            return null
          }}
        />
      )}
    </div>
  )
}
