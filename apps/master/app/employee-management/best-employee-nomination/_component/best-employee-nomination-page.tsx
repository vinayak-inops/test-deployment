"use client";

import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import BestEmployeeNominationForm, { BestEmployeeNominationItem } from "./best-employee-nomination-form";
import { toast } from "react-toastify";
import PageNotFound from "@/components/page-notfound";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy";
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters";
import StepByStepFilter, { type FilterSelections } from "@/components/common/step-by-step-filter";
import BestEmployeeNominationHeader from "./best-employee-nomination-header";
import BestEmployeeNominationFilterBar from "./best-employee-nomination-filter-bar";
import BestEmployeeNominationTable from "./best-employee-nomination-table";

export default function BestEmployeeNominationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<any[]>([])
  const [fullRows, setFullRows] = useState<any[]>([])
  const [action, setAction] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)
  const [openForm, setOpenForm] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isFormViewMode, setIsFormViewMode] = useState(false)
  const [editData, setEditData] = useState<BestEmployeeNominationItem | null>(null)
  // permissions are handled centrally
  const [viewMode, setViewMode] = useState<any>(false);
  const [editMode, setEditMode] = useState<any>(false);
  const [addMode, setAddMode] = useState<any>(false);
  const [deleteMode, setDeleteMode] = useState<any>(false);
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isFilterOpen, setIsFilterOpen] = useState(true) // Show filter on initial load
  const [filtersApplied, setFiltersApplied] = useState(false) // Track if filters have been applied
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedField, setSelectedField] = useState('employeeID')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [filterSelections, setFilterSelections] = useState<FilterSelections>({
      subsidiaries: [],
      divisions: [],
      departments: [],
      locations: [],
      contractors: [],
      workOrderNumbers: [],
      employeeID: ''
  })
  const itemsPerPage = 10
  const tenantCode = useGetTenantCode();
  const { employeeIds, hierarchyFilters: empHierarchyFilters } = useEmpHierarchy();
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo();
  const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters);
  
  // Get employee IDs
  const allEmployeeIds = useMemo(() => {
      return Array.from(new Set(employeeIds || [])).filter(Boolean) // Remove duplicates and empty values
  }, [employeeIds])

  // Calculate offset and limit based on current page - limit is always 10
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage])
  const limit = 10 // Fixed limit of 10 items per page


    const contractorEmployee = "bestEmployeeNomination"

    // Centralized role-permissions
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: "employeeManagement",
        screenName: contractorEmployee,
    });
    useEffect(() => {
        setViewMode(rolePermissions?.view || false)
        setEditMode(rolePermissions?.edit || false)
        setAddMode(rolePermissions?.add || false)
        setDeleteMode(rolePermissions?.delete || false)
    }, [rolePermissions])

    // Debounce search value - update after 400ms of no typing
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
            debounceTimerRef.current = null
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
            debounceTimerRef.current = null
        }, 400)

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
                debounceTimerRef.current = null
            }
        }
    }, [searchTerm])

  const formatDateTime = (value: any) => {
    if (!value) return ""
    const date = new Date(value)
    if (isNaN(date.getTime())) return String(value)
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  // Stable empty request data to prevent unnecessary API calls when filters aren't applied
  const emptyRequestData = useMemo(() => {
      return {
          hierarchyFilters: {},
          criteriaRequests: [
              { field: "tenantCode", operator: "eq", value: tenantCode || "" },
              { field: "createdOn", operator: "desc", value: "" },
          ],
          userEntitlement
      }
  }, [tenantCode, userEntitlement])

  // Convert filter selections to hierarchyFilters format using shared hook
  // Don't include employeeID from filterSelections if we're using search
  const modifiedFilterSelections = useMemo(() => {
      if (debouncedSearchTerm.trim()) {
          // Exclude employeeID when search is active by setting it to empty string
          return {
              ...filterSelections,
              employeeID: ''
          }
      }
      return filterSelections
  }, [filterSelections, debouncedSearchTerm])

  const hierarchyFilters = useHierarchyFilters(modifiedFilterSelections)

  // Build API criteria array
  const apiCriteria = useMemo(() => {
      const filters: any[] = [
          {
              field: "tenantCode",
              value: tenantCode,
              operator: "eq",
          },
          {
              field: "createdOn",
              operator: "desc",
              value: ""
          }
      ]

      // Add employeeID filter if allEmployeeIds is available and not empty
      // if (allEmployeeIds && allEmployeeIds.length > 0) {
      //     filters.push({
      //         field: "employeeID",
      //         value: allEmployeeIds,
      //         operator: "in",
      //     })
      // }

      // Add search filter if search term exists
      if (debouncedSearchTerm.trim() && filtersApplied) {
          filters.push({
              field: selectedField,
              operator: "like",
              value: debouncedSearchTerm.trim()
          })
      }

      return filters
  }, [tenantCode, allEmployeeIds, debouncedSearchTerm, selectedField, filtersApplied])

  // Prepare request data - only include real data when filters are applied
  const countRequestData = useMemo(() => {
      if (!filtersApplied) {
          // Use stable empty data that doesn't change when apiCriteria changes
          return emptyRequestData
      }
      return {
          hierarchyFilters: hierarchyFilters,
          criteriaRequests: apiCriteria,
          userEntitlement
      }
  }, [filtersApplied, hierarchyFilters, apiCriteria, emptyRequestData, userEntitlement])

  // Prepare request data for search - only include real data when filters are applied
  const searchRequestData = useMemo(() => {
      if (!filtersApplied) {
          // Use stable empty data that doesn't change when apiCriteria changes
          return emptyRequestData
      }
      return {
          hierarchyFilters: hierarchyFilters,
          criteriaRequests: apiCriteria,
          userEntitlement
      }
  }, [filtersApplied, hierarchyFilters, apiCriteria, emptyRequestData, userEntitlement])

  const { post: postDelete } = usePostRequest<any>({
    url: "best_employee_nomination",
    onSuccess: () => {
      toast.success("Nomination removed")
    },
    onError: (e) => {
      toast.error("Delete failed")
      console.error(e)
    }
  })
  


  // Count API call to get total collection length - only process after filters are applied
  const {
      data: countData,
      loading: countLoading,
      error: countError,
      refetch: refetchCount,
  } = useRequest<any>({
      url: 'best_employee_nomination/count/searchWithHierarchy',
      method: 'POST',
      data: countRequestData,
      onSuccess: (data: any) => {
          // Only process if filters have been applied
          if (filtersApplied && data !== null && data !== undefined) {
              setTotalCount(data || 0)
          }
      },
      onError: (error: any) => {
          // Only log errors if filters have been applied
          if (filtersApplied) {
              console.error("Error fetching best employee nomination count:", error)
          }
      },
      dependencies: [] // Empty dependencies - requests will only be made via manual refetch
  })

  // Fetch best employee nomination data with pagination - only process after filters are applied
  const { data, error, loading, refetch } = useRequest<any[]>({
    url: `best_employee_nomination/searchWithHierarchy?offset=${offset}&limit=${limit}`,
    method: 'POST',
    data: searchRequestData,
    onSuccess: (data) => {
      // Only process if filters have been applied
      if (filtersApplied && data !== null && data !== undefined) {
        const active = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)
        setFullRows(active)
        
        // Transform data for table display
        const transformedData = active.map((r: any) => ({
          _id: r._id,
          nominationYear: r.nominationYear,
          date: formatDateTime(r.date),
          employeeID: r.employeeID,
          createdOn: formatDateTime(r.createdOn),
          createdBy: r.createdBy
        }))
        
        setRows(transformedData)
      }
    },
    onError: (error) => {
      // Only log errors if filters have been applied
      if (filtersApplied) {
        console.error("Error fetching best employee nomination data:", error)
        setRows([])
        setFullRows([])
      }
    },
    dependencies: [] // Empty dependencies - requests will only be made via manual refetch
  })

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
      setCurrentPage(page)
  }, [])

  // Track previous values to prevent unnecessary API calls
  const prevPageRef = useRef<number>(1)
  const prevDebouncedSearchRef = useRef<string>('')
  const prevSelectedFieldRef = useRef<string>('employeeID')
  const prevFiltersAppliedRef = useRef<boolean>(false)

  // Reset to page 1 when filters change
  useEffect(() => {
      if (filtersApplied && !prevFiltersAppliedRef.current) {
          setCurrentPage(1)
          prevFiltersAppliedRef.current = true
      }
  }, [filterSelections, filtersApplied])

  // Reset to page 1 when debounced search changes
  useEffect(() => {
      if (filtersApplied && debouncedSearchTerm !== prevDebouncedSearchRef.current) {
          setCurrentPage(1)
          prevDebouncedSearchRef.current = debouncedSearchTerm
      }
  }, [debouncedSearchTerm, filtersApplied])

  // Single unified effect to handle API calls - prevents duplicate calls
  const isInitialMount = useRef(true)
  useEffect(() => {
      if (isInitialMount.current) {
          isInitialMount.current = false
          prevPageRef.current = currentPage
          prevDebouncedSearchRef.current = debouncedSearchTerm
          prevSelectedFieldRef.current = selectedField
          prevFiltersAppliedRef.current = filtersApplied
          return
      }

      if (!filtersApplied) return

      if (debounceTimerRef.current) return

      const pageChanged = currentPage !== prevPageRef.current
      const searchChanged = debouncedSearchTerm !== prevDebouncedSearchRef.current
      const fieldChanged = selectedField !== prevSelectedFieldRef.current
      const filtersJustApplied = filtersApplied && !prevFiltersAppliedRef.current

      if (pageChanged || searchChanged || fieldChanged || filtersJustApplied) {
          prevPageRef.current = currentPage
          prevDebouncedSearchRef.current = debouncedSearchTerm
          prevSelectedFieldRef.current = selectedField
          prevFiltersAppliedRef.current = filtersApplied

          refetch()
          refetchCount()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm, selectedField, filtersApplied])

  // Handle filter apply - manually trigger API calls only when Submit/Cancel is clicked
  const handleFilterApply = useCallback((filters: FilterSelections) => {
      setFilterSelections(filters)
      setFiltersApplied(true) // Mark filters as applied
      setIsFilterOpen(false)
      setCurrentPage(1) // Reset to first page when filters change
      // Note: API will be called automatically by the unified useEffect when filtersApplied changes
  }, [])

  // Handle filter change (for real-time updates if needed)
  const handleFilterChange = useCallback((filters: FilterSelections) => {
      setFilterSelections(filters)
  }, [])

  // Handle add new nomination
  const handleAddNew = useCallback(() => {
      setIsEditMode(false)
      setIsFormViewMode(false)
      setEditData(null)
      setOpenForm(true)
  }, [])

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return
    const original = fullRows.find((o: any) => o._id === itemToDelete._id) || itemToDelete
    const postData = {
      tenant: tenantCode,
      action: 'insert',
      id: original._id,
      collectionName: 'best_employee_nomination',
      data: { isDeleted: true, ...original },
    }
    await postDelete(postData)
    setAction(original._id)
    setShowDeleteConfirm(false)
    setItemToDelete(null)
    if (filtersApplied) {
      refetch()
      refetchCount()
    }
  }

  const handleCancelDelete = () => { setShowDeleteConfirm(false); setItemToDelete(null) }

  return (
    <>
    {
        (viewMode || editMode || addMode) ? (
            <div>
          <BestEmployeeNominationHeader
            title="Best Employee Nomination"
            description="Manage nominations"
          />
          
          {/* Filter Bar with Search, Filter, and Add New */}
          <BestEmployeeNominationFilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedField={selectedField}
            setSelectedField={setSelectedField}
            searchFields={[
              { value: 'employeeID', label: 'Employee ID' },
              { value: 'nominationYear', label: 'Nomination Year' }
            ]}
            filtersApplied={filtersApplied}
            onFilterClick={() => setIsFilterOpen(true)}
            onAddNew={handleAddNew}
            canAdd={addMode}
          />
          
          {rows && rows.length >= 0 && (
            <BestEmployeeNominationTable
              nominationData={rows}
              loading={loading}
              currentPage={currentPage}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onEdit={(nomination) => {
                const originalItem = fullRows.find(orig => orig._id === nomination._id);
                if (originalItem) {
                  setIsEditMode(true)
                  setIsFormViewMode(false)
                  setEditData(originalItem)
                  setOpenForm(true)
                }
              }}
              onDelete={(nomination) => {
                setItemToDelete(nomination);
                setShowDeleteConfirm(true);
              }}
              onView={(nomination) => {
                const originalItem = fullRows.find(orig => orig._id === nomination._id) || nomination;
                setIsEditMode(false)
                setIsFormViewMode(true)
                setEditData(originalItem)
                setOpenForm(true)
              }}
              editMode={editMode}
              deleteMode={deleteMode}
              viewMode={viewMode}
            />
          )}
    
          <BestEmployeeNominationForm
            open={openForm}
            setOpen={setOpenForm}
            editData={editData || undefined}
            isEditMode={isEditMode}
            isViewMode={isFormViewMode}
            onSuccess={() => { 
              setAction(Date.now())
              if (filtersApplied) {
                refetch()
                refetchCount()
              }
            }}
            onServerUpdate={async () => { 
              if (filtersApplied) {
                await refetch()
                await refetchCount()
              }
            }}
          />
    
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">Are you sure you want to delete this nomination?</p>
                <div className="flex justify-end space-x-3">
                  <button onClick={handleCancelDelete} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancel</button>
                  <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700">Delete</button>
                </div>
              </div>
            </div>
          )}
          <StepByStepFilter
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              onFilterChange={handleFilterChange}
              onApply={handleFilterApply}
              initialSelections={filterSelections}
          />
        </div>
        ):(
           <PageNotFound /> 
        )
    }
    </>
  )
}