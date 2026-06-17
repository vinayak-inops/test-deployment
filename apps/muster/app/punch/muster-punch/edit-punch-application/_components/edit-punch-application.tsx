"use client"
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { Clock } from 'lucide-react';
import ApplicationTable from './application-table';
import ApplicationFilters from './application-filters';
import { useGetTenantCode } from '@/hooks/useGetTenantCode';
import EditPunchRequestsPopup from './edit-punch-requests-popup';

export default function EditPunchApplication({employeeID}: {employeeID?: string}) {
    const [punchApplications, setPunchApplications] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');
    const [searchField, setSearchField] = useState<string>('employeeID');
    const [searchValue, setSearchValue] = useState<string>('');
    const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('');
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const itemsPerPage = 10;
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const previousFiltersRef = useRef<string>('');
    const scrollPositionRef = useRef<number>(0);

    // Get tenant code from cookie using custom hook
    const tenantCode = useGetTenantCode()

    // Calculate offset and limit based on current page
    const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
    const limit = itemsPerPage;

    // Debounce search value - update after 300ms of no typing for better responsiveness
    useEffect(() => {
        // Show searching state when user is typing
        if (searchValue !== debouncedSearchValue) {
            setIsSearching(true);
        }

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearchValue(searchValue);
            setIsSearching(false);
        }, 300);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchValue]);

    // Build API data array with filters using useMemo - optimized to prevent unnecessary recalculations
    const apiData = useMemo(() => {
        const filters: any[] = [
            { field: "tenantCode", operator: "eq", value: tenantCode || "" },
            { field: "createdOn", operator: "desc", value: "" },
        ];
        
        // Add employeeID filter only if employeeID has a value
        if (employeeID && employeeID.trim() !== '') {
            filters.push({ field: "employeeID", operator: "eq", value: employeeID });
        }

        // Add tab-based filter
        if (activeTab !== 'all') {
            if (activeTab === 'pending') {
                filters.push({
                    field: "workflowState",
                    operator: "in",
                    value: ["INITIATED", "PENDING", "VALIDATE", "NEW"]
                });
            } else if (activeTab === 'approved') {
                filters.push({
                    field: "workflowState",
                    operator: "eq",
                    value: "APPROVED"
                });
            } else if (activeTab === 'rejected') {
                filters.push({
                    field: "workflowState",
                    operator: "eq",
                    value: "REJECTED"
                });
            } else if (activeTab === 'cancelled') {
                filters.push({
                    field: "workflowState",
                    operator: "in",
                    value: ["CANCELLED", "CANCEL"]
                });
            }
        }

        // Add search filter if search term exists
        if (debouncedSearchValue.trim()) {
            filters.push({
                field: searchField,
                operator: "like",
                value: debouncedSearchValue.trim()
            });
        }

        // Create a string representation to compare filters
        const filterKey = JSON.stringify(filters);
        previousFiltersRef.current = filterKey;

        return filters;
    }, [tenantCode, activeTab, debouncedSearchValue, searchField, employeeID]);

    // Count API data (without sort)
    const countApiData = useMemo(() => {
        return apiData.filter((f: any) => f.field !== "createdOn");
    }, [apiData]);

    // Count API call to get total collection length
    const {
        data: countData,
        loading: countLoading,
        error: countError,
        refetch: refetchCount,
    }: {
        data: any;
        loading: any;
        error: any;
        refetch: any;
    } = useRequest<any>({
        url: 'editPunchApplication/count',
        method: 'POST',
        data: countApiData,
        onSuccess: (data: any) => {
            setTotalCount(data || 0);
        },
        onError: (error: any) => {
            console.error("Error fetching edit punch application count:", error);
        },
        dependencies: [tenantCode, activeTab, debouncedSearchValue, searchField]
    });

    // Search API call with dynamic offset and limit
    const {
        data,
        error,
        loading,
        refetch,
    }: {
        data: any;
        error: any;
        loading: any;
        refetch: any;
    } = useRequest<any[]>({
        url: `editPunchApplication/search?offset=${offset}&limit=${limit}`,
        method: 'POST',
        data: apiData,
        onSuccess: (data: any) => {
            // Filter out deleted items and empty objects (like [{}])
            const active = (data || [])
                .filter((item: any) => item?.isDeleted !== true)
                .filter((item: any) => item && Object.keys(item).length > 0 && item._id); // Filter out empty objects and items without _id
            
            // Map data to include required fields
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
            }));
            
            setPunchApplications(updatedData);
        },
        onError: (error: any) => {
            console.error("Error loading edit punch applications:", error);
        },
        dependencies: [tenantCode, currentPage, offset, limit, activeTab, debouncedSearchValue, searchField]
    });

    // Refetch when popup or form state changes - only when they close
    useEffect(() => {
        refetch();
        refetchCount();
    }, []);

    // Reset to page 1 when debounced search term or tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchValue, searchField, activeTab]);

    // Memoize handlers to prevent unnecessary re-renders
    const handleOpenDetails = useCallback((row: any) => {
        if (!row?._id) return;
        // Store current scroll position before opening popup
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
        setSelectedRequestId(row._id);
        setIsPopupOpen(true);
    }, []);

    const handleTabChange = useCallback((tab: 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled') => {
        setActiveTab(tab);
    }, []);

    const handleSearchFieldChange = useCallback((field: string) => {
        setSearchField(field);
    }, []);

    const handleSearchValueChange = useCallback((value: string) => {
        setSearchValue(value);
    }, []);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    // Pagination calculations based on total count
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

    return (
        <div>
            <div className='px-0 py-3'>
                <div className='flex items-center gap-2'>
                    <Clock className='h-5 w-5 text-blue-600' />
                    <h1 className='text-lg sm:text-xl font-semibold text-gray-900 tracking-tight'>Edit Punch Applications</h1>
                </div>
                <p className='text-xs text-gray-500 mt-0.5'>View and manage edit punch application requests</p>
            </div>
            {/* <div className='mb-3'>
                <ApplicationSummaryCards isPopupOpen={isPopupOpen} isFormOpen={isFormOpen} />
            </div> */}
            <ApplicationFilters
                activeTab={activeTab}
                onTabChange={handleTabChange}
                searchField={searchField}
                searchValue={searchValue}
                onSearchFieldChange={handleSearchFieldChange}
                onSearchValueChange={handleSearchValueChange}
                isSearching={isSearching}
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
                onPageChange={handlePageChange}
                onOpenDetails={handleOpenDetails}
            />
            <EditPunchRequestsPopup
                isOpen={isPopupOpen}
                onClose={() => {
                    setIsPopupOpen(false);
                    setSelectedRequestId(null);
                    // Restore scroll position after closing popup
                    requestAnimationFrame(() => {
                        window.scrollTo({
                            top: scrollPositionRef.current,
                            behavior: 'instant'
                        });
                    });
                }}
                selectedRequestId={selectedRequestId}
            />
        </div>
    )
}