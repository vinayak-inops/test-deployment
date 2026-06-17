"use client";

import type { Dispatch, SetStateAction } from "react";
import AutoStutuesUpdate from "../../_components/auto-stutues-update";
import SSEStatusTimeline from "../../_components/sse-status-timeline";

type ExcelStatusSidebarProps = {
  open: boolean;
  safeFileId: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  workflows: Record<string, any>;
};

export default function ExcelStatusSidebar({
  open,
  safeFileId,
  setOpen,
  workflows,
}: ExcelStatusSidebarProps) {
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
            <AutoStutuesUpdate fileId={safeFileId} setOpen={setOpen} />
          )}
        </div>
      </div>
    </div>
  );
}
