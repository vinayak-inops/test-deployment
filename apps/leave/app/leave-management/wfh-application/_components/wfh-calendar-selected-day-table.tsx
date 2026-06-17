"use client";

import { useEffect, useMemo, useState } from "react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { X, Search, Filter } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Button } from "@repo/ui/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import WfhApplicationTable from "./wfh-application-table";
import WfhRequestsPopup from "./wfh-requests-popup";

type CalendarViewMode = "individual" | "manager";

type WfhApplicationItem = {
  _id?: string;
  employeeID?: string;
  fromDate?: string;
  toDate?: string;
  fromDuration?: string;
  toDuration?: string;
  workflowState?: string;
  description?: string;
  uploadedBy?: string;
  createdOn?: string;
};

type WfhCalendarSelectedDayTableProps = {
  selectedDateKey: string;
  viewMode: CalendarViewMode;
  dailyWfhCount: number;
  tenantCode?: string;
  employeeId?: string;
  isSelfPermission: boolean;
  isAllPermission: boolean;
  onClose: () => void;
};

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateLabel(dateKey: string) {
  const date = parseDate(dateKey);
  if (!date) return dateKey;

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Search field options
const searchFields = [
  { value: "employeeID", label: "Employee ID" },
  { value: "description", label: "Description" },
  { value: "uploadedBy", label: "Uploaded By" },
];

export default function WfhCalendarSelectedDayTable({
  selectedDateKey,
  viewMode,
  dailyWfhCount,
  tenantCode,
  employeeId,
  isSelfPermission,
  isAllPermission,
  onClose,
}: WfhCalendarSelectedDayTableProps) {
  const [applications, setApplications] = useState<WfhApplicationItem[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<WfhApplicationItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Search state
  const [searchField, setSearchField] = useState<"employeeID" | "description" | "uploadedBy">("employeeID");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
      setCurrentPage(1); // Reset to first page on search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);

  const requestData = useMemo(() => {
    const data: any[] = [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      { field: "fromDate", value: selectedDateKey, operator: "lte" },
      { field: "toDate", value: selectedDateKey, operator: "gte" },
      { field: "workflowState", value: "APPROVED", operator: "eq" },
    ];

    // Add search filter if debounced search value exists
    if (debouncedSearchValue.trim()) {
      data.push({
        field: searchField,
        value: debouncedSearchValue.trim(),
        operator: "like", // Using 'like' for partial matching
      });
    }

    // Add sorting
    data.push({ field: "createdOn", value: "", operator: "desc" });

    // Add employee filters
    if (employeeId) {
      if (isSelfPermission)
        data.push({ field: "employeeID", value: employeeId, operator: "eq" });
      else if (isAllPermission)
        data.push({ field: "createdBy", value: employeeId, operator: "eq" });
    }

    return data;
  }, [
    tenantCode,
    selectedDateKey,
    employeeId,
    isSelfPermission,
    isAllPermission,
    debouncedSearchValue,
    searchField,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [requestData]);

  const { refetch: refetchCount } = useRequest<any>({
    url: "wfhApplication/count",
    method: "POST",
    data: requestData,
    onSuccess: (data: any) => setTotalCount(data || 0),
    onError: () => setTotalCount(0),
    dependencies: [requestData], // Re-fetch when requestData changes
  });

  const { loading, refetch } = useRequest<WfhApplicationItem[]>({
    url: `wfhApplication/search?offset=${offset}&limit=${itemsPerPage}`,
    method: "POST",
    data: requestData,
    onSuccess: (data: any) => setApplications(Array.isArray(data) ? data : []),
    onError: () => setApplications([]),
    dependencies: [requestData, offset, itemsPerPage],
  });

  const refreshAll = () => {
    refetch();
    refetchCount();
  };

  const selectedDayTableData = useMemo(() => {
    return applications.map((application, index) => ({
      _id:
        application._id ||
        `${application.employeeID || "wfh"}-${selectedDateKey}-${index}`,
      employeeID: application.employeeID || "",
      fromDate: application.fromDate || "",
      toDate: application.toDate || "",
      fromDuration: application.fromDuration || "",
      toDuration: application.toDuration || "",
      description: application.description || "",
      workflowState: application.workflowState || "APPROVED",
      uploadedBy: application.uploadedBy,
      createdOn: application.createdOn,
    }));
  }, [applications, selectedDateKey]);

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedRequest(null);
    onClose();
  };

  // Clear search handler
  const handleClearSearch = () => {
    setSearchValue("");
    setDebouncedSearchValue("");
    setCurrentPage(1);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={(event) => {
          if (event.target === event.currentTarget) closePopup();
        }}
      >
        <div className="flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-4 py-3 md:px-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {formatDateLabel(selectedDateKey)}
              </h3>
              <p className="text-xs text-gray-500">
                {viewMode === "individual"
                  ? `${totalCount} approved WFH request${
                      totalCount === 1 ? "" : "s"
                    }`
                  : `${dailyWfhCount} WFH employee${
                      dailyWfhCount === 1 ? "" : "s"
                    } | ${totalCount} approved WFH request${
                      totalCount === 1 ? "" : "s"
                    }`}
              </p>
            </div>
            <button
              type="button"
              onClick={closePopup}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close WFH applications popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search Bar - Added */}
          <div className="border-b border-gray-200 bg-gray-50/30 px-4 py-3 md:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-2">
                <div className="flex flex-1 items-center overflow-hidden rounded-lg border border-gray-200">
                  {/* Field Selection */}
                  <div className="flex items-center border-r border-gray-200 bg-gray-50 px-3 py-2">
                    <Filter className="mr-2 h-4 w-4 text-gray-400" />
                    <Select
                      value={searchField}
                      onValueChange={(value) => {
                        setSearchField(value as typeof searchField);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-6 w-32 border-none p-0 text-sm font-medium text-gray-900 focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {searchFields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={`Search by ${
                        searchFields.find((f) => f.value === searchField)
                          ?.label
                      }...`}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="h-10 border-none pl-10 pr-3 text-sm focus:ring-0"
                    />
                    {searchValue && (
                      <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Active search indicator */}
                {searchValue && (
                  <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span>Searching: {searchField === "employeeID" ? "Employee ID" : searchField === "description" ? "Description" : "Uploaded By"}</span>
                  </div>
                )}
              </div>

              {/* Results count */}
              <div className="text-xs text-gray-500">
                {totalCount} result{totalCount !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white p-3">
            <WfhApplicationTable
              data={selectedDayTableData}
              loading={loading}
              externalPagination={{
                currentPage,
                totalPages,
                totalItems: totalCount,
                itemsPerPage,
                startIndex,
                endIndex,
                onPageChange: setCurrentPage,
              }}
              onOpenDetails={(row) => {
                setSelectedRequest(row);
                setIsPopupOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      <WfhRequestsPopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          setSelectedRequest(null);
        }}
        row={selectedRequest}
        loading={loading}
        isSelfPermission={isSelfPermission}
        isAllPermission={isAllPermission}
        userMode="user"
        onActionSuccess={refreshAll}
      />
    </>
  );
}