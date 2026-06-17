"use client"

import { useState, useEffect, useMemo } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { Clock, Send, CheckCircle, XCircle, AlertCircle, X } from "lucide-react"
import AutoStatusUpdate from "@/components/auto-stutues-update"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useKeyclockRoleInfo } from "../../../../hooks/search/keyclock-role-info"
import { formatDateTime } from "@/utils/time/time-control"

interface WfhRequest {
  id: string
  employeeID: string
  uploadedBy?: string
  fromDate?: string
  toDate?: string
  fromDuration?: string
  toDuration?: string
  description?: string
  status: "pending" | "approved" | "rejected" | "validated" | "failed"
  workflowState?: string
  organizationCode: string
  tenantCode: string
  comment?: string
  createdOn?: string
  workflowName?: string
  stateEvent?: string
  approverID?: string
}

function mapBackendToWfhRequest(item: any): WfhRequest {
  return {
    id: item._id,
    uploadedBy: item.uploadedBy || "",
    employeeID: item.employeeID || "",
    fromDate: item.fromDate || "",
    toDate: item.toDate || "",
    fromDuration: item.fromDuration || "",
    toDuration: item.toDuration || "",
    description: item.description || "",
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
    workflowState: item.workflowState,
    organizationCode: item.organizationCode || "",
    tenantCode: item.tenantCode || "",
    comment: item.comment || "",
    createdOn: item.createdOn,
    workflowName: item.workflowName,
    stateEvent: item.stateEvent,
    approverID: item.approverID || item.approvedBy || item.rejectedBy || item.cancelledBy || "",
  }
}

export default function WfhRequestsPopup({
  isOpen,
  onClose,
  row,
  userMode = "user",
  onActionSuccess,
  modeOfRequest
}: {
  isOpen: boolean
  onClose: () => void
  row: any
  loading?: boolean
  userMode?: "user" | "approver"
  onActionSuccess?: () => void
  isSelfPermission?: boolean
  isAllPermission?: boolean
  modeOfRequest?: string
}) {
  const [selectedRequest, setSelectedRequest] = useState<WfhRequest | null>(null)
  const [statusAction, setStatusAction] = useState<"cancel" | "reject" | "approve" | null>(null)
  const [statusComment, setStatusComment] = useState("")
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState("")
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()

  const { responseData: rolePermissions } = useRolePermissions({ serviceName: "applicationApplier", screenName: "wfh" })
  const { responseData: roleApprover } = useRolePermissions({ serviceName: "applicationApprover", screenName: "wfh" })
  const canApprove =  (!!rolePermissions?.approve && modeOfRequest === 'applicationApplier') || (!!roleApprover?.approve && modeOfRequest === 'applicationApprover');
  const canReject = (modeOfRequest === 'applicationApplier' &&!!rolePermissions?.reject ) || (!!roleApprover?.reject && modeOfRequest === 'applicationApprover');
  const canCancel = (!!rolePermissions?.cancel && modeOfRequest === 'applicationApplier') || (!!roleApprover?.cancel && modeOfRequest === 'applicationApprover');

  const buildRequestData = useMemo(() => {
    const requestData: any[] = [{ field: "tenantCode", operator: "eq", value: tenantCode }]
    if (row?._id) requestData.push({ field: "_id", operator: "eq", value: row._id })
    return requestData
  }, [tenantCode, row?._id])

  const { data: response, refetch } = useRequest<any>({
    url: "wfhApplication/search",
    method: "POST",
    data: buildRequestData,
  })

  const { post } = usePostRequest<any>({
    url: "wfhApplication",
    onSuccess: () => {
      refetch()
      onActionSuccess?.()
      setStatusLoading(false)
      setStatusAction(null)
      setStatusComment("")
      setStatusError("")
    },
    onError: () => {
      setStatusLoading(false)
      setStatusError("Failed to update status. Please try again.")
    },
  })

  useEffect(() => {
    if (!isOpen) {
      setSelectedRequest(null)
      setStatusAction(null)
      setStatusComment("")
      setStatusError("")
      return
    }
    if (Array.isArray(response) && response.length > 0) setSelectedRequest(mapBackendToWfhRequest(response[0]))
    else if (row) setSelectedRequest(mapBackendToWfhRequest(row))
  }, [isOpen, response, row])

  const getStatusColor = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "approved": return "bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20"
      case "pending":
      case "initiated":
      case "validated": return "bg-[#64B5F6]/10 text-[#64B5F6] border-[#64B5F6]/20"
      case "rejected": return "bg-gray-100 text-gray-600 border-gray-200"
      case "failed": return "bg-red-100 text-red-600 border-red-200"
      default: return "bg-gray-200 text-gray-700 border-gray-200"
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white w-full max-w-5xl h-[85vh] flex flex-col rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-700">WFH Application</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100" aria-label="Close popup"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 flex overflow-hidden bg-gray-50">
          <div className="w-3/5 flex flex-col bg-white border-r border-gray-100">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {selectedRequest ? (
                <div className="max-w-2xl">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-700">Request Details</h3>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border ${getStatusColor(selectedRequest.workflowState)}`}>
                      <span className="uppercase tracking-wide">{selectedRequest.workflowState || "PENDING"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center border-b border-gray-100 pb-2"><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Employee ID</label><span className="text-sm text-gray-900 font-medium">{selectedRequest.employeeID || "-"}</span></div>
                    <div className="flex items-center border-b border-gray-100 pb-2"><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">From Date</label><span className="text-sm text-gray-900 font-medium">{selectedRequest.fromDate || "-"}</span></div>
                    <div className="flex items-center border-b border-gray-100 pb-2"><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">To Date</label><span className="text-sm text-gray-900 font-medium">{selectedRequest.toDate || "-"}</span></div>
                    <div className="flex items-center border-b border-gray-100 pb-2"><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">From Duration</label><span className="text-sm text-gray-900 font-medium">{selectedRequest.fromDuration || "-"}</span></div>
                    <div className="flex items-center border-b border-gray-100 pb-2"><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">To Duration</label><span className="text-sm text-gray-900 font-medium">{selectedRequest.toDuration || "-"}</span></div>
                    <div className="flex items-start border-b border-gray-100 pb-2"><label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Description</label><span className="text-sm text-gray-900 font-medium">{selectedRequest.description || "-"}</span></div>

                    {!['APPROVED', 'REJECTED', 'CANCELLED'].includes(selectedRequest.workflowState?.toUpperCase() || '') && (canApprove || canReject || canCancel) && (
                      <div className="pt-2 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          {canApprove && <button onClick={() => setStatusAction("approve")} className={`p-2 rounded border ${statusAction === "approve" ? "border-green-500 bg-green-50" : "border-gray-200"}`}>Approve</button>}
                          {canReject && <button onClick={() => setStatusAction("reject")} className={`p-2 rounded border ${statusAction === "reject" ? "border-red-500 bg-red-50" : "border-gray-200"}`}>Reject</button>}
                          {canCancel && <button onClick={() => setStatusAction("cancel")} className={`p-2 rounded border ${statusAction === "cancel" ? "border-gray-900 bg-gray-100" : "border-gray-200"}`}>Cancel</button>}
                        </div>
                        {(statusAction === "cancel" || statusAction === "reject") && (
                          <textarea value={statusComment} onChange={(e) => setStatusComment(e.target.value)} placeholder="Please provide a reason for this action..." className="w-full min-h-[80px] rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                        )}
                        {statusError && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle className="h-4 w-4" />{statusError}</div>}
                        {statusAction && (
                          <button
                            className="w-full h-10 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            disabled={statusLoading || ((statusAction === "cancel" || statusAction === "reject") && !statusComment.trim())}
                            onClick={() => {
                              if ((statusAction === "cancel" || statusAction === "reject") && !statusComment.trim()) return setStatusError("Please enter a comment to proceed.")
                              setStatusLoading(true)
                              const stateEvent = statusAction === "approve" ? "NEXT" : statusAction === "reject" ? "REJECT" : "CANCEL"
                              post({
                                tenant: tenantCode,
                                action: "insert",
                                id: selectedRequest.id,
                                event: "wfhApplication",
                                collectionName: "wfhApplication",
                                data: {
                                  ...selectedRequest,
                                  _id: selectedRequest.id,
                                  tenantCode: selectedRequest.tenantCode || tenantCode,
                                  organizationCode: selectedRequest.organizationCode || tenantCode,
                                  workflowName: selectedRequest.workflowName || "wfh Application",
                                  stateEvent,
                                  action: statusAction,
                                  comment: statusComment,
                                  approverID: selectedRequest.approverID || employeeId || "",
                                },
                              })
                            }}
                          >
                            {statusLoading ? "Updating..." : `Submit ${statusAction}`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400"><Send className="h-12 w-12 mb-3 opacity-40" /><p className="text-base font-medium text-gray-500">No Request Selected</p></div>
              )}
            </div>
          </div>

          <div className="w-2/5 flex flex-col bg-gray-50">
            <div className="flex-1 overflow-y-auto">
              {userMode === "approver" && selectedRequest && ["APPROVED", "REJECTED", "CANCELLED"].includes((selectedRequest.workflowState || "").toUpperCase()) ? (
                <div className="flex items-center justify-center h-full px-6 py-4">
                  <div className="text-center">
                    <p className="text-base font-semibold text-gray-700 mb-1">Application {(selectedRequest.workflowState || "").toUpperCase()}</p>
                    <p className="text-sm text-gray-500">This application has been processed and cannot be modified.</p>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-sm px-6 py-4">
                  <AutoStatusUpdate fileId={selectedRequest?.id || ""} setOpen={() => {}} reportData={selectedRequest} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
