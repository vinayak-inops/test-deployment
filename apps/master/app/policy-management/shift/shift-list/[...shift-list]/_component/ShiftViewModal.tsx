import React from "react";
import { Clock, Calendar, CheckCircle, XCircle, X } from "lucide-react";

function StatusBadge({ value }: { value?: string }) {
  const status = (value || "").toLowerCase();
  const colorClass =
    status === "active"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border ${colorClass}`}>
      {status === "active" ? (
        <CheckCircle className="h-4 w-4 text-blue-600" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-500" />
      )}
      <span className="uppercase tracking-wide">{value || "INACTIVE"}</span>
    </span>
  );
}

export default function ShiftViewModal({ shift, isOpen, onClose }: { shift: any; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !shift) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-3xl h-[75vh] flex flex-col rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-700">Employer Shift Information</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            aria-label="Close popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
          <div className="w-full">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-700">Shift Details</h3>
              <StatusBadge value={shift.status || "inactive"} />
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">

                  Shift Info
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Shift Name</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.shiftName || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Shift Code</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.shiftCode || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Flexible</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.flexible ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Cross Day</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.crossDay ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                
                  Timing
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Main Shift</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.shiftStart || "-"} - {shift.shiftEnd || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Lunch Break</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.lunchStart || "-"} - {shift.lunchEnd || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">First Half</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.firstHalfStart || "-"} - {shift.firstHalfEnd || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Second Half</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.secondHalfStart || "-"} - {shift.secondHalfEnd || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Duration</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.duration || 0} min</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                 
                  Allowances & Rules
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 flex-shrink-0">Grace Period</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.graceIn || 0}m in / {shift.graceOut || 0}m out</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 flex-shrink-0">Late In Allowed</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.lateInAllowedTime || 0} min</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 flex-shrink-0">Early Out Allowed</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.earlyOutAllowedTime || 0} min</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 flex-shrink-0">Flexi Full Day Duration</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.flexiFullDayDuration || 0} min</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 flex-shrink-0">Flexi Half Day Duration</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.flexiHalfDayDuration || 0} min</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 flex-shrink-0">Min Duration for Full Day</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.minimumDurationForFullDay || 0} min</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 flex-shrink-0">Min Duration for Half Day</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.minimumDurationForHalfDay || 0} min</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-48 flex-shrink-0">Min Extra Minutes for Extra Hours</label>
                    <span className="text-sm text-gray-900 font-medium">{shift.minimumExtraMinutesForExtraHours || 0} min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
