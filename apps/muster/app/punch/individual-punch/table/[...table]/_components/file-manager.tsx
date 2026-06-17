"use client"
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useGetTenantCode } from "@/hooks/useGetTenantCode";
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy";
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info";
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement";
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters";
import PunchTable, { type PunchRecord } from "../../../../_components/punch-table"

function FileManager() {
  const [punchData, setPunchData] = useState<PunchRecord[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "processed" | "pending" | "inPunches" | "outPunches" | "defaultPunches">("all");
  const [searchField, setSearchField] = useState<string>('employeeID');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tenantCode = useGetTenantCode();

  // Get hierarchy filters, employee ID, and build user entitlement
  const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy();
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo();
  const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters);

  // Get values from URL query parameters
  useEffect(() => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
      setEmployeeId(params.get("employeeId"));
      setFromDate(params.get("fromdate"));
      setToDate(params.get("todate"));
    }
  }, []);

  // Calculate offset and limit based on current page
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
  const limit = itemsPerPage;

  // Debounce search value - update after 300ms of no typing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue]);

  // Build hierarchyFilters using the hook
  const hierarchyFilters = useHierarchyFilters(null, employeeId || null);

  // Helper function to convert YYYY-MM-DD to start of day in IST (YYYY-MM-DDTHH:mm:ss+05:30)
  const convertToStartOfDay = (dateString: string): string => {
    if (!dateString) return "";
    // If already in ISO format, extract date part
    const datePart = dateString.split('T')[0];
    return `${datePart}T00:00:00+05:30`;
  };

  // Helper function to convert YYYY-MM-DD to end of day in IST (YYYY-MM-DDTHH:mm:ss+05:30)
  const convertToEndOfDay = (dateString: string): string => {
    if (!dateString) return "";
    // If already in ISO format, extract date part
    const datePart = dateString.split('T')[0];
    return `${datePart}T23:59:59+05:30`;
  };

  // Prepare request data using useMemo
  const apiData = useMemo(() => {
    const criteriaRequests: any[] = [];
    
    // Add date filters using transactionTime with start/end of day conversion
    if (fromDate) {
      const startOfDay = convertToStartOfDay(fromDate);
      criteriaRequests.push({ field: "transactionTime", operator: "gte", value: startOfDay });
    }
    if (toDate) {
      const endOfDay = convertToEndOfDay(toDate);
      criteriaRequests.push({ field: "transactionTime", operator: "lte", value: endOfDay });
    }
    criteriaRequests.push({ field: "tenantCode", operator: "eq", value: tenantCode || "" });
    
    // Add status filter
    if (statusFilter === 'processed') {
      criteriaRequests.push({
        field: "processed",
        operator: "eq",
        value: true
      });
    } else if (statusFilter === 'pending') {
      criteriaRequests.push({
        field: "processed",
        operator: "eq",
        value: false
      });
    }

    // Add search filter if search term exists
    if (debouncedSearchValue.trim()) {
      criteriaRequests.push({
        field: searchField,
        operator: "like",
        value: debouncedSearchValue.trim()
      });
    }

    // Return object with hierarchyFilters, criteriaRequests, and userEntitlement
    const requestData: any = {
      hierarchyFilters: hierarchyFilters,
      criteriaRequests: criteriaRequests,
      userEntitlement: userEntitlement,
    };
    
    return requestData;
  }, [hierarchyFilters, fromDate, toDate, tenantCode, statusFilter, debouncedSearchValue, searchField, userEntitlement]);

  // Count API call to get total collection length
  const {
    data: countData,
    loading: countLoading,
    error: countError,
    refetch: refetchCount,
  } = useRequest<any>({
    url: 'muster/data_check/count/searchWithHierarchy',
    method: 'POST',
    data: apiData,
    onSuccess: (data: any) => {
      setTotalCount(data || 0);
    },
    onError: (error: any) => {
      console.error("Error fetching attendance records count:", error);
    },
    dependencies: [employeeId, fromDate, toDate, tenantCode, statusFilter, debouncedSearchValue, searchField]
  });

  // Fetch punch data with pagination
  const {
    data: punchDataResponse,
    loading: isLoading,
    error: punchError,
    refetch: fetchPunchData
  } = useRequest({
    url: `muster/data_check/searchWithHierarchy?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: apiData,
    onSuccess: (data: any) => {
      if (Array.isArray(data)) {
        setPunchData(data);
      } else {
        setPunchData([]);
      }
    },
    onError: (error: any) => {
      console.error("Error fetching punch data:", error);
      setPunchData([]);
    },
    dependencies: [employeeId, fromDate, toDate, tenantCode, statusFilter, debouncedSearchValue, searchField, currentPage, offset, limit]
  });

  // Reset to page 1 when debounced search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchValue, searchField, statusFilter]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleStatusFilterChange = useCallback((filter: "all" | "processed" | "pending" | "inPunches" | "outPunches" | "defaultPunches") => {
    setStatusFilter(filter);
  }, []);

  const handleSearchFieldChange = useCallback((field: "employeeID" | "readerSerialNumber" | "failureDescription") => {
    setSearchField(field);
  }, []);

  const handleSearchValueChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Pagination calculations based on total count
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  return (
    <PunchTable
      data={punchData}
      statusFilter={statusFilter}
      tableTitle="Attendance Records"
      permissions={{
        canApproveSuspected: false,
        canViewSuspected: false
      }}
      onStatusFilterChange={handleStatusFilterChange}
      onSelectionChange={(selectedIds: string[]) => {
        // No-op for this view
      }}
      onOpenForm={(record: PunchRecord) => {
        // No-op for this view
      }}
      visibleColumns={["employeeID", "inOut", "typeOfMovement", "punchedTime", "readerSerialNumber", "processed"]}
      externalPagination={{
        currentPage,
        totalPages,
        totalItems: totalCount,
        itemsPerPage,
        startIndex,
        endIndex,
        onPageChange: handlePageChange
      }}
      searchField={searchField as "employeeID" | "readerSerialNumber" | "failureDescription"}
      searchValue={searchValue}
      onSearchFieldChange={handleSearchFieldChange}
      onSearchValueChange={handleSearchValueChange}
      loading={isLoading}
    />
  );
}

export default FileManager;