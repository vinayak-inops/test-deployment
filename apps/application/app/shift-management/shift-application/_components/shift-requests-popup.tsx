"use client";

import { useState, useEffect } from "react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import {
  Clock,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
} from "lucide-react";

import AutoStatusUpdate from "@/app/_components/auto-stutues-update";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useKeyclockRoleInfo } from '@/hooks/api/search/keyclock-role-info';
import { formatDateTimeIST } from "@/utils/time/time-control";
import { useMemo } from "react";

interface ShiftRequest {
  id: string;
  employeeID: string;
  uploadedBy?: string;
  fromDate: string;
  toDate: string;
  appliedDate?: string;
  shiftGroupCode?: string;
  isAutomatic?: boolean;
  shiftName?: string;
  shiftStart?: string;
  shiftEnd?: string;
  lunchStart?: string;
  lunchEnd?: string;
  remarks?: string; // main remarks
  additionalRemarks?: string; // optional additional remarks
  shift?: {
    shiftCode?: string;
    shiftName?: string;
    shiftStart?: string;
    shiftEnd?: string;
    firstHalfStart?: string;
    firstHalfEnd?: string;
    secondHalfStart?: string;
    secondHalfEnd?: string;
    lunchStart?: string;
    lunchEnd?: string;
    duration?: number;
    crossDay?: boolean;
    flexible?: boolean;
    flexiFullDayDuration?: number;
    flexiHalfDayDuration?: number;
    minimumDurationForFullDay?: number;
    minimumDurationForHalfDay?: number;
  };
  status: "pending" | "approved" | "rejected" | "validated" | "failed";
  submittedAt?: Date;
  uploadTime?: string;
  workflowState?: string;
  organizationCode?: string;
  tenantCode?: string;
  comment?: string;
  // Backend raw fields for details view
  createdOn?: string;
  workflowName?: string;
  stateEvent?: string;
  isDeleted?: boolean;
  tenantId?: string;
  approverID?: string;
}

interface ShiftRequestsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedRequest?: ShiftRequest | null;
  selectedRequestId?: string | null;
  isSelfPermission?: boolean;
  isAllPermission?: boolean;
  userMode?: 'user' | 'approver';
  sourceCollectionName?: string;
  onActionSuccess?: () => void;
  modeOfRequest?: string;
}

// Helper to safely parse date strings
function safeParseDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  // If only date (YYYY-MM-DD), treat as UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + "T00:00:00Z");
  }
  // If date and time without timezone (YYYY-MM-DDTHH:mm:ss)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(dateStr)) {
    return new Date(dateStr + "Z");
  }
  // Otherwise, try native Date
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d;
}

function mapBackendToShiftRequest(item: any): ShiftRequest {
  return {
    id: item._id,
    uploadedBy: item.createdBy || item.uploadedBy || "",
    employeeID: item.employeeID || "",
    fromDate: item.fromDate || "",
    toDate: item.toDate || "",
    appliedDate: item.appliedDate || "",
    shiftGroupCode: item.shiftGroupCode || "",
    isAutomatic: typeof item.isAutomatic === 'boolean' ? item.isAutomatic : undefined,
    shiftName: item.shiftList?.shiftName || item.shift?.shiftName || item.shiftName || "",
    shiftStart: item.shiftList?.shiftStart || item.shift?.shiftStart || item.shiftStart || "",
    shiftEnd: item.shiftList?.shiftEnd || item.shift?.shiftEnd || item.shiftEnd || "",
    lunchStart: item.shiftList?.lunchStart || item.shift?.lunchStart || item.lunchStart || "",
    lunchEnd: item.shiftList?.lunchEnd || item.shift?.lunchEnd || item.lunchEnd || "",
    shift: (item.shiftList || item.shift)
      ? {
          shiftCode: (item.shiftList || item.shift).shiftCode,
          shiftName: (item.shiftList || item.shift).shiftName,
          shiftStart: (item.shiftList || item.shift).shiftStart,
          shiftEnd: (item.shiftList || item.shift).shiftEnd,
          firstHalfStart: (item.shiftList || item.shift).firstHalfStart,
          firstHalfEnd: (item.shiftList || item.shift).firstHalfEnd,
          secondHalfStart: (item.shiftList || item.shift).secondHalfStart,
          secondHalfEnd: (item.shiftList || item.shift).secondHalfEnd,
          lunchStart: (item.shiftList || item.shift).lunchStart,
          lunchEnd: (item.shiftList || item.shift).lunchEnd,
          duration: (item.shiftList || item.shift).duration,
          crossDay: (item.shiftList || item.shift).crossDay,
          flexible: (item.shiftList || item.shift).flexible,
          flexiFullDayDuration: (item.shiftList || item.shift).flexiFullDayDuration,
          flexiHalfDayDuration: (item.shiftList || item.shift).flexiHalfDayDuration,
          minimumDurationForFullDay: (item.shiftList || item.shift).minimumDurationForFullDay,
          minimumDurationForHalfDay: (item.shiftList || item.shift).minimumDurationForHalfDay,
        }
      : undefined,
    remarks: item.Remarks || "",
    additionalRemarks: item.remarks || "",
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
    organizationCode: item.organizationCode || "",
    tenantCode: item.tenantCode || "",
    comment: item.comment || "",
    // Raw backend fields for details view
    createdOn: item.createdOn,
    workflowName: item.workflowName || "shiftChange Application",
    stateEvent: item.stateEvent,
    isDeleted: item.isDeleted,
    tenantId: item.tenantId,
    approverID: item.approverID || item.approvedBy || item.rejectedBy || item.cancelledBy || '',
  };
}

export default function ShiftRequestsPopup({
  isOpen,
  onClose,
  initialSelectedRequest,
  selectedRequestId,
  isSelfPermission: _isSelfPermission = false,
  isAllPermission: _isAllPermission = false,
  userMode = 'user',
  sourceCollectionName,
  onActionSuccess,
  modeOfRequest
}: ShiftRequestsPopupProps) {
  const [selectedRequest, setSelectedRequest] = useState<ShiftRequest | null>(
    initialSelectedRequest || null
  );
  const [showShiftDetails, setShowShiftDetails] = useState(true);
  const [punchRequests, setPunchRequests] = useState<any[]>([]);
  const [showCancelRequestPopup, setShowCancelRequestPopup] = useState(false);
  const [cancelRequestComment, setCancelRequestComment] = useState("");
  const [cancelRequestLoading, setCancelRequestLoading] = useState(false);
  const [cancelRequestError, setCancelRequestError] = useState("");

  const [statusAction, setStatusAction] = useState<
    "cancel" | "reject" | "approve" | null
  >(null);
  const [statusComment, setStatusComment] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const tenantCode = useGetTenantCode();
  
  // Get logged-in employee ID
  const { employeeId } = useKeyclockRoleInfo()

  // Get role permissions for approve/reject/cancel
      const { responseData: rolePermissions } = useRolePermissions({
          serviceName: 'applicationApplier',
          screenName: 'shiftChange'
      });
      const { responseData: roleApprover } = useRolePermissions({
          serviceName: 'applicationApprover',
          screenName: 'shiftChange'
      });
  
  // Determine permissions based on userMode
  // For "user" mode: check shiftApplicationsSelfCancel and shiftApplicationsAllCancel
  // For "approver" mode: check shiftApplicationsCancel, shiftApplicationsApprove, shiftApplicationsReject
  const canApprove =  (!!rolePermissions?.approve && modeOfRequest === 'applicationApplier') || (!!roleApprover?.approve && modeOfRequest === 'applicationApprover');
  const canReject = (modeOfRequest === 'applicationApplier' &&!!rolePermissions?.reject ) || (!!roleApprover?.reject && modeOfRequest === 'applicationApprover');
  const canCancel = (!!rolePermissions?.cancel && modeOfRequest === 'applicationApplier') || (!!roleApprover?.cancel && modeOfRequest === 'applicationApprover');

  // Helper to reset all local popup state when closing
  const resetPopupState = () => {
    setSelectedRequest(initialSelectedRequest || null);
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
        return 'shiftChangeApplicationTransaction';
      }
      // Pending and Failed use regular collection
      return 'shiftChangeApplication';
    }
    
    // For user mode: always use regular collection (matching shift-application.tsx logic)
    // Applications, Pending, Failed, and all statuses use shiftChangeApplication
    return 'shiftChangeApplication';
  }, [selectedRequest?.workflowState, userMode, sourceCollectionName]);

  // Build request data based on selectedRequestId (simplified: fetch by _id)
  const buildRequestData = useMemo(() => {
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
    
    return requestData;
  }, [selectedRequestId, tenantCode]);

  const {
    data: attendanceResponse,
    refetch: fetchAttendance,
    loading: isLoading,
  } = useRequest<any>({
    url: `${collectionName}/search`,
    method: "POST",
    data: buildRequestData,
    enabled: Boolean(selectedRequestId),
    onSuccess: (data) => {
      // handled in useEffect
    },
    onError: (error) => {
    },
  });

  const {
    post: postShiftZone,
  } = usePostRequest<any>({
    url: collectionName,
    onSuccess: (data) => {
      // Refresh data after successful update
      fetchAttendance();
      // Call parent callback to refresh list
      if (onActionSuccess) {
        onActionSuccess();
      }
      // Reset status state
      setStatusLoading(false);
      setStatusAction(null);
      setStatusComment("");
      setStatusError("");
    },
    onError: (error) => {
      // Optionally handle error (e.g., show a toast)
      setStatusLoading(false);
      setStatusError("Failed to update request. Please try again.");
    },
  });

  useEffect(() => {
    if (isOpen && (selectedRequestId || initialSelectedRequest)) {
      fetchAttendance();
    }
  }, [isOpen, selectedRequestId, initialSelectedRequest, collectionName]);

  useEffect(() => {
    if (attendanceResponse && Array.isArray(attendanceResponse)) {
      const mappedRequests = attendanceResponse.map(mapBackendToShiftRequest);
      setPunchRequests(mappedRequests);

      // Priority: selectedRequestId > initialSelectedRequest
      if (selectedRequestId) {
        const foundRequest = mappedRequests.find(
          (req) => req.id === selectedRequestId
        );
        
        if (foundRequest) {
          setSelectedRequest(foundRequest);
        }
      } else if (initialSelectedRequest) {
        setSelectedRequest(initialSelectedRequest);
      }
    }
  }, [attendanceResponse, selectedRequestId, initialSelectedRequest]);

  // Handle selectedRequestId changes when data is already loaded
  useEffect(() => {
    if (selectedRequestId && punchRequests.length > 0) {
      const foundRequest = punchRequests.find(
        (req) => req.id === selectedRequestId
      );
      if (foundRequest) {
        setSelectedRequest(foundRequest);
      }
    }
  }, [selectedRequestId, punchRequests]);

  // Update selected request when initialSelectedRequest changes
  useEffect(() => {
    setSelectedRequest(initialSelectedRequest || null);
  }, [initialSelectedRequest]);

  const formatDDMMYYYY = (value?: string) => {
    if (!value) return "-";
    try {
      if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
        const [dd, mm, yyyy] = value.split("-").map(Number);
        const d = new Date(yyyy as number, (mm as number) - 1, dd as number);
        return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
      return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return value;
    }
  };

  const toTimeLabel = (v?: string) => {
    if (!v) return "";
    // Accept HH:mm:ss or HH:mm
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(v)) {
      const [hh, mm] = v.split(":");
      const d = new Date();
      d.setHours(parseInt(hh, 10));
      d.setMinutes(parseInt(mm, 10));
      d.setSeconds(0);
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    // ISO date string fallback
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return v;
  };

  const formatTimeRange = (s?: string, e?: string) => {
    const a = toTimeLabel(s);
    const b = toTimeLabel(e);
    if (!a && !b) return "-";
    if (a && b) return `${a} – ${b}`;
    return a || b;
  };

  const formatMinutes = (m?: number) => {
    if (!m && m !== 0) return "-";
    const hours = Math.floor(m / 60);
    const minutes = m % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20";
      case "pending":
      case "initiated":
      case "validated":
        return "bg-[#64B5F6]/10 text-[#64B5F6] border-[#64B5F6]/20";
      case "rejected":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "failed":
        return "bg-red-100 text-red-600 border-red-200";
      default:
        return "bg-gray-200 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
      case "initiated":
      case "validated":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  // No list or dropdown; details + auto status update only

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-white w-full max-w-5xl h-[85vh] flex flex-col rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-700">
              Shift Application
            </h2>
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
                      <h3 className="text-base font-semibold text-gray-700">
                        Request Details
                      </h3>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border ${getStatusColor(selectedRequest.workflowState)}`}
                      >
                        {getStatusIcon(selectedRequest.workflowState)}
                        <span className="uppercase tracking-wide">
                          {selectedRequest.workflowState || "PENDING"}
                        </span>
                      </div>
                    </div>

                    {/* Format helpers */}
                    {(() => {
                      const parseDateTime = (dateStr: string) =>
                        formatDateTimeIST(dateStr);

                      return (
                        <div className="space-y-2">
                          {/* Employee ID */}
                          <div className="flex items-center border-b border-gray-100 pb-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                              Employee ID
                            </label>
                            <span className="text-sm text-gray-900 font-medium">
                              {selectedRequest.employeeID || "-"}
                            </span>
                          </div>

                          {/* Applied Date */}
                          {selectedRequest.appliedDate && (
                            <div className="flex items-center border-b border-gray-100 pb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                Applied Date
                              </label>
                              <span className="text-sm text-gray-900 font-medium">
                                {formatDDMMYYYY(selectedRequest.appliedDate)}
                              </span>
                            </div>
                          )}

                          {/* Shift Group Code */}
                          {selectedRequest.shiftGroupCode && (
                            <div className="flex items-center border-b border-gray-100 pb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                Shift Group
                              </label>
                              <span className="text-sm text-gray-900 font-medium">
                                {selectedRequest.shiftGroupCode}
                              </span>
                            </div>
                          )}

                          {/* Is Automatic */}
                          {typeof selectedRequest.isAutomatic !== 'undefined' && (
                            <div className="flex items-center border-b border-gray-100 pb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                Automatic
                              </label>
                              <span className="text-sm text-gray-900 font-medium">
                                {selectedRequest.isAutomatic ? 'Yes' : 'No'}
                              </span>
                            </div>
                          )}

                          {/* Uploaded By */}
                          {selectedRequest.uploadedBy && (
                            <div className="flex items-center border-b border-gray-100 pb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                Uploaded By
                              </label>
                              <span className="text-sm text-gray-900 font-medium">
                                {selectedRequest.uploadedBy}
                              </span>
                            </div>
                          )}

                          {/* Created On */}
                          {selectedRequest.createdOn && (
                            <div className="flex items-center border-b border-gray-100 pb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                Created On
                              </label>
                              <span className="text-sm text-gray-900 font-medium">
                                {formatDateTimeIST(selectedRequest.createdOn as string)}
                              </span>
                            </div>
                          )}

                          {/* Upload Time */}
                          {selectedRequest.uploadTime && (
                            <div className="flex items-center border-b border-gray-100 pb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                Upload Time
                              </label>
                              <span className="text-sm text-gray-900 font-medium">
                                {formatDateTimeIST(selectedRequest.uploadTime as string)}
                              </span>
                            </div>
                          )}

                          {/* Shift Name */}
                          {selectedRequest.shiftName && (
                            <div className="flex items-center border-b border-gray-100 pb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                Shift Name
                              </label>
                              <span className="text-sm text-gray-900 font-medium">
                                {selectedRequest.shiftName}
                              </span>
                            </div>
                          )}

                          {/* From / To Dates */}
                          {(selectedRequest.fromDate ||
                            selectedRequest.toDate) && (
                            <div className="flex items-center border-b border-gray-100 pb-2 gap-6">
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 flex-shrink-0">
                                  From Date
                                </label>
                                <span className="text-sm text-gray-900 font-medium">
                                  {formatDDMMYYYY(selectedRequest.fromDate)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 flex-shrink-0">
                                  To Date
                                </label>
                                <span className="text-sm text-gray-900 font-medium">
                                  {formatDDMMYYYY(selectedRequest.toDate)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Shift Timing */}
                          {(selectedRequest.shiftStart ||
                            selectedRequest.shiftEnd) && (
                            <div className="flex items-center border-b border-gray-100 pb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                Shift Timing
                              </label>
                              <span className="text-sm text-gray-900 font-medium">
                                {formatTimeRange(
                                  selectedRequest.shiftStart,
                                  selectedRequest.shiftEnd
                                )}
                              </span>
                            </div>
                          )}

                          {/* Lunch Break */}
                          {(selectedRequest.lunchStart ||
                            selectedRequest.lunchEnd) && (
                            <div className="flex items-center border-b border-gray-100 pb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                Lunch Break
                              </label>
                              <span className="text-sm text-gray-900 font-medium">
                                {formatTimeRange(
                                  selectedRequest.lunchStart,
                                  selectedRequest.lunchEnd
                                )}
                              </span>
                            </div>
                          )}

                          {/* Remarks */}
                          {selectedRequest.remarks && (
                            <div className="flex items-center border-b border-gray-100 pb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                Remarks
                              </label>
                              <span className="text-sm text-gray-900 font-medium">
                                {selectedRequest.remarks}
                              </span>
                            </div>
                          )}

                          {/* Additional Remarks / Action Comment */}
                          {(selectedRequest.additionalRemarks || selectedRequest.comment) && (
                            <>
                              {selectedRequest.additionalRemarks && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                    Additional Remarks
                                  </label>
                                  <span className="text-sm text-gray-900 font-medium">
                                    {selectedRequest.additionalRemarks}
                                  </span>
                                </div>
                              )}
                              {selectedRequest.comment && (
                                <div className="flex items-start border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0 pt-1">
                                    Action Comment
                                  </label>
                                  <span className="text-sm text-gray-900 font-medium flex-1">
                                    {selectedRequest.comment}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {/* Shift Details - Basic + Read more */}
                          {selectedRequest.shift && (
                            <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                              <div className="flex items-center pb-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                  Shift Code
                                </label>
                                <span className="text-sm text-gray-900 font-medium">
                                  {selectedRequest.shift.shiftCode || "-"}
                                </span>
                              </div>
                              <div className="flex items-center pb-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                  Shift Name
                                </label>
                                <span className="text-sm text-gray-900 font-medium">
                                  {selectedRequest.shift.shiftName || "-"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowShiftDetails((prev) => !prev)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                              >
                                {showShiftDetails ? "Hide details" : "Read more"}
                              </button>
                              {showShiftDetails && (
                                <div className="space-y-2">
                                  {(selectedRequest.shift.firstHalfStart ||
                                    selectedRequest.shift.firstHalfEnd) && (
                                    <div className="flex items-center pb-1">
                                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                        First Half
                                      </label>
                                      <span className="text-sm text-gray-900 font-medium">
                                        {formatTimeRange(
                                          selectedRequest.shift.firstHalfStart,
                                          selectedRequest.shift.firstHalfEnd
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {(selectedRequest.shift.secondHalfStart ||
                                    selectedRequest.shift.secondHalfEnd) && (
                                    <div className="flex items-center pb-1">
                                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                        Second Half
                                      </label>
                                      <span className="text-sm text-gray-900 font-medium">
                                        {formatTimeRange(
                                          selectedRequest.shift.secondHalfStart,
                                          selectedRequest.shift.secondHalfEnd
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {typeof selectedRequest.shift.duration !==
                                    "undefined" && (
                                    <div className="flex items-center pb-1">
                                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                        Duration
                                      </label>
                                      <span className="text-sm text-gray-900 font-medium">
                                        {formatMinutes(
                                          selectedRequest.shift.duration
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {(typeof selectedRequest.shift.crossDay !==
                                    "undefined" ||
                                    typeof selectedRequest.shift.flexible !==
                                      "undefined") && (
                                    <div className="flex items-center pb-1">
                                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                        Flags
                                      </label>
                                      <span className="text-sm text-gray-900 font-medium">
                                        {selectedRequest.shift.crossDay
                                          ? "Cross Day"
                                          : "Same Day"}
                                        {typeof selectedRequest.shift.flexible !==
                                        "undefined"
                                          ? `, ${selectedRequest.shift.flexible ? "Flexible" : "Fixed"}`
                                          : ""}
                                      </span>
                                    </div>
                                  )}
                                  {(typeof selectedRequest.shift
                                    .flexiFullDayDuration !== "undefined" ||
                                    typeof selectedRequest.shift
                                      .flexiHalfDayDuration !== "undefined") && (
                                    <div className="flex items-center pb-1">
                                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                        Flexi Durations
                                      </label>
                                      <span className="text-sm text-gray-900 font-medium">
                                        {typeof selectedRequest.shift
                                          .flexiFullDayDuration !== "undefined"
                                          ? `Full: ${formatMinutes(selectedRequest.shift.flexiFullDayDuration)}`
                                          : ""}
                                        {typeof selectedRequest.shift
                                          .flexiFullDayDuration !== "undefined" &&
                                        typeof selectedRequest.shift
                                          .flexiHalfDayDuration !== "undefined"
                                          ? ", "
                                          : ""}
                                        {typeof selectedRequest.shift
                                          .flexiHalfDayDuration !== "undefined"
                                          ? `Half: ${formatMinutes(selectedRequest.shift.flexiHalfDayDuration)}`
                                          : ""}
                                      </span>
                                    </div>
                                  )}
                                  {(typeof selectedRequest.shift
                                    .minimumDurationForFullDay !== "undefined" ||
                                    typeof selectedRequest.shift
                                      .minimumDurationForHalfDay !==
                                      "undefined") && (
                                    <div className="flex items-center pb-1">
                                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">
                                        Minimum Durations
                                      </label>
                                      <span className="text-sm text-gray-900 font-medium">
                                        {typeof selectedRequest.shift
                                          .minimumDurationForFullDay !== "undefined"
                                          ? `Full: ${formatMinutes(selectedRequest.shift.minimumDurationForFullDay)}`
                                          : ""}
                                        {typeof selectedRequest.shift
                                          .minimumDurationForFullDay !==
                                          "undefined" &&
                                        typeof selectedRequest.shift
                                          .minimumDurationForHalfDay !== "undefined"
                                          ? ", "
                                          : ""}
                                        {typeof selectedRequest.shift
                                          .minimumDurationForHalfDay !== "undefined"
                                          ? `Half: ${formatMinutes(selectedRequest.shift.minimumDurationForHalfDay)}`
                                          : ""}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Comment */}
                          {selectedRequest.comment && (
                            <div className="flex items-start border-b border-gray-100 pb-2">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0 pt-1">
                                Comment
                              </label>
                              <span className="text-sm text-gray-900 font-medium flex-1">
                                {selectedRequest.comment}
                              </span>
                            </div>
                          )}

                          {/* Status Update Controls (respect role permissions and userMode) */}
                          {!["APPROVED", "REJECTED", "CANCELLED"].includes(
                            selectedRequest.workflowState?.toUpperCase() || ""
                          ) &&
                            (canApprove || canReject || canCancel) && (
                              <div className="pt-2 space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                  {canApprove && (
                                    <label
                                      className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        statusAction === "approve"
                                          ? "border-green-500 bg-green-50"
                                          : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="statusAction"
                                        checked={statusAction === "approve"}
                                        onChange={() =>
                                          setStatusAction("approve")
                                        }
                                        className="sr-only"
                                      />
                                      <CheckCircle
                                        className={`h-5 w-5 ${statusAction === "approve" ? "text-green-600" : "text-gray-400"}`}
                                      />
                                      <span className="text-sm font-semibold text-gray-900">
                                        Approve
                                      </span>
                                      <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${
                                          statusAction === "approve"
                                            ? "border-green-500 bg-green-500"
                                            : "border-gray-300"
                                        }`}
                                      >
                                        {statusAction === "approve" && (
                                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                        )}
                                      </div>
                                    </label>
                                  )}

                                  {canReject && (
                                    <label
                                      className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        statusAction === "reject"
                                          ? "border-red-500 bg-red-50"
                                          : "border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/50"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="statusAction"
                                        checked={statusAction === "reject"}
                                        onChange={() =>
                                          setStatusAction("reject")
                                        }
                                        className="sr-only"
                                      />
                                      <XCircle
                                        className={`h-5 w-5 ${statusAction === "reject" ? "text-red-600" : "text-gray-400"}`}
                                      />
                                      <span className="text-sm font-semibold text-gray-900">
                                        Reject
                                      </span>
                                      <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${
                                          statusAction === "reject"
                                            ? "border-red-500 bg-red-500"
                                            : "border-gray-300"
                                        }`}
                                      >
                                        {statusAction === "reject" && (
                                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                        )}
                                      </div>
                                    </label>
                                  )}

                                  {canCancel && (
                                    <label
                                      className={`relative flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                        statusAction === "cancel"
                                          ? "border-gray-900 bg-gray-100"
                                          : "border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="statusAction"
                                        checked={statusAction === "cancel"}
                                        onChange={() =>
                                          setStatusAction("cancel")
                                        }
                                        className="sr-only"
                                      />
                                      <X
                                        className={`h-5 w-5 ${statusAction === "cancel" ? "text-gray-900" : "text-gray-400"}`}
                                      />
                                      <span className="text-sm font-semibold text-gray-900">
                                        Cancel
                                      </span>
                                      <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${
                                          statusAction === "cancel"
                                            ? "border-gray-900 bg-gray-900"
                                            : "border-gray-300"
                                        }`}
                                      >
                                        {statusAction === "cancel" && (
                                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                        )}
                                      </div>
                                    </label>
                                  )}
                                </div>

                                {/* Comment Section */}
                                {(statusAction === "cancel" ||
                                  statusAction === "reject") && (
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                      Comment{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                      value={statusComment}
                                      onChange={(e) =>
                                        setStatusComment(e.target.value)
                                      }
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
                                      statusAction === "cancel"
                                        ? "bg-black hover:bg-gray-900"
                                        : statusAction === "reject"
                                          ? "bg-red-600 hover:bg-red-700"
                                          : "bg-green-600 hover:bg-green-700"
                                    }`}
                                    disabled={
                                      statusLoading ||
                                      ((statusAction === "cancel" ||
                                        statusAction === "reject") &&
                                        !statusComment.trim())
                                    }
                                    onClick={() => {
                                      // Permission checks
                                      if (
                                        (statusAction === "approve" &&
                                          !canApprove) ||
                                        (statusAction === "reject" &&
                                          !canReject) ||
                                        (statusAction === "cancel" &&
                                          !canCancel)
                                      ) {
                                        setStatusError(
                                          "You do not have permission for this action."
                                        );
                                        return;
                                      }
                                      if (
                                        (statusAction === "cancel" ||
                                          statusAction === "reject") &&
                                        !statusComment.trim()
                                      ) {
                                        setStatusError(
                                          "Please enter a comment to proceed."
                                        );
                                        return;
                                      }

                                      setStatusLoading(true);

                                      // Determine stateEvent based on action
                                      let stateEvent = "CANCEL"; // default
                                      if (statusAction === "reject") {
                                        stateEvent = "REJECT";
                                      } else if (statusAction === "approve") {
                                        stateEvent = "NEXT";
                                      } else if (statusAction === "cancel") {
                                        stateEvent = "CANCEL";
                                      }

                                      // Helper functions for date formatting
                                      const pad = (n: number) =>
                                        n < 10 ? `0${n}` : n;

                                      // Get current time in Indian Standard Time (IST)
                                      const now = new Date();
                                      const istTime = new Date(
                                        now.toLocaleString("en-US", {
                                          timeZone: "Asia/Kolkata",
                                        })
                                      );

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
                                      // uploadedBy: get from employeeId
                                      let uploadedBy = employeeId || 'user';

                                      // Determine approverID - use from selectedRequest or current employeeId
                                      const approverID = selectedRequest?.approverID || employeeId || '';

                                      const data: any = {
                                        _id: selectedRequest?.id,
                                        tenantCode:
                                          selectedRequest?.tenantCode ||
                                          tenantCode,
                                        workflowName:
                                          selectedRequest?.workflowName ||
                                          "shiftChange Application",
                                        stateEvent: stateEvent,
                                        shiftGroupCode: selectedRequest?.shiftGroupCode,
                                        organizationCode:
                                          selectedRequest?.organizationCode ||
                                          tenantCode,
                                        isDeleted:
                                          selectedRequest?.isDeleted || false,
                                        employeeID: selectedRequest?.employeeID,
                                        fromDate: selectedRequest?.fromDate,
                                        toDate: selectedRequest?.toDate,
                                        shift: {
                                          ...(selectedRequest?.shift || {}),
                                          shiftName: selectedRequest?.shiftName,
                                          shiftStart: selectedRequest?.shiftStart,
                                          shiftEnd: selectedRequest?.shiftEnd,
                                          lunchStart: selectedRequest?.lunchStart,
                                          lunchEnd: selectedRequest?.lunchEnd,
                                        },
                                        remarks: selectedRequest?.remarks,
                                        appliedDate:
                                          selectedRequest?.appliedDate,
                                        uploadTime: selectedRequest?.uploadTime || uploadTime,
                                        uploadedBy:
                                          selectedRequest?.uploadedBy ||
                                          uploadedBy,
                                        createdOn:
                                          selectedRequest?.createdOn ||
                                          createdOn,
                                        workflowState:
                                          selectedRequest?.workflowState,
                                        action: statusAction,
                                        comment: statusComment,
                                        approverID: approverID,
                                      };

                                      // Add approver tracking fields based on action
                                      if (statusAction === 'approve') {
                                        data.approvedBy = employeeId || '';
                                      } else if (statusAction === 'reject') {
                                        data.rejectedBy = employeeId || '';
                                      } else if (statusAction === 'cancel') {
                                        data.cancelledBy = employeeId || '';
                                      }

                                      const backendData = {
                                        tenant: tenantCode,
                                        action: "insert",
                                        id: selectedRequest?.id,
                                        event: "application",
                                        collectionName: collectionName,
                                        data: data,
                                      };
                                      postShiftZone(backendData);
                                    }}
                                  >
                                    {statusLoading ? (
                                      <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Updating...</span>
                                      </div>
                                    ) : (
                                      `Submit ${statusAction ? statusAction.charAt(0).toUpperCase() + statusAction.slice(1) : ""}`
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
                        <p className="text-base font-medium text-gray-500">
                          No Request Selected
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Select a request to view details
                        </p>
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
                    {(() => {
                      const sr = selectedRequest as any
                      const reportData = sr ? {
                        id: sr.id,
                        employeeID: sr.employeeID,
                        appliedDate: sr.appliedDate,
                        fromDate: sr.fromDate,
                        toDate: sr.toDate,
                        status: sr.status || sr.workflowState,
                        workflowState: sr.workflowState
                      } : undefined
                      return (
                        <AutoStatusUpdate
                          fileId={selectedRequest?.id || ""}
                          setOpen={() => {}}
                          reportData={reportData}
                        />
                      )
                    })()}
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
                setCancelRequestComment("");
                setCancelRequestError("");
              }}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Cancel Request
              </h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to cancel this shift request?
              </p>
            </div>

            {/* Comment Section */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelRequestComment}
                onChange={(e) => setCancelRequestComment(e.target.value)}
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
                  setCancelRequestComment("");
                  setCancelRequestError("");
                }}
              >
                Keep Request
              </button>
              <button
                className="flex-1 py-2.5 px-4 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={cancelRequestLoading || !cancelRequestComment.trim()}
                onClick={() => {
                  if (!cancelRequestComment.trim()) {
                    setCancelRequestError(
                      "Please provide a reason for cancellation."
                    );
                    return;
                  }
                  setCancelRequestLoading(true);
                  setTimeout(() => {
                    setCancelRequestLoading(false);
                    setShowCancelRequestPopup(false);
                    setCancelRequestComment("");
                    setCancelRequestError("");
                    // Here you would call your cancel API
                    alert(
                      "Request cancelled with comment: " + cancelRequestComment
                    );
                  }, 1200);
                }}
              >
                {cancelRequestLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Cancelling...</span>
                  </div>
                ) : (
                  "Cancel Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
