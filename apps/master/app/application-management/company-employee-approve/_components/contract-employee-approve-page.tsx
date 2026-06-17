"use client";

import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { toast } from "react-toastify";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import PageNotFound from "@/components/page-notfound";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import SecurityPassTable from "./contract-employee-approve-table";
import SidebarFromHeader from "@/components/header/sidebar-from-header";
import SecurityPassFilterBar from "./contract-employee-approve-filter-bar";
import FormController from "./contract-employee-approve-form-controller";
import ContractEmployeeApproveTableFilterPopup from "./contract-employee-approve-table-filter-popup";
import ContractEmployeeApproveApplicationDetail from "./contract-employee-approve-application-detail";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, ExternalLink, ShieldAlert } from "lucide-react";

export default function SecurityPassPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const shouldReopenTableFilter = searchParams.get('popup') === '1'
    const [action, setAction] = useState([]);
    const [subOrganization, setSubOrganization] = useState<any[]>([]);
    const [employeeData, setEmployeeData] = useState<any[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showVerificationPopup, setShowVerificationPopup] = useState(false);
    const [showTableFilterPopup, setShowTableFilterPopup] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [duplicateData, setDuplicateData] = useState<any>([]);
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [filtersApplied, setFiltersApplied] = useState(true) // Keep true so table loads on first render
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [selectedField, setSelectedField] = useState('employeeID')
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const itemsPerPage = 10
    const tenantCode = useGetTenantCode()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

    // Calculate offset and limit based on current page - limit is always 10
    const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage])
    const limit = 10 // Fixed limit of 10 items per page

    const {
        post: postDelete,
        loading: postLoading,
        error: postError,
        data: postData,
      } = usePostRequest<any>({
        url: "company_employee",
        onSuccess: (data) => {
          toast.success("Security pass deleted successfully!");
        },
        onError: (error) => {
          toast.error("Security pass deletion failed!");
          console.error("POST error:", error);
        },
      });

    // Get the mode from URL search params
    const mode = searchParams.get('mode')
    const isViewMode = mode === 'view'
    const isAllMode = mode === 'all'
    const isInvalidMode = mode === 'edit' || mode === 'add'

    // Centralized role-permissions (align with other screens)
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: "hrapprover",
        screenName: "companyEmployeeApprover",
    });
    const editMode = rolePermissions?.approve || false;

    useEffect(() => {
        if (shouldReopenTableFilter && !isViewMode && !isAllMode) {
            setShowTableFilterPopup(true)
        }
    }, [shouldReopenTableFilter, isViewMode, isAllMode])

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

    // Optional: redirect if no view/add/edit permissions
    useEffect(() => {
        if (rolePermissions && !(rolePermissions.view || rolePermissions.edit || rolePermissions.add)) {
            // router.replace('/launchdesk');
        }
    }, [rolePermissions]);

    // Build API criteria array
    const apiCriteria = useMemo(() => {
        const filters: any[] = [
            {
                field: "tenantCode",
                value: tenantCode,
                operator: "eq",
            },
            {
                field: "collectionName",
                value: "company_employee",
                operator: "eq",
            },
            {
                field: "createdOn",
                operator: "desc",
                value: ""
            }
        ]

        // Add search filter if search term exists
        if (debouncedSearchTerm.trim() && filtersApplied) {
            const searchValue = debouncedSearchTerm.trim()
            if (selectedField === 'employeeID') {
                filters.push({
                    field: 'documents.employeeID',
                    operator: "like",
                    value: searchValue
                })
            } else if (selectedField === 'createdOn') {
                filters.push({
                    field: 'createdOn',
                    operator: "like",
                    value: searchValue
                })
            } else if (selectedField === 'status') {
                filters.push({
                    field: 'status',
                    operator: "like",
                    value: searchValue
                })
            }
        }

        return filters
    }, [tenantCode, debouncedSearchTerm, selectedField, filtersApplied])

    // Prepare request data - only include real data when filters are applied
    const countRequestData = useMemo(() => {
        if (!filtersApplied) {
            return [
                { field: "tenantCode", operator: "eq", value: tenantCode || "" },
                { field: "collectionName", operator: "eq", value: "company_employee" },
                { field: "createdOn", operator: "desc", value: "" },
            ]
        }
        return apiCriteria
    }, [filtersApplied, apiCriteria, tenantCode])

    // Prepare request data for search - only include real data when filters are applied
    const searchRequestData = useMemo(() => {
        if (!filtersApplied) {
            return [
                { field: "tenantCode", operator: "eq", value: tenantCode || "" },
                { field: "collectionName", operator: "eq", value: "company_employee" },
                { field: "createdOn", operator: "desc", value: "" },
            ]
        }
        return apiCriteria
    }, [filtersApplied, apiCriteria, tenantCode])

    // Count API call to get total collection length - only process after filters are applied
    const {
        data: countData,
        loading: countLoading,
        error: countError,
        refetch: refetchCount,
    } = useRequest<any>({
        url: 'masterDataApproval/count',
        method: 'POST',
        data: countRequestData,
        onSuccess: (data: any) => {
            if (data !== null && data !== undefined) {
                setTotalCount(data || 0)
            }
        },
        onError: (error: any) => {
            console.error("Error fetching security pass count:", error)
        },
        dependencies: [] // Empty dependencies - requests will only be made via manual refetch
    })

    // Fetch security pass data with pagination - only process after filters are applied
    const {
        data: securityPassResponse,
        loading: isLoadingSecurityPass,
        error: securityPassError,
        refetch: refetchSecurityPass
      } = useRequest<any>({
        url: `masterDataApproval/search?offset=${offset}&limit=${limit}`,
        method: 'POST',
        data: searchRequestData,
        onSuccess: (data) => {
            if (data !== null && data !== undefined) {
                const active = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)
                const getDocuments = (item: any) =>
                    Array.isArray(item?.documents)
                        ? item.documents
                        : Array.isArray(item?.data?.documents)
                          ? item.data.documents
                          : [];
                const joinDocField = (docs: any[], key: "employeeID") =>
                    docs.map((d: any) => d?.[key]).filter(Boolean).join(", ");

                const filteredData = active.map((item: any) => {
                    const docs = getDocuments(item);
                    return {
                        documents: docs,
                        _id: item._id,
                        employeeID:
                            joinDocField(docs, "employeeID") ||
                            item?.employeeID ||
                            item?.data?.employeeID ||
                            item?.data?.EmployeeID?.[0] ||
                            item?.EmployeeID?.[0] ||
                            "",
                        firstName: item?.firstName || item?.data?.firstName || "",
                        lastName: item?.lastName || item?.data?.lastName || "",
                        middleName: item?.middleName || item?.data?.middleName || "",
                        aadharNumber: item?.aadharNumber || item?.data?.aadharNumber || "",
                        createdOn: formatDateTime(item?.createdOn || item?.data?.createdOn),
                        createdBy: item?.createdBy || item?.data?.createdBy || "",
                    };
                });

                const transformedData = active.map((item: any) => {
                    const docs = getDocuments(item);
                    return {
                        _id: item._id,
                        employeeID:
                            joinDocField(docs, "employeeID") ||
                            item?.employeeID ||
                            item?.data?.employeeID ||
                            (Array.isArray(item?.data?.EmployeeID) ? item.data.EmployeeID.join(", ") : item?.data?.EmployeeID) ||
                            (Array.isArray(item?.EmployeeID) ? item.EmployeeID.join(", ") : item?.EmployeeID) ||
                            "",
                        createdOn: formatDateTime(item?.createdOn || item?.data?.createdOn),
                        status: item?.status || item?.workflowState || item?.data?.status || item?.data?.workflowState || "Initiated",
                        uploadedBy: item?.uploadedBy || item?.data?.uploadedBy || item?.createdBy || item?.data?.createdBy || "",
                    };
                });

                const dummyData = active.map((item: any) => {
                    const docs = getDocuments(item);
                    return {
                        _id: item._id,
                        employeeID:
                            joinDocField(docs, "employeeID") ||
                            item?.employeeID ||
                            item?.data?.employeeID ||
                            item?.data?.EmployeeID?.[0] ||
                            item?.EmployeeID?.[0] ||
                            "",
                        aadharNumber: item?.aadharNumber || item?.data?.aadharNumber || "",
                    };
                });

                setDuplicateData(dummyData)
                setSubOrganization(filteredData)
                setEmployeeData(transformedData)
            }
        },
        onError: (error) => {
            console.error("Error fetching security pass data:", error);
            setSubOrganization([])
            setEmployeeData([])
        },
        dependencies: [] // Empty dependencies - requests will only be made via manual refetch
      });

    useEffect(() => {
        if (action && filtersApplied) {
            refetchSecurityPass()
            refetchCount()
        }
    }, [action, mode, filtersApplied])

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    // Track previous values to prevent unnecessary API calls
    const prevPageRef = useRef<number>(1)
    const prevDebouncedSearchRef = useRef<string>('')
    const prevSelectedFieldRef = useRef<string>('employeeID')
    const prevFiltersAppliedRef = useRef<boolean>(false)

    // Initialize page tracking on first enable
    useEffect(() => {
        if (filtersApplied && !prevFiltersAppliedRef.current) {
            setCurrentPage(1)
            prevFiltersAppliedRef.current = true
        }
    }, [filtersApplied])

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

            refetchSecurityPass()
            refetchCount()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, debouncedSearchTerm, selectedField, filtersApplied])

    // Handle add new security pass navigation
    const handleAddNew = useCallback(() => {
        router.push('/security-pass?mode=add')
    }, [router])

    const handleCancelDelete = () => {
        handleCloseDelete();
    };

    // Close modal with Escape key when not loading
    useEffect(() => {
        if (!showDeleteConfirm) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !deleteLoading) {
                handleCloseDelete();
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showDeleteConfirm, deleteLoading])

    useEffect(() => {
        if (!showVerificationPopup) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowVerificationPopup(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showVerificationPopup]);

    // Open/close helpers (mirroring ContractorManagementPage)
    const handleOpenDelete = async (deleteValue: any) => {
        setDeleteError(null);
        setItemToDelete(deleteValue);
        setShowDeleteConfirm(true);
    }

    const handleCloseDelete = () => {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setDeleteError(null);
        setDeleteLoading(false);
    }

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            setDeleteError(null);
            setDeleteLoading(true);
            const payload = itemToDelete;
            const postData = {
                tenant: tenantCode,
                action: "insert",
                id: payload._id,
                collectionName: "company_employee",
                data: {
                    isDeleted: true,
                    ...payload,
                },
            };
            await postDelete(postData);
            setAction(payload._id);
            handleCloseDelete();
            if (filtersApplied) {
                refetchSecurityPass()
                refetchCount()
            }
        } catch (err) {
            console.error("Delete failed", err);
            setDeleteLoading(false);
            setDeleteError("Couldn't fetch record. Please try again after some time.");
        }
    };

    if (isInvalidMode) {
        return <PageNotFound />
    }

    if (isViewMode) {
        if (!editMode) return <PageNotFound />
        return (
            <div className="">
                <FormController />
            </div>
        )
    }

    if (isAllMode) {
        if (!editMode) return <PageNotFound />
        return (
            <ContractEmployeeApproveApplicationDetail
                refId={id}
                permission={rolePermissions}
                onBack={() => router.push("/application-management/ompany-employee-approve")}
            />
        )
    }

    // Otherwise show the table view
    return (
        <>
        {
            (editMode) ? (
                <>
                <div>
            <SidebarFromHeader
                title="Company Employee Approval"
                description="Manage and review company employee applications for HR approval."
                canAdd={false}
                onOpenDraftList={() => setShowTableFilterPopup(true)}
                draftButtonText="Select Employees"
            />
            
            {/* Filter Bar with Search, Filter, and Add New */}
            <SecurityPassFilterBar
                setSearchTerm={setSearchTerm}
                selectedField={selectedField}
                setSelectedField={setSelectedField}
                searchFields={[
                    { value: 'employeeID', label: 'Employee ID' },
                    { value: 'createdOn', label: 'Created On' },
                    { value: 'status', label: 'Status' }
                ]}
                filtersApplied={filtersApplied}
                onFilterClick={() => {}}
                onAddNew={handleAddNew}
                canAdd={editMode}
            />
            
            {employeeData && employeeData.length >= 0 && (
                <SecurityPassTable
                    employeeData={employeeData}
                    loading={isLoadingSecurityPass}
                    currentPage={currentPage}
                    totalCount={totalCount}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onFormView={(employee) => {
                        const employeeIdValue =
                            typeof employee._id === "object" && employee._id && '$oid' in employee._id
                                ? (employee._id as any).$oid
                                : String(employee._id || "")
                        router.push(`/application-management/company-employee-approve?mode=all&id=${employeeIdValue}`)
                    }}
                />
            )}

            {/* Delete Confirmation Popup */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => { if (!deleteLoading) handleCloseDelete() }}>
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
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
                        
                        <div className="mb-4">
                            <p className="text-gray-700">
                            Are you sure you want to delete this security pass? This will permanently remove the record from the system.
                        </p>
                            {deleteLoading && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-3">
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                    Fetching record...
                                </div>
                            )}
                            {deleteError && (
                                <div className="text-sm text-red-600 mt-3">
                                    {deleteError}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deleteLoading}
                                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${deleteLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {deleteLoading ? 'Please wait...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showVerificationPopup && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowVerificationPopup(false)}
                >
                    <div
                        className="bg-transparent w-full max-w-5xl flex flex-col relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowVerificationPopup(false)}
                            className="absolute right-3 top-3 z-20 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 bg-white/90 border border-gray-200"
                            aria-label="Close popup"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        
                    </div>
                </div>
            )}
            <ContractEmployeeApproveTableFilterPopup
                isOpen={showTableFilterPopup}
                onClose={() => setShowTableFilterPopup(false)}
                uploadedBy={loginEmployeeId || ""}
                onSubmitted={() => {
                    refetchSecurityPass()
                    refetchCount()
                }}
                onAction={(employee) => {
                    const employeeIdValue =
                        typeof employee._id === "object" && employee._id && '$oid' in employee._id
                            ? (employee._id as any).$oid
                            : String(employee._id || "")
                    const encryptedData = encryptEmployeeData({
                        employeeId: loginEmployeeId || "",
                        _id: employeeIdValue,
                    })
                    const returnTo = encodeURIComponent("/application-management/company-employee-approve?popup=1")
                    router.push(`/application-management/company-employee-approve?form=temp&mode=view&id=${encryptedData}&returnTo=${returnTo}`)
                }}
            />
        </div>
                </>
            ) : (
                <PageNotFound />
            )
        }
        </>
    );
}

