"use client";

import ChallanContentPanel from "./challan-content-panel";

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

type ChallanMainPanelProps = {
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

export default function ChallanMainPanel(props: ChallanMainPanelProps) {
  return (
    <div
      className="scroll-hidden flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden"
      style={{
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <ChallanContentPanel {...props} />
    </div>
  );
}
