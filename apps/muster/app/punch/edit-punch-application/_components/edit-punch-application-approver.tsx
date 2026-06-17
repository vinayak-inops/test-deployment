"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { Clock } from "lucide-react"
import ApplicationTable from "./application-table"
import ApplicationFilters from "./application-filters"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import EditPunchRequestsPopup from "./edit-punch-requests-popup"
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"

interface EditPunchApplicationApproverProps {
  isApprovalPermission?: boolean
}

export default function EditPunchApplicationApprover({
  isApprovalPermission = false,
}: EditPunchApplicationApproverProps) {
  const [punchApplications, setPunchApplications] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected" | "cancelled" | "failed">("pending")
  const [searchField, setSearchField] = useState<string>("employeeID")
  const [searchValue, setSearchValue] = useState<string>("")
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>("")
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const itemsPerPage = 5
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const tenantCode = useGetTenantCode()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

  const getCookie = (name: string): string | undefined => {
    if (typeof window === "undefined") return undefined
    const cookies = document.cookie.split(";")
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.startsWith(name + "=")) {
        const value = cookie.substring(name.length + 1)
        try {
          return decodeURIComponent(value)
        } catch {
          return value
        }
      }
    }
    return undefined
  }

  const storedRoleInfo = useMemo(() => {
    try {
      const keyclockroleinfo = getCookie("keyclockroleinfo")
      if (keyclockroleinfo) {
        return JSON.parse(keyclockroleinfo)
      }
    } catch {
      // ignore
    }
    return null as any
  }, [])

  const employeeId = loginEmployeeId || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || ""

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "editPunchApplication",
  })
  const { responseData: roleApprover } = useRolePermissions({
    serviceName: "applicationApprover",
    screenName: "editPunchApplication",
  })

  const canApprove = !!rolePermissions?.approve || !!roleApprover?.approve
  const canReject = !!rolePermissions?.reject || !!roleApprover?.reject
  const canCancel = !!rolePermissions?.cancel || !!roleApprover?.cancel

  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
  const limit = itemsPerPage

  const collectionName = useMemo(() => {
    if (activeTab === 'cancelled' || activeTab === 'rejected' || activeTab === 'approved') {
      return 'editPunchApplicationTransaction'
    }
    return 'editPunchApplication'
  }, [activeTab])

  // Debounce search value
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchValue(searchValue)
      setCurrentPage(1)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchValue])

  // Reset page on tab or search field change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchField])

  const buildRequestData = useMemo(() => {
    const trimmedSearch = debouncedSearchValue.trim()
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
    ]

    // For pending tab: filter by approverID (records assigned to this approver)
    if (activeTab === "pending" && employeeId) {
      requestData.push({
        field: "approverID",
        value: employeeId,
        operator: "eq",
      })
    }

    // For failed tab: workflowState FAILED + approverID
    if (activeTab === "failed" && employeeId) {
      requestData.push({
        field: "workflowState",
        value: "FAILED",
        operator: "like",
      })
      requestData.push({
        field: "approverID",
        value: employeeId,
        operator: "eq",
      })
    }

    // For approved tab: filter by approvedBy
    if (activeTab === "approved" && employeeId) {
      requestData.push({ field: "approvedBy", value: employeeId, operator: "eq" })
      requestData.push({ field: "workflowState", value: "APPROVED", operator: "eq" })
    }

    // For rejected tab: filter by rejectedBy
    if (activeTab === "rejected" && employeeId) {
      requestData.push({ field: "rejectedBy", value: employeeId, operator: "eq" })
      requestData.push({ field: "workflowState", value: "REJECTED", operator: "eq" })
    }

    // For cancelled tab: filter by cancelledBy
    if (activeTab === "cancelled" && employeeId) {
      requestData.push({ field: "cancelledBy", value: employeeId, operator: "eq" })
      requestData.push({
        field: "workflowState",
        value: ["CANCELLED", "CANCEL"],
        operator: "in",
      })
    }

    if (trimmedSearch) {
      requestData.push({
        field: searchField,
        operator: "like",
        value: trimmedSearch,
      })
    }

    return requestData
  }, [activeTab, tenantCode, employeeId, canApprove, canReject, canCancel, debouncedSearchValue, searchField])

  const { loading: countLoading, refetch: refetchCount } = useRequest<any>({
    url: `${collectionName}/count`,
    method: "POST",
    data: buildRequestData,
    onSuccess: (data: any) => {
      const normalizedCount =
        typeof data === "number"
          ? data
          : typeof data?.count === "number"
            ? data.count
            : typeof data?.total === "number"
              ? data.total
              : 0
      setTotalCount(normalizedCount)
    },
    onError: (error: any) => {
      console.error("Error fetching edit punch approver count:", error)
    },
  })

  const { loading, refetch } = useRequest<any[]>({
    url: `${collectionName}/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: buildRequestData,
    onSuccess: (data: any) => {
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
            ? data.items
            : []

      const active = rows
        .filter((item: any) => item?.isDeleted !== true)
        .filter((item: any) => item && Object.keys(item).length > 0 && item._id)

      const updatedData = active.map((item: any) => ({
        _id: item._id || "",
        employeeID: item.employeeID || "",
        punchedTime: item.punchedTime || "",
        transactionTime: item.transactionTime || "",
        inOut: item.inOut || "",
        typeOfMovement: item.typeOfMovement || "",
        newAttendanceDate: item.newAttendanceDate || "",
        attendanceDate: item.attendanceDate || "",
        remarks: item.remarks || "",
        workflowState: item.workflowState || "",
        status: item.workflowState || "INITIATED",
      }))

      setPunchApplications(updatedData)
    },
    onError: (error: any) => {
      console.error("Error loading edit punch approver applications:", error)
    },
  })

  const refreshAll = useCallback(() => {
    refetch()
    refetchCount()
  }, [refetch, refetchCount])

  useEffect(() => {
    refetch()
    refetchCount()
  }, [isPopupOpen, isFormOpen])

  useEffect(() => {
    refetch()
    refetchCount()
  }, [activeTab, employeeId, canApprove, canReject, canCancel, debouncedSearchValue, searchField, currentPage])

  const handleOpenDetails = useCallback((row: any) => {
    if (!row?._id) return
    setSelectedRequestId(row._id)
    setIsPopupOpen(true)
  }, [])

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  if (!isApprovalPermission) return null

  return (
    <div>
      <div className="px-0 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-600" />
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight">
            Edit Punch Approver Dashboard
          </h1>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Review and manage edit punch applications assigned to you for approval
        </p>
      </div>

      <ApplicationFilters
        activeTab={activeTab}
        tabs={[
          { key: "pending", label: "Pending", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400", hoverBg: "border-blue-400", hoverText: "hover:text-blue-700" },
          { key: "approved", label: "Approved", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400", hoverBg: "border-blue-400", hoverText: "hover:text-blue-700" },
          { key: "cancelled", label: "Cancelled", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400", hoverBg: "border-blue-400", hoverText: "hover:text-blue-700" },
          { key: "rejected", label: "Rejected", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400", hoverBg: "border-blue-400", hoverText: "hover:text-blue-700" },
          { key: "failed", label: "Failed", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400", hoverBg: "border-blue-400", hoverText: "hover:text-blue-700" },
        ]}
        onTabChange={setActiveTab}
        searchField={searchField}
        searchValue={searchValue}
        onSearchFieldChange={setSearchField}
        onSearchValueChange={setSearchValue}
      />

      <ApplicationTable
        data={punchApplications}
        loading={loading || countLoading}
        searchValue={searchValue}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalCount}
        onPageChange={setCurrentPage}
        onOpenDetails={handleOpenDetails}
      />

      <EditPunchRequestsPopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false)
          setSelectedRequestId(null)
        }}
        selectedRequestId={selectedRequestId}
        onActionSuccess={refreshAll}
        modeOfRequest="applicationApprover"
      />
    </div>
  )
}
