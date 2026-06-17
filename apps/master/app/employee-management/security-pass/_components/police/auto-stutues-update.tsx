"use client";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  UserCircle,
  Clock,
  Upload,
  UploadCloud,
  LayoutGrid,
  FileUp,
  Download,
  Send,
  UploadCloudIcon,
  Plus,
  SearchCheck,
  Circle,
  CircleEllipsis,
  CircleEllipsisIcon,
  DownloadCloud,
  RefreshCcw,
} from "lucide-react";
import TopTitleDescription from "@repo/ui/components/titleline/top-title-discription";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@repo/ui/components/ui/card";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";

// Utility function for base64 to blob conversion
const base64ToBlob = (base64Data: string, mimeType: string): Blob => {
  try {
    // Input validation
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error('Invalid input: base64Data must be a non-empty string');
    }

    // Validate base64 string format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Data)) {
      throw new Error('Invalid base64 string format');
    }

    // Check for reasonable file size (max 50MB to prevent memory issues)
    const estimatedSize = Math.ceil((base64Data.length * 3) / 4);
    if (estimatedSize > 50 * 1024 * 1024) {
      throw new Error('File size too large (max 50MB)');
    }

    // Convert base64 to binary array using proper binary handling
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob with proper MIME type
    const blob = new Blob([bytes], { type: mimeType });
    
    // Validate blob was created successfully
    if (blob.size === 0) {
      throw new Error('Generated file is empty');
    }

    return blob;
  } catch (error) {
    console.error('Error converting base64 to blob:', error);
    throw error;
  }
};

// Utility function for downloading blob
const downloadBlob = (blob: Blob, filename: string) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    throw error;
  }
};

// Timeline Item Component
const TimelineItem = ({ item, isLast, extension, reportData, onReportData, setPdfData, onShowDownloadProgress }: any) => {
  const isSuccess = item.isSuccess === true || item.isSuccess === "true";
  const [showDetails, setShowDetails] = useState(false);

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  // Check if this timeline item has a report to download
  const hasReport = item.report && typeof item.report === 'string' && item.report.trim() !== '';

  // Call onReportData when report is available
  useEffect(() => {
    if (hasReport && onReportData) {
      onReportData(item.report);
      
      // Also store the PDF data in the parent component's state
      if (setPdfData) {
        setPdfData(item.report);
      }
    }
  }, [hasReport, item.report, onReportData, item._id, extension, setPdfData]);

  // Function to handle report download from timeline item
  const handleTimelineReportDownload = () => {

    // Show download progress popup
    if (onShowDownloadProgress) {
      onShowDownloadProgress();
    }

    if (item.report && typeof item.report === 'string') {
      try {
        const mimeType = getMimeType(extension);
        const blob = base64ToBlob(item.report, mimeType);
        
        downloadBlob(blob, `report.${extension}`);
      } catch (error) {
        console.error('Error downloading report:', error);
        alert(`Failed to download report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.warn('No report data available for download');
      alert('No report data available for download.');
    }
  };

  // Function to handle report download from global reportData (existing functionality)
  const handleReportDownload = () => {
    // Show download progress popup
    if (onShowDownloadProgress) {
      onShowDownloadProgress();
    }

    if (reportData?.report) {
      try {
        const mimeType = getMimeType(extension);
        const blob = base64ToBlob(reportData.report, mimeType);
        downloadBlob(blob, `report.${extension}`);
      } catch (error) {
        console.error('Error downloading report:', error);
        alert(`Failed to download report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      alert('No report data available for download.');
    }
  };

  // Function to get MIME type based on extension
  const getMimeType = (ext: string) => {
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'csv': 'text/csv',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'json': 'application/json',
      'xml': 'application/xml',
      'html': 'text/html',
      'htm': 'text/html',
      'rtf': 'application/rtf',
      'odt': 'application/vnd.oasis.opendocument.text',
      'ods': 'application/vnd.oasis.opendocument.spreadsheet',
      'odp': 'application/vnd.oasis.opendocument.presentation'
    };
    
    const normalizedExt = ext.toLowerCase().trim();
    const mimeType = mimeTypes[normalizedExt];
    
    return mimeType || 'application/octet-stream';
  };

  const formattedDate = new Date(item.timestamp).toLocaleString();
  const isDateInvalid = formattedDate === "Invalid Date";

  if (isDateInvalid) {
    return (
      <div className="mb-6 relative pl-8">
        <div className="absolute left-0 top-2">
          <div className="bg-amber-400 pulse-animation rounded-full p-1 z-10 shadow-sm">
            <Clock size={16} color="white" strokeWidth={2.5} />
          </div>
        </div>

        {!isLast && (
          <div className="absolute left-3 top-8 h-full border-l-2 border-blue-100 z-0"></div>
        )}

        <div className="bg-white p-3 rounded-md w-full shadow-sm hover:shadow transition-shadow border border-amber-100">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <UserCircle size={14} className="text-blue-600 mr-2" />
              <span className="font-medium mr-1">Initiated</span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 animate-pulse">
              <Clock size={12} />
              <span>Updating...</span>
            </div>
          </div>
          <div className="border-b border-gray-100 my-2"></div>
          <div className="flex items-center">
            <FileText size={14} className="mr-2 text-amber-500" />
            <span className="text-gray-400 text-xs">Waiting for event details...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 relative pl-8">
      <div className="absolute left-0 top-2">
        <div
          className={`${isSuccess ? "bg-green-500" : "bg-amber-400 pulse-animation"} rounded-full p-1 z-10 shadow-sm`}
        >
          {isSuccess ? (
            <CheckCircle size={16} color="white" strokeWidth={2.5} />
          ) : (
            <Clock size={16} color="white" strokeWidth={2.5} />
          )}
        </div>
      </div>

      {!isLast && (
        <div className="absolute left-3 top-8 h-full border-l-2 border-blue-100 z-0"></div>
      )}

      <div
        className={`bg-white p-3 rounded-md w-full shadow-sm hover:shadow transition-shadow border ${!isSuccess ? "border-amber-100" : "border-gray-100"}`}
      >
        <div className="flex items-center text-sm border-b-2 border-gray-100 pb-1">
          <div className="flex items-center">
            <UserCircle size={14} className="text-blue-600 mr-2" />
            <span className="font-medium mr-1">{item.stateName}</span>
          </div>
          <span className="ml-auto text-xs text-gray-500">{formattedDate}</span>
        </div>

        <div className="flex justify-between items-center mt-1 text-sm text-gray-700">
          <div className="flex items-center">
            <FileText size={14} className={`mr-2 ${!isSuccess ? "text-amber-500" : "text-gray-600"}`} />
            <p className={!isSuccess ? "font-medium text-amber-700" : ""}>{item.eventName}</p>
            {hasReport && (
              <Download size={12} className="ml-1 text-blue-600" />
            )}
            <span className="text-xs text-gray-500">• {item.performedBy}</span>
          </div>

          {(item.consignmentDetails || hasReport) && (
            <CircleEllipsisIcon
              size={18}
              className="ml-auto text-gray-600 rotate-90 cursor-pointer hover:text-blue-600"
              onClick={toggleDetails}
            />
          )}
        </div>

        {item.eventMessage && (
          <p className="text-xs mt-2 text-gray-600">{item.eventMessage}</p>
        )}

        {/* Show download button if timeline item has report data */}
        {hasReport && (
          <div className="flex items-center gap-3 justify-end mt-0">
            {/* <button 
              className="flex items-center gap-2 bg-blue-600 text-white py-1 px-4 rounded-md shadow hover:bg-blue-700 transition-colors"
              onClick={handleTimelineReportDownload}
            >
              <Download size={14} />
              <span className="font-medium text-sm">Download Report</span>
            </button> */}
          </div>
        )}

        {/* Show existing buttons for consignment details */}
        {item.consignmentDetails && (
          <div className="flex items-center gap-3 justify-end mt-2">
            <button className="flex items-center justify-center p-1 bg-white text-blue-600 border border-gray-200 rounded-md shadow-sm hover:shadow-md hover:bg-blue-50 transition-all">
              <UploadCloudIcon size={14} />
            </button>
            <button className="flex items-center justify-center p-1 bg-white text-amber-600 border border-gray-200 rounded-md shadow-sm hover:shadow-md hover:bg-blue-50 transition-all">
              <Send size={14} />
            </button>
            <button 
              className="flex items-center gap-2 bg-amber-700 text-white py-1 px-4 rounded-md shadow hover:bg-amber-800 transition-colors"
              onClick={handleReportDownload}
            >
              <Download size={14} />
              <span className="font-medium text-sm">Download</span>
            </button>
          </div>
        )}
      </div>

      {showDetails && (item.consignmentDetails || hasReport) && (
        <Card className="shadow-sm mt-3 p-0">
          <CardHeader className="pb-2 p-3">
            <h3 className="font-medium text-gray-800 mb-0">
              {item.consignmentDetails?.event || 'Report Available'}
            </h3>
            <p className="text-xs text-gray-500 mt-0">
              {item.consignmentDetails?.description || 'Report is ready for download'}
            </p>
            <p className="text-xs text-gray-500 mt-0">
              {item.consignmentDetails?.time || formattedDate}
            </p>
          </CardHeader>

          <CardContent className="p-0 px-3 pt-0">
            {item.consignmentDetails ? (
              <>
                <h4 className="font-medium text-gray-800 mb-2">
                  {item.consignmentDetails.sheets} Total Sheets
                </h4>

                <div className="grid grid-cols-1 gap-y-1">
                  {item.consignmentDetails.statusCounts.map(
                    (statusItem: any, index: any) => (
                      <div key={index} className="flex flex-wrap items-center">
                        {statusItem.completed ? (
                          <CheckCircle size={14} className="text-blue-600 mr-2" />
                        ) : (
                          <Circle size={14} className="text-blue-600 mr-2" />
                        )}
                        <span className="text-sm text-gray-600">
                          {statusItem.count} {statusItem.status}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Report file is ready</p>
                <p className="text-xs text-gray-500">Format: {extension.toUpperCase()}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between items-center border-t border-gray-100 px-3 py-3 mt-3">
            <span className="text-sm font-medium text-blue-600">
              Download Report
            </span>
            <button 
              className="bg-blue-600 rounded-full w-6 h-6 flex items-center justify-center hover:bg-blue-700 transition-colors"
              onClick={hasReport ? handleTimelineReportDownload : handleReportDownload}
            >
              <DownloadCloud className="h-4 w-4 text-white" />
            </button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default function AutoStatusUpdate({ 
  fileId, 
  setOpen, 
  extension = 'pdf',
  reportData,
  onTimelineReportData,
  setPdfData,
  // onShowDownloadProgress
}: { 
  fileId: any, 
  setOpen: (open: boolean) => void,
  extension?: string,
  reportData?: any,
  setPdfData: (pdfData: string) => void,
  onTimelineReportData?: (reportData: string) => void,
  // onShowDownloadProgress?: any,
}) {
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [pdfData, setPdfDataLocal] = useState<string | null>(null);
  const [hasStartedFetching, setHasStartedFetching] = useState(false);

  // Reset states when fileId changes
  useEffect(() => {
    setTimelineData([]);
    setPdfDataLocal(null);
    setHasStartedFetching(false);
  }, [fileId]);

  // Auto-start fetching when component mounts or fileId changes
  useEffect(() => {
    if (fileId && !hasStartedFetching) {
      setHasStartedFetching(true);
      // Trigger the API call immediately
      refetch();
    }
  }, [fileId, hasStartedFetching]);

  // Update parent component's pdfData state when local state changes
  useEffect(() => {
    if (pdfData && setPdfData) {
      setPdfData(pdfData);
    }
  }, [pdfData, setPdfData]);

  const {
    data,
    error,
    loading,
    refetch
  } = useRequest<any[]>({
    url: `map/workflow_management/search?fileId=${fileId}`,
    method: 'GET',
    onSuccess: (data:any) => {
      if (data) {
        // Ensure data is always an array
        const timelineArray = Array.isArray(data) ? data : (data?.data || data.results || []);
        setTimelineData(timelineArray);
        
        // Check for report data in timeline items and pass to parent immediately
        if (onTimelineReportData) {
          const timelineReportItem = timelineArray.find((item: any) => 
            item.report && typeof item.report === 'string' && item.report.trim() !== ''
          );
          
          if (timelineReportItem) {
            onTimelineReportData(timelineReportItem.report);
            
            // Also set the local PDF data state
            setPdfDataLocal(timelineReportItem.report);
          }
        }
      }
    },
    onError: (error) => {
      console.error('Error loading workflow data:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: error.response?.data
      });
      // Don't show alert for background operations, just log the error
      console.warn('Background workflow data fetch failed, but continuing...');
    },
    dependencies: [fileId]
  });

  // Ensure timelineData is always an array
  const safeTimelineData = Array.isArray(timelineData) ? timelineData : [];

  return (
    <div className="shadow-sm border-0 bg-white/70 backdrop-blur-sm overflow-y-scroll scroll-hidden h-full">
      <div className="p-4 relative">
        <div className="flex justify-between items-start mb-4">
          <TopTitleDescription
            titleValue={{
              title: "Status Updates",
              description: "Real-time status updates for your file processing.",
            }}
          />
          <div className="flex items-center gap-2 ml-4">
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading status updates...</p>
          </div>
        )}
        {error && (
          <div className="text-amber-500 text-center py-4 px-4 bg-amber-50 rounded-md mx-4">
            <p className="text-sm">Status updates may be delayed. PDF generation continues in background.</p>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && safeTimelineData.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-16">
            <div className="flex items-center justify-center h-16 w-16 bg-amber-100 rounded-full pulse-animation">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="mt-6 text-lg font-bold text-gray-800">Status is Updating</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md px-4">
              We are processing your file. Status updates will appear here shortly.
            </p>
            <p className="mt-2 text-xs text-amber-600">
              PDF generation continues in background - check Preview tab
            </p>
          </div>
        )}
        {!loading && !error && safeTimelineData.map((item, idx) => (
          <TimelineItem 
            key={item._id || idx} 
            item={item} 
            isLast={idx === safeTimelineData.length - 1} 
            extension={extension}
            reportData={reportData}
            onReportData={onTimelineReportData}
            setPdfData={setPdfDataLocal} 
          />
        ))}

        
      </div>
      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(251, 191, 36, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
          }
        }
        .pulse-animation {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
}
