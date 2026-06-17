"use client"

import { useState, useEffect } from "react"
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { Clock, Send, CheckCircle, XCircle, LogIn, LogOut, Calendar, MessageSquare, User, Mail, Phone, AlertCircle, BarChart3, UserCheck, X, ChevronDown, Settings, ArrowLeft } from "lucide-react"
import AutoStatusUpdate from "./auto-stutues-update"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"

interface PunchRequest {
  id: string
  employeeID: string
  type: "in" | "out"
  requestedTime?: Date
  reason: string
  status: "pending" | "approved" | "rejected"
  submittedAt?: Date
  uploadTime?: string
  workflowState?: string
  // Backend raw fields for details view
  uploadedBy?: string
  createdOn?: string
  punchedTime?: string
  transactionTime?: string
  inOut?: string
  typeOfMovement?: string
  attendanceDate?: string
  appliedDate?: string
  remarks?: string
  // Additional backend fields
  tenantCode?: string
  workflowName?: string
  stateEvent?: string
  organizationCode?: string
  isDeleted?: boolean
}

interface PunchRequestsPopupProps {
  isOpen: boolean
  onClose: () => void
  initialSelectedRequest?: PunchRequest | null
  selectedRequestId?: string | null
}

// Helper to safely parse date strings
function safeParseDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  // If only date (YYYY-MM-DD), treat as UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00Z');
  }
  // If date and time without timezone (YYYY-MM-DDTHH:mm:ss)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(dateStr)) {
    return new Date(dateStr + 'Z');
  }
  // Otherwise, try native Date
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d;
}

function mapBackendToPunchRequest(item: any): PunchRequest {
  return {
    id: item._id,
    employeeID: item.employeeID || '',
    type: item.inOut === "I" ? "in" : "out",
    requestedTime:
      safeParseDate(item.appliedDate) ||
      safeParseDate(item.uploadTime) ||
      safeParseDate(item.createdOn) ||
      safeParseDate(item.punchedTime),
    reason: item.remarks || "",
    status:
      item.workflowState?.toLowerCase() === "approved"
        ? "approved"
        : item.workflowState?.toLowerCase() === "rejected"
          ? "rejected"
          : "pending",
    submittedAt: safeParseDate(item.createdOn),
    uploadTime: item.uploadTime,
    workflowState: item.workflowState,
    // Raw backend fields for details view
    uploadedBy: item.uploadedBy,
    createdOn: item.createdOn,
    punchedTime: item.punchedTime,
    transactionTime: item.transactionTime,
    inOut: item.inOut,
    typeOfMovement: item.typeOfMovement,
    attendanceDate: item.attendanceDate,
    appliedDate: item.appliedDate,
    remarks: item.remarks,
    // Map additional backend fields
    tenantCode: item.tenantCode,
    workflowName: item.workflowName,
    stateEvent: item.stateEvent,
    organizationCode: item.organizationCode,
    isDeleted: item.isDeleted,
  };
}

export default function EditPunchPopup({ isOpen, onClose, initialSelectedRequest, selectedRequestId }: PunchRequestsPopupProps) {
  const [selectedRequest, setSelectedRequest] = useState<PunchRequest | null>(initialSelectedRequest || null)
  const [search, setSearch] = useState("")
  const [showCancel, setShowCancel] = useState(false)
  const [cancelComment, setCancelComment] = useState("")
  const [cancelError, setCancelError] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [showStatusView, setShowStatusView] = useState(false)
  const [punchRequests, setPunchRequests] = useState<PunchRequest[]>([]);
  const [showStatusOverlay, setShowStatusOverlay] = useState(false);
  const [statusAction, setStatusAction] = useState<'cancel' | 'reject' | 'approve' | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [showManageDropdown, setShowManageDropdown] = useState(false);
  const [showCancelRequestPopup, setShowCancelRequestPopup] = useState(false);
  const [cancelRequestComment, setCancelRequestComment] = useState('');
  const [cancelRequestLoading, setCancelRequestLoading] = useState(false);
  const [cancelRequestError, setCancelRequestError] = useState('');
  const  tenantCode  = useGetTenantCode();

  const {
    data: attendanceResponse,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: 'forgotPunchApplication/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ],
    onSuccess: (data) => { },
    onError: (error) => {
      console.error("Error fetching attendance data:", error);
    },
    dependencies: []
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const {
    post: postShiftZone,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "editPunchApplication",
    onSuccess: (data) => {
    },
    onError: (error) => {
      // Optionally handle error (e.g., show a toast)
      console.error("POST error:", error);
    },
  });

  useEffect(() => {
    if (attendanceResponse && Array.isArray(attendanceResponse)) {
      const mappedRequests = attendanceResponse.map(mapBackendToPunchRequest);
      setPunchRequests(mappedRequests);


      // Priority: selectedRequestId > initialSelectedRequest
      if (selectedRequestId) {
        const foundRequest = mappedRequests.find(req => req.id === selectedRequestId);
        if (foundRequest) {
          setSelectedRequest(foundRequest);
        } else {
        }
      } else if (initialSelectedRequest) {
        setSelectedRequest(initialSelectedRequest);
      }
    }
  }, [attendanceResponse, selectedRequestId, initialSelectedRequest])

  // Handle selectedRequestId changes when data is already loaded
  useEffect(() => {
    if (selectedRequestId && punchRequests.length > 0) {
      const foundRequest = punchRequests.find(req => req.id === selectedRequestId);
      if (foundRequest) {
        setSelectedRequest(foundRequest);
      }
    }
  }, [selectedRequestId, punchRequests])

  const formatTime = (date?: Date) => {
    if (!date) return '-';
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const getTimeAgo = (date?: Date) => {
    if (!date) return '-';
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      return formatDate(date);
    }
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

  // Filter out CANCEL requests before tab filtering
  const visibleRequests = punchRequests.filter(req => req.workflowState?.toLowerCase() !== 'cancel');
  const filteredRequests = visibleRequests.filter(
    req => {
      const wf = req.workflowState?.toLowerCase() || '';
      const isPendingTab = activeTab === 'pending';
      const isPendingLike = /initiat|pending|validat/.test(wf);
      return (
        activeTab === 'all' ||
        (isPendingTab ? isPendingLike : wf === activeTab)
      ) &&
        (req.reason.toLowerCase().includes(search.toLowerCase()) ||
          req.status.toLowerCase().includes(search.toLowerCase()) ||
          req.type.toLowerCase().includes(search.toLowerCase()));
    }
  );

  const handleKnowStatus = () => {
    setShowStatusView(true)
  }

  const handleBackToRequests = () => {
    setShowStatusView(false)
  }

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.manage-dropdown')) {
        setShowManageDropdown(false);
      }
    }

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/20 backdrop-blur-sm" onClick={onClose} />
      )}
      
      {/* Right-side sliding panel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-2xl z-[10001] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="w-full h-full">
          <div className="px-6 pt-6 pb-6 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-semibold text-gray-900">
              {showStatusView ? "Punch Request Status" : "Edit Punch Request"}
            </h2>
          </div>
          {/* Set flex row to fill popup minus header */}
          <div className="flex w-full" style={{ height: 'calc(100% - 72px)' }}>
            {/* Left Side - Request List (hidden when showing status) */}
            {!showStatusView && (
              <div className="w-1/2 flex flex-col border-r border-gray-200">
                {/* Title, Tabs, and Search box */}
                <div className="p-4 pb-0 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-semibold text-gray-700 whitespace-nowrap">Requests ({filteredRequests.length})</span>
                    <div className="flex gap-1 ml-2">
                      {['all', 'pending', 'approved', 'rejected', 'cancel'].map(tab => (
                        <button
                          key={tab}
                          className={`px-3 py-1 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab
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
                    placeholder="Search requests..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring"
                  />
                </div>
                <div className="flex-1 overflow-y-auto custom-scroll">
                  {filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Send className="h-16 w-16 mb-4 opacity-30" />
                      <p className="text-lg font-medium">No punch requests</p>
                      <p className="text-sm">No requests have been submitted yet.</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {[...filteredRequests].reverse().map((request) => (
                        <div
                          key={request.id}
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowCancel(false)
                            setCancelComment("")
                            setCancelError("")
                          }}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${selectedRequest?.id === request.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${request.inOut === "I"
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600"
                                  : "bg-gradient-to-br from-indigo-500 to-indigo-600"
                                }`}
                            >
                              {request.inOut === "I" ? (
                                <LogIn className="h-5 w-5 text-white" />
                              ) : (
                                <LogOut className="h-5 w-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {request.uploadedBy ? `${request.uploadedBy} (${request.employeeID})` : request.employeeID}
                                </h3>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full font-medium border ${request.workflowState?.toLowerCase() === "approved"
                                      ? "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20"
                                      : request.workflowState?.toLowerCase() === "pending" || request.workflowState?.toLowerCase() === "initiated" || request.workflowState?.toLowerCase() === "validated"
                                        ? "bg-[#64B5F6]/10 text-[#64B5F6] border-[#64B5F6]/20"
                                        : request.workflowState?.toLowerCase() === "rejected"
                                          ? "bg-gray-100 text-gray-600 border-gray-200"
                                          : "bg-gray-200 text-gray-700 border-gray-200"
                                    }`}
                                >
                                  {request.workflowState}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                                <Calendar className="h-3 w-3" />
                                <span>{request.attendanceDate ?
                                  new Date(request.attendanceDate).toLocaleDateString('en-IN', {
                                    timeZone: 'Asia/Kolkata',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }) : ''
                                }</span>
                                {request.punchedTime && (
                                  <span className="text-gray-500">
                                    {new Date(request.punchedTime + '+05:30').toLocaleString('en-IN', {
                                      timeZone: 'Asia/Kolkata',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                                <Clock className="h-3 w-3" />
                                <span>{(() => {
                                  if (!request.uploadTime) return '';

                                  const uploadDate = new Date(request.uploadTime + '+05:30');
                                  const attendanceDate = request.attendanceDate ? new Date(request.attendanceDate) : null;

                                  // Check if upload date is same as attendance date
                                  const isSameDate = attendanceDate &&
                                    uploadDate.getDate() === attendanceDate.getDate() &&
                                    uploadDate.getMonth() === attendanceDate.getMonth() &&
                                    uploadDate.getFullYear() === attendanceDate.getFullYear();

                                  if (isSameDate) {
                                    // Show only time if same date
                                    return uploadDate.toLocaleString('en-IN', {
                                      timeZone: 'Asia/Kolkata',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true
                                    });
                                  } else {
                                    // Show date if different date
                                    return uploadDate.toLocaleDateString('en-IN', {
                                      timeZone: 'Asia/Kolkata',
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    });
                                  }
                                })()}</span>
                                <span>•</span>
                                <span>Submitted {request.submittedAt ? getTimeAgo(request.submittedAt) : ''}</span>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">{request.reason}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Right Side - Request Details */}
            <div className="w-1/2 flex flex-col border-r border-gray-200">
              <div className="flex-1 overflow-y-auto custom-scroll">
                {selectedRequest ? (
                  <div className="w-full p-6">
                    {/* Info Card Layout */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow ${selectedRequest.inOut === "I" ? "bg-blue-100" : "bg-indigo-100"}`}>
                          {selectedRequest.inOut === "I" ? (
                            <LogIn className="h-8 w-8 text-blue-600" />
                          ) : (
                            <LogOut className="h-8 w-8 text-indigo-600" />
                          )}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">{selectedRequest.employeeID}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold border ${selectedRequest.workflowState?.toLowerCase() === "approved"
                                ? "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20"
                                : selectedRequest.workflowState?.toLowerCase() === "pending" || selectedRequest.workflowState?.toLowerCase() === "initiated" || selectedRequest.workflowState?.toLowerCase() === "validated"
                                  ? "bg-[#64B5F6]/10 text-[#64B5F6] border-[#64B5F6]/20"
                                  : selectedRequest.workflowState?.toLowerCase() === "rejected"
                                    ? "bg-gray-100 text-gray-600 border-gray-200"
                                    : "bg-gray-200 text-gray-700 border-gray-200"
                              }`}>
                              {selectedRequest.workflowState}
                            </span>
                            {getStatusIcon(selectedRequest.status)}
                          </div>
                        </div>
                      </div>
                      <div className="relative manage-dropdown">
                        <button
                          onClick={() => setShowManageDropdown(!showManageDropdown)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 border-0"
                        >
                          <Settings className="h-4 w-4" />
                          Manage Task
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showManageDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {showManageDropdown && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                            <button
                              onClick={() => {
                                setShowManageDropdown(false);
                                handleKnowStatus();
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-3"
                            >
                              <BarChart3 className="h-4 w-4" />
                              Know Status
                            </button>
                            <button
                              onClick={() => {
                                setShowManageDropdown(false);
                                setShowCancelRequestPopup(true);
                              }}
                              className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-3"
                            >
                              <XCircle className="h-4 w-4" />
                              Cancel Request
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-6 mb-6">
                      {/* Section: Basic Info */}
                      <div>
                        <div className="text-blue-700 font-semibold text-md mb-2 pb-1 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-blue-400" /> Basic Information
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                          <div className="text-md text-gray-500">Employee ID</div>
                          <div className="font-semibold text-gray-800">{selectedRequest.employeeID || '-'}</div>
                          <div className="text-md text-gray-500">Uploaded By</div>
                          <div className="font-semibold text-gray-800">{selectedRequest.uploadedBy || '-'}</div>
                        </div>
                      </div>

                      {/* Section: Timing Details */}
                      <div>
                        <div className="text-blue-700 font-semibold text-lg mb-2 border-b border-blue-100 pb-1 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-400" /> Timing Details (IST)
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                          <div className="text-md text-gray-500">Punch Time</div>
                          <div className="font-mono text-base text-blue-800">
                            {(() => {
                              if (!selectedRequest.punchedTime) return '-';

                              // Helper function to format punch/transaction time in Indian way
                              const formatIndianTime = (timeStr: string) => {
                                try {
                                  // Handle different time formats
                                  let date: Date;

                                  // If it's a full ISO string
                                  if (timeStr.includes('T')) {
                                    // If it already has timezone info
                                    if (timeStr.includes('+') || timeStr.includes('Z')) {
                                      date = new Date(timeStr);
                                    } else {
                                      // If no timezone, assume IST and add +05:30
                                      date = new Date(timeStr + '+05:30');
                                    }
                                  } else {
                                    // If it's just time (HH:MM), create date with today
                                    const today = new Date();
                                    const [hours, minutes] = timeStr.split(':');
                                    date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
                                  }

                                  // Check if date is valid
                                  if (isNaN(date.getTime())) {
                                    return timeStr; // Return original if parsing fails
                                  }

                                  // Format in Indian way: DD/MM/YYYY, HH:MM AM/PM
                                  const day = date.getDate().toString().padStart(2, '0');
                                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                  const year = date.getFullYear();
                                  const hours = date.getHours();
                                  const minutes = date.getMinutes().toString().padStart(2, '0');
                                  const ampm = hours >= 12 ? 'PM' : 'AM';
                                  const displayHours = hours % 12 || 12;

                                  return `${day}/${month}/${year}, ${displayHours}:${minutes} ${ampm}`;
                                } catch (error) {
                                  return timeStr; // Return original if parsing fails
                                }
                              };

                              return formatIndianTime(selectedRequest.punchedTime);
                            })()}
                          </div>
                          <div className="text-md text-gray-500">Transaction Time</div>
                          <div className="font-mono text-base text-blue-800">
                            {(() => {
                              if (!selectedRequest.transactionTime) return '-';

                              // Helper function to format punch/transaction time in Indian way
                              const formatIndianTime = (timeStr: string) => {
                                try {
                                  // Handle different time formats
                                  let date: Date;

                                  // If it's a full ISO string
                                  if (timeStr.includes('T')) {
                                    // If it already has timezone info
                                    if (timeStr.includes('+') || timeStr.includes('Z')) {
                                      date = new Date(timeStr);
                                    } else {
                                      // If no timezone, assume IST and add +05:30
                                      date = new Date(timeStr + '+05:30');
                                    }
                                  } else {
                                    // If it's just time (HH:MM), create date with today
                                    const today = new Date();
                                    const [hours, minutes] = timeStr.split(':');
                                    date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes));
                                  }

                                  // Check if date is valid
                                  if (isNaN(date.getTime())) {
                                    return timeStr; // Return original if parsing fails
                                  }

                                  // Format in Indian way: DD/MM/YYYY, HH:MM AM/PM
                                  const day = date.getDate().toString().padStart(2, '0');
                                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                  const year = date.getFullYear();
                                  const hours = date.getHours();
                                  const minutes = date.getMinutes().toString().padStart(2, '0');
                                  const ampm = hours >= 12 ? 'PM' : 'AM';
                                  const displayHours = hours % 12 || 12;

                                  return `${day}/${month}/${year}, ${displayHours}:${minutes} ${ampm}`;
                                } catch (error) {
                                  return timeStr; // Return original if parsing fails
                                }
                              };

                              return formatIndianTime(selectedRequest.transactionTime);
                            })()}
                          </div>
                          <div className="text-md text-gray-500">Upload Time</div>
                          <div className="font-mono text-base text-blue-800">
                            {(() => {
                              if (!selectedRequest.uploadTime) return '-';

                              // Helper function to parse and format uploadTime date
                              const parseUploadTime = (dateStr: string) => {
                                try {
                                  // Handle different date formats
                                  let date: Date;

                                  // If it already has timezone info
                                  if (dateStr.includes('+') || dateStr.includes('Z')) {
                                    date = new Date(dateStr);
                                  } else {
                                    // If no timezone, assume IST and add +05:30
                                    date = new Date(dateStr + '+05:30');
                                  }

                                  // Check if date is valid
                                  if (isNaN(date.getTime())) {
                                    return 'Invalid Date';
                                  }

                                  // Format in IST
                                  return date.toLocaleString('en-IN', {
                                    timeZone: 'Asia/Kolkata',
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  });
                                } catch (error) {
                                  return 'Invalid Date';
                                }
                              };

                              return parseUploadTime(selectedRequest.uploadTime);
                            })()}
                          </div>
                          <div className="text-md text-gray-500">Attendance Date</div>
                          <div className="font-mono text-base text-blue-800">
                            {selectedRequest.attendanceDate ?
                              new Date(selectedRequest.attendanceDate).toLocaleDateString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              }) : '-'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Section: Punch Details */}
                      <div>
                        <div className="text-blue-700 font-semibold text-md mb-2 border-b border-blue-100 pb-1 flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-blue-400" /> Punch Details
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                          <div className="text-md text-gray-500">In/Out</div>
                          <div className="font-mono text-base text-blue-800">{selectedRequest.inOut || '-'}</div>
                          <div className="text-md text-gray-500">Type of Movement</div>
                          <div className="font-mono text-base text-blue-800">{selectedRequest.typeOfMovement || '-'}</div>
                          <div className="text-md text-gray-500">Remarks</div>
                          <div className="font-semibold text-gray-500 col-span-2">{selectedRequest.remarks || '-'}</div>
                        </div>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        className="flex-1 px-4 py-2 h-9 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                        onClick={() => setShowStatusOverlay(true)}
                      >
                        Status Update
                      </button>
                    </div>
                    {/* Status Overlay Modal */}
                    {showStatusOverlay && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-gray-100">
                          {/* Close Button */}
                          <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
                            onClick={() => {
                              setShowStatusOverlay(false);
                              setStatusAction(null);
                              setStatusComment('');
                              setStatusError('');
                            }}
                          >
                            <X className="h-5 w-5" />
                          </button>

                          {/* Header */}
                          <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Update Request Status</h3>
                            <p className="text-sm text-gray-500 mt-1">Choose an action to update the punch request status</p>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            <button
                              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${statusAction === 'cancel'
                                  ? 'border-blue-500 bg-blue-50 shadow-md'
                                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                }`}
                              onClick={() => { setStatusAction('cancel'); setStatusError(''); }}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${statusAction === 'cancel' ? 'bg-blue-500' : 'bg-gray-200'
                                }`}>
                                <X className={`h-4 w-4 ${statusAction === 'cancel' ? 'text-white' : 'text-gray-500'}`} />
                              </div>
                              <span className={`text-sm font-medium ${statusAction === 'cancel' ? 'text-blue-700' : 'text-gray-700'
                                }`}>Cancel</span>
                            </button>

                            <button
                              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${statusAction === 'reject'
                                  ? 'border-red-500 bg-red-50 shadow-md'
                                  : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50'
                                }`}
                              onClick={() => { setStatusAction('reject'); setStatusError(''); }}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${statusAction === 'reject' ? 'bg-red-500' : 'bg-gray-200'
                                }`}>
                                <XCircle className={`h-4 w-4 ${statusAction === 'reject' ? 'text-white' : 'text-gray-500'}`} />
                              </div>
                              <span className={`text-sm font-medium ${statusAction === 'reject' ? 'text-red-700' : 'text-gray-700'
                                }`}>Reject</span>
                            </button>

                            <button
                              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${statusAction === 'approve'
                                  ? 'border-green-500 bg-green-50 shadow-md'
                                  : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                                }`}
                              onClick={() => { setStatusAction('approve'); setStatusError(''); }}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${statusAction === 'approve' ? 'bg-green-500' : 'bg-gray-200'
                                }`}>
                                <CheckCircle className={`h-4 w-4 ${statusAction === 'approve' ? 'text-white' : 'text-gray-500'}`} />
                              </div>
                              <span className={`text-sm font-medium ${statusAction === 'approve' ? 'text-green-700' : 'text-gray-700'
                                }`}>Approve</span>
                            </button>
                          </div>

                          {/* Comment Section */}
                          {(statusAction === 'cancel' || statusAction === 'reject') && (
                            <div className="mb-6">
                              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-gray-500" />
                                Comment <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={statusComment}
                                onChange={e => setStatusComment(e.target.value)}
                                placeholder="Please provide a reason for this action..."
                                className="w-full min-h-[100px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition-all duration-200 hover:border-blue-300 resize-none"
                              />
                              {statusError && (
                                <div className="flex items-center gap-2 text-red-500 text-sm mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                  <AlertCircle className="h-4 w-4" />
                                  {statusError}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Submit Button */}
                          {(statusAction === 'cancel' || statusAction === 'reject' || statusAction === 'approve') && (
                            <button
                              className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm ${statusAction === 'cancel'
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                  : statusAction === 'reject'
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                }`}
                              disabled={statusLoading || ((statusAction === 'cancel' || statusAction === 'reject') && !statusComment.trim())}
                              onClick={() => {
                                if ((statusAction === 'cancel' || statusAction === 'reject') && !statusComment.trim()) {
                                  setStatusError('Please enter a comment to proceed.');
                                  return;
                                }
                                setStatusLoading(true);
                                setTimeout(() => {
                                  setStatusLoading(false);
                                  setShowStatusOverlay(false);
                                  setStatusAction(null);
                                  setStatusComment('');
                                  setStatusError('');
                                  // Determine stateEvent based on action
                                  let stateEvent = "USERCANCEL"; // default
                                  if (statusAction === 'reject') {
                                    stateEvent = "REJECT";
                                  } else if (statusAction === 'approve') {
                                    stateEvent = "NEXT";
                                  } else if (statusAction === 'cancel') {
                                    stateEvent = "USERCANCEL";
                                  }

                                  const data={
                                    _id: selectedRequest?.id,
                                    tenantCode: tenantCode,
                                    workflowName: selectedRequest?.workflowName,
                                    stateEvent: stateEvent,
                                    organizationCode: tenantCode,
                                    isDeleted: selectedRequest?.isDeleted,
                                    employeeID: selectedRequest?.employeeID,
                                    attendanceDate: selectedRequest?.attendanceDate,
                                    appliedDate: selectedRequest?.appliedDate,
                                    punchedTime: selectedRequest?.punchedTime,
                                    transactionTime: selectedRequest?.transactionTime,
                                    uploadTime: selectedRequest?.uploadTime,
                                    inOut: selectedRequest?.inOut,
                                    typeOfMovement: selectedRequest?.typeOfMovement,
                                    uploadedBy: selectedRequest?.uploadedBy,
                                    createdOn: selectedRequest?.createdOn,
                                    workflowState: selectedRequest?.workflowState,
                                    remarks: selectedRequest?.remarks,
                                    action: statusAction,
                                    comment: statusComment,
                                  }
                                  alert(JSON.stringify(data));
                                  const backendData = {
                                    tenant: tenantCode,
                                    action: "insert",
                                    id: selectedRequest?.id,
                                    event: "application1",
                                    collectionName: "forgotPunchApplication",
                                    data: data,
                                  }
                                  postShiftZone(backendData);
                                }, 1200);
                              }}
                            >
                              {statusLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Updating...
                                </div>
                              ) : (
                                `Submit ${statusAction?.charAt(0).toUpperCase() + statusAction?.slice(1)}`
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cancel Request Popup */}
                    {showCancelRequestPopup && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border border-gray-100">
                          {/* Close Button */}
                          <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
                            onClick={() => {
                              setShowCancelRequestPopup(false);
                              setCancelRequestComment('');
                              setCancelRequestError('');
                            }}
                          >
                            <X className="h-5 w-5" />
                          </button>

                          {/* Header */}
                          <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                              <XCircle className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Cancel Request</h3>
                            <p className="text-sm text-gray-500 mt-1">Are you sure you want to cancel this punch request?</p>
                          </div>

                          {/* Comment Section */}
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-gray-500" />
                              Reason for Cancellation <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={cancelRequestComment}
                              onChange={e => setCancelRequestComment(e.target.value)}
                              placeholder="Please provide a reason for cancelling this request..."
                              className="w-full min-h-[100px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:shadow-lg shadow-sm transition-all duration-200 hover:border-red-300 resize-none"
                            />
                            {cancelRequestError && (
                              <div className="flex items-center gap-2 text-red-500 text-sm mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                <AlertCircle className="h-4 w-4" />
                                {cancelRequestError}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <button
                              className="flex-1 py-3 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 shadow-md hover:shadow-lg"
                              onClick={() => {
                                setShowCancelRequestPopup(false);
                                setCancelRequestComment('');
                                setCancelRequestError('');
                              }}
                            >
                              Keep Request
                            </button>
                            <button
                              className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={cancelRequestLoading || !cancelRequestComment.trim()}
                              onClick={() => {
                                if (!cancelRequestComment.trim()) {
                                  setCancelRequestError('Please provide a reason for cancellation.');
                                  return;
                                }
                                setCancelRequestLoading(true);
                                setTimeout(() => {
                                  setCancelRequestLoading(false);
                                  setShowCancelRequestPopup(false);
                                  setCancelRequestComment('');
                                  setCancelRequestError('');
                                  // Build the data object for cancel
                                  const data = {
                                    _id: selectedRequest?.id,
                                    tenantCode: tenantCode,
                                    workflowName: selectedRequest?.workflowName,
                                    stateEvent: "NEXT",
                                    organizationCode: selectedRequest?.organizationCode,
                                    isDeleted: selectedRequest?.isDeleted,
                                    employeeID: selectedRequest?.employeeID,
                                    attendanceDate: selectedRequest?.attendanceDate,
                                    appliedDate: selectedRequest?.appliedDate,
                                    punchedTime: selectedRequest?.punchedTime,
                                    transactionTime: selectedRequest?.transactionTime,
                                    uploadTime: selectedRequest?.uploadTime,
                                    inOut: selectedRequest?.inOut,
                                    state: "new",
                                    typeOfMovement: selectedRequest?.typeOfMovement,
                                    uploadedBy: selectedRequest?.uploadedBy,
                                    createdOn: selectedRequest?.createdOn,
                                    workflowState: "INITIATED",
                                    remarks: selectedRequest?.remarks,
                                    comment: cancelRequestComment,
                                  };
                                  const backendData = {
                                    tenant: tenantCode,
                                    action: "insert",
                                    id: selectedRequest?.id,
                                    event: "application",
                                    collectionName: "editPunchApplication",
                                    data: data,
                                  };
                                  alert(JSON.stringify(data));
                                  postShiftZone(backendData);
                                }, 1200);
                              }}
                            >
                              {cancelRequestLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Cancelling...
                                </div>
                              ) : (
                                'Cancel Request'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Send className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">No Request Selected</p>
                    <p className="text-sm">Select a request from the list to view its details.</p>
                  </div>
                )}
              </div>
            </div>
            {/* Status Updates Section (shown when showStatusView is true) */}
            {showStatusView && (
              <div className="w-1/2 flex justify-center relative ">
                <button
                  onClick={() => setShowStatusView(false)}
                  className="absolute top-4 right-4 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-blue-600 transition"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="w-[360px]">
                  <AutoStatusUpdate
                    fileId={selectedRequest?.id || ""}
                    setOpen={setShowStatusView}
                    reportData={selectedRequest}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 