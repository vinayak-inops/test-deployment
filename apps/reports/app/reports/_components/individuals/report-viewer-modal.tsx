"use client"

import { useState, useEffect } from "react"
import { X, FileText, FileSpreadsheet, Download, DownloadCloud } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import * as XLSX from 'xlsx'
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode";

interface ReportViewerModalProps {
  isOpen: boolean
  onClose: () => void
  viewerUrl: string | null
  viewerType: string
  reportName?: string
  reportData?: any
  excelData: any[][]
  excelLoading: boolean
  fileLoading: boolean
  onDownload?: () => void
  onDownloadClick?: () => void
  hasDownloadPermission?: boolean
}

export default function ReportViewerModal({
  isOpen,
  onClose,
  viewerUrl,
  viewerType,
  reportName,
  reportData,
  excelData,
  excelLoading,
  fileLoading,
  onDownload,
  onDownloadClick,
  hasDownloadPermission = false,
}: ReportViewerModalProps) {
  const  tenantCode  = useGetTenantCode();
  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden" // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  // Sanitize and prepare a safe file name
  const getSafeFileName = (name: string) => {
    const fallback = 'report'
    const base = (name || fallback).toString().trim()
    const sanitized = base
      .replace(/[\\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    return sanitized || fallback
  }

  if (!isOpen || !viewerUrl) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-6xl flex flex-col">
        <Card className="w-full max-h-[90vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">
                Viewing Report ({viewerType.toUpperCase()})
              </CardTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close viewer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent className="flex-1 px-6 py-4 overflow-hidden bg-gray-50">
            <div className="h-full overflow-auto">
              {viewerType === 'pdf' ? (
                <iframe
                  src={viewerUrl}
                  className="w-full h-full min-h-[600px] border-0 rounded-lg shadow-sm bg-white"
                  title="PDF Viewer"
                />
              ) : viewerType === 'excel' || viewerType === 'xlsx' || viewerType === 'xls' ? (
                <div className="w-full h-full flex flex-col overflow-hidden">
                  {excelLoading || fileLoading ? (
                    <div className="w-full h-full flex items-center justify-center min-h-[600px]">
                      <div className="flex flex-col items-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
                        <p className="mt-2 text-sm">Loading Excel Preview...</p>
                      </div>
                    </div>
                  ) : excelData.length > 0 ? (
                    <div className="w-full h-full overflow-auto bg-white p-4 rounded-lg border border-gray-200">
                      <div className="min-w-full">
                        <table className="min-w-full border-collapse text-xs bg-white">
                          <thead className="sticky top-0 z-10">
                            {excelData[0] && (
                              <tr className="bg-gradient-to-r from-green-50 to-emerald-100 border-b-2 border-green-300">
                                {excelData[0].map((cell: any, j: number) => (
                                  <th 
                                    key={j} 
                                    className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-700 text-left bg-green-50"
                                  >
                                    {cell || `Column ${j + 1}`}
                                  </th>
                                ))}
                              </tr>
                            )}
                          </thead>
                          <tbody>
                            {excelData.slice(1, 50).map((row, i) => (
                              <tr 
                                key={i} 
                                className={`hover:bg-green-50 transition-colors ${
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
                                {excelData[0] && row.length < excelData[0].length && 
                                  Array.from({ length: excelData[0].length - row.length }).map((_, j) => (
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
                        {excelData.length > 50 && (
                          <div className="text-center py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
                            Showing first 50 rows of {excelData.length} total rows
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center min-h-[600px]">
                      <div className="w-full max-w-md">
                        <div className="text-center space-y-4">
                          <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg mx-auto w-20 h-20 flex items-center justify-center">
                            <FileSpreadsheet className="h-10 w-10 text-white" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-lg font-semibold text-gray-800">
                              Excel File (.xlsx)
                            </h4>
                            <p className="text-gray-600 text-sm">
                              This is an Excel file that will be downloaded as .xlsx format with all your data intact.
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">File Type:</span>
                              <span className="font-semibold text-gray-800">Excel Spreadsheet</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                              <span className="text-gray-600">Extension:</span>
                              <span className="font-semibold text-gray-800">.xlsx</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                              <span className="text-gray-600">Size:</span>
                              <span className="font-semibold text-gray-800">
                                {reportData?.report ? `${Math.round(reportData.report.length / 1000)}KB` : 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-3 pt-2">
                            {onDownloadClick && (
                              <Button
                                onClick={onDownloadClick}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <DownloadCloud className="h-4 w-4 mr-2" />
                                Download as .xlsx
                              </Button>
                            )}
                            <Button
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = viewerUrl || '';
                                link.download = `${getSafeFileName(`${tenantCode}_${reportName}` || 'report')}.xlsx`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              variant="outline"
                              className="border-gray-300 hover:bg-gray-50"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Force Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center min-h-[600px]">
                  <div className="bg-white rounded-lg shadow-sm p-6 max-w-md w-full border border-gray-200">
                    <div className="text-center space-y-4">
                      <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mx-auto w-20 h-20 flex items-center justify-center">
                        <FileText className="h-10 w-10 text-white" />
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-gray-800">
                          File Viewer
                        </h4>
                        <p className="text-gray-600 text-sm">
                          This file type cannot be previewed directly. You can download it or open in a new tab.
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">File Type:</span>
                          <span className="font-semibold text-gray-800">{viewerType.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-semibold text-gray-800">
                            {reportData?.report ? `${Math.round(reportData.report.length / 1000)}KB` : 'Unknown'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => window.open(viewerUrl, '_blank')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                        {hasDownloadPermission && onDownload && (
                          <Button
                            onClick={onDownload}
                            variant="outline"
                            className="border-gray-300 hover:bg-gray-50"
                          >
                            <DownloadCloud className="h-4 w-4 mr-2" />
                            Download File
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

