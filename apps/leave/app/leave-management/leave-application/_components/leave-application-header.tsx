import { MoreHorizontal, Settings } from "lucide-react";

interface LeaveApplicationHeaderProps {
    title: string;
    description: string;
}

function LeaveApplicationHeader({ title, description }: LeaveApplicationHeaderProps) {
    return (
        <div className=" border-b border-slate-200 px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Leave Applications</h1>
              <p className="text-sm text-slate-500">Manage leave and special leave applications</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4" />
                Manage Plan
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                aria-label="More options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
    )
}

export default LeaveApplicationHeader;