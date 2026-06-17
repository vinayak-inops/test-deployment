"use client"

import { Plus, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PredefinedPropertiesFilterProps {
  searchTerm: string
  selectedField: string
  onSearchChange: (value: string) => void
  onFieldChange: (value: string) => void
  onAddClick: () => void
}

const searchFields = [
  { value: "prop", label: "Props" },
  { value: "description", label: "Description" },
]

export default function PredefinedPropertiesFilter({
  searchTerm,
  selectedField,
  onSearchChange,
  onFieldChange,
  onAddClick,
}: PredefinedPropertiesFilterProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex bg-gray-50 rounded-lg border border-gray-200 flex-1">
        {/* Field Selection - Left Side */}
        <div className="flex items-center bg-white border-r border-gray-200 rounded-l-lg px-3 py-2 w-40">
          <Filter className="w-4 h-4 text-gray-400 mr-2" />
          <Select value={selectedField} onValueChange={onFieldChange}>
            <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-gray-900 focus:ring-0 bg-transparent shadow-none">
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

        {/* Search Field - Right Side */}
        <div className="flex-1 flex items-center bg-white rounded-r-lg relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors" />
            <Input
              type="text"
              placeholder={`Search by ${searchFields.find((f) => f.value === selectedField)?.label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent transition-all duration-200"
            />
          </div>
          {searchTerm && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-4 py-2 h-10 text-sm font-medium text-white bg-gradient-to-r from-gray-600 to-gray-700 rounded-md hover:from-gray-700 hover:to-gray-800 transition-all duration-150"
      >
        <Plus className="w-4 h-4" />
        Add Property
      </button>
    </div>
  )
}

