import React from "react";
import { Clock } from "lucide-react";

export default function ShiftViewModal({ shift, isOpen, onClose }: { shift: any; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8 relative overflow-y-auto max-h-[90vh] border border-gray-200">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {/* PDF-like header */}
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-blue-700 tracking-wide">Shift Details</h2>
            <div className="text-gray-500 text-sm mt-1">Document Preview</div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-400">Shift Code</span>
            <span className="font-mono text-lg font-semibold text-blue-600">{shift.shiftCode}</span>
          </div>
        </div>
        {/* PDF-like body */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Shift Name</div>
              <div className="font-semibold text-gray-800 text-lg">{shift.shiftName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className="font-semibold text-gray-800 text-lg capitalize">{shift.status || "-"}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Clock className="w-4 h-4 text-blue-400" /> Main Shift
              </div>
              <div className="font-mono text-base text-blue-800">{shift.shiftStart} - {shift.shiftEnd}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Duration</div>
              <div className="font-mono text-base">{shift.duration} min</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">Lunch Break</div>
              <div className="font-mono text-base text-blue-800">{shift.lunchStart} - {shift.lunchEnd}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Grace Period</div>
              <div className="font-mono text-base">{shift.graceIn}m in / {shift.graceOut}m out</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Late In Allowed</div>
              <div className="font-mono text-base">{shift.lateInAllowedTime} min</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Early Out Allowed</div>
              <div className="font-mono text-base">{shift.earlyOutAllowedTime} min</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Cross Day</div>
              <div className="font-mono text-base">{shift.crossDay ? "Yes" : "No"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Flexible</div>
              <div className="font-mono text-base">{shift.flexible ? "Yes" : "No"}</div>
            </div>
          </div>
          {/* Half Day & Extra Info */}
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">First Half</div>
              <div className="font-mono text-base text-blue-800">{shift.firstHalfStart} - {shift.firstHalfEnd}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">Second Half</div>
              <div className="font-mono text-base text-blue-800">{shift.secondHalfStart} - {shift.secondHalfEnd}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Flexi Full Day Duration</div>
              <div className="font-mono text-base">{shift.flexiFullDayDuration} min</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Flexi Half Day Duration</div>
              <div className="font-mono text-base">{shift.flexiHalfDayDuration} min</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Min Duration for Full Day</div>
              <div className="font-mono text-base">{shift.minimumDurationForFullDay} min</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Min Duration for Half Day</div>
              <div className="font-mono text-base">{shift.minimumDurationForHalfDay} min</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Min Extra Minutes for Extra Hours</div>
              <div className="font-mono text-base">{shift.minimumExtraMinutesForExtraHours} min</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 