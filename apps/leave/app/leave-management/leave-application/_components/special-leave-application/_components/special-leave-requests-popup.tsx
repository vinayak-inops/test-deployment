"use client"

import { useState, useEffect, useMemo } from "react"
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { Clock, Send, CheckCircle, XCircle, Calendar, MessageSquare, AlertCircle, BarChart3, UserCheck, X, LogIn, LogOut } from "lucide-react"

import AutoStatusUpdate from "@/components/auto-stutues-update"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
  import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
  import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { formatDateTime } from "@/utils/time/time-control"
import { useByteToBase64 } from "../../../../../../hooks/api/file-handle/useByteToBase64"
import { useKeyclockRoleInfo } from '@/hooks/search/keyclock-role-info'

interface PunchRequest {
  id: string
  employeeID: string
  uploadedBy: string
  fromDate?: string
  toDate?: string
  lastDayOfWork?: string
  noOfDays?: number
  DOBOfChild?: string
  AdoptionPlacementDate?: string
  leaveTitle?: string
  leaves?: Array<{ date: string; leaveCode: string; duration: string }>
  documents?: Array<{ fileName?: string; fileSize?: number; fileType?: string; filePath?: string }>
  documentCount?: number
  remarks: string
  status: "pending" | "approved" | "rejected" | "validated" | "failed"
  submittedAt?: Date
  uploadTime?: string
  workflowState?: string
  appliedDate?: string
  organizationCode: string
  tenantCode: string
  comment?: string
  // Backend raw fields for details view
  createdOn?: string
  workflowName?: string
  stateEvent?: string
  isDeleted?: boolean
  tenantId?: string
  approverID?: string
  leaveCode?: string
}

interface PunchRequestsPopupProps {
  isOpen: boolean
  onClose: () => void
  initialSelectedRequest?: PunchRequest | null
  selectedRequestId?: string | null
  isSelfPermission?: boolean
  isAllPermission?: boolean
  userMode?: 'user' | 'approver'
  sourceCollectionName?: string
  onActionSuccess?: () => void
  modeOfRequest?: string
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
    uploadedBy: item.uploadedBy || '',
    employeeID: item.employeeID || '',
    fromDate: item.fromDate || '',
    toDate: item.toDate || '',
    lastDayOfWork: item.lastDayOfWork || '',
    noOfDays: item.noOfDays !== undefined && item.noOfDays !== null ? Number(item.noOfDays) : undefined,
    DOBOfChild: item.DOBOfChild || '',
    AdoptionPlacementDate: item.AdoptionPlacementDate || '',
    leaveTitle: item.leaveTitle || '',
    leaves: Array.isArray(item.leaves) ? item.leaves : [],
    documents: Array.isArray(item.documents) ? item.documents : [],
    documentCount: typeof item.documentCount === 'number' ? item.documentCount : undefined,
    remarks: item.remarks || "",
    status:
      item.workflowState?.toLowerCase() === "approved"
        ? "approved"
        : item.workflowState?.toLowerCase() === "rejected"
        ? "rejected"
        : item.workflowState?.toLowerCase() === "validated"
        ? "validated"
        : item.workflowState?.toLowerCase() === "failed"
        ? "failed"
        : "pending",
    submittedAt: safeParseDate(item.createdOn),
    uploadTime: item.uploadTime,
    workflowState: item.workflowState,
    appliedDate: item.appliedDate,
    organizationCode: item.organizationCode || '',
    tenantCode: item.tenantCode || '',
    comment: item.comment || '',
    // Raw backend fields for details view
    createdOn: item.createdOn,
    workflowName: item.workflowName,
    stateEvent: item.stateEvent,
    isDeleted: item.isDeleted,
    tenantId: item.tenantId,
    approverID: item.approverID || item.approvedBy || item.rejectedBy || item.cancelledBy || '',
    leaveCode: item.leaveCode || '',
  };
}

export default function SpecialLeaveRequestsPopup({ 
  isOpen, 
  onClose, 
  initialSelectedRequest, 
  selectedRequestId,
  isSelfPermission = false,
  isAllPermission = false,
  userMode = 'user',
  sourceCollectionName,
  onActionSuccess,
  modeOfRequest
}: PunchRequestsPopupProps) {
  const [selectedRequest, setSelectedRequest] = useState<PunchRequest | null>(initialSelectedRequest || null)
  const [search, setSearch] = useState("")
  const [showCancel, setShowCancel] = useState(false)
  const [cancelComment, setCancelComment] = useState("")
  const [cancelError, setCancelError] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all')
  const [punchRequests, setPunchRequests] = useState<PunchRequest[]>([]);
  const [showCancelRequestPopup, setShowCancelRequestPopup] = useState(false);
  const [cancelRequestComment, setCancelRequestComment] = useState('');
  const [cancelRequestLoading, setCancelRequestLoading] = useState(false);
  const [cancelRequestError, setCancelRequestError] = useState('');

  const [statusAction, setStatusAction] = useState<'cancel' | 'reject' | 'approve' | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const tenantCode = useGetTenantCode()
  
  // Get logged-in employee ID for approver tracking
  const { employeeId } = useKeyclockRoleInfo()

  // Get cookie information for fallback
  const getCookie = (name: string): string | undefined => {
    if (typeof window === 'undefined') return undefined
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.startsWith(name + '=')) {
        const value = cookie.substring(name.length + 1)
        try {
          return decodeURIComponent(value)
        } catch {
          return value
        }
      }
    }
    return undefined
  }

  // Get stored role information from cookies
  const storedRoleInfo = useMemo(() => {
    try {
      const raw = getCookie('keyclockroleinfo')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

     // Get role permissions for approve/reject/cancel
       const { responseData: rolePermissions } = useRolePermissions({
           serviceName: 'applicationApplier',
           screenName: 'specialLeave'
       });
       const { responseData: roleApprover } = useRolePermissions({
           serviceName: 'applicationApprover',
           screenName: 'specialLeave'
       });
   
   // Determine permissions based on userMode
   // For "user" mode: check shiftApplicationsSelfCancel and shiftApplicationsAllCancel
   // For "approver" mode: check shiftApplicationsCancel, shiftApplicationsApprove, shiftApplicationsReject
 const canApprove =  (!!rolePermissions?.approve && modeOfRequest === 'applicationApplier') || (!!roleApprover?.approve && modeOfRequest === 'applicationApprover');
  const canReject = (modeOfRequest === 'applicationApplier' &&!!rolePermissions?.reject ) || (!!roleApprover?.reject && modeOfRequest === 'applicationApprover');
  const canCancel = (!!rolePermissions?.cancel && modeOfRequest === 'applicationApplier') || (!!roleApprover?.cancel && modeOfRequest === 'applicationApprover');

  // Helper to reset all local popup state when closing
  // Helper to reset all local popup state when closing
  const resetPopupState = () => {
    setSelectedRequest(initialSelectedRequest || null);
    setSearch("");
    setShowCancel(false);
    setCancelComment("");
    setCancelError("");
    setCancelLoading(false);
    setActiveTab('all');
    setPunchRequests([]);
    setShowCancelRequestPopup(false);
    setCancelRequestComment('');
    setCancelRequestLoading(false);
    setCancelRequestError('');
    setStatusAction(null);
    setStatusComment('');
    setStatusLoading(false);
    setStatusError('');
  };

  // When popup closes, clear previous values so next open is fresh
  useEffect(() => {
    if (!isOpen) {
      resetPopupState();
    }
  }, [isOpen]);

  // Determine which collection to use based on:
  // 1) sourceCollectionName from parent table (highest priority)
  // 2) selected request's workflow state + userMode (fallback)
  const collectionName = useMemo(() => {
    // If parent passed an explicit collection name (from approver table tabs), use it
    if (sourceCollectionName) {
      return sourceCollectionName;
    }

    const workflowState = selectedRequest?.workflowState?.toUpperCase();
    
    // For approver mode: use transaction collection for APPROVED, REJECTED, CANCELLED
    if (userMode === 'approver') {
      if (workflowState === 'APPROVED' || workflowState === 'REJECTED' || workflowState === 'CANCELLED') {
        return 'specialLeaveApplicationTransaction'; // Using same collection for now, can be changed to Transaction if needed
      }
      // Pending and Failed use regular collection
      return 'specialLeaveApplication';
    }
    
    // For user mode: always use regular collection (matching special-leave-application.tsx logic)
    // All, Pending, and all statuses use specialLeaveApplication
    return 'specialLeaveApplication';
  }, [selectedRequest?.workflowState, userMode, sourceCollectionName]);

  // Document preview state
  const [docPreviewIdx, setDocPreviewIdx] = useState<number | null>(null)
  const [docPreviewUrl, setDocPreviewUrl] = useState<string>("")
  const [docPreviewMime, setDocPreviewMime] = useState<string>("")
  const [docPreviewTitle, setDocPreviewTitle] = useState<string>("")
  const { fetchByteArray, loading: docLoading, error: docError, reset: resetDoc } = useByteToBase64()

  const buildFileUrl = (path?: string) => {
    if (!path) return ""
    if (path.startsWith('http') || path.startsWith('data:')) return path
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || ''
    return `${base}${path}`
  }
  const guessMimeFromPath = (nameOrPath?: string, fallback?: string) => {
    const lower = (nameOrPath || '').toLowerCase()
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
    if (lower.endsWith('.png')) return 'image/png'
    if (lower.endsWith('.gif')) return 'image/gif'
    if (lower.endsWith('.webp')) return 'image/webp'
    if (lower.endsWith('.pdf')) return 'application/pdf'
    return fallback || 'application/octet-stream'
  }

  // Get URL parameters
  const getUrlParams = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const employeeId = urlParams.get('employeeId');
      const month = urlParams.get('month');
      const year = urlParams.get('year');
      const fromdate = urlParams.get('fromdate');
      const todate = urlParams.get('todate');
      
      // Check for calendar view (month/year pattern)
      if (employeeId && month && year) {
        return {
          type: 'calendar',
          employeeId,
          month,
          year
        };
      }
      
      // Check for table view (fromdate/todate pattern)
      if (employeeId && fromdate && todate) {
        return {
          type: 'table',
          employeeId,
          fromdate,
          todate
        };
      }
    }
    return null;
  };

  // Build request data based on selectedRequestId (simplified: fetch by _id)
  const buildRequestData = useMemo(() => {
    const urlParams = getUrlParams();
    const requestData: any[] = [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ];
    
    // Primary: fetch by _id using selectedRequestId (works for both collections)
    if (selectedRequestId) {
      requestData.push({
        field: "_id",
        operator: "eq",
        value: selectedRequestId
      });
      return requestData;
    }
    
    // Fallback: if somehow no selectedRequestId, keep existing URL-based filter
    if (urlParams) {
      requestData.push({
        field: "employeeID",
        operator: "eq",
        value: urlParams.employeeId
      });
    }
    
    return requestData;
  }, [tenantCode, selectedRequestId]);

  const {
    data: attendanceResponse,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: `${collectionName}/search`,
    method: 'POST',
    data: buildRequestData,
    enabled: Boolean(selectedRequestId),
    onSuccess: (data) => {
      // handled in useEffect
    },
    onError: (error) => {
      console.error("Error fetching special leave data:", error);
    },
  });

  const {
    post: postShiftZone,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: collectionName,
    onSuccess: (data) => {
      // Only after successful backend response, refresh local details and parent table (if provided)
      fetchAttendance();
      if (onActionSuccess) {
        onActionSuccess();
      }
      setStatusLoading(false);
      setStatusAction(null);
      setStatusComment('');
      setStatusError('');
    },
    onError: (error) => {
      console.error("POST error:", error);
      setStatusLoading(false);
      setStatusError('Failed to update status. Please try again.');
    },
  });

  useEffect(() => {
    if (selectedRequestId) {
      fetchAttendance();
    }
  }, [selectedRequestId]);

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

  // Update selected request when initialSelectedRequest changes
  useEffect(() => {
    setSelectedRequest(initialSelectedRequest || null)
  }, [initialSelectedRequest])

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  const formatDDMMYYYY = (value?: string) => {
    if (!value) return '-'
    try {
      if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
        const [dd, mm, yyyy] = value.split('-').map(Number)
        const d = new Date(yyyy as number, (mm as number) - 1, dd as number)
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      }
      return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return value
    }
  }

  const formatDuration = (duration?: { noOfDays?: number; noOfHours?: number }) => {
    const days = duration?.noOfDays ?? 0
    const hours = duration?.noOfHours ?? 0
    const dayLabel = days === 1 ? 'day' : 'days'
    const hourLabel = hours === 1 ? 'hour' : 'hours'
    return `${days} ${dayLabel}, ${hours} ${hourLabel}`
  }

  const getTimeAgo = (date?: Date) => {
    if (!date) return '';
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    } else {
      return formatDate(date)
    }
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20"
      case "pending":
      case "initiated":
      case "validated":
        return "bg-[#64B5F6]/10 text-[#64B5F6] border-[#64B5F6]/20"
      case "rejected":
        return "bg-gray-100 text-gray-600 border-gray-200"
      case "failed":
        return "bg-red-100 text-red-600 border-red-200"
      default:
        return "bg-gray-200 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
      case "initiated":
      case "validated":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  // Filter out CANCEL requests before tab filtering (matching PunchRequestsPopup pattern)
  const visibleRequests = punchRequests.filter(req => req.workflowState?.toLowerCase() !== 'cancel');

  // No list or dropdown; details + auto status update only

  if (!isOpen) return null

  return (
    <>
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-5xl h-[85vh] flex flex-col rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-700">Leave Application</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
            <X className="h-4 w-4" />
              </button>
            </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden bg-gray-50">
              {/* Left Side - Request Details */}
          <div className="w-3/5 flex flex-col bg-white border-r border-gray-100">
            <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                  {selectedRequest ? (
                <div className="max-w-2xl">
                        {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-700">Request Details</h3>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border ${getStatusColor(selectedRequest.workflowState)}`}>
                      {getStatusIcon(selectedRequest.workflowState)}
                      <span className="uppercase tracking-wide">{selectedRequest.workflowState || 'PENDING'}</span>
                          </div>
                        </div>

                        {/* Format helpers */}
                        {(() => {
                          const parseDateTime = (dateStr: string) => formatDateTime(dateStr)

                          return (
                            <div className="space-y-2">
                              {/* Employee ID */}
                              <div className="flex items-center border-b border-gray-100 pb-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Employee ID</label>
                                <span className="text-sm text-gray-900 font-medium">{selectedRequest.employeeID || '-'}</span>
                              </div>

                              {/* Applied By */}
                              {selectedRequest.uploadedBy && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Applied By</label>
                                  <span className="text-sm text-gray-900 font-medium">{selectedRequest.uploadedBy}</span>
                                </div>
                              )}

                              {/* From / To Dates */}
                              {(selectedRequest.fromDate || selectedRequest.toDate) && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Period</label>
                                  <span className="text-sm text-gray-900 font-medium">
                                    {formatDDMMYYYY(selectedRequest.fromDate || '')}
                                    {selectedRequest.toDate ? ` - ${formatDDMMYYYY(selectedRequest.toDate)}` : ''}
                                  </span>
                                </div>
                              )}

                              {/* Upload Time */}
                              {selectedRequest.uploadTime && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Upload Time</label>
                                  <span className="text-sm text-gray-900 font-medium">{parseDateTime(selectedRequest.uploadTime)}</span>
                                </div>
                              )}

                              {/* Applied Date */}
                              {selectedRequest.appliedDate && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Applied Date</label>
                                  <span className="text-sm text-gray-900 font-medium">{formatDDMMYYYY(selectedRequest.appliedDate)}</span>
                                </div>
                              )}

                              

                              {/* Leaves */}
                              {Array.isArray(selectedRequest.leaves) && selectedRequest.leaves.length > 0 && (
                                <div className="border-b border-gray-100 pb-2">
                                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Leaves</label>
                                  <div className="rounded-md border">
                                    <div className="grid grid-cols-3 text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-2 border-b">
                                      <div>Date</div>
                                      <div>Leave Code</div>
                                      <div>Duration</div>
                                    </div>
                                    {selectedRequest.leaves.map((l, idx) => (
                                      <div key={idx} className="grid grid-cols-3 text-sm px-3 py-2 border-b last:border-b-0">
                                        <div>{formatDDMMYYYY(l.date)}</div>
                                        <div>{l.leaveCode}</div>
                                        <div>{l.duration}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Remarks */}
                              {selectedRequest.remarks && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Remarks</label>
                                  <span className="text-sm text-gray-900 font-medium">{selectedRequest.remarks}</span>
                                </div>
                              )}

                              {/* Comment */}
                              {selectedRequest.comment && (
                                <div className="flex items-start border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0 pt-1">Comment</label>
                                  <span className="text-sm text-gray-900 font-medium flex-1">{selectedRequest.comment}</span>
                                </div>
                              )}

                              {/* Documents (preview inside popup) */}
                              {Array.isArray(selectedRequest.documents) && selectedRequest.documents.length > 0 && (
                                <div className="border-b border-gray-100 pb-2">
                                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Documents</label>
                                  <div className="rounded-md border divide-y">
                                    {selectedRequest.documents.map((d, idx) => {
                                      const serverPath = d.filePath || ''
                                      const mime = d.fileType || guessMimeFromPath(d.fileName || d.filePath)
                                      return (
                                        <>
                                        <div key={idx} className="flex items-center justify-between px-3 py-2">
                                          <div className="min-w-0">
                                            <div className="text-sm text-gray-900 truncate" title={d.fileName}>{d.fileName || 'Document'}</div>
                                            {d.fileSize ? (
                                              <div className="text-xs text-gray-500">{Math.round((d.fileSize || 0)/1024)} KB</div>
                                            ) : null}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {serverPath && (
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  setDocPreviewIdx(idx)
                                                  setDocPreviewTitle(d.fileName || 'Document')
                                                  setDocPreviewMime(mime || '')
                                                  setDocPreviewUrl("")
                                                  // Try fetch bytes to create object URL
                                                  const res: any = await fetchByteArray(serverPath, mime || 'application/octet-stream')
                                                  if (res?.success && res.objectUrl) {
                                                    setDocPreviewUrl(res.objectUrl)
                                                  }
                                                }}
                                                className="text-blue-600 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                                              >
                                                Preview
                                              </button>
                                            )}
                                            {(docPreviewIdx === idx && docPreviewUrl) ? (
                                              <a href={docPreviewUrl} download className="text-gray-700 text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50">Download</a>
                                            ) : serverPath ? (
                                              <button
                                                type="button"
                                                className="text-gray-700 text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
                                                onClick={async () => {
                                                  const res: any = await fetchByteArray(serverPath, mime || 'application/octet-stream')
                                                  if (res?.success && res.objectUrl) {
                                                    const a = document.createElement('a')
                                                    a.href = res.objectUrl
                                                    a.download = d.fileName || 'document'
                                                    document.body.appendChild(a)
                                                    a.click()
                                                    document.body.removeChild(a)
                                                  }
                                                }}
                                              >
                                                Download
                                              </button>
                                            ) : null}
                                          </div>
                                        </div>
                                        {docPreviewIdx === idx && (
                                          <div className="">
                                            <div className="border rounded-md bg-gray-50">

                                              <div className="p-3 min-h-[200px]">
                                                {docLoading && <div className="text-center text-gray-500 py-10 text-sm">Loading preview...</div>}
                                                {!docLoading && docError && <div className="text-center text-red-600 py-10 text-sm">{docError}</div>}
                                                {!docLoading && !docError && docPreviewUrl && (
                                                  docPreviewMime === 'application/pdf' ? (
                                                    <iframe src={docPreviewUrl} title={docPreviewTitle || 'PDF'} className="w-full h-[60vh] border-0 rounded" />
                                                  ) : (docPreviewMime || '').startsWith('image/') ? (
                                                    <div className="flex justify-center">
                                                      <img src={docPreviewUrl} alt={docPreviewTitle || 'Preview'} className="max-w-full max-h-[60vh] object-contain rounded" />
                                                    </div>
                                                  ) : (
                                                    <div className="text-center text-gray-600">
                                                      <p className="mb-2 text-sm">Preview not available for this file type.</p>
                                                      <a href={docPreviewUrl} download className="underline text-blue-600 text-sm">Download file</a>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        </>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Status Update Controls (respect role permissions) */}
                                {!['APPROVED', 'REJECTED', 'CANCELLED', 'FAILED'].includes(selectedRequest.workflowState?.toUpperCase() || '') && (canApprove || canReject || canCancel) && (
                                <div className="pt-2 space-y-3">
                                  <div className="grid grid-cols-3 gap-3">
                                    {canApprove && (
                                    <label className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                      statusAction === 'approve'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                                    }`}>
                                      <input
                                        type="radio"
                                        name="statusAction"
                                        checked={statusAction === 'approve'}
                                        onChange={() => setStatusAction('approve')}
                                        className="sr-only"
                                      />
                                      <CheckCircle className={`h-5 w-5 ${statusAction === 'approve' ? 'text-green-600' : 'text-gray-400'}`} />
                                      <span className="text-sm font-semibold text-gray-900">Approve</span>
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${
                                        statusAction === 'approve'
                                          ? 'border-green-500 bg-green-500'
                                          : 'border-gray-300'
                                      }`}>
                                        {statusAction === 'approve' && (
                                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                        )}
                                      </div>
                                    </label>
                                    )}

                                    {canReject && (
                                    <label className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                      statusAction === 'reject'
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50'
                                    }`}>
                                      <input
                                        type="radio"
                                        name="statusAction"
                                        checked={statusAction === 'reject'}
                                        onChange={() => setStatusAction('reject')}
                                        className="sr-only"
                                      />
                                      <XCircle className={`h-5 w-5 ${statusAction === 'reject' ? 'text-red-600' : 'text-gray-400'}`} />
                                      <span className="text-sm font-semibold text-gray-900">Reject</span>
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${
                                        statusAction === 'reject'
                                          ? 'border-red-500 bg-red-500'
                                          : 'border-gray-300'
                                      }`}>
                                        {statusAction === 'reject' && (
                                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                        )}
                                      </div>
                                    </label>
                                    )}

                                    {canCancel && (
                                    <label className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                      statusAction === 'cancel'
                                        ? 'border-gray-900 bg-gray-100'
                                        : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
                                    }`}>
                                      <input
                                        type="radio"
                                        name="statusAction"
                                        checked={statusAction === 'cancel'}
                                        onChange={() => setStatusAction('cancel')}
                                        className="sr-only"
                                      />
                                      <X className={`h-5 w-5 ${statusAction === 'cancel' ? 'text-gray-900' : 'text-gray-400'}`} />
                                      <span className="text-sm font-semibold text-gray-900">Cancel</span>
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${
                                        statusAction === 'cancel'
                                          ? 'border-gray-900 bg-gray-900'
                                          : 'border-gray-300'
                                      }`}>
                                        {statusAction === 'cancel' && (
                                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                        )}
                                      </div>
                                    </label>
                                    )}
            </div>

            {/* Comment Section */}
            {(statusAction === 'cancel' || statusAction === 'reject') && (
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Comment <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={statusComment}
                  onChange={e => setStatusComment(e.target.value)}
                  placeholder="Please provide a reason for this action..."
                                        className="w-full min-h-[80px] rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all resize-none"
                />
                {statusError && (
                                        <div className="flex items-center gap-2 text-red-600 text-sm mt-2 p-2.5 bg-red-50 rounded-lg border border-red-200">
                                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {statusError}
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
                                  {statusAction && (
              <button
                                      type="button"
                                      className={`w-full h-10 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm ${
                                        statusAction === 'cancel'
                                          ? 'bg-black hover:bg-gray-900'
                    : statusAction === 'reject'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-green-600 hover:bg-green-700'
                  }`}
                disabled={statusLoading || ((statusAction === 'cancel' || statusAction === 'reject') && !statusComment.trim())}
                onClick={() => {
                  // Permission checks
                  if ((statusAction === 'approve' && !canApprove) || (statusAction === 'reject' && !canReject) || (statusAction === 'cancel' && !canCancel)) {
                    setStatusError('You do not have permission for this action.');
                    return;
                  }
                  if ((statusAction === 'cancel' || statusAction === 'reject') && !statusComment.trim()) {
                    setStatusError('Please enter a comment to proceed.');
                    return;
                  }
                                        
                  setStatusLoading(true);
                    
                    // Determine stateEvent based on action
                    let stateEvent = "CANCEL"; // default
                    if (statusAction === 'reject') {
                      stateEvent = "REJECT";
                    } else if (statusAction === 'approve') {
                      stateEvent = "NEXT";
                    } else if (statusAction === 'cancel') {
                      stateEvent = "CANCEL";
                    }

                    // Helper functions for date formatting
                    const pad = (n: number) => n < 10 ? `0${n}` : n;
                    
                    // Get current time in Indian Standard Time (IST)
                    const now = new Date();
                    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
                    
                    const yyyy = istTime.getFullYear();
                    const mm = pad(istTime.getMonth() + 1);
                    const dd = pad(istTime.getDate());
                    const hh = pad(istTime.getHours());
                    const min = pad(istTime.getMinutes());
                    const ss = pad(istTime.getSeconds());
                    const ms = pad(istTime.getMilliseconds());
                    
                    // createdOn: 'YYYY-MM-DDTHH:mm:ss.sss+05:30' (IST timezone offset)
                    const createdOn = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+05:30`;
                    // uploadTime: 'YYYY-MM-DDTHH:mm:ss'
                    const uploadTime = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
                    // appliedDate: 'YYYY-MM-DD'
                    const appliedDate = `${yyyy}-${mm}-${dd}`;
                    const data: any = {
                      ...selectedRequest,
                      _id: selectedRequest?.id,
                      tenantCode: selectedRequest?.tenantCode || tenantCode,
                      workflowName: selectedRequest?.workflowName || "specialLeave Application",
                      stateEvent: stateEvent,
                      leaveCode: selectedRequest?.leaveCode,
                      organizationCode: selectedRequest?.organizationCode || tenantCode,
                      isDeleted: selectedRequest?.isDeleted || false,
                      employeeID: selectedRequest?.employeeID,
                      fromDate: selectedRequest?.fromDate,
                      toDate: selectedRequest?.toDate,
                      lastDayOfWork: selectedRequest?.lastDayOfWork,
                      noOfDays: selectedRequest?.noOfDays,
                      DOBOfChild: selectedRequest?.DOBOfChild,
                      AdoptionPlacementDate: selectedRequest?.AdoptionPlacementDate,
                      leaveTitle: selectedRequest?.leaveTitle,
                      leaves: selectedRequest?.leaves,
                      appliedDate: selectedRequest?.appliedDate,
                      uploadTime: selectedRequest?.uploadTime || uploadTime,
                      uploadedBy: selectedRequest?.uploadedBy,
                      createdOn: selectedRequest?.createdOn || createdOn,
                      workflowState: selectedRequest?.workflowState,
                      remarks: selectedRequest?.remarks,
                      action: statusAction,
                      comment: statusComment,
                      approverID: selectedRequest?.approverID || employeeId || '', // Use approverID from backend, fallback to logged-in user's employee ID
                    }

                    // Add action-specific approver fields based on the action type
                    // Use approverID from backend if available, otherwise use current logged-in user's employeeId
                    const approverId = selectedRequest?.approverID || employeeId;
                    if (statusAction === 'approve' && approverId) {
                      data.approvedBy = approverId;
                    } else if (statusAction === 'reject' && approverId) {
                      data.rejectedBy = approverId;
                    } else if (statusAction === 'cancel' && approverId) {
                      data.cancelledBy = approverId;
                    }
                   
                    const backendData = {
                      tenant: tenantCode,
                      action: "insert",
                      id: selectedRequest?.id,
                      event: "application",
                      collectionName: collectionName,
                      data: data,
                    }
                    // Call backend; onSuccess handler will refresh and reset state
                    postShiftZone(backendData);
                }}
              >
                {statusLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span>Updating...</span>
                  </div>
                ) : (
                  `Submit ${statusAction ? statusAction.charAt(0).toUpperCase() + statusAction.slice(1) : ''}`
                )}
              </button>
            )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        {(isLoading || selectedRequestId) ? (
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500">Loading request details...</p>
                          </div>
                        ) : (
                          <>
                            <Send className="h-12 w-12 mb-3 opacity-40" />
                            <p className="text-base font-medium text-gray-500">No Request Selected</p>
                            <p className="text-sm text-gray-400 mt-1">Select a request to view details</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              {/* Auto Status Update Panel */}
              <div className="w-2/5 flex flex-col bg-gray-50">
                <div className="flex-1 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                  {userMode === 'approver' && selectedRequest && ['APPROVED', 'REJECTED', 'CANCELLED'].some(status => (selectedRequest.workflowState?.toUpperCase() || '') === status) ? (
                    <div className="flex items-center justify-center h-full px-6 py-4">
                      <div className="text-center">
                        <div className="mb-3">
                          {selectedRequest.workflowState?.toUpperCase() === 'APPROVED' && (
                            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                          )}
                          {selectedRequest.workflowState?.toUpperCase() === 'REJECTED' && (
                            <XCircle className="h-12 w-12 text-red-600 mx-auto" />
                          )}
                          {selectedRequest.workflowState?.toUpperCase() === 'CANCELLED' && (
                            <XCircle className="h-12 w-12 text-gray-600 mx-auto" />
                          )}
                        </div>
                        <p className="text-base font-semibold text-gray-700 mb-1">
                          Application {selectedRequest.workflowState?.toUpperCase() || 'PROCESSED'}
                        </p>
                        <p className="text-sm text-gray-500">
                          This application has been {selectedRequest.workflowState?.toLowerCase() || 'processed'} and cannot be modified.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-sm px-6 py-4">
                      <AutoStatusUpdate
                        fileId={selectedRequest?.id || ""}
                        setOpen={() => {}}
                        reportData={selectedRequest}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
      </div>
    </div>

    {/* Cancel Request Popup */}
      {showCancelRequestPopup && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative border border-gray-200">
                        {/* Close Button */}
                        <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            setShowCancelRequestPopup(false);
                            setCancelRequestComment('');
                            setCancelRequestError('');
                          }}
                        >
            <X className="h-4 w-4" />
                        </button>

                        {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Cancel Request</h3>
            <p className="text-sm text-gray-500">Are you sure you want to cancel this punch request?</p>
                        </div>

                        {/* Comment Section */}
                        <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                            Reason for Cancellation <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={cancelRequestComment}
                            onChange={e => setCancelRequestComment(e.target.value)}
                            placeholder="Please provide a reason for cancelling this request..."
              className="w-full min-h-[100px] rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all resize-none"
                          />
                          {cancelRequestError && (
              <div className="flex items-center gap-2 text-red-600 text-sm mt-2 p-2.5 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                              {cancelRequestError}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
              className="flex-1 py-2.5 px-4 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            onClick={() => {
                              setShowCancelRequestPopup(false);
                              setCancelRequestComment('');
                              setCancelRequestError('');
                            }}
                          >
                            Keep Request
                          </button>
                          <button
              className="flex-1 py-2.5 px-4 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                                // Here you would call your cancel API
                                alert("Request cancelled with comment: " + cancelRequestComment);
                              }, 1200);
                            }}
                          >
                            {cancelRequestLoading ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Cancelling...</span>
                              </div>
                            ) : (
                              'Cancel Request'
                            )}
                          </button>
                        </div>
          </div>
        </div>
      )}

    {/* No overlay preview; preview is inline under each document row */}

    </>
  )
}
