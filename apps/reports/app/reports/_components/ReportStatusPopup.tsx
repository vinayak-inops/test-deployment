"use client";

import React from "react";
import { X, CheckCircle, Clock, XCircle } from "lucide-react";
import AutoStatusUpdate from "./auto-stutues-update";

interface ReportStatusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  report?: any;
}

const getStatusColor = (status: string | undefined) => {
  switch (status?.toLowerCase()) {
    case "approved":
    case "completed":
    case "success":
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
    case "completed":
    case "success":
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

export default function ReportStatusPopup({
  isOpen,
  onClose,
  report,
}: ReportStatusPopupProps) {
  if (!isOpen || !report) return null;

  const createdOn =
    report.createdOn || report.createdAt || report.date || report.generatedOn;

  const formatDateTime = (value: string | undefined) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const extension = (report.extension || "").toString().toUpperCase() || "PDF";
  
  const workflowState = report.workflowState || report.status || "PENDING";

  return (
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
            {report.reportTitle || report.reportName || report.fileName || "Report Details"}
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
          {/* Left Side - Report Details */}
          <div className="w-3/5 flex flex-col bg-white border-r border-gray-100">
            <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
              <div className="max-w-2xl">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-700">Report Details</h3>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border ${getStatusColor(workflowState)}`}>
                    {getStatusIcon(workflowState)}
                    <span className="uppercase tracking-wide">{workflowState}</span>
                  </div>
                </div>

                {/* Report Details */}
                <div className="space-y-2">
                  {/* Report Name */}
                  <div className="flex items-center border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Report Name</label>
                    <span className="text-sm text-gray-900 font-medium">{report.reportName || report.fileName || report.reportTitle || "-"}</span>
                  </div>

                  {/* Workflow */}
                  {(report.workflowName || report.workflow) && (
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Workflow</label>
                      <span className="text-sm text-gray-900 font-medium">{report.workflowName || report.workflow}</span>
                    </div>
                  )}

                  {/* Report Type */}
                  {report.reportType && (
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Report Type</label>
                      <span className="text-sm text-gray-900 font-medium">{report.reportType}</span>
                    </div>
                  )}

                  {/* Generated On */}
                  {createdOn && (
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Generated On</label>
                      <span className="text-sm text-gray-900 font-medium">{formatDateTime(createdOn)}</span>
                    </div>
                  )}

                  {/* Extension */}
                  <div className="flex items-center border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Extension</label>
                    <span className="text-sm text-gray-900 font-medium">{extension}</span>
                  </div>

                  {/* Tenant / Organization */}
                  {(report.tenantId || report.tenantCode) && (
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Tenant / Org</label>
                      <span className="text-sm text-gray-900 font-medium">{report.tenantId || report.tenantCode}</span>
                    </div>
                  )}

                  {/* Generated By */}
                  {(report.uploadedBy || report.createdBy) && (
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Generated By</label>
                      <span className="text-sm text-gray-900 font-medium">{report.uploadedBy || report.createdBy || "System"}</span>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Status</label>
                    <span className="text-sm text-gray-900 font-medium">{report.status || workflowState || "-"}</span>
                  </div>

                  {/* Report ID */}
                  {/* {report._id && (
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Report ID</label>
                      <span className="text-sm text-gray-900 font-medium break-all">{report._id}</span>
                    </div>
                  )} */}

                  {/* File Path */}
                  {(report.reportPath || report.filePath || report.path || report.documentPath) && (
                    <div className="flex items-start border-b border-gray-100 pb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0 pt-1">File Path</label>
                      <span className="text-sm text-gray-900 font-medium flex-1 break-all">
                        {report.reportPath || report.filePath || report.path || report.documentPath}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Auto Status Update Panel */}
          <div className="w-2/5 flex flex-col bg-gray-50">
            <div className="flex-1 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
              <div className="w-full max-w-sm px-6 py-4">
                <AutoStatusUpdate
                  fileId={report._id || report.fileId || ""}
                  setOpen={() => {}}
                  extension={extension.toLowerCase()}
                  reportData={report}
                  permission={{ downloadReports: true }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
