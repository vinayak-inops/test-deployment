"use client"

import ReportInfoSection from "./report-info-section";
import AutoStutuesUpdate from "../auto-stutues-update";
import ReportHeader from "./report-header";
import ReportViewerModal from "./report-viewer-modal";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { decryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info";
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode";
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64";
import { Button } from "@repo/ui/components/ui/button";
import { DownloadCloud, X, CheckCircle, AlertCircle, FileText } from "lucide-react";
import * as XLSX from 'xlsx';

interface ReportsPageProps {
  id?: string; // Optional prop for when called from parent component
}

export default function ReportsPage({ id: propId }: ReportsPageProps = {}) {
  const [open, setOpen] = useState(false);
  const [timelineReportData, setTimelineReportData] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<string>('');
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [excelLoading, setExcelLoading] = useState(false);
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Get employeeId from cookie using hook
  const { employeeId: currentUserEmployeeId } = useKeyclockRoleInfo();
  const tenantCode = useGetTenantCode();

  // Priority: prop > query parameter > dynamic route parameter
  const encryptedFileId = propId || searchParams.get('id') || params?.["report-page"];

  // State for decrypted fileId and validation
  const [fileId, setFileId] = useState<string | null>(null);
  const [isEmployeeIdMatch, setIsEmployeeIdMatch] = useState<boolean>(true);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  // Decrypt and validate: First check employeeId, then check _id, then pass id
  useEffect(() => {
    if (!encryptedFileId || typeof encryptedFileId !== 'string') {
      setFileId(null);
      setIsEmployeeIdMatch(false);
      return;
    }

    setIsDecrypting(true);
    try {
      const decryptedData = decryptEmployeeData(encryptedFileId);
      
      // First check: employeeId match
      if (decryptedData.employeeId !== currentUserEmployeeId) {
        setIsEmployeeIdMatch(false);
        setFileId(null);
        setIsDecrypting(false);
        return;
      }

      // Second check: _id exists
      if (!decryptedData._id) {
        setIsEmployeeIdMatch(false);
        setFileId(null);
        setIsDecrypting(false);
        return;
      }

      // Pass the _id
      setFileId(decryptedData._id);
      setIsEmployeeIdMatch(true);
    } catch (error) {
      setIsEmployeeIdMatch(false);
      setFileId(null);
    } finally {
      setIsDecrypting(false);
    }
  }, [encryptedFileId, currentUserEmployeeId]);

  // Debug logging
  const [reportsGenerate, setReportsGenerate] = useState<any>(false);


  const contractorEmployee = "reportsGenerate"
  // Centralized role-permissions
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "reports",
    screenName: contractorEmployee,
  });

  useEffect(() => {
    setReportsGenerate(!!(rolePermissions as any)?.reportsGenerate);
  }, [rolePermissions]);

  const {
    data: reportData,
    error,
    loading,
    refetch
  } = useRequest<any>({
    url: `map/reports/search?_id=${fileId}`,
    method: 'GET',
    onSuccess: (data: any) => {
    },
    onError: (error) => {
      console.error('Error loading report data:', error);
    },
  });

  useEffect(() => {
    refetch();
  }, []);



  // Get the first report from the array or use default
  const report = Array.isArray(reportData) && reportData.length > 0 ? reportData[0] : null;

  // Ensure Excel files have proper .xlsx extension
  const getProperExtension = (ext: string) => {
    if (ext?.toLowerCase() === 'excel') {
      return 'xlsx';
    }
    return ext || 'pdf';
  };

  const extension = getProperExtension(report?.extension);

  // Create enhanced report data with timeline report if available
  const enhancedReport = {
    ...report,
    report: timelineReportData || report?.report || ""
  };

  // Use the hook to fetch file data
  const { fetchByteArray, loading: fileLoading, result: fileResult } = useByteToBase64({
    onSuccess: (result) => {
      if (result.success && result.bytes && viewerOpen) {
        // Process Excel if needed
        const ext = enhancedReport?.extension?.toLowerCase();
        if (ext === 'excel' || ext === 'xlsx' || ext === 'xls') {
          processExcelData(result.bytes);
        }
      }
    },
    onError: (error) => {
      console.error('Error fetching file in ReportsPage:', error);
    }
  });

  // Process Excel data
  const processExcelData = (bytes: Uint8Array) => {
    setExcelLoading(true);
    try {
      const workbook = XLSX.read(bytes, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(firstSheet, { 
        header: 1, 
        defval: '',
        raw: false
      });
      const filteredData = (sheetData as any[][]).filter(row => 
        row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')
      );
      setExcelData(filteredData.length > 0 ? filteredData : []);
    } catch (e) {
      console.error('Error parsing Excel:', e);
      setExcelData([]);
    } finally {
      setExcelLoading(false);
    }
  };

  // Process Excel when viewer opens or fileResult changes
  useEffect(() => {
    if (viewerOpen && viewerUrl && (viewerType === 'excel' || viewerType === 'xlsx' || viewerType === 'xls')) {
      // If we have fileResult bytes, use them
      if (fileResult?.bytes) {
        processExcelData(fileResult.bytes);
      } else if (enhancedReport?.report && typeof enhancedReport.report === 'string') {
        const isPath = enhancedReport.report.startsWith('/') || enhancedReport.report.startsWith('app/');
        if (!isPath) {
          // It's base64, parse it
          try {
            const binary = atob(enhancedReport.report);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            processExcelData(bytes);
          } catch (e) {
            console.error('Error parsing base64 Excel:', e);
          }
        } else {
          // It's a path, fetch it
          const fileType = getMimeType(enhancedReport.extension || 'pdf');
          fetchByteArray(enhancedReport.report, fileType);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerOpen, viewerUrl, viewerType, fileResult]);

  // Check if employeeId matches - show access denied if not
  if (!isDecrypting && !isEmployeeIdMatch) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this report.</p>
        </div>
      </div>
    );
  }

  // Show loading while decrypting
  if (isDecrypting) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating access...</p>
        </div>
      </div>
    );
  }

  // Check if fileId is available
  if (!fileId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Report ID Provided</h2>
          <p className="text-gray-600">Please provide a report ID in the URL query parameters.</p>
          <p className="text-sm text-gray-500 mt-2">Example: /reports?mode=all&id=12345678</p>
        </div>
      </div>
    );
  }

  // Function to handle report data from timeline items
  const handleTimelineReportData = (reportData: string) => {
    setTimelineReportData(reportData);
  };

  // Function to handle viewing file
  const handleViewFile = async () => {
    if (enhancedReport?.report && typeof enhancedReport.report === 'string') {
      try {
        // Check if it's a path or base64
        const isPath = enhancedReport.report.startsWith('/') || enhancedReport.report.startsWith('app/');
        if (isPath) {
          // It's a path, fetch it via hook
          const fileType = getMimeType(enhancedReport.extension || 'pdf');
          const result = await fetchByteArray(enhancedReport.report, fileType);
          if (result.success && result.bytes) {
            const bytesArray = Uint8Array.from(result.bytes);
            const blob = new Blob([bytesArray], { type: fileType });
            
            if (blob.size === 0) {
              throw new Error('Generated file is empty');
            }

            const url = window.URL.createObjectURL(blob);
            setViewerUrl(url);
            setViewerType(enhancedReport.extension || 'pdf');
            setViewerOpen(true);
            return;
          }
        }

        // Validate base64 string
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(enhancedReport.report)) {
          throw new Error('Invalid base64 string format');
        }

        // Convert base64 to blob
        const byteCharacters = atob(enhancedReport.report);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: getMimeType(enhancedReport.extension || 'pdf')
        });

        if (blob.size === 0) {
          throw new Error('Generated file is empty');
        }

        // Open modal viewer
        const url = window.URL.createObjectURL(blob);
        setViewerUrl(url);
        setViewerType(enhancedReport.extension || 'pdf');
        setViewerOpen(true);
      } catch (error) {
        console.error('Error viewing file from ReportsPage:', error);
        alert(`Failed to view file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.warn('No report data available for viewing in ReportsPage');
      alert('No report data available for viewing.');
    }
  };

  // Function to close viewer and cleanup
  const closeViewer = () => {
    if (viewerUrl) {
      window.URL.revokeObjectURL(viewerUrl);
    }
    setViewerOpen(false);
    setViewerUrl(null);
    setViewerType('');
    setExcelData([]);
  };

  // Sanitize and prepare a safe file name
  const getSafeFileName = (name: string) => {
    const fallback = 'report';
    const base = (name || fallback).toString().trim();
    const sanitized = base
      .replace(/[\\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return sanitized || fallback;
  };

  // Function to handle report download
  const handleReportDownload = async () => {
    if (enhancedReport?.report && typeof enhancedReport.report === 'string') {
      try {
        // Check if it's a path or base64
        const isPath = enhancedReport.report.startsWith('/') || enhancedReport.report.startsWith('app/');
        if (isPath) {
          // It's a path, fetch it via hook
          const fileType = getMimeType(enhancedReport.extension || 'pdf');
          const result = await fetchByteArray(enhancedReport.report, fileType);
          if (result.success && result.bytes) {
            const bytesArray = Uint8Array.from(result.bytes);
            const blob = new Blob([bytesArray], { type: fileType });
            
            if (blob.size === 0) {
              throw new Error('Generated file is empty');
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${getSafeFileName(`${tenantCode}_${enhancedReport?.reportName}`)}.${getFileExtension(enhancedReport.extension || 'pdf')}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            return;
          }
        }

        // Validate base64 string
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(enhancedReport.report)) {
          throw new Error('Invalid base64 string format');
        }

        // Convert base64 to blob
        const byteCharacters = atob(enhancedReport.report);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: getMimeType(enhancedReport.extension || 'pdf')
        });

        // Validate blob size
        if (blob.size === 0) {
          throw new Error('Generated file is empty');
        }

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report.${getFileExtension(enhancedReport.extension || 'pdf')}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

      } catch (error) {
        console.error('Error downloading report from ReportsPage:', error);
        throw error;
      }
    } else {
      console.warn('No report data available for download in ReportsPage');
      throw new Error('No report data available for download.');
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

  // Function to get proper file extension for download
  const getFileExtension = (ext: string) => {
    const normalizedExt = ext.toLowerCase().trim();

    // Map 'excel' to 'xlsx' for proper Excel format
    if (normalizedExt === 'excel') {
      return 'xlsx';
    }

    return normalizedExt;
  };

  return (
    <>
      {
        (reportsGenerate) ? (
          <>
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 px-12">
                <ReportHeader
                  reportTitle={enhancedReport?.reportTitle}
                  reportName={enhancedReport?.reportName}
                  extension={enhancedReport?.extension}
                  hasReport={!!enhancedReport?.report}
                  onViewFile={handleViewFile}
                  onDownloadReport={handleReportDownload}
                />
              </div>
              {/* Content Area */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                <div className="w-full max-w-7xl mx-auto flex flex-1 overflow-hidden min-h-0">
                  {/* Left Side - Report Information */}
                  <div className="flex-1 flex flex-col border-r border-gray-100 min-h-0 overflow-hidden">
                    <div 
                      className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-0 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                      style={{ 
                        overscrollBehavior: 'contain',
                        overscrollBehaviorY: 'contain',
                        overscrollBehaviorX: 'none',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onWheel={(e) => {
                        const target = e.currentTarget;
                        const isScrollable = target.scrollHeight > target.clientHeight;
                        const isAtTop = target.scrollTop === 0;
                        const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
                        
                        if (!isScrollable) {
                          e.preventDefault();
                          return;
                        }
                        
                        if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                          e.stopPropagation();
                        }
                      }}
                      onTouchMove={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <ReportInfoSection
                        fileId={fileId as string}
                        data={enhancedReport}
                        permission={{
                          downloadReports: reportsGenerate
                        }}
                        onDownloadClick={handleReportDownload}
                      />
                    </div>
                  </div>

                  {/* Right Side - Auto Status Update Panel */}
                  <div className="w-[360px] flex flex-col min-h-0 overflow-hidden">
                    <div 
                      className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                      style={{ 
                        overscrollBehavior: 'contain',
                        overscrollBehaviorY: 'contain',
                        overscrollBehaviorX: 'none',
                        WebkitOverflowScrolling: 'touch'
                      }}
                      onWheel={(e) => {
                        const target = e.currentTarget;
                        const isScrollable = target.scrollHeight > target.clientHeight;
                        const isAtTop = target.scrollTop === 0;
                        const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
                        
                        if (!isScrollable) {
                          e.preventDefault();
                          return;
                        }
                        
                        if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
                          e.stopPropagation();
                        }
                      }}
                      onTouchMove={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="w-full px-0 py-0">
                        <AutoStutuesUpdate
                          fileId={fileId as string}
                          setOpen={setOpen}
                          extension={extension}
                          reportData={enhancedReport}
                          onTimelineReportData={handleTimelineReportData}
                          permission={{
                            downloadReports: reportsGenerate
                          }}
                          onDownloadClick={handleReportDownload}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* File Viewer Modal */}
            <ReportViewerModal
              isOpen={viewerOpen}
              onClose={closeViewer}
              viewerUrl={viewerUrl}
              viewerType={viewerType}
              reportName={enhancedReport?.reportName}
              reportData={enhancedReport}
              excelData={excelData}
              excelLoading={excelLoading}
              fileLoading={fileLoading}
              onDownload={handleReportDownload}
              onDownloadClick={handleReportDownload}
              hasDownloadPermission={reportsGenerate}
            />
          </>
        ) : (
          <></>
        )
      }
    </>
  );
}