"use client";

import TableEditManager from "./table-edit-manager";

type ExcelMainPanelProps = {
  setOpen: (open: boolean) => void;
};

export default function ExcelMainPanel({ setOpen }: ExcelMainPanelProps) {
  return (
    <div
      className="scroll-hidden flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden"
      style={{
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <TableEditManager paramsValue="upload-statues" setOpen={setOpen} />
    </div>
  );
}
