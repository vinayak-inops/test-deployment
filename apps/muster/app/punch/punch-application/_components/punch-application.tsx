"use client"
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { Clock, Upload } from 'lucide-react';
import EnhancedHeader from './enhanced-header';
import ApplicationTable from './application-table';
import ApplicationFilters from './application-filters';
import PunchRequestsPopupNew from './punch-requests-popup-new';
import PunchFormPopup from '../../_components/punch-form-popup';
import { useGetTenantCode } from '../../../../hooks/useGetTenantCode';
import ApplicationSummaryCards from './application-summary-cards';
import { useKeyclockRoleInfo } from '../../../../hooks/search/keyclock-role-info';
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray';




interface PunchApplicationProps {
    isSelfPermission?: boolean
    isAllPermission?: boolean
    isApprovalPermission?: boolean
}

export default function PunchApplication({ isSelfPermission = false, isAllPermission = false, isApprovalPermission = false }: PunchApplicationProps) {
    const [otApplications, setOtApplications] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'cancelled' | 'applications' | 'failed'>('applications');
    const [searchField, setSearchField] = useState<string>('employeeID');
    const [searchValue, setSearchValue] = useState<string>('');
    const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('');
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState(false);
    const [lastSync, setLastSync] = useState<number>(Date.now());
    const [uptime] = useState<number>(0);
    const [preSelectedEmployeeId, setPreSelectedEmployeeId] = useState<string | undefined>(undefined);
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
    const itemsPerPage = 5;
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
                screenName: 'punch'
            });
            const { responseData: roleApprover } = useRolePermissions({
                serviceName: 'applicationApprover',
                screenName: 'punch'
            });
        const canApprove = !!rolePermissions?.approve || !!roleApprover?.approve;
        const canReject = !!rolePermissions?.reject || !!roleApprover?.reject;
        const canCancel = !!rolePermissions?.cancel || !!roleApprover?.cancel;
    
    // Set preSelectedEmployeeId from storedRoleInfo
    useEffect(() => {
        const id = storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || "";
        setPreSelectedEmployeeId(id || undefined);
    }, [storedRoleInfo]);

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
        // Applications, Pending, and Failed always use forgotPunchApplication
        if (activeTab === 'applications' || activeTab === 'pending' || activeTab === 'failed') {
            return 'forgotPunchApplication'
        }
        // For Cancel, Reject, Approve: check permissions
        if (activeTab === 'cancelled' || activeTab === 'rejected' || activeTab === 'approved') {
            if (isSelfPermission) {
                return 'forgotPunchApplication'
            }
            if (isAllPermission) {
                return 'forgotPunchApplication'
            }
        }
        // Default fallback
        return 'forgotPunchApplication'
    }, [activeTab, isSelfPermission, isAllPermission])

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

        // For applications tab: filter by employeeID (self) or createdBy (all)
        if (activeTab === 'applications' && employeeId) {
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

        // For pending tab: add workflowState with INITIATED, filter by employeeID (self) or createdBy (all)
        if (activeTab === 'pending' && employeeId) {
            // Add workflowState filter with INITIATED using 'like' operator for string search
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

        // For failed tab: same as pending - add workflowState with FAILED, filter by employeeID (self) or createdBy (all)
        if (activeTab === 'failed' && employeeId) {
            // Add workflowState filter with FAILED using 'like' operator for string search
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

        // For approve tab: filter by workflowState and employeeID (self) or approvedBy (all)
        if (activeTab === 'approved' && employeeId) {
            // Add workflowState filter with APPROVED using 'like' operator for string search
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

        // For reject tab: filter by workflowState and employeeID (self) or rejectedBy (all)
        if (activeTab === 'rejected' && employeeId) {
            // Add workflowState filter with REJECTED using 'like' operator for string search
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

        // For cancel tab: filter by workflowState and employeeID (self) or cancelledBy (all)
        if (activeTab === 'cancelled' && employeeId) {
            // Add workflowState filter with CANCELLED using 'like' operator for string search
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
                    employeeID: item.employeeID || "",
                    attendanceDate: item.attendanceDate || "",
                    workflowState: item.workflowState || "",
                    status: item.workflowState || "INITIATED",
                    uploadedBy: item.uploadedBy || "",
                    createdOn: item.createdOn || "",
                    remarks: item.remarks || "",
                    inOut: item.inOut || "",
                    typeOfMovement: item.typeOfMovement || "",
                    punchedTime: item.punchedTime || "",
                    transactionTime: item.transactionTime || "",
                    appliedDate: item.appliedDate || "",
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
            activeTab === 'applications' ||
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
            activeTab === 'applications' ||
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

    const handleAddNew = () => {
        setIsFormOpen(true);
    };

    const handleUpload = () => {
        setIsUploading(true);
        // Simulate upload process
        setTimeout(() => {
            setIsUploading(false);
            setLastSync(Date.now());
        }, 2000);
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
                    <Clock className='h-5 w-5 text-blue-600' />
                    <h1 className='text-lg sm:text-xl font-semibold text-gray-900 tracking-tight'>My Applications</h1>
                </div>
                <p className='text-xs text-gray-500 mt-0.5'>View and manage your application requests</p>
            </div>
            {/* <div className='mb-3'>
                <ApplicationSummaryCards data={otApplications} countsOverride={summaryCounts} />
            </div> */}
            <ApplicationFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onApply={({ field, value }) => { setSearchField(field); setSearchValue(value); }}
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
            <PunchRequestsPopupNew
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
            <PunchFormPopup
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={() => {
                    setIsFormOpen(false);
                    refreshAll();
                }}
                initialValues={{
                    employeeID: preSelectedEmployeeId || "",
                    punchedTime: new Date().toTimeString().slice(0, 5),
                    transactionTime: new Date().toTimeString().slice(0, 5),
                    inOut: "I",
                    typeOfMovement: "",
                    attendanceDate: new Date().toISOString().split("T")[0],
                    remarks: "Manual punch change request",
                }}
                refetch={() => {
                    refreshAll();
                }}
                
            />
        </div>
    )
}