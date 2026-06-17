"use client"
import React, { useEffect, useState } from 'react'
import { Send } from "lucide-react"
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { useGetTenantCode } from '@/hooks/useGetTenantCode'

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
  attendanceDate?: string
  punchedTime?: string
  transactionTime?: string
}

interface RequestForPunchesProps {
  handleRequestClick: any
  formatDate: (date: Date) => string
  getTimeAgo: (date: Date) => string
  formatTime: (date: Date) => string
  showAllDialog: boolean
  setShowAllDialog: (open: boolean) => void
  setIsDialogOpen: (open: boolean) => void
  setSelectedRequestForPopup: any
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
    attendanceDate: item.attendanceDate,
    punchedTime: item.punchedTime,
    transactionTime: item.transactionTime,
  };
}

const getCookie = (name: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      const value = cookie.substring(name.length + 1);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return undefined;
};

function RequestForPunches({
  handleRequestClick,
  formatDate,
  getTimeAgo,
  formatTime,
  showAllDialog,
  setShowAllDialog,
  setIsDialogOpen,
  setSelectedRequestForPopup,
}: RequestForPunchesProps) {
  const [punchRequests, setPunchRequests] = useState<PunchRequest[]>([]);
  const  tenantCode  = useGetTenantCode();
  const userRole = React.useMemo(() => {
    const raw = getCookie("userRole");
    if (!raw) return {} as any;
    try {
      return JSON.parse(raw);
    } catch {
      try {
        return JSON.parse(decodeURIComponent(raw));
      } catch {
        return {} as any;
      }
    }
  }, []);

  const postBody = React.useMemo(() => {
    if ((userRole as any).role === "user") {
      return [
        {
          field: "employeeID",
          operator: "eq",
          value: (userRole as any).employeeID,
        },
        {
          field: "tenantCode",
          operator: "eq",
          value: tenantCode,
        },
      ];
    }
    return [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode,
      },
    ];
  }, [userRole,tenantCode]);

  const {
    data: attendanceResponse,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: 'forgotPunchApplication/search',
    method: 'POST',
    data: postBody,
    onSuccess: (data) => {
      // handled in useEffect
    },
    onError: (error) => {
      console.error("Error fetching attendance data:", error);
    },
    dependencies: []
  });

  useEffect(() => {
    fetchAttendance();
  }, [postBody]);

  
  useEffect(() => {
    if (attendanceResponse && Array.isArray(attendanceResponse)) {
      setPunchRequests(attendanceResponse.map(mapBackendToPunchRequest));
    }
  }, [attendanceResponse]);


  return (  
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6  shadow-xl border border-blue-100/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Request for Punches</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAllDialog(true)}
            className="text-sm text-[#007AFF] font-medium hover:text-[#007AFF]/80"
          >
            See All
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {isLoading ? (
          <div className="text-center py-8 text-blue-400">Loading...</div>
        ) : attendanceError ? (
          <div className="text-center py-8 text-red-400">Error loading punch requests</div>
        ) : punchRequests.length === 0 ? (
          <div className="text-center py-8 text-blue-400">
            <Send className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No punch requests submitted</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide">
            {[...punchRequests].reverse().slice(0, 3).map((request) => (
              <div
                key={request.id}
                onClick={() => {
                  handleRequestClick(request);
                }}
                className="group flex items-center justify-between py-4 border-b border-blue-100/50 last:border-b-0 cursor-pointer hover:bg-blue-50/50 transition-colors rounded-lg px-2"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl border-2 border-[#007AFF]/20 bg-[#E3F2FD] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <Send className="h-5 w-5 text-[#007AFF]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900"> {request.employeeID}</p>
                    <p className="text-sm text-blue-600">
                      {request.attendanceDate ? 
                        new Date(request.attendanceDate).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        }) : ''
                      }
                      {request.punchedTime && (
                        <span className="ml-2">
                          {new Date(request.punchedTime + '+05:30').toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{request.reason.slice(0, 15)}...</p>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {(() => {
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
                      })()}
                    </p>
                    <div className="flex items-center justify-end mt-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          request.workflowState?.toLowerCase() === "approved"
                            ? "bg-[#007AFF]/10 text-[#007AFF]"
                            : request.workflowState?.toLowerCase() === "pending" || request.workflowState?.toLowerCase() === "initiated" || request.workflowState?.toLowerCase() === "validated"
                              ? "bg-[#64B5F6]/10 text-[#64B5F6]"
                              : request.workflowState?.toLowerCase() === "rejected"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {request.workflowState}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RequestForPunches