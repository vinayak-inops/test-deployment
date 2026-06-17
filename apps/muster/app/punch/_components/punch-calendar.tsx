"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Search, Calendar } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import DayDetailsPopup from "../history/_components/day-details-popup"

interface PunchEvent {
  id: string
  type: "punch-in" | "punch-out" | "punch-miss"
  count: number
  employee: string
  day: number
}

interface Holiday {
  id: string
  day: number
  name: string
  reason: string
}

export default function PunchCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 1)) // January 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false)

  const punchEvents: PunchEvent[] = [
    { id: "1", type: "punch-in", count: 1000, employee: "John Smith", day: 6 },
    { id: "2", type: "punch-out", count: 800, employee: "John Smith", day: 6 },
    { id: "3", type: "punch-miss", count: 0, employee: "Tom Wilson", day: 6 },
    { id: "4", type: "punch-in", count: 950, employee: "Sarah Wilson", day: 7 },
    { id: "5", type: "punch-in", count: 1200, employee: "Mike Johnson", day: 8 },
    { id: "6", type: "punch-out", count: 750, employee: "Sarah Wilson", day: 8 },
    { id: "7", type: "punch-miss", count: 0, employee: "Alex Brown", day: 8 },
    { id: "8", type: "punch-in", count: 1100, employee: "Emily Davis", day: 9 },
    { id: "9", type: "punch-out", count: 900, employee: "Mike Johnson", day: 9 },
    { id: "10", type: "punch-in", count: 1050, employee: "Alex Brown", day: 10 },
    { id: "11", type: "punch-miss", count: 0, employee: "Lisa Garcia", day: 10 },
    { id: "12", type: "punch-in", count: 980, employee: "Lisa Garcia", day: 13 },
    { id: "13", type: "punch-out", count: 820, employee: "Emily Davis", day: 13 },
    { id: "14", type: "punch-in", count: 1150, employee: "Tom Wilson", day: 14 },
    { id: "15", type: "punch-out", count: 780, employee: "Alex Brown", day: 14 },
    { id: "16", type: "punch-miss", count: 0, employee: "Sarah Wilson", day: 14 },
    { id: "17", type: "punch-in", count: 1080, employee: "Maria Lopez", day: 15 },
    { id: "18", type: "punch-out", count: 850, employee: "Lisa Garcia", day: 15 },
    { id: "19", type: "punch-in", count: 1020, employee: "David Kim", day: 16 },
    { id: "20", type: "punch-out", count: 760, employee: "Tom Wilson", day: 16 },
    { id: "21", type: "punch-miss", count: 0, employee: "Maria Lopez", day: 16 },
  ]

  const holidays: Holiday[] = [
    { id: "h1", day: 1, name: "New Year's Day", reason: "National Holiday" },
    { id: "h2", day: 20, name: "Martin Luther King Jr. Day", reason: "Federal Holiday" },
    { id: "h3", day: 26, name: "Republic Day", reason: "National Holiday" },
  ]

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    return firstDay === 0 ? 6 : firstDay - 1 // Convert Sunday (0) to 6, Monday (1) to 0, etc.
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)
    setIsDayDetailsOpen(true)
  }

  // Generate mock data for the selected day
  const getDayData = (date: Date) => {
    const day = date.getDate()
    const dayEvents = punchEvents.filter((event) => event.day === day)
    
    // Convert events to table data format
    return dayEvents.map((event, index) => ({
      id: event.id,
      employeeId: `EMP${1000 + index}`,
      name: event.employee,
      date: date.toISOString().split('T')[0],
      type: event.type,
      timestamp: `${date.toISOString().split('T')[0]}T${event.type === 'punch-in' ? '08:30:00' : '17:30:00'}`,
      location: event.type === 'punch-in' ? 'Office - New York' : 'Office - New York',
      device: 'Web Portal',
      notes: event.type === 'punch-miss' ? 'Missing punch record' : 'Regular punch',
      totalHoursWorked: event.type === 'punch-miss' ? '00:00' : '08:30',
      status: event.type === 'punch-miss' ? 'Absent' : 'Present',
    }))
  }

  const getEventStyling = (eventType: string) => {
    switch (eventType) {
      case "punch-in":
        return "bg-blue-600 text-white border border-blue-700 shadow-sm"
      case "punch-out":
        return "bg-blue-100 text-blue-800 border border-blue-200 shadow-sm"
      case "punch-miss":
        return "bg-red-500 text-white border-2 border-red-600 shadow-md font-bold"
      default:
        return "bg-gray-500 text-white border border-gray-600"
    }
  }

  const formatEventText = (event: PunchEvent) => {
    switch (event.type) {
      case "punch-in":
        return `Punch In: ${event.count}`
      case "punch-out":
        return `Punch Out: ${event.count}`
      case "punch-miss":
        return "⚠️ PUNCH MISS"
      default:
        return "Unknown"
    }
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-48 border-r border-b border-gray-200"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = punchEvents.filter((event) => event.day === day)
      const dayHoliday = holidays.find((holiday) => holiday.day === day)
      const isToday = day === 10 // Highlighting day 10 as today

      days.push(
        <div 
          key={day} 
          className="h-48 border-r border-b border-gray-200 p-2 overflow-y-auto relative cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => handleDayClick(day)}
        >
          {/* Holiday background */}
          {dayHoliday && <div className="absolute inset-0 bg-red-50 border-2 border-red-200"></div>}

          <div className="relative z-10 h-full flex flex-col">
            {/* Day number */}
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div
                className={`text-sm font-semibold ${
                  isToday
                    ? "bg-black text-white rounded-full w-7 h-7 flex items-center justify-center"
                    : dayHoliday
                      ? "text-red-600 font-bold"
                      : "text-gray-700"
                }`}
              >
                {day}
              </div>
              {dayHoliday && <Calendar className="h-4 w-4 text-red-500 flex-shrink-0" />}
            </div>

            {/* Holiday information */}
            {dayHoliday && (
              <div className="mb-2 flex-shrink-0">
                <div className="text-xs font-bold text-red-600 break-words">{dayHoliday.name}</div>
                <div className="text-xs text-red-500 break-words">{dayHoliday.reason}</div>
              </div>
            )}

            {/* Events - scrollable area */}
            <div className="space-y-1 flex-1 overflow-y-auto">
              {dayEvents.map((event) => (
                <div key={event.id} className={`text-xs p-2 rounded-md ${getEventStyling(event.type)}`}>
                  <div className="font-medium break-words leading-tight">{formatEventText(event)}</div>
                  {event.type === "punch-miss" && (
                    <div className="text-xs opacity-90 break-words leading-tight mt-1">Missing In/Out pair</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
      )
    }

    return days
  }

  return (
    <div className="w-full overflow-y-auto bg-white rounded-lg shadow-lg scrollbar-hide">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-blue-200 bg-blue-100">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
            {monthNames[currentDate.getMonth()].slice(0, 3)}
          </div>
          <div className="text-3xl font-light text-gray-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <div className="text-sm text-gray-500">
            {monthNames[currentDate.getMonth()].slice(0, 3)} 1, {currentDate.getFullYear()} –{" "}
            {monthNames[currentDate.getMonth()].slice(0, 3)} {getDaysInMonth(currentDate)}, {currentDate.getFullYear()}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="hover:bg-white/50">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")} className="hover:bg-white/50">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="px-4 py-2 h-9 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")} className="hover:bg-white/50">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="px-4 py-2 h-9 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            Month view
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-4 text-sm font-semibold text-gray-700 border-r border-b border-gray-200 bg-gray-100 text-center"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {renderCalendarDays()}
      </div>

      {/* Enhanced Legend */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-600 rounded shadow-sm"></div>
            <span className="text-sm text-gray-700 font-medium">Punch In</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded shadow-sm"></div>
            <span className="text-sm text-gray-700 font-medium">Punch Out</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded shadow-sm"></div>
            <span className="text-sm text-gray-700 font-medium">Punch Miss (Gap between In/Out)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded"></div>
            <Calendar className="h-4 w-4 text-red-500" />
            <span className="text-sm text-gray-700 font-medium">Holiday</span>
          </div>
        </div>
      </div>

      {/* Day Details Popup */}
      <DayDetailsPopup
        isOpen={isDayDetailsOpen}
        onClose={() => setIsDayDetailsOpen(false)}
        selectedDate={selectedDate}
        dayData={selectedDate ? getDayData(selectedDate) : []}
      />
    </div>
  )
}
