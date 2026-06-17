"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import PunchTable, { type PunchRecord } from "../../_components/punch-table"
import AddedPunchHeader from "./added-punch-header"
import AddNewPunchForm from "../../_components/add-new-punch-form"
import AddedPunchViewPopup from "./added-punch-view-popup"
import StepByStepFilter, { type FilterSelections } from "@/components/common/step-by-step-filter"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters"

type StatusFilter = "all" | "processed" | "pending" | "inPunches" | "outPunches" | "defaultPunches"

function AddedPunchPage() {
    const [punchData, setPunchData] = useState<PunchRecord[]>([])
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isViewPopupOpen, setIsViewPopupOpen] = useState(false)
    const [selectedPunchId, setSelectedPunchId] = useState<string | null>(null)
    const [searchField, setSearchField] = useState<string>('employeeID')
    const [searchValue, setSearchValue] = useState<string>('')
    const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('')
    const [isSearching, setIsSearching] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [isFilterOpen, setIsFilterOpen] = useState(true)
    const [filtersApplied, setFiltersApplied] = useState(false)
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
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const scrollPositionRef = useRef<number>(0)
    const shouldRestoreScrollRef = useRef<boolean>(false)
    const tenantCode = useGetTenantCode()
    const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
    const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters)
    
    // Stable empty request data to prevent unnecessary API calls when filters aren't applied
    // This only depends on tenantCode, not on apiData (search/status filters)
    const emptyRequestData = useMemo(() => {
        // For self view permission, return simple array structure
        if (loginEmployeeId) {
            return [
                { field: "tenantCode", operator: "eq", value: tenantCode || "" },
                { field: "transactionTime", operator: "desc", value: "" },
                { field: "readerSerialNumber", operator: "eq", value: "MANUAL" },
                { field: "employeeID", operator: "eq", value: loginEmployeeId }
            ]
        }
        // For all view permission, return hierarchy structure
        return {
            hierarchyFilters: {},
            criteriaRequests: [
                { field: "tenantCode", operator: "eq", value: tenantCode || "" },
                { field: "transactionTime", operator: "desc", value: "" },
                { field: "readerSerialNumber", operator: "eq", value: "MANUAL" }
            ],
            userEntitlement: userEntitlement
        }
    }, [tenantCode, userEntitlement])

    const pageName = "addNewPunch"
    const {
        responseData: rolePermissions,
        loading: permissionsLoading,
        error: permissionsError,
    } = useRolePermissions({
        serviceName: "muster",
        screenName: pageName,
    })

    const canViewAdded = !!rolePermissions?.all || !!rolePermissions?.self
    const hasAddAll = !!rolePermissions?.addPunchAll
    const hasAddSelf = !!rolePermissions?.addPunchSelf
    const hasViewAll = !!rolePermissions?.all
    const hasViewSelf = !!rolePermissions?.self
    const isViewAllPermission = hasViewAll
    const isViewSelfPermission = hasViewSelf
    const canAddNewPunch = hasAddAll || hasAddSelf

    // Calculate offset and limit based on current page
    const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
    const limit = itemsPerPage

    // Debounce search value - update after 300ms of no typing
    useEffect(() => {
        if (searchValue !== debouncedSearchValue) {
            setIsSearching(true)
        }

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearchValue(searchValue)
            setIsSearching(false)
        }, 300)

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [searchValue])

    // Convert filter selections to hierarchyFilters format using the hook
    const hierarchyFilters = useHierarchyFilters(filterSelections)

    // Build API data array with filters using useMemo
    const apiData = useMemo(() => {
        const filters: any[] = [
            { field: "tenantCode", operator: "eq", value: tenantCode || "" },
            { field: "transactionTime", operator: "desc", value: "" },
            { field: "readerSerialNumber", operator: "eq", value: "MANUAL" }
        ]

        // Add employeeID filter for self permission
        if (isViewSelfPermission) {
            filters.push({
                field: "employeeID",
                operator: "eq",
                value: loginEmployeeId
            })
        }else if (isViewAllPermission) {
            filters.push({
                field: "createdBy",
                operator: "eq",
                value: loginEmployeeId
            })
        }

        // Add status filter
        if (statusFilter === 'processed') {
            filters.push({
                field: "processed",
                operator: "eq",
                value: true
            })
        } else if (statusFilter === 'pending') {
            filters.push({
                field: "processed",
                operator: "eq",
                value: false
            })
        } else if (statusFilter === 'inPunches') {
            filters.push({
                field: "inOut",
                operator: "eq",
                value: "I"
            })
        } else if (statusFilter === 'outPunches') {
            filters.push({
                field: "inOut",
                operator: "eq",
                value: "O"
            })
        }

        // Add search filter if search term exists
        if (debouncedSearchValue.trim()) {
            filters.push({
                field: searchField,
                operator: "like",
                value: debouncedSearchValue.trim()
            })
        }

        return filters
    }, [tenantCode, statusFilter, debouncedSearchValue, searchField, isViewSelfPermission, loginEmployeeId])

    // Prepare request data - only include real data when filters are applied
    const countRequestData = useMemo(() => {

        // For self view permission, only send criteriaRequests array
        if (isViewSelfPermission) {
            return apiData
        }

        
        if (!filtersApplied) {
            // Use stable empty data that doesn't change when apiData changes
            return emptyRequestData
        }
    
        
        // For all view permission, use hierarchy structure
        return {
            hierarchyFilters: hierarchyFilters,
            criteriaRequests: apiData,
            userEntitlement: userEntitlement
        }
    }, [filtersApplied, hierarchyFilters, apiData, emptyRequestData, userEntitlement, isViewSelfPermission])
    

    // Count API call to get total collection length - only process after filters are applied
    const {
        data: countData,
        loading: countLoading,
        error: countError,
        refetch: refetchCount,
    } = useRequest<any>({
        url: isViewSelfPermission 
            ? 'muster/data_check/count' 
            : 'muster/data_check/count/searchWithHierarchy',
        method: 'POST',
        data: countRequestData,
        onSuccess: (data: any) => {
            // Process data if filters are applied OR if it's self permission (auto-fetch for self)
            if ((filtersApplied || isViewSelfPermission) && data !== null && data !== undefined) {
                setTotalCount(data || 0)
            }
        },
        onError: (error: any) => {
            // Log errors if filters are applied OR if it's self permission
            if (filtersApplied || isViewSelfPermission) {
                console.error("Error fetching added punches count:", error)
            }
        },
        dependencies: [isViewSelfPermission, filtersApplied] // Trigger for self permission or when filters applied
    })

    // Prepare request data - only include real data when filters are applied
    const punchRequestData = useMemo(() => {

        // For self view permission, only send criteriaRequests array
        if (isViewSelfPermission) {
            return apiData
        }
        if (!filtersApplied) {
            // Use stable empty data that doesn't change when apiData changes
            return emptyRequestData
        }
        
        // For all view permission, use hierarchy structure
        return {
            hierarchyFilters: hierarchyFilters,
            criteriaRequests: apiData,
            userEntitlement: userEntitlement
        }
    }, [filtersApplied, hierarchyFilters, apiData, emptyRequestData, userEntitlement, isViewSelfPermission])

    // Fetch added punches data with pagination - only process after filters are applied
    const {
        data: punchDataResponse,
        loading: isLoading,
        error: punchError,
        refetch: fetchPunchData
    } = useRequest({
        url: isViewSelfPermission
            ? `muster/data_check/search?offset=${offset}&limit=${limit}`
            : `muster/data_check/searchWithHierarchy?offset=${offset}&limit=${limit}`,
        method: "POST",
        data: punchRequestData,
        onSuccess: (data: any) => {
            // Process data if filters are applied OR if it's self permission (auto-fetch for self)
            if ((filtersApplied || isViewSelfPermission) && data !== null && data !== undefined) {
                if (Array.isArray(data)) {
                    // Filter out deleted items and empty objects
                    const active = data
                        .filter((item: any) => item?.isDeleted !== true)
                        .filter((item: any) => item && Object.keys(item).length > 0 && item._id)
                    setPunchData(active)
                } else {
                    setPunchData([])
                }
            }
        },
        onError: (error: any) => {
            // Log errors if filters are applied OR if it's self permission
            if (filtersApplied || isViewSelfPermission) {
                console.error("Error fetching punch data:", error)
                setPunchData([])
            }
        },
        dependencies: [isViewSelfPermission, filtersApplied, currentPage, offset, limit] // Trigger for self permission, filters, or pagination
    })

    // Auto-fetch data for self permission when it becomes available
    useEffect(() => {
        if (isViewSelfPermission && !filtersApplied) {
            setFiltersApplied(true)
        }
    }, [isViewSelfPermission, filtersApplied])

    // Trigger API calls when self permission is detected
    useEffect(() => {
        if (isViewSelfPermission) {
            // Ensure functions exist before calling
            if (typeof refetchCount === 'function' && typeof fetchPunchData === 'function') {
                // Use setTimeout to ensure state updates are complete
                const timer = setTimeout(() => {
                    try {
                        refetchCount()
                        fetchPunchData()
                    } catch (error) {
                        console.error('Error calling refetch functions:', error)
                    }
                }, 100)
                return () => clearTimeout(timer)
            }
        }
    }, [isViewSelfPermission])

    // Reset to page 1 when debounced search term or filter changes (but don't trigger API calls)
    // API calls will only happen when Submit/Cancel is clicked
    useEffect(() => {
        shouldRestoreScrollRef.current = false
        setCurrentPage(1)
    }, [debouncedSearchValue, searchField, statusFilter])

    // Restore scroll position after data loads (only for pagination changes)
    useEffect(() => {
        if (shouldRestoreScrollRef.current && punchData.length > 0 && scrollPositionRef.current > 0) {
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: scrollPositionRef.current,
                    behavior: 'instant'
                })
                shouldRestoreScrollRef.current = false
            })
        }
    }, [punchData, currentPage])

    // Memoize handlers to prevent unnecessary re-renders
    const handleFormClose = useCallback(() => {
        setIsFormOpen(false)
        // Restore scroll position after closing form
        requestAnimationFrame(() => {
            window.scrollTo({
                top: scrollPositionRef.current,
                behavior: 'instant'
            })
        })
    }, [])

    const handleOpenViewPopup = useCallback((record: PunchRecord) => {
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop
        setSelectedPunchId(record._id)
        setIsViewPopupOpen(true)
    }, [])

    const handleCloseViewPopup = useCallback(() => {
        setIsViewPopupOpen(false)
        setSelectedPunchId(null)
        // Restore scroll position after closing popup
        requestAnimationFrame(() => {
            window.scrollTo({
                top: scrollPositionRef.current,
                behavior: 'instant'
            })
        })
    }, [])

    const handleFormSuccess = useCallback(async () => {
        setIsFormOpen(false)
        // Always refetch data after successful form submission
        if (filtersApplied || isViewSelfPermission) {
            await fetchPunchData()
            await refetchCount()
        }
        // Restore scroll position after closing form
        requestAnimationFrame(() => {
            window.scrollTo({
                top: scrollPositionRef.current,
                behavior: 'instant'
            })
        })
    }, [filtersApplied, isViewSelfPermission])

    const handleStatusFilterChange = useCallback((filter: StatusFilter) => {
        setStatusFilter(filter)
    }, [])

    const handleSearchFieldChange = useCallback((field: "employeeID" | "readerSerialNumber" | "failureDescription") => {
        setSearchField(field)
    }, [])

    const handleSearchValueChange = useCallback((value: string) => {
        setSearchValue(value)
    }, [])

    const handlePageChange = useCallback((page: number) => {
        // Store current scroll position before page change
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop
        shouldRestoreScrollRef.current = true
        setCurrentPage(page)
    }, [])

    // Handle filter apply - manually trigger API calls only when Submit/Cancel is clicked
    const handleFilterApply = useCallback((filters: FilterSelections) => {
        setFilterSelections(filters)
        setFiltersApplied(true) // Mark filters as applied
        setIsFilterOpen(false)
        setCurrentPage(1) // Reset to first page when filters change
    }, [])

    // Handle filter change (for real-time updates if needed)
    const handleFilterChange = useCallback((filters: FilterSelections) => {
        setFilterSelections(filters)
    }, [])

    // Handle add new punch button click
    const handleAddNewPunch = useCallback(() => {
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop
        setIsFormOpen(true)
    }, [])

    // Auto-apply filters and fetch data for self permission on mount
    useEffect(() => {
        if (isViewSelfPermission && !filtersApplied) {
            setFiltersApplied(true)
        }
    }, [isViewSelfPermission, filtersApplied])

    // Pagination calculations based on total count
    const totalPages = Math.ceil(totalCount / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

    if (permissionsLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (permissionsError || !canViewAdded) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="max-w-md text-center bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Access Restricted</h2>
                    <p className="text-sm text-gray-600">
                        You do not have the required permissions to view added punch records. Please contact your administrator if you believe this is an error.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="">
            <div className="w-full px-12">
                <AddedPunchHeader 
                    onRefilter={() => setIsFilterOpen(true)} 
                    onAddNew={handleAddNewPunch}
                    canAdd={canAddNewPunch}
                    canFilter={isViewAllPermission}
                />
            </div>
            <div className="py-4 relative flex justify-center">
                <div className="w-full max-w-7xl">
                    <PunchTable
                        data={punchData}
                        statusFilter={statusFilter}
                        tableTitle="Added Punches"
                        permissions={{
                            canApproveSuspected: false,
                            canViewSuspected: canViewAdded
                        }}
                        onStatusFilterChange={handleStatusFilterChange}
                        onSelectionChange={(selectedIds: string[]) => {
                        }}
                        visibleColumns={["employeeID", "inOut", "typeOfMovement", "punchedTime", "readerSerialNumber", "processed", "actions"]}
                        onOpenForm={handleOpenViewPopup}
                        externalPagination={{
                            currentPage,
                            totalPages,
                            totalItems: totalCount,
                            itemsPerPage,
                            startIndex,
                            endIndex,
                            onPageChange: handlePageChange
                        }}
                        searchField={searchField as "employeeID" | "readerSerialNumber" | "failureDescription"}
                        searchValue={searchValue}
                        onSearchFieldChange={handleSearchFieldChange}
                        onSearchValueChange={handleSearchValueChange}
                        loading={isLoading || countLoading}
                    />
                </div>
            </div>
            <AddNewPunchForm
                isOpen={isFormOpen}
                onClose={handleFormClose}
                onSubmit={async (data: any) => {
                    // Form submission is handled internally by AddNewPunchForm
                    // After successful submission, refetch the data
                    await handleFormSuccess()
                    return true
                }}
            />
            <AddedPunchViewPopup
                isOpen={isViewPopupOpen}
                onClose={handleCloseViewPopup}
                selectedPunchId={selectedPunchId}
            />
            {/* Show step-by-step filter only if view all permission is true (not for view self permission) */}
            {isViewAllPermission && (
                <StepByStepFilter
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    onFilterChange={handleFilterChange}
                    onApply={handleFilterApply}
                    initialSelections={filterSelections}
                />
            )}
        </div>
    )
}

export default AddedPunchPage
