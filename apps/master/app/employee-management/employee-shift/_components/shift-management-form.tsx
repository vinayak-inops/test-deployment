"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRouteControl } from "@/hooks/route-control/useRouteControl"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { Sidebar } from "@/components/fields/sidebar-local"
import EmployeeShiftHeader from './employee-shift-header'
import { BasicEmployeeInformationForm } from './form/basic-employee-information-form'
import StepRotation from './form/rotation/step-rotation'
import StepWeekOffs from "./form/week-off/step-week-offs"
import StepWeekOffsApplication from "./form/week-off-application/step-week-offs"

const EMPLOYEE_SHIFT_BASE = "/employee-management/employee-shift"

const EMPLOYEE_SHIFT_SIDEBAR_SECTIONS = [
  {
    title: "Employee Shift Management",
    items: [
      { id: "basic", label: "Employee Info", icon: "user-circle" },
      { id: "weekoffs", label: "Week Offs", icon: "calendar" },
      // { id: "weekoffsApplication", label: "Week Off Application", icon: "calendar" },
      { id: "rotation", label: "Rotation", icon: "clock" },
    ],
  },
]

const EMPLOYEE_SHIFT_SECTION_ORDER = ["basic", "weekoffs", "weekoffsApplication", "rotation"] as const
type SectionId = (typeof EMPLOYEE_SHIFT_SECTION_ORDER)[number]

const toIdString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  if (value && typeof value === "object" && "$oid" in (value as Record<string, unknown>)) {
    const oid = (value as { $oid?: unknown }).$oid
    if (typeof oid === "string" && oid.trim()) return oid.trim()
  }
  if (value == null) return null
  const str = String(value).trim()
  return str && str !== "[object Object]" ? str : null
}

export function ShiftManagementForm() {
  const [activeTab, setActiveTab] = useState<SectionId>("basic")
  const [tabChangeKey, setTabChangeKey] = useState(0)
  const { id: recordId, mode, goToList } = useRouteControl({ basePath: EMPLOYEE_SHIFT_BASE })
  const isEditMode = mode === "edit"
  const isViewMode = mode === "view"
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters)
  const employeeSearchUrl = "employee_shift"

  const normalizedRouteRecordId = toIdString(recordId)
  const shouldFetchById = Boolean(normalizedRouteRecordId && (mode === "edit" || mode === "view"))
  const fetchByIdRequestData = useMemo(() => {
    if (!shouldFetchById) return null
    return {
      hierarchyFilters: empHierarchyFilters ?? {},
      criteriaRequests: [
        { field: "tenantCode", operator: "eq" as const, value: tenantCode || "" },
        { field: "_id", operator: "eq" as const, value: normalizedRouteRecordId! },
      ],
      userEntitlement,
    }
  }, [shouldFetchById, normalizedRouteRecordId, tenantCode, empHierarchyFilters, userEntitlement])

  const {
    data: fetchedRecord,
    loading: isLoading,
    refetch: refetchRecord,
  } = useRequest<any[]>({
    url: `employee_shift/searchWithHierarchy?offset=0&limit=1`,
    method: "POST",
    data: fetchByIdRequestData ?? undefined,
    onSuccess: (data) => {
      // Handle success if needed
    },
    onError: (error) => {
      console.error("Error fetching employee shift data:", error)
    },
    dependencies: [fetchByIdRequestData],
  })

  const headerEmployeeId = useMemo(() => {
    const record = Array.isArray(fetchedRecord) ? fetchedRecord[0] : undefined
    return record?.employeeID ?? ""
  }, [fetchedRecord])

  useEffect(() => {
    if ((mode === "view" || mode === "edit") && normalizedRouteRecordId) {
      refetchRecord()
    }
  }, [mode, normalizedRouteRecordId])

  const handleNextTab = () => {
    const i = EMPLOYEE_SHIFT_SECTION_ORDER.indexOf(activeTab)
    if (i >= 0 && i < EMPLOYEE_SHIFT_SECTION_ORDER.length - 1) {
      setActiveTab(EMPLOYEE_SHIFT_SECTION_ORDER[i + 1])
      setTabChangeKey((key) => key + 1)
    }
  }

  const handlePreviousTab = () => {
    const i = EMPLOYEE_SHIFT_SECTION_ORDER.indexOf(activeTab)
    if (i > 0) {
      setActiveTab(EMPLOYEE_SHIFT_SECTION_ORDER[i - 1])
      setTabChangeKey((key) => key + 1)
    }
  }

  const handleTabClick = (tabValue: string) => {
    if (EMPLOYEE_SHIFT_SECTION_ORDER.includes(tabValue as SectionId)) {
      setActiveTab(tabValue as SectionId)
      setTabChangeKey((key) => key + 1)
    }
  }

  const handleBack = () => {
    goToList()
  }

  const getPageTitle = () => {
    switch (mode) {
      case "add":
        return "Add New Employee Shift"
      case "edit":
        return "Edit Employee Shift"
      case "view":
        return "View Employee Shift"
      default:
        return "Employee Shift Management"
    }
  }

  const getPageDescription = () => {
    switch (mode) {
      case "add":
        return "Add new employee shift configuration"
      case "edit":
        return "Edit existing employee shift configuration"
      case "view":
        return "View employee shift details (read-only)"
      default:
        return "Manage employee shift configurations"
    }
  }

  const showLoading = shouldFetchById && isLoading

  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading employee shift data...
          </p>
        </div>
      </div>
    )
  }

  const activeTabIndex = EMPLOYEE_SHIFT_SECTION_ORDER.indexOf(activeTab)
  const hasPreviousTab = activeTabIndex > 0
  const hasNextTab = activeTabIndex >= 0 && activeTabIndex < EMPLOYEE_SHIFT_SECTION_ORDER.length - 1
  const record = Array.isArray(fetchedRecord) ? fetchedRecord[0] : null
  const recordIdForForms = toIdString(record?._id) || normalizedRouteRecordId || null

  return (
    <div>
      <EmployeeShiftHeader
        title={getPageTitle()}
        description={getPageDescription()}
        employeeId={headerEmployeeId || undefined}
        showBackButton
        onBack={handleBack}
        canAdd={false}
      />
      <div className="space-y-0 max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Sidebar navigation */}
          <div className="sticky top-4 self-start">
            <Sidebar
              sections={EMPLOYEE_SHIFT_SIDEBAR_SECTIONS}
              activeId={activeTab}
              onItemClick={(id) => handleTabClick(id as string)}
            />
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="space-y-6 py-4">
              {activeTab === "basic" && (
                <BasicEmployeeInformationForm
                  key={`basic-${recordIdForForms}-${mode}`}
                  employeeId={headerEmployeeId || undefined}
                  recordId={recordIdForForms}
                  disabled={isViewMode}
                  tabChangeKey={tabChangeKey}
                  employeeSearchUrl={employeeSearchUrl}
                />
              )}

              {activeTab === "weekoffs" && (
                <StepWeekOffs
                  key={`weekoffs-${recordIdForForms}-${mode}`}
                  recordId={recordIdForForms}
                  onSave={refetchRecord}
                  employeeSearchUrl={employeeSearchUrl}
                  mode={isViewMode ? "view" : isEditMode ? "edit" : "add"}
                />
              )}

              {activeTab === "weekoffsApplication" && (
                <StepWeekOffsApplication
                  key={`weekoffs-application-${recordIdForForms}-${mode}`}
                  recordId={recordIdForForms}
                  onSave={refetchRecord}
                  employeeSearchUrl={employeeSearchUrl}
                  mode={isViewMode ? "view" : isEditMode ? "edit" : "add"}
                  fromDate={record?.fromDate ?? ""}
                  toDate={record?.toDate ?? ""}
                  employeeId={headerEmployeeId || ""}
                />
              )}

              {activeTab === "rotation" && (
                <StepRotation
                  key={`rotation-${recordIdForForms}-${mode}`}
                  recordId={recordIdForForms}
                  onSave={refetchRecord}
                  employeeSearchUrl={employeeSearchUrl}
                  mode={isViewMode ? "view" : isEditMode ? "edit" : "add"}
                />
              )}
            </div>

            <div className="pt-2 pb-6">
              <div className="flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousTab}
                  disabled={!hasPreviousTab}
                  className="px-3 py-1.5 h-8 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 disabled:opacity-100 disabled:text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                {hasNextTab && (
                  <Button
                    type="button"
                    onClick={handleNextTab}
                    className="px-3 py-1.5 h-8 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
