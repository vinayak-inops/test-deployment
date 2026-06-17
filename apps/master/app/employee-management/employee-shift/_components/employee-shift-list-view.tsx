"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy";
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement";
import type { FilterSelections } from "@/components/common/step-by-step-filter";
import EmployeeShiftFilterBar from "./employee-shift-filter-bar";
import EmployeeShiftTable from "./employee-shift-table";

/** Matches the shift shape passed by EmployeeShiftTable */
interface EmployeeShiftRow {
  _id: string;
  employeeID: string;
  shiftGroupCode: string;
  fromDate: string;
  toDate: string;
  shift?: { shiftCode: string; shiftName: string };
}

const ITEMS_PER_PAGE = 10;
const SEARCH_FIELDS = [
  { value: "employeeID", label: "Employee ID" },
  { value: "shiftGroupCode", label: "Shift Group Code" },
  { value: "shiftCode", label: "Shift Code" },
  { value: "shiftName", label: "Shift Name" },
];

export interface EmployeeShiftListViewProps {
  filterSelections: FilterSelections;
  filtersApplied: boolean;
  viewMode: boolean;
  editMode: boolean;
  addMode: boolean;
  deleteMode: boolean;
  onFilterClick: () => void;
  onAddNew: () => void;
  onEdit: (shift: EmployeeShiftRow) => void;
  onDelete: (shift: EmployeeShiftRow) => void;
  onView: (shift: EmployeeShiftRow) => void;
  onDataLoaded: (data: any[]) => void;
  refreshKey?: number;
}

export function EmployeeShiftListView({
  filterSelections,
  filtersApplied,
  viewMode,
  editMode,
  addMode,
  deleteMode,
  onFilterClick,
  onAddNew,
  onEdit,
  onDelete,
  onView,
  onDataLoaded,
  refreshKey,
}: EmployeeShiftListViewProps) {
  const tenantCode = useGetTenantCode();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedField, setSelectedField] = useState("employeeID");
  const [currentPage, setCurrentPage] = useState(1);
  const [tableData, setTableData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo();
  const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy();
  const userEntitlement = useUserEntitlement(loginEmployeeId, empHierarchyFilters);

  const modifiedFilterSelections = useMemo(() => {
    if (debouncedSearchTerm.trim()) {
      return { ...filterSelections, employeeID: "" };
    }
    return filterSelections;
  }, [filterSelections, debouncedSearchTerm]);

  const hierarchyFilters = useHierarchyFilters(modifiedFilterSelections);

  const offset = useMemo(
    () => (currentPage - 1) * ITEMS_PER_PAGE,
    [currentPage]
  );

  const emptyRequestData = useMemo(
    () => ({
      hierarchyFilters: {},
      criteriaRequests: [
        { field: "tenantCode", operator: "eq", value: tenantCode || "" },
        { field: "createdOn", operator: "desc", value: "" },
      ],
      userEntitlement,
    }),
    [tenantCode, userEntitlement]
  );

  const apiCriteria = useMemo(() => {
    const filters: any[] = [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      { field: "createdOn", operator: "desc", value: "" },
    ];
    if (debouncedSearchTerm.trim() && filtersApplied) {
      if (selectedField === "shiftCode" || selectedField === "shiftName") {
        filters.push({
          field:
            selectedField === "shiftCode"
              ? "shift.shiftCode"
              : "shift.shiftName",
          operator: "like",
          value: debouncedSearchTerm.trim(),
        });
      } else {
        filters.push({
          field: selectedField,
          operator: "like",
          value: debouncedSearchTerm.trim(),
        });
      }
    }
    return filters;
  }, [tenantCode, debouncedSearchTerm, selectedField, filtersApplied]);

  const countRequestData = useMemo(() => {
    if (!filtersApplied) return emptyRequestData;
    return {
      hierarchyFilters,
      criteriaRequests: apiCriteria,
      userEntitlement,
    };
  }, [filtersApplied, hierarchyFilters, apiCriteria, emptyRequestData, userEntitlement]);

  const searchRequestData = useMemo(() => {
    if (!filtersApplied) return emptyRequestData;
    return {
      hierarchyFilters,
      criteriaRequests: apiCriteria,
      userEntitlement,
    };
  }, [filtersApplied, hierarchyFilters, apiCriteria, emptyRequestData, userEntitlement]);

  const { refetch: refetchCount } = useRequest<any>({
    url: "employee_shift/count/searchWithHierarchy",
    method: "POST",
    data: countRequestData,
    onSuccess: (data: any) => {
      if (data != null) setTotalCount(data || 0);
    },
    onError: () => {
      if (filtersApplied) setTotalCount(0);
    },
    dependencies: [],
  });

  const { refetch, loading } = useRequest<any[]>({
    url: `employee_shift/searchWithHierarchy?offset=${offset}&limit=${ITEMS_PER_PAGE}`,
    method: "POST",
    data: searchRequestData,
    onSuccess: (data) => {
      if (filtersApplied && data != null) {
        const active = (Array.isArray(data) ? data : []).filter(
          (item: any) => item?.isDeleted !== true
        );
        setOriginalData(active);
        onDataLoaded(active);
        const transformed = active.map((item: any) => ({
          _id: item._id,
          employeeID: item.employeeID || "",
          shiftGroupCode: item.shiftGroupCode || "",
          fromDate: item.fromDate || "",
          toDate: item.toDate || "",
          shift: item.shift || {},
        }));
        setTableData(transformed);
      }
    },
    onError: () => {
      if (filtersApplied) {
        setTableData([]);
        setOriginalData([]);
        onDataLoaded([]);
      }
    },
    dependencies: [],
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      debounceRef.current = null;
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm]);

  const prevRefreshKeyRef = useRef(refreshKey);
  useEffect(() => {
    if (refreshKey !== prevRefreshKeyRef.current && filtersApplied) {
      prevRefreshKeyRef.current = refreshKey;
      setCurrentPage(1);
      refetch();
      refetchCount();
    }
  }, [refreshKey, filtersApplied]);

  useEffect(() => {
    if (!filtersApplied) return;
    refetch();
    refetchCount();
  }, [currentPage, debouncedSearchTerm, selectedField, filtersApplied]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return (
    <>
      <EmployeeShiftFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedField={selectedField}
        setSelectedField={setSelectedField}
        searchFields={SEARCH_FIELDS}
        filtersApplied={filtersApplied}
        onFilterClick={onFilterClick}
        onAddNew={onAddNew}
        canAdd={addMode}
      />
      <EmployeeShiftTable
        shiftData={tableData}
        loading={loading}
        currentPage={currentPage}
        totalCount={totalCount}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        editMode={editMode}
        deleteMode={deleteMode}
        viewMode={viewMode}
      />
    </>
  );
}