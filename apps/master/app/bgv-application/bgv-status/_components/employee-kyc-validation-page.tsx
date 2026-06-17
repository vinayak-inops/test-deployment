"use client";

import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { toast } from "react-toastify";
import PageNotFound from "@/components/page-notfound";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy";
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters";
import StepByStepFilter, { type FilterSelections } from "@/components/common/step-by-step-filter";
import EmployeeKycValidationHeader from "./employeeKyc-validation-header";
import EmployeeKycValidationFilterBar from "./employee-kyc-validation-filterBar";
import EmployeeKycValidationTable from "./employee-kyc-validation-table";
import EmployeeKycValidationPopup from "./employee-kyc-validation-popup-props";

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function EmployeeKycValidationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Row state
  const [rows, setRows] = useState<any[]>([]);
  const [fullRows, setFullRows] = useState<any[]>([]);

  // Delete confirm dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // View Popup state
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Permissions
  const [viewMode, setViewMode] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [addMode, setAddMode] = useState<boolean>(false);
  const [deleteMode, setDeleteMode] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Filters
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [filterSelections, setFilterSelections] = useState<FilterSelections>({
    subsidiaries: [],
    divisions: [],
    departments: [],
    locations: [],
    contractors: [],
    workOrderNumbers: [],
    employeeID: '',
  });

  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('employeeID');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hooks
  const tenantCode = useGetTenantCode();
  const { employeeIds, hierarchyFilters: empHierarchyFilters } = useEmpHierarchy();
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo();
  const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters);

  const allEmployeeIds = useMemo(
    () => Array.from(new Set(employeeIds || [])).filter(Boolean),
    [employeeIds]
  );

  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
  const limit = 10;

  const screenName = "employeeKycValidation";

  // Role permissions
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "bgm",
    screenName,
  });

  useEffect(() => {
    setViewMode(rolePermissions?.view || false);
    setEditMode(rolePermissions?.edit || false);
    setAddMode(rolePermissions?.add || false);
    setDeleteMode(rolePermissions?.delete || false);
  }, [rolePermissions]);

  // Debounce search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      debounceTimerRef.current = null;
    }, 400);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchTerm]);

  const formatDateTime = (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Stable empty request data (used before filters are applied)
  const emptyRequestData = useMemo(
    () => ({
      hierarchyFilters: {},
      criteriaRequests: [
        { field: 'tenantCode', operator: 'eq', value: tenantCode || '' },
        { field: 'createdOn', operator: 'desc', value: '' },
      ],
      userEntitlement,
    }),
    [tenantCode, userEntitlement]
  );

  // Strip employeeID from filter selections when search is active
  const modifiedFilterSelections = useMemo(() => {
    if (debouncedSearchTerm.trim()) {
      return { ...filterSelections, employeeID: '' };
    }
    return filterSelections;
  }, [filterSelections, debouncedSearchTerm]);

  const hierarchyFilters = useHierarchyFilters(modifiedFilterSelections);

  // Build criteria array
  const apiCriteria = useMemo(() => {
    const filters: any[] = [
      { field: 'tenantCode', value: tenantCode, operator: 'eq' },
      { field: 'createdOn', operator: 'desc', value: '' },
    ];

    if (debouncedSearchTerm.trim() && filtersApplied) {
      filters.push({
        field: selectedField,
        operator: 'like',
        value: debouncedSearchTerm.trim(),
      });
    }

    return filters;
  }, [tenantCode, debouncedSearchTerm, selectedField, filtersApplied]);

  const requestData = useMemo(() => {
    if (!filtersApplied) return emptyRequestData;
    return { hierarchyFilters, criteriaRequests: apiCriteria, userEntitlement };
  }, [filtersApplied, hierarchyFilters, apiCriteria, emptyRequestData, userEntitlement]);

  // Delete hook
  const { post: postDelete } = usePostRequest<any>({
    url: 'employee_kyc_validation',
    onSuccess: () => toast.success('KYC record removed'),
    onError: (e) => {
      toast.error('Delete failed');
      console.error(e);
    },
  });

  // Count API
  const { refetch: refetchCount } = useRequest<any>({
    url: 'employee_kyc_validation/count/searchWithHierarchy',
    method: 'POST',
    data: requestData,
    onSuccess: (data: any) => {
      if (filtersApplied && data !== null && data !== undefined) {
        setTotalCount(data || 0);
      }
    },
    onError: (error: any) => {
      if (filtersApplied) console.error('Error fetching KYC count:', error);
    },
    dependencies: [],
  });

  // Data API
  const { loading, refetch } = useRequest<any[]>({
    url: `employee_kyc_validation/searchWithHierarchy?offset=${offset}&limit=${limit}`,
    method: 'POST',
    data: requestData,
    onSuccess: (data) => {
      if (filtersApplied && data !== null && data !== undefined) {
        const active = (Array.isArray(data) ? data : []).filter(
          (item: any) => item?.isDeleted !== true
        );
        setFullRows(active);

        const transformed = active.map((r: any) => ({
          _id: r._id,
          employeeID: r.employeeID,
          systemFirstName: r.systemFirstName,
          systemMiddleName: r.systemMiddleName,
          systemLastName: r.systemLastName,
          systemPanNumber: r.systemPanNumber,
          systemUanNumber: r.systemUanNumber,
          equalPanStatus: r.equalPanStatus,
          equalUanStatus: r.equalUanStatus,
          equalAadharStatus: r.equalAadharStatus,
          aadharNameVerificationResult: r.aadharNameVerificationResult,
          panVerificationMessage: r.panVerificationMessage,
          uanVerificationMessage: r.uanVerificationMessage,
          aadharVerificationMessage: r.aadharVerificationMessage,
          createdOn: formatDateTime(r.createdOn),
          createdBy: r.createdBy,
          // Additional fields for popup
          tenantCode: r.tenantCode,
          mobileNumber: r.mobileNumber,
          equalLegalCheckStatus: r.equalLegalCheckStatus,
          equalRiskScore: r.equalRiskScore,
          isPanMatched: r.isPanMatched,
          isAadharNameMatched: r.isAadharNameMatched,
          panMatchStatus: r.panMatchStatus,
          uanMatchStatus: r.uanMatchStatus,
        }));

        setRows(transformed);
      }
    },
    onError: (error) => {
      if (filtersApplied) {
        console.error('Error fetching KYC data:', error);
        setRows([]);
        setFullRows([]);
      }
    },
    dependencies: [],
  });

  const handlePageChange = useCallback((page: number) => setCurrentPage(page), []);

  // Track prev values to prevent duplicate calls
  const prevPageRef = useRef<number>(1);
  const prevDebouncedSearchRef = useRef<string>('');
  const prevSelectedFieldRef = useRef<string>('employeeID');
  const prevFiltersAppliedRef = useRef<boolean>(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (filtersApplied && !prevFiltersAppliedRef.current) {
      setCurrentPage(1);
      prevFiltersAppliedRef.current = true;
    }
  }, [filterSelections, filtersApplied]);

  useEffect(() => {
    if (filtersApplied && debouncedSearchTerm !== prevDebouncedSearchRef.current) {
      setCurrentPage(1);
      prevDebouncedSearchRef.current = debouncedSearchTerm;
    }
  }, [debouncedSearchTerm, filtersApplied]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevPageRef.current = currentPage;
      prevDebouncedSearchRef.current = debouncedSearchTerm;
      prevSelectedFieldRef.current = selectedField;
      prevFiltersAppliedRef.current = filtersApplied;
      return;
    }

    if (!filtersApplied) return;
    if (debounceTimerRef.current) return;

    const pageChanged = currentPage !== prevPageRef.current;
    const searchChanged = debouncedSearchTerm !== prevDebouncedSearchRef.current;
    const fieldChanged = selectedField !== prevSelectedFieldRef.current;
    const filtersJustApplied = filtersApplied && !prevFiltersAppliedRef.current;

    if (pageChanged || searchChanged || fieldChanged || filtersJustApplied) {
      prevPageRef.current = currentPage;
      prevDebouncedSearchRef.current = debouncedSearchTerm;
      prevSelectedFieldRef.current = selectedField;
      prevFiltersAppliedRef.current = filtersApplied;

      refetch();
      refetchCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm, selectedField, filtersApplied]);

  const handleFilterApply = useCallback((filters: FilterSelections) => {
    setFilterSelections(filters);
    setFiltersApplied(true);
    setIsFilterOpen(false);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((filters: FilterSelections) => {
    setFilterSelections(filters);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const original = fullRows.find((o: any) => o._id === itemToDelete._id) || itemToDelete;
    const postData = {
      tenant: tenantCode,
      action: 'insert',
      id: original._id,
      collectionName: 'employee_kyc_validation',
      data: { isDeleted: true, ...original },
    };
    await postDelete(postData);
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    if (filtersApplied) {
      refetch();
      refetchCount();
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleViewRecord = useCallback((record: any) => {
    // Get the full record with all fields
    const original = fullRows.find((o: any) => o._id === record._id) || record;
    setSelectedRecord(original);
    setShowViewPopup(true);
  }, [fullRows]);

  const handleCloseViewPopup = useCallback(() => {
    setShowViewPopup(false);
    setSelectedRecord(null);
  }, []);

  return (
    <>
      {viewMode || editMode || addMode ? (
        <div>
          <EmployeeKycValidationHeader
            title="Employee KYC Validation"
            description="Manage and review employee KYC verification records"
          />

          <EmployeeKycValidationFilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedField={selectedField}
            setSelectedField={setSelectedField}
            searchFields={[
              { value: 'employeeID', label: 'Employee ID' },
              { value: 'systemFirstName', label: 'First Name' },
              { value: 'systemPanNumber', label: 'PAN Number' },
              { value: 'systemUanNumber', label: 'UAN Number' },
              { value: 'equalPanStatus', label: 'PAN Status' },
              { value: 'equalUanStatus', label: 'UAN Status' },
              { value: 'equalAadharStatus', label: 'Aadhaar Status' },
            ]}
            filtersApplied={filtersApplied}
            onFilterClick={() => setIsFilterOpen(true)}
            onAddNew={() => {
              // Wire to form if needed
            }}
            canAdd={addMode}
          />

          {rows && rows.length >= 0 && (
            <EmployeeKycValidationTable
              kycData={rows}
              loading={loading}
              currentPage={currentPage}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onEdit={(record) => {
                const original = fullRows.find((o: any) => o._id === record._id);
                if (original) {
                  // Open edit form with `original`
                  console.log('Edit:', original);
                }
              }}
              onDelete={(record) => {
                setItemToDelete(record);
                setShowDeleteConfirm(true);
              }}
              onView={(record) => {
                handleViewRecord(record);
              }}
              editMode={editMode}
              deleteMode={deleteMode}
              viewMode={viewMode}
            />
          )}

          {/* KYC Validation View Popup */}
          <EmployeeKycValidationPopup
            isOpen={showViewPopup}
            onClose={handleCloseViewPopup}
            data={selectedRecord}
            title="Employee KYC Validation Details"
          />

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                    <p className="text-sm text-gray-500">This action cannot be undone.</p>
                  </div>
                </div>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this KYC validation record?
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                  >
                    Delete
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
      ) : (
        <PageNotFound />
      )}
    </>
  );
}