"use client"

import { useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { AlertTriangle, Bell } from "lucide-react"
import ActionDataTable, {
  type ActionTableColumn,
  type ActionTableSearchField,
} from "@/components/common/action-data-table"
import NotificationSettingsFormPopup, {
  type NotificationSettingItem,
} from "./notification-settings-form-popup"

type Props = {
  rows: NotificationSettingItem[]
  isViewMode: boolean
  onChange: (rows: NotificationSettingItem[]) => void
  rowId?: string | null
  tenantCode?: string
}

export default function NotificationSettingsTab({ rows, isViewMode, onChange, rowId, tenantCode }: Props) {
  const [open, setOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)

  const initialValue = useMemo(
    () => (editIndex !== null ? (rows[editIndex] ?? null) : null),
    [editIndex, rows],
  )

  const columns = useMemo<ActionTableColumn<NotificationSettingItem>[]>(
    () => [
      { key: "slNo", label: "SL", render: (_row, index) => index + 1 },
      { key: "propertyName", label: "Property Name", render: (row) => row.propertyName },
      { key: "mailGroup", label: "Mail Group", render: (row) => row.mailGroup },
      { key: "notifyPriorDays", label: "Prior Days", render: (row) => row.notifyPriorDays },
      {
        key: "notifyEnabled",
        label: "Notify",
        render: (row) => (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.notifyEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {row.notifyEnabled ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "isActive",
        label: "Active",
        render: (row) => (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
            {row.isActive ? "Yes" : "No"}
          </span>
        ),
      },
    ],
    [],
  )

  const searchFields = useMemo<ActionTableSearchField<NotificationSettingItem>[]>(
    () => [
      { value: "propertyName", label: "Property Name", getValue: (row) => row.propertyName },
      { value: "mailGroup", label: "Mail Group", getValue: (row) => row.mailGroup },
    ],
    [],
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Bell className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Notification Settings ({rows.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Configure notifications for expiry and alerts.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<NotificationSettingItem>
          rows={rows}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField="propertyName"
          isViewMode={isViewMode}
          onAdd={!isViewMode ? () => { setEditIndex(null); setOpen(true) } : undefined}
          addButtonLabel="Add Row"
          onEdit={!isViewMode ? (index) => { setEditIndex(index); setOpen(true) } : undefined}
          onDelete={!isViewMode ? setDeleteIndex : undefined}
          getRowKey={(row, index) => `${row.parseID || "notif"}-${index}`}
          emptyTitle="No notifications configured"
          emptyDescription='Use "Add Row" to configure a notification setting.'
        />
      </div>

      <NotificationSettingsFormPopup
        open={open && !isViewMode}
        isViewMode={isViewMode}
        initialItem={initialValue}
        tenantCode={tenantCode}
        rowId={rowId}
        onClose={() => { setEditIndex(null); setOpen(false) }}
        onSubmit={(item) => {
          const nextRows =
            editIndex !== null
              ? rows.map((x, idx) => (idx === editIndex ? item : x))
              : [...rows, item]
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
                <h3 className="text-sm font-semibold text-red-900">Remove notification</h3>
                <p className="text-[11px] text-red-600 mt-0.5">Are you sure you want to remove this row?</p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteIndex(null)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  onChange(rows.filter((_, idx) => idx !== deleteIndex))
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
