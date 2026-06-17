"use client"

import { useState, useEffect } from "react"
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { Clock, Send, CheckCircle, XCircle, Calendar, MessageSquare, AlertCircle, BarChart3, UserCheck, X, LogIn, LogOut } from "lucide-react"

import AutoStatusUpdate from "@/app/punch/_components/auto-stutues-update"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { formatDateTimeIST } from "@/utils/time/time-control"

interface EditPunchRequest {
  id: string
  _id: string
  employeeID: string
  punchedTime: string
  transactionTime: string
  inOut: string
  typeOfMovement: string
  newAttendanceDate: string
  attendanceDate: string
  appliedDate?: string
  remarks: string
  workflowState?: string
  status?: string
  state?: string
  createdOn?: string
  workflowName?: string
  stateEvent?: string
  isDeleted?: boolean
  tenantCode?: string
  organizationCode?: string
  uploadedBy?: string
  comment?: string
}

interface EditPunchRequestsPopupProps {
  isOpen: boolean
  onClose: () => void
  initialSelectedRequest?: EditPunchRequest | null
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

function mapBackendToEditPunchRequest(item: any): EditPunchRequest {
  return {
    id: item._id,
    _id: item._id,
    employeeID: item.employeeID || '',
    punchedTime: item.punchedTime || '',
    transactionTime: item.transactionTime || '',
    inOut: item.inOut || '',
    typeOfMovement: item.typeOfMovement || '',
    newAttendanceDate: item.newAttendanceDate || '',
    attendanceDate: item.attendanceDate || '',
    appliedDate: item.appliedDate || '',
    remarks: item.remarks || "",
    workflowState: item.workflowState || "",
    status: item.workflowState || "INITIATED",
    state: item.state || "new",
    createdOn: item.createdOn,
    workflowName: item.workflowName || "EditPunch Application",
    stateEvent: item.stateEvent,
    isDeleted: item.isDeleted,
    tenantCode: item.tenantCode || '',
    organizationCode: item.organizationCode || '',
    uploadedBy: item.uploadedBy || '',
    comment: item.comment || '',
  };
}

export default function EditPunchRequestsPopup({ isOpen, onClose, initialSelectedRequest, selectedRequestId }: EditPunchRequestsPopupProps) {
  const [selectedRequest, setSelectedRequest] = useState<EditPunchRequest | null>(initialSelectedRequest || null)
  const [editPunchRequests, setEditPunchRequests] = useState<EditPunchRequest[]>([]);
  const [showCancelRequestPopup, setShowCancelRequestPopup] = useState(false);
  const [cancelRequestComment, setCancelRequestComment] = useState('');
  const [cancelRequestLoading, setCancelRequestLoading] = useState(false);
  const [cancelRequestError, setCancelRequestError] = useState('');

  const [statusAction, setStatusAction] = useState<'cancel' | 'reject' | 'approve' | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const tenantCode = useGetTenantCode()

  // Role permissions (approve/reject/cancel)
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: 'muster',
    screenName: 'muster-punch'
  });
  const canApprove = !!(rolePermissions?.musterRollSelf || rolePermissions?.musterRollAll);
  const canReject = !!(rolePermissions?.musterRollSelf || rolePermissions?.musterRollAll);
  const canCancel = !!(rolePermissions?.musterRollSelf || rolePermissions?.musterRollAll);

  // Build request data
  const buildRequestData = () => {
    return [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "isDeleted",
        operator: "eq",
        value: false
      }
    ];
  };

  const {
    data: attendanceResponse,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: 'editPunchApplication/search',
    method: 'POST',
    data: buildRequestData(),
    onSuccess: (data) => {
      // handled in useEffect
    },
    onError: (error) => {
      console.error("Error fetching edit punch data:", error);
    },
    dependencies: [tenantCode]
  });

  const {
    post: postShiftZone,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "editPunchApplication",
    onSuccess: (data) => {
      fetchAttendance();
      setStatusAction(null);
      setStatusComment('');
      setStatusError('');
    },
    onError: (error) => {
      console.error("POST error:", error);
      setStatusError('Failed to update status. Please try again.');
      setStatusLoading(false);
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchAttendance();
    }
  }, [selectedRequestId, isOpen]);

  useEffect(() => {
    if (attendanceResponse && Array.isArray(attendanceResponse)) {
      const mappedRequests = attendanceResponse.map(mapBackendToEditPunchRequest);
      setEditPunchRequests(mappedRequests);

      // Priority: selectedRequestId > initialSelectedRequest
      if (selectedRequestId) {
        const foundRequest = mappedRequests.find(req => req.id === selectedRequestId || req._id === selectedRequestId);
        if (foundRequest) {
          setSelectedRequest(foundRequest);
        }
      } else if (initialSelectedRequest) {
        setSelectedRequest(initialSelectedRequest);
      }
    }
  }, [attendanceResponse, selectedRequestId, initialSelectedRequest])

  // Handle selectedRequestId changes when data is already loaded
  useEffect(() => {
    if (selectedRequestId && editPunchRequests.length > 0) {
      const foundRequest = editPunchRequests.find(req => req.id === selectedRequestId || req._id === selectedRequestId);
      if (foundRequest) {
        setSelectedRequest(foundRequest);
      }
    }
  }, [selectedRequestId, editPunchRequests])

  // Update selected request when initialSelectedRequest changes
  useEffect(() => {
    setSelectedRequest(initialSelectedRequest || null)
  }, [initialSelectedRequest])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      // Handle YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [yyyy, mm, dd] = dateStr.split('-').map(Number)
        const d = new Date(yyyy, mm - 1, dd)
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      }
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const formatDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return '-'
    try {
      return formatDateTimeIST(dateTimeStr)
    } catch {
      return dateTimeStr
    }
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20"
      case "PENDING":
      case "INITIATED":
      case "VALIDATE":
      case "NEW":
        return "bg-[#64B5F6]/10 text-[#64B5F6] border-[#64B5F6]/20"
      case "REJECTED":
        return "bg-gray-100 text-gray-600 border-gray-200"
      case "CANCELLED":
      case "CANCEL":
        return "bg-red-100 text-red-600 border-red-200"
      default:
        return "bg-gray-200 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "PENDING":
      case "INITIATED":
      case "VALIDATE":
      case "NEW":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "CANCELLED":
      case "CANCEL":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <>
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { 
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="bg-white w-full max-w-5xl h-[85vh] flex flex-col rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-700">Edit Punch Application</h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            aria-label="Close popup"
            type="button"
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

                  <div className="space-y-2">
                    {/* Employee ID */}
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Employee ID</label>
                      <span className="text-sm text-gray-900 font-medium">{selectedRequest.employeeID || '-'}</span>
                    </div>

                    {/* Punched Time */}
                    {selectedRequest.punchedTime && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Punched Time</label>
                        <span className="text-sm text-gray-900 font-medium">{formatDateTime(selectedRequest.punchedTime)}</span>
                      </div>
                    )}

                    {/* Transaction Time */}
                    {selectedRequest.transactionTime && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Transaction Time</label>
                        <span className="text-sm text-gray-900 font-medium">{formatDateTime(selectedRequest.transactionTime)}</span>
                      </div>
                    )}

                    {/* In/Out */}
                    {selectedRequest.inOut && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">In/Out</label>
                        <span className="text-sm text-gray-900 font-medium">{selectedRequest.inOut}</span>
                      </div>
                    )}

                    {/* Movement Type */}
                    {selectedRequest.typeOfMovement && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Movement Type</label>
                        <span className="text-sm text-gray-900 font-medium">{selectedRequest.typeOfMovement}</span>
                      </div>
                    )}

                    {/* Attendance Date */}
                    {selectedRequest.attendanceDate && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Attendance Date</label>
                        <span className="text-sm text-gray-900 font-medium">{formatDate(selectedRequest.attendanceDate)}</span>
                      </div>
                    )}

                    {/* New Attendance Date */}
                    {selectedRequest.newAttendanceDate && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">New Attendance Date</label>
                        <span className="text-sm text-gray-900 font-medium">{formatDate(selectedRequest.newAttendanceDate)}</span>
                      </div>
                    )}

                    {/* Applied Date */}
                    {selectedRequest.appliedDate && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Applied Date</label>
                        <span className="text-sm text-gray-900 font-medium">{formatDate(selectedRequest.appliedDate)}</span>
                      </div>
                    )}

                    {/* Remarks */}
                    {selectedRequest.remarks && (
                      <div className="flex items-start border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0 pt-1">Remarks</label>
                        <span className="text-sm text-gray-900 font-medium flex-1">{selectedRequest.remarks}</span>
                      </div>
                    )}

                    {/* Created On */}
                    {selectedRequest.createdOn && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Created On</label>
                        <span className="text-sm text-gray-900 font-medium">{formatDateTime(selectedRequest.createdOn)}</span>
                      </div>
                    )}

                    {/* Comment */}
                    {selectedRequest.comment && (
                      <div className="flex items-start border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0 pt-1">Comment</label>
                        <span className="text-sm text-gray-900 font-medium flex-1">{selectedRequest.comment}</span>
                      </div>
                    )}

                    {/* Status Update Controls (respect role permissions) */}
                    {/* {!['APPROVED', 'REJECTED', 'CANCELLED'].includes(selectedRequest.workflowState?.toUpperCase() || '') && (canApprove || canReject || canCancel) && (
                      <div className="pt-2 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          {canApprove && (
                            <label 
                              className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                statusAction === 'approve'
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <input
                                type="radio"
                                name="statusAction"
                                checked={statusAction === 'approve'}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setStatusAction('approve');
                                }}
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
                            <label 
                              className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                statusAction === 'reject'
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <input
                                type="radio"
                                name="statusAction"
                                checked={statusAction === 'reject'}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setStatusAction('reject');
                                }}
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
                            <label 
                              className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                statusAction === 'cancel'
                                  ? 'border-gray-900 bg-gray-100'
                                  : 'border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <input
                                type="radio"
                                name="statusAction"
                                checked={statusAction === 'cancel'}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setStatusAction('cancel');
                                }}
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
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if ((statusAction === 'approve' && !canApprove) || (statusAction === 'reject' && !canReject) || (statusAction === 'cancel' && !canCancel)) {
                                setStatusError('You do not have permission for this action.');
                                return;
                              }
                              if ((statusAction === 'cancel' || statusAction === 'reject') && !statusComment.trim()) {
                                setStatusError('Please enter a comment to proceed.');
                                return;
                              }
                              
                              setStatusLoading(true);
                              setStatusError('');
                              
                              let stateEvent = "USERCANCEL";
                              if (statusAction === 'reject') {
                                stateEvent = "REJECT";
                              } else if (statusAction === 'approve') {
                                stateEvent = "NEXT";
                              } else if (statusAction === 'cancel') {
                                stateEvent = "USERCANCEL";
                              }

                              const data = {
                                _id: selectedRequest?._id || selectedRequest?.id,
                                tenantCode: selectedRequest?.tenantCode || tenantCode,
                                workflowName: selectedRequest?.workflowName || "EditPunch Application",
                                stateEvent: stateEvent,
                                organizationCode: selectedRequest?.organizationCode || tenantCode,
                                isDeleted: selectedRequest?.isDeleted || false,
                                employeeID: selectedRequest?.employeeID,
                                punchedTime: selectedRequest?.punchedTime,
                                transactionTime: selectedRequest?.transactionTime,
                                inOut: selectedRequest?.inOut,
                                typeOfMovement: selectedRequest?.typeOfMovement,
                                newAttendanceDate: selectedRequest?.newAttendanceDate,
                                attendanceDate: selectedRequest?.attendanceDate,
                                appliedDate: selectedRequest?.appliedDate,
                                remarks: selectedRequest?.remarks,
                                workflowState: selectedRequest?.workflowState,
                                state: selectedRequest?.state,
                                createdOn: selectedRequest?.createdOn,
                                comment: statusComment,
                              }
                             
                              const backendData = {
                                tenant: tenantCode,
                                action: "insert",
                                id: selectedRequest?._id || selectedRequest?.id,
                                event: "application",
                                collectionName: "editPunchApplication",
                                data: data,
                              }

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
                    )} */}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Send className="h-12 w-12 mb-3 opacity-40" />
                  <p className="text-base font-medium text-gray-500">No Request Selected</p>
                  <p className="text-sm text-gray-400 mt-1">Select a request to view details</p>
                </div>
              )}
            </div>
          </div>

          {/* Auto Status Update Panel */}
          <div className="w-2/5 flex flex-col bg-gray-50">
            <div className="flex-1 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
              <div className="w-full max-w-sm px-6 py-4">
                <AutoStatusUpdate
                  fileId={selectedRequest?._id || selectedRequest?.id || ""}
                  setOpen={() => {}}
                  reportData={selectedRequest}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}