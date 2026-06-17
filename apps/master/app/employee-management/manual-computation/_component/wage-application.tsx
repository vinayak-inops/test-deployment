"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import ApplicationTable from "./wage-table"
import ShiftRequestsPopup from "./wage-popup-request"
import WageFilters from "./wage-filters"
import WageCalculationForm from "./wage-calculation-form"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import PageNotFound from "@/components/page-notfound"
import WageCalculationHeader from "./wage-calculation-header"

type WageApplicationItem = {
  _id: string
  employeeIDList?: string[]
  fromDate: string
  toDate: string
  appliedDate?: string
  remarks?: string
  workflowState: string
  status?: string
  // Role-based selection metadata
  selectAll?: boolean
  subsidiary?: {
    subsidiaryCode?: string | null
    subsidiaryName?: string | null
  }
  division?: {
    divisionCode?: string | null
    divisionName?: string | null
  }
  department?: {
    departmentCode?: string | null
    departmentName?: string | null
  }
  subDepartment?: {
    subDepartmentCode?: string | null
    subDepartmentName?: string | null
  }
  section?: {
    sectionCode?: string | null
    sectionName?: string | null
  }
  locations?: string[]
}

export default function WageApplication() {
  const tenantCode = useGetTenantCode()

  const wageCalculationApplicationScreen = "manualComputation"

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "employeeManagement",
    screenName: wageCalculationApplicationScreen,
  })

  const viewMode = rolePermissions?.view || false
  const applyMode = rolePermissions?.apply || false

  const [applications, setApplications] = useState<WageApplicationItem[]>([])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<
    "pending" | "approved" | "rejected" | "cancelled" | "failed" | "applications"
  >(
    "applications",
  )
  const [searchField, setSearchField] = useState<string>("appliedDate")
  const [searchValue, setSearchValue] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [totalCount, setTotalCount] = useState(0)
  const { employeeId } = useKeyclockRoleInfo()

  // Track previous values to detect actual changes and prevent unnecessary clears
  const prevSearchRef = useRef<{ field: string; value: string; tab: string }>({
    field: searchField,
    value: searchValue,
    tab: activeTab
  })
  const isInitialMountRef = useRef<boolean>(true)

  // Clear table and reset page when tab or search actually changes
  useEffect(() => {
    // Skip on initial mount - let initial data load
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      prevSearchRef.current = { field: searchField, value: searchValue, tab: activeTab }
      return
    }

    // Check if tab, search field, or search value actually changed
    const tabChanged = prevSearchRef.current.tab !== activeTab
    const searchFieldChanged = prevSearchRef.current.field !== searchField
    const searchValueChanged = prevSearchRef.current.value !== searchValue

    // Only clear if something actually changed
    if (tabChanged || searchFieldChanged || searchValueChanged) {
      setApplications([]) // Clear table immediately when tab/search changes
      setTotalCount(0) // Clear count
      setCurrentPage(1) // Reset to first page
      prevSearchRef.current = { field: searchField, value: searchValue, tab: activeTab }
    }
  }, [activeTab, searchValue, searchField])

  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
  const totalPages = useMemo(
    () => (totalCount > 0 ? Math.ceil(totalCount / itemsPerPage) : 1),
    [totalCount],
  )
  const startIndex = offset
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  // Build request data based on activeTab and search
  // searchValue is already debounced in wage-filters.tsx (500ms delay)
  // Backend is only called after typing stops for 500ms
  const buildRequestData = useMemo(() => {
    const trimmedSearch = searchValue.trim()
    const requestData: any[] = [
      {
        field: "tenantCode",
        value: tenantCode,
        operator: "eq",
      },
      {
        field: "createdOn",
        value: "",
        operator: "desc",
      },
      {
        field: "uploadedBy",
        value: employeeId,
        operator: "eq"
      }
    ]

    // Tab-based workflow state filtering (using like operator)
    if (activeTab === "pending") {
      requestData.push({
        field: "workflowState",
        value: "INITIATED",
        operator: "like",
      })
    } else if (activeTab === "approved") {
      requestData.push({
        field: "workflowState",
        value: "APPROVED",
        operator: "like",
      })
    } else if (activeTab === "rejected") {
      requestData.push({
        field: "workflowState",
        value: "REJECTED",
        operator: "like",
      })
    } else if (activeTab === "cancelled") {
      // Use "CANCEL" to match both "CANCELLED" and "CANCEL" with like operator
      requestData.push({
        field: "workflowState",
        value: "CANCEL",
        operator: "like",
      })
    } else if (activeTab === "failed") {
      requestData.push({
        field: "workflowState",
        value: "FAILED",
        operator: "like",
      })
    }
    // "applications" tab shows all (no workflowState filter)

    // Text search filter (like operator for all fields)
    if (trimmedSearch) {
      if (searchField === "year") {
        // Filter by year using like operator on appliedDate (format: YYYY-MM-DD)
        // User can search for "2025" and it will match dates like "2025-01-01"
        requestData.push({
          field: "appliedDate",
          operator: "like",
          value: `${trimmedSearch}-`,
        })
      } else if (searchField === "month") {
        // Filter by month using like operator on appliedDate (format: YYYY-MM-DD)
        // User can search for "01" or "1" and it will match dates like "2025-01-15" or "2025-1-15"
        const monthNum = parseInt(trimmedSearch, 10)
        if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
          // Format month as two digits (01-12) for consistent matching
          const monthStr = monthNum.toString().padStart(2, "0")
          requestData.push({
            field: "appliedDate",
            operator: "like",
            value: `-${monthStr}-`,
          })
        }
      } else if (searchField === "appliedDate") {
        // Filter by appliedDate using like operator
        requestData.push({
          field: "appliedDate",
          operator: "like",
          value: trimmedSearch,
        })
      } else if (searchField === "remarks") {
        // Filter by remarks using like operator
        requestData.push({
          field: "remarks",
          operator: "like",
          value: trimmedSearch,
        })
      } else {
        // Default: like operator for other fields (employeeID, status, etc.)
        requestData.push({
          field: searchField,
          operator: "like",
          value: trimmedSearch,
        })
      }
    }

    return requestData
  }, [activeTab, tenantCode, searchValue, searchField, employeeId])

  // Create a stable stringified version to prevent unnecessary refetches
  // This ensures useRequest hook only refetches when actual data changes, not object reference
  const buildRequestDataString = useMemo(() => JSON.stringify(buildRequestData), [buildRequestData])

  // adapt wage items to table Application shape, including month/year derived from appliedDate
  const tableData = useMemo(
    () =>
      applications.map((item) => {
        const applied = item.appliedDate ? new Date(item.appliedDate) : null
        const month = applied ? applied.getMonth() + 1 : undefined
        const year = applied ? applied.getFullYear() : undefined

        return {
          _id: item._id,
          employeeIDList: item.employeeIDList,
          fromDate: item.fromDate,
          toDate: item.toDate,
          appliedDate: item.appliedDate,
          month,
          year,
          remarks: item.remarks,
          status: item.status,
          workflowState: item.workflowState,
          // pass through role-based selection metadata so the table can render it
          selectAll: item.selectAll,
          subsidiary: item.subsidiary,
          division: item.division,
          department: item.department,
          subDepartment: item.subDepartment,
          section: item.section,
          locations: item.locations,
        }
      }),
    [applications],
  )

  const { refetch, loading: requestLoading } = useRequest<any[]>({
    url: `manualComputation/search?offset=${offset}&limit=${itemsPerPage}`,
    method: "POST",
    data: buildRequestData,
    // Use buildRequestDataString in dependencies to ensure refetch only happens when actual data changes
    // searchValue is already debounced in wage-filters.tsx (500ms), preventing calls while typing
    dependencies: [buildRequestDataString, currentPage, offset],
    onSuccess: (rows: any[]) => {
      // Handle empty array or invalid data
      if (!rows || !Array.isArray(rows)) {
        setApplications([])
        return
      }

      // Filter out empty objects (treat [{}] as [])
      const validRows = rows.filter(
        (item: any) => item && typeof item === "object" && Object.keys(item).length > 0
      )

      const mapped: WageApplicationItem[] = validRows.map((item: any) => {
        const list: string[] = Array.isArray(item.employeeIDList) ? item.employeeIDList : []
        return {
          _id: item._id || "",
          employeeIDList: list,
          fromDate: "",
          toDate: "",
          appliedDate: item.appliedDate || "",
          remarks: item.remarks || "",
          workflowState: item.workflowState || "",
          status: item.workflowState || "INITIATED",
          // role-based selection metadata
          selectAll: !!item.selectAll,
          subsidiary: item.subsidiary,
          division: item.division,
          department: item.department,
          subDepartment: item.subDepartment,
          section: item.section,
          locations: Array.isArray(item.locations) ? item.locations : [],
        }
      })
      setApplications([...mapped])
    },
    onError: () => { },
  })

  // ====== COUNT API CALLS (total + status-based) ======

  const baseCountRequestData = useMemo(
    () => [
      {
        field: "tenantCode",
        value: tenantCode,
        operator: "eq",
      },
    ],
    [tenantCode],
  )

  const { data: countData, refetch: refetchCount } = useRequest<number>({
    url: "manualComputation/count",
    method: "POST",
    data: buildRequestData,
    // Use buildRequestDataString in dependencies to ensure refetch only happens when actual data changes
    // searchValue is already debounced in wage-filters.tsx (500ms), preventing calls while typing
    dependencies: [buildRequestDataString],
    onSuccess: (val: any) => {
      const n = typeof val === "number" ? val : 0
      setTotalCount(n)
    },
  })

  const { refetch: refetchApprovedCount } = useRequest<number>({
    url: "manualComputation/count",
    method: "POST",
    data: [
      ...baseCountRequestData,
      { field: "workflowState", operator: "eq", value: "APPROVED" },
    ],
  })

  const { refetch: refetchRejectedCount } = useRequest<number>({
    url: "manualComputation/count",
    method: "POST",
    data: [
      ...baseCountRequestData,
      { field: "workflowState", operator: "eq", value: "REJECTED" },
    ],
  })

  const { refetch: refetchCancelledCount } = useRequest<number>({
    url: "manualComputation/count",
    method: "POST",
    data: [
      ...baseCountRequestData,
      { field: "workflowState", operator: "in", value: ["CANCELLED", "CANCEL"] },
    ],
  })

  // when popup closes, refresh list
  useEffect(() => {
    if (!isPopupOpen) {
      refetch?.()
      refetchCount?.()
      refetchApprovedCount?.()
      refetchRejectedCount?.()
      refetchCancelledCount?.()
    }
  }, [isPopupOpen])

  const handleOpenDetails = (row: WageApplicationItem) => {
    if (!row?._id) return
    setSelectedRequestId(row._id)
    setIsPopupOpen(true)
  }

  // Stable callback to prevent unnecessary re-renders in wage-filters.tsx
  // This receives debounced values from wage-filters.tsx (500ms after typing stops)
  const handleApply = useCallback(({ field, value }: { field: string; value: string }) => {
    setSearchField(field)
    setSearchValue(value)
  }, [])

  const handleTabChange = useCallback((tab: "pending" | "approved" | "rejected" | "cancelled" | "failed" | "applications") => {
    setActiveTab(tab)
  }, [])

  const handleOpenForm = useCallback(() => {
    setIsFormOpen(true)
  }, [])

  const handleFormSubmit = useCallback(async (data: any) => {
    // Handle form submission - refresh the table after successful submission
    try {
      // The form component handles the API call
      // Here we refresh all data including counts
      await refetch?.()
      await refetchCount?.()
      await refetchApprovedCount?.()
      await refetchRejectedCount?.()
      await refetchCancelledCount?.()
      return true
    } catch (error) {
      console.error("Error submitting form:", error)
      return false
    }
  }, [refetch, refetchCount, refetchApprovedCount, refetchRejectedCount, refetchCancelledCount])

  // If user has no permissions for this screen, show 404-style page
  if (!viewMode) {
    return <PageNotFound />
  }

  return (
    <>
      <div className="px-12">
        <WageCalculationHeader title="Manual Computation" description="Manage and track manual computation" />
      </div>
      <div className="mx-auto max-w-7xl space-y-4 mt-4">
        <WageFilters
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onApply={handleApply}
          onOpenForm={handleOpenForm}
          applyMode={applyMode}
        />

        <ApplicationTable
          data={tableData}
          onOpenDetails={handleOpenDetails}
          isLoading={requestLoading}
          externalPagination={{
            currentPage,
            totalPages,
            totalItems: totalCount,
            itemsPerPage,
            startIndex,
            endIndex,
            onPageChange: setCurrentPage,
          }}
        />


      </div>
        <WageCalculationForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
        />
      
      <ShiftRequestsPopup
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          selectedRequestId={selectedRequestId}
          initialSelectedRequest={null}
        />
    </>
  )
}
