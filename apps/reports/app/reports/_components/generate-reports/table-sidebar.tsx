"use client"

import { Badge } from "@repo/ui/components/ui/badge"
import { CheckCircle, AlertCircle } from "lucide-react"
import { TableType, TableMenuItem } from "./types"

interface TableSidebarProps {
  tableMenuItems: TableMenuItem[]
  visibleTables: Set<TableType>
  getSelectedItems: (type: TableType) => string[]
  onToggleTableVisibility: (tableId: TableType) => void
}

export function TableSidebar({
  tableMenuItems,
  visibleTables,
  getSelectedItems,
  onToggleTableVisibility,
}: TableSidebarProps) {
  return (
    <aside className="w-64 h-full overflow-y-auto overflow-x-hidden border-r border-gray-200 flex-shrink-0">
      <nav className="p-4 space-y-3">
        {/* Organization Section */}
        <div>
          <h3 className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Organization
          </h3>
          <div className="space-y-1">
            {tableMenuItems
              .filter(item => item.parent === 'organization')
              .map((item) => {
                const Icon = item.icon
                const selectedCount = getSelectedItems(item.id).length
                const hasItems = selectedCount > 0
                const isVisible = visibleTables.has(item.id)
                const isVisibleButEmpty = isVisible && !hasItems

                return (
                  <button
                    key={item.id}
                    onClick={() => onToggleTableVisibility(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isVisibleButEmpty
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : isVisible
                        ? 'bg-blue-100 text-blue-900'
                        : hasItems
                        ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {/* {hasItems && (
                      <Badge variant="secondary" className="ml-2 bg-blue-200 text-blue-800">
                        {selectedCount}
                      </Badge>
                    )} */}
                    {isVisibleButEmpty && (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    {isVisible && hasItems && (
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
          </div>
        </div>

        {/* Contractor Section */}
        <div>
          <h3 className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Contractor
          </h3>
          <div className="space-y-1">
            {tableMenuItems
              .filter(item => item.parent === 'contractor')
              .map((item) => {
                const Icon = item.icon
                const selectedCount = getSelectedItems(item.id).length
                const hasItems = selectedCount > 0
                const isVisible = visibleTables.has(item.id)
                const isVisibleButEmpty = isVisible && !hasItems

                return (
                  <button
                    key={item.id}
                    onClick={() => onToggleTableVisibility(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isVisibleButEmpty
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : isVisible
                        ? 'bg-blue-100 text-blue-900'
                        : hasItems
                        ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {/* {hasItems && (
                      <Badge variant="secondary" className="ml-2 bg-blue-200 text-blue-800">
                        {selectedCount}
                      </Badge>
                    )} */}
                    {isVisibleButEmpty && (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0"  />
                    )}
                    {isVisible && hasItems && (
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
          </div>
        </div>

        {/* Shift Section */}
        <div>
          <h3 className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Shift
          </h3>
          <div className="space-y-1">
            {tableMenuItems
              .filter(item => item.parent === 'shift')
              .map((item) => {
                const Icon = item.icon
                const selectedCount = getSelectedItems(item.id).length
                const hasItems = selectedCount > 0
                const isVisible = visibleTables.has(item.id)
                const isVisibleButEmpty = isVisible && !hasItems

                return (
                  <button
                    key={item.id}
                    onClick={() => onToggleTableVisibility(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isVisibleButEmpty
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : isVisible
                        ? 'bg-blue-100 text-blue-900'
                        : hasItems
                        ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {/* {hasItems && (
                      <Badge variant="secondary" className="ml-2 bg-blue-200 text-blue-800">
                        {selectedCount}
                      </Badge>
                    )} */}
                    {isVisibleButEmpty && (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0"  />
                    )}
                    {isVisible && hasItems && (
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
          </div>
        </div>

        {/* Contract Employee Section */}
        <div>
          <h3 className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Contract Employee
          </h3>
          <div className="space-y-1">
            {tableMenuItems
              .filter(item => item.parent === 'contractEmployee')
              .map((item) => {
                const Icon = item.icon
                const selectedCount = getSelectedItems(item.id).length
                const hasItems = selectedCount > 0
                const isVisible = visibleTables.has(item.id)
                const isVisibleButEmpty = isVisible && !hasItems

                return (
                  <button
                    key={item.id}
                    onClick={() => onToggleTableVisibility(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isVisibleButEmpty
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : isVisible
                        ? 'bg-blue-100 text-blue-900'
                        : hasItems
                        ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {hasItems && (
                      <Badge variant="secondary" className="ml-2 bg-blue-200 text-blue-800">
                        {selectedCount}
                      </Badge>
                    )}
                    {isVisibleButEmpty && (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0"  />
                    )}
                    {isVisible && hasItems && (
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
          </div>
        </div>
      </nav>
    </aside>
  )
}

