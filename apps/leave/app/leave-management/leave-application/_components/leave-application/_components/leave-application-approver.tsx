"use client"
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { Clock } from 'lucide-react';
import ApplicationTable from './application-table';
import ApplicationFilters from './application-filters';
import LeaveApplicationRequestsPopup from './leave-requests-popup';
import { useGetTenantCode } from '@/hooks/api/serach/useGetTenantCode';
import { useKeyclockRoleInfo } from '@/hooks/search/keyclock-role-info';
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray';

interface LeaveApplicationApproverProps {
    isApprovalPermission?: boolean
}

export default function LeaveApplicationApprover({ isApprovalPermission = false }: LeaveApplicationApproverProps) {
    const [otApplications, setOtApplications] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'cancelled' | 'all' | 'failed'>('pending');
    const [searchField, setSearchField] = useState<string>('employeeID');
    const [searchValue, setSearchValue] = useState<string>('');
    const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('');
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [summaryCounts, setSummaryCounts] = useState({
        total: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        pending: 0
    });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
            screenName: 'leave'
        });
        const { responseData: roleApprover } = useRolePermissions({
            serviceName: 'applicationApprover',
            screenName: 'leave'
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

    // Determine which collection to use based on activeTab
    const collectionName = useMemo(() => {
        // Pending and Failed always use leaveApplication
        if (activeTab === 'pending' || activeTab === 'failed') {
            return 'leaveApplication'
        }
        // For Cancel, Reject, Approve: use leaveApplication (same collection)
        if (activeTab === 'cancelled' || activeTab === 'rejected' || activeTab === 'approved') {
            return 'leaveApplicationTransaction'
        }
        // Default fallback
        return 'leaveApplication'
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

        // For failed tab: add workflowState with FAILED, filter by approverID
        if (activeTab === 'failed' && employeeId) {
            // Add workflowState filter with FAILED using 'like' operator for string search
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
        canApprove,
        canReject,
        canCancel,
        debouncedSearchValue,
        searchField
    ])

    // Count API call to get total count
    const {
        data: countData,
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
        onError: (error: any) => {
            console.error("Error fetching count:", error);
        },
    });

    // Status-specific counts
    const { data: approvedCountData, refetch: refetchApprovedCount } = useRequest<number>({
        url: `${collectionName}/count`,
        method: 'POST',
        data: [...buildRequestData, { field: "workflowState", operator: "eq", value: "APPROVED" }],
    });

    const { data: rejectedCountData, refetch: refetchRejectedCount } = useRequest<number>({
        url: `${collectionName}/count`,
        method: 'POST',
        data: [...buildRequestData, { field: "workflowState", operator: "eq", value: "REJECTED" }],
    });

    const { data: cancelledCountData, refetch: refetchCancelledCount } = useRequest<number>({
        url: `${collectionName}/count`,
        method: 'POST',
        data: [...buildRequestData, { field: "workflowState", operator: "in", value: ["CANCELLED", "CANCEL"] }],
    });

    // Fetch applications data with pagination
    const {
        data: otApplication,
        loading: isLoading,
        refetch: otRefetch
    }: {
        data: any;
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
                    uploadedBy: item.uploadedBy || "",
                    createdOn: item.createdOn || "",
                    employeeID: item.employeeID || "",
                    fromDate: item.fromDate || "",
                    toDate: item.toDate || "",
                    uploadTime: item.uploadTime || "",
                    appliedDate: item.appliedDate || "",
                    workflowState: item.workflowState || "INITIATED",
                    remarks: item.remarks || "",
                }))

            setOtApplications([...updatedData])
        },
        onError: (error: any) => {
            console.error("Error fetching applications:", error);
        }
    });

    // Helper to refresh all server data (list + counts)
    const refreshAll = () => {
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
    };

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

    // Update summary counts when any count response changes
    useEffect(() => {
        const total = countData || 0;
        const approved = approvedCountData || 0;
        const rejected = rejectedCountData || 0;
        const cancelled = cancelledCountData || 0;
        const pending = Math.max(0, total - (approved + rejected + cancelled));
        setSummaryCounts({ total, approved, rejected, cancelled, pending });
    }, [countData, approvedCountData, rejectedCountData, cancelledCountData])

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
                <p className='text-xs text-gray-500 mt-0.5'>Review and manage leave applications assigned to you for approval</p>
            </div>
            <ApplicationFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onApply={({ field, value }) => { setSearchField(field); setSearchValue(value); }}
                otRefetch={refreshAll}
                hideApplicationsTab={true}
                hideApplyButton={true}
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
            />
            <LeaveApplicationRequestsPopup
                isOpen={isPopupOpen}
                onClose={() => {
                    setIsPopupOpen(false);
                    setSelectedRequestId(null);
                }}
                selectedRequestId={selectedRequestId}
                initialSelectedRequest={null}
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

