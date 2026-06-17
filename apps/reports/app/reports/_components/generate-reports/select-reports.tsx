"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

export type ReportCategory = 
  | "all"
  | "contractEmployee"
  | "shift"
  | "attendance"
  | "leave"
  | "contractor"
  | "salary"
  | "compliance"
  | "other"
  

export interface ReportItem {
  id: string
  title: string
  description: string
  category: ReportCategory
  workflowName: string
}

// Raw report option from API/JSON
export interface ReportOption {
  value: string
  label: string
  category: string
  workflowName: string
  description: string
}

// Tenant report configuration structure
export interface TenantReportConfiguration {
  _id: { $oid: string }
  tenant: string
  options: ReportOption[]
  isActive: boolean
  isDeleted: boolean
  tenantCode: string
  createdBy: string
  createdOn: string
  _class: string
  organizationCode: string
}

// Map API category to component category
const mapCategoryToReportCategory = (category: string): ReportCategory => {
  const categoryMap: Record<string, ReportCategory> = {
    "Contract Employee": "contractEmployee",
    "Shift": "shift",
    "Attendance": "attendance",
    "Leave": "leave",
    "Contractor": "contractor",
    "Salary": "salary",
    "Compliance": "compliance",
  }
  return categoryMap[category] || "other"
}

// Convert API report options to ReportItem format
export const convertReportOptionsToItems = (options: ReportOption[]): ReportItem[] => {
  return options.map((option) => ({
    id: option.value,
    title: option.label,
    description: option.description || "",
    category: mapCategoryToReportCategory(option.category),
    workflowName: option.workflowName,
  }))
}

interface SelectReportsProps {
  selectedReport: string | null
  onSelectionChange: (selectedId: string | null, workflowName?: string | null) => void
  onSaveAndContinue?: () => void
  searchLabel?: string
  searchPlaceholder?: string
}

export function SelectReports({
  selectedReport,
  onSelectionChange,
  onSaveAndContinue,
  searchLabel = "Search by Report Title",
  searchPlaceholder = "Report title, category, or keyword",
}: SelectReportsProps) {
  const tenantCode = useGetTenantCode()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState<ReportCategory>("all")
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Fetch tenant report configuration
  const {
    data: reportConfigData,
    loading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useRequest<TenantReportConfiguration[]>({
    url: 'tenantReportConfiguration/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ],
    dependencies: [tenantCode],
  })

  useEffect(() => {
    refetchReports()
  }, [tenantCode])

  // Convert fetched data to ReportItem format
  const reports: ReportItem[] = useMemo(() => {
    if (!reportConfigData || !Array.isArray(reportConfigData) || reportConfigData.length === 0) {
      return []
    }
    
    // Get the first configuration (should be only one per tenant)
    const config = reportConfigData[0]
    if (!config || !config.options || !Array.isArray(config.options)) {
      return []
    }
    
    return convertReportOptionsToItems(config.options)
  }, [reportConfigData])

  // Dynamically generate tabs based on available categories in reports
  const availableCategories = useMemo(() => {
    const categories = new Set<ReportCategory>()
    reports.forEach((report) => {
      categories.add(report.category)
    })
    return Array.from(categories).sort()
  }, [reports])

  const tabs: { id: ReportCategory; label: string }[] = useMemo(() => {
    const tabMap: Record<ReportCategory, string> = {
      all: "All",
      contractEmployee: "Contract Employee",
      shift: "Shift",
      attendance: "Attendance",
      leave: "Leave",
      contractor: "Contractor",
      salary: "Salary",
      other: "Other",
      compliance: "Compliance",
    }

    // Always include "All" tab, then add available categories
    const tabsList: { id: ReportCategory; label: string }[] = [
      { id: "all", label: "All" },
    ]

    // Add tabs for available categories (excluding "all")
    availableCategories.forEach((category) => {
      if (category !== "all") {
        tabsList.push({ id: category, label: tabMap[category] || category })
      }
    })

    return tabsList
  }, [availableCategories])

  // Check scroll position and update button states
  const checkScrollButtons = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    checkScrollButtons()
    const container = tabsContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScrollButtons)
      window.addEventListener("resize", checkScrollButtons)
      return () => {
        container.removeEventListener("scroll", checkScrollButtons)
        window.removeEventListener("resize", checkScrollButtons)
      }
    }
  }, [])

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200
      const newScrollLeft =
        tabsContainerRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount)
      tabsContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      })
    }
  }

  // Filter reports based on selected tab and search term
  const filteredReports = useMemo(() => {
    let filtered = reports

    // Filter by category (tab)
    if (selectedTab !== "all") {
      filtered = filtered.filter((report) => report.category === selectedTab)
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (report) =>
          report.title.toLowerCase().includes(query) ||
          report.description.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [reports, selectedTab, searchTerm])

  const handleSelectReport = (reportId: string) => {
    // Single selection - if clicking the same report, deselect it
    if (selectedReport === reportId) {
      onSelectionChange(null, null)
    } else {
      const selected = reports.find((r) => r.id === reportId)
      onSelectionChange(reportId, selected?.workflowName ?? null)
    }
  }

  // Get selected report details
  const selectedReportData = useMemo(() => {
    if (!selectedReport) return null
    return reports.find((r) => r.id === selectedReport)
  }, [selectedReport, reports])

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Tabs Section - At the top with scroll buttons */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex justify-center">
          <div className="w-[60%] relative">
            {/* Left Scroll Button */}
            {canScrollLeft && (
              <button
                onClick={() => scrollTabs("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
            )}

            {/* Right Scroll Button */}
            {canScrollRight && (
              <button
                onClick={() => scrollTabs("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            )}

            <div
              ref={tabsContainerRef}
              className="flex gap-1 overflow-x-auto py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              onScroll={checkScrollButtons}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors flex-shrink-0 ${
                    selectedTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar Section - Centered, 60% width */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex justify-center">
          <div className="w-[60%]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {searchLabel}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {/* Selected Value Display - Below search field */}
            {selectedReportData && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Selected Report:</p>
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedReportData.title}
                </h3>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Summary Section - Centered, 60% width, white background */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex justify-center">
          <div className="w-[60%]">
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-semibold">{filteredReports.length}</span>{" "}
              {filteredReports.length === 1 ? "result" : "results"}
              {searchTerm && (
                <>
                  {" "}
                  for <span className="font-bold">{searchTerm}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Results List Section - Centered, 60% width, gray page background */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="flex justify-center py-6 px-6">
          <div className="w-[60%] space-y-3">
            {reportsLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">Loading reports...</p>
              </div>
            ) : reportsError ? (
              <div className="text-center py-12">
                <p className="text-red-500 text-sm">
                  Error loading reports. Please try again later.
                </p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">
                  {searchTerm
                    ? "No reports found matching your search."
                    : "No reports available."}
                </p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const isSelected = selectedReport === report.id

                return (
                  <div
                    key={report.id}
                    className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                    onClick={() => handleSelectReport(report.id)}
                  >
                    {/* Small Circle - Single Select */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full transition-colors ${
                          isSelected
                            ? "bg-blue-600 border-2 border-blue-700"
                            : "bg-white border-2 border-gray-300"
                        }`}
                      />
                    </div>

                    {/* Title and Description */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        {report.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {report.description}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Save and Continue Button - Fixed at bottom */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex justify-center">
          <div className="w-[60%]">
            <Button
              onClick={() => {
                if (onSaveAndContinue) {
                  onSaveAndContinue()
                } else {
                  // Default behavior - show selected report
                  if (selectedReportData) {
                    alert(`Selected Report: ${selectedReportData.title}`)
                  } else {
                    alert("Please select a report first")
                  }
                }
              }}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!selectedReport}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

