"use server"

import { MoreHorizontal, Upload, Download } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@repo/ui/components/ui/popover"


interface EnhancedHeaderProps {
  title: string
  description: string
  IconComponent: React.ComponentType<{ className?: string }>
  recordCount: number
  organizationType: string
  lastSync: number
  uptime: number
  isUploading?: boolean
  onUpload?: () => void
}

export default function EnhancedHeader({
  title,
  description,
  IconComponent,
  isUploading = false,
  onUpload
}: EnhancedHeaderProps) {
  function handleDownloadPDF() {
    // Replace with your actual PDF download logic
    alert("Download PDF clicked!")
  }

  return (
    <div className="mb-6">
      {/* Main Header */}
      <div className="flex items-center justify-between mb-4 group">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
              <IconComponent className="w-5 h-5 text-gray-700 transition-colors duration-300 group-hover:text-gray-900" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-sm animate-pulse"></div>
          </div>
          <div className="transform transition-all duration-300 group-hover:translate-x-1">
            <h1 className="text-2xl font-semibold text-gray-900 transition-colors duration-300 group-hover:text-gray-800">
              {title}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 transition-colors duration-300 group-hover:text-gray-600">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onUpload}
            disabled={isUploading}
            className="bg-[#0061ff] hover:bg-[#0052d9] text-white text-sm font-medium px-4 h-9 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-70"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                Upload Large Data
              </>
            )}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-9 w-9 p-0 transition-all duration-300 hover:scale-110 hover:rotate-90"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0 rounded-xl shadow-xl border border-gray-100 bg-white/95 backdrop-blur-md">
              <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 tracking-wider uppercase bg-gradient-to-r from-gray-50 to-white rounded-t-xl">
                Actions
              </div>
              <button
                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition rounded-b-xl group"
                onClick={handleDownloadPDF}
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 group-hover:from-blue-200 group-hover:to-indigo-200">
                  <Download className="w-4 h-4 text-blue-500" />
                </span>
                Download PDF
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
