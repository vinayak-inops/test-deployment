"use client";

import { Calendar } from "lucide-react";

type ExcelDocument = {
  fileName?: string;
  status?: string;
  workflowName?: string;
  uploadedBy?: string;
  createdOn?: string;
  description?: string;
};

type ExcelContentPanelProps = {
  excelDocument: ExcelDocument | null;
  fileExt: string;
  formattedCreatedOn: string;
  isFetching: boolean;
  fetchError?: { message?: string } | null;
  onOpenStatus: () => void;
};

const getStatusBadgeClassName = (status: string) => {
  if (status === "Initiated") return "bg-yellow-100 text-yellow-800";
  if (status === "Completed") return "bg-green-100 text-green-800";
  return "bg-blue-100 text-blue-800";
};

export default function ExcelContentPanel({
  excelDocument,
  fileExt,
  formattedCreatedOn,
  isFetching,
  fetchError,
  onOpenStatus,
}: ExcelContentPanelProps) {
  if (isFetching) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
        Loading file data...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        Error loading file: {fetchError.message || "Unknown error"}
      </div>
    );
  }

  if (!excelDocument) {
    return null;
  }

  const status = excelDocument.status || "N/A";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-2 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-700">File Details</h3>
          </div>
          <div className="px-5 py-2">
            <div className="flex items-center justify-between border-b border-gray-200 py-2 gap-4">
              <span className="text-sm font-medium text-gray-500">File Name</span>
              <span className="text-sm font-medium text-gray-900 text-right break-all">
                {excelDocument.fileName || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2 gap-4">
              <span className="text-sm font-medium text-gray-500">File Type</span>
              <span className="text-sm font-medium text-gray-900">
                {(fileExt || "xlsx").toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2 gap-4">
              <span className="text-sm font-medium text-gray-500">Workflow</span>
              <span className="text-sm font-medium text-gray-900 text-right">
                {excelDocument.workflowName || "N/A"}
              </span>
            </div>
            <div className="flex items-start justify-between border-b border-gray-200 py-2 gap-4">
              <span className="text-sm font-medium text-gray-500">Description</span>
              <span className="text-sm font-medium text-gray-900 text-right max-w-[70%] break-words">
                {excelDocument.description || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-2 border-b border-gray-200 flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-gray-700">Upload Details</h3>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold uppercase">
              <Calendar className="w-4 h-4" />
              Excel Upload
            </div>
          </div>
          <div className="px-5 py-2">
            <div className="flex items-center justify-between border-b border-gray-200 py-2 gap-4">
              <span className="text-sm font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClassName(
                    status
                  )}`}
                >
                  {status}
                </span>
                <button
                  type="button"
                  onClick={onOpenStatus}
                  className="px-3 py-1 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  View Status
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2 gap-4">
              <span className="text-sm font-medium text-gray-500">Uploaded By</span>
              <span className="text-sm font-medium text-gray-900 text-right">
                {excelDocument.uploadedBy || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2 gap-4">
              <span className="text-sm font-medium text-gray-500">Uploaded On</span>
              <span className="text-sm font-medium text-gray-900 text-right">
                {formattedCreatedOn}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
