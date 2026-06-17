"use client";

import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { SecurityPassForm } from "./security-pass-from";
import { toast } from "react-toastify";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import PageNotFound from "@/components/page-notfound";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters";
import StepByStepFilter, { type FilterSelections } from "@/components/common/step-by-step-filter";
import SecurityPassTable from "./security-pass-table";
import SecurityPassHeader from "./security-pass-header";
import SecurityPassFilterBar from "./security-pass-filter-bar";

const transformToUnderscore = (param: string) => {
    return param
        .replace(/-/g, '_') // Replace all hyphens with underscores
        .replace(/([A-Z])/g, '_$1') // Add underscore before capital letters
        .toLowerCase() // Convert to lowercase
        .replace(/^_/, ''); // Remove leading underscore if exists
};

// Function to filter out object values and replace with empty strings
const filterObjectValues = (data: any[]): any[] => {
    return data.map(item => {
        const filteredItem: any = {};
        Object.keys(item).forEach(key => {
            const value = item[key];
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                filteredItem[key] = "";
            } else {
                filteredItem[key] = value;
            }
        });
        return filteredItem;
    });
};

export default function SecurityPassPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const [action, setAction] = useState([]);
    const [subOrganization, setSubOrganization] = useState<any[]>([]);
    const [employeeData, setEmployeeData] = useState<any[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<any>(null);
    const [deleteData, setDeleteData] = useState<any>(null);
    const deleteDataRef = useRef<any>(null);
    useEffect(() => { deleteDataRef.current = deleteData; }, [deleteData]);
    const [duplicateData, setDuplicateData] = useState<any>([]);
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [isFilterOpen, setIsFilterOpen] = useState(true) // Show filter on initial load
    const [filtersApplied, setFiltersApplied] = useState(false) // Track if filters have been applied
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [selectedField, setSelectedField] = useState('employeeID')
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
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
    const tenantCode = useGetTenantCode()
    const { employeeIds: contractEmployeeIds, hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
    const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters)
    
    // Get contract employee IDs
    const allEmployeeIds = useMemo(() => {
        return Array.from(new Set(contractEmployeeIds || [])).filter(Boolean) // Remove duplicates and empty values
    }, [contractEmployeeIds])

    // Calculate offset and limit based on current page - limit is always 10
    const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage])
    const limit = 10 // Fixed limit of 10 items per page

    const {
        post: postDelete,
        loading: postLoading,
        error: postError,
        data: postData,
      } = usePostRequest<any>({
        url: "contract_employee",
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
    const isFormMode = mode === 'edit' || mode === 'add' || mode === 'view'

    const contractorEmployee = "securityPass"

    // Centralized role-permissions (align with other screens)
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: "employeeManagement",
        screenName: contractorEmployee,
    });
    const viewMode = rolePermissions?.view || false;
    const editMode = rolePermissions?.edit || false;
    const addMode = rolePermissions?.add || false;
    const deleteMode = rolePermissions?.delete || false;

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

    // Stable empty request data to prevent unnecessary API calls when filters aren't applied
    const emptyRequestData = useMemo(() => {
        return {
            hierarchyFilters: {},
            criteriaRequests: [
                { field: "tenantCode", operator: "eq", value: tenantCode || "" },
                { field: "createdOn", operator: "desc", value: "" },
            ],
            userEntitlement
        }
    }, [tenantCode, userEntitlement])

    // Convert filter selections to hierarchyFilters format using shared hook
    // Don't include employeeID from filterSelections if we're using search
    const modifiedFilterSelections = useMemo(() => {
        if (debouncedSearchTerm.trim()) {
            // Exclude employeeID when search is active by setting it to empty string
            return {
                ...filterSelections,
                employeeID: ''
            }
        }
        return filterSelections
    }, [filterSelections, debouncedSearchTerm])

    const hierarchyFilters = useHierarchyFilters(modifiedFilterSelections)

    // Build API criteria array
    const apiCriteria = useMemo(() => {
        const filters: any[] = [
            {
                field: "tenantCode",
                value: tenantCode,
                operator: "eq",
            },
            {
                field: "createdOn",
                operator: "desc",
                value: ""
            }
        ]

        // Add employeeID filter if allEmployeeIds is available and not empty
        // if (allEmployeeIds && allEmployeeIds.length > 0) {
        //     filters.push({
        //         field: "employeeID",
        //         value: allEmployeeIds,
        //         operator: "in",
        //     })
        // }

        // Add search filter if search term exists
        if (debouncedSearchTerm.trim() && filtersApplied) {
            // Handle different search fields
            if (selectedField === 'contractorCode') {
                filters.push({
                    field: 'deployment.contractor.contractorCode',
                    operator: "like",
                    value: debouncedSearchTerm.trim()
                })
            } else if (selectedField === 'departmentCode') {
                filters.push({
                    field: 'deployment.department.departmentCode',
                    operator: "like",
                    value: debouncedSearchTerm.trim()
                })
            } else if (selectedField === 'firstName' || selectedField === 'lastName') {
                filters.push({
                    field: selectedField,
                    operator: "like",
                    value: debouncedSearchTerm.trim()
                })
            } else {
                filters.push({
                    field: selectedField,
                    operator: "like",
                    value: debouncedSearchTerm.trim()
                })
            }
        }

        return filters
    }, [tenantCode, allEmployeeIds, debouncedSearchTerm, selectedField, filtersApplied])

    // Prepare request data - only include real data when filters are applied
    const countRequestData = useMemo(() => {
        if (!filtersApplied) {
            // Use stable empty data that doesn't change when apiCriteria changes
            return emptyRequestData
        }
        return {
            hierarchyFilters: hierarchyFilters,
            criteriaRequests: apiCriteria,
            userEntitlement
        }
    }, [filtersApplied, hierarchyFilters, apiCriteria, emptyRequestData, userEntitlement])

    // Prepare request data for search - only include real data when filters are applied
    const searchRequestData = useMemo(() => {
        if (!filtersApplied) {
            // Use stable empty data that doesn't change when apiCriteria changes
            return emptyRequestData
        }
        return {
            hierarchyFilters: hierarchyFilters,
            criteriaRequests: apiCriteria,
            userEntitlement
        }
    }, [filtersApplied, hierarchyFilters, apiCriteria, emptyRequestData, userEntitlement])

    // Count API call to get total collection length - only process after filters are applied
    const {
        data: countData,
        loading: countLoading,
        error: countError,
        refetch: refetchCount,
    } = useRequest<any>({
        url: 'contract_employee/count/searchWithHierarchy',
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
                console.error("Error fetching security pass count:", error)
            }
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
        url: `contract_employee/searchWithHierarchy?offset=${offset}&limit=${limit}`,
        method: 'POST',
        data: searchRequestData,
        onSuccess: (data) => {
            // Only process if filters have been applied
            if (filtersApplied && data !== null && data !== undefined) {
                const active = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)
                
                const filteredData = active.map((item: any) => ({
                    _id: item._id,
                    employeeID: item?.employeeID || "",
                    firstName: item?.firstName || "",
                    lastName: item?.lastName || "",
                    middleName: item?.middleName || "",
                    aadharNumber: item?.aadharNumber || "",
                    contractorCode: item?.deployment?.contractor?.contractorCode || "",
                    createdOn: formatDateTime(item?.createdOn),
                    createdBy: item?.createdBy || "",
                }))

                // Transform data for table display
                const transformedData = active.map((item: any) => ({
                    _id: item._id,
                    employeeID: item?.employeeID || "",
                    firstName: item?.firstName || "",
                    lastName: item?.lastName || "",
                    middleName: item?.middleName || "",
                    photo: item?.photo || "",
                    deployment: item?.deployment || {},
                    workOrder: item?.workOrder || [],
                    policeVerification: item?.policeVerification || [],
                    cards: item?.cards || [],
                }))

                // For duplicateData, we need all records (not just current page)
                // This might need to be fetched separately or cached
                const dummyData = active.map((item: any) => ({
                    _id: item._id,
                    employeeID: item.employeeID,
                    aadharNumber: item.aadharNumber,
                }))

                setDuplicateData(dummyData)
                setSubOrganization(filteredData)
                setEmployeeData(transformedData)
            }
        },
        onError: (error) => {
            // Only log errors if filters have been applied
            if (filtersApplied) {
                console.error("Error fetching security pass data:", error);
                setSubOrganization([])
                setEmployeeData([])
            }
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

    // Reset to page 1 when filters change
    useEffect(() => {
        if (filtersApplied && !prevFiltersAppliedRef.current) {
            setCurrentPage(1)
            prevFiltersAppliedRef.current = true
        }
    }, [filterSelections, filtersApplied])

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

    // Handle filter apply - manually trigger API calls only when Submit/Cancel is clicked
    const handleFilterApply = useCallback((filters: FilterSelections) => {
        setFilterSelections(filters)
        setFiltersApplied(true) // Mark filters as applied
        setIsFilterOpen(false)
        setCurrentPage(1) // Reset to first page when filters change
        // Note: API will be called automatically by the unified useEffect when filtersApplied changes
    }, [])

    // Handle filter change (for real-time updates if needed)
    const handleFilterChange = useCallback((filters: FilterSelections) => {
        setFilterSelections(filters)
    }, [])

    // Handle add new security pass navigation
    const handleAddNew = useCallback(() => {
        router.push('/employee-management/security-pass?mode=add')
    }, [router])


    const {
        data:singleData,
        error:singleError,
        loading:singleLoading,
        refetch:fetchSingleData
    }: {
        data: any;
        error: any;
        loading: any;
        refetch: any;
    } = useRequest<any[]>({
        url: 'contract_employee/search',
        method: 'POST',
        data: [
            {
                field: "_id",
                value: deleteId,
                operator: "eq",
            }
        ],
        onSuccess: (data: any) => {
            setDeleteData(data[0])
        },
        onError: (error: any) => {
            console.error('Error loading security pass data:', error);
        }
    });

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

    // Open/close helpers (mirroring ContractorManagementPage)
    const handleOpenDelete = async (deleteValue: any) => {
        setDeleteError(null);
        setDeleteData(null);
        setItemToDelete(deleteValue);
        setShowDeleteConfirm(true);
        setDeleteLoading(true);
        setDeleteId(deleteValue._id);
        await fetchSingleData();
        const start = Date.now();
        while (Date.now() - start < 2000) {
            if (deleteDataRef.current && deleteDataRef.current._id === deleteValue._id) break;
            await new Promise(r => setTimeout(r, 100));
        }
        setDeleteLoading(false);
    }

    const handleCloseDelete = () => {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setDeleteError(null);
        setDeleteLoading(false);
        setDeleteData(null);
    }

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            // 1) Select item id for fetching only
            setDeleteId(itemToDelete._id);
            // 2) Fetch latest full record and wait until state is populated
            setDeleteError(null);
            setDeleteLoading(true);
            // Ensure state update has flushed before refetch
            await new Promise(r => setTimeout(r, 0));
            await fetchSingleData();
            const waitUntil = async (check: () => boolean, timeoutMs = 5000, intervalMs = 100) => {
                const start = Date.now();
                while (Date.now() - start < timeoutMs) {
                    if (check()) return;
                    await new Promise(r => setTimeout(r, intervalMs));
                }
                throw new Error("Timeout waiting for fetched record");
            };
            await waitUntil(() => !!deleteDataRef.current && deleteDataRef.current._id === itemToDelete._id);
            setDeleteLoading(false);
            const payload = deleteDataRef.current;
            // 3) Build delete request using fetched record only
            const postData = {
                tenant: tenantCode,
                action: "insert",
                id: payload._id,
                collectionName: "contract_employee",
                data: {
                    isDeleted: true,
                    ...payload,
                },
            };
            // 4) Execute delete
            await postDelete(postData);
            // 5) Refresh list and close dialog
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

    // If in form mode, show the EmployeeManagementForm
    if (isFormMode) {
        return (
            <>
                {
                    ((viewMode && mode === "view") || (editMode && mode === "edit") || (addMode && mode === "add")) ? (
                        <div className="px-12 py-4">
                            <SecurityPassForm/>
                        </div>
                    ) : (
                        <PageNotFound />
                    )
                }
            </>
        );
    }

    // Otherwise show the table view
    return (
        <>
        {
            (viewMode || editMode || addMode) ? (
                <>
                <div>
            <SecurityPassHeader
                title="Security Pass"
                description="Manage and review security pass records"
            />
            
            {/* Filter Bar with Search, Filter, and Add New */}
            <SecurityPassFilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedField={selectedField}
                setSelectedField={setSelectedField}
                searchFields={[
                    { value: 'employeeID', label: 'Employee ID' },
                    { value: 'firstName', label: 'First Name' },
                    { value: 'lastName', label: 'Last Name' },
                    { value: 'contractorCode', label: 'Contractor Code' },
                    { value: 'departmentCode', label: 'Department Code' }
                ]}
                filtersApplied={filtersApplied}
                onFilterClick={() => setIsFilterOpen(true)}
                onAddNew={handleAddNew}
                canAdd={addMode}
            />
            
            {employeeData && employeeData.length >= 0 && (
                <SecurityPassTable
                    employeeData={employeeData}
                    loading={isLoadingSecurityPass}
                    currentPage={currentPage}
                    totalCount={totalCount}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onEdit={(employee) => {
                        const encryptedData = encryptEmployeeData({ employeeId: loginEmployeeId || '', _id: employee._id })
                        router.push(`/employee-management/security-pass?mode=edit&id=${encryptedData}`)
                    }}
                    onDelete={handleOpenDelete}
                    onView={(employee) => {
                        const encryptedData = encryptEmployeeData({ employeeId: loginEmployeeId || '', _id: employee._id })
                        router.push(`/employee-management/security-pass?mode=view&id=${encryptedData}`)
                    }}
                    editMode={editMode}
                    deleteMode={deleteMode}
                    viewMode={viewMode}
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
            <StepByStepFilter
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onFilterChange={handleFilterChange}
                onApply={handleFilterApply}
                initialSelections={filterSelections}
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