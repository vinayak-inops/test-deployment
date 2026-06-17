"use client"

import React from "react"
import { createPortal } from "react-dom"
import { CreditCard, X, Clock, Building2, FileText, Users } from "lucide-react"
import { Separator } from "@repo/ui/components/ui/separator"
import AutoStatusUpdate from "./auto-stutues-update"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"


interface GeneratePassPopupProps {
  isOpen: boolean
  onClose: () => void
  fileId: string | null
  onShowDownloadProgress?: any
  onPdfFileReady?: () => void
    statusShower: any
  downloadProgress?: {
    updateProgress: (progress: number, message?: string) => void
    setComplete: () => void
    setError: (error: string) => void
  }
  workOrderNumber: string | null
}


export function GeneratePassPopup({
  isOpen,
  onClose,
  fileId,
  onShowDownloadProgress,
  onPdfFileReady,
  statusShower,
  downloadProgress,
  workOrderNumber
}: GeneratePassPopupProps) {
  const [mounted, setMounted] = React.useState(false)
  const [isAutoStatusRunning, setIsAutoStatusRunning] = React.useState(false)
    const [completionData, setCompletionData] = React.useState<any>(null)
    const [showValue, setShowValue] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // Cleanup function to reset states when component unmounts
    return () => {
      setIsAutoStatusRunning(false)
    }
  }, [])





// Use the useRequest hook for attendance data
const {
  data: attendanceResponse,
  loading: isLoading,
  error: attendanceError,
  refetch
} = useRequest<any>({
  url: 'muster/workOrderCompletion/search',
  method: 'POST',
  data: [{ field: "workOrderNumber", operator: "eq", value: workOrderNumber }],
  onSuccess: (data) => {
    setCompletionData(data[0])
  },
  onError: (error) => {
    console.error("Error fetching attendance data:", error);
  }
});

  // Reset states when popup closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsAutoStatusRunning(false)
    }
  }, [isOpen])

    // Auto-trigger status check when fileId is available
  React.useEffect(() => {
        if (fileId) {
      setIsAutoStatusRunning(true)
    }
    }, [fileId])

    // Handle completion data from AutoStatusUpdate
    const handleCompletionData = () => {
        setShowValue(true)
        refetch()
    }

  
  if (!isOpen || !mounted) return null

  const content = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90dvh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
                        Work Order Completion - Status
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

                <div className="w-full flex gap-4 h-[calc(90vh-120px)]">
                    {/* Left Side - Completion Information */}
                    <div className="w-3/5 overflow-y-auto pr-2 custom-scrollbar">
                        

                        { showValue ? (
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        <h2 className="text-lg font-bold">Work Order Completed</h2>
                                    </div>
                                    <p className="text-blue-100 text-sm mt-1">Completion details and man shift information</p>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Basic Information Section */}
                                    <div className="mb-8">
                                        <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300">
                                            Basic Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Contractor Code */}
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <Building2 className="w-4 h-4 text-blue-600" />
                                                    <span className="text-xs font-medium text-gray-700">Contractor</span>
                                                </div>
                                                <div className="pl-6 space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Code:</span>
                                                        <span className="font-medium">{completionData.contractorCode}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Work Order Number */}
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <FileText className="w-4 h-4 text-blue-600" />
                                                    <span className="text-xs font-medium text-gray-700">Work Order</span>
                                                </div>
                                                <div className="pl-6 space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Number:</span>
                                                        <span className="font-medium">{completionData.workOrderNumber}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="my-6" />

                                    {/* Allocated Man Power Section */}
                                    {completionData.allocatedManPower && completionData.allocatedManPower.length > 0 && (
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-semibold text-gray-800 pb-2 border-b border-gray-300 flex-1">
                                                    Allocated Man Power
                                                </h3>
                                            </div>
                                            <div className="space-y-4">
                                                {completionData.allocatedManPower.map((allocation: any, index: number) => (
                                                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                        <div className="flex items-center space-x-2 mb-3">
                                                            <Users className="w-4 h-4 text-blue-600" />
                                                            <span className="text-xs font-medium text-gray-700">Skill Level Details</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600 text-sm">Skill Title:</span>
                                                                    <span className="font-medium text-sm">{allocation.skillLevel?.skilledLevelTitle || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600 text-sm">Description:</span>
                                                                    <span className="font-medium text-sm">{allocation.skillLevel?.skilledLevelDescription || 'No description'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                                    <p className="text-3xl font-bold text-green-600 mb-1">
                                                                        {allocation.manPower || 0}
                                                                    </p>
                                                                    <p className="text-sm text-green-500">Allocated Man Power</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Separator className="my-6" />

                                    {/* Completed Man Work Section */}
                                    {completionData.completedManWork && completionData.completedManWork.length > 0 && (
                                        <div className="mb-2">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm font-semibold text-gray-800 pb-2 border-b border-gray-300 flex-1">
                                                    Completed Man Work
                                                </h3>
                                            </div>
                                            <div className="space-y-4">
                                                {completionData.completedManWork.map((completed: any, index: number) => (
                                                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                        <div className="flex items-center space-x-2 mb-3">
                                                            <Users className="w-4 h-4 text-blue-600" />
                                                            <span className="text-xs font-medium text-gray-700">Skill Level Details</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600 text-sm">Skill Title:</span>
                                                                    <span className="font-medium text-sm">{completed.skillLevel?.skilledLevelTitle || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600 text-sm">Description:</span>
                                                                    <span className="font-medium text-sm">{completed.skillLevel?.skilledLevelDescription || 'No description'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                                    <p className="text-3xl font-bold text-blue-600 mb-1">
                                                                        {completed.totalManShift || 0}
                                                                    </p>
                                                                    <p className="text-sm text-blue-500">Completed Man Shifts</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h2 className="text-lg font-semibold text-gray-600 mb-2">Waiting for Completion</h2>
                                <p className="text-gray-500">Work order completion details will appear here once the process is finished.</p>
                            </div>
                        )}
          </div>

                    {/* Right Side - Status Section */}
          <div className="w-2/5 overflow-y-auto pl-2 custom-scrollbar">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            {/* Tab Header for Status */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                                        <h4 className="font-medium text-blue-800">Status</h4>
                    {isAutoStatusRunning && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Content */}
              <div className="min-h-[500px]">
                <AutoStatusUpdate
                  fileId={fileId}
                                     setOpen={() => { }} // No-op since this is always visible
                  extension="pdf"
                                     reportData={null}
                                     setPdfData={() => { }} // No-op since we're not handling PDF data
                                     onCompletionData={handleCompletionData}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

// Add custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = scrollbarStyles
  document.head.appendChild(styleElement)
}