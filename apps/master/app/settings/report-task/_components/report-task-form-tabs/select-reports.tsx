"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, AlertTriangle } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

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

// Direct report item from API (no nested options array)
export interface ReportItemFromAPI {
  _id: string
  scheduler_name: string
  description: string
  category?: string  // Make optional if not provided in API
  workflowName?: string  // Make optional if not provided in API
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

// Convert API reports to ReportItem format
export const convertAPIReportsToItems = (apiReports: ReportItemFromAPI[]): ReportItem[] => {
  return apiReports.map((report) => ({
    id: report._id,
    title: report.scheduler_name,
    description: report.description || "",
    category: mapCategoryToReportCategory(report.category || "other"),
    workflowName: report.workflowName || report.scheduler_name, // Fallback to scheduler_name if workflowName not provided
  }))
}

interface SelectReportsProps {
  selectedReport: string | null
  onSelectionChange: (selectedId: string | null, workflowName?: string | null, reportTitle?: string | null) => void
  onSaveAndContinue?: () => void
  searchLabel?: string
  searchPlaceholder?: string
  reportSchedulerName?: string
  onReportSchedulerNameChange?: (value: string) => void
  showValidationErrors?: boolean
  viewMode?: boolean
}

export function SelectReports({
  selectedReport,
  onSelectionChange,
  onSaveAndContinue,
  searchLabel = "Search by Schedule Title",
  searchPlaceholder = "Schedule title, category, or keyword",
  reportSchedulerName = "",
  onReportSchedulerNameChange,
  showValidationErrors = false,
  viewMode = false,
}: SelectReportsProps) {
  const tenantCode = useGetTenantCode()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTab, setSelectedTab] = useState<ReportCategory>("all")
  const [localShowErrors, setLocalShowErrors] = useState(false)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Determine if we should show errors
  const shouldShowErrors = showValidationErrors || localShowErrors

  // Validation checks
  const isReportSchedulerNameValid = reportSchedulerName.trim() !== ""
  const isReportSelected = selectedReport !== null
  const isFormValid = isReportSchedulerNameValid && isReportSelected

  // Fetch reports directly (array of reports, not wrapped in config)
  const {
    data: reportsData,
    loading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useRequest<ReportItemFromAPI[]>({
    url: 'scheduler_configurations/search',
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
    if (tenantCode) {
      refetchReports()
    }
  }, [tenantCode])

  // Convert fetched data to ReportItem format
  const reports: ReportItem[] = useMemo(() => {
    if (!reportsData || !Array.isArray(reportsData) || reportsData.length === 0) {
      return []
    }
    
    return convertAPIReportsToItems(reportsData)
  }, [reportsData])

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
    if (viewMode) return
    // Clear errors when user interacts
    setLocalShowErrors(false)
    
    // Single selection - if clicking the same report, deselect it
    if (selectedReport === reportId) {
      onSelectionChange(null, null, null)
    } else {
      const selected = reports.find((r) => r.id === reportId)
      onSelectionChange(reportId, selected?.workflowName ?? null, selected?.title ?? null)
    }
  }

  const handleSchedulerNameChange = (value: string) => {
    if (viewMode) return
    // Clear errors when user types
    setLocalShowErrors(false)
    onReportSchedulerNameChange?.(value)
  }

  const handleContinue = () => {
    if (viewMode) return
    // Show validation errors
    setLocalShowErrors(true)
    
    // Check if both fields are valid
    if (isReportSchedulerNameValid && isReportSelected) {
      onSaveAndContinue?.()
    }
  }

  // Get selected report details
  const selectedReportData = useMemo(() => {
    if (!selectedReport) return null
    return reports.find((r) => r.id === selectedReport)
  }, [selectedReport, reports])

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Search Bar Section - Centered, 60% width */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex justify-center">
          <div className="w-[60%]">
            {/* Report Scheduler Name Input Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Scheduler Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reportSchedulerName}
                onChange={(e) => handleSchedulerNameChange(e.target.value)}
                disabled={viewMode}
                placeholder="Enter report scheduler name"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-colors
                  ${shouldShowErrors && !isReportSchedulerNameValid 
                    ? "border-red-500 bg-red-50" 
                    : "border-gray-300"
                  }`}
              />
              {/* Error message below the field */}
              {shouldShowErrors && !isReportSchedulerNameValid && (
                <p className="mt-1.5 text-sm text-red-600">
                  Report scheduler name is required
                </p>
              )}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              {searchLabel}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={viewMode}
                placeholder={searchPlaceholder}
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            {/* Selected Value Display - Below search field */}
            {selectedReportData && (
              <div className={`mt-3 p-4 border rounded-lg transition-colors
                ${shouldShowErrors && !isReportSelected 
                  ? "bg-red-50 border-red-500" 
                  : "bg-blue-50 border-blue-200"
                }`}
              >
                <p className="text-xs text-gray-600 mb-2">Selected Report:</p>
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedReportData.title}
                </h3>
              </div>
            )}

            {/* Error message for report selection */}
            {shouldShowErrors && !isReportSelected && (
              <p className="mt-2 text-sm text-red-600">
                Please select a report
              </p>
            )}

            {/* Show error message when no report is selected and no selected display */}
            {shouldShowErrors && !isReportSelected && !selectedReportData && (
              <div className="mt-3 p-4 border border-red-500 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">
                  Please select a report to continue
                </p>
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
                    ? "No schedules found matching your search."
                    : "No schedules available."}
                </p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const isSelected = selectedReport === report.id

                return (
                  <div
                    key={report.id}
                    className={`flex items-start gap-4 p-4 bg-white border rounded-lg hover:border-gray-300 transition-colors cursor-pointer
                      ${shouldShowErrors && !isReportSelected && !selectedReport && isSelected
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                      }`}
                    onClick={() => {
                      if (viewMode) return
                      handleSelectReport(report.id)
                    }}
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
          <div className="w-[60%] space-y-3">
            {!isFormValid && shouldShowErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs font-medium text-red-900">
                    Enter scheduler name and select one report to continue
                  </p>
                </div>
              </div>
            )}
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!isFormValid || viewMode}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {viewMode ? "View Only" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
