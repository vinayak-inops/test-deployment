"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


type TabKey = "all" | "pending" | "approved" | "rejected" | "cancelled" | "failed"

interface ApplicationFiltersProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  onApply: (opts: { field: string; value: string }) => void
  otRefetch: () => void
  isSelfPermission?: boolean
  isAllPermission?: boolean
  hideApplicationsTab?: boolean
  hideApplyButton?: boolean
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
  { key: "approved", label: "Approval" },
  { key: "rejected", label: "Reject" },
  { key: "cancelled", label: "Cancel" },
]

const SEARCH_FIELDS: { value: string; label: string }[] = [
  { value: "employeeID", label: "Employee ID" },
  { value: "attendanceDate", label: "Attendance Date" },
  { value: "remarks", label: "Remarks" },
  { value: "uploadedBy", label: "Applied By" },
  { value: "status", label: "Status" },
]

export default function ApplicationFilters({ activeTab, onTabChange, onApply, otRefetch, isSelfPermission = false, isAllPermission = false, hideApplicationsTab = false, hideApplyButton = false }: ApplicationFiltersProps) {
  const [field, setField] = useState<string>("employeeID")
  const [value, setValue] = useState<string>("")
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)
  const [initialValues, setInitialValues] = useState<any | undefined>(undefined)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Filter tabs based on permissions
  const visibleTabs = React.useMemo(() => {
    let tabs = TABS
    if (hideApplicationsTab) {
      tabs = tabs.filter(tab => tab.key !== 'all')
    }
    if (isSelfPermission || isAllPermission || hideApplicationsTab) {
      return tabs
    }
    return []
  }, [isSelfPermission, isAllPermission, hideApplicationsTab])

  // Auto-apply filter after user stops typing for ~350ms
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      const cleanValue = value.trim()
      onApply({ field, value: cleanValue })
    }, 350)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [field, value, onApply])

  return (
    <div className="w-full px-0 py-2">
      <div className="flex items-center justify-between">
        {/* Left: Tabs (grouped like reference) */}
        <div className="flex bg-gray-50 rounded-xl p-0 h-10">
          {visibleTabs.map((t, index) => (
            <button
              key={t.key}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTabChange(t.key);
              }}
              className={`px-5 h-10 inline-flex items-center text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 ${
                activeTab === t.key
                  ? 'text-gray-900 border-gray-900 bg-white'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
              } ${
                index === 0 ? 'rounded-l-xl' : index === visibleTabs.length - 1 ? 'rounded-r-xl' : ''
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Right: Combined select + search like reference */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-50 rounded-xl p-0 h-10">
            {/* Left segment with filter icon and select */}
            <div className="flex items-center bg-white border border-gray-200 rounded-l-xl px-3 h-10 w-40">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              <Select value={field} onValueChange={setField}>
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
            <div className="flex-1 flex items-center bg-white border-t border-r border-b border-gray-200 rounded-r-xl h-10">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={`Search by ${SEARCH_FIELDS.find(f => f.value === field)?.label.toLowerCase()}...`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="pl-10 pr-3 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>
          {/* <Button
            size="sm"
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {
              onApply({ field, value })
              const init: any = {}
              if (field === "employeeID") init.employeeID = value
              if (field === "attendanceDate") init.attendanceDate = value
              setInitialValues(init)
              setIsPopupOpen(true)
            }}
          >
            Apply
          </Button> */}
        </div>
      </div>
      
    </div>
  )
}


