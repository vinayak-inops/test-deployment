"use client"

import { Search, Filter, UserPlus } from "lucide-react"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"

interface SearchField {
  value: string
  label: string
}

interface WeekOffFilterBarProps {
  searchTerm: string
  setSearchTerm: (value: string) => void
  selectedField: string
  setSelectedField: (value: string) => void
  searchFields: SearchField[]
  filtersApplied: boolean
  onFilterClick: () => void
  onAddNew: () => void
  canAdd?: boolean
}

export default function WeekOffFilterBar({
  searchTerm,
  setSearchTerm,
  selectedField,
  setSelectedField,
  searchFields,
  filtersApplied,
  onFilterClick,
  onAddNew,
  canAdd = true,
}: WeekOffFilterBarProps) {
  const selectedFieldLabel = searchFields.find((f) => f.value === selectedField)?.label || ""

  return (
    <div className="w-full px-4 py-4 pb-4">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div className="flex bg-muted/50 rounded-lg border flex-1">
          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
            <Filter className="w-4 h-4 text-muted-foreground mr-2" />
            <Select
              value={selectedField}
              onValueChange={(value) => {
                setSelectedField(value)
              }}
              disabled={!filtersApplied}
            >
              <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {searchFields.map((field) => (
                  <SelectItem key={field.value} value={field.value} className="text-sm">
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 flex items-center bg-background rounded-r-lg min-w-0">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder={`Search by ${selectedFieldLabel.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                }}
                disabled={!filtersApplied}
                className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {canAdd && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onAddNew()
            }}
            className="px-4 py-2 h-10 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg flex items-center gap-2 flex-shrink-0 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Add New
          </button>
        )}
      </div>
    </div>
  )
}
