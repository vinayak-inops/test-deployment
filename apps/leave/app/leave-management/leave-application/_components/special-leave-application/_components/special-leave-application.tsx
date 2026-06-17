"use client"
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { Clock } from 'lucide-react';
import ApplicationTable from './application-table';
import ApplicationFilters from './application-filters';
import SpecialLeaveRequestsPopup from './special-leave-requests-popup';
import { useGetTenantCode } from '@/hooks/api/serach/useGetTenantCode';
import ApplicationSummaryCards from './application-summary-cards';
import { useKeyclockRoleInfo } from '@/hooks/search/keyclock-role-info';
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray';

interface SpecialLeaveApplicationProps {
    isSelfPermission?: boolean
    isAllPermission?: boolean
    isApprovalPermission?: boolean
}

export default function SpecialLeaveApplication({ isSelfPermission = false, isAllPermission = false, isApprovalPermission = false }: SpecialLeaveApplicationProps) {
    const [otApplications, setOtApplications] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'failed'>('all');
    const [searchField, setSearchField] = useState<string>('employeeID');
    const [searchValue, setSearchValue] = useState<string>('');
    const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('');
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
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
                screenName: 'specialLeave'
            });
            const { responseData: roleApprover } = useRolePermissions({
                serviceName: 'applicationApprover',
                screenName: 'specialLeave'
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

    // Determine which collection to use
    const collectionName = useMemo(() => {
        return 'specialLeaveApplication'
    }, [])

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

        // For cancel tab: filter by workflowState and employeeID (self) or createdBy (all)
        if (activeTab === 'cancelled' && employeeId) {
            requestData.push({
                field: "workflowState",
                value: ["CANCELLED", "CANCEL"],
                operator: "in",
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
                    uploadedBy: item.uploadedBy || "",
                    createdOn: item.createdOn || "",
                    employeeID: item.employeeID || "",
                    fromDate: item.fromDate || "",
                    toDate: item.toDate || "",
                    workflowState: item.workflowState || "INITIATED",
                    appliedDate: item.appliedDate || "",
                    remarks: item.remarks || "",
                }))
            setOtApplications(updatedData)
        },
        onError: (error: any) => {
            console.error("Error fetching applications:", error);
        },
    });

    // Update summary counts when count data changes
    useEffect(() => {
        const pendingCount = totalCount - (approvedCountData || 0) - (rejectedCountData || 0) - (cancelledCountData || 0);
        setSummaryCounts({
            total: totalCount || 0,
            approved: approvedCountData || 0,
            rejected: rejectedCountData || 0,
            cancelled: cancelledCountData || 0,
            pending: pendingCount > 0 ? pendingCount : 0
        });
    }, [totalCount, approvedCountData, rejectedCountData, cancelledCountData]);

    useEffect(() => {
        otRefetch()
        refetchCount()
        refetchApprovedCount()
        refetchRejectedCount()
        refetchCancelledCount()
    }, [isPopupOpen, isFormOpen])

    const handleOpenDetails = useCallback((row: any) => {
        if (!row?._id) return;
        setSelectedRequestId(row._id);
        setIsPopupOpen(true);
    }, []);

    return (
        <div>
            <div className='px-0 py-3'>
                <div className='flex items-center gap-2'>
                    <Clock className='h-5 w-5 text-blue-600' />
                    <h1 className='text-lg sm:text-xl font-semibold text-gray-900 tracking-tight'>Leave Applications of Leave of Absence</h1>
                </div>
                <p className='text-xs text-gray-500 mt-0.5'>View and manage special leave applications</p>
            </div>
            {/* <div className='mb-3'>
                <ApplicationSummaryCards data={otApplications} countsOverride={summaryCounts} />
            </div> */}
            <ApplicationFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onApply={({ field, value }) => { setSearchField(field); setSearchValue(value); }}
                otRefetch={otRefetch}
                isSelfPermission={isSelfPermission}
                isAllPermission={isAllPermission}
            />
            <ApplicationTable 
                data={otApplications} 
                onOpenDetails={handleOpenDetails}
                loading={isLoading}
                externalPagination={{
                    currentPage,
                    totalPages: Math.ceil(totalCount / itemsPerPage),
                    totalItems: totalCount,
                    itemsPerPage,
                    startIndex: offset,
                    endIndex: offset + otApplications.length,
                    onPageChange: setCurrentPage
                }}
            />
            <SpecialLeaveRequestsPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                selectedRequestId={selectedRequestId}
                initialSelectedRequest={null}
                isSelfPermission={isSelfPermission}
                isAllPermission={isAllPermission}
                userMode="user"
                sourceCollectionName={collectionName}
                onActionSuccess={() => {
                    otRefetch()
                    refetchCount()
                    refetchApprovedCount()
                    refetchRejectedCount()
                    refetchCancelledCount()
                }}
                modeOfRequest="applicationApplier"
            />
        </div>
    )
}