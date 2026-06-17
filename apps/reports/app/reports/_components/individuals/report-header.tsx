"use client"

import { Eye, DownloadCloud } from "lucide-react"

interface ReportHeaderProps {
  reportTitle?: string
  reportName?: string
  extension?: string
  hasReport: boolean
  onViewFile: () => void
  onDownloadReport: () => void
}

export default function ReportHeader({
  reportTitle,
  reportName,
  extension,
  hasReport,
  onViewFile,
  onDownloadReport,
}: ReportHeaderProps) {
  return (
    <div className=" border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {reportTitle || 'Report'}
          </h1>
          <p className="text-sm text-slate-500">
            Generated report • {(extension || 'pdf').toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (hasReport) {
                onViewFile()
              }
            }}
            disabled={!hasReport}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors ${
              hasReport
                ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                : 'border-gray-300 bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Eye className="h-4 w-4" />
            {hasReport ? 'View File' : 'No File Available'}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (hasReport) {
                onDownloadReport()
              }
            }}
            disabled={!hasReport}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors ${
              hasReport
                ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                : 'border-gray-300 bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <DownloadCloud className="h-4 w-4" />
            {hasReport ? 'Download Report' : 'No Report Available'}
          </button>
        </div>
      </div>
    </div>
  )
}

