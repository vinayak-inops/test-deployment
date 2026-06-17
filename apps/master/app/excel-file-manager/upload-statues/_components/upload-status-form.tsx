"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useWorkflowSSE } from "@repo/ui/hooks/workflow-management/useWorkflowSSE";
import SidebarFromHeader from "@/components/header/sidebar-from-header";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import PageNotFound from "@/components/page-notfound";
import ExcelMainPanel from "./excel-main-panel";
import ExcelStatusSidebar from "./excel-status-sidebar";

export default function UploadStatusForm() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const fileId = searchParams.get("id");
  const { workflows } = useWorkflowSSE();

  useEffect(() => {
    if (fileId) {
      setOpen(true);
    }
  }, [fileId]);

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "excelUpload",
    screenName: "excelFileManager",
  });

  const excelUpload = rolePermissions?.excelUpload || false;

  if (!fileId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No File ID Provided</h2>
          <p className="text-gray-600">Please provide a file ID in the URL query parameters.</p>
        </div>
      </div>
    );
  }

  if (!excelUpload) {
    return <PageNotFound />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden text-sm">
      <div className="flex-shrink-0">
        <SidebarFromHeader
          title="Excel Upload Status"
          description="Review uploaded file data and monitor processing updates."
          canAdd={false}
        />
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="w-full max-w-[1400px] mx-auto flex flex-1 min-h-0 overflow-hidden px-4 py-4 gap-6">
          <ExcelMainPanel setOpen={setOpen} />
          <ExcelStatusSidebar
            open={open}
            safeFileId={fileId}
            setOpen={setOpen}
            workflows={workflows}
          />
        </div>
      </div>
    </div>
  );
}
