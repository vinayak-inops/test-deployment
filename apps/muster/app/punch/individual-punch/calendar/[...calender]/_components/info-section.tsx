"use client"

import { useRef, useEffect } from "react"
import { Calendar, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import type { AttendanceDetail } from "./types"

interface InfoSectionProps {
  selectedDate: Date | null
  attendanceDetail: AttendanceDetail | null
  isInfoExpanded: boolean
  setIsInfoExpanded: (expanded: boolean) => void
  hasContentOverflow: boolean
  setHasContentOverflow: (overflow: boolean) => void
  showSplitView: boolean
  attendanceDataFromAPI: any
}

export default function InfoSection({
  selectedDate,
  attendanceDetail,
  isInfoExpanded,
  setIsInfoExpanded,
  hasContentOverflow,
  setHasContentOverflow,
  showSplitView,
  attendanceDataFromAPI,
}: InfoSectionProps) {
  const infoContentRef = useRef<HTMLDivElement>(null)

  // Check if content overflows when selected date or expanded state changes
  useEffect(() => {
    // Use setTimeout to ensure DOM has rendered
    const checkOverflow = () => {
      if (infoContentRef.current && selectedDate && !isInfoExpanded) {
        const container = infoContentRef.current
        // Add a small threshold (2px) to account for rounding differences
        const hasOverflow = container.scrollHeight > container.clientHeight + 2
        setHasContentOverflow(hasOverflow)
      } else {
        setHasContentOverflow(false)
      }
    }
    
    const timeoutId = setTimeout(checkOverflow, 0)
    
    // Also check on window resize
    window.addEventListener('resize', checkOverflow)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkOverflow)
    }
  }, [selectedDate, isInfoExpanded, attendanceDataFromAPI, showSplitView, setHasContentOverflow])

  if (!selectedDate) return null

  return (
    <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200/60 overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-white">
        <h4 className="text-sm font-semibold text-gray-900">Attendance Information</h4>
      </div>

      {/* Content Area - Scrollable when expanded, fixed height when collapsed to match calendar */}
      <div 
        ref={infoContentRef}
        className={`${isInfoExpanded ? 'flex-1 overflow-y-auto' : 'flex-1 overflow-hidden relative'} bg-gray-50 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400`}
      >
        {attendanceDetail ? (
          <div className="px-4 py-3">
            {/* Attendance Information Section - Two Column Layout */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {/* Column 1 */}
              <div className="space-y-2">
                {/* Work Order Number */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Work Order Number</label>
                  <span className="text-sm text-gray-900 font-medium">{attendanceDetail.workOrderNumber || '-'}</span>
                </div>

                {/* Shifts Allocated */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Shifts Allocated</label>
                  <span className="text-sm text-gray-900 font-medium">{attendanceDetail.shiftsAllocated || '-'}</span>
                </div>

                {/* Shift Code */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Shift Code</label>
                  <span className="text-sm text-gray-900 font-medium">{attendanceDetail.shiftCode || '-'}</span>
                </div>

                {/* Extra ManShift */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Extra ManShift</label>
                  <span className="text-sm text-gray-900 font-medium">{(attendanceDetail as any)?.extraManShift || '-'}</span>
                </div>

                {/* Attendance ID */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Attendance ID</label>
                  <span className="text-sm text-gray-900 font-medium">{attendanceDetail.attendanceID || '-'}</span>
                </div>

                {/* Hours Worked */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Hours Worked</label>
                  <span className="text-sm text-gray-900 font-medium">
                    {attendanceDetail.hoursWorked 
                      ? `${Math.floor(attendanceDetail.hoursWorked / 60)}:${(attendanceDetail.hoursWorked % 60).toString().padStart(2, '0')}`
                      : '00:00'}
                  </span>
                </div>

                {/* Late In */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Late In</label>
                  <span className="text-sm text-gray-900 font-medium">
                    {attendanceDetail.lateIn 
                      ? `${Math.floor(attendanceDetail.lateIn / 60)}:${(attendanceDetail.lateIn % 60).toString().padStart(2, '0')}`
                      : '00:00'}
                  </span>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-2">
                {/* Early Out */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Early Out</label>
                  <span className="text-sm text-gray-900 font-medium">
                    {attendanceDetail.earlyOut 
                      ? `${Math.floor(attendanceDetail.earlyOut / 60)}:${(attendanceDetail.earlyOut % 60).toString().padStart(2, '0')}`
                      : '00:00'}
                  </span>
                </div>

                {/* Extra Hours Post Shift */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Post Shift</label>
                  <span className="text-sm text-gray-900 font-medium">
                    {attendanceDetail.extraHoursPostShift 
                      ? `${Math.floor(attendanceDetail.extraHoursPostShift / 60)}:${(attendanceDetail.extraHoursPostShift % 60).toString().padStart(2, '0')}`
                      : '00:00'}
                  </span>
                </div>

                {/* Extra Hours Pre Shift */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Pre Shift</label>
                  <span className="text-sm text-gray-900 font-medium">
                    {attendanceDetail.extraHoursPreShift 
                      ? `${Math.floor(attendanceDetail.extraHoursPreShift / 60)}:${(attendanceDetail.extraHoursPreShift % 60).toString().padStart(2, '0')}`
                      : '00:00'}
                  </span>
                </div>

                {/* Extra Hours */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Extra Hours</label>
                  <span className="text-sm text-gray-900 font-medium">
                    {attendanceDetail.extraHours 
                      ? `${Math.floor(attendanceDetail.extraHours / 60)}:${(attendanceDetail.extraHours % 60).toString().padStart(2, '0')}`
                      : '00:00'}
                  </span>
                </div>

                {/* Personal Out */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Personal Out</label>
                  <span className="text-sm text-gray-900 font-medium">
                    {attendanceDetail.personalOut 
                      ? `${Math.floor(attendanceDetail.personalOut / 60)}:${(attendanceDetail.personalOut % 60).toString().padStart(2, '0')}`
                      : '00:00'}
                  </span>
                </div>

                {/* Official Out */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Official Out</label>
                  <span className="text-sm text-gray-900 font-medium">
                    {attendanceDetail.officialOut 
                      ? `${Math.floor(attendanceDetail.officialOut / 60)}:${(attendanceDetail.officialOut % 60).toString().padStart(2, '0')}`
                      : '00:00'}
                  </span>
                </div>

                {/* OT Hours */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">OT Hours</label>
                  <span className="text-sm text-gray-900 font-medium">
                    {attendanceDetail.otHours 
                      ? `${Math.floor(attendanceDetail.otHours / 60)}:${(attendanceDetail.otHours % 60).toString().padStart(2, '0')}`
                      : '00:00'}
                  </span>
                </div>

                {/* Leave Code */}
                <div className="flex items-center border-b border-gray-100 pb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Leave Code</label>
                  <span className="text-sm text-gray-900 font-medium">{attendanceDetail.leaveCode || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Attendance Data</h3>
              <p className="text-sm text-gray-500">No attendance records found for this date</p>
            </div>
          </div>
        )}
        {/* Gradient fade overlay when collapsed and content overflows */}
        {!isInfoExpanded && hasContentOverflow && attendanceDetail && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"></div>
        )}
      </div>

      {/* Read More Button - Only show if content overflows */}
      {hasContentOverflow && attendanceDetail && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
            className="w-full text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center justify-center gap-1.5"
          >
            {isInfoExpanded ? (
              <>
                <span>Read Less</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Read More</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

