'use client';

import { useEffect, useState } from 'react';
import { MoreVertical, Download, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import { useRouter } from 'next/navigation';
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info";
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64";
import ReportStatusPopup from "./ReportStatusPopup";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PDFByteViewerProps {
  fileName: string;
  base64: string;
  createdAt?: string;
  _id?: string;
  report?: any;
  permission: any;
}

// Function to format date in a user-friendly way
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'No date available';
  
  try {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Format: "Jan 15, 2025 at 10:00 AM"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'Invalid date';
  }
};

// Utility function to convert camelCase to Title Case with spaces
// Examples: 
// "attendanceReport" → "Attendance Report"
// "userProfile" → "User Profile"
// "firstName" → "First Name"
// "emailAddress" → "Email Address"
const formatFileName = (text: string): string => {
  if (!text) return text;
  
  // Remove file extension first
  const nameWithoutExtension = text.replace(/\.[^/.]+$/, "");
  
  // Add space before capital letters (except the first character)
  const withSpaces = nameWithoutExtension.replace(/([A-Z])/g, ' $1');
  
  // Capitalize first letter and trim any leading space
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).trim();
};

export default function PDFByteViewer({ fileName, base64, createdAt, _id, report, permission }: PDFByteViewerProps) {
  const [mode, setMode] = useState<'preview' | 'advanced'>('advanced');
  const [isPdfJsReady, setIsPdfJsReady] = useState(false);
  const [thumbnail, setThumbnail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [statusPopupOpen, setStatusPopupOpen] = useState(false);
  const { employeeId } = useKeyclockRoleInfo();
  const router = useRouter();
  
  // Use the hook to fetch file data
  // const { fetchByteArray, loading: fileLoading, result: fileResult } = useByteToBase64({
  //   onSuccess: (result) => {
  //     if (result.success && result.bytes) {
  //       let binary = '';
  //       const chunkSize = 8192;
  //       for (let i = 0; i < result.bytes.length; i += chunkSize) {
  //         const chunk = result.bytes.slice(i, i + chunkSize);
  //         binary += String.fromCharCode.apply(null, Array.from(chunk));
  //       }
  //       const base64String = btoa(binary);
  //       setFileBase64(base64String);
  //     }
  //   },
  //   onError: (error) => {
  //     console.error('Error fetching PDF:', error);
  //   }
  // });

  // Fetch file when report is available
  // useEffect(() => {
  //   if (report) {
  //     const filePath = report.report || report.filePath || report.reportPath || report.path || report.documentPath;
  //     if (filePath) {
  //       const fileType = report.extension?.toLowerCase() === 'pdf' 
  //         ? 'application/pdf' 
  //         : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  //       fetchByteArray(filePath, fileType);
  //     }
  //   }
  // }, [report]);

  // useEffect(() => {
  //   const script = document.createElement('script');
  //   script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  //   script.async = true;
  //   script.onload = () => {
  //     setIsPdfJsReady(true);
  //   };
  //   document.body.appendChild(script);
  //   return () => {
  //     if (document.body.contains(script)) {
  //       document.body.removeChild(script);
  //     }
  //   };
  // }, []);

  const renderPdfThumbnail = async (base64Data: string) => {
    return new Promise<string>(async (resolve, reject) => {
      if (typeof window !== 'undefined' && window?.pdfjsLib?.getDocument) {
        try {
          const binary = atob(base64Data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }

          const loadingTask = window.pdfjsLib.getDocument({ data: bytes });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          
          const canvas = document.createElement('canvas');
          const viewport = page.getViewport({ scale: 0.5 }); // Scale down for thumbnail
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({ 
            canvasContext: canvas.getContext('2d'), 
            viewport 
          }).promise;
          
          resolve(canvas.toDataURL());
        } catch (error) {
          console.error('Error loading PDF:', error);
          reject('Failed to render PDF');
        }
      } else {
        reject('PDF.js is not loaded');
      }
    });
  };

  useEffect(() => {
    const dataToUse = fileBase64 || base64;
    if (mode === 'advanced' && isPdfJsReady && dataToUse) {
      setLoading(true);
      renderPdfThumbnail(dataToUse)
        .then((imgData) => {
          setThumbnail(imgData);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error rendering PDF thumbnail:', error);
          setLoading(false);
        });
    } else if (!dataToUse) {
      setLoading(false);
    }
  }, [mode, isPdfJsReady, base64, fileBase64]);

  // const handleDownload = () => {
  //   const dataToUse = fileBase64 || base64;
  //   if (!dataToUse && !fileResult?.bytes) return;
    
  //   if (fileResult?.bytes) {
  //     const bytesArray = Uint8Array.from(fileResult.bytes);
  //     const blob = new Blob([bytesArray], { type: 'application/pdf' });
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  //     a.click();
  //     URL.revokeObjectURL(url);
  //   } else if (dataToUse) {
  //     const binary = atob(dataToUse);
  //     const bytes = new Uint8Array(binary.length);
  //     for (let i = 0; i < binary.length; i++) {
  //       bytes[i] = binary.charCodeAt(i);
  //     }
      
  //     const blob = new Blob([bytes], { type: 'application/pdf' });
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  //     a.click();
  //     URL.revokeObjectURL(url);
  //   }
  // };

  const handleViewStates = () => {
    if (_id) {
      const encryptedData = encryptEmployeeData({ employeeId: employeeId, _id: _id })
      router.push(`/reports?mode=all&id=${encryptedData}`);
    }
  };

  // Format the date for display
  const formattedDate = formatDate(createdAt);
  
  // Format the filename for display
  const formattedFileName = formatFileName(fileName);

  // Determine report availability and status message
  const rawStatus = report?.status?.toString().toLowerCase();
  const hasReportValue =
    !!(report?.report ||
      report?.filePath ||
      report?.reportPath ||
      report?.path ||
      report?.documentPath);

  let statusLabel = 'PDF Report';
  let statusClasses =
    'inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[10px] font-medium';

  if (!hasReportValue) {
    if (rawStatus === 'failed') {
      statusLabel = 'Report not generated';
      statusClasses =
        'inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-medium';
    } else {
      if (rawStatus === 'COMPLETED') {
        statusLabel = 'Report is completed';
      } else {
        statusLabel = 'Report is generating';
      }
      statusClasses =
        'inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium';
    }
  }

  return (
    <div className="p-0 w-full">
      <div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-gray-100 relative">
          {/* Status pill on card top-right */}
          <div className="absolute top-2 right-2 z-10">
            <button
              type="button"
              onClick={() => setStatusPopupOpen(true)}
              className={`${statusClasses} cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {statusLabel}
            </button>
          </div>

          <div className="w-full h-48 bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
            {/* {fileLoading || loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                  <p className="mt-2 text-sm">Loading Preview...</p>
                </div>
              </div>
            ) : mode === 'advanced' && thumbnail ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <img 
                  src={thumbnail} 
                  alt={fileName} 
                  className="max-w-full max-h-full object-contain shadow-sm" 
                />
              </div>
            ) : ( */}
              <img src="/images/pdflogo.png" alt="PDF" className="w-[80px] h-[80px] object-cover" />
            {/* )} */}
          </div>
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 via-white to-gray-50 relative border-t border-gray-100">
            <div className="ml-4 flex-shrink-0 absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                {
                  permission?.reportsStatus && (
                    <DropdownMenuContent 
                  align="end" 
                  className="w-52 rounded-lg shadow-lg border border-gray-200 bg-white py-1.5"
                >
                  <DropdownMenuItem 
                    onClick={()=>{
                      // handleDownload
                    }}
                    className="flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-100 cursor-pointer gap-2"
                  >
                    <Download className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Download Report</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleViewStates}
                    className="flex items-center px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-100 cursor-pointer gap-2"
                  >
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">View Report</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
                  )
                }
              </DropdownMenu>
            </div>
            <div className="pr-2">
              <h2 className="font-semibold text-[13px] mb-0.5 text-gray-900 truncate line-clamp-1">
                {formattedFileName}
              </h2>
              <span className="text-[11px] text-gray-500 block">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
      <ReportStatusPopup
        isOpen={statusPopupOpen}
        onClose={() => setStatusPopupOpen(false)}
        report={report}
      />
    </div>
  );
} 