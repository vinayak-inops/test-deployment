"use client"

import AttendanceCalendar from "./attendance-calendar"

interface AttendanceRequest {
  employeeId: string
  fromDate: string
  toDate: string
}

interface LoginCalendarProps {
  attendanceData?: AttendanceRequest
  employeeId?: string
  contractEmp?: any
}

export default function LoginCalendar({ attendanceData, employeeId, contractEmp }: LoginCalendarProps) {
  return (
    <div className="space-y-0">
      {/* Calendar Component */}
      <div className="w-full pt-0 overflow-hidden">
        <AttendanceCalendar attendanceData={attendanceData} />
      </div>
    </div>
  )
}