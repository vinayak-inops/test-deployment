"use client"

import { forwardRef } from "react"
import type { AttendanceDetail } from "./types"
import { getCardColor, formatWorkDuration } from "./calendar-utils"

interface HoverPopupProps {
  attendanceDetail: AttendanceDetail
  cellDate: Date
  isVisible: boolean
  onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => void
  onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => void
}

const HoverPopup = forwardRef<HTMLDivElement, HoverPopupProps>(({
  attendanceDetail,
  cellDate,
  isVisible,
  onMouseEnter,
  onMouseLeave,
}, ref) => {
  const bgColor = getCardColor(attendanceDetail)

  return (
    <div 
      ref={ref}
      data-tooltip
      className={`w-80 bg-white rounded-lg shadow-2xl border-2 border-gray-200 p-3 transition-all duration-200`}
      style={{ 
        maxHeight: '400px', 
        overflowY: 'auto',
        maxWidth: 'min(320px, calc(100vw - 2rem))',
        willChange: 'transform',
        position: 'fixed',
        opacity: '0',
        visibility: 'hidden',
        zIndex: '9999',
        pointerEvents: 'none'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex flex-col gap-2">
        {/* Colored Header Bar */}
        <div className={`h-2 ${bgColor} rounded-t-lg -mx-3 -mt-3 mb-1.5`}></div>
        
        {/* Title with Date on Right */}
        <div className="text-base font-bold text-gray-900 border-b border-gray-200 pb-1.5 flex items-center justify-between">
          <span>Attendance Details</span>
          <span className="text-sm font-semibold text-gray-600">
            {cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        
        {/* Details Grid - Show all required fields with actual values, reduced spacing */}
        <div className="space-y-1 text-sm">
          {/* Shift Code */}
          {attendanceDetail.shiftCode && attendanceDetail.shiftCode.trim() !== '' && (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-gray-500 font-medium text-left">Shift Code:</span>
              <span className="text-gray-900 font-semibold text-right">{attendanceDetail.shiftCode}</span>
            </div>
          )}
          
          {/* Attendance ID */}
          {attendanceDetail.attendanceID && attendanceDetail.attendanceID.trim() !== '' && (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-gray-500 font-medium text-left">Attendance ID:</span>
              <span className="text-gray-900 font-semibold text-right">{attendanceDetail.attendanceID}</span>
            </div>
          )}
          
          {/* Hours Worked */}
          <div className="flex items-center justify-between py-0.5">
            <span className="text-gray-500 font-medium text-left">Hours Worked:</span>
            <span className="text-gray-900 font-semibold text-right">{formatWorkDuration(attendanceDetail.hoursWorked)}</span>
          </div>
          
          {/* Late In - Only show if has value */}
          {attendanceDetail.lateIn !== undefined && attendanceDetail.lateIn !== null && attendanceDetail.lateIn > 0 && (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-gray-500 font-medium text-left">Late In:</span>
              <span className="text-gray-900 font-semibold text-right">{attendanceDetail.lateIn} min</span>
            </div>
          )}
          
          {/* Leave Code - Only show if exists and has value */}
          {attendanceDetail.leaveCode && attendanceDetail.leaveCode.trim() !== '' && (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-gray-500 font-medium text-left">Leave Code:</span>
              <span className="text-gray-900 font-semibold text-right">{attendanceDetail.leaveCode}</span>
            </div>
          )}
          
          {/* Early Out - Only show if has value */}
          {attendanceDetail.earlyOut !== undefined && attendanceDetail.earlyOut !== null && attendanceDetail.earlyOut > 0 && (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-gray-500 font-medium text-left">Early Out:</span>
              <span className="text-gray-900 font-semibold text-right">{attendanceDetail.earlyOut} min</span>
            </div>
          )}
          
          {/* Extra Hours - Only show if has value */}
          {attendanceDetail.extraHours !== undefined && attendanceDetail.extraHours !== null && attendanceDetail.extraHours > 0 && (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-gray-500 font-medium text-left">Extra Hours:</span>
              <span className="text-gray-900 font-semibold text-right">{attendanceDetail.extraHours}h</span>
            </div>
          )}
          
          {/* Shifts Allocated - Only show if exists and has value */}
          {attendanceDetail.shiftsAllocated !== undefined && 
           attendanceDetail.shiftsAllocated !== null && 
           attendanceDetail.shiftsAllocated !== '' && (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-gray-500 font-medium text-left">Shifts Allocated:</span>
              <span className="text-gray-900 font-semibold text-right">{attendanceDetail.shiftsAllocated}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

HoverPopup.displayName = "HoverPopup"

export default HoverPopup

