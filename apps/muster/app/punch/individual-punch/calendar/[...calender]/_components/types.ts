export interface AttendanceRequest {
  employeeId: string
  fromDate: string
  toDate: string
}

export interface AttendanceDetail {
  date: string
  shiftCode: string
  attendanceID: string
  hoursWorked: number
  lateIn: number
  earlyOut: number
  leaveCode?: string
  extraHoursPostShift: number
  extraHoursPreShift: number
  extraHours: number
  personalOut: number
  officialOut: number
  otHours: number
  shiftsAllocated?: string | number
  workOrderNumber?: string
  punchDetails: {
    inPunches: any[]
    outPunches: any[]
    defaultPunches: any[]
  }
}

export interface AttendanceRecord {
  _id: string
  id: string
  month: number
  year: number
  attendanceDetails: AttendanceDetail[]
  organizationCode: string
  tenantCode: string
  employeeID: string
}

export interface AttendanceCalendarProps {
  attendanceData?: AttendanceRequest
  onNewPunchSubmit?: (data: any) => Promise<boolean>
}




