"use client"
import Table from "@repo/ui/components/table-dynamic/data-table";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useAdminRole } from "@inops/store/src/hooks/useAdminRole";
import FileManagerHeader from "../../../../../muster/app/punch/individual-punch/table/[...table]/_components/file-manager-header";
import SuspectedPunchDataForm from "./suspectedPunchData-form";

interface PunchRecord {
  _id: string;
  punchedTime: string;
  transactionTime: string;
  inOut: string;
  typeOfMovement: string;
  readerSerialNumber: string;
  uploadTime: string;
  attendanceDate: string;
  employeeID: string;
  organizationCode: string;
  tenantCode: string;
  isDeleted: string;
  state: string;
  date: string;
  _class: string;
  processed: boolean;
  failureDescription?: string;
}

function FileManager({ slectedId }: { slectedId: string }) {
  const [suspectedPunchData, setSuspectedPunchData] = useState<any[]>([]);
  const router = useRouter();
  const [searchField, setSearchField] = useState<string>('employeeID');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollPositionRef = useRef<number>(0);

  // Local state for Punch Form
  const [isPunchFormOpen, setIsPunchFormOpen] = useState(false);
  const [punchFormMode, setPunchFormMode] = useState<{ mode: 'add' | 'edit' | 'view'; id?: string | null }>({ mode: 'add' });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Calculate offset and limit based on current page
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage]);
  const limit = itemsPerPage;

  // Debounce search value - update after 300ms of no typing
  useEffect(() => {
    if (searchValue !== debouncedSearchValue) {
      setIsSearching(true);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
      setIsSearching(false);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchValue]);

  // Build API data array with filters using useMemo
  const apiData = useMemo(() => {
    const filters: any[] = [
      { field: "employeeID", operator: "eq", value: slectedId }
    ];

    // Add search filter if search term exists
    if (debouncedSearchValue.trim()) {
      filters.push({
        field: searchField,
        operator: "like",
        value: debouncedSearchValue.trim()
      });
    }

    return filters;
  }, [slectedId, debouncedSearchValue, searchField]);

  // Count API call to get total collection length
  const {
    data: countData,
    loading: countLoading,
    error: countError,
    refetch: refetchCount,
  } = useRequest<any>({
    url: 'muster/suspectedPunches/count/searchWithHierarchy',
    method: 'POST',
    data: {
      hierarchyFilters: {
        subsidiary: ["M01"],
        division: ["M01"],
        department: ["DEPT01"]
      },
      criteriaRequests: apiData
    },
    onSuccess: (data: any) => {
      setTotalCount(data || 0);
    },
    onError: (error: any) => {
      console.error("Error fetching suspected punches count:", error);
    },
    dependencies: [slectedId, debouncedSearchValue, searchField]
  });

  // Use your request hook to fetch punch data with pagination
  const {
    data: punchDataResponse,
    loading: isLoading,
    error: punchError,
    refetch: fetchPunchData
  } = useRequest({
    url: `muster/suspectedPunches/searchWithHierarchy?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: {
      hierarchyFilters: {
        subsidiary: ["M01"],
        division: ["M01"],
        department: ["DEPT01"]
      },
      criteriaRequests: apiData
    },
    onSuccess: (data: any) => {
      const formattedData = (data || []).map((record: PunchRecord) => ({
        _id: record._id,
        punchedTime: record.punchedTime,
        transactionTime: record.transactionTime,
        inOut: record.inOut,
        typeOfMovement: record.typeOfMovement,
        readerSerialNumber: record.readerSerialNumber,
        uploadTime: record.uploadTime,
        attendanceDate: record.attendanceDate,
        date: record.date,
        employeeID: record.employeeID,
        failureDescription: record.failureDescription,
        // Format time fields for display
        punchedTimeFormatted: formatTimeDisplay(record.punchedTime),
        transactionTimeFormatted: formatTimeDisplay(record.transactionTime),
        // Format date field
        attendanceDateFormatted: formatDateDisplay(record.attendanceDate),
      }));
      setSuspectedPunchData(formattedData);
    },
    onError: (error: any) => {
      console.error("Error fetching punch data:", error);
      setSuspectedPunchData([]);
    },
    dependencies: [slectedId, debouncedSearchValue, searchField, currentPage, offset, limit]
  });

  // Reset to page 1 when debounced search term or field changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchValue, searchField]);

  // Utility to format ISO time strings
  function formatTimeDisplay(isoString: string) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString; // fallback if invalid
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Utility to format date strings
  function formatDateDisplay(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }





  const functionalityList = {
    tabletype: {
      type: "data",
      classvalue: {
        container: "col-span-12 mb-2",
        tableheder: {
          container: "bg-[#f8fafc]",
        },
        label: "text-gray-600",
        field: "p-1",
      },
    },
    columnfunctionality: {
      draggable: {
        status: true,
      },
      handleRenameColumn: {
        status: true,
      },
      slNumber: {
        status: true,
      },
      selectCheck: {
        status: false,
      },
      activeColumn: {
        status: true,
      },
    },
    textfunctionality: {
      expandedCells: {
        status: true,
      },
    },
    filterfunctionality: {
      handleSortAsc: {
        status: true,
      },
      handleSortDesc: {
        status: true,
      },
      search: {
        status: true,
      },
    },
    outsidetablefunctionality: {
      paginationControls: {
        status: true,
        start: "",
        end: "",
      },
      entriesPerPageSelector: {
        status: false,
      },
    },
    buttons: {
      save: {
        label: "Save",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => {},
      },
      submit: {
        label: "Submit",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => {},
      },
      addnew: {
        label: "Add New",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => {},
      },
      cancel: {
        label: "Cancel",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => {},
      },
      actionDelete: {
        label: "Delete",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (id: string) => {},
      },
      actionLink: {
        label: "link",
        status: false,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (item: any) => {
        },
      },
      actionEdit: {
        label: "Edit",
        status: true,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (row: any) => {
          // Store current scroll position before opening form
          scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
          setPunchFormMode({ mode: 'edit', id: row?._id });
          setSelectedId(row?._id);
          setIsPunchFormOpen(true);
        },
      },
    },
  };

  const handleFormClose = useCallback(() => {
    setIsPunchFormOpen(false);
    setSelectedId(null);
    // Restore scroll position after closing form
    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'instant'
      });
    });
  }, []);

  const handleFormSuccess = useCallback(() => {
    fetchPunchData();
    refetchCount();
    setIsPunchFormOpen(false);
    setSelectedId(null);
    // Restore scroll position after closing form
    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'instant'
      });
    });
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="pt-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading suspected punches...</span>
          </div>
        </div>
      </div>
    );
  }



  // Show no data state
  if (!suspectedPunchData || suspectedPunchData.length === 0) {
    return (
      <div className="pt-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-gray-500">
            {slectedId
              ? "No suspected punches found for this employee."
              : "Please select an employee to view suspected punches."
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pt-4">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Suspected Punches</h3>
            <p className="text-sm text-gray-600 mt-1">
              Found {suspectedPunchData.length} suspected punch records for employee {slectedId}
            </p>
          </div>
          <Table functionalityList={functionalityList} data={[...suspectedPunchData].reverse()} />
        </div>
      </div>

      <SuspectedPunchDataForm
        isOpen={isPunchFormOpen}
        onClose={handleFormClose}
        mode={punchFormMode}
        employeeId={slectedId}
        selectedId={selectedId || undefined}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}

export default FileManager;
