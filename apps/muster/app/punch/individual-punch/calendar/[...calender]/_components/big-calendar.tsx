"use client"

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { monthNames, dayNames } from "./calendar-utils"
import CalendarDays from "./calendar-days"
import type { AttendanceDetail } from "./types"

interface BigCalendarProps {
  currentDate: Date
  selectedDate: Date | null
  navigateMonth: (direction: "prev" | "next") => void
  totalMonthlyWorkingHours: number
  getAttendanceForDate: (date: Date) => AttendanceDetail | null
  handleDayClick: (date: Date) => void
}

export default function BigCalendar({
  currentDate,
  selectedDate,
  navigateMonth,
  totalMonthlyWorkingHours,
  getAttendanceForDate,
  handleDayClick,
}: BigCalendarProps) {
  return (
    <div className="w-full mb-6 bg-white rounded-xl shadow-lg border border-gray-200 overflow-x-hidden overflow-y-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateMonth("prev")} 
              className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateMonth("next")} 
              className="h-6 w-6 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-xs text-gray-600">
            Total: <span className="font-semibold text-gray-800">{totalMonthlyWorkingHours}h</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid Wrapper */}
      <div className="overflow-x-hidden overflow-y-hidden relative">
        <div className="grid grid-cols-7 border-t border-gray-200">
          {/* Day Headers */}
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-8 p-1 text-[10px] font-semibold text-gray-600 uppercase tracking-wide border-r border-b border-gray-200 bg-gray-50 text-center flex items-center justify-center"
            >
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          <CalendarDays
            currentDate={currentDate}
            selectedDate={selectedDate}
            showSplitView={false}
            getAttendanceForDate={getAttendanceForDate}
            handleDayClick={handleDayClick}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
            <span className="text-xs text-gray-700 font-semibold">Present (PP)</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="w-3 h-3 bg-red-100 rounded-full"></div>
            <span className="text-xs text-gray-700 font-semibold">Absent (AA)</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="w-3 h-3 bg-yellow-100 rounded-full"></div>
            <span className="text-xs text-gray-700 font-semibold">Holiday (HH)</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
            <span className="text-xs text-gray-700 font-semibold">Weekend (WW)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

