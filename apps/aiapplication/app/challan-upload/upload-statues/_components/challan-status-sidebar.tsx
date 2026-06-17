"use client";

import AutoStutuesUpdate from "../../_components/auto-stutues-update";
import SSEStatusTimeline from "../../_components/sse-status-timeline";

type ChallanStatusSidebarProps = {
  open: boolean;
  safeFileId: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  workflows: Record<string, any>;
  rolePermissions: any;
};

export default function ChallanStatusSidebar({
  open,
  safeFileId,
  setOpen,
  workflows,
  rolePermissions,
}: ChallanStatusSidebarProps) {
  if (!open) return null;

  return (
    <div className="w-[360px] flex-shrink-0 flex flex-col min-h-0 overflow-hidden">
      <div
        className="scroll-hidden flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{
          overscrollBehavior: "contain",
          overscrollBehaviorY: "contain",
          overscrollBehaviorX: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="min-h-full rounded-xl border border-gray-200 bg-white overflow-hidden">
          {workflows[safeFileId] ? (
            <SSEStatusTimeline fileId={safeFileId} setOpen={setOpen} sseData={workflows} />
          ) : (
            <AutoStutuesUpdate fileId={safeFileId} setOpen={setOpen} permission={rolePermissions} />
          )}
        </div>
      </div>
    </div>
  );
}
