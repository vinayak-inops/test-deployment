"use client"
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { Clock } from 'lucide-react';
import ApplicationTable from './application-table';
import ApplicationFilters from './application-filters';
import ShiftRequestsPopup from './shift-requests-popup';
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode';
import { useKeyclockRoleInfo } from '@/hooks/api/search/keyclock-role-info';
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray';

interface ShiftApplicationApproverProps {
    isApprovalPermission?: boolean
}

export default function ShiftApplicationApprover({ isApprovalPermission: _isApprovalPermission = false }: ShiftApplicationApproverProps) {
    const [otApplications, setOtApplications] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'cancelled' | 'failed'>('pending');
    const [searchField, setSearchField] = useState<string>('employeeID');
    const [searchValue, setSearchValue] = useState<string>('');
    const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('');
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 5;
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Get tenant code from cookie using custom hook
    const tenantCode = useGetTenantCode()

    // Get logged-in employee ID from hook
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

    // Get cookie information
    const getCookie = (name: string): string | undefined => {
        if (typeof window === 'undefined') return undefined;
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                const value = cookie.substring(name.length + 1);
                try {
                    return decodeURIComponent(value);
                } catch {
                    return value;
                }
            }
        }
        return undefined;
    };

    // Get stored role information from cookies
    const storedRoleInfo = useMemo(() => {
        try {
            const keyclockroleinfo = getCookie("keyclockroleinfo");
            if (keyclockroleinfo) {
                return JSON.parse(keyclockroleinfo);
            }
        } catch {
            // ignore
        }
        return null as any;
    }, []);

    // Get logged-in employee ID - use hook value or fallback to storedRoleInfo
    const employeeId = loginEmployeeId || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || ""

    // Get role permissions for approve/reject/cancel
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: 'applicationApplier',
        screenName: 'shiftChange'
    });
    const { responseData: roleApprover } = useRolePermissions({
        serviceName: 'applicationApprover',
        screenName: 'shiftChange'
    });
    const canApprove = !!rolePermissions?.approve || !!roleApprover?.approve;
    const canReject = !!rolePermissions?.reject || !!roleApprover?.reject;
    const canCancel = !!rolePermissions?.cancel || !!roleApprover?.cancel;

    // Debounce search value - update after 300ms of no typing
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearchValue(searchValue);
            setCurrentPage(1); // Reset to first page when search changes
        }, 300);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchValue]);

    // Calculate offset and limit based on current page
    const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
    const limit = itemsPerPage;

    // Determine which collection to use based on activeTab and permissions
    const collectionName = useMemo(() => {
        // Pending and Failed always use shiftChangeApplication
        if (activeTab === 'pending' || activeTab === 'failed') {
            return 'shiftChangeApplication'
        }
        // For Cancel, Reject, Approve: use shiftChangeApplicationTransaction
        if (activeTab === 'cancelled' || activeTab === 'rejected' || activeTab === 'approved') {
            return 'shiftChangeApplicationTransaction'
        }
        // Default fallback
        return 'shiftChangeApplication'
    }, [activeTab])

    // Build request data - add filters based on activeTab and permissions
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
            }
        ]

        // For pending tab: filter by approverID
        if (activeTab === 'pending' && employeeId) {
            requestData.push({
                field: "approverID",
                value: employeeId,
                operator: "eq",
            })
        }

        // For failed tab: filter by workflowState and approverID
        if (activeTab === 'failed' && employeeId) {
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

        // For approve tab: filter by approvedBy
        if (activeTab === 'approved' && employeeId) {
            requestData.push({
                field: "approvedBy",
                value: employeeId,
                operator: "eq",
            })
        }

        // For reject tab: filter by rejectedBy
        if (activeTab === 'rejected' && employeeId) {
            requestData.push({
                field: "rejectedBy",
                value: employeeId,
                operator: "eq",
            })
        }

        // For cancel tab: filter by cancelledBy
        if (activeTab === 'cancelled' && employeeId) {
            requestData.push({
                field: "cancelledBy",
                value: employeeId,
                operator: "eq",
            })
        }

        // Text search filter (like operator)
        if (trimmedSearch) {
            requestData.push({
                field: searchField,
                operator: "like",
                value: trimmedSearch,
            })
        }

        return requestData
    }, [
        activeTab,
        tenantCode,
        employeeId,
        debouncedSearchValue,
        searchField
    ])

    // Count API call to get total count
    const {
        refetch: refetchCount,
    } = useRequest<any>({
        url: `${collectionName}/count`,
        method: 'POST',
        data: buildRequestData,
        onSuccess: (data: any) => {
            if (data !== null && data !== undefined) {
                setTotalCount(data || 0);
            }
        },
        onError: () => {
        },
    });

    // Status-specific counts
    const { refetch: refetchApprovedCount } = useRequest<number>({
        url: `${collectionName}/count`,
        method: 'POST',
        data: [...buildRequestData, { field: "workflowState", operator: "eq", value: "APPROVED" }],
    });

    const { refetch: refetchRejectedCount } = useRequest<number>({
        url: `${collectionName}/count`,
        method: 'POST',
        data: [...buildRequestData, { field: "workflowState", operator: "eq", value: "REJECTED" }],
    });

    const { refetch: refetchCancelledCount } = useRequest<number>({
        url: `${collectionName}/count`,
        method: 'POST',
        data: [...buildRequestData, { field: "workflowState", operator: "in", value: ["CANCELLED", "CANCEL"] }],
    });

    // Fetch applications data with pagination
    const {
        loading: isLoading,
        refetch: otRefetch
    }: {
        error: any;
        loading: any;
        refetch: any;
    } = useRequest<any[]>({
        url: `${collectionName}/search?offset=${offset}&limit=${limit}`,
        method: 'POST',
        data: buildRequestData,
        onSuccess: (data: any) => {
            // Handle empty array or invalid data
            if (!data || !Array.isArray(data)) {
                setOtApplications([])
                return
            }

            // Filter out empty objects and map valid data
            const updatedData = data
                .filter((item: any) => item && typeof item === 'object' && Object.keys(item).length > 0)
                .map((item: any) => ({
                    _id: item._id || "",
                    employeeID: item.employeeID || "",
                    appliedDate: item.appliedDate || item.createdOn || "",
                    fromDate: item.fromDate || "",
                    toDate: item.toDate || "",
                    shiftName: item.shift?.shiftName || item.shiftName || "",
                    // timings: prefer nested shift fields, then explicit root fallbacks
                    shiftStart: item.shift?.shiftStart || item.shiftStart || item.startTime || item.shiftFrom || "",
                    shiftEnd: item.shift?.shiftEnd || item.shiftEnd || item.endTime || item.shiftTo || "",
                    lunchStart: item.shift?.lunchStart || item.lunchStart || item.breakStart || item.lunchFrom || "",
                    lunchEnd: item.shift?.lunchEnd || item.lunchEnd || item.breakEnd || item.lunchTo || "",
                    remarks: item.remarks || item.Remarks || "",
                    workflowState: item.workflowState || "",
                    status: item.status || item.workflowState || "INITIATED",
                }))

            setOtApplications([...updatedData])
        },
        onError: () => {
        }
    });

    // Helper to refresh all server data (list + counts)
    const refreshAll = useCallback(() => {
        // Check permissions based on active tab
        const shouldFetch =
            activeTab === 'pending' ||
            activeTab === 'failed' ||
            (activeTab === 'approved' && canApprove) ||
            (activeTab === 'rejected' && canReject) ||
            (activeTab === 'cancelled' && canCancel);

        if (shouldFetch) {
            otRefetch();
            refetchCount();
        }

        // Only fetch approved count if approved tab is active and user has permission
        if (activeTab === 'approved' && canApprove) {
            refetchApprovedCount();
        }

        // Only fetch rejected count if rejected tab is active and user has permission
        if (activeTab === 'rejected' && canReject) {
            refetchRejectedCount();
        }

        // Only fetch cancelled count if cancelled tab is active and user has permission
        if (activeTab === 'cancelled' && canCancel) {
            refetchCancelledCount();
        }
    }, [activeTab, canApprove, canReject, canCancel, otRefetch, refetchCount, refetchApprovedCount, refetchRejectedCount, refetchCancelledCount]);

    useEffect(() => {
        // Check permissions based on active tab
        const shouldFetch =
            activeTab === 'pending' ||
            activeTab === 'failed' ||
            (activeTab === 'approved' && canApprove) ||
            (activeTab === 'rejected' && canReject) ||
            (activeTab === 'cancelled' && canCancel);

        if (shouldFetch) {
            otRefetch();
            refetchCount();
        }

        // Only fetch approved count if approved tab is active and user has permission
        if (activeTab === 'approved' && canApprove) {
            refetchApprovedCount();
        }

        // Only fetch rejected count if rejected tab is active and user has permission
        if (activeTab === 'rejected' && canReject) {
            refetchRejectedCount();
        }

        // Only fetch cancelled count if cancelled tab is active and user has permission
        if (activeTab === 'cancelled' && canCancel) {
            refetchCancelledCount();
        }
    }, [
        activeTab,
        employeeId,
        canApprove,
        canReject,
        canCancel,
        debouncedSearchValue,
        searchField,
        currentPage
    ])

    const handleOpenDetails = (row: any) => {
        if (!row?._id) return;
        setSelectedRequestId(row._id);
        setIsPopupOpen(true);
    };

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    // Pagination calculations
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

    return (
        <div>
            <div className='px-0 py-3'>
                <div className='flex items-center gap-2'>
                    <Clock className='h-5 w-5 text-green-600' />
                    <h1 className='text-lg sm:text-xl font-semibold text-gray-900 tracking-tight'>Approver Dashboard</h1>
                </div>
                <p className='text-xs text-gray-500 mt-0.5'>Review and manage applications assigned to you for approval</p>
            </div>
            <ApplicationFilters
                activeTab={activeTab}
                onTabChange={(tab) => {
                    // Filter out "all" and "applications" tabs since approver view doesn't support them
                    if (tab === 'pending' || tab === 'approved' || tab === 'rejected' || tab === 'cancelled' || tab === 'failed') {
                        setActiveTab(tab);
                    }
                }}
                onApply={({ field, value }) => { setSearchField(field); setSearchValue(value); }}
                isSelfPermission={false}
                isAllPermission={false}
                hideApplicationsTab={true}
                hideApplyButton={true}
                refreshAll={() => {
                    refreshAll();
                }}
            />
            <ApplicationTable
                data={otApplications}
                onOpenDetails={handleOpenDetails}
                externalPagination={{
                    currentPage,
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage,
                    startIndex,
                    endIndex,
                    onPageChange: handlePageChange
                }}
                loading={isLoading}
                userMode="approver"
            />
            <ShiftRequestsPopup
                isOpen={isPopupOpen}
                onClose={() => {
                    setIsPopupOpen(false);
                    setSelectedRequestId(null);
                }}
                selectedRequestId={selectedRequestId}
                initialSelectedRequest={null}
                isSelfPermission={false}
                isAllPermission={false}
                userMode="approver"
                sourceCollectionName={collectionName}
                onActionSuccess={() => {
                    // Refresh list and counts only after successful backend update
                    refreshAll();
                }}
        modeOfRequest="applicationApprover"
            />
        </div>
    )
}

