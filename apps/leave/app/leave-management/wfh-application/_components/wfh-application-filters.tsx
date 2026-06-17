"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import WfhFormPopup from "./wfh-form-popup"

type TabKey = "all" | "pending" | "approved" | "rejected" | "cancelled" | "failed"

interface WfhApplicationFiltersProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  onApply: (opts: { field: string; value: string }) => void
  onRefresh: () => void
  isSelfPermission?: boolean
  isAllPermission?: boolean
  hideApplicationsTab?: boolean
  hideApplyButton?: boolean
}

const TABS: { key: TabKey; label: string; activeBg: string; activeText: string; activeBorder: string }[] = [
  { key: "all", label: "All", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400" },
  { key: "pending", label: "Pending", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400" },
  { key: "failed", label: "Failed", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400" },
  { key: "approved", label: "Approval", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400" },
  { key: "rejected", label: "Reject", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400" },
  { key: "cancelled", label: "Cancel", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400" },
]

const SEARCH_FIELDS: { value: string; label: string }[] = [
  { value: "employeeID", label: "Employee ID" },
  { value: "fromDate", label: "From Date" },
  { value: "toDate", label: "To Date" },
  { value: "description", label: "Description" },
  { value: "uploadedBy", label: "Applied By" },
  { value: "workflowState", label: "Status" },
]

export default function WfhApplicationFilters({
  activeTab,
  onTabChange,
  onApply,
  onRefresh,
  isSelfPermission = false,
  isAllPermission = false,
  hideApplicationsTab = false,
  hideApplyButton = false,
}: WfhApplicationFiltersProps) {
  const [field, setField] = useState<string>("employeeID")
  const [value, setValue] = useState<string>("")
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)
  const [initialValues, setInitialValues] = useState<Record<string, string> | undefined>(undefined)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const visibleTabs = useMemo(() => {
    let tabs = TABS
    if (hideApplicationsTab) tabs = tabs.filter((tab) => tab.key !== "all")
    if (isSelfPermission || isAllPermission || hideApplicationsTab) return tabs
    return []
  }, [isSelfPermission, isAllPermission, hideApplicationsTab])

  const getTabColorClasses = (key: TabKey, isActive: boolean): string => {
    if (isActive) {
      const tab = TABS.find((t) => t.key === key)
      return `${tab?.activeBg || ""} ${tab?.activeText || ""} ${tab?.activeBorder || ""}`
    }
    return "text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900"
  }

  const selectedFieldLabel = useMemo(
    () => SEARCH_FIELDS.find((f) => f.value === field)?.label.toLowerCase() || "field",
    [field],
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const cleanValue = value.trim()
      onApply({ field, value: cleanValue })
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [field, value, onApply])

  return (
    <div className="w-full px-0 py-2">
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-50 rounded-xl p-0 h-10">
          {visibleTabs.map((t, index) => (
            <button
              key={t.key}
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onTabChange(t.key)
              }}
              className={`px-5 h-10 inline-flex items-center text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 ${getTabColorClasses(t.key, activeTab === t.key)} ${
                index === 0 ? "rounded-l-xl" : index === visibleTabs.length - 1 ? "rounded-r-xl" : ""
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-50 rounded-xl p-0 h-10">
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

            <div className="flex-1 flex items-center bg-white border-t border-r border-b border-gray-200 rounded-r-xl h-10 relative">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors" />
                <Input
                  type="text"
                  placeholder={`Search by ${selectedFieldLabel}...`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="pl-10 pr-3 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {!hideApplyButton && (
            <Button
              size="sm"
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                const cleanValue = value.trim()
                onApply({ field, value: cleanValue })
                const init: Record<string, string> = {}
                if (field === "employeeID") init.employeeID = cleanValue
                setInitialValues(init)
                setIsPopupOpen(true)
              }}
            >
              Apply
            </Button>
          )}
          {/* <Button variant="outline" onClick={onRefresh}>Refresh</Button> */}
        </div>
      </div>

      {!hideApplyButton && (
        <WfhFormPopup
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          initialValues={{
            employeeID: initialValues?.employeeID || "",
          }}
          onSubmitSuccess={() => {
            onRefresh()
            setIsPopupOpen(false)
          }}
        />
      )}
    </div>
  )
}
