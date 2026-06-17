"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import PunchTable, { type PunchRecord } from "../../_components/punch-table"
import SuspectedPunchHeader from "./suspected-punch-header"
import SuspectedPunchDataForm from "./suspectedPunchData-form"
import StepByStepFilter, { type FilterSelections } from "@/components/common/step-by-step-filter"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters"

type StatusFilter = "all" | "processed" | "pending" | "inPunches" | "outPunches" | "defaultPunches"

function SuspectedPunchPage() {
    const [punchData, setPunchData] = useState<PunchRecord[]>([])
    const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([])
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedPunchId, setSelectedPunchId] = useState<string | null>(null)
    const [searchField, setSearchField] = useState<string>('employeeID')
    const [searchValue, setSearchValue] = useState<string>('')
    const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('')
    const [isSearching, setIsSearching] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [isFilterOpen, setIsFilterOpen] = useState(true) // Show filter on initial load
    const [filtersApplied, setFiltersApplied] = useState(false) // Track if filters have been applied
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
    const initialMountRef = useRef<boolean>(true)
    const tenantCode = useGetTenantCode()
    const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
    const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters)
    
    // Stable empty request data to prevent unnecessary API calls when filters aren't applied
    // This only depends on tenantCode, not on apiData (search/status filters)
    const emptyRequestData = useMemo(() => {
        return {
            hierarchyFilters: {},
            criteriaRequests: [
                { field: "tenantCode", operator: "eq", value: tenantCode || "" },
                { field: "transactionTime", operator: "desc", value: "" }
            ],
            userEntitlement: userEntitlement
        }
    }, [tenantCode, userEntitlement]) // Only depend on tenantCode and entitlement, not apiData


    const { responseData: approvedPunchData } = useRolePermissions({
        serviceName: 'muster',
        screenName: 'suspectedPunches'
    });

    const canViewSuspected = !!approvedPunchData?.all || !!approvedPunchData?.self
    const canApproveSuspected = approvedPunchData?.approve || false

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

    // Convert filter selections to hierarchyFilters format using shared hook
    const hierarchyFilters = useHierarchyFilters(filterSelections)

    // Build API data array with filters using useMemo
    const apiData = useMemo(() => {
        const filters: any[] = [
            { field: "tenantCode", operator: "eq", value: tenantCode || "" },
            { field: "transactionTime", operator: "desc", value: "" }
            // { field: "employeeID", operator: "in", value: employeeIds || [] }
        ]

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
    }, [tenantCode, statusFilter, debouncedSearchValue, searchField])

    // Prepare request data - only include real data when filters are applied
    const countRequestData = useMemo(() => {
        if (!filtersApplied) {
            // Use stable empty data that doesn't change when apiData changes
            return emptyRequestData
        }
        return {
            hierarchyFilters: hierarchyFilters,
            criteriaRequests: apiData,
            userEntitlement: userEntitlement
        }
    }, [filtersApplied, hierarchyFilters, apiData, emptyRequestData, userEntitlement])
    

    // Count API call to get total collection length - only process after filters are applied
    const {
        data: countData,
        loading: countLoading,
        error: countError,
        refetch: refetchCount,
    } = useRequest<any>({
        url: 'muster/suspectedPunches/count/searchWithHierarchy',
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
                console.error("Error fetching suspected punches count:", error)
            }
        },
        dependencies: [] // Empty dependencies - requests will only be made via manual refetch
    })

    // Prepare request data - only include real data when filters are applied
    const punchRequestData = useMemo(() => {
        if (!filtersApplied) {
            // Use stable empty data that doesn't change when apiData changes
            return emptyRequestData
        }
        return {
            hierarchyFilters: hierarchyFilters,
            criteriaRequests: apiData,
            userEntitlement: userEntitlement
        }
    }, [filtersApplied, hierarchyFilters, apiData, emptyRequestData, userEntitlement])

    // Fetch suspected punches data with pagination - only process after filters are applied
    const {
        data: punchDataResponse,
        loading: isLoading,
        error: punchError,
        refetch: fetchPunchData
    } = useRequest({
        url: `muster/suspectedPunches/searchWithHierarchy?offset=${offset}&limit=${limit}`,
        method: "POST",
        data: punchRequestData,
        onSuccess: (data: any) => {
            // Only process if filters have been applied
            if (filtersApplied && data !== null && data !== undefined) {
                if (Array.isArray(data)) {
                    setPunchData(data)
                } else {
                    setPunchData([])
                }
            }
        },
        onError: (error: any) => {
            // Only log errors if filters have been applied
            if (filtersApplied) {
                console.error("Error fetching punch data:", error)
                setPunchData([])
            }
        },
        dependencies: [] // Empty dependencies - requests will only be made via manual refetch
    })


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
    const handleOpenForm = useCallback((record: PunchRecord) => {
        // Store current scroll position before opening form
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop
        setSelectedPunchId(record._id)
        setIsFormOpen(true)
    }, [])

    const handleFormClose = useCallback(() => {
        setIsFormOpen(false)
        setSelectedPunchId(null)
        // Restore scroll position after closing form
        requestAnimationFrame(() => {
            window.scrollTo({
                top: scrollPositionRef.current,
                behavior: 'instant'
            })
        })
    }, [])

    const handleFormSuccess = useCallback(() => {
        if (filtersApplied) {
            fetchPunchData()
            refetchCount()
        }
        setIsFormOpen(false)
        setSelectedPunchId(null)
        setSelectedRecordIds([])
        // Restore scroll position after closing form
        requestAnimationFrame(() => {
            window.scrollTo({
                top: scrollPositionRef.current,
                behavior: 'instant'
            })
        })
    }, [])

    

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
        // Manually trigger API call for pagination (only if filters have been applied)
        // if (filtersApplied) {
        //     setTimeout(() => {
        //         fetchPunchData()
        //     }, 0)
        // }
    }, [])

    // Handle filter apply - manually trigger API calls only when Submit/Cancel is clicked
    const handleFilterApply = useCallback((filters: FilterSelections) => {
        setFilterSelections(filters)
        setFiltersApplied(true) // Mark filters as applied
        setIsFilterOpen(false)
        setCurrentPage(1) // Reset to first page when filters change
        
        
        const tempApiData = [
            { field: "tenantCode", operator: "eq", value: tenantCode || "" },
            { field: "transactionTime", operator: "desc", value: "" }
        ]
        
        if (statusFilter === 'processed') {
            tempApiData.push({
                field: "processed",
                operator: "eq",
                value: true
            })
        } else if (statusFilter === 'pending') {
            tempApiData.push({
                field: "processed",
                operator: "eq",
                value: false
            })
        }
        
        if (debouncedSearchValue.trim()) {
            tempApiData.push({
                field: searchField,
                operator: "like",
                value: debouncedSearchValue.trim()
            })
        }
        
    }, [ tenantCode, statusFilter, debouncedSearchValue, searchField])

    // Handle filter change (for real-time updates if needed)
    const handleFilterChange = useCallback((filters: FilterSelections) => {
        setFilterSelections(filters)
    }, [])

    // Pagination calculations based on total count
    const totalPages = Math.ceil(totalCount / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = Math.min(startIndex + itemsPerPage, totalCount)


    // if (permissionsLoading) {
    //     return (
    //         <div className="flex items-center justify-center py-16">
    //             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    //         </div>
    //     )
    // }

    if (!canViewSuspected) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="max-w-md text-center bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Access Restricted</h2>
                    <p className="text-sm text-gray-600">
                        You do not have the required permissions to view suspected punch records. Please contact your administrator if you believe this is an error.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="">
            <SuspectedPunchHeader onRefilter={() => setIsFilterOpen(true)} />
            <div className="py-4 relative">
                <PunchTable
                    data={punchData}
                    statusFilter={statusFilter}
                    tableTitle="Suspected Punches"
                    permissions={{
                        canApproveSuspected: canApproveSuspected,
                        canViewSuspected: canViewSuspected
                    }}
                    onStatusFilterChange={handleStatusFilterChange}
                    onSelectionChange={(selectedIds) => {
                        setSelectedRecordIds(selectedIds)
                    }}
                    onOpenForm={handleOpenForm}
                    visibleColumns={["employeeID", "inOut", "typeOfMovement", "punchedTime", "readerSerialNumber", "processed", "failureDescription"]}
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
                    loading={isLoading}
                />
            </div>
            <SuspectedPunchDataForm
                isOpen={isFormOpen}
                onClose={handleFormClose}
                mode={{ mode: selectedPunchId ? 'edit' : 'add', id: selectedPunchId || undefined }}
                selectedId={selectedPunchId || undefined}
                onSuccess={handleFormSuccess}
                canApproveSuspected={canApproveSuspected}
            />
            <StepByStepFilter
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onFilterChange={handleFilterChange}
                onApply={handleFilterApply}
                initialSelections={filterSelections}
            />
        </div>
    )
}

export default SuspectedPunchPage