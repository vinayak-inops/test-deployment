"use client";

import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react"
import PageNotFound from "@/components/page-notfound";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy";
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import StepByStepFilter, { type FilterSelections } from "@/components/common/step-by-step-filter";
import ContractorEmployeeHeader from "./contractor-employee-header"
import ContractEmployeeBasicInfoForm, { type ContractEmployeeBasicInfoData } from "./basic-info-from"
import { EmployeeManagementForm } from "./employee-management-form";
import EmployeeMainPage from "./employee-main-page";
import AddContractEmployeeInfoPopup from "./add-contract-employee-info-popup";
import FormController from "./form-controller";

export default function ContractEmployeePage() {
    const searchParams = useSearchParams()
    const modeParam = searchParams.get("mode")
    const formMode=searchParams.get("form")
    const mode: "add" | "edit" | "view" | null =
        modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : null
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [listRefreshToken, setListRefreshToken] = useState(0)
    const [isFilterOpen, setIsFilterOpen] = useState(true) // Show filter on initial load
    const [filtersApplied, setFiltersApplied] = useState(false) // Track if filters have been applied
    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
    const [isAddEmployeeShiftOpen, setIsAddEmployeeShiftOpen] = useState(false)
    const [filterSelections, setFilterSelections] = useState<FilterSelections>({
        subsidiaries: [],
        divisions: [],
        departments: [],
        locations: [],
        contractors: [],
        workOrderNumbers: [],
        employeeID: ''
    })
    const itemsPerPage = 5
    const tenantCode = useGetTenantCode()
    const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
    const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters)
    
    const contractorEmployee = "contractorEmployee"

    // Centralized role-permissions (align with SubOrganizationPage)
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: "user",
        screenName: contractorEmployee,
    });

    const viewMode = rolePermissions?.view || false;
    const editMode = rolePermissions?.edit || false;
    const addMode = rolePermissions?.add || false;
    const deleteMode = rolePermissions?.delete || false;
    const isFormMode = mode !== null;
    const canAccessRequestedMode =
        (mode === "view" && viewMode) ||
        (mode === "edit" && editMode) ||
        (mode === "edit" && addMode && formMode === "temp"); // Only allow 'add' if it's for a temp form

    // Optional: redirect if no view permission
    useEffect(() => {
        if (rolePermissions && !(rolePermissions.view || rolePermissions.edit || rolePermissions.add)) {
            // router.replace('/launchdesk');
        }
    }, [rolePermissions]);

    // Handle filter apply - manually trigger API calls only when Submit/Cancel is clicked
    const handleFilterApply = useCallback((filters: FilterSelections) => {
        setFilterSelections(filters)
        setFiltersApplied(true) // Mark filters as applied
        setIsFilterOpen(false)
    }, [])

    // Handle filter change (for real-time updates if needed)
    const handleFilterChange = useCallback((filters: FilterSelections) => {
        setFilterSelections(filters)
    }, [])

    // Handle add new employee navigation
    const handleAddNew = useCallback(() => {
        setIsAddEmployeeOpen(true)
    }, [])
    const handleAddEmployeeShift = useCallback(() => {
        setIsAddEmployeeShiftOpen(true)
    }, [])

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
        setItemToDelete(deleteValue);
        setShowDeleteConfirm(true);
        setDeleteLoading(false);
    }

    const handleCloseDelete = () => {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setDeleteError(null);
        setDeleteLoading(false);
    }

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        handleCloseDelete();
    };

    // If mode is present in URL, render form only when permission for that mode exists.
    if (isFormMode) {
        if (!canAccessRequestedMode) return <PageNotFound />
        return (
            <div className="px-12">
                <FormController/>
            </div>
        )
    }

    // Show the table view
    return (
        <>
        {
            (viewMode || editMode || addMode) ? (
                <>
        <div>
            <div className="px-12"> 
            <ContractorEmployeeHeader
                title="Contract Employees"
                description="Manage and review contract employee records"
                onRefilter={() => setIsFilterOpen(true)}
                onAddNew={handleAddNew}
                onAddEmployeeShift={handleAddEmployeeShift}
                canAdd={addMode}
            />
            </div>
            <ContractEmployeeBasicInfoForm
                isOpen={isAddEmployeeOpen}
                onClose={() => setIsAddEmployeeOpen(false)}
                initialValues={undefined}
                onSubmit={async (_data: ContractEmployeeBasicInfoData) => {
                    if (filtersApplied) {
                        setListRefreshToken((prev) => prev + 1)
                    }
                    return true
                }}
            />
            <AddContractEmployeeInfoPopup
                isOpen={isAddEmployeeShiftOpen}
                onClose={() => setIsAddEmployeeShiftOpen(false)}
            />
            <EmployeeMainPage
                tenantCode={tenantCode}
                userEntitlement={userEntitlement}
                filterSelections={filterSelections}
                filtersApplied={filtersApplied}
                itemsPerPage={itemsPerPage}
                rolePermissions={{ view: viewMode, edit: editMode, delete: deleteMode }}
                loginEmployeeId={loginEmployeeId}
                onDelete={handleOpenDelete}
            />

            {/* Delete Confirmation Popup */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => { if (!deleteLoading) handleCloseDelete() }}>
                    <div className=" rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
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
                            Are you sure you want to delete this contract employee? This will permanently remove the record from the system.
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
