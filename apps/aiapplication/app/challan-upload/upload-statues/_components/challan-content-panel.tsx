"use client";

import { Calendar } from "lucide-react";
import ChallanValidationView from "./challan-validation-view";

type ValidationRow = {
  contributionType: string;
  calculated: unknown;
  fromFile: unknown;
  difference: unknown;
  status: string;
  remarks: string;
};

type ValidationBlock = {
  employeeId: string;
  month: string;
  status: string;
  rows: ValidationRow[];
};

type ApiTableData = {
  rows: Record<string, unknown>[];
  columns: string[];
};

type ChallanContentPanelProps = {
  fullPageView: boolean;
  challanDocument: any;
  fileExt: string;
  derivedSalMonth: string | null;
  formattedCreatedOn: string;
  viewLoading: boolean;
  apiViewerError: string | null;
  viewerType: string;
  activeStatusTabs: string[];
  selectedStatusTab: string;
  setSelectedStatusTab: (status: string) => void;
  statusCountMap: Map<string, number>;
  validationSearchFields: Array<{ value: string; label: string }>;
  selectedValidationFieldLabel: string;
  employeeSearchInput: string;
  setEmployeeSearchInput: (value: string) => void;
  hasValidationBlocks: boolean;
  filteredValidationBlocks: ValidationBlock[];
  apiTableData: ApiTableData;
  filteredApiRows: Record<string, unknown>[];
  apiViewerData: unknown;
  normalizeStatus: (value: unknown) => string;
  parseNumber: (value: unknown) => number | null;
  toAmount: (value: unknown) => string;
  formatTableCell: (value: unknown) => string;
};

export default function ChallanContentPanel({
  fullPageView,
  challanDocument,
  fileExt,
  derivedSalMonth,
  formattedCreatedOn,
  viewLoading,
  apiViewerError,
  viewerType,
  activeStatusTabs,
  selectedStatusTab,
  setSelectedStatusTab,
  statusCountMap,
  validationSearchFields,
  selectedValidationFieldLabel,
  employeeSearchInput,
  setEmployeeSearchInput,
  hasValidationBlocks,
  filteredValidationBlocks,
  apiTableData,
  filteredApiRows,
  apiViewerData,
  normalizeStatus,
  parseNumber,
  toAmount,
  formatTableCell,
}: ChallanContentPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-2 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-700">Challan Details</h3>
          </div>
          <div className="px-5 py-2">
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-sm font-medium text-gray-500">File Name</span>
              <span className="text-sm font-medium text-gray-900">{challanDocument?.fileName || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-sm font-medium text-gray-500">File Type</span>
              <span className="text-sm font-medium text-gray-900">{fileExt.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-sm font-medium text-gray-500">Workflow</span>
              <span className="text-sm font-medium text-gray-900">{challanDocument?.workflowName || "N/A"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-5 py-2 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-700">Upload Details</h3>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold uppercase">
              <Calendar className="w-4 h-4" />
              {derivedSalMonth || "This Month"}
            </div>
          </div>
          <div className="px-5 py-2">
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-sm font-medium text-gray-500">Status</span>
              <span className="text-sm font-medium text-gray-900">{challanDocument?.status || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-sm font-medium text-gray-500">Uploaded By</span>
              <span className="text-sm font-medium text-gray-900">{challanDocument?.uploadedBy || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 py-2">
              <span className="text-sm font-medium text-gray-500">Uploaded On</span>
              <span className="text-sm font-medium text-gray-900 text-right">{formattedCreatedOn}</span>
            </div>
            <div className="flex items-start justify-between border-b border-gray-200 py-2">
              <span className="text-sm font-medium text-gray-500">Description</span>
              <span className="text-sm font-medium text-gray-900 text-right max-w-[70%] break-words">
                {challanDocument?.description || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {fullPageView && (
        <ChallanValidationView
          viewLoading={viewLoading}
          apiViewerError={apiViewerError}
          viewerType={viewerType}
          activeStatusTabs={activeStatusTabs}
          selectedStatusTab={selectedStatusTab}
          setSelectedStatusTab={setSelectedStatusTab}
          statusCountMap={statusCountMap}
          validationSearchFields={validationSearchFields}
          selectedValidationFieldLabel={selectedValidationFieldLabel}
          employeeSearchInput={employeeSearchInput}
          setEmployeeSearchInput={setEmployeeSearchInput}
          hasValidationBlocks={hasValidationBlocks}
          filteredValidationBlocks={filteredValidationBlocks}
          apiTableData={apiTableData}
          filteredApiRows={filteredApiRows}
          apiViewerData={apiViewerData}
          normalizeStatus={normalizeStatus}
          parseNumber={parseNumber}
          toAmount={toAmount}
          formatTableCell={formatTableCell}
        />
      )}
    </div>
  );
}
