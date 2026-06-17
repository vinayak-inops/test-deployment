"use client";

import { useMemo } from "react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import AutoStatusUpdate from "@/components/auto-stutues-update";
import SidebarFromHeader from "@/components/header/sidebar-from-header";
import { Calendar } from "lucide-react";
import { formatDateTime } from "@/utils/time/time-control";
import ActionDataTable, { type ActionTableColumn } from "@/components/common/action-data-table";

interface ApplicationDetailItem {
  _id?: string;
  status?: string;
  uploadedBy?: string;
  createdOn?: string;
  documents?: Array<{
    _id?: string;
    parseID?: string;
    employeeID?: string;
    employeeName?: string;
    designationCode?: string;
  }> | string[] | string;
  employeeID?: string[] | string;
  EmployeeID?: string[] | string;
  data?: {
    status?: string;
    uploadedBy?: string;
    createdOn?: string;
    employeeID?: string[] | string;
    EmployeeID?: string[] | string;
    ["employee id"]?: string[] | string;
    documents?: Array<{
      _id?: string;
      parseID?: string;
      employeeID?: string;
      employeeName?: string;
      designationCode?: string;
    }> | string[] | string;
  };
}

interface ContractEmployeeApproveApplicationDetailProps {
  refId?: string | null;
  permission?: any;
  onBack: () => void;
}

interface EmployeeIdRow {
  employeeID: string;
}

export default function ContractEmployeeApproveApplicationDetail({
  refId,
  permission,
  onBack,
}: ContractEmployeeApproveApplicationDetailProps) {
  const { data: detailResponse, loading } = useRequest<any>({
    url: "masterDataApproval/search",
    method: "POST",
    data: [{ field: "_id", value: refId, operator: "eq" }],
    dependencies: [refId],
    onError: (error: any) => {
      console.error("Error fetching application details:", error);
    },
  });

  const item: ApplicationDetailItem | null = useMemo(() => {
    if (Array.isArray(detailResponse)) return detailResponse[0] || null;
    return null;
  }, [detailResponse]);

  const detailData = item?.data || {};
  const createdOnValue = detailData?.createdOn || item?.createdOn || "";
  const documentsSource =
    Array.isArray(item?.documents)
      ? item.documents
      : Array.isArray(detailData?.documents)
        ? detailData.documents
        : [];

  const documentObjects = documentsSource.filter((doc: any) => doc && typeof doc === "object");
  const employeeIdsFromDocuments = documentObjects
    .map((doc: any) => doc?.employeeID)
    .filter(Boolean);

  const employeeIdSource =
    (employeeIdsFromDocuments.length > 0 ? employeeIdsFromDocuments : undefined) ??
    detailData?.EmployeeID ??
    detailData?.employeeID ??
    detailData?.["employee id"] ??
    item?.EmployeeID ??
    item?.employeeID;
  const employeeIds = Array.isArray(employeeIdSource)
    ? employeeIdSource
    : employeeIdSource
      ? [employeeIdSource]
      : [];
  const employeeRows: EmployeeIdRow[] = employeeIds.map((employeeID) => ({ employeeID: String(employeeID) }));
  const employeeColumns: ActionTableColumn<EmployeeIdRow>[] = [
    {
      key: "sno",
      label: "S.No",
      render: (_row, index) => index + 1,
      headerClassName: "py-2 px-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap",
      cellClassName: "py-2 px-4 text-sm text-gray-900 align-top",
    },
    {
      key: "employeeID",
      label: "Employee ID",
      render: (row) => row.employeeID || "N/A",
      headerClassName: "py-2 px-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap",
      cellClassName: "py-2 px-4 text-sm text-gray-900 align-top",
    },
  ];

  return (
    <div>
      <SidebarFromHeader
        title="Company Employee Approval Details"
        description="View company employee approval information and workflow status"
        showBackButton={true}
        onBack={onBack}
        canAdd={false}
      />

      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-2 pb-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-700">
                {loading ? "Loading..." : "Approval Information"}
              </h3>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold uppercase">
                <Calendar className="w-4 h-4" />
                Employee
              </div>
            </div>

            <div className="px-5 py-2 pb-4 text-sm">
              <div className="flex items-center justify-between border-b border-gray-200 py-2">
                <span className="font-medium text-gray-500">Status</span>
                <span className="font-medium text-gray-900">{detailData?.status || item?.status || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-200 py-2">
                <span className="font-medium text-gray-500">Uploaded By</span>
                <span className="font-medium text-gray-900">{detailData?.uploadedBy || item?.uploadedBy || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-200 py-2">
                <span className="font-medium text-gray-500">Created On</span>
                <span className="font-medium text-gray-900 text-right">{createdOnValue ? formatDateTime(createdOnValue) : "N/A"}</span>
              </div>
            </div>

          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="px-5 py-2 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-700">Selected Employee IDs</h3>
            </div>
            <div className="px-5 py-3">
              <ActionDataTable<EmployeeIdRow>
                rows={employeeRows}
                columns={employeeColumns}
                searchFields={[
                  {
                    value: "employeeID",
                    label: "Employee ID",
                    getValue: (row) => row.employeeID || "",
                  },
                ]}
                defaultSearchField="employeeID"
                isViewMode={true}
                pageSize={10}
                emptyTitle="No employee IDs found."
                emptyDescription="No Employee ID values are available for this application."
              />
            </div>
          </div>
        </div>

        <div className="min-h-[420px] lg:sticky lg:top-4 self-start">
          <AutoStatusUpdate
            fileId={refId || ""}
            setOpen={() => {}}
            permission={permission}
          />
        </div>
      </div>
    </div>
  );
}
