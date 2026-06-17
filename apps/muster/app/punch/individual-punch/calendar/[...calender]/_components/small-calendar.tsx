"use client"

import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { monthNames } from "./calendar-utils"
import CalendarDays from "./calendar-days"
import type { AttendanceDetail } from "./types"

interface SmallCalendarProps {
  currentDate: Date
  selectedDate: Date | null
  navigateMonth: (direction: "prev" | "next") => void
  setShowSplitView: (show: boolean) => void
  getAttendanceForDate: (date: Date) => AttendanceDetail | null
  handleDayClick: (date: Date) => void
}

export default function SmallCalendar({
  currentDate,
  selectedDate,
  navigateMonth,
  setShowSplitView,
  getAttendanceForDate,
  handleDayClick,
}: SmallCalendarProps) {
  return (
    <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-200/60 overflow-hidden flex flex-col">
      {/* Header - Vercel style */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-0.5 ml-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateMonth("prev")} 
              className="h-7 w-7 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateMonth("next")} 
              className="h-7 w-7 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowSplitView(false)} 
          className="h-7 px-2.5 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors flex items-center space-x-1.5"
          title="Show full calendar"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Full View</span>
        </Button>
      </div>

      {/* Calendar Grid - Smaller - Vercel style */}
      <div className="flex-1 overflow-hidden relative p-3 min-h-0">
        <div className="grid grid-cols-7 w-full gap-0 h-full auto-rows-fr">
          {/* Day Headers - Short abbreviations matching Vercel style */}
          {["Mo", "Tu", "We", "Th", "Fri", "Sa", "Su"].map((day, index) => (
            <div
              key={`${day}-${index}`}
              className={`h-8 p-0 text-xs font-medium text-gray-500 bg-white text-center flex items-center justify-center flex-shrink-0 ${
                index < 6 ? 'border-r border-gray-200' : ''
              } border-b border-gray-200`}
            >
              {day}
            </div>
          ))}

          {/* Calendar Days - Smaller - Direct grid cells */}
          <CalendarDays
            currentDate={currentDate}
            selectedDate={selectedDate}
            showSplitView={true}
            getAttendanceForDate={getAttendanceForDate}
            handleDayClick={handleDayClick}
          />
        </div>
      </div>
    </div>
  )
}

