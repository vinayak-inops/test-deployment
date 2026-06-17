"use client"

import { useState, useRef } from "react"
import type React from "react"
import type { AttendanceDetail } from "./types"
import { formatYMD, getDaysInMonth, getFirstDayOfMonth, getCardColor, getAttendanceTextColor, getDotColor, formatWorkDuration } from "./calendar-utils"
import HoverPopup from "./hover-popup"

interface CalendarDaysProps {
  currentDate: Date
  selectedDate: Date | null
  showSplitView: boolean
  getAttendanceForDate: (date: Date) => AttendanceDetail | null
  handleDayClick: (date: Date) => void
}

export default function CalendarDays({
  currentDate,
  selectedDate,
  showSplitView,
  getAttendanceForDate,
  handleDayClick,
}: CalendarDaysProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const tooltipRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const days: React.ReactNode[] = []
  const today = new Date()
  const daysInCurrent = getDaysInMonth(currentDate)
  const startOffset = getFirstDayOfMonth(currentDate) // 0 (Mon) .. 6 (Sun)

  // Define responsive sizing variables once at the top
  const cellHeight = showSplitView ? "min-h-[2.5rem] flex-1" : "h-24"
  const dayNumberSize = showSplitView ? "w-6 h-6 text-xs" : "w-7 h-7 text-xs"
  const topPosition = showSplitView ? "top-1" : "top-1"

  // Handle mouse enter for hover popup positioning
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>, cellDate: Date) => {
    if (showSplitView) return // Only for big calendar
    
    const element = e.currentTarget
    const dateKey = formatYMD(cellDate)
    
    setHoveredDate(cellDate)
    
    // Use requestAnimationFrame to ensure DOM has updated and ref is set
    requestAnimationFrame(() => {
      const tooltip = tooltipRefs.current.get(dateKey)
      
      if (!tooltip || !element) {
        // If tooltip not found, try again on next frame
        requestAnimationFrame(() => {
          const retryTooltip = tooltipRefs.current.get(dateKey)
          if (retryTooltip && element) {
            positionTooltip(retryTooltip, element, dateKey)
          }
        })
        return
      }
      
      positionTooltip(tooltip, element, dateKey)
    })
  }

  // Helper function to position tooltip
  const positionTooltip = (tooltip: HTMLDivElement, element: HTMLElement, dateKey: string) => {
    // Hide all other tooltips
    tooltipRefs.current.forEach((otherTooltip) => {
      if (otherTooltip !== tooltip) {
        otherTooltip.style.opacity = '0'
        otherTooltip.style.visibility = 'hidden'
        otherTooltip.style.pointerEvents = 'none'
      }
    })
    
    // Get element position
    const rect = element.getBoundingClientRect()
    const tooltipWidth = 320
    const spacing = 8
    const padding = 16
    
    // Position to the right of the element
    let left = rect.right + spacing
    
    // Check if tooltip would overflow on the right
    if (left + tooltipWidth > window.innerWidth - padding) {
      // Position to the left instead
      left = rect.left - tooltipWidth - spacing
      // If still doesn't fit, align to viewport edge
      if (left < padding) {
        left = padding
      }
    }
    
    // Ensure tooltip doesn't go outside viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))
    
    // Set position and show tooltip
    tooltip.style.position = 'fixed'
    tooltip.style.left = `${left}px`
    tooltip.style.top = `${rect.top}px`
    tooltip.style.zIndex = '9999'
    tooltip.style.visibility = 'visible'
    tooltip.style.opacity = '1'
    tooltip.style.pointerEvents = 'auto'
  }

  // Handle mouse leave to hide popup
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>, cellDate: Date) => {
    if (showSplitView) return
    
    const dateKey = formatYMD(cellDate)
    const tooltip = tooltipRefs.current.get(dateKey)
    if (!tooltip) return
    
    // Check if mouse is moving to the tooltip
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && relatedTarget instanceof Node && tooltip.contains(relatedTarget)) {
      return // Don't hide if moving to tooltip
    }
    
    tooltip.style.opacity = '0'
    tooltip.style.visibility = 'hidden'
    tooltip.style.pointerEvents = 'none'
    setHoveredDate(null)
  }

  // Helper function to render attendance day card - Only for big calendar
  const renderAttendanceCard = (attendanceDetail: AttendanceDetail, cellDate: Date) => {
    const bgColor = getCardColor(attendanceDetail)
    const textColor = getAttendanceTextColor(attendanceDetail)
    const dateKey = formatYMD(cellDate)
    
    return (
      <div 
        className="h-full w-full relative group"
        onMouseEnter={(e) => handleMouseEnter(e, cellDate)}
        onMouseLeave={(e) => handleMouseLeave(e, cellDate)}
      >
        {/* Full size for big calendar */}
        <div className={`absolute top-7 left-1.5 right-1.5 bottom-1 ${bgColor} rounded-lg shadow-sm hover:shadow-lg border border-opacity-20 transition-all duration-200 overflow-y-auto hide-scrollbar`}>
          <div className="h-full flex flex-col p-2.5 gap-0.5 justify-start">
            {attendanceDetail.shiftCode && attendanceDetail.shiftCode.trim() !== '' && (
              <div className={`text-[11px] font-semibold ${textColor} leading-tight`}>
                Shift: {attendanceDetail.shiftCode}
              </div>
            )}
            {attendanceDetail.attendanceID && attendanceDetail.attendanceID.trim() !== '' && (
              <div className={`text-[10px] font-medium ${textColor} opacity-90 leading-tight`}>
                Status: {attendanceDetail.attendanceID}
              </div>
            )}
            <div className={`text-[10px] font-normal ${textColor} opacity-75 leading-tight mt-0.5`}>
              Hours: {formatWorkDuration(attendanceDetail.hoursWorked)}
            </div>
          </div>
        </div>
        
        {/* Hover Popup - Only for big calendar */}
        {!showSplitView && (
          <HoverPopup
            ref={(el) => {
              if (el) {
                tooltipRefs.current.set(dateKey, el)
              } else {
                tooltipRefs.current.delete(dateKey)
              }
            }}
            attendanceDetail={attendanceDetail}
            cellDate={cellDate}
            isVisible={hoveredDate?.getTime() === cellDate.getTime()}
            onMouseEnter={(e) => handleMouseEnter(e, cellDate)}
            onMouseLeave={(e) => handleMouseLeave(e, cellDate)}
          />
        )}
      </div>
    )
  }

  // Show dates from previous month (instead of blank cells)
  if (startOffset > 0) {
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0)
    const daysInPrevMonth = prevMonth.getDate()
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i
      const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, dayNum)
      const isLastInRow = (startOffset - 1 - i) % 7 === 6
      days.push(
        <div
          key={`prev-${formatYMD(cellDate)}`}
          className={`${cellHeight} ${!isLastInRow ? 'border-r' : ''} border-b border-gray-200 relative flex items-center justify-center w-full min-h-0 ${
            showSplitView ? "bg-white" : "bg-gray-50/30"
          }`}
        >
          <div className={`text-sm ${showSplitView ? "text-gray-300" : "text-gray-400"} font-normal`}>
            {dayNum}
          </div>
        </div>
      )
    }
  }

  // Current month dates
  for (let dayNum = 1; dayNum <= daysInCurrent; dayNum++) {
    const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum)
    const isToday = (
      dayNum === today.getDate() &&
      cellDate.getMonth() === today.getMonth() &&
      cellDate.getFullYear() === today.getFullYear()
    )

    const attendanceDetail = getAttendanceForDate(cellDate)

    const isSelected = selectedDate && 
      cellDate.getDate() === selectedDate.getDate() &&
      cellDate.getMonth() === selectedDate.getMonth() &&
      cellDate.getFullYear() === selectedDate.getFullYear()
    
    const isLastInRow = (dayNum - 1 + startOffset) % 7 === 6
    days.push(
      <div
        key={formatYMD(cellDate)}
        className={`${cellHeight} ${!isLastInRow ? 'border-r' : ''} border-b border-gray-200 relative cursor-pointer group transition-all duration-200 flex flex-col items-center justify-center w-full min-h-0 ${
          showSplitView 
            ? "bg-white hover:bg-gray-50/50"
            : isToday 
            ? "border-2 border-blue-500" 
            : ""
        }`}
        onClick={() => handleDayClick(cellDate)}
      >
        {/* Day Number - Simple design for small calendar matching Vercel style */}
        {showSplitView ? (
          <div className={`text-sm transition-all flex items-center justify-center ${
            isSelected 
              ? "bg-blue-600 text-white rounded w-7 h-7 font-semibold"
              : "text-gray-700 font-normal hover:text-gray-900"
          }`}>
            {dayNum}
          </div>
        ) : (
          <div className={`absolute ${topPosition} left-1 z-20`}>
            <div
              className={`${dayNumberSize} font-bold ${
                isToday
                  ? "bg-blue-600 text-white rounded-full flex items-center justify-center"
                  : "text-gray-800"
              }`}
            >
              {String(dayNum).padStart(2, '0')}
            </div>
          </div>
        )}

        {/* Attendance dots for small calendar */}
        {showSplitView && attendanceDetail && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-0.5">
            <div className={`w-1.5 h-1.5 ${getDotColor(attendanceDetail)} rounded-full`}></div>
            {attendanceDetail.leaveCode && attendanceDetail.leaveCode.trim() !== '' && attendanceDetail.leaveCode !== '00' && attendanceDetail.leaveCode !== '0' && (
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
            )}
          </div>
        )}

        {/* Card Content - Only show for big calendar */}
        {attendanceDetail && !showSplitView && (
          renderAttendanceCard(attendanceDetail, cellDate)
        )}
      </div>
    )
  }

  // Show dates from next month to complete the grid
  const totalCellsSoFar = startOffset + daysInCurrent
  const trailing = (7 - (totalCellsSoFar % 7)) % 7
  if (trailing > 0) {
    for (let dayNum = 1; dayNum <= trailing; dayNum++) {
      const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, dayNum)
      const isLastInRow = (totalCellsSoFar + dayNum - 1) % 7 === 6
      days.push(
        <div
          key={`next-${formatYMD(cellDate)}`}
          className={`${cellHeight} ${!isLastInRow ? 'border-r' : ''} border-b border-gray-200 relative flex items-center justify-center w-full min-h-0 ${
            showSplitView ? "bg-white" : "bg-gray-50/30"
          }`}
        >
          <div className={`text-sm ${showSplitView ? "text-gray-300" : "text-gray-400"} font-normal`}>
            {dayNum}
          </div>
        </div>
      )
    }
  }

  return <>{days}</>
}

