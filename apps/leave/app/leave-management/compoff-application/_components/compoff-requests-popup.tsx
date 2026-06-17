"use client"

import { useState, useEffect, useMemo } from "react"
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { Clock, Send, CheckCircle, XCircle, AlertCircle, X, Filter, Search as SearchIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import AutoStatusUpdate from "@/components/auto-stutues-update"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useKeyclockRoleInfo } from '../../../../hooks/search/keyclock-role-info'

interface CompOffRequest {
  id: string
  employeeID: string
  uploadedBy: string
  fromDate?: string
  toDate?: string
  fromDuration?: string
  toDuration?: string
  availForDates?: string[]
  leaves?: Array<{
    date: string
    duration: string
    leaveCode: string
  }>
  remarks: string
  status: "pending" | "approved" | "rejected" | "validated" | "failed"
  submittedAt?: Date
  workflowState?: string
  organizationCode: string
  tenantCode: string
  comment?: string
  createdOn?: string
  workflowName?: string
  stateEvent?: string
  isDeleted?: boolean
  tenantId?: string
  approverID?: string
}

interface CompOffRequestsPopupProps {
  isOpen: boolean
  onClose: () => void
  initialSelectedRequest?: CompOffRequest | null
  selectedRequestId?: string | null
  isSelfPermission?: boolean
  isAllPermission?: boolean
  userMode?: 'user' | 'approver'
  sourceCollectionName?: string
  onActionSuccess?: () => void
  modeOfRequest?: string
}

function safeParseDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00Z');
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(dateStr)) {
    return new Date(dateStr + 'Z');
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? undefined : d;
}

function mapBackendToCompOffRequest(item: any): CompOffRequest {
  return {
    id: item._id,
    uploadedBy: item.uploadedBy || item.createdBy || '',
    employeeID: item.employeeID || '',
    fromDate: item.fromDate || '',
    toDate: item.toDate || '',
    fromDuration: item.fromDuration || '',
    toDuration: item.toDuration || '',
    availForDates: item.availForDates || [],
    leaves: item.leaves || [],
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
    workflowState: item.workflowState,
    organizationCode: item.organizationCode || '',
    tenantCode: item.tenantCode || '',
    comment: item.comment || '',
    createdOn: item.createdOn,
    workflowName: item.workflowName,
    stateEvent: item.stateEvent,
    isDeleted: item.isDeleted,
    tenantId: item.tenantId,
    approverID: item.approverID || item.approvedBy || item.rejectedBy || item.cancelledBy || '',
  };
}

export default function CompoffRequestsPopup({ 
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
}: CompOffRequestsPopupProps) {
  const [selectedRequest, setSelectedRequest] = useState<CompOffRequest | null>(initialSelectedRequest || null)
  const [compOffRequests, setCompOffRequests] = useState<CompOffRequest[]>([]);

  const [statusAction, setStatusAction] = useState<'cancel' | 'reject' | 'approve' | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const tenantCode = useGetTenantCode()
  
  // Leaves pagination and filtering state
  const [leavesPage, setLeavesPage] = useState(1);
  const [leavesSearchTerm, setLeavesSearchTerm] = useState('');
  const [leavesSelectedField, setLeavesSelectedField] = useState<'date' | 'leaveCode' | 'duration'>('date');
  const leavesPageSize = 5;
  
  // Comp-off transactions state
  const [compOffTransactions, setCompOffTransactions] = useState<any[]>([]);
  
  const { employeeId } = useKeyclockRoleInfo()

     // Get role permissions for approve/reject/cancel
       const { responseData: rolePermissions } = useRolePermissions({
           serviceName: 'applicationApplier',
           screenName: 'compOff'
       });
       const { responseData: roleApprover } = useRolePermissions({
           serviceName: 'applicationApprover',
           screenName: 'compOff'
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
    setCompOffRequests([]);
    setCompOffTransactions([]);
    setLeavesPage(1);
    setLeavesSearchTerm('');
    setLeavesSelectedField('date');
    setStatusAction(null);
    setStatusComment('');
    setStatusLoading(false);
    setStatusError('');
  };

  useEffect(() => {
    if (!isOpen) {
      resetPopupState();
    }
  }, [isOpen]);

  const collectionName = useMemo(() => {
    if (sourceCollectionName) {
      return sourceCollectionName;
    }

    const workflowState = selectedRequest?.workflowState?.toUpperCase();
    
    if (userMode === 'approver') {
      if (workflowState === 'APPROVED' || workflowState === 'REJECTED' || workflowState === 'CANCELLED') {
        return 'leaveApplicationTransaction';
      }
      return 'leaveApplication';
    }
    
    return 'leaveApplication';
  }, [selectedRequest?.workflowState, userMode, sourceCollectionName]);

  const buildRequestData = useMemo(() => {
    const requestData: any[] = [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ];
    
    if (selectedRequestId) {
      requestData.push({
        field: "_id",
        operator: "eq",
        value: selectedRequestId
      });
      return requestData;
    }
    
    return requestData;
  }, [tenantCode, selectedRequestId]);

  // Filtered and paginated leaves
  const filteredLeaves = useMemo(() => {
    if (!selectedRequest?.leaves) return [];
    
    return selectedRequest.leaves.filter(leave => {
      if (!leavesSearchTerm) return true;
      
      const searchLower = leavesSearchTerm.toLowerCase();
      switch (leavesSelectedField) {
        case 'date':
          return leave.date?.toLowerCase().includes(searchLower);
        case 'leaveCode':
          return leave.leaveCode?.toLowerCase().includes(searchLower);
        case 'duration':
          return leave.duration?.toLowerCase().includes(searchLower);
        default:
          return true;
      }
    });
  }, [selectedRequest?.leaves, leavesSearchTerm, leavesSelectedField]);

  const paginatedLeaves = useMemo(() => {
    const startIdx = (leavesPage - 1) * leavesPageSize;
    const endIdx = startIdx + leavesPageSize;
    return filteredLeaves.slice(startIdx, endIdx);
  }, [filteredLeaves, leavesPage, leavesPageSize]);

  // Reset leaves pagination when selectedRequest changes
  useEffect(() => {
    setLeavesPage(1);
    setLeavesSearchTerm('');
  }, [selectedRequest?.id]);

  const {
    data: attendanceResponse,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: `${collectionName}/search`,
    method: 'POST',
    data: buildRequestData,
    onSuccess: (data) => {
      // handled in useEffect
    },
    onError: (error) => {
      console.error("Error fetching comp off data:", error);
    },
  });

  const {
    post: postCompOff,
  } = usePostRequest<any>({
    url: collectionName,
    onSuccess: (data) => {
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

  // Fetch comp-off transactions for selected dates
  const {
    loading: isLoadingTransactions,
    refetch: fetchCompOffTransactions
  } = useRequest<any>({
    url: `muster/compOffTransaction/search`,
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "employeeID",
        operator: "eq",
        value: selectedRequest?.employeeID
      },
      {
        field: "date",
        operator: "in",
        value: selectedRequest?.availForDates || []
      }
    ],
    onSuccess: (data) => {
      const rawData = Array.isArray(data) ? data : (data?.data || [])
      
      if (Array.isArray(rawData) && rawData.length > 0) {
        const transactions = rawData
          .sort((a: any, b: any) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          )
        setCompOffTransactions(transactions)
      } else {
        setCompOffTransactions([])
      }
    },
    onError: (error) => {
      console.error("Error fetching comp off transactions:", error);
      setCompOffTransactions([])
    },
  });

  useEffect(() => {
    fetchAttendance();
  }, [selectedRequestId]);

  useEffect(() => {
    if (selectedRequest?.employeeID && selectedRequest?.availForDates && selectedRequest.availForDates.length > 0) {
      fetchCompOffTransactions();
    } else {
      setCompOffTransactions([]);
    }
  }, [selectedRequest?.employeeID, selectedRequest?.availForDates?.length]);

  useEffect(() => {
    if (attendanceResponse && Array.isArray(attendanceResponse)) {
      const mappedRequests = attendanceResponse.map(mapBackendToCompOffRequest);
      setCompOffRequests(mappedRequests);

      if (selectedRequestId) {
        const foundRequest = mappedRequests.find(req => req.id === selectedRequestId);
        if (foundRequest) {
          setSelectedRequest(foundRequest);
        }
      } else if (initialSelectedRequest) {
        setSelectedRequest(initialSelectedRequest);
      }
    }
  }, [attendanceResponse, selectedRequestId, initialSelectedRequest])

  useEffect(() => {
    if (selectedRequestId && compOffRequests.length > 0) {
      const foundRequest = compOffRequests.find(req => req.id === selectedRequestId);
      if (foundRequest) {
        setSelectedRequest(foundRequest);
      }
    }
  }, [selectedRequestId, compOffRequests])

  useEffect(() => {
    setSelectedRequest(initialSelectedRequest || null)
  }, [initialSelectedRequest])

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

  if (!isOpen) return null

  return (
    <>
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white w-full max-w-5xl h-[85vh] flex flex-col rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-700">Comp Off Application</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
            <X className="h-4 w-4" />
              </button>
            </div>

        <div className="flex-1 flex overflow-hidden bg-gray-50">
          <div className="w-3/5 flex flex-col bg-white border-r border-gray-100">
            <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
                  {selectedRequest ? (
                <div className="max-w-2xl">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-700">Request Details</h3>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border ${getStatusColor(selectedRequest.workflowState)}`}>
                      {getStatusIcon(selectedRequest.workflowState)}
                      <span className="uppercase tracking-wide">{selectedRequest.workflowState || 'PENDING'}</span>
                          </div>
                        </div>

                        {(() => {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center border-b border-gray-100 pb-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Employee ID</label>
                                <span className="text-sm text-gray-900 font-medium">{selectedRequest.employeeID || '-'}</span>
                              </div>

                              {selectedRequest.uploadedBy && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Applied By</label>
                                  <span className="text-sm text-gray-900 font-medium">{selectedRequest.uploadedBy}</span>
                                </div>
                              )}

                              {selectedRequest.fromDate && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">From Date</label>
                                  <span className="text-sm text-gray-900 font-medium">{formatDDMMYYYY(selectedRequest.fromDate)}</span>
                                </div>
                              )}

                              {selectedRequest.toDate && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">To Date</label>
                                  <span className="text-sm text-gray-900 font-medium">{formatDDMMYYYY(selectedRequest.toDate)}</span>
                                </div>
                              )}

                              {selectedRequest.fromDuration && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">From Duration</label>
                                  <span className="text-sm text-gray-900 font-medium">{selectedRequest.fromDuration}</span>
                                </div>
                              )}

                              {selectedRequest.toDuration && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">To Duration</label>
                                  <span className="text-sm text-gray-900 font-medium">{selectedRequest.toDuration}</span>
                                </div>
                              )}

                              {selectedRequest.availForDates && selectedRequest.availForDates.length > 0 && (
                                <div className="flex items-start border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0 pt-1">Available Dates</label>
                                  <div className="flex-1 space-y-1">
                                    {selectedRequest.availForDates.map((date, idx) => (
                                      <div key={idx} className="text-sm text-gray-900 font-medium">
                                        {formatDDMMYYYY(date)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Comp-Off Transaction Details Table */}
                              {selectedRequest.availForDates && selectedRequest.availForDates.length > 0 && compOffTransactions.length > 0 && (
                                <div className="border-b border-gray-100 pb-2">
                                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Comp-Off Transaction Details</label>
                                  <div className="rounded-md border overflow-hidden">
                                    <table className="w-full text-sm">
                                      <thead className="bg-gray-50 border-b">
                                        <tr>
                                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Date</th>
                                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">availed</th>
                                          <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Expires On</th>
                                          <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Comp-Off</th>
                                          <th className="text-center px-3 py-2 text-xs font-semibold text-gray-600">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {compOffTransactions.map((tx: any, idx: number) => {
                                          const isExpired = new Date(tx.expireOn) < new Date()
                                          const isExpiringSoon = !isExpired && new Date(tx.expireOn) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                          
                                          return (
                                            <tr key={tx._id || idx} className="hover:bg-gray-50">
                                              <td className="px-3 py-2 text-gray-900 font-medium text-xs">{formatDDMMYYYY(tx.date)}</td>
                                              <td className="px-3 py-2 text-gray-600 text-xs">{tx.availedCompOff ? formatDDMMYYYY(tx.availedCompOff) : '-'}</td>
                                              <td className="px-3 py-2 text-gray-600 text-xs">{formatDDMMYYYY(tx.expireOn)}</td>
                                              <td className="px-3 py-2 text-right text-gray-900 font-semibold text-xs">{tx.calculatedCompOff}</td>
                                              <td className="px-3 py-2 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                  isExpired 
                                                    ? 'bg-red-100 text-red-700 border border-red-200' 
                                                    : isExpiringSoon 
                                                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                                      : 'bg-green-100 text-green-700 border border-green-200'
                                                }`}>
                                                  {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Valid'}
                                                </span>
                                              </td>
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                      <tfoot className="bg-gray-50 border-t">
                                        <tr>
                                          <td colSpan={3} className="px-3 py-2 text-xs font-semibold text-gray-700 text-right">
                                            Total Comp-Off:
                                          </td>
                                          <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                                            {compOffTransactions.reduce((sum: number, tx: any) => sum + (tx.calculatedCompOff || 0), 0)}
                                          </td>
                                          <td></td>
                                        </tr>
                                      </tfoot>
                                    </table>
                                    {isLoadingTransactions && (
                                      <div className="px-3 py-2 text-center text-xs text-gray-500 bg-blue-50 border-t">
                                        <Clock className="h-3 w-3 inline animate-spin mr-1" />
                                        Loading transaction details...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {Array.isArray(selectedRequest.leaves) && selectedRequest.leaves.length > 0 && (
                                <div className="border-b border-gray-100 pb-2">
                                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Leaves</label>
                                  
                                  {/* Filter + Search for leaves */}
                                  {selectedRequest.leaves.length > 5 && (
                                    <div className="mb-2">
                                      <div className="flex bg-muted/50 rounded-lg border">
                                        {/* Field Selection */}
                                        <div className="flex items-center bg-background border-r rounded-l-lg px-2 py-1.5 w-32">
                                          <Filter className="w-3 h-3 text-muted-foreground mr-1.5" />
                                          <Select
                                            value={leavesSelectedField}
                                            onValueChange={(val: 'date' | 'leaveCode' | 'duration') => setLeavesSelectedField(val)}
                                          >
                                            <SelectTrigger className="w-full h-5 border-none p-0 text-xs font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="date" className="text-xs">Date</SelectItem>
                                              <SelectItem value="leaveCode" className="text-xs">Leave Code</SelectItem>
                                              <SelectItem value="duration" className="text-xs">Duration</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {/* Search Field */}
                                        <div className="flex-1 flex items-center bg-background rounded-r-lg">
                                          <div className="relative flex-1">
                                            <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                            <Input
                                              type="text"
                                              placeholder={`Search by ${leavesSelectedField}...`}
                                              value={leavesSearchTerm}
                                              onChange={(e) => setLeavesSearchTerm(e.target.value)}
                                              className="pl-7 pr-2 py-1 h-8 border-none rounded-none text-xs focus:ring-0 focus:outline-none bg-transparent"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="rounded-md border">
                                    <div className="grid grid-cols-3 text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-2 border-b">
                                      <div>Date</div>
                                      <div>Leave Code</div>
                                      <div>Duration</div>
                                    </div>
                                    {paginatedLeaves.map((l, idx) => (
                                      <div key={idx} className="grid grid-cols-3 text-sm px-3 py-2 border-b last:border-b-0">
                                        <div>{formatDDMMYYYY(l.date)}</div>
                                        <div>{l.leaveCode}</div>
                                        <div>{l.duration}</div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Pagination */}
                                  {filteredLeaves.length > leavesPageSize && (
                                    <div className="flex items-center justify-between px-2 py-2 border-t bg-slate-50 mt-2">
                                      <p className="text-[11px] text-gray-500">
                                        Showing{' '}
                                        <span className="font-semibold">
                                          {Math.min((leavesPage - 1) * leavesPageSize + 1, filteredLeaves.length)}-
                                          {Math.min(leavesPage * leavesPageSize, filteredLeaves.length)}
                                        </span>{' '}
                                        of <span className="font-semibold">{filteredLeaves.length}</span>
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-6 px-2 text-[11px]"
                                          disabled={leavesPage === 1}
                                          onClick={() => setLeavesPage((p) => Math.max(1, p - 1))}
                                        >
                                          Prev
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-6 px-2 text-[11px]"
                                          disabled={leavesPage * leavesPageSize >= filteredLeaves.length}
                                          onClick={() =>
                                            setLeavesPage((p) =>
                                              p * leavesPageSize >= filteredLeaves.length ? p : p + 1
                                            )
                                          }
                                        >
                                          Next
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {selectedRequest.remarks && (
                                <div className="flex items-center border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Remarks</label>
                                  <span className="text-sm text-gray-900 font-medium">{selectedRequest.remarks}</span>
                                </div>
                              )}

                              {selectedRequest.comment && (
                                <div className="flex items-start border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0 pt-1">Comment</label>
                                  <span className="text-sm text-gray-900 font-medium flex-1">{selectedRequest.comment}</span>
                                </div>
                              )}

                              {!['APPROVED', 'REJECTED', 'CANCELLED'].includes(selectedRequest.workflowState?.toUpperCase() || '') && (canApprove || canReject || canCancel) && (
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
                onClick={() => {
                  if ((statusAction === 'approve' && !canApprove) || (statusAction === 'reject' && !canReject) || (statusAction === 'cancel' && !canCancel)) {
                    setStatusError('You do not have permission for this action.');
                    return;
                  }
                  if ((statusAction === 'cancel' || statusAction === 'reject') && !statusComment.trim()) {
                    setStatusError('Please enter a comment to proceed.');
                    return;
                  }
                                        
                  setStatusLoading(true);
                    
                    let stateEvent = "CANCEL";
                    if (statusAction === 'reject') {
                      stateEvent = "REJECT";
                    } else if (statusAction === 'approve') {
                      stateEvent = "NEXT";
                    } else if (statusAction === 'cancel') {
                      stateEvent = "CANCEL";
                    }

                    const pad = (n: number) => n < 10 ? `0${n}` : n;
                    const now = new Date();
                    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
                    
                    const yyyy = istTime.getFullYear();
                    const mm = pad(istTime.getMonth() + 1);
                    const dd = pad(istTime.getDate());
                    const hh = pad(istTime.getHours());
                    const min = pad(istTime.getMinutes());
                    const ss = pad(istTime.getSeconds());
                    const ms = pad(istTime.getMilliseconds());
                    
                    const createdOn = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+05:30`;
                    let uploadedBy = 'user';

                    const data: any = {
                      _id: selectedRequest?.id,
                      tenantCode: selectedRequest?.tenantCode || tenantCode,
                      workflowName: selectedRequest?.workflowName || "compOff Application",
                      stateEvent: stateEvent,
                      organizationCode: selectedRequest?.organizationCode || tenantCode,
                      isDeleted: selectedRequest?.isDeleted || false,
                      employeeID: selectedRequest?.employeeID,
                      fromDate: selectedRequest?.fromDate,
                      toDate: selectedRequest?.toDate,
                      fromDuration: selectedRequest?.fromDuration,
                      toDuration: selectedRequest?.toDuration,
                      availForDates: selectedRequest?.availForDates,
                      uploadedBy: selectedRequest?.uploadedBy || uploadedBy,
                      createdOn: selectedRequest?.createdOn || createdOn,
                      workflowState: selectedRequest?.workflowState,
                      remarks: selectedRequest?.remarks,
                      action: statusAction,
                      comment: statusComment,
                      leaves: selectedRequest?.leaves,
                      approverID: selectedRequest?.approverID || employeeId || '',
                    }
                    
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

                    postCompOff(backendData);
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
                        <Send className="h-12 w-12 mb-3 opacity-40" />
                        <p className="text-base font-medium text-gray-500">No Request Selected</p>
                        <p className="text-sm text-gray-400 mt-1">Select a request to view details</p>
                      </div>
                    )}
                  </div>
                </div>

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
    </>
  )
}

