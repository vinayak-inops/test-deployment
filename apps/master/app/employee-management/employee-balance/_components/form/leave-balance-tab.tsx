"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { AlertTriangle, BookOpen } from "lucide-react"
import ActionDataTable, {
  type ActionTableColumn,
  type ActionTableSearchField,
} from "@/components/common/action-data-table"
import LeaveBalanceFormPopup, { type LeaveBalanceItem } from "./leave-balance-form-popup"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

type Props = {
  value: LeaveBalanceItem[]
  isViewMode: boolean
  error?: string
  onChange: (rows: LeaveBalanceItem[]) => void
  mode?: "add" | "edit" | "view"
  rowId?: string | null
  tenantCode?: string
  subsidiaryCode?: string | null
  locationCode?: string | null
  designationCode?: string | null
  employeeCategory?: string | null
}

export default function LeaveBalanceTab({
  value,
  isViewMode,
  error,
  onChange,
  mode = "add",
  rowId = null,
  tenantCode: propTenantCode,
  subsidiaryCode,
  locationCode,
  designationCode,
  employeeCategory,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode

  const [open, setOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [rows, setRows] = useState<LeaveBalanceItem[]>(() =>
    Array.isArray(value) ? value : []
  )

  const canFetch = Boolean(rowId) && mode !== "add"

  const searchCriteria = useMemo(() => {
    if (!canFetch) return []
    const criteria: Array<{ field: string; operator: string; value: any }> = [
      { field: "_id", operator: "eq", value: rowId },
    ]
    if (tenantCode)
      criteria.push({ field: "tenantCode", operator: "eq", value: tenantCode })
    return criteria
  }, [canFetch, rowId, tenantCode])

  const { loading, refetch } = useRequest<any[]>({
    url: "leaveBalance/search",
    method: "POST",
    data: searchCriteria,
    dependencies: [searchCriteria],
    enabled: canFetch,
    onSuccess: (data: any[]) => {
      const record = Array.isArray(data) && data.length > 0 ? data[0] : null
      const balances = Array.isArray(record?.balances) ? record.balances : []
      const normalized: LeaveBalanceItem[] = balances.map(
        (item: any, index: number) => ({
          parseID: item?.parseID || `lb-${index}`,
          leaveTitle: item?.leaveTitle || "",
          leaveCode: item?.leaveCode || "",
          unitOfTime: item?.unitOfTime || "",
          beginningYearBalance: Number(item?.beginningYearBalance ?? 0),
          carryoverBalance: Number(item?.carryoverBalance ?? 0),
          absencePaidYearToDate: Number(item?.absencePaidYearToDate ?? 0),
          absencePaidInPeriod: Number(item?.absencePaidInPeriod ?? 0),
          beginningPeriodBalance: Number(item?.beginningPeriodBalance ?? 0),
          accruedInPeriod: Number(item?.accruedInPeriod ?? 0),
          carryoverForfeitedInPeriod: Number(item?.carryoverForfeitedInPeriod ?? 0),
          encashed: Number(item?.encashed ?? 0),
          includeEventsAwaitingApproval: Number(item?.includeEventsAwaitingApproval ?? 0),
          asOfPeriod: item?.asOfPeriod || "",
          balance: Number(item?.balance ?? 0),
          encashable: Number(item?.encashable ?? 0),
        })
      )
      setRows(normalized)
      onChange(normalized)
    },
  })

  useEffect(() => {
    if (canFetch) void refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, tenantCode])

  useEffect(() => {
    if (canFetch) return
    setRows(Array.isArray(value) ? value : [])
  }, [canFetch, value])

  const initialItem = useMemo(
    () => (editIndex !== null ? (rows[editIndex] ?? null) : null),
    [editIndex, rows]
  )

  const columns = useMemo<ActionTableColumn<LeaveBalanceItem>[]>(
    () => [
      { key: "slNo", label: "SL", render: (_row, index) => index + 1 },
      { key: "leaveTitle", label: "Leave Title", render: (row) => row.leaveTitle || "-" },
      { key: "leaveCode", label: "Code", render: (row) => row.leaveCode || "-" },
      { key: "unitOfTime", label: "Unit", render: (row) => row.unitOfTime || "-" },
      { key: "beginningYearBalance", label: "Yr Balance", render: (row) => row.beginningYearBalance },
      { key: "balance", label: "Balance", render: (row) => row.balance },
      { key: "encashable", label: "Encashable", render: (row) => row.encashable },
      { key: "asOfPeriod", label: "As of Period", render: (row) => row.asOfPeriod || "-" },
    ],
    []
  )

  const searchFields = useMemo<ActionTableSearchField<LeaveBalanceItem>[]>(
    () => [
      { value: "leaveTitle", label: "Leave Title", getValue: (row) => row.leaveTitle },
      { value: "leaveCode", label: "Leave Code", getValue: (row) => row.leaveCode },
      { value: "unitOfTime", label: "Unit of Time", getValue: (row) => row.unitOfTime },
    ],
    []
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Tab Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <BookOpen className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Leave Balances ({rows?.length ?? 0})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or update leave balance entries.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-600">
            Loading balance data...
          </div>
        ) : (
          <ActionDataTable<LeaveBalanceItem>
            rows={rows}
            columns={columns}
            searchFields={searchFields}
            defaultSearchField="leaveTitle"
            isViewMode={isViewMode}
            onAdd={
              !isViewMode
                ? () => {
                    setEditIndex(null)
                    setOpen(true)
                  }
                : undefined
            }
            addButtonLabel="Add Row"
            onEdit={
              !isViewMode
                ? (index) => {
                    setEditIndex(index)
                    setOpen(true)
                  }
                : undefined
            }
            onDelete={!isViewMode ? setDeleteIndex : undefined}
            getRowKey={(row, index) => `${row.parseID || "lb"}-${index}`}
            emptyTitle="No leave balances configured"
            emptyDescription='Use "Add Row" to add a leave balance entry.'
          />
        )}
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>

      <LeaveBalanceFormPopup
        open={open && !isViewMode}
        isViewMode={isViewMode}
        initialItem={initialItem}
        tenantCode={tenantCode}
        rowId={rowId}
        subsidiaryCode={subsidiaryCode}
        locationCode={locationCode}
        designationCode={designationCode}
        employeeCategory={employeeCategory}
        onClose={() => {
          setEditIndex(null)
          setOpen(false)
        }}
        onSubmit={(item) => {
          const nextRows =
            editIndex !== null
              ? rows.map((x, idx) => (idx === editIndex ? item : x))
              : [...rows, item]
          setRows(nextRows)
          onChange(nextRows)
          setEditIndex(null)
          setOpen(false)
        }}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">
                  Remove balance row
                </h3>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Are you sure you want to remove this entry?
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteIndex(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  const nextRows = rows.filter((_, idx) => idx !== deleteIndex)
                  setRows(nextRows)
                  onChange(nextRows)
                  setDeleteIndex(null)
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
