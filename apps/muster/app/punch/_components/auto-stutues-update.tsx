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
  X,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@repo/ui/components/ui/card";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";

// Timeline Item Component
const TimelineItem = ({ item, isLast, extension, reportData, onReportData }: any) => {
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
    }
  }, [hasReport, item.report, onReportData, item._id, extension]);

  // Function to handle report download from timeline item
  const handleTimelineReportDownload = () => {

    if (item.report && typeof item.report === 'string') {
      try {
        // Validate base64 string
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(item.report)) {
          throw new Error('Invalid base64 string format');
        }

        // Convert base64 to blob
        const byteCharacters = atob(item.report);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { 
          type: getMimeType(extension) 
        });

        // Validate blob size
        if (blob.size === 0) {
          throw new Error('Generated file is empty');
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

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
    if (reportData?.report) {
      try {
        // Validate base64 string
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(reportData.report)) {
          throw new Error('Invalid base64 string format');
        }

        // Convert base64 to blob
        const byteCharacters = atob(reportData.report);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { 
          type: getMimeType(extension) 
        });

        // Validate blob size
        if (blob.size === 0) {
          throw new Error('Generated file is empty');
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
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
        <div className="flex items-center text-sm border-b-2 border-gray-100 pb-1.5 mb-1.5">
          <div className="flex items-center">
            <UserCircle size={14} className="text-blue-600 mr-2" />
            <span className="font-semibold text-gray-700">{item.stateName}</span>
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
          <div className="flex items-center gap-3 justify-end mt-2">
            <button 
              className="flex items-center gap-2 bg-blue-600 text-white py-1 px-4 rounded-md shadow hover:bg-blue-700 transition-colors"
              onClick={handleTimelineReportDownload}
            >
              <Download size={14} />
              <span className="font-medium text-sm">Download Report</span>
            </button>
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
  onTimelineReportData
}: { 
  fileId: any, 
  setOpen: (open: boolean) => void,
  extension?: string,
  reportData?: any,
  onTimelineReportData?: (reportData: string) => void
}) {
  const [timelineData, setTimelineData] = useState<any[]>([]);

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
        
        // Check for report data in timeline items and pass to parent
        if (onTimelineReportData) {
          const timelineReportItem = timelineArray.find((item: any) => 
            item.report && typeof item.report === 'string' && item.report.trim() !== ''
          );
          
          if (timelineReportItem) {
            onTimelineReportData(timelineReportItem.report);
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
      alert('Failed to load workflow data. Please try again.');
    },
    dependencies: [fileId]
  });


  // Ensure timelineData is always an array
  const safeTimelineData = Array.isArray(timelineData) ? timelineData : [];

  return (
    <div className="border-0 backdrop-blur-sm overflow-y-auto h-full scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
      <div className="p-4 relative">
        {/* <Button onClick={() => setOpen(false)} variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full absolute top-2 right-2">
          <ArrowLeft size={18} />
        </Button> */}
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">Status Updates</h3>
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
          <div className="text-red-500 text-center py-4 px-4 bg-red-50 rounded-md mx-4">
            Failed to load status updates. Please try again.
          </div>
        )}

        {!loading && !error && safeTimelineData.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-8">
            <div className="flex items-center justify-center h-12 w-12 bg-amber-100 rounded-full pulse-animation">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-700">Status is Updating</h3>
            <p className="mt-2 text-xs text-gray-500 max-w-md px-4">
              We are processing your file. Status updates will appear here shortly.
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
