"use client"

import { useState, useEffect } from "react"
import { Clock, Send, CheckCircle, XCircle, Calendar, MessageSquare, User, FileText, AlertCircle, BarChart3, ArrowLeft } from "lucide-react"
import BigPopupWrapper from "@repo/ui/components/popupwrapper/big-popup-wrapper"
import LeaveStatusUpdate from "./leave-status-update"
import { useMessage } from "../../../hooks/useMessage";

interface Leave {
  date: string
  leaveCode: string
  duration: string
}

interface LeaveApplication {
  _id: string
  tenantCode: string
  workflowName: string
  uploadedBy: string
  createdOn: string
  employeeID: string
  fromDate: string
  toDate: string
  leaves: Leave[]
  uploadTime: string
  organizationCode: string
  appliedDate: string
  workflowState: string
  remarks: string
}

interface LeaveOfAbsenceApplication {
  _id: string
  tenantCode: string
  workflowName: string
  uploadedBy: string
  createdOn: string
  employeeID: string
  typeOfAbsence: string
  lastDayOfWork: string
  firstDayOfAbsence: string
  estimatedLastDayOfAbsence: string
  actualReturnDate?: string
  uploadTime: string
  organizationCode: string
  appliedDate: string
  workflowState: string
  commentToApprover: string
  reason: string
  childsBirthDate?: string
  adoptionPlacementDate?: string
  totalDays: number
}

interface LeaveOfAbsencePopupProps {
  isOpen: boolean
  onClose: () => void
  leaveOfAbsenceApplications: LeaveOfAbsenceApplication[]
  initialSelectedApplication?: LeaveOfAbsenceApplication | null
}

// Function to convert LeaveOfAbsenceApplication to LeaveApplication
const convertToLeaveApplication = (absenceApp: LeaveOfAbsenceApplication): LeaveApplication => {
  // Create a leave entry for each day of absence
  const leaves: Leave[] = []
  const startDate = new Date(absenceApp.firstDayOfAbsence)
  const endDate = new Date(absenceApp.estimatedLastDayOfAbsence)
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Skip weekends (optional - you can modify this logic)
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      leaves.push({
        date: d.toISOString().split('T')[0],
        leaveCode: absenceApp.typeOfAbsence,
        duration: 'Full Day'
      })
    }
  }

  return {
    _id: absenceApp._id,
    tenantCode: absenceApp.tenantCode,
    workflowName: absenceApp.workflowName,
    uploadedBy: absenceApp.uploadedBy,
    createdOn: absenceApp.createdOn,
    employeeID: absenceApp.employeeID,
    fromDate: absenceApp.firstDayOfAbsence,
    toDate: absenceApp.estimatedLastDayOfAbsence,
    leaves: leaves,
    uploadTime: absenceApp.uploadTime,
    organizationCode: absenceApp.organizationCode,
    appliedDate: absenceApp.appliedDate,
    workflowState: absenceApp.workflowState,
    remarks: absenceApp.reason || absenceApp.commentToApprover || ''
  }
}

export default function LeaveOfAbsencePopup({ isOpen, onClose, leaveOfAbsenceApplications, initialSelectedApplication }: LeaveOfAbsencePopupProps) {
  const [selectedApplication, setSelectedApplication] = useState<LeaveOfAbsenceApplication | null>(initialSelectedApplication || null)
  const [search, setSearch] = useState("")
  const [showCancel, setShowCancel] = useState(false)
  const [cancelComment, setCancelComment] = useState("")
  const [cancelError, setCancelError] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'initiated' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all')
  const [showStatusView, setShowStatusView] = useState(false)
  const { showMessage } = useMessage();

  // Update selected application when initialSelectedApplication changes
  useEffect(() => {
    setSelectedApplication(initialSelectedApplication || null)
  }, [initialSelectedApplication])

  const formatDate = (dateString: string) => {
    try {
      if (dateString.includes('-') && dateString.split('-').length === 3) {
        const [day, month, year] = dateString.split('-')
        return `${day}/${month}/${year}`
      }
      
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    } else {
      return formatDate(dateString)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "INITIATED":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-200"
      case "REJECTED":
        return "bg-red-100 text-red-700 border-red-200"
      case "CANCELLED":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "PENDING":
      case "INITIATED":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  // Filter applications by search and tab
  const filteredApplications = leaveOfAbsenceApplications.filter(
    app =>
      (activeTab === 'all' || app.workflowState.toLowerCase() === activeTab) &&
      (app.employeeID?.toLowerCase().includes(search.toLowerCase()) ||
        app.typeOfAbsence?.toLowerCase().includes(search.toLowerCase()) ||
        app.workflowState?.toLowerCase().includes(search.toLowerCase()))
  )

  const handleKnowStatus = () => {
    setShowStatusView(true)
  }

  const handleBackToApplications = () => {
    setShowStatusView(false)
  }

  return (
    <BigPopupWrapper open={isOpen} setOpen={onClose} content={undefined}>
      {/* Single header at the top */}
      <div className="w-full h-full">
        <div className="px-6 pt-6 pb-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {showStatusView ? "Leave of Absence Application Status" : "Leave of Absence Applications"}
            </h2>
            {showStatusView && (
              <button
                onClick={handleBackToApplications}
                className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                Back to Applications
              </button>
            )}
          </div>
        </div>
        {/* Set flex row to fill popup minus header */}
        <div className="flex w-full" style={{height: 'calc(100% - 72px)'}}>
          {/* Left Side - Application List (hidden when showing status) */}
          {!showStatusView && (
            <div className="w-1/2 flex flex-col border-r border-gray-200">
              {/* Title, Tabs, and Search box */}
              <div className="p-4 pb-0 bg-white">
                <div className="flex flex-col gap-2 mb-2">
                  <span className="text-base font-semibold text-gray-700">Applications ({filteredApplications.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {['all', 'initiated', 'pending', 'approved', 'rejected', 'cancelled'].map(tab => (
                      <button
                        key={tab}
                        className={`px-2 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                          activeTab === tab
                            ? 'bg-blue-600 text-white shadow'
                            : 'bg-gray-100 text-gray-700 hover:bg-blue-50'
                        }`}
                        onClick={() => setActiveTab(tab as any)}
                      >
                        {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search by Employee ID, Absence Type, or Status..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring"
                />
              </div>
              <div className="flex-1 overflow-y-auto custom-scroll">
                {filteredApplications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Calendar className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">No leave of absence applications</p>
                    <p className="text-sm">No applications have been submitted yet.</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {filteredApplications.map((application) => (
                      <div
                        key={application._id}
                        onClick={() => {
                          setSelectedApplication(application)
                          setShowCancel(false)
                          setCancelComment("")
                          setCancelError("")
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedApplication?._id === application._id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                Leave of Absence - {application.employeeID}
                              </h3>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusColor(application.workflowState)}`}
                              >
                                {application.workflowState}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(application.firstDayOfAbsence)} - {formatDate(application.estimatedLastDayOfAbsence)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                              <Clock className="h-3 w-3" />
                              <span>Applied {getTimeAgo(application.appliedDate)}</span>
                              <span>•</span>
                              <span>{application.typeOfAbsence}</span>
                              <span>•</span>
                              <span>{application.totalDays} days</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{application.reason || 'No reason provided'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Right Side - Application Details */}
          <div className="w-1/2 flex flex-col border-r border-gray-200">
            <div className="flex-1 overflow-y-auto custom-scroll">
              {selectedApplication ? (
                <div className="w-full p-6">
                  {/* Info Card Layout */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow bg-emerald-100">
                      <Calendar className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-gray-900">Leave of Absence Application</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${getStatusColor(selectedApplication.workflowState)}`}>
                          {selectedApplication.workflowState}
                        </span>
                        {getStatusIcon(selectedApplication.workflowState)}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-700 text-sm">Employee ID:</span>
                      <span className="text-gray-900 text-sm">{selectedApplication.employeeID}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-700 text-sm">Type of Absence:</span>
                      <span className="text-gray-900 text-sm">{selectedApplication.typeOfAbsence}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-700 text-sm">Last Day of Work:</span>
                      <span className="text-gray-900 text-sm">{formatDate(selectedApplication.lastDayOfWork)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-700 text-sm">Absence Period:</span>
                      <span className="text-gray-900 text-sm">{formatDate(selectedApplication.firstDayOfAbsence)} - {formatDate(selectedApplication.estimatedLastDayOfAbsence)}</span>
                    </div>
                    {selectedApplication.actualReturnDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-gray-700 text-sm">Actual Return Date:</span>
                        <span className="text-gray-900 text-sm">{formatDate(selectedApplication.actualReturnDate)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-700 text-sm">Applied:</span>
                      <span className="text-gray-900 text-sm">{getTimeAgo(selectedApplication.appliedDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-700 text-sm">Application ID:</span>
                      <span className="text-gray-900 font-mono text-sm">#{selectedApplication._id.slice(-8)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-700 text-sm">Total Days:</span>
                      <span className="text-gray-900 text-sm">{selectedApplication.totalDays} days</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-700 text-sm">Reason:</span>
                    </div>
                    <div className="text-gray-800 leading-relaxed text-xs bg-gray-50 rounded-lg p-3 mt-1">
                      {selectedApplication.reason || 'No reason provided'}
                    </div>
                  </div>
                  {selectedApplication.commentToApprover && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-gray-700 text-sm">Comment to Approver:</span>
                      </div>
                      <div className="text-gray-800 leading-relaxed text-xs bg-gray-50 rounded-lg p-3 mt-1">
                        {selectedApplication.commentToApprover}
                      </div>
                    </div>
                  )}
                  {selectedApplication.childsBirthDate && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-gray-700 text-sm">Child's Birth Date:</span>
                      </div>
                      <div className="text-gray-800 leading-relaxed text-xs bg-gray-50 rounded-lg p-3 mt-1">
                        {formatDate(selectedApplication.childsBirthDate)}
                      </div>
                    </div>
                  )}
                  {selectedApplication.adoptionPlacementDate && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-gray-700 text-sm">Adoption Placement Date:</span>
                      </div>
                      <div className="text-gray-800 leading-relaxed text-xs bg-gray-50 rounded-lg p-3 mt-1">
                        {formatDate(selectedApplication.adoptionPlacementDate)}
                      </div>
                    </div>
                  )}
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      type="button"
                      className="w-full px-4 py-2 h-9 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                      onClick={handleKnowStatus}
                    >
                      <BarChart3 className="h-4 w-4" />
                      View Status
                    </button>
                    {selectedApplication.workflowState === 'INITIATED' || selectedApplication.workflowState === 'PENDING' ? (
                      showCancel ? (
                        <div className="w-full">
                          <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            Comment <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={cancelComment}
                            onChange={e => setCancelComment(e.target.value)}
                            placeholder="Enter comment..."
                            className="w-full min-h-[80px] rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"
                          />
                          {cancelError && (
                            <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                              <AlertCircle className="h-3 w-3" />
                              {cancelError}
                            </div>
                          )}
                          <div className="flex justify-end mt-4">
                            <button
                              type="button"
                              disabled={cancelLoading}
                              className="px-4 py-2 h-9 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              onClick={() => {
                                if (!cancelComment.trim()) {
                                  setCancelError("Please enter a comment to cancel the application.")
                                  return
                                }
                                setCancelLoading(true)
                                setTimeout(() => {
                                  setCancelLoading(false)
                                  setShowCancel(false)
                                  setCancelComment("")
                                  setCancelError("")
                                  // Here you would call your cancel API
                                  showMessage("Application cancelled with comment: " + cancelComment, 'info');
                                }, 1200)
                              }}
                            >
                              {cancelLoading ? "Submitting..." : "Submit Cancellation"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            type="button"
                            className="flex-1 px-3 py-2 h-9 rounded-md font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50 text-xs"
                            onClick={() => setShowCancel(true)}
                          >
                            Cancel
                          </button>
                          <button
                            className="flex-1 px-3 py-2 h-9 rounded-md font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            Approve
                          </button>
                        </div>
                      )
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Calendar className="h-16 w-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">No Application Selected</p>
                  <p className="text-sm">Select an application from the list to view its details.</p>
                </div>
              )}
            </div>
          </div>
          {/* Status Updates Section (shown when showStatusView is true) */}
          {showStatusView && (
            <div className="w-1/2 flex flex-col">
              <LeaveStatusUpdate 
                requestId={selectedApplication?._id || ""} 
                setOpen={setShowStatusView}
                leaveApplication={selectedApplication ? convertToLeaveApplication(selectedApplication) : null}
              />
            </div>
          )}
        </div>
      </div>
    </BigPopupWrapper>
  )
} 