"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import EmployeeTrainingCompletionTable from "./employee-training-completion-table"
import EmployeeTrainingCompletionHeader from "./employee-training-completion-header"
import EmployeeTrainingCompletionFilterBar from "./employee-training-completion-filter-bar"
import AddContractEmployeeTrainingPopup from "./add-contract-employee-training-popup"
import { useRouter } from "next/navigation"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"

type EmployeeTrainingCompletionItem = {
  _id: string
  employeeID: string
  trainingsCompleted?: string[]
  organizationCode?: string
  tenantCode?: string
}

export default function EmployeeTrainingCompletionApplication() {
  const tenantCode = useGetTenantCode()
  const router = useRouter()

  // Role permissions
  const screenName = "employeeTrainingCompletion"
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "employeeManagement",
    screenName,
  })

  const viewMode = rolePermissions?.view || false
  const editMode = rolePermissions?.edit || false
  const addMode = rolePermissions?.add || false
  const deleteMode = rolePermissions?.delete || false

  const [records, setRecords] = useState<EmployeeTrainingCompletionItem[]>([])
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const [searchField, setSearchField] = useState<string>("employeeID")
  const [searchValue, setSearchValue] = useState<string>("")
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [totalCount, setTotalCount] = useState(0)

  // Debounce search value - update after 500ms of no typing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchValue(searchValue)
    }, 500) // 500ms debounce delay

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchValue])

  // Define search fields
  const searchFields = [
    { value: "employeeID", label: "Employee ID" },
    { value: "trainingsCompleted", label: "Training Code" },
  ]

  // Track previous values to detect actual changes and prevent unnecessary clears
  const prevSearchRef = useRef<{ field: string; value: string }>({
    field: searchField,
    value: debouncedSearchValue,
  })
  const isInitialMountRef = useRef<boolean>(true)

  // Clear table and reset page when debounced search or field changes
  useEffect(() => {
    // Skip on initial mount - let initial data load
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false
      prevSearchRef.current = { field: searchField, value: debouncedSearchValue }
      return
    }

    // Check if search field or debounced search value changed
    const searchFieldChanged = prevSearchRef.current.field !== searchField
    const searchValueChanged = prevSearchRef.current.value !== debouncedSearchValue

    // Only clear if something actually changed
    if (searchFieldChanged || searchValueChanged) {
      setRecords([]) // Clear table immediately when search changes
      setTotalCount(0) // Clear count
      setCurrentPage(1) // Reset to first page
      prevSearchRef.current = { field: searchField, value: debouncedSearchValue }
    }
  }, [debouncedSearchValue, searchField])

  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
  const totalPages = useMemo(
    () => (totalCount > 0 ? Math.ceil(totalCount / itemsPerPage) : 1),
    [totalCount],
  )
  const startIndex = offset
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  // Build request data based on debounced search - automatically applies when search value exists
  const buildRequestData = useMemo(() => {
    const trimmedSearch = debouncedSearchValue.trim()
    const requestData: any[] = [
      {
        field: "tenantCode",
        value: tenantCode,
        operator: "is",
      },
      {
        field: "createdOn",
        value: "",
        operator: "desc"
      },
    ]

    // Text search filter - automatically apply when search value exists (non-empty)
    if (trimmedSearch) {
      // Array fields (trainingsCompleted): use "in" operator to check if search value exists in the array
      if (searchField === "trainingsCompleted") {
        // Use "in" operator for array fields - checks if the value exists in the array
        requestData.push({
          field: searchField,
          operator: "in",
          value: [trimmedSearch], // Array format for "in" operator
        })
      } else {
        // String fields (employeeID): use "like" operator for partial matching
        requestData.push({
          field: searchField,
          operator: "like",
          value: trimmedSearch,
        })
      }
    }

    return requestData
  }, [tenantCode, debouncedSearchValue, searchField])

  // Create a stable stringified version to prevent unnecessary refetches
  const buildRequestDataString = useMemo(() => JSON.stringify(buildRequestData), [buildRequestData])

  // Track if search value is empty to prevent unnecessary API calls
  const hasSearchValue = useMemo(() => {
    return debouncedSearchValue.trim().length > 0
  }, [debouncedSearchValue])

  // Track initial mount to allow initial data load
  const initialLoadDoneRef = useRef<boolean>(false)
  
  // Only trigger API calls when:
  // 1. Initial mount (hasn't loaded yet)
  // 2. Search value exists (not empty)
  // 3. Search field or page changes
  const shouldFetch = useMemo(() => {
    if (!initialLoadDoneRef.current) {
      return true // Allow initial load
    }
    return hasSearchValue // Only fetch if search value exists
  }, [hasSearchValue])

  // Map API data to table format
  const tableData = useMemo(
    () =>
      records.map((item) => ({
        _id: item._id,
        employeeID: item.employeeID,
        trainingsCompleted: item.trainingsCompleted || [],
        organizationCode: item.organizationCode,
        tenantCode: item.tenantCode,
      })),
    [records],
  )

  const { refetch, loading: requestLoading } = useRequest<any[]>({
    url: `employee_training_completion/search?offset=${offset}&limit=${itemsPerPage}`,
    method: "POST",
    data: buildRequestData,
    dependencies: shouldFetch ? [buildRequestDataString, currentPage, offset] : [], // Only add dependencies if should fetch
    onSuccess: (rows: any[]) => {
      // Mark initial load as done
      if (!initialLoadDoneRef.current) {
        initialLoadDoneRef.current = true
      }

      // Handle empty array or invalid data
      if (!rows || !Array.isArray(rows)) {
        setRecords([])
        return
      }

      // Filter out empty objects (treat [{}] as [])
      const validRows = rows.filter(
        (item: any) => item && typeof item === "object" && Object.keys(item).length > 0
      )

      const mapped: EmployeeTrainingCompletionItem[] = validRows.map((item: any) => ({
        _id: item._id || "",
        employeeID: item.employeeID || "",
        trainingsCompleted: Array.isArray(item.trainingsCompleted) ? item.trainingsCompleted : [],
        organizationCode: item.organizationCode || "",
        tenantCode: item.tenantCode || "",
      }))
      setRecords([...mapped])
    },
    onError: () => {
      // Mark initial load as done even on error
      if (!initialLoadDoneRef.current) {
        initialLoadDoneRef.current = true
      }
    },
  })

  // Count API call - only when should fetch
  const { refetch: refetchCount } = useRequest<number>({
    url: "employee_training_completion/count",
    method: "POST",
    data: buildRequestData,
    dependencies: shouldFetch ? [buildRequestDataString] : [], // Only add dependencies if should fetch
    onSuccess: (val: any) => {
      const n = typeof val === "number" ? val : 0
      setTotalCount(n)
    },
  })

  // Clear data when search value becomes empty (after initial load)
  useEffect(() => {
    if (initialLoadDoneRef.current && !hasSearchValue) {
      setRecords([])
      setTotalCount(0)
      setCurrentPage(1)
    }
  }, [hasSearchValue])

  // when popup closes, refresh list
  useEffect(() => {
    if (!isAddPopupOpen) {
      refetch?.()
      refetchCount?.()
    }
  }, [isAddPopupOpen])

  const handleView = useCallback((row: EmployeeTrainingCompletionItem) => {
    if (!viewMode) return
    if (!row?._id) return
    router.push(`/employee-management/employee-training-completion?mode=view&id=${row._id}`)
  }, [router, viewMode])

  const handleEdit = useCallback((row: EmployeeTrainingCompletionItem) => {
    if (!editMode) return
    if (!row?._id) return
    router.push(`/employee-management/employee-training-completion?mode=edit&id=${row._id}`)
  }, [router, editMode])

  const { post: postDelete, loading: deleteLoading } = usePostRequest<any>({
    url: "employee_training_completion",
    onSuccess: () => {
      toast.success("Deleted successfully")
      refetch?.()
      refetchCount?.()
    },
    onError: () => {
      toast.error("Failed to delete")
    },
  })

  const handleDelete = useCallback(async (row: EmployeeTrainingCompletionItem) => {
    if (!deleteMode) return
    if (!row?._id) return
    const ok = window.confirm(`Delete training completion record for Employee ID: ${row.employeeID || row._id}?`)
    if (!ok) return

    await postDelete({
      tenant: tenantCode,
      action: "delete",
      id: row._id,
      collectionName: "employee_training_completion",
    })
  }, [postDelete, tenantCode, deleteMode])


  const handleAddNew = useCallback(() => {
    if (!addMode) return
    setIsAddPopupOpen(true)
  }, [addMode])

  const handleSelectEmployee = useCallback((employee: any) => {
    
  }, [])

  return (
    <>
      <div className="px-12">
        <EmployeeTrainingCompletionHeader 
          title="Employee Training Completion" 
          description="Manage training completion records for contract employees" 
        />
      </div>
      <div className="mx-auto max-w-7xl space-y-4 mt-1">
        <EmployeeTrainingCompletionFilterBar
          searchTerm={searchValue}
          setSearchTerm={setSearchValue}
          selectedField={searchField}
          setSelectedField={setSearchField}
          searchFields={searchFields}
          filtersApplied={true}
          onFilterClick={() => {}}
          onAddNew={handleAddNew}
          canAdd={addMode}
        />

        <EmployeeTrainingCompletionTable
          data={tableData}
          onView={handleView}
          onEdit={editMode ? handleEdit : undefined}
          onDelete={deleteMode ? handleDelete : undefined}
          onAdd={addMode ? handleAddNew : undefined}
          isLoading={requestLoading}
          permission={{
            view: viewMode,
            edit: editMode,
            add: addMode,
            delete: deleteMode,
          }}
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

      {/* Add Contract Employee Popup */}
      <AddContractEmployeeTrainingPopup
        isOpen={isAddPopupOpen}
        onClose={() => setIsAddPopupOpen(false)}
        onSelect={handleSelectEmployee}
      />
    </>
  )
}

