"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TabKey = "pending" | "approved" | "rejected" | "cancelled" | "failed" | "applications"

interface WageFiltersProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  onApply: (opts: { field: string; value: string }) => void
  onOpenForm: () => void
  applyMode?: boolean
}

const TABS: {
  key: TabKey
  label: string
  activeBg: string
  activeText: string
  activeBorder: string
}[] = [
  {
    key: "applications",
    label: "Applications",
    activeBg: "bg-blue-100",
    activeText: "text-blue-800",
    activeBorder: "border-blue-400",
  },
  {
    key: "pending",
    label: "Pending",
    activeBg: "bg-blue-100",
    activeText: "text-blue-800",
    activeBorder: "border-blue-400",
  },
  {
    key: "approved",
    label: "Approval",
    activeBg: "bg-blue-100",
    activeText: "text-blue-800",
    activeBorder: "border-blue-400",
  },
  {
    key: "cancelled",
    label: "Cancel",
    activeBg: "bg-blue-100",
    activeText: "text-blue-800",
    activeBorder: "border-blue-400",
  },
  {
    key: "rejected",
    label: "Reject",
    activeBg: "bg-blue-100",
    activeText: "text-blue-800",
    activeBorder: "border-blue-400",
  },
  {
    key: "failed",
    label: "Failed",
    activeBg: "bg-blue-100",
    activeText: "text-blue-800",
    activeBorder: "border-blue-400",
  },
]

const SEARCH_FIELDS: { value: string; label: string }[] = [
  { value: "appliedDate", label: "Applied Date" },
  { value: "year", label: "Year" },
  { value: "month", label: "Month" },
  { value: "remarks", label: "Remarks" },
]

const DEBOUNCE_DELAY = 500 // milliseconds

export default function WageFilters({
  activeTab,
  onTabChange,
  onApply,
  onOpenForm,
  applyMode = false,
}: WageFiltersProps) {
  const [field, setField] = useState<string>("appliedDate")
  const [value, setValue] = useState<string>("")
  
  // Refs for debounce management
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef<boolean>(false)
  const hasUserInteractedRef = useRef<boolean>(false)

  const getTabColorClasses = (key: TabKey, isActive: boolean): string => {
    if (isActive) {
      const tab = TABS.find((t) => t.key === key)
      return `${tab?.activeBg} ${tab?.activeText} ${tab?.activeBorder}`
    }
    return "text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900"
  }

  // Clean debounce function - only triggers after user stops typing
  const debouncedApply = useCallback(
    (fieldValue: string, searchValue: string) => {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      // Only set timer if user has interacted (prevents initial mount call)
      if (hasUserInteractedRef.current) {
        debounceTimerRef.current = setTimeout(() => {
          const trimmedValue = searchValue.trim()
          onApply({ field: fieldValue, value: trimmedValue })
          debounceTimerRef.current = null
        }, DEBOUNCE_DELAY)
      }
    },
    [onApply]
  )

  // Handle input change - update state and trigger debounce
  const handleInputChange = useCallback(
    (newValue: string) => {
      // Mark that user has interacted
      hasUserInteractedRef.current = true
      
      // Update local state immediately for UI responsiveness
      setValue(newValue)
      
      // Trigger debounced apply
      debouncedApply(field, newValue)
    },
    [field, debouncedApply]
  )

  // Handle field change - clear debounce and apply immediately if value exists
  const handleFieldChange = useCallback(
    (newField: string) => {
      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      // Update field state
      setField(newField)

      // If user has entered a value, apply immediately with new field
      if (hasUserInteractedRef.current && value.trim()) {
        onApply({ field: newField, value: value.trim() })
      }
    },
    [value, onApply]
  )

  // Handle manual Apply button click - apply immediately
  const handleApplyClick = useCallback(() => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    // Apply immediately
    const trimmedValue = value.trim()
    onApply({ field, value: trimmedValue })
    onOpenForm()
  }, [field, value, onApply, onOpenForm])

  // Set mounted flag after first render
  useEffect(() => {
    isMountedRef.current = true
    
    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [])

  return (
    <div className="w-full px-0 py-2">
      <div className="flex items-center justify-between">
        {/* Left: Tabs */}
        <div className="flex bg-gray-50 rounded-xl p-0 h-10">
          {TABS.map((t, index) => (
            <button
              key={t.key}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onTabChange(t.key)
              }}
              className={`px-5 h-10 inline-flex items-center text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 ${getTabColorClasses(
                t.key,
                activeTab === t.key,
              )} ${index === 0 ? "rounded-l-xl" : index === TABS.length - 1 ? "rounded-r-xl" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Right: Combined select + search + Apply */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-50 rounded-xl p-0 h-10">
            {/* Left segment with filter icon and select */}
            <div className="flex items-center bg-white border border-gray-200 rounded-l-xl px-3 h-10 w-40">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              <Select value={field} onValueChange={handleFieldChange}>
                <SelectTrigger className="w-full h-10 border-none p-0 text-sm font-medium text-gray-900 focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[140px] shadow-none border border-gray-200">
                  {SEARCH_FIELDS.map((f) => (
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
                  placeholder={`Search by ${SEARCH_FIELDS.find((f) => f.value === field)?.label.toLowerCase()}...`}
                  value={value}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="pl-10 pr-3 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>
          {applyMode && (
            <Button
              size="sm"
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleApplyClick}
            >
              Apply
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
