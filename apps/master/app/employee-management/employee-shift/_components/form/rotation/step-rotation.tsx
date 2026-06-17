"use client"

import { useEffect, useMemo, useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { toast } from "react-toastify"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { RotationFormPopup } from "./rotation-form-popup"
import { type RotationItem } from "../../schemas/rotation-form-schema"
import { useEmployeeShiftGraphql } from "@/hooks/api/useEmployeeShiftGraphql"

interface StepRotationProps {
  recordId: string | null | undefined
  onSave?: () => void
  employeeSearchUrl?: string
  loading?: boolean
  mode?: "add" | "edit" | "view"
}

export default function StepRotation({
  recordId,
  onSave,
  employeeSearchUrl = "employee_shift",
  loading = false,
  mode = "edit",
}: StepRotationProps) {
  const isReadOnly = mode === "view"
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters)
  const normalizedRecordId = recordId

  const [rotation, setRotation] = useState<RotationItem[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const shouldFetchRecord = Boolean(normalizedRecordId)

  const getFetchRecordRequestData = () => {
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
}
  // ✅ USING STATE INSTEAD OF fetchedRecord
  const { refetch: refetchRecord, loading: fetchLoading } = useRequest<any[]>({
    url: `employee_shift/searchWithHierarchy?offset=0&limit=1`,
    method: "POST",
    data: getFetchRecordRequestData() ?? undefined,
    onSuccess: (data) => {
      const record = Array.isArray(data) ? data[0] : undefined
      const list = record?.rotation

      if (Array.isArray(list)) {
        setRotation(list)
      } else {
        setRotation([])
      }
    },
  })

  const hierarchyFiltersForHook = useMemo(() => {
    if (!empHierarchyFilters) return undefined
    const withCategories = empHierarchyFilters as { categories?: string[] }
    return {
      subsidiaries: empHierarchyFilters.subsidiaries,
      locations: empHierarchyFilters.locations,
      categories: withCategories.categories,
    }
  }, [empHierarchyFilters])

  const { shiftGroups, shiftOptions } = useEmployeeShiftGraphql({
    tenantCode,
    shiftGroupCode: "",
    shiftGroupSearch: "",
  })

  const { post: postShiftRotation, loading: postLoading } = usePostRequest<any>({
    url: employeeSearchUrl,
    onSuccess: async () => {
      toast.success("Week off configuration saved successfully!")
      await refetchRecord()
    },
    onError: (error) => {
      console.error("Error saving rotation:", error)
      toast.error("Failed to save rotation")
    },
  })
  useEffect(() => { refetchRecord()},[tenantCode])

  const isBusy = loading || postLoading || fetchLoading

  const buildPayload = (updatedRotation: RotationItem[]) => {
    return {
      tenant: tenantCode,
      action: "update",
      collectionName: employeeSearchUrl,
      id: normalizedRecordId,
      data: {
        rotation: updatedRotation,
      },
    }
  }

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

  const handlePopupSubmit = (rotationItem: RotationItem) => {
    const isEdit = editIndex !== null

    const cleanedItem = {
      ...rotationItem,
      ...(rotationItem.parseID ? { parseID: rotationItem.parseID } : {}),
    }

    const updatedRotation = isEdit
      ? rotation.map((r, i) => (i === editIndex ? cleanedItem : r))
      : [...rotation, cleanedItem]

    const payload = buildPayload([cleanedItem])

    if (!payload) {
      toast.error("No record to update")
      return
    }
    postShiftRotation?.(payload)
    setRotation(updatedRotation)
    closeForm()
  }

  const removeRotation = (index: number) => {
    const updatedRotation = rotation.filter((_, i) => i !== index)
    const payload = buildPayload(updatedRotation)
    if (!payload) {
      toast.error("No record to update")
      return
    }
    postShiftRotation?.(payload)
    setRotation(updatedRotation)
    setDeleteIndex(null)
  }

  const shiftGroupNameFor = (code: string) => shiftGroups.find((g) => g.shiftGroupCode === code)?.shiftGroupName ?? ""
  const shiftNameFor = (code: string) => shiftOptions.find((s) => s.shiftCode === code)?.shiftName ?? ""

  const columns = useMemo<ActionTableColumn<RotationItem>[]>(
    () => [
      {
        key: "days",
        label: "Days",
        render: (row) => row.days || "-",
      },
      {
        key: "priority",
        label: "Priority",
        render: (row) => row.priority || "-",
      },
      {
        key: "shiftGroupCode",
        label: "Shift Group",
        render: (row) => (row.shiftGroupCode ? `${shiftGroupNameFor(row.shiftGroupCode)} (${row.shiftGroupCode})` : "-"),
      },
      {
        key: "shiftCode",
        label: "Shift",
        render: (row) => (row.shiftCode ? `${shiftNameFor(row.shiftCode)} (${row.shiftCode})` : "-"),
      },
    ],
    [shiftGroups, shiftOptions]
  )

  const searchFields = useMemo<ActionTableSearchField<RotationItem>[]>(
    () => [
      { value: "days", label: "Days", getValue: (row) => String(row.days ?? "") },
      { value: "priority", label: "Priority", getValue: (row) => String(row.priority ?? "") },
      { value: "shiftGroupCode", label: "Shift Group", getValue: (row) => row.shiftGroupCode || "" },
      { value: "shiftCode", label: "Shift", getValue: (row) => row.shiftCode || "" },
    ],
    []
  )

  const initialValue = editIndex !== null && rotation[editIndex] ? rotation[editIndex] : null

  // if (fetchLoading) {
  //   return (
  //     <div className="p-6 text-center text-gray-500">
  //       Loading rotation data...
  //     </div>
  //   )
  // }
  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Clock className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Rotation Configuration ({rotation.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Configure rotation schedules with priority-based shift assignments.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<RotationItem>
          rows={rotation}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"shiftGroupCode"}
          isViewMode={isReadOnly || isBusy}
          onAdd={!isReadOnly && !isBusy ? openAdd : undefined}
          addButtonLabel="Add Row"
          onEdit={!isReadOnly && !isBusy ? openEdit : undefined}
          onDelete={!isReadOnly && !isBusy ? (index) => setDeleteIndex(index) : undefined}
          emptyTitle="No rotation entries."
          emptyDescription="Use Add Row to add days, priority, and shift for each rotation step."
        />
      </div>

      <RotationFormPopup
        open={isFormOpen && !isReadOnly && !isBusy}
        onClose={closeForm}
        initialRotation={initialValue}
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
                <h3 className="text-sm font-semibold text-red-900">Remove rotation row</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this row?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" disabled={isBusy} onClick={() => setDeleteIndex(null)}>
                Cancel
              </Button>
              <Button size="sm" disabled={isBusy} className="bg-red-600 hover:bg-red-700 text-white" onClick={() => removeRotation(deleteIndex)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}