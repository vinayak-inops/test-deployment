"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Calendar, Users } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { DoNotConsiderWeekOffFormPopup, type WeekOffItem } from "./do-not-consider-week-off-form"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

type SearchField = "from" | "to"

interface DefaultWeekOffTableProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

export function DefaultWeekOffTable({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: DefaultWeekOffTableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [weekOffRanges, setWeekOffRanges] = useState<WeekOffItem[]>([])
  const currentMode = mode
  const isViewMode = currentMode === "view"
  const tenantCode = useGetTenantCode()
  const canFetchWeekOff = Boolean(employeeRecordId) && currentMode !== "add"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const { post: postWeekOff, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Week-off ranges saved successfully!")
      void refetchWeekOff()
    },
    onError: (error) => {
      console.error("Error saving week-off ranges:", error)
    },
  })

  const criteriaRequests = useMemo(() => {
    if (!employeeRecordId) return []
    const requests: Array<{ field: string; operator: string; value: string }> = [{ field: "_id", operator: "eq", value: employeeRecordId }]
    if (tenantCode) {
      requests.push({ field: "tenantCode", operator: "eq", value: tenantCode })
    }
    return requests
  }, [employeeRecordId, tenantCode])

  const { arrayData: fetchedWeekOff, refetch: refetchWeekOff } = useAggregateArrayFetch<any>({
    collection: targetCollectionName,
    criteriaRequests,
    arrayField: "doNotConsiderWeekOff",
    enabled: canFetchWeekOff,
    defaultValue: [],
  })

  useEffect(() => {
    if (!canFetchWeekOff) return
    void refetchWeekOff()
  }, [canFetchWeekOff, tenantCode, refetchWeekOff])

  useEffect(() => {
    if (!canFetchWeekOff) return
    if (Array.isArray(fetchedWeekOff)) {
      setWeekOffRanges(fetchedWeekOff as WeekOffItem[])
    }
  }, [canFetchWeekOff, fetchedWeekOff])

  useEffect(() => {
    if (currentMode === "add") {
      setWeekOffRanges([])
    }
  }, [currentMode])

  const openAdd = () => {
    setEditIndex(null)
    setIsFormOpen(true)
  }

  const openEdit = (index: number) => {
    setEditIndex(index)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditIndex(null)
  }

  const handlePopupSubmit = (next: WeekOffItem[]) => {
    setWeekOffRanges(next)
    closeForm()
  }

  const removeRange = (index: number) => {
    const next = weekOffRanges.filter((_, i) => i !== index)
    const shouldUpdate = Boolean(employeeRecordId)
    const shouldSetDefaultWeekOffTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: shouldUpdate ? "update" : "insert",
      ...(shouldUpdate ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        doNotConsiderWeekOff: next,
        ...(shouldSetDefaultWeekOffTab ? { defaultWeekOfftab: true } : {}),
      },
    }
    postWeekOff(payload)
    setWeekOffRanges(next)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<WeekOffItem>[]>(
    () => [
      {
        key: "from",
        label: "From",
        headerClassName: "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row?.from || "-",
      },
      {
        key: "to",
        label: "To",
        render: (row) => row?.to || "-",
      },
      {
        key: "active",
        label: "Active",
        render: (row) => (
          <Badge className={row?.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
            {row?.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<WeekOffItem>[]>(
    () => [
      { value: "from", label: "From Date", getValue: (row) => row?.from || "" },
      { value: "to", label: "To Date", getValue: (row) => row?.to || "" },
    ],
    []
  )

  const initialValue = editIndex !== null && weekOffRanges[editIndex] ? weekOffRanges[editIndex] : null
  const displayedWeekOffRanges = useMemo(() => [...weekOffRanges].reverse(), [weekOffRanges])
  const toOriginalIndex = (displayIndex: number) => weekOffRanges.length - 1 - displayIndex

  return (
    <>
      <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Default Week Off ({weekOffRanges.length})</h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or edit week-off ranges in the popup.</p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <ActionDataTable<WeekOffItem>
            rows={displayedWeekOffRanges}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField={"from" as SearchField}
            isViewMode={isViewMode || postLoading}
            onAdd={!isViewMode && !postLoading ? openAdd : undefined}
            addButtonLabel="Add Range"
            onEdit={!isViewMode && !postLoading ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
            onDelete={!isViewMode && !postLoading ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex)) : undefined}
            getRowKey={(row, index) => `weekoff-${row?.from || "item"}-${toOriginalIndex(index)}`}
            emptyTitle="No week-off ranges added yet."
            emptyDescription="Use Add Range to add details."
          />
        </div>
      </div>

      <DoNotConsiderWeekOffFormPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={() => {
          setIsFormOpen(false)
          setEditIndex(null)
        }}
        initialValue={initialValue}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeCollectionUrl={employeeCollectionUrl}
        weekOffRanges={weekOffRanges}
        editIndex={editIndex}
        refetchWeekOff={refetchWeekOff}
        onSubmit={handlePopupSubmit}
        disabled={isViewMode || postLoading}
      />

      {postLoading && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Saving permissions...</span>
          </div>
        </div>
      )}

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <Users className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove week-off range</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this range?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={postLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removeRange(deleteIndex)}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DefaultWeekOffTable
