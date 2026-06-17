"use client"

import React from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type TabKey = string

export interface TabConfig {
  key: TabKey
  label: string
  activeBg?: string
  activeText?: string
  activeBorder?: string
  hoverBg?: string
  hoverText?: string
}

interface ApplicationFiltersProps {
  activeTab: TabKey
  onTabChange: any
  searchField: string
  searchValue: string
  onSearchFieldChange: (field: string) => void
  onSearchValueChange: (value: string) => void
  isSearching?: boolean
  tabs?: TabConfig[]  // Tabs passed from parent
  searchFields?: { value: string; label: string }[]  // Optional search fields from parent
}

const DEFAULT_SEARCH_FIELDS: { value: string; label: string }[] = [
  { value: "employeeID", label: "Employee ID" },
  { value: "attendanceDate", label: "Attendance Date" },
  { value: "newAttendanceDate", label: "New Attendance Date" },
  { value: "remarks", label: "Remarks" },
]

export default function ApplicationFilters({ 
  activeTab, 
  onTabChange, 
  searchField, 
  searchValue, 
  onSearchFieldChange, 
  onSearchValueChange,
  isSearching = false,
  tabs = [],  // Receive tabs from parent
  searchFields = DEFAULT_SEARCH_FIELDS
}: ApplicationFiltersProps) {
  const getTabColorClasses = (tab: TabConfig, isActive: boolean): string => {
    if (isActive) {
      return `${tab.activeBg || 'bg-blue-100'} ${tab.activeText || 'text-blue-800'} ${tab.activeBorder || 'border-blue-400'}`
    } else {
      return `text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900 ${tab.hoverBg || ''} ${tab.hoverText || ''}`
    }
  }

  // Don't render if no tabs provided
  if (!tabs.length) {
    return null
  }

  return (
    <div className="w-full px-0 py-2">
      <div className="flex items-center justify-between">
        {/* Left: Tabs from parent */}
        <div className="flex bg-gray-50 rounded-xl p-0 h-10">
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTabChange(tab.key);
              }}
              className={`px-5 h-10 inline-flex items-center text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 ${getTabColorClasses(tab, activeTab === tab.key)} ${
                index === 0 ? 'rounded-l-xl' : index === tabs.length - 1 ? 'rounded-r-xl' : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Combined select + search */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-50 rounded-xl p-0 h-10">
            {/* Left segment with filter icon and select */}
            <div className="flex items-center bg-white border border-gray-200 rounded-l-xl px-3 h-10 w-40">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              <Select value={searchField} onValueChange={onSearchFieldChange}>
                <SelectTrigger className="w-full h-10 border-none p-0 text-sm font-medium text-gray-900 focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[140px] shadow-none border border-gray-200">
                  {searchFields.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="text-sm">
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Right segment with search icon and input */}
            <div className="flex-1 flex items-center bg-white border-t border-r border-b border-gray-200 rounded-r-xl h-10 relative">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors" />
                <Input
                  type="text"
                  placeholder={`Search by ${searchFields.find(f => f.value === searchField)?.label.toLowerCase()}...`}
                  value={searchValue}
                  onChange={(e) => onSearchValueChange(e.target.value)}
                  className="pl-10 pr-3 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent transition-all duration-200"
                />
              </div>
              {(searchValue || isSearching) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className={`w-2 h-2 bg-blue-500 rounded-full ${isSearching ? 'animate-pulse' : 'animate-ping'}`}></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}