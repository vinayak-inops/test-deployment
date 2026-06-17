"use client"

import { X } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useSession } from "next-auth/react"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken"
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import { StepIndicator } from "./step-indicator"
import { TableFilterSection } from "./table-filter-section"
import { SelectReports } from "./select-reports"
import { BasicInformation } from "./basic-information"
import { TableType, TableMenuItem } from "./types"

interface ReportPopupProps {
  isOpen: boolean
  onClose: () => void
  tableMenuItems: TableMenuItem[]
  onReset: () => void
  onFilterDataChange?: (filterData: Record<TableType, string[]>) => void
}

export function ReportPopup({ isOpen, onClose, tableMenuItems, onReset, onFilterDataChange }: ReportPopupProps) {
  const { data: session } = useSession()
  const { employeeId } = useKeyclockRoleInfo()
  const tenantCode = useGetTenantCode()
  const { token } = useAuthToken()
  const router = useRouter()
  
  // Loading and error states for submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Track current step in the process
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Track which step label to show (only the clicked step's label)
  const [visibleStepLabel, setVisibleStepLabel] = useState<number | null>(null)

  // Selected report for step 1 (single selection) - stores reportName
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [selectedWorkflowName, setSelectedWorkflowName] = useState<string | null>(null)

  // Step 3: Basic Information state
  const [extension, setExtension] = useState<string>("excel")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const [period, setPeriod] = useState<string>("")
  const [reportTitle, setReportTitle] = useState<string>("")
  const [reportDescription, setReportDescription] = useState<string>("")

  // Store filter data from TableFilterSection for final submission
  const [filterData, setFilterData] = useState<Record<TableType, string[]>>({
    subsidiaries: [],
    divisions: [],
    departments: [],
    subDepartments: [],
    sections: [],
    designations: [],
    grades: [],
    employeeCategories: [],
    locations: [],
    contractors: [],
    workOrders: [],
    shiftGroups: [],
    shifts: [],
    contractEmployees: [],
  })

  // Reset all state for a fresh popup start
  const resetAllState = () => {
    setCurrentStep(1)
    setVisibleStepLabel(null)
    setSelectedReport(null)
    setExtension("excel")
    setFromDate("")
    setToDate("")
    setPeriod("")
    setReportTitle("")
    setReportDescription("")
    const emptyFilterData = {
      subsidiaries: [],
      divisions: [],
      departments: [],
      subDepartments: [],
      sections: [],
      designations: [],
      grades: [],
      employeeCategories: [],
      locations: [],
      contractors: [],
      workOrders: [],
      shiftGroups: [],
      shifts: [],
      contractEmployees: [],
    }
    setFilterData(emptyFilterData)
    onFilterDataChange?.(emptyFilterData)
    onReset()
  }

  // Calculate completed steps
  const completedSteps = useMemo(() => {
    const completed: number[] = []

    // Step 1 is completed when a report is selected
    if (selectedReport) {
      completed.push(1)
    }

    // Step 2 is completed when user has navigated to step 3 or has filter data
    const hasFilterData = Object.values(filterData).some(arr => arr && arr.length > 0)
    if (currentStep >= 3 || hasFilterData) {
      completed.push(2)
    }

    return completed
  }, [selectedReport, currentStep, filterData])

  const handleClose = () => {
    resetAllState()
    onClose()
  }

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      resetAllState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const handleSubmit = async () => {
    if (!token) {
      setSubmitError("Authentication token is not available")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Combine all data into final JSON structure
      const finalData = {
        report: "",
        tenantCode: tenantCode || "",
        organization: tenantCode || "",
        uploadedBy: session?.user?.name || "",
        createdOn: new Date().toISOString(),
        reportName: selectedReport || "",
        subsidiaries: filterData.subsidiaries || [],
        divisions: filterData.divisions || [],
        location: filterData.locations || [],
        designations: filterData.designations || [],
        grades: filterData.grades || [],
        departments: filterData.departments || [],
        subDepartments: filterData.subDepartments || [],
        sections: filterData.sections || [],
        employeeCategories: filterData.employeeCategories || [],
        contractor: filterData.contractors || [],
        workOrderNumber: filterData.workOrders || [],
        shiftGroups: filterData.shiftGroups || [],
        shifts: filterData.shifts || [],
        extension: extension,
        toDate: toDate,
        fromDate: fromDate,
        period: period,
        reportTitle: reportTitle,
        reportDescription: reportDescription,
        workflowName: selectedWorkflowName || "Report",
        employeeId: employeeId || "",
        level: 1,
        employeeID: filterData.contractEmployees || [],
      }

      // POST to reports collection
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/command/attendance/reports`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tenant: tenantCode || "",
            action: "insert",
            id: null,
            collectionName: "reports",
            event: "reportGeneration",
            data: finalData,
          }),
        }
      )

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to submit report")
      }

      // Extract _id from response (response is an array like [{_id: ""}])
      let reportId: string | null = null
      if (Array.isArray(responseData) && responseData.length > 0 && responseData[0]?._id) {
        reportId = responseData[0]._id
      } else if (responseData?._id) {
        // Handle case where response is a single object
        reportId = responseData._id
      }

      // Success - redirect to report view if _id is available
      if (reportId && employeeId) {
        const encryptedData = encryptEmployeeData({ employeeId: employeeId, _id: reportId })
        router.push(`/reports?mode=all&id=${encryptedData}`)
        handleClose()
      } else {
        // Fallback: show success message and close popup if no _id
        alert("Report submitted successfully!")
        handleClose()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setSubmitError(errorMessage)
      console.error("Error submitting report:", error)
      alert(`Failed to submit report: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Memoize the filter data change handler to prevent infinite loops
  const handleFilterDataChange = useCallback((data: Record<TableType, string[]>) => {
    setFilterData(data)
    onFilterDataChange?.(data)
  }, [onFilterDataChange])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Popup Panel - Contains Sidebar and Tables */}
      <aside className="fixed right-0 top-0 h-screen w-2/3 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out">
        {/* Close Button - Top Right */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-4 right-4 h-8 w-8 z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Main Content - Split Layout */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Step Indicator Component */}
          <StepIndicator
            currentStep={currentStep}
            visibleStepLabel={visibleStepLabel}
            completedSteps={completedSteps}
            onStepChange={(step) => {
              setCurrentStep(step)
            }}
            onStepLabelToggle={(step) => setVisibleStepLabel(visibleStepLabel === step ? null : step)}
            onStepLabelClose={() => setVisibleStepLabel(null)}
          />

          {/* Step 1: Select Reports */}
          {currentStep === 1 && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <SelectReports
                selectedReport={selectedReport}
                onSelectionChange={(id, workflowName) => {
                  setSelectedReport(id)
                  setSelectedWorkflowName(workflowName ?? null)
                }}
                onSaveAndContinue={() => {
                  if (selectedReport) {
                    setCurrentStep(2)
                  }
                }}
                searchLabel="Search by Report Title"
                searchPlaceholder="Report title, category, or keyword"
              />
            </div>
          )}

          {/* Step 2: Basic Filter (Table Selection) */}
          {currentStep === 2 && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <TableFilterSection
                tableMenuItems={tableMenuItems}
                onSaveAndContinue={() => {
                  setCurrentStep(3)
                }}
                onFilterDataChange={handleFilterDataChange}
                filterData={filterData}
              />
            </div>
          )}

          {/* Step 3: Basic Information */}
          {currentStep === 3 && (
            <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
              <BasicInformation
                extension={extension}
                fromDate={fromDate}
                toDate={toDate}
                period={period}
                reportTitle={reportTitle}
                reportDescription={reportDescription}
                onExtensionChange={setExtension}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                onPeriodChange={setPeriod}
                onReportTitleChange={setReportTitle}
                onReportDescriptionChange={setReportDescription}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

