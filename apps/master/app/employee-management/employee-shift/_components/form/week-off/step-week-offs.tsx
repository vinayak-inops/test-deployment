"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, AlertTriangle } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { WeekOffFormPopup } from "./week-off-form-popup"
import { type WeekOffItem } from "../../schemas/week-off-form-schema"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

function formatWeekOff(arr: number[]) {
  if (!Array.isArray(arr) || arr.length === 0) return "—"
  return arr
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES[d - 1] ?? String(d))
    .join(", ")
}

interface StepWeekOffsProps {
  recordId: string | null | undefined
  onSave?: () => void
  employeeSearchUrl?: string
  loading?: boolean
  mode?: "add" | "edit" | "view"
}

export default function StepWeekOffs({
  recordId,
  onSave,
  employeeSearchUrl = "employee_shift",
  loading = false,
  mode = "edit",
}: StepWeekOffsProps) {
  const isReadOnly = mode === "view"
  const tenantCode = useGetTenantCode()
  const normalizedRecordId = recordId
  const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters)

  const [weekOffs, setWeekOffs] = useState<WeekOffItem[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const shouldFetchRecord = Boolean(normalizedRecordId)

  const fetchRecordRequestData = useMemo(() => {
    if (!shouldFetchRecord) return null

    const criteriaRequests: Array<{ field: string; operator: "eq"; value: string }> = [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "_id", operator: "eq", value: normalizedRecordId! },
    ]

    return {
      hierarchyFilters: empHierarchyFilters ?? {},
      criteriaRequests,
      userEntitlement,
    }
  }, [shouldFetchRecord, tenantCode, normalizedRecordId, empHierarchyFilters, userEntitlement])

  const { refetch: refetchWeekOffs, loading: fetchLoading } = useRequest<any[]>({
    url: `employee_shift/searchWithHierarchy?offset=0&limit=1`,
    method: "POST",
    data: fetchRecordRequestData ?? undefined,
    dependencies: [fetchRecordRequestData],
    onSuccess: (data) => {
      const record = Array.isArray(data) ? data[0] : undefined
      const list = record?.weekOffs

      if (Array.isArray(list)) {
        setWeekOffs(list)
      } else {
        setWeekOffs([])
      }
    },
  })

  useEffect(() => {
    if (!shouldFetchRecord) return
    void refetchWeekOffs()
  }, [shouldFetchRecord, tenantCode, normalizedRecordId])

  const { post: postWeekOffs, loading: postLoading } = usePostRequest<any>({
    url: employeeSearchUrl,
    onSuccess: async () => {
      await refetchWeekOffs()
      onSave?.()
      toast.success("Week off configuration saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving week off configuration:", error)
      toast.error("Failed to save week off configuration")
    },
  })

  const isBusy = loading || postLoading || fetchLoading

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

  const buildPayload = (updatedWeekOffs: WeekOffItem[]) => {
    if (!normalizedRecordId) return null
    return {
      tenant: tenantCode,
      action: "update",
      id: normalizedRecordId,
      collectionName: employeeSearchUrl,
      data: { weekOffs: updatedWeekOffs },
    }
  }

  const handlePopupSubmit = (weekOffItem: WeekOffItem) => {
    const isEdit = editIndex !== null

    const cleanedItem = {
      ...weekOffItem,
      ...(weekOffItem.parseID ? { parseID: weekOffItem.parseID } : {}),
    }

    const updatedWeekOffs = isEdit
      ? weekOffs.map((row, index) => (index === editIndex ? cleanedItem : row))
      : [...weekOffs, cleanedItem]

    const payload = buildPayload(updatedWeekOffs)

    if (!payload) {
      toast.error("No record to update")
      return
    }
    postWeekOffs?.(payload)
    setWeekOffs(updatedWeekOffs)
    closeForm()
  }

  const removeWeekOff = (index: number) => {
    const updatedWeekOffs = weekOffs.filter((_, i) => i !== index)

    const payload = buildPayload(updatedWeekOffs)

    if (!payload) {
      toast.error("No record to update")
      return
    }

    postWeekOffs?.(payload)
    setWeekOffs(updatedWeekOffs)
    setDeleteIndex(null)
  }

  const columns = useMemo<ActionTableColumn<WeekOffItem>[]>(
    () => [
      {
        key: "week",
        label: "Week",
        render: (row) => row.week || "-",
      },
      {
        key: "weekOff",
        label: "Week Off",
        render: (row) => formatWeekOff(row.weekOff),
      },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<WeekOffItem>[]>(
    () => [
      { value: "week", label: "Week", getValue: (row) => String(row.week ?? "") },
      { value: "weekOff", label: "Week Off", getValue: (row) => formatWeekOff(row.weekOff) },
    ],
    []
  )

  const initialValue = editIndex !== null && weekOffs[editIndex] ? weekOffs[editIndex] : null

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Calendar className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Week Off Configuration ({weekOffs.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Configure weekly off days for different weeks in the rotation cycle.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<WeekOffItem>
          rows={weekOffs}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"week"}
          isViewMode={isReadOnly || isBusy}
          onAdd={!isReadOnly && !isBusy ? openAdd : undefined}
          addButtonLabel="Add Row"
          onEdit={!isReadOnly && !isBusy ? (index) => openEdit(index) : undefined}
          onDelete={!isReadOnly && !isBusy ? (index) => setDeleteIndex(index) : undefined}
          emptyTitle="No week off entries."
          emptyDescription="Use Add Row to set week number and select off days (e.g. Monday, Tuesday)."
        />
      </div>

      <WeekOffFormPopup
        open={isFormOpen && !isReadOnly && !isBusy}
        onClose={closeForm}
        initialWeekOff={initialValue}
        onSubmit={handlePopupSubmit}
        tenantCode={tenantCode}
        rowId={normalizedRecordId}
        collectionName={employeeSearchUrl}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Remove week off row</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this row?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" disabled={isBusy} onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button size="sm" disabled={isBusy} className="bg-red-600 hover:bg-red-700 text-white" onClick={() => removeWeekOff(deleteIndex)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
