"use client"

import { MoreHorizontal, Upload, TrendingUp, Zap, Database, Activity, Download } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { useState, useEffect, ReactNode } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@repo/ui/components/ui/popover"


// Animated Counter Component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (count < value) {
        setCount(count + 1)
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [count, value])

  return (
    <span>
      {count}
      {suffix}
    </span>
  )
}

// Animated Status Dot
function StatusDot({ color, animate = false }: { color: string; animate?: boolean }) {
  return (
    <div className="relative">
      <div className={`w-2 h-2 ${color} rounded-full transition-all duration-300`}></div>
      {animate && <div className={`absolute inset-0 w-2 h-2 ${color} rounded-full animate-ping opacity-75`}></div>}
    </div>
  )
}

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
  recordCount,
  organizationType,
  lastSync,
  uptime,
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
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
            <p className="text-gray-600 font-medium">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* <Button
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
          </Button> */}
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

      {/* Enhanced Stats Bar */}
      <div className="relative overflow-hidden p-5 bg-gradient-to-r from-gray-50 to-gray-50/80 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-500 group">
        
        <div className="absolute inset-0 bg-gradient-to-r from-[#0061ff]/5 via-[#0061ff]/10 to-[#0061ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

        <div className="relative flex items-center gap-8">
          <div className="flex items-center gap-3 group/stat cursor-pointer">
            <StatusDot color="bg-green-500" animate />
            <div className="flex items-center gap-2 transform transition-all duration-300 group-hover/stat:scale-105">
              <span className="text-sm font-semibold text-gray-900">
                <AnimatedCounter value={recordCount} />
                <span className="ml-1">{recordCount === 1 ? "Record" : "Records"}</span>
              </span>
              <span className="text-sm text-gray-500">available</span>
              <TrendingUp className="w-3 h-3 text-green-500 opacity-0 group-hover/stat:opacity-100 transition-all duration-300" />
            </div>
          </div>

          <div className="w-px h-5 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

          <div className="flex items-center gap-3 group/stat cursor-pointer">
            <StatusDot color="bg-[#0061ff]" animate />
            <div className="flex items-center gap-2 transform transition-all duration-300 group-hover/stat:scale-105">
              <span className="text-sm font-semibold text-gray-900">Active</span>
              <span className="text-sm text-gray-500">system status</span>
              <Zap className="w-3 h-3 text-[#0061ff] opacity-0 group-hover/stat:opacity-100 transition-all duration-300" />
            </div>
          </div>

          <div className="w-px h-5 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

          <div className="flex items-center gap-3 group/stat cursor-pointer">
            <StatusDot color="bg-purple-500" />
            <div className="flex items-center gap-2 transform transition-all duration-300 group-hover/stat:scale-105">
              <span className="text-sm font-semibold text-gray-900">{organizationType}</span>
              <span className="text-sm text-gray-500">organization type</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-6">
            <div className="flex items-center gap-2 group/info cursor-pointer">
              <Database className="w-4 h-4 text-gray-400 transition-all duration-300 group-hover/info:text-gray-600 group-hover/info:scale-110" />
              <span className="text-sm text-gray-500 transition-colors duration-300 group-hover/info:text-gray-700">
                Last sync: <AnimatedCounter value={lastSync} /> min ago
              </span>
            </div>

            <div className="flex items-center gap-2 group/info cursor-pointer">
              <Activity className="w-4 h-4 text-gray-400 transition-all duration-300 group-hover/info:text-[#0061ff] group-hover/info:scale-110" />
              <span className="text-sm text-gray-500 transition-colors duration-300 group-hover/info:text-gray-700">
                <AnimatedCounter value={uptime} suffix="%" /> uptime
              </span>
            </div>
          </div>
        </div>

        {isUploading && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#0061ff] to-[#0052d9] animate-pulse"
            style={{ width: "100%", animation: "progress 3s ease-in-out" }}
          ></div>
        )}
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}