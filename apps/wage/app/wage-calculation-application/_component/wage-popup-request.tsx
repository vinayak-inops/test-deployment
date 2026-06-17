"use client";

import { useState, useEffect, useMemo } from "react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useQuery, gql } from "@apollo/client";
import { client } from "@repo/ui/hooks/api/dynamic-graphql";
import {
  Clock,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Filter,
  Search as SearchIcon,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";

import AutoStatusUpdate from "@/app/_components/auto-stutues-update";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy";
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info";
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement";

interface WageApplicationRequest {
  id: string;
  employeeIDList?: string[];
  uploadedBy?: string;
  appliedDate?: string;
  remarks?: string;
  month?: number;
  year?: number;
  workflowState?: string;
  organizationCode?: string;
  tenantCode?: string;
  comment?: string;
  createdOn?: string;
  workflowName?: string;
  stateEvent?: string;
  isDeleted?: boolean;
  // role-based info for select all
  selectAll?: boolean;
  designation?: { designationCode: string; designationName: string }[];
  grade?: { gradeCode: string; gradeName: string }[];
  employeeCategory?: string[];
}

interface WageRequestsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedRequest?: WageApplicationRequest | null;
  selectedRequestId?: string | null;
}

function mapBackendToWageRequest(item: any): WageApplicationRequest {
  const applied = item.appliedDate ? new Date(item.appliedDate) : null;
  const month = applied ? applied.getMonth() + 1 : undefined;
  const year = applied ? applied.getFullYear() : undefined;

  return {
    id: item._id,
    uploadedBy: item.uploadedBy || "",
    employeeIDList: Array.isArray(item.employeeIDList) ? item.employeeIDList : [],
    appliedDate: item.appliedDate || "",
    remarks: item.remarks || "",
    month,
    year,
    workflowState: item.workflowState,
    organizationCode: item.organizationCode || "",
    tenantCode: item.tenantCode || "",
    comment: item.comment || "",
    createdOn: item.createdOn,
    workflowName: item.workflowName || "WageCalculation Application",
    stateEvent: item.stateEvent,
    isDeleted: item.isDeleted,
    selectAll: !!item.selectAll,
    designation: Array.isArray(item.designation) ? item.designation.map((d: any) =>
      typeof d === 'string' ? { designationCode: d, designationName: d } : { designationCode: d.designationCode || '', designationName: d.designationName || '' }
    ) : (item.designation?.designationCode ? [{ designationCode: item.designation.designationCode, designationName: item.designation.designationName || item.designation.designationCode }] : []),
    grade: Array.isArray(item.grade) ? item.grade.map((g: any) =>
      typeof g === 'string' ? { gradeCode: g, gradeName: g } : { gradeCode: g.gradeCode || '', gradeName: g.gradeName || '' }
    ) : [],
    employeeCategory: Array.isArray(item.employeeCategory) ? item.employeeCategory : [],
  };
}

export default function WageRequestsPopup({
  isOpen,
  onClose,
  initialSelectedRequest,
  selectedRequestId,
}: WageRequestsPopupProps) {
  const [selectedRequest, setSelectedRequest] = useState<WageApplicationRequest | null>(
    initialSelectedRequest || null
  );
  const [punchRequests, setPunchRequests] = useState<WageApplicationRequest[]>([]);
  const [statusAction, setStatusAction] = useState<
    "cancel" | "reject" | "approve" | null
  >(null);
  const [statusComment, setStatusComment] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [selectedField, setSelectedField] = useState<'employeeID'>('employeeID');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  // Select-All view states
  const [selectAllSearch, setSelectAllSearch] = useState("");
  const [debouncedSelectAllSearch, setDebouncedSelectAllSearch] = useState("");
  const [selectAllPage, setSelectAllPage] = useState(1);
  const selectAllPageSize = 5;
  const [selectAllEmployees, setSelectAllEmployees] = useState<any[]>([]);
  const [selectAllTotal, setSelectAllTotal] = useState<number | null>(null);
  const [designationSearch, setDesignationSearch] = useState("");
  const [gradeSearch, setGradeSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [designationPage, setDesignationPage] = useState(1);
  const [gradePage, setGradePage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const rolePageSize = 5;
  const tenantCode = useGetTenantCode();
  const { hierarchyFilters } = useEmpHierarchy();
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo();
  const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters);

  // Role permissions (approve/reject/cancel)
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "wageCalculationApplication",
    screenName: "wageCalculationApplication",
  });
  const canApprove = !!(rolePermissions as any)?.wageCalculationApplicationsApprove;
  const canReject = !!(rolePermissions as any)?.wageCalculationApplicationsReject;
  const canCancel = !!(rolePermissions as any)?.wageCalculationApplicationsCancel;

  // Build request data based on selectedRequestId
  const buildRequestData = useMemo(() => {
    if (selectedRequestId) {
      return [
        {
          field: "tenantCode",
          operator: "eq",
          value: tenantCode,
        },
        {
          field: "_id",
          operator: "eq",
          value: selectedRequestId,
        },
      ];
    }
    return [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode,
      },
    ];
  }, [selectedRequestId, tenantCode]);

  const {
    data: attendanceResponse,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance,
  } = useRequest<any>({
    url: "wageCalculationApplication/search",
    method: "POST",
    data: buildRequestData,
    onSuccess: (data) => {},
    onError: (error) => {
      console.error("Error fetching wage data:", error);
    },
    dependencies: [selectedRequestId],
  });

  const {
    post: postShiftZone,
  } = usePostRequest<any>({
    url: "wageCalculationApplication",
    onSuccess: (data) => {},
    onError: (error) => {
      console.error("POST error:", error);
    },
  });

  useEffect(() => {
    if (attendanceResponse && Array.isArray(attendanceResponse)) {
      const mappedRequests = attendanceResponse.map(mapBackendToWageRequest);
      setPunchRequests(mappedRequests);

      if (selectedRequestId) {
        const foundRequest = mappedRequests.find(
          (req) => req.id === selectedRequestId
        );
        if (foundRequest) {
          setSelectedRequest(foundRequest);
        }
      } else if (initialSelectedRequest) {
        setSelectedRequest(initialSelectedRequest);
      }
    }
  }, [attendanceResponse, selectedRequestId, initialSelectedRequest]);

  useEffect(() => {
    if (selectedRequestId && punchRequests.length > 0) {
      const foundRequest = punchRequests.find(
        (req) => req.id === selectedRequestId
      );
      if (foundRequest) {
        setSelectedRequest(foundRequest);
      }
    }
  }, [selectedRequestId, punchRequests]);

  useEffect(() => {
    setSelectedRequest(initialSelectedRequest || null);
  }, [initialSelectedRequest]);

  // Debounce select-all search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSelectAllSearch(selectAllSearch.trim());
      setSelectAllPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [selectAllSearch]);

  // Build criteria for Select All (if no explicit employee IDs)
  const selectAllCriteria = useMemo(() => {
    if (!selectedRequest?.selectAll) return undefined;
    const criteria: any[] = [
      { field: "tenantCode", operator: "eq", value: selectedRequest.tenantCode || tenantCode },
    ];
    if (selectedRequest.designation && selectedRequest.designation.length > 0) {
      criteria.push({
        field: "deployment.designation.designationCode",
        operator: "in",
        value: selectedRequest.designation.map(d => d.designationCode),
      });
    }
    if (selectedRequest.grade && selectedRequest.grade.length > 0) {
      criteria.push({
        field: "deployment.grade.gradeCode",
        operator: "in",
        value: selectedRequest.grade.map(g => g.gradeCode),
      });
    }
    if (selectedRequest.employeeCategory && selectedRequest.employeeCategory.length > 0) {
      criteria.push({
        field: "deployment.employeeCategory.employeeCategoryCode",
        operator: "in",
        value: selectedRequest.employeeCategory,
      });
    }
    if (debouncedSelectAllSearch) {
      criteria.push({
        field: "employeeID",
        operator: "like",
        value: debouncedSelectAllSearch,
      });
    }
    return criteria;
  }, [selectedRequest, tenantCode, debouncedSelectAllSearch]);

  // Extract hierarchy filters - use hierarchyFilters from hook
  const effectiveHierarchyFilters = useMemo(() => {
    if (hierarchyFilters) {
      const filters: {
        subsidiary?: string[];
        division?: string[];
        department?: string[];
        location?: string[];
        contractor?: string[];
      } = {};
      
      if (hierarchyFilters.subsidiaries && hierarchyFilters.subsidiaries.length > 0) {
        filters.subsidiary = hierarchyFilters.subsidiaries;
      }
      if (hierarchyFilters.divisions && hierarchyFilters.divisions.length > 0) {
        filters.division = hierarchyFilters.divisions;
      }
      if (hierarchyFilters.departments && hierarchyFilters.departments.length > 0) {
        filters.department = hierarchyFilters.departments;
      }
      if (hierarchyFilters.locations && hierarchyFilters.locations.length > 0) {
        filters.location = hierarchyFilters.locations;
      }
      if (hierarchyFilters.contractors && hierarchyFilters.contractors.length > 0) {
        filters.contractor = hierarchyFilters.contractors;
      }
      
      return Object.keys(filters).length > 0 ? filters : undefined;
    }
    
    return undefined;
  }, [hierarchyFilters]);

  // Base GraphQL query for fetching employees (without hierarchyFilters)
  const FETCH_EMPLOYEES_QUERY_BASE = gql`
    query FetchEmployees(
      $criteriaRequests: [CriteriaRequest!]!
      $collection: String!
      $offset: Int
      $limit: Int
    ) {
      fetchEmployees(
        criteriaRequests: $criteriaRequests
        collection: $collection
        offset: $offset
        limit: $limit
      ) {
        _id
        employeeID
        firstName
        middleName
        lastName
      }
    }
  `;

  // Build GraphQL query dynamically with hierarchyFilters and userEntitlement inline (since type doesn't exist)
  const FETCH_EMPLOYEES_QUERY = useMemo(() => {
    const hasHierarchyFilters = effectiveHierarchyFilters && Object.keys(effectiveHierarchyFilters).length > 0;
    const hasUserEntitlement = userEntitlement && Object.keys(userEntitlement).length > 0;

    if (!hasHierarchyFilters && !hasUserEntitlement) {
      return FETCH_EMPLOYEES_QUERY_BASE;
    }

    // Build hierarchyFilters string inline
    const hierarchyFiltersString = hasHierarchyFilters
      ? Object.entries(effectiveHierarchyFilters!)
        .map(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
          }
          return '';
        })
        .filter(Boolean)
        .join(', ')
      : '';

    // Build userEntitlement string inline
    const userEntitlementString = hasUserEntitlement
      ? Object.entries(userEntitlement!)
        .map(([key, value]) => {
          if (key === 'employeeID' && typeof value === 'string') {
            return `${key}: "${value}"`;
          } else if (Array.isArray(value) && value.length > 0) {
            return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`;
          }
          return '';
        })
        .filter(Boolean)
        .join(', ')
      : '';

    // Build query parameters
    const queryParams: string[] = [];
    if (hierarchyFiltersString) {
      queryParams.push(`hierarchyFilters: { ${hierarchyFiltersString} }`);
    }
    if (userEntitlementString) {
      queryParams.push(`userEntitlement: { ${userEntitlementString} }`);
    }

    const queryString = `
      query FetchEmployees(
        $criteriaRequests: [CriteriaRequest!]!
        $collection: String!
        $offset: Int
        $limit: Int
      ) {
        fetchEmployees(
          criteriaRequests: $criteriaRequests
          collection: $collection
          offset: $offset
          limit: $limit
          ${queryParams.join('\n          ')}
        ) {
          _id
          employeeID
          firstName
          middleName
          lastName
        }
      }
    `;
    return gql(queryString);
  }, [effectiveHierarchyFilters, userEntitlement]);

  const fetchEmployeesVars = useMemo(() => {
    if (!selectAllCriteria) return undefined;
    return {
      criteriaRequests: selectAllCriteria,
      collection: "contract_employee",
      offset: (selectAllPage - 1) * selectAllPageSize,
      limit: selectAllPageSize,
    };
  }, [selectAllCriteria, selectAllPage, selectAllPageSize]);

  const {
    loading: selectAllEmployeesLoading,
    data: selectAllEmployeesData,
  } = useQuery(FETCH_EMPLOYEES_QUERY, {
    client,
    variables: fetchEmployeesVars || {},
    skip: !fetchEmployeesVars,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (selectAllEmployeesData?.fetchEmployees) {
      setSelectAllEmployees(selectAllEmployeesData.fetchEmployees);
    } else {
      setSelectAllEmployees([]);
    }
  }, [selectAllEmployeesData]);

  // Build count request data for Select All mode
  const countRequestData = useMemo(() => {
    if (!selectedRequest?.selectAll || !selectAllCriteria) return undefined;
    
    const hierarchyFiltersObj: any = {};
    if (hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0) {
      hierarchyFiltersObj.subsidiary = hierarchyFilters.subsidiaries;
    }
    if (hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0) {
      hierarchyFiltersObj.division = hierarchyFilters.divisions;
    }
    if (hierarchyFilters?.departments && hierarchyFilters.departments.length > 0) {
      hierarchyFiltersObj.department = hierarchyFilters.departments;
    }
    if (hierarchyFilters?.locations && hierarchyFilters.locations.length > 0) {
      hierarchyFiltersObj.location = hierarchyFilters.locations;
    }
    if (hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0) {
      hierarchyFiltersObj.contractor = hierarchyFilters.contractors;
    }

    return {
      hierarchyFilters: hierarchyFiltersObj,
      criteriaRequests: selectAllCriteria,
      userEntitlement: userEntitlement,
    };
  }, [selectedRequest?.selectAll, selectAllCriteria, hierarchyFilters, userEntitlement]);

  // Count API call to get total collection length - only process when Select All is active
  const {
    refetch: refetchSelectAllCount,
  } = useRequest<any>({
    url: "contract_employee/count/searchWithHierarchy",
    method: "POST",
    data: countRequestData,
    onSuccess: (data: any) => {
      // Only process if Select All is active
      if (selectedRequest?.selectAll && data !== null && data !== undefined) {
        setSelectAllTotal(data || 0);
      }
    },
    onError: (error: any) => {
      // Only log errors if Select All is active
      if (selectedRequest?.selectAll) {
        console.error("Error fetching contract employee count:", error);
        setSelectAllTotal(null);
      }
    },
    dependencies: [], // Empty dependencies - requests will only be made via manual refetch
  });

  // Refetch count when filters change (with debounce)
  useEffect(() => {
    if (selectedRequest?.selectAll && countRequestData) {
      const timer = setTimeout(() => {
        refetchSelectAllCount();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSelectAllTotal(null);
    }
  }, [selectedRequest?.selectAll, JSON.stringify(countRequestData), refetchSelectAllCount]);

  const formatDate = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDDMMYYYY = (value?: string) => {
    if (!value) return "-";
    try {
      if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
        const [dd, mm, yyyy] = value.split("-").map(Number);
        const d = new Date(yyyy as number, (mm as number) - 1, dd as number);
        return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return value;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20";
      case "pending":
      case "initiated":
      case "validated":
        return "bg-[#64B5F6]/10 text-[#64B5F6] border-[#64B5F6]/20";
      case "rejected":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "failed":
        return "bg-red-100 text-red-600 border-red-200";
      default:
        return "bg-gray-200 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
      case "initiated":
      case "validated":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getMonthName = (month?: number) => {
    if (!month) return "-";
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleString('en-US', { month: 'long' });
  };

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!selectedRequest?.employeeIDList) return [];
    const query = employeeSearchTerm.toLowerCase().trim();
    if (!query) return selectedRequest.employeeIDList;

    return selectedRequest.employeeIDList.filter((employeeID) => {
      return employeeID.toLowerCase().includes(query);
    });
  }, [selectedRequest?.employeeIDList, employeeSearchTerm]);

  // Paginated employees
  const paginatedEmployees = useMemo(() => {
    return filteredEmployees.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredEmployees, page]);

  // Role criteria filters
  const filteredDesignations = useMemo(() => {
    if (!selectedRequest?.designation) return [];
    const q = designationSearch.trim().toLowerCase();
    if (!q) return selectedRequest.designation;
    return selectedRequest.designation.filter((d) =>
      d.designationCode.toLowerCase().includes(q) || d.designationName.toLowerCase().includes(q)
    );
  }, [selectedRequest?.designation, designationSearch]);

  const filteredGrades = useMemo(() => {
    if (!selectedRequest?.grade) return [];
    const q = gradeSearch.trim().toLowerCase();
    if (!q) return selectedRequest.grade;
    return selectedRequest.grade.filter((g) =>
      g.gradeCode.toLowerCase().includes(q) || g.gradeName.toLowerCase().includes(q)
    );
  }, [selectedRequest?.grade, gradeSearch]);

  const filteredCategories = useMemo(() => {
    if (!selectedRequest?.employeeCategory) return [];
    const q = categorySearch.trim().toLowerCase();
    if (!q) return selectedRequest.employeeCategory;
    return selectedRequest.employeeCategory.filter((code) => code.toLowerCase().includes(q));
  }, [selectedRequest?.employeeCategory, categorySearch]);

  const paginatedDesignations = useMemo(() => {
    return filteredDesignations.slice((designationPage - 1) * rolePageSize, designationPage * rolePageSize);
  }, [filteredDesignations, designationPage]);

  const paginatedGrades = useMemo(() => {
    return filteredGrades.slice((gradePage - 1) * rolePageSize, gradePage * rolePageSize);
  }, [filteredGrades, gradePage]);

  const paginatedCategories = useMemo(() => {
    return filteredCategories.slice((categoryPage - 1) * rolePageSize, categoryPage * rolePageSize);
  }, [filteredCategories, categoryPage]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [employeeSearchTerm, filteredEmployees.length]);

  useEffect(() => {
    setDesignationPage(1);
  }, [designationSearch]);

  useEffect(() => {
    setGradePage(1);
  }, [gradeSearch]);

  useEffect(() => {
    setCategoryPage(1);
  }, [categorySearch]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white w-full max-w-5xl h-[85vh] flex flex-col rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-700">
              Wage Calculation Application
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              aria-label="Close popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden bg-gray-50">
            {/* Left Side - Request Details */}
            <div className="w-3/5 flex flex-col bg-white border-r border-gray-100">
              <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                {selectedRequest ? (
                  <div className="max-w-2xl">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                      <h3 className="text-base font-semibold text-gray-700">
                        Request Details
                      </h3>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border ${getStatusColor(selectedRequest.workflowState)}`}
                      >
                        {getStatusIcon(selectedRequest.workflowState)}
                        <span className="uppercase tracking-wide">
                          {selectedRequest.workflowState || "PENDING"}
                        </span>
                      </div>
                    </div>

                    {/* Fields Section */}
                    <div className="space-y-2">
                      {/* Month */}
                      {selectedRequest.month && (
                        <div className="flex items-center border-b border-gray-100 pb-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                            Month
                          </label>
                          <span className="text-sm text-gray-900 font-medium">
                            {getMonthName(selectedRequest.month)}
                          </span>
                        </div>
                      )}

                      {/* Year */}
                      {selectedRequest.year && (
                        <div className="flex items-center border-b border-gray-100 pb-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                            Year
                          </label>
                          <span className="text-sm text-gray-900 font-medium">
                            {selectedRequest.year}
                          </span>
                        </div>
                      )}

                      {/* Applied Date */}
                      {selectedRequest.appliedDate && (
                        <div className="flex items-center border-b border-gray-100 pb-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                            Applied Date
                          </label>
                          <span className="text-sm text-gray-900 font-medium">
                            {formatDDMMYYYY(selectedRequest.appliedDate)}
                          </span>
                        </div>
                      )}

                      {/* Uploaded By */}
                      {selectedRequest.uploadedBy && (
                        <div className="flex items-center border-b border-gray-100 pb-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                            Uploaded By
                          </label>
                          <span className="text-sm text-gray-900 font-medium">
                            {selectedRequest.uploadedBy}
                          </span>
                        </div>
                      )}

                      {/* Created On */}
                      {selectedRequest.createdOn && (
                        <div className="flex items-center border-b border-gray-100 pb-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                            Created On
                          </label>
                          <span className="text-sm text-gray-900 font-medium">
                            {(() => {
                              try {
                                const date = new Date(selectedRequest.createdOn as string);
                                const formattedDate = date.toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                });
                                const formattedTime = date.toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                });
                                return `${formattedDate}, ${formattedTime}`;
                              } catch {
                                return selectedRequest.createdOn;
                              }
                            })()}
                          </span>
                        </div>
                      )}

                      {/* Remarks */}
                      {selectedRequest.remarks && (
                        <div className="flex items-start border-b border-gray-100 pb-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0 pt-1">
                            Remarks
                          </label>
                          <span className="text-sm text-gray-900 font-medium flex-1">
                            {selectedRequest.remarks}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status Update Controls */}
                    {!["APPROVED", "REJECTED", "CANCELLED"].includes(
                      selectedRequest.workflowState?.toUpperCase() || ""
                    ) &&
                      (canApprove || canReject || canCancel) && (
                        <div className="pt-2 space-y-3 border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-3">
                            {canApprove && (
                              <label
                                className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  statusAction === "approve"
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="statusAction"
                                  checked={statusAction === "approve"}
                                  onChange={() =>
                                    setStatusAction("approve")
                                  }
                                  className="sr-only"
                                />
                                <CheckCircle
                                  className={`h-5 w-5 ${statusAction === "approve" ? "text-green-600" : "text-gray-400"}`}
                                />
                                <span className="text-sm font-semibold text-gray-900">
                                  Approve
                                </span>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${
                                    statusAction === "approve"
                                      ? "border-green-500 bg-green-500"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {statusAction === "approve" && (
                                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                  )}
                                </div>
                              </label>
                            )}

                            {canReject && (
                              <label
                                className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  statusAction === "reject"
                                    ? "border-red-500 bg-red-50"
                                    : "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="statusAction"
                                  checked={statusAction === "reject"}
                                  onChange={() =>
                                    setStatusAction("reject")
                                  }
                                  className="sr-only"
                                />
                                <XCircle
                                  className={`h-5 w-5 ${statusAction === "reject" ? "text-red-600" : "text-gray-400"}`}
                                />
                                <span className="text-sm font-semibold text-gray-900">
                                  Reject
                                </span>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${
                                    statusAction === "reject"
                                      ? "border-red-500 bg-red-500"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {statusAction === "reject" && (
                                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                  )}
                                </div>
                              </label>
                            )}

                            {canCancel && (
                              <label
                                className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  statusAction === "cancel"
                                    ? "border-gray-900 bg-gray-100"
                                    : "border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="statusAction"
                                  checked={statusAction === "cancel"}
                                  onChange={() =>
                                    setStatusAction("cancel")
                                  }
                                  className="sr-only"
                                />
                                <X
                                  className={`h-5 w-5 ${statusAction === "cancel" ? "text-gray-900" : "text-gray-400"}`}
                                />
                                <span className="text-sm font-semibold text-gray-900">
                                  Cancel
                                </span>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${
                                    statusAction === "cancel"
                                      ? "border-gray-900 bg-gray-900"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {statusAction === "cancel" && (
                                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                  )}
                                </div>
                              </label>
                            )}
                          </div>

                          {/* Comment Section */}
                          {(statusAction === "cancel" ||
                            statusAction === "reject") && (
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Comment{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={statusComment}
                                onChange={(e) =>
                                  setStatusComment(e.target.value)
                                }
                                placeholder="Please provide a reason for this action..."
                                className="w-full min-h-[80px] rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all resize-none"
                              />
                              {statusError && (
                                <div className="flex items-center gap-2 text-red-600 text-sm mt-2 p-2.5 bg-red-50 rounded-lg border border-red-200">
                                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                  {statusError}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Submit Button */}
                          {statusAction && (
                            <button
                              type="button"
                              className={`w-full h-10 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm ${
                                statusAction === "cancel"
                                  ? "bg-black hover:bg-gray-900"
                                  : statusAction === "reject"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-green-600 hover:bg-green-700"
                              }`}
                              disabled={
                                statusLoading ||
                                ((statusAction === "cancel" ||
                                  statusAction === "reject") &&
                                  !statusComment.trim())
                              }
                              onClick={() => {
                                if (
                                  (statusAction === "approve" &&
                                    !canApprove) ||
                                  (statusAction === "reject" &&
                                    !canReject) ||
                                  (statusAction === "cancel" &&
                                    !canCancel)
                                ) {
                                  setStatusError(
                                    "You do not have permission for this action."
                                  );
                                  return;
                                }
                                if (
                                  (statusAction === "cancel" ||
                                    statusAction === "reject") &&
                                  !statusComment.trim()
                                ) {
                                  setStatusError(
                                    "Please enter a comment to proceed."
                                  );
                                  return;
                                }

                                setStatusLoading(true);

                                let stateEvent = "USERCANCEL";
                                if (statusAction === "reject") {
                                  stateEvent = "REJECT";
                                } else if (statusAction === "approve") {
                                  stateEvent = "NEXT";
                                } else if (statusAction === "cancel") {
                                  stateEvent = "USERCANCEL";
                                }

                                const pad = (n: number) =>
                                  n < 10 ? `0${n}` : n;

                                const now = new Date();
                                const istTime = new Date(
                                  now.toLocaleString("en-US", {
                                    timeZone: "Asia/Kolkata",
                                  })
                                );

                                const yyyy = istTime.getFullYear();
                                const mm = pad(istTime.getMonth() + 1);
                                const dd = pad(istTime.getDate());
                                const hh = pad(istTime.getHours());
                                const min = pad(istTime.getMinutes());
                                const ss = pad(istTime.getSeconds());
                                const ms = pad(istTime.getMilliseconds());

                                const createdOn = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+05:30`;
                                const uploadTime = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
                                const appliedDate = `${yyyy}-${mm}-${dd}`;
                                let uploadedBy = "user";

                                const data = {
                                  _id: selectedRequest?.id,
                                  tenantCode:
                                    selectedRequest?.tenantCode || tenantCode,
                                  workflowName:
                                    selectedRequest?.workflowName ||
                                    "WageCalculation Application",
                                  stateEvent,
                                  organizationCode:
                                    selectedRequest?.organizationCode || tenantCode,
                                  isDeleted: selectedRequest?.isDeleted || false,
                                  employeeIDList: selectedRequest?.employeeIDList || [],
                                  remarks: selectedRequest?.remarks,
                                  appliedDate: selectedRequest?.appliedDate || appliedDate,
                                  uploadTime: uploadTime,
                                  uploadedBy:
                                    selectedRequest?.uploadedBy || uploadedBy,
                                  createdOn:
                                    selectedRequest?.createdOn || createdOn,
                                  workflowState: selectedRequest?.workflowState,
                                  action: statusAction,
                                  comment: statusComment,
                                };

                                const backendData = {
                                  tenant: tenantCode,
                                  action: "insert",
                                  id: selectedRequest?.id,
                                  event: "application",
                                  collectionName: "wageCalculationApplication",
                                  data,
                                };

                                postShiftZone(backendData);
                                fetchAttendance();
                                setTimeout(() => {
                                  setStatusLoading(false);
                                  setStatusAction(null);
                                  setStatusComment("");
                                  setStatusError("");
                                }, 1000);
                              }}
                            >
                              {statusLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Updating...</span>
                                </div>
                              ) : (
                                `Submit ${statusAction ? statusAction.charAt(0).toUpperCase() + statusAction.slice(1) : ""}`
                              )}
                            </button>
                          )}
                        </div>
                      )}

                    {/* Employee Section - At the bottom */}
                    {selectedRequest.employeeIDList?.length ? (
                      <div className="mt-6 space-y-3">
                        {/* Search Bar - Separate from table */}
                        <div className="flex bg-muted/50 rounded-lg border">
                          {/* Field Selection */}
                          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                            <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                            <Select
                              value={selectedField}
                              onValueChange={(val: 'employeeID') => setSelectedField(val)}
                            >
                              <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employeeID" className="text-sm">
                                  ID
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Search Field */}
                          <div className="flex-1 flex items-center bg-background rounded-r-lg">
                            <div className="relative flex-1">
                              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="text"
                                placeholder="Search by ID..."
                                value={employeeSearchTerm}
                                onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                                className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Table - Separate from search */}
                        <div className="border rounded-lg bg-slate-50/40">
                          <div className="px-4 py-2 border-b border-gray-200 bg-slate-50">
                            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Employees ({selectedRequest.employeeIDList.length})
                            </h4>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="py-2 pl-4 pr-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[60px]">
                                  SL No
                                </TableHead>
                                <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                                  Employee ID
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedEmployees.length > 0 ? (
                                paginatedEmployees.map((employeeID, index) => {
                                  // Calculate actual index in filtered list
                                  const actualIndex = filteredEmployees.indexOf(employeeID);
                                  return (
                                    <TableRow
                                      key={`${employeeID}-${actualIndex}`}
                                      className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                                    >
                                      <TableCell className="py-1.5 pl-4 text-sm text-gray-900">
                                        {actualIndex + 1}
                                      </TableCell>
                                      <TableCell className="py-1.5 pr-4 font-mono text-[11px] text-gray-900">
                                        {employeeID}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={2} className="py-8 text-center text-sm text-gray-500">
                                    No employees found matching your search.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                          
                          {/* Pagination */}
                          {filteredEmployees.length > pageSize && (
                            <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                              <p className="text-[11px] text-gray-500">
                                Showing{' '}
                                <span className="font-semibold">
                                  {Math.min((page - 1) * pageSize + 1, filteredEmployees.length)}-
                                  {Math.min(page * pageSize, filteredEmployees.length)}
                                </span>{' '}
                                of <span className="font-semibold">{filteredEmployees.length}</span>
                              </p>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[11px]"
                                  disabled={page === 1}
                                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                  Prev
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[11px]"
                                  disabled={page * pageSize >= filteredEmployees.length}
                                  onClick={() =>
                                    setPage((p) =>
                                      p * pageSize >= filteredEmployees.length ? p : p + 1
                                    )
                                  }
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : selectedRequest.selectAll ? (
                      <div className="mt-6 space-y-3">
                        {/* Role criteria summary (if available) */}
                        {((selectedRequest.designation && selectedRequest.designation.length > 0) || (selectedRequest.grade && selectedRequest.grade.length) || (selectedRequest.employeeCategory && selectedRequest.employeeCategory.length)) && (
                          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm space-y-3">
                            <div className="text-sm text-gray-900 font-semibold">Role criteria</div>

                            {/* Designation table */}
                            <div className="rounded-md border border-gray-200 bg-white">
                              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Designation</span>
                                <div className="relative w-56">
                                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    value={designationSearch}
                                    onChange={(e) => setDesignationSearch(e.target.value)}
                                    placeholder="Search by designation..."
                                    className="pl-8 pr-3 h-8 text-xs rounded-md"
                                  />
                                </div>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50">
                                    <TableHead className="py-1 pl-3 pr-2 text-[11px] font-semibold text-gray-800 uppercase tracking-wide whitespace-nowrap min-w-[60px]">SL No</TableHead>
                                    <TableHead className="py-1 text-[11px] font-semibold text-gray-800 uppercase tracking-wide">Code</TableHead>
                                    <TableHead className="py-1 pr-3 text-[11px] font-semibold text-gray-800 uppercase tracking-wide">Name</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paginatedDesignations.length ? (
                                    paginatedDesignations.map((desig, idx) => (
                                      <TableRow key={desig.designationCode}>
                                        <TableCell className="py-1 pl-3 text-xs text-gray-800">
                                          {(designationPage - 1) * rolePageSize + idx + 1}
                                        </TableCell>
                                        <TableCell className="py-1 text-xs text-gray-800">{desig.designationCode}</TableCell>
                                        <TableCell className="py-1 pr-3 text-xs text-gray-800">{desig.designationName || "-"}</TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={3} className="py-2 pl-3 pr-3 text-xs text-gray-500">
                                        No designations selected
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                              {filteredDesignations.length > rolePageSize && (
                                <div className="flex items-center justify-between px-3 py-2 border-t bg-slate-50">
                                  <p className="text-[11px] text-gray-500">
                                    Showing{" "}
                                    <span className="font-semibold">
                                      {Math.min((designationPage - 1) * rolePageSize + 1, filteredDesignations.length)}-
                                      {Math.min(designationPage * rolePageSize, filteredDesignations.length)}
                                    </span>{" "}
                                    of <span className="font-semibold">{filteredDesignations.length}</span>
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-[11px]"
                                      disabled={designationPage === 1}
                                      onClick={() => setDesignationPage((p) => Math.max(1, p - 1))}
                                    >
                                      Prev
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-[11px]"
                                      disabled={designationPage * rolePageSize >= filteredDesignations.length}
                                      onClick={() =>
                                        setDesignationPage((p) =>
                                          p * rolePageSize >= filteredDesignations.length ? p : p + 1
                                        )
                                      }
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Grades table */}
                            <div className="rounded-md border border-gray-200 bg-white">
                              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Grades</span>
                                <div className="relative w-56">
                                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    value={gradeSearch}
                                    onChange={(e) => setGradeSearch(e.target.value)}
                                    placeholder="Search by grade code..."
                                    className="pl-8 pr-3 h-8 text-xs rounded-md"
                                  />
                                </div>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50">
                                    <TableHead className="py-1 pl-3 pr-2 text-[11px] font-semibold text-gray-800 uppercase tracking-wide whitespace-nowrap min-w-[60px]">SL No</TableHead>
                                    <TableHead className="py-1 text-[11px] font-semibold text-gray-800 uppercase tracking-wide">Code</TableHead>
                                    <TableHead className="py-1 pr-3 text-[11px] font-semibold text-gray-800 uppercase tracking-wide">Name</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paginatedGrades.length ? (
                                    paginatedGrades.map((grade, idx) => (
                                      <TableRow key={grade.gradeCode}>
                                        <TableCell className="py-1 pl-3 text-xs text-gray-800">
                                          {(gradePage - 1) * rolePageSize + idx + 1}
                                        </TableCell>
                                        <TableCell className="py-1 text-xs text-gray-800">{grade.gradeCode}</TableCell>
                                        <TableCell className="py-1 pr-3 text-xs text-gray-800">{grade.gradeName || "-"}</TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={3} className="py-2 pl-3 pr-3 text-xs text-gray-500">
                                        No grades selected
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                              {filteredGrades.length > rolePageSize && (
                                <div className="flex items-center justify-between px-3 py-2 border-t bg-slate-50">
                                  <p className="text-[11px] text-gray-500">
                                    Showing{" "}
                                    <span className="font-semibold">
                                      {Math.min((gradePage - 1) * rolePageSize + 1, filteredGrades.length)}-
                                      {Math.min(gradePage * rolePageSize, filteredGrades.length)}
                                    </span>{" "}
                                    of <span className="font-semibold">{filteredGrades.length}</span>
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-[11px]"
                                      disabled={gradePage === 1}
                                      onClick={() => setGradePage((p) => Math.max(1, p - 1))}
                                    >
                                      Prev
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-[11px]"
                                      disabled={gradePage * rolePageSize >= filteredGrades.length}
                                      onClick={() =>
                                        setGradePage((p) =>
                                          p * rolePageSize >= filteredGrades.length ? p : p + 1
                                        )
                                      }
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Employee Category table */}
                            <div className="rounded-md border border-gray-200 bg-white">
                              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Employee Category</span>
                                <div className="relative w-56">
                                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    placeholder="Search by category code..."
                                    className="pl-8 pr-3 h-8 text-xs rounded-md"
                                  />
                                </div>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50">
                                    <TableHead className="py-1 pl-3 pr-2 text-[11px] font-semibold text-gray-800 uppercase tracking-wide whitespace-nowrap min-w-[60px]">SL No</TableHead>
                                    <TableHead className="py-1 pr-3 text-[11px] font-semibold text-gray-800 uppercase tracking-wide">Code</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paginatedCategories.length ? (
                                    paginatedCategories.map((code, idx) => (
                                      <TableRow key={code}>
                                        <TableCell className="py-1 pl-3 text-xs text-gray-800">
                                          {(categoryPage - 1) * rolePageSize + idx + 1}
                                        </TableCell>
                                        <TableCell className="py-1 pr-3 text-xs text-gray-800">{code}</TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={2} className="py-2 pl-3 pr-3 text-xs text-gray-500">
                                        No categories selected
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                              {filteredCategories.length > rolePageSize && (
                                <div className="flex items-center justify-between px-3 py-2 border-t bg-slate-50">
                                  <p className="text-[11px] text-gray-500">
                                    Showing{" "}
                                    <span className="font-semibold">
                                      {Math.min((categoryPage - 1) * rolePageSize + 1, filteredCategories.length)}-
                                      {Math.min(categoryPage * rolePageSize, filteredCategories.length)}
                                    </span>{" "}
                                    of <span className="font-semibold">{filteredCategories.length}</span>
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-[11px]"
                                      disabled={categoryPage === 1}
                                      onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
                                    >
                                      Prev
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-6 px-2 text-[11px]"
                                      disabled={categoryPage * rolePageSize >= filteredCategories.length}
                                      onClick={() =>
                                        setCategoryPage((p) =>
                                          p * rolePageSize >= filteredCategories.length ? p : p + 1
                                        )
                                      }
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Search Bar - Separate from table */}
                        <div className="flex bg-muted/50 rounded-lg border">
                          {/* Field Selection */}
                          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                            <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                            <span className="text-sm font-medium text-foreground">Employee ID</span>
                          </div>

                          {/* Search Field */}
                          <div className="flex-1 flex items-center bg-background rounded-r-lg">
                            <div className="relative flex-1">
                              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="text"
                                placeholder="Search by ID..."
                                value={selectAllSearch}
                                onChange={(e) => setSelectAllSearch(e.target.value)}
                                className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Employees table for Select All */}
                        <div className="border rounded-lg bg-slate-50/40">
                          <div className="px-4 py-2 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Employees (Select All)
                            </h4>
                            {selectAllTotal !== null && (
                              <span className="text-[11px] text-gray-500">Total {selectAllTotal}</span>
                            )}
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="py-2 pl-4 pr-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap min-w-[60px]">
                                  SL No
                                </TableHead>
                                <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                                  Employee ID
                                </TableHead>
                                <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                                  Name
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectAllEmployeesLoading ? (
                                <TableRow>
                                  <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                                    Loading employees...
                                  </TableCell>
                                </TableRow>
                              ) : selectAllEmployees.length > 0 ? (
                                selectAllEmployees.map((emp: any, idx: number) => {
                                  const fullName = [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(" ");
                                  return (
                                    <TableRow key={`${emp.employeeID}-${idx}`} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                                      <TableCell className="py-1.5 pl-4 text-sm text-gray-900">
                                        {(selectAllPage - 1) * selectAllPageSize + idx + 1}
                                      </TableCell>
                                      <TableCell className="py-1.5 pr-4 font-mono text-[11px] text-gray-900">
                                        {emp.employeeID || "-"}
                                      </TableCell>
                                      <TableCell className="py-1.5 pr-4 text-sm text-gray-900">
                                        {fullName || "-"}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                                    {selectAllCriteria ? "No employees found for these filters." : "No employees available."}
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>

                          {/* Pagination for Select All employees */}
                          {selectAllTotal !== null && selectAllTotal > selectAllPageSize && (
                            <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                              <p className="text-[11px] text-gray-500">
                                Showing{" "}
                                <span className="font-semibold">
                                  {Math.min((selectAllPage - 1) * selectAllPageSize + 1, selectAllTotal)}-
                                  {Math.min(selectAllPage * selectAllPageSize, selectAllTotal)}
                                </span>{" "}
                                of <span className="font-semibold">{selectAllTotal}</span>
                              </p>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[11px]"
                                  disabled={selectAllPage === 1 || selectAllEmployeesLoading}
                                  onClick={() => setSelectAllPage((p) => Math.max(1, p - 1))}
                                >
                                  Prev
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[11px]"
                                  disabled={selectAllPage * selectAllPageSize >= selectAllTotal || selectAllEmployeesLoading}
                                  onClick={() => setSelectAllPage((p) => p + 1)}
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 space-y-3">
                        <div className="border rounded-lg bg-slate-50/40">
                          <div className="px-4 py-2 border-b border-gray-200 bg-slate-50">
                            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Employees (0)
                            </h4>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                                  SL No
                                </TableHead>
                                <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                                  Employee ID
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell colSpan={2} className="py-8 text-center text-sm text-gray-500">
                                  No employees available for this request.
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                   
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Send className="h-12 w-12 mb-3 opacity-40" />
                    <p className="text-base font-medium text-gray-500">
                      No Request Selected
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Select a request to view details
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Auto Status Update Panel */}
            <div className="w-2/5 flex flex-col bg-gray-50">
              <div className="flex-1 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                <div className="w-full max-w-sm px-6 py-4">
                  {(() => {
                    const sr = selectedRequest as any
                    const reportData = sr ? {
                      id: sr.id,
                      employeeIDList: sr.employeeIDList || [],
                      appliedDate: sr.appliedDate,
                      status: sr.workflowState,
                      workflowState: sr.workflowState
                    } : undefined
                    return (
                      <AutoStatusUpdate
                        fileId={selectedRequest?.id || ""}
                        setOpen={() => {}}
                        reportData={reportData}
                      />
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
