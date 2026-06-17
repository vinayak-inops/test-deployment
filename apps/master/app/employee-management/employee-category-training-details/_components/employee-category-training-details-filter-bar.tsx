"use client"

import { Filter, Search, UserPlus } from "lucide-react"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"

interface SearchField {
  value: string
  label: string
}

interface EmployeeCategoryTrainingDetailsFilterBarProps {
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

export default function EmployeeCategoryTrainingDetailsFilterBar({
  searchTerm,
  setSearchTerm,
  selectedField,
  setSelectedField,
  searchFields,
  filtersApplied,
  onFilterClick,
  onAddNew,
  canAdd = true,
}: EmployeeCategoryTrainingDetailsFilterBarProps) {
  const selectedFieldLabel = searchFields.find((f) => f.value === selectedField)?.label || ""

  return (
    <div className="w-full px-8 py-4 pb-0">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div className="flex bg-muted/50 rounded-lg border flex-1">
          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-56">
            <Filter className="w-4 h-4 text-muted-foreground mr-2" />
            <Select
              value={selectedField}
              onValueChange={(value) => setSelectedField(value)}
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
            className="inline-flex items-center gap-2 px-4 py-2 h-10 rounded-lg text-sm font-medium text-white bg-[#6366f1] hover:bg-[#4f46e5] transition-colors flex-shrink-0 whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" />
            Add New
          </button>
        )}
      </div>
    </div>
  )
}


