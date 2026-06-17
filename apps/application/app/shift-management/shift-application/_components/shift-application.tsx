"use client"
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import ApplicationTable from './application-table';
import ApplicationFilters from './application-filters';
import ShiftRequestsPopup from './shift-requests-popup';
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode';
import { useKeyclockRoleInfo } from '@/hooks/api/search/keyclock-role-info';
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray';

interface ShiftApplicationProps {
    isSelfPermission?: boolean
    isAllPermission?: boolean
    isApprovalPermission?: boolean
}

export default function ShiftApplication({ isSelfPermission = false, isAllPermission = false, isApprovalPermission: _isApprovalPermission = false }: ShiftApplicationProps) {
    const [otApplications, setOtApplications] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'failed'>('all');
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
    const collectionName = 'shiftChangeApplication'

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

        // For all tab: filter by employeeID (self) or createdBy (all)
        if (activeTab === 'all' && employeeId) {
            if (isSelfPermission) {
                requestData.push({
                    field: "employeeID",
                    value: employeeId,
                    operator: "eq",
                })
            } else if (isAllPermission) {
                requestData.push({
                    field: "createdBy",
                    value: employeeId,
                    operator: "eq",
                })
            }
        }

        // For pending tab: add workflowState filter, filter by employeeID (self) or createdBy (all)
        if (activeTab === 'pending' && employeeId) {
            requestData.push({
                field: "workflowState",
                value: ["APPROVED", "REJECTED", "CANCELLED", "FAILED"],
                operator: "nin",
            })
            
            if (isSelfPermission) {
                requestData.push({
                    field: "employeeID",
                    value: employeeId,
                    operator: "eq",
                })
            } else if (isAllPermission) {
                requestData.push({
                    field: "createdBy",
                    value: employeeId,
                    operator: "eq",
                })
            }
        }

        // For failed tab: add workflowState with FAILED, filter by employeeID (self) or createdBy (all)
        if (activeTab === 'failed' && employeeId) {
            requestData.push({
                field: "workflowState",
                value: "FAILED",
                operator: "like",
            })
            
            if (isSelfPermission) {
                requestData.push({
                    field: "employeeID",
                    value: employeeId,
                    operator: "eq",
                })
            } else if (isAllPermission) {
                requestData.push({
                    field: "createdBy",
                    value: employeeId,
                    operator: "eq",
                })
            }
        }

        // For approve tab: filter by workflowState and employeeID (self) or createdBy (all)
        if (activeTab === 'approved' && employeeId) {
            requestData.push({
                field: "workflowState",
                value: "APPROVED",
                operator: "eq",
            })
            
            if (isSelfPermission) {
                requestData.push({
                    field: "employeeID",
                    value: employeeId,
                    operator: "eq",
                })
            } else if (isAllPermission) {
                requestData.push({
                    field: "createdBy",
                    value: employeeId,
                    operator: "eq",
                })
            }
        }

        // For reject tab: filter by workflowState and employeeID (self) or createdBy (all)
        if (activeTab === 'rejected' && employeeId) {
            requestData.push({
                field: "workflowState",
                value: "REJECTED",
                operator: "like",
            })
            
            if (isSelfPermission) {
                requestData.push({
                    field: "employeeID",
                    value: employeeId,
                    operator: "eq",
                })
            } else if (isAllPermission) {
                requestData.push({
                    field: "createdBy",
                    value: employeeId,
                    operator: "eq",
                })
            }
        }

        // For cancel tab: filter by workflowState and employeeID (self) or createdBy (all)
        if (activeTab === 'cancelled' && employeeId) {
            requestData.push({
                field: "workflowState",
                value: "CANCELLED",
                operator: "like",
            })
            
            if (isSelfPermission) {
                requestData.push({
                    field: "employeeID",
                    value: employeeId,
                    operator: "eq",
                })
            } else if (isAllPermission) {
                requestData.push({
                    field: "createdBy",
                    value: employeeId,
                    operator: "eq",
                })
            }
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
        isSelfPermission,
        isAllPermission,
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
        // Always refetch main data and count when called (e.g., after form submission)
        otRefetch();
        refetchCount();
        
        // Also refetch status-specific counts if user has permissions
        if (canApprove) {
            refetchApprovedCount();
        }
        if (canReject) {
            refetchRejectedCount();
        }
        if (canCancel) {
            refetchCancelledCount();
        }
    }, [otRefetch, refetchCount, refetchApprovedCount, refetchRejectedCount, refetchCancelledCount, canApprove, canReject, canCancel]);

    useEffect(() => {
        // Check permissions based on active tab
        const shouldFetch =
            activeTab === 'all' ||
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
        isSelfPermission,
        isAllPermission,
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
            <ApplicationFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onApply={({ field, value }) => { setSearchField(field); setSearchValue(value); }}
                otRefetch={otRefetch}
                isSelfPermission={isSelfPermission}
                isAllPermission={isAllPermission}
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
                userMode="user"
            />
            <ShiftRequestsPopup
                isOpen={isPopupOpen}
                onClose={() => {
                    setIsPopupOpen(false);
                    setSelectedRequestId(null);
                }}
                selectedRequestId={selectedRequestId}
                initialSelectedRequest={null}
                isSelfPermission={isSelfPermission}
                isAllPermission={isAllPermission}
                userMode="user"
                onActionSuccess={() => {
                    // Refresh list and counts only after successful backend update
                    refreshAll();
                }}
                modeOfRequest="applicationApplier"
            />
        </div>
    )
}
