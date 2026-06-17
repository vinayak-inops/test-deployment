"use client"

import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { Mail } from "lucide-react"

interface Props {
  rows: Array<{ email: string }>
  columns: ActionTableColumn<{ email: string }>[]
  searchFields: ActionTableSearchField<{ email: string }>[]
  viewMode: boolean
  onAdd?: () => void
}

export default function MailGroupAssociationPrimarySelectedTable({
  rows,
  columns,
  searchFields,
  viewMode,
  onAdd,
}: Props) {
  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Mail className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">Primary Emails ({rows.length})</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Add or remove primary emails.</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<{ email: string }>
          rows={rows}
          columns={viewMode ? columns.filter((c) => c.key !== "action") : columns}
          searchFields={searchFields}
          defaultSearchField="email"
          isViewMode={viewMode}
          onAdd={!viewMode ? onAdd : undefined}
          addButtonLabel="Add Primary Email"
          emptyTitle="No primary emails selected"
          emptyDescription="Select email from above table."
          getRowKey={(row) => `primary-${row.email}`}
        />
      </div>
    </div>
  )
}

