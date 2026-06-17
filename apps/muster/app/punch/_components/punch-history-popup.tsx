"use client"

import { useState, useEffect } from "react"
import { Clock, CheckCircle, XCircle, LogIn, LogOut, Calendar, MessageSquare, User, MapPin } from "lucide-react"
import BigPopupWrapper from "@repo/ui/components/popupwrapper/big-popup-wrapper"

interface PunchRecord {
  id: string
  type: "in" | "out"
  timestamp: Date
  location?: string
  notes?: string
  status: "approved" | "pending" | "rejected"
  userId?: string
  userName?: string
}

interface PunchHistoryPopupProps {
  isOpen: boolean
  onClose: () => void
  punchHistory: PunchRecord[]
  initialSelectedPunch?: PunchRecord | null
}

export default function PunchHistoryPopup({ isOpen, onClose, punchHistory, initialSelectedPunch }: PunchHistoryPopupProps) {
  const [selectedPunch, setSelectedPunch] = useState<PunchRecord | null>(initialSelectedPunch || null)

  // Update selected punch when initialSelectedPunch changes
  useEffect(() => {
    setSelectedPunch(initialSelectedPunch || null)
  }, [initialSelectedPunch])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <BigPopupWrapper
      open={isOpen}
      setOpen={() => onClose()}
      content={{
        title: "Punch History",
        description: `${punchHistory.length} total punches`
      }}
    >
      <div className="flex h-full">
        {/* Left Side - Punch History List */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Punch History</h2>
            <p className="text-sm text-gray-600 mt-1">{punchHistory.length} total punches</p>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scroll">
            {punchHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Clock className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">No punch history</p>
                <p className="text-sm">No punches have been recorded yet.</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {punchHistory.map((punch) => (
                  <div
                    key={punch.id}
                    onClick={() => setSelectedPunch(punch)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedPunch?.id === punch.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                          punch.type === "in"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600"
                            : "bg-gradient-to-br from-indigo-500 to-indigo-600"
                        }`}
                      >
                        {punch.type === "in" ? (
                          <LogIn className="h-5 w-5 text-white" />
                        ) : (
                          <LogOut className="h-5 w-5 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {punch.userName || "Unknown User"}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusColor(punch.status)}`}
                          >
                            {punch.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(punch.timestamp)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(punch.timestamp)}</span>
                          {punch.location && (
                            <>
                              <span>•</span>
                              <span>{punch.location}</span>
                            </>
                          )}
                        </div>
                        
                        {punch.notes && (
                          <p className="text-xs text-gray-600 line-clamp-2">{punch.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Punch Details */}
        <div className="w-1/2 flex flex-col">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Punch Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedPunch ? "Viewing punch details" : "Select a punch to view details"}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scroll">
            {selectedPunch ? (
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                      selectedPunch.type === "in"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600"
                        : "bg-gradient-to-br from-indigo-500 to-indigo-600"
                    }`}
                  >
                    {selectedPunch.type === "in" ? (
                      <LogIn className="h-8 w-8 text-white" />
                    ) : (
                      <LogOut className="h-8 w-8 text-white" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Punch {selectedPunch.type === "in" ? "In" : "Out"}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`text-sm px-3 py-1 rounded-full font-semibold border ${getStatusColor(selectedPunch.status)}`}
                      >
                        {selectedPunch.status}
                      </span>
                      {getStatusIcon(selectedPunch.status)}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Employee</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedPunch.userName || "Unknown User"}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Date</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(selectedPunch.timestamp)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Time</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatTime(selectedPunch.timestamp)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Location</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedPunch.location || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {selectedPunch.notes && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <MessageSquare className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Notes</span>
                    </div>
                    <p className="text-gray-800 leading-relaxed">{selectedPunch.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                    Edit Punch
                  </button>
                  <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                    View Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Clock className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">No Punch Selected</p>
                <p className="text-sm">Select a punch from the list to view its details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BigPopupWrapper>
  )
} 