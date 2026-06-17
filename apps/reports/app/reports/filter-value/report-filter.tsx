"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Search, X, ArrowRight, FileText, Filter, Calendar } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

interface ReportOption {
  value: string
  label: string
  category: string
  workflowName: string
}

interface ReportData {
  _id: { $oid: string }
  tenant: string
  options: ReportOption[]
  isActive: boolean
  isDeleted: boolean
  organiationCode: string
  tenantCode: string
  createdBy: string
  createdOn: string
  _class: string
  organizationCode: string
}

export default function ReportFilter() {
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("All")
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const tenantCode = useGetTenantCode()

  // Mock data - replace with actual API call
  useEffect(() => {
    // Simulate API call
    const mockData: ReportData = {
      "_id": { "$oid": "6827076ad74e6f59df5f2166" },
      "tenant": "680dc7e597f5e14f856dba92",
      "options": [
        {
          "value": `${tenantCode}AttendanceReport`,
          "label": `${tenantCode} Attendance Details Report`,
          "category": "Attendance",
          "workflowName": "Report"
        },
        {
          "value": "attendanceReport",
          "label": "Attendance Details Report",
          "category": "Attendance",
          "workflowName": "Report"
        },
        {
          "value": "absenteesmReport",
          "label": "Absenteesm Report",
          "category": "Attendance",
          "workflowName": "Report"
        },
        {
          "value": "continuousAbsenteesimReport",
          "label": "Continuous Absenteesm Report",
          "category": "Attendance",
          "workflowName": "Report"
        },
        {
          "value": "lateInReport",
          "label": "LateIn Report",
          "category": "Attendance",
          "workflowName": "Report"
        },
        {
          "value": "earlyOutReport",
          "label": "EarlyOut Report",
          "category": "Attendance",
          "workflowName": "Report"
        },
        {
          "value": `${tenantCode}ShiftReport`,
          "label": `${tenantCode} Shift Details Report`,
          "category": "Shift",
          "workflowName": "Report"
        },
        {
          "value": "extraHoursReport",
          "label": "ExtraHours Report",
          "category": "Attendance",
          "workflowName": "Report"
        },
        {
          "value": "AllPunches",
          "label": "All Swipe Report",
          "category": "Attendance",
          "workflowName": "Report"
        },
        {
          "value": "shiftReport",
          "label": "Employee Shift Report",
          "category": "Shift",
          "workflowName": "Report"
        },
        {
          "value": "lateIn_EarlyOutReport",
          "label": "LateIn/EarlyOut Report",
          "category": "Attendance",
          "workflowName": "Report"
        },
        {
          "value": "dailySummary",
          "label": "Daily Summary Report",
          "category": "Attendance",
          "workflowName": "Report"
        },
        {
          "value": "liveHeadCount",
          "label": "Live Head Report",
          "category": "Attendance",
          "workflowName": "Live HeadCount Report"
        },
        {
          "value": "contractEmployeeReport",
          "label": "Contract Employee Report",
          "category": "Contractor Employee",
          "workflowName": "Employee Report"
        },
        {
          "value": "accidentRegister",
          "label": "Contract Employee Accident Report",
          "category": "Contractor Employee",
          "workflowName": "Employee Report"
        },
        {
          "value": "employeeSecurityPass",
          "label": "Employee SecurityPass Report",
          "category": "Contractor Employee",
          "workflowName": "Employee Report"
        },
        {
          "value": "securityPassExpiry",
          "label": "SecurityPass Expiry Report",
          "category": "Contractor Employee",
          "workflowName": "Report"
        },
        {
          "value": "contractorRegistry",
          "label": "Contractor Report",
          "category": "Contractor",
          "workflowName": "Contractor Report"
        },
        {
          "value": "contractorWorkOrder",
          "label": "Contractor WorkOrder Report",
          "category": "Contractor",
          "workflowName": "Contractor Report"
        }
      ],
      "isActive": true,
      "isDeleted": false,
      "organiationCode": "",
      "tenantCode": "",
      "createdBy": "00000000040",
      "createdOn": "2025-05-16T15:07:38.880828400",
      "_class": "com.inops.visitorpass.collection.TenantReportConfiguration",
      "organizationCode": ""
    }
    setReportData(mockData)
  }, [])

  // Get unique categories for tabs
  const categories = reportData ? ["All", ...Array.from(new Set(reportData.options.map(option => option.category)))] : ["All"]

  // Filter reports based on active tab and search query
  const filteredReports = reportData?.options.filter(option => {
    const matchesTab = activeTab === "All" || option.category === activeTab
    const matchesSearch = option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         option.value.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  }) || []

  // Handle report selection
  const handleReportSelect = (report: ReportOption) => {
    setSelectedReport(report.value)
    setSearchQuery(report.label)
    setIsDropdownOpen(false)
  }

  // Handle save and continue
  const handleSaveAndContinue = () => {
    // Add your save logic here
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.report-dropdown')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get selected report label for display
  const selectedReportLabel = reportData?.options.find(option => option.value === selectedReport)?.label || ""

  return (
    <Card className="border-0 bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Report Selection</h2>
              <p className="text-sm text-gray-600">Select a report for generation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {filteredReports.length} reports available
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveTab(category)
                    setSearchQuery("")
                    setSelectedReport("")
                  }}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === category
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Report Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="reportSearch" className="text-sm font-medium text-gray-700">
                Select Reports <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="h-4 w-4" />
                {activeTab} reports
              </div>
            </div>
            
            {/* Enhanced Search and Select Input */}
            <div className="relative report-dropdown">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="reportSearch"
                  type="text"
                  placeholder="Select an option..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="pl-10 h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-200 text-base"
                />
                <div 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <svg 
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Enhanced Dropdown Results */}
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                  {filteredReports.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {searchQuery
                        ? 'No reports found matching your criteria'
                        : 'No reports available in this category'
                      }
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600 uppercase tracking-wide">
                        {filteredReports.length} report(s) found
                      </div>
                      {filteredReports.map((report) => (
                        <div
                          key={report.value}
                          onClick={() => handleReportSelect(report)}
                          className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 text-base">{report.label}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Category: {report.category} • {report.workflowName}
                              </div>
                            </div>
                            {selectedReport === report.value && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs px-2 py-1 bg-green-100 text-green-800"
                              >
                                Selected
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Selected Report Display */}
            {selectedReport && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-blue-900 text-base">{selectedReportLabel}</div>
                    <div className="text-sm text-blue-700 mt-1">Value: {selectedReport}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReport("")
                      setSearchQuery("")
                    }}
                    className="ml-2 p-1 hover:bg-blue-200 rounded-full transition-colors group"
                    title="Clear selection"
                  >
                    <X className="h-4 w-4 text-blue-600 group-hover:text-blue-800" />
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Status Information */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              <div className={`w-3 h-3 rounded-full ${selectedReport ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  {selectedReport 
                    ? 'Report selected successfully' 
                    : 'Please select a report to continue'
                  }
                </span>
                {selectedReport && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ready to generate the selected report
                  </p>
                )}
              </div>
              {selectedReport && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">Selected</div>
                  <div className="text-lg font-bold text-blue-600">✓</div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Last updated: {new Date().toLocaleDateString()}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedReport("")
                  setActiveTab("All")
                }}
                className="px-4 py-2.5 h-11 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Reset
              </Button>
              
              <Button
                onClick={handleSaveAndContinue}
                disabled={!selectedReport}
                className="px-8 py-2.5 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Save & Continue
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
