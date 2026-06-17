"use client"
import React, { useEffect, useState } from 'react'
import { Send } from "lucide-react"
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

interface ShiftChangeRequest {
  id: string
  employeeID: string
  uploadedBy: string
  fromDate: string
  toDate: string
  shiftGroupCode: string
  shift: {
    shiftCode: string
    shiftName: string
    shiftStart: string
    shiftEnd: string
    firstHalfStart: string
    firstHalfEnd: string
    secondHalfStart: string
    secondHalfEnd: string
    lunchStart: string
    lunchEnd: string
    duration: number
    crossDay: boolean
    flexible: boolean
    flexiFullDayDuration: number
    flexiHalfDayDuration: number
    minimumDurationForFullDay: number
    minimumDurationForHalfDay: number
  }
  remarks: string
  status: "pending" | "approved" | "rejected" | "validated"
  submittedAt?: Date
  uploadTime?: string
  workflowState?: string
  appliedDate?: string
  isAutomatic: boolean
  organizationCode: string
  tenantCode: string
}

interface RequestForShiftsProps {
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

function mapBackendToShiftChangeRequest(item: any): ShiftChangeRequest {
  return {
    id: item._id,
    uploadedBy: item.uploadedBy || '',
    employeeID: item.employeeID || '',
    fromDate: item.fromDate || '',
    toDate: item.toDate || '',
    shiftGroupCode: item.shiftGroupCode || '',
    shift: item.shift || {
      shiftCode: '',
      shiftName: '',
      shiftStart: '',
      shiftEnd: '',
      firstHalfStart: '',
      firstHalfEnd: '',
      secondHalfStart: '',
      secondHalfEnd: '',
      lunchStart: '',
      lunchEnd: '',
      duration: 0,
      crossDay: false,
      flexible: false,
      flexiFullDayDuration: 0,
      flexiHalfDayDuration: 0,
      minimumDurationForFullDay: 0,
      minimumDurationForHalfDay: 0
    },
    remarks: item.remarks || item.Remarks || "",
    status:
      item.workflowState?.toLowerCase() === "approved"
        ? "approved"
        : item.workflowState?.toLowerCase() === "rejected"
        ? "rejected"
        : item.workflowState?.toLowerCase() === "validated"
        ? "validated"
        : "pending",
    submittedAt: safeParseDate(item.createdOn),
    uploadTime: item.uploadTime,
    workflowState: item.workflowState,
    appliedDate: item.appliedDate,
    isAutomatic: item.isAutomatic || false,
    organizationCode: item.organizationCode || '',
    tenantCode: item.tenantCode || ''
  };
}

function RequestForShifts({
  handleRequestClick,
  formatDate,
  getTimeAgo,
  formatTime,
  showAllDialog,
  setShowAllDialog,
  setIsDialogOpen,
  setSelectedRequestForPopup,
}: RequestForShiftsProps) {
  const tenantCode = useGetTenantCode()
  const [shiftChangeRequests, setShiftChangeRequests] = useState<ShiftChangeRequest[]>([]);

  const {
    data: attendanceResponse,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: 'shiftChangeApplication/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ],
    onSuccess: (data) => {
      // handled in useEffect
    },
    onError: (error) => {
      console.error("Error fetching shift change data:", error);
    },
    dependencies: []
  });

  useEffect(() => {
    fetchAttendance();
  }, []);

  
  useEffect(() => {
    if (attendanceResponse && Array.isArray(attendanceResponse)) {
      setShiftChangeRequests(attendanceResponse.map(mapBackendToShiftChangeRequest));
    }
  }, [attendanceResponse]);

  return (  
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6  shadow-xl border border-blue-100/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Request for Shifts</h2>
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
          <div className="text-center py-8 text-red-400">Error loading shift change requests</div>
        ) : shiftChangeRequests.length === 0 ? (
          <div className="text-center py-8 text-blue-400">
            <Send className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No shift change requests submitted</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-hide">
            {[...shiftChangeRequests].reverse().slice(0, 3).map((request) => (
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
                    <p className="font-medium text-gray-900">{request.uploadedBy}</p>
                    <p className="text-sm text-blue-600">
                      {request.shiftGroupCode && request.shift?.shiftName && (
                        <span className="text-xs text-gray-500 mt-1">
                          {`${request.shiftGroupCode} - ${request.shift.shiftName}`}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{request.remarks.slice(0, 35)}...</p>
                  </div>
                </div>
                <div className="text-right flex items-center space-x-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {(() => {
                        if (!request.uploadTime) return '';
                        
                        const uploadDate = new Date(request.uploadTime + '+05:30');
                        const appliedDate = request.appliedDate ? new Date(request.appliedDate) : null;
                        
                        // Check if upload date is same as applied date
                        const isSameDate = appliedDate && 
                          uploadDate.getDate() === appliedDate.getDate() &&
                          uploadDate.getMonth() === appliedDate.getMonth() &&
                          uploadDate.getFullYear() === appliedDate.getFullYear();
                        
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

export default RequestForShifts