"use client"
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { Clock } from 'lucide-react';
import ApplicationTable from './application-table';
import ApplicationFilters from './application-filters';
import CompoffRequestsPopup from './compoff-requests-popup';
import { useGetTenantCode } from '@/hooks/api/serach/useGetTenantCode';
import { useKeyclockRoleInfo } from '../../../../hooks/search/keyclock-role-info';
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray';

interface CompoffApplicationProps {
    isSelfPermission?: boolean
    isAllPermission?: boolean
    isApprovalPermission?: boolean
}

export default function CompoffApplication({ isSelfPermission = false, isAllPermission = false, isApprovalPermission: _isApprovalPermission = false }: CompoffApplicationProps) {
    const [applications, setApplications] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'failed'>('all');
    const [searchField, setSearchField] = useState<string>('employeeID');
    const [searchValue, setSearchValue] = useState<string>('');
    const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('');
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const tenantCode = useGetTenantCode()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

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

    const employeeId = loginEmployeeId || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || ""

    // Get role permissions for approve/reject/cancel
            const { responseData: rolePermissions } = useRolePermissions({
                serviceName: 'applicationApplier',
                screenName: 'compOff'
            });
            const { responseData: roleApprover } = useRolePermissions({
                serviceName: 'applicationApprover',
                screenName: 'compOff'
            });
        const canApprove = !!rolePermissions?.approve || !!roleApprover?.approve;
        const canReject = !!rolePermissions?.reject || !!roleApprover?.reject;
        const canCancel = !!rolePermissions?.cancel || !!roleApprover?.cancel;
    
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearchValue(searchValue);
            setCurrentPage(1);
        }, 300);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchValue]);

    const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
    const limit = itemsPerPage;

    const collectionName = 'leaveApplication'

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
            },
            {
                field: "workflowName",
                value: "compOff Application",
                operator: "eq",
            },
        ]

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
        onError: (error: any) => {
            console.error("Error fetching count:", error);
        },
    });

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

    const {
        loading: isLoading,
        refetch: refetchApplications
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
            if (!data || !Array.isArray(data)) {
                setApplications([])
                return
            }

            const updatedData = data
                .filter((item: any) => item && typeof item === 'object' && Object.keys(item).length > 0)
                .map((item: any) => ({
                    _id: item._id || "",
                    employeeID: item.employeeID || "",
                    fromDate: item.fromDate || "",
                    toDate: item.toDate || "",
                    fromDuration: item.fromDuration || "",
                    toDuration: item.toDuration || "",
                    availForDates: item.availForDates || [],
                    workflowState: item.workflowState || "INITIATED",
                    uploadedBy: item.uploadedBy || item.createdBy || "",
                    createdOn: item.createdOn || "",
                    remarks: item.remarks || "",
                }))

            setApplications([...updatedData])
        },
        onError: (error: any) => {
            console.error("Error fetching applications:", error);
        }
    });

    const refreshAll = useCallback(() => {
        const shouldFetch =
            activeTab === 'all' ||
            activeTab === 'pending' ||
            activeTab === 'failed' ||
            (activeTab === 'approved' && canApprove) ||
            (activeTab === 'rejected' && canReject) ||
            (activeTab === 'cancelled' && canCancel);

        if (shouldFetch) {
            refetchApplications();
            refetchCount();
        }

        if (activeTab === 'approved' && canApprove) {
            refetchApprovedCount();
        }

        if (activeTab === 'rejected' && canReject) {
            refetchRejectedCount();
        }

        if (activeTab === 'cancelled' && canCancel) {
            refetchCancelledCount();
        }
    }, [activeTab, canApprove, canReject, canCancel, refetchApplications, refetchCount, refetchApprovedCount, refetchRejectedCount, refetchCancelledCount]);

    useEffect(() => {
        const shouldFetch =
            activeTab === 'all' ||
            activeTab === 'pending' ||
            activeTab === 'failed' ||
            (activeTab === 'approved' && canApprove) ||
            (activeTab === 'rejected' && canReject) ||
            (activeTab === 'cancelled' && canCancel);

        if (shouldFetch) {
            refetchApplications();
            refetchCount();
        }

        if (activeTab === 'approved' && canApprove) {
            refetchApprovedCount();
        }

        if (activeTab === 'rejected' && canReject) {
            refetchRejectedCount();
        }

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

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

    return (
        <div className='pb-3'>
            <div className='px-0 pt-6 pb-3'>
                <div className='flex items-center gap-2'>
                    <Clock className='h-5 w-5 text-blue-600' />
                    <h1 className='text-lg sm:text-xl font-semibold text-gray-900 tracking-tight'>Comp Off Applications</h1>
                </div>
                <p className='text-xs text-gray-500 mt-0.5'>View and manage compensatory off requests</p>
            </div>
            <ApplicationFilters
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onApply={({ field, value }) => { setSearchField(field); setSearchValue(value); }}
                otRefetch={refreshAll}
                isSelfPermission={isSelfPermission}
                isAllPermission={isAllPermission}
            />
            <ApplicationTable
                data={applications}
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
            <CompoffRequestsPopup
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
                    refreshAll();
                }}
                modeOfRequest="applicationApplier"
            />
        </div>
    )
}
