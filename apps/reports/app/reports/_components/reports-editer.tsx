"use client";
import FilterBar from "@/app/reports/_components/FilterBar";
import ScrollableSection from "@/app/reports/_components/scrollable-section";
import ReportsTable from "@/app/reports/_components/reports-table";
import { ReportPopup } from "@/app/reports/_components/generate-reports/report-popup";
import { TableType, TableMenuItem } from "@/app/reports/_components/generate-reports/types";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { Dispatch, SetStateAction, useEffect, useState, useMemo, useCallback } from "react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode";
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info";
import { GitBranch, Users, Shield, FileText, Clock, Building2 } from "lucide-react";

// Table menu items configuration
const tableMenuItems: TableMenuItem[] = [
  { id: 'subsidiaries', label: 'Subsidiaries', icon: GitBranch, parent: 'organization' },
  { id: 'divisions', label: 'Divisions', icon: Users, parent: 'organization' },
  { id: 'departments', label: 'Departments', icon: Building2, parent: 'organization' },
  { id: 'subDepartments', label: 'Sub Departments', icon: Building2, parent: 'organization' },
  { id: 'sections', label: 'Sections', icon: Users, parent: 'organization' },
  { id: 'designations', label: 'Designations', icon: Users, parent: 'organization' },
  { id: 'grades', label: 'Grades', icon: Users, parent: 'organization' },
  { id: 'employeeCategories', label: 'Categories', icon: Users, parent: 'organization' },
  { id: 'contractors', label: 'Contractors', icon: Shield, parent: 'contractor' },
  { id: 'locations', label: 'Locations', icon: Building2, parent: 'organization' },
  { id: 'workOrders', label: 'Work Orders', icon: FileText, parent: 'contractor' },
  { id: 'shiftGroups', label: 'Shift Groups', icon: Clock, parent: 'shift' },
  { id: 'shifts', label: 'Shifts', icon: Clock, parent: 'shift' },
  { id: 'contractEmployees', label: 'Contract Employees', icon: Users, parent: 'contractEmployee' },
];

export default function ReportsEditer({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) {
  const [view, setView] = useState<"grid" | "list">("list");
  const [filters, setFilters] = useState<{ searchTerm: string; selectedFilters: string[] }>({
    searchTerm: '',
    selectedFilters: []
  });
  const [reportsGenerate, setReportsGenerate] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  const tenantCode = useGetTenantCode();
  const { employeeId } = useKeyclockRoleInfo();
  
  // Store filter data for calculating total selected count
  const [filterData, setFilterData] = useState<Record<TableType, string[]>>({
    subsidiaries: [],
    divisions: [],
    departments: [],
    subDepartments: [],
    sections: [],
    designations: [],
    grades: [],
    employeeCategories: [],
    locations: [],
    contractors: [],
    workOrders: [],
    shiftGroups: [],
    shifts: [],
    contractEmployees: [],
  });
  
  const totalSelected = useMemo(() => {
    return Object.values(filterData).reduce((sum, arr) => sum + arr.length, 0);
  }, [filterData]);
  
  const handleReset = useCallback(() => {
    setFilterData({
      subsidiaries: [],
      divisions: [],
      departments: [],
      subDepartments: [],
      sections: [],
      designations: [],
      grades: [],
      employeeCategories: [],
      locations: [],
      contractors: [],
      workOrders: [],
      shiftGroups: [],
      shifts: [],
      contractEmployees: [],
    });
  }, []);

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "reports",
    screenName: "reportsGenerate",
  });

  useEffect(() => {
    setReportsGenerate(!!(rolePermissions as any)?.reportsGenerate);
  }, [rolePermissions]);

  // Calculate offset and limit based on current page
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
  const limit = itemsPerPage;

  // Build request data for API calls
  const buildRequestData = useMemo(() => {
    const trimmedSearch = filters?.searchTerm?.trim() || '';
    const requestData: any[] = [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "createdOn",
        operator: "desc",
        value: ""
      },
      {
        field: "employeeId",
        operator: "eq",
        value: employeeId
      },
    ];

    // Add search filter if search term exists
    if (trimmedSearch) {
      requestData.push({
        field: "reportName",
        operator: "like",
        value: trimmedSearch,
      });
    }

    // Add extension filter if selected
    if (filters?.selectedFilters?.length) {
      filters.selectedFilters.forEach(filter => {
        const filterLower = filter.toLowerCase();
        if (filterLower === 'pdf' || filterLower === 'excel' || filterLower === 'xlsx') {
          const extension = filterLower === 'xlsx' ? 'excel' : filterLower;
          requestData.push({
            field: "extension",
            operator: "eq",
            value: extension,
          });
        } else {
          // For status filters
          requestData.push({
            field: "status",
            operator: "eq",
            value: filter,
          });
        }
      });
    }

    return requestData;
  }, [tenantCode, employeeId, filters]);

  // Count API call to get total count
  const {
    data: countData,
    refetch: refetchCount,
  } = useRequest<any>({
    url: `reports/count`,
    method: 'POST',
    data: buildRequestData,
    dependencies: [], // Empty dependencies - fetch manually
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        setTotalCount(data || 0);
      }
    },
    onError: (error: any) => {
      console.error("Error fetching count:", error);
    },
  });

  // Fetch reports data with pagination
  const {
    data: reportsResponse,
    loading: reportsLoading,
    error: reportsError,
    refetch: fetchReports
  } = useRequest<any>({
    url: `reports/search?offset=${offset}&limit=${limit}`,
    method: 'POST',
    data: buildRequestData,
    dependencies: [], // Empty dependencies - fetch manually
    onSuccess: (data: any) => {
      let responseData = data;
      if (Array.isArray(data)) {
        responseData = data;
      } else if (data?.data && Array.isArray(data.data)) {
        responseData = data.data;
      } else if (data?.data && !Array.isArray(data.data)) {
        responseData = [data.data];
      }
      setReportData(responseData || []);
    },
    onError: (error: any) => {
      console.error("Error fetching reports data:", error);
    },
  });

  // Fetch data when dependencies change
  useEffect(() => {
    if (tenantCode && employeeId) {
      fetchReports();
      refetchCount();
    }
  }, [offset, buildRequestData, tenantCode, employeeId]);

  // Helper to refresh all server data (list + count)
  const refreshAll = useCallback(() => {
    fetchReports();
    refetchCount();
  }, [fetchReports, refetchCount]);

  // Refresh reports when needed
  useEffect(() => {
    const handleRefreshReports = () => {
      refreshAll();
    };

    window.addEventListener('refreshReports', handleRefreshReports);
    return () => {
      window.removeEventListener('refreshReports', handleRefreshReports);
    };
  }, [refreshAll]);

  const handleFilterChange = (newFilters: { searchTerm: string; selectedFilters: string[] }) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setView(mode);
    // Reset to first page when switching views
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Calculate pagination for table view
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  return (
    <div>
      <ReportPopup
        isOpen={open}
        onClose={() => setOpen(false)}
        tableMenuItems={tableMenuItems}
        onReset={handleReset}
        onFilterDataChange={setFilterData}
      />
      {reportsGenerate && (
        <div className="w-full max-w-[1380px] mx-auto flex flex-col h-[calc(100vh-8rem)]">
          <div className="w-full flex-shrink-0 sticky top-0 z-10">
            <FilterBar 
              onFilterChange={handleFilterChange}
              onViewModeChange={handleViewModeChange}
              currentViewMode={view}
              onGenerateReport={() => setOpen(true)}
              totalSelected={totalSelected}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto scroll-hidden">
            <div className="p-0">
              <div className="space-y-0">
                {view === "list" ? (
                  <div className="px-2">
                    <ReportsTable
                    data={reportData}
                    loading={reportsLoading}
                    filters={filters}
                    externalPagination={{
                      currentPage,
                      totalPages,
                      totalItems: totalCount,
                      itemsPerPage,
                      startIndex,
                      endIndex,
                      onPageChange: handlePageChange,
                    }}
                    permission={{
                      reportsStatus: reportsGenerate
                    }}
                  />
                    </div>
                ) : (
                  <ScrollableSection
                    title="Reports"
                    count={totalCount}
                    contacts={reportData}
                    filters={filters}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}