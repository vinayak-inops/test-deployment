"use client";
import { Button } from "@repo/ui/components/ui/button";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Mail,
  MoreVertical,
  Phone,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode";
import PDFByteViewer from "./PDFByteViewer";
import ExcelViewer from "./ExcelViewer";
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info";
import { ArrowUp } from "lucide-react";

interface ScrollableSectionProps {
  title: string;
  count: number;
  contacts: any[];
  filters?: { 
    searchTerm: string; 
    selectedFilters: string[] 
  };
}

export default function ScrollableSection({
  title,
  count,
  contacts,
  filters,
}: ScrollableSectionProps) {
  const [reportData, setReportData] = useState<any[]>([]);
  const [filteredReportData, setFilteredReportData] = useState<any[]>([]);
  const [reportsGenerate, setReportsGenerate] = useState<boolean>(false);
  const [currentLimit, setCurrentLimit] = useState<number>(20);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMoreData, setHasMoreData] = useState<boolean>(true);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerTargetRef = useRef<HTMLDivElement>(null);
  const tenantCode = useGetTenantCode();
  const { employeeId } = useKeyclockRoleInfo();

  // Role permissions check
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "reports",
    screenName: "reportsGenerate",
  });

  useEffect(() => {
    setReportsGenerate(!!(rolePermissions as any)?.reportsGenerate);
  }, [rolePermissions]);

  // Fetch reports data
  const {
    data: attendanceResponse,
    loading: attendanceLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: `reports/search?offset=${0}&limit=${currentLimit}`,
    method: 'POST',
    data: [
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
    ],
    dependencies: [], // Empty dependencies - fetch manually
    onSuccess: (data: any) => {
      // Handle response data
      let responseData = data;
      if (Array.isArray(data)) {
        responseData = data;
      } else if (data?.data && Array.isArray(data.data)) {
        responseData = data.data;
      } else if (data?.data && !Array.isArray(data.data)) {
        responseData = [data.data];
      }

      // If loading more, append only NEW items to existing data; otherwise replace
      if (isLoadingMore && reportData.length > 0) {
        // Get existing IDs to avoid duplicates
        const existingIds = new Set(reportData.map(r => r._id));
        const newItems = responseData.filter((item: any) => !existingIds.has(item._id));
        setReportData(prev => [...prev, ...newItems]);
      } else {
        setReportData(responseData);
      }

      // Check if there's more data to load (if we got less than requested, we're at the end)
      setHasMoreData(responseData.length >= currentLimit);
      setIsLoadingMore(false);
    },
    onError: (error: any) => {
      console.error("Error fetching reports data:", error);
      setIsLoadingMore(false);
      setHasMoreData(false); // Stop trying to load more on error
    },
  });

  // Fetch when limit changes (for loading more)
  useEffect(() => {
    if (currentLimit > 20 && tenantCode && isLoadingMore) {
      fetchAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLimit]);

  // Debounced scroll handler for scroll-to-top button visibility
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    setShowScrollToTop(scrollTop > 300);
  }, []);

  // Scroll event handler for scroll-to-top button
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Intersection Observer for infinite scroll - more efficient than scroll events
  useEffect(() => {
    const observerTarget = observerTargetRef.current;
    if (!observerTarget || isLoadingMore || !hasMoreData || attendanceLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore && hasMoreData) {
          setIsLoadingMore(true);
          setCurrentLimit(prev => prev + 20);
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(observerTarget);

    return () => {
      observer.disconnect();
    };
  }, [isLoadingMore, hasMoreData, attendanceLoading]);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  // Initial fetch and refresh handler
  useEffect(() => {
    if (tenantCode) {
      // Reset when tenantCode changes
      setCurrentLimit(20);
      setReportData([]);
      setHasMoreData(true);
      setIsLoadingMore(false);
      fetchAttendance();
    }

    const handleRefreshReports = () => {
      setCurrentLimit(20);
      setReportData([]);
      setHasMoreData(true);
      setIsLoadingMore(false);
      fetchAttendance();
    };

    window.addEventListener('refreshReports', handleRefreshReports);
    return () => {
      window.removeEventListener('refreshReports', handleRefreshReports);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode]);

  // Filter reports based on search term and selected filters
  useEffect(() => {
    if (!reportData) return;

    let filtered = [...reportData];

    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter((report) => {
        const searchableFields = [
          report.reportName,
          report.fileName,
          report.reportTitle,
          report.status,
        ].filter(Boolean).map(field => field.toLowerCase());
        
        return searchableFields.some(field => field.includes(searchLower));
      });
    }

    if (filters?.selectedFilters?.length) {
      filtered = filtered.filter((report) => {
        return filters.selectedFilters.some(filter => {
          const reportType = report.reportType?.toLowerCase();
          const extension = report.extension?.toLowerCase();
          const status = report.status?.toLowerCase();
          const filterLower = filter.toLowerCase();

          return [reportType, extension, status].some(field => 
            field === filterLower
          );
        });
      });
    }

    setFilteredReportData(filtered);
  }, [reportData, filters]);

  // Show loading only on initial load (when there's no data)
  if (attendanceLoading && reportData.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-4"></div>
          <div className="text-gray-600">Loading reports...</div>
        </div>
      </div>
    );
  }

  if (attendanceError && reportData.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-500 text-lg font-semibold mb-2">Error loading reports</div>
          <button
            onClick={() => {
              setCurrentLimit(20);
              setReportData([]);
              setHasMoreData(true);
              setIsLoadingMore(false);
              fetchAttendance();
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!attendanceLoading && filteredReportData.length === 0 && reportData.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-gray-400 text-lg mb-2">No reports found</div>
          <div className="text-gray-400 text-sm">Try adjusting your filters</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={scrollContainerRef}
        className="py-4 rounded-2xl px-2 min-w-[1280px] max-h-[calc(100vh-200px)] overflow-y-auto scroll-hidden scroll-smooth"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredReportData.map((report, index) => (
            <div 
              key={report._id} 
              className="p-0 opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]"
              style={{ animationDelay: `${Math.min(index * 20, 500)}ms` }}
            >
              {report.extension?.toLowerCase() === 'pdf' ? (
                <PDFByteViewer 
                  fileName={report.reportName || report.fileName || 'Report'}   
                  base64=""
                  createdAt={report.createdOn || report.createdAt || report.date}
                  _id={report._id}
                  report={report}
                  permission={{
                    reportsStatus: reportsGenerate
                  }}
                />
              ) : (
                <ExcelViewer 
                  fileName={report.reportName || report.fileName || 'Report'} 
                  base64=""
                  createdAt={report.createdOn || report.createdAt || report.date} 
                  _id={report._id}
                  report={report}
                  permission={{
                    reportsStatus: reportsGenerate
                  }}
                />
              )}
            </div>
          ))}
        </div>
        
        {/* Intersection Observer target for infinite scroll */}
        <div ref={observerTargetRef} className="h-1" />
        
        {/* Loading indicator for infinite scroll - shown at the end when fetching */}
        {isLoadingMore && (
          <div className="flex flex-col justify-center items-center py-8 mt-4 opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500 mb-2"></div>
            <div className="text-gray-500 text-sm">Loading more reports...</div>
          </div>
        )}
        
        {/* End of data indicator */}
        {!hasMoreData && filteredReportData.length > 0 && !isLoadingMore && (
          <div className="flex justify-center items-center py-8 mt-4 opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards]">
            <div className="text-gray-400 text-sm">No more reports to load</div>
          </div>
        )}

        {/* Empty filtered state */}
        {filteredReportData.length === 0 && reportData.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 text-lg mb-2">No reports match your filters</div>
            <div className="text-gray-400 text-sm">Try adjusting your search criteria</div>
          </div>
        )}
      </div>

      {/* Scroll to top button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-300 opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards] hover:scale-110"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}