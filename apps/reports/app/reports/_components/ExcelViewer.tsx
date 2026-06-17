'use client';

import { useEffect, useState } from 'react';
import { MoreVertical, Download, Eye, FileSpreadsheet } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Button } from "@repo/ui/components/ui/button";
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info";
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64";
import ReportStatusPopup from "./ReportStatusPopup";

interface ExcelViewerProps {
  fileName: string;
  base64: string;
  createdAt?: string;
  _id: string;
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

export default function ExcelViewer({ fileName, base64, createdAt,_id, report, permission }: ExcelViewerProps) {
  const [data, setData] = useState<any[][]>([]);
  const [mode, setMode] = useState<'preview' | 'advanced'>('advanced');
  const [loading, setLoading] = useState(true);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [statusPopupOpen, setStatusPopupOpen] = useState(false);
  const { employeeId } = useKeyclockRoleInfo();
  const router = useRouter();
  
  // Use the hook to fetch file data
  // const { fetchByteArray, loading: fileLoading, result: fileResult } = useByteToBase64({
  //   onSuccess: (result) => {
  //     if (result.success && result.bytes) {
  //       // Convert Uint8Array to base64 (handle large files)
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
  //     console.error('Error fetching Excel:', error);
  //   }
  // });

  // Fetch file when report is available
  // useEffect(() => {
  //   if (report) {
  //     const filePath = report.report || report.filePath || report.reportPath || report.path || report.documentPath;
  //     if (filePath) {
  //       const fileType = report.extension?.toLowerCase() === 'xlsx' 
  //         ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  //         : 'application/vnd.ms-excel';
  //       fetchByteArray(filePath, fileType);
  //     }
  //   }
  // }, [report]);
  const handleViewStates = () => {
    if (_id) {
      const encryptedData = encryptEmployeeData({ employeeId: employeeId, _id: _id })
      router.push(`/reports?mode=all&id=${encryptedData}`);
    }
  };

  // useEffect(() => {
  //   setLoading(true);
  //   const dataToUse = fileBase64 || base64;
  //   if (dataToUse) {
  //     setTimeout(() => {
  //       try {
  //         const binary = atob(dataToUse);
  //         const bytes = new Uint8Array(binary.length);
  //         for (let i = 0; i < binary.length; i++) {
  //           bytes[i] = binary.charCodeAt(i);
  //         }
  //         const workbook = XLSX.read(bytes, { type: 'array' });
  //         const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  //         const sheetData = XLSX.utils.sheet_to_json(firstSheet, { 
  //           header: 1, 
  //           defval: '', 
  //           raw: false 
  //         });
  //         const filteredData = (sheetData as any[][]).filter(row => 
  //           row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')
  //         );
  //         setData(filteredData.length > 0 ? filteredData : []);
  //       } catch (e) {
  //         console.error('Error parsing Excel:', e);
  //         setData([]);
  //       } finally {
  //         setLoading(false);
  //       }
  //     }, 10);
  //   } else if (fileResult?.bytes) {
  //     try {
  //       const workbook = XLSX.read(fileResult.bytes, { type: 'array' });
  //       const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  //       const sheetData = XLSX.utils.sheet_to_json(firstSheet, { 
  //         header: 1, 
  //         defval: '',
  //         raw: false
  //       });
  //       const filteredData = (sheetData as any[][]).filter(row => 
  //         row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')
  //       );
  //       setData(filteredData.length > 0 ? filteredData : []);
  //     } catch (e) {
  //       console.error('Error parsing Excel:', e);
  //       setData([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   } else {
  //       setData([]);
  //       setLoading(false);
  //   }
  // }, [base64, fileBase64, fileResult]);

  // const handleDownload = () => {
  //   const dataToUse = fileBase64 || base64;
  //   if (!dataToUse && !fileResult?.bytes) return;
    
  //   if (fileResult?.bytes) {
  //     const bytesArray = Uint8Array.from(fileResult.bytes);
  //     const blob = new Blob([bytesArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  //     a.click();
  //     URL.revokeObjectURL(url);
  //   } else if (dataToUse) {
  //     const blob = new Blob([Uint8Array.from(atob(dataToUse), c => c.charCodeAt(0))], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  //     const url = URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  //     a.click();
  //     URL.revokeObjectURL(url);
  //   }
  // };

  const handlePreview = () => {
    setMode(mode === 'advanced' ? 'preview' : 'advanced');
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

  let statusLabel = 'Excel Report';
  let statusClasses =
    'inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-medium';

  if (!hasReportValue) {
    if (rawStatus === 'failed') {
      statusLabel = 'Report not generated';
      statusClasses =
        'inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-medium';
    } else {
      statusLabel = 'Report is generating';
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

          <div className="w-full h-48 bg-gradient-to-b from-gray-50 to-white flex justify-center items-center">
            {/* {fileLoading || loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                  <p className="mt-2 text-sm">Loading Preview...</p>
                </div>
              </div>
            ) : mode === 'advanced' && data.length > 0 ? (
              <div className="w-full h-full overflow-auto scroll-hidden bg-white">
                <div className="min-w-full">
                  <table className="min-w-full border-collapse text-[10px] bg-white">
                    <thead className="sticky top-0 z-10">
                      {data[0] && (
                        <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-300">
                          {data[0].map((cell: any, j: number) => (
                            <th 
                              key={j} 
                              className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-left bg-blue-50"
                            >
                              {cell || `Column ${j + 1}`}
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {data.slice(1, 15).map((row, i) => (
                        <tr 
                          key={i} 
                          className={`hover:bg-blue-50 transition-colors ${
                            i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          {row.map((cell: any, j: number) => (
                            <td 
                              key={j} 
                              className="border border-gray-200 px-2 py-1 text-gray-800 whitespace-nowrap"
                            >
                              {cell !== null && cell !== undefined ? String(cell) : ''}
                            </td>
                          ))}
                          {data[0] && row.length < data[0].length && 
                            Array.from({ length: data[0].length - row.length }).map((_, j) => (
                              <td 
                                key={`empty-${j}`} 
                                className="border border-gray-200 px-2 py-1 text-gray-400"
                              >
                                &nbsp;
                              </td>
                            ))
                          }
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.length > 15 && (
                    <div className="text-center py-2 text-[10px] text-gray-500 bg-gray-50 border-t border-gray-200">
                      Showing first 15 rows of {data.length} total rows
                    </div>
                  )}
                </div>
              </div>
            ) : ( */}
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                  <FileSpreadsheet className="w-10 h-10 text-white" />
                </div>
                <p className="text-xs text-gray-500">Excel File</p>
              </div>
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