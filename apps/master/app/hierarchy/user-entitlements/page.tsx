"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import EntitlementAssignmentFormPage, { EntitlementFormData } from "./_components/entitlement-assignment-form-page"
import EntitlementAssignmentsForm from "./_components/entitlement-assignments-form"
import AddEntitlementAssignmentPopup from "./_components/add-entitlement-assignment-popup"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"

export interface EntitlementAssignmentWithId {
  _id?: string
  level: number
  employeeID: string
  hierarchy: {
    subsidiary: string[]
    divisions: string[]
  }
  entitlementCode: string
}

function CreateEntitlementAssignment() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeParam = searchParams.get("mode") as "add" | "edit" | "view" | null
  const idParam = searchParams.get("id")
  const view = modeParam && idParam ? "form" : "list"
  const editingId = idParam || null
  const pageMode = modeParam === "view" ? "view" : modeParam === "edit" ? "edit" : "add"
  const [initialData, setInitialData] = useState<EntitlementFormData | null>(null)
  const [listRefreshKey, setListRefreshKey] = useState(0)
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  
  // Table state - moved from form component
  const [assignments, setAssignments] = useState<EntitlementAssignmentWithId[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedField, setSelectedField] = useState('employeeID')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const prevViewRef = useRef<string | undefined>(view)

  // Check role permissions for userEntitlements screen
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName: "userEntitlements",
  })

  const viewMode = rolePermissions?.view || false
  const editMode = rolePermissions?.edit || false
  const addMode = rolePermissions?.add || false
  const deleteMode = rolePermissions?.delete || false

  // Calculate offset and limit based on current page
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
  const limit = itemsPerPage

  // Debounce search value - update after 300ms of no typing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchTerm])

  // Build criteria array - if view permission is false, filter by logged-in employee ID
  const buildCriteria = useMemo(() => {
    const criteria = [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      { field: "createdBy", value: "", operator: "desc" },  
    ]
    
    // If user doesn't have view permission, filter by their employee ID
    if (!viewMode && employeeId) {
      criteria.push({
        field: "employeeID",
        value: employeeId,
        operator: "eq",
      })
    }

    // Add search filter if search term exists
    if (debouncedSearchTerm.trim()) {
      criteria.push({
        field: selectedField,
        operator: "like",
        value: debouncedSearchTerm.trim()
      })
    }
    
    return criteria
  }, [tenantCode, viewMode, employeeId, debouncedSearchTerm, selectedField])

  // Count API call to get total collection length
  const {
    data: countData,
    loading: countLoading,
    error: countError,
    refetch: refetchCount,
  } = useRequest<any>({
    url: 'userEntitlements/count',
    method: 'POST',
    data: buildCriteria,
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        setTotalCount(data || 0)
      }
    },
    onError: (error: any) => {
      console.error("Error fetching user entitlements count:", error)
    },
    dependencies: [] // Empty dependencies - only fetch manually
  })

  // Fetch assignments data with pagination
  const {
    loading: isLoading,
    refetch: fetchAssignments, 
  } = useRequest<any>({
    url: `userEntitlements/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: buildCriteria,
    dependencies: [], // Empty dependencies - only fetch manually
    onSuccess: (data) => {
      let responseData = data
      if (Array.isArray(data)) {
        responseData = data
      } else if (data?.data && Array.isArray(data.data)) {
        responseData = data.data
      } else if (data?.data && !Array.isArray(data.data)) {
        responseData = [data.data]
      }

      const mappedAssignments: EntitlementAssignmentWithId[] = (responseData || []).map((item: any) => {
        // Handle _id which might be an object with $oid property
        let id = item._id
        if (id && typeof id === 'object' && id.$oid) {
          id = id.$oid
        } else if (id && typeof id === 'object' && id.toString) {
          id = id.toString()
        }
        
        // Extract employeeID - try multiple possible field names and handle null/undefined
        const employeeID = item.employeeID || item.employeeId || item.companyEmployeeID || item.empId || item.employee_id || ""
        
        return {
          _id: id || undefined,
          level: item.level || 0,
          employeeID: employeeID,
          hierarchy: {
            subsidiary: Array.isArray(item.subsidiaries) ? item.subsidiaries : (item.hierarchy?.subsidiary || []),
            divisions: Array.isArray(item.divisions) ? item.divisions : (item.hierarchy?.divisions || [])
          },
          entitlementCode: item.entitlementCode || item.roleID || "",
        }
      })

      setAssignments(mappedAssignments)
    },
    onError: (error) => {
      console.error("Error fetching user entitlements data:", error)
    },
  })

  // Reset to page 1 when debounced search term or field changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, selectedField])

  // Fetch when view changes from "form" to "list" (coming back to table)
  useEffect(() => {
    const wasForm = prevViewRef.current === "form"
    const isNowList = view === "list"
    
    // Only fetch if we're transitioning from form to list
    if (wasForm && isNowList) {
      setCurrentPage(1)
      setSearchTerm('')
      fetchAssignments()
      refetchCount()
    }
    
    prevViewRef.current = view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  // Fetch when refreshKey changes (triggered after any save operation or form close)
  useEffect(() => {
    if (listRefreshKey > 0 && view === "list") {
      setCurrentPage(1)
      setSearchTerm('')
      fetchAssignments()
      refetchCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listRefreshKey, view])

  // Initial fetch when component mounts and view is "list"
  useEffect(() => {
    if (view === "list" && tenantCode) {
      const hasFetched = assignments.length > 0 || totalCount > 0
      if (!hasFetched) {
        fetchAssignments()
        refetchCount()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Fetch when search criteria or pagination changes (only if view is "list")
  useEffect(() => {
    if (view === "list" && tenantCode && prevViewRef.current !== undefined) {
      fetchAssignments()
      refetchCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, selectedField, currentPage, view])

  useEffect(() => {
    if (!editingId) {
      setInitialData(null)
    }
  }, [editingId])

  const { loading: detailLoading } = useRequest<any>({
    url: "userEntitlements/search",
    method: "POST",
    data: [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      ...(editingId
        ? [{ field: "_id", value: editingId, operator: "eq" }]
        : []),
    ],
    dependencies: [editingId],
    onSuccess: (data) => {
      if (!editingId) return

      let responseData = data
      if (Array.isArray(data)) {
        responseData = data
      } else if (data?.data && Array.isArray(data.data)) {
        responseData = data.data
      } else if (data?.data && !Array.isArray(data.data)) {
        responseData = [data.data]
      }

      const item = (responseData || [])[0]
      if (!item) return
      let id = item._id
      if (id && typeof id === "object" && id.$oid) {
        id = id.$oid
      } else if (id && typeof id === "object" && id.toString) {
        id = id.toString()
      }

      const mapped: EntitlementFormData = {
        _id: id || undefined,
        employeeID: item.employeeID || item.employeeId || "",
        roleID: item.entitlementCode || item.roleID || "",
        subsidiaries: Array.isArray(item.subsidiaries)
          ? item.subsidiaries
          : item.hierarchy?.subsidiary || [],
        divisions: Array.isArray(item.divisions)
          ? item.divisions
          : item.hierarchy?.divisions || [],
        departments: Array.isArray(item.departments)
          ? item.departments
          : [],
        locations: Array.isArray(item.locations) ? item.locations : [],
        contractors: Array.isArray(item.contractors)
          ? item.contractors
          : [],
        organizationCode: item.organizationCode || "",
        tenantCode: item.tenantCode || "AAL",
      }

      setInitialData(mapped)
    },
  })

  const handleSave = async (data: any) => {
    setInitialData(null)
    setListRefreshKey((prev) => prev + 1)
    router.push("/hierarchy/user-entitlements")
  }

  return (
    <div className="w-full  pt-0 pb-6">
      {view === "list" ? (
        <EntitlementAssignmentsForm
          assignments={assignments}
          totalCount={totalCount}
          isLoading={isLoading}
          countLoading={countLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          debouncedSearchTerm={debouncedSearchTerm}
          selectedField={selectedField}
          setSelectedField={setSelectedField}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          viewMode={viewMode}
          editMode={editMode}
          addMode={addMode}
          deleteMode={deleteMode}
          onAddNew={() => {
            setIsAddPopupOpen(true)
          }}
          view={view}
          onEdit={(assignment: any, modeFromList = "edit") => {
            if (!assignment?._id) return
            setInitialData(null)
            router.push(`/hierarchy/user-entitlements?mode=${modeFromList}&id=${assignment._id}`)
          }}
          onDelete={(assignment) => {
            // TODO: Add API call to delete from backend
            // After deletion, refresh data
            fetchAssignments()
            refetchCount()
          }}
        />
      ) : (
        <>
          {editingId && !initialData && detailLoading ? (
            <div className="w-full flex items-center justify-center py-16 text-gray-500">
              Loading assignment details...
            </div>
          ) : (
            <EntitlementAssignmentFormPage
              mode={pageMode}
              initialData={initialData ?? undefined}
              onSave={handleSave}
              onBack={() => {
                setInitialData(null)
                fetchAssignments()
                refetchCount()
                setListRefreshKey((prev) => prev + 1)
                router.push("/hierarchy/user-entitlements")
              }}
              onDataChange={() => {
                fetchAssignments()
                refetchCount()
                setListRefreshKey((prev) => prev + 1)
              }}
            />
          )}
        </>
      )}

      <AddEntitlementAssignmentPopup
        isOpen={isAddPopupOpen}
        onClose={() => setIsAddPopupOpen(false)}
      />
    </div>
  )
}

export default CreateEntitlementAssignment

