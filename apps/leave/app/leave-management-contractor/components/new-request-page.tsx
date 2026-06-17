"use client"

import React, { useState, useEffect, useMemo } from "react"
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, User, RefreshCw } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@repo/ui/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { cn } from "@repo/ui/lib/utils"  
import { RequestAbsenceModal } from "./request-absence-modal"
import DatePickerField from "./datePickerField"
import EmpFilter from "./emp-filter"
import { useLeaveApplications } from "../../../hooks/useLeaveApplications"
import { useLeaveBalances } from "../../../hooks/useLeaveBalances"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"


// API Response Types
interface BalanceData {
  leaveTitle: string
  leaveCode: string
  unitOfTime: string
  balance: number
  asOfPeriod: string
}

interface ApiResponse {
  balances: BalanceData[]
}

// Transformed data type for the component
interface TransformedBalanceData {
  type: string
  leaveCode: string
  balance: number
  unitOfTime: string
}

interface NewRequestPageProps {
  onBack: () => void
}

// Get cookie information
const getCookie = (name: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      const value = cookie.substring(name.length + 1);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return undefined;
};



export function NewRequestPage({ onBack }: NewRequestPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedFullDates, setSelectedFullDates] = useState<Date[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showMultiDatePrompt, setShowMultiDatePrompt] = useState(false)
  const [preferredMultiDateMode, setPreferredMultiDateMode] = useState<"all" | "individual" | null>(null)
  const [isBasicRangeMode, setIsBasicRangeMode] = useState(false)
  const [fromDate, setFromDate] = useState<Date | null>(null)
  const [toDate, setToDate] = useState<Date | null>(null)
  const [empStatues, setEmpStatues] = useState(false)
  const [isClient, setIsClient] = useState(false);
  const [showRequestView, setShowRequestView] = useState(false)
  const [selectedApplicationForView, setSelectedApplicationForView] = useState<any | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const tenantCode = useGetTenantCode()

  // Get role permissions for approve/reject/cancel
       const { responseData: permissions } = useRolePermissions({
           serviceName: 'applicationApplier',
           screenName: 'leave'
       });

  // Get stored role information from cookies
  const storedRoleInfo = useMemo(() => {
    try {
      const keyclockroleinfo = getCookie("keyclockroleinfo");
      if (keyclockroleinfo) {
        return JSON.parse(keyclockroleinfo);
      }
    } catch (error) {
      // ignore parse errors
    }
    return null;
  }, []);

  // client-ready flag
  useEffect(() => {
    setIsClient(true)
  }, [])

  // State to track if popup should be forced open (cannot close)
  const [forceEmpFilterOpen, setForceEmpFilterOpen] = useState(false)

  // Check permissions and configure filter behavior
  useEffect(() => {
    const selfAllowed = Boolean((permissions as any)?.self)
    const allAllowed = Boolean((permissions as any)?.all)

    // Show filter button only when ALL is allowed
    setEmpStatues(allAllowed)

    // Self-only: preselect employee from cookie, do not auto-open filter
    if (selfAllowed && !allAllowed) {
      if (storedRoleInfo?.employeeId) {
        setSelectedEmployeeId(storedRoleInfo.employeeId)
      }
      setIsEmpFilterOpen(false)
      setForceEmpFilterOpen(false)
      return
    }

    // All-only (self false, all true): auto-open popup without selecting value, don't allow closing
    if (allAllowed && !selfAllowed) {
      setIsEmpFilterOpen(true)
      setForceEmpFilterOpen(true)
      return
    }

    // Both allowed: update selectedEmployee from keyclockInfo
    if (selfAllowed && allAllowed) {
      if (storedRoleInfo?.employeeId) {
        setSelectedEmployeeId(storedRoleInfo.employeeId)
      }
      setIsEmpFilterOpen(false)
      setForceEmpFilterOpen(false)
      return
    }

    // Default: close popup
    setIsEmpFilterOpen(false)
    setForceEmpFilterOpen(false)
  }, [permissions, storedRoleInfo])

  // EmpFilter popup state
  const [isEmpFilterOpen, setIsEmpFilterOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")

  // Use the leave balances hook
  const { 
    balanceData, 
    loading, 
    error, 
    lastUpdated,
    updateBalanceData,
    setErrorState,
    setLoadingState
  } = useLeaveBalances()

  // API call for leave balance data
  const {
    data: leaveBalanceResponse,
    loading: isLoadingLeaveBalance,
    error: leaveBalanceError,
    refetch: fetchLeaveBalance
  } = useRequest<any>({
    url: 'leaveBalance/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "employeeID",
        operator: "eq",
        value: selectedEmployeeId
      }
    ],
    onSuccess: (data: any) => {
      updateBalanceData(data)
    },
    onError: (error: Error) => {
      console.error("Error fetching leave balance data:", error);
      setErrorState(error.message)
    },
    dependencies: []
  });

  useEffect(() => {
    setLoadingState(true)
    fetchLeaveBalance()
  }, [])

  // Update loading state based on API call
  useEffect(() => {
    setLoadingState(isLoadingLeaveBalance)
  }, [isLoadingLeaveBalance])

  // Extract asOfPeriod from the first balance item if available
  const asOfPeriod = balanceData.length > 0 ? balanceData[0].asOfPeriod : ""

  // Use the leave applications hook
  const { 
    applicationsData: leaveApplications, 
    loading: applicationsLoading, 
    error: applicationsError, 
    lastUpdated: applicationsLastUpdated, 
    updateApplicationsData, 
    setLoadingState: setApplicationsLoadingState, 
    setErrorState: setApplicationsErrorState 
  } = useLeaveApplications()

  // API call for leave applications data
  const {
    data: leaveApplicationsResponse,
    loading: isLoadingLeaveApplications,
    error: leaveApplicationsError,
    refetch: fetchLeaveApplications
  } = useRequest<any>({
    url: 'leaveApplication/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
      {
        field: "employeeID",
        operator: "eq",
        value: selectedEmployeeId
      }
    ],
    onSuccess: (data: any) => {
      updateApplicationsData(data)
    },
    onError: (error: Error) => {
      console.error("Error fetching leave applications data:", error);
      setApplicationsErrorState(error.message)
    },
    dependencies: [selectedEmployeeId]
  });

  useEffect(() => {
    if (selectedEmployeeId) {
      setApplicationsLoadingState(true)
      fetchLeaveApplications()
    }
  }, [selectedEmployeeId])

  // Update loading state based on API call
  useEffect(() => {
    setApplicationsLoadingState(isLoadingLeaveApplications)
  }, [isLoadingLeaveApplications])

  // Refresh function to reload all data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Refresh both leave balance and applications data
      await Promise.all([
        fetchLeaveBalance(),
        fetchLeaveApplications()
      ])
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    try {
      // Handle date strings with hyphens
      if (dateString.includes('-') && dateString.split('-').length === 3) {
        const parts = dateString.split('-')
        const [first, second, third] = parts
        
        // Check if first part is likely a year (4 digits) or day (1-2 digits)
        if (first.length === 4) {
          // It's yyyy-mm-dd format (like "2025-11-24")
          return `${third}-${second}-${first}`
        } else {
          // It's dd-mm-yyyy format (like "18-06-2025")
          return `${first}-${second}-${third}`
        }
      }
      
      // Handle ISO date strings or other formats
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString
      }
      
      // Format as dd-mm-yyyy
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear().toString()
      
      return `${day}-${month}-${year}`
    } catch {
      return dateString
    }
  }

  // Helper function to get leave summary
  const getLeaveSummary = (leaves: any[] | undefined) => {
    if (!leaves || leaves.length === 0) return 'No leaves';
    
    // Map leave codes to full names
    const leaveCodeMap: Record<string, string> = {
      'CL': 'Casual Leave',
      'SL': 'Sick Leave',
      'EL': 'Earned Leave',
      'PL': 'Privilege Leave',
      'ML': 'Maternity Leave',
      'AL': 'Annual Leave',
      'HL': 'Half Day Leave',
      'LOP': 'Loss of Pay'
    };
    
    const leaveTypes = leaves.reduce((acc: any, leave: any) => {
      const code = leave.leaveCode || 'Unknown';
      acc[code] = (acc[code] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(leaveTypes)
      .map(([code, count]) => {
        const leaveName = leaveCodeMap[code] || code;
        return `${count} ${leaveName}`;
      })
      .join(', ')
  }

  // Helper function to get leave data for a specific date
  const getLeaveDataForDate = (day: number, month: number, year: number) => {
    const dateString = `${day.toString().padStart(2, '0')}-${(month + 1).toString().padStart(2, '0')}-${year}`
    
    const leavesForDate: Array<{
      leaveCode: string
      duration: string
      workflowState: string
      applicationId: string
    }> = []
    
    leaveApplications.forEach((application: any) => {
      application.leaves?.forEach((leave: any) => {
        if (leave.date === dateString) {
          leavesForDate.push({
            leaveCode: leave.leaveCode,
            duration: leave.duration,
            workflowState: application.workflowState,
            applicationId: application._id
          })
        }
      })
    })
    
    return leavesForDate
  }

  // Helper function to check if a date has already applied leave (any status except failed)
  const hasAppliedLeave = (day: number, month: number, year: number) => {
    const leaveData = getLeaveDataForDate(day, month, year)
    // Block dates with any leave application EXCEPT failed ones (REJECTED, FAILED, CANCELLED)
    return leaveData.some(leave => 
      !['REJECTED', 'FAILED', 'CANCELLED'].includes(leave.workflowState)
    )
  }

  // Helper function to check if a date has failed leave applications
  const hasFailedLeave = (day: number, month: number, year: number) => {
    const leaveData = getLeaveDataForDate(day, month, year)
    return leaveData.some(leave => 
      ['REJECTED', 'FAILED', 'CANCELLED'].includes(leave.workflowState)
    )
  }

  // Helper function to get status color for leave
  const getLeaveStatusColor = (workflowState: string) => {
    switch (workflowState) {
      case 'APPROVED':
        return 'bg-green-50 border-green-200 text-green-900'
      case 'VALIDATED':
        return 'bg-teal-50 border-teal-200 text-teal-900'
      case 'INITIATED':
        return 'bg-blue-50 border-blue-200 text-blue-900'
      case 'REJECTED':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'PENDING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      default:
        return 'bg-slate-50 border-slate-200 text-slate-900'
    }
  }

  // Helper function to get duration display text
  const getDurationDisplay = (duration: string) => {
    switch (duration) {
      case 'Full-Day':
        return 'Full'
      case 'First-Half':
        return '1st Half'
      case 'Second-Half':
        return '2nd Half'
      default:
        return duration
    }
  }

  // Transform leave applications data for Recent Requests
  const recentRequests = leaveApplications.map((app: any, index: number) => ({
    id: app._id || index,
    type: getLeaveSummary(app.leaves),
    dates: `${formatDate(app.fromDate)} / ${formatDate(app.toDate)}`,
    status: app.workflowState || 'Unknown',
    days: app.leaves?.length || 0
  }))

  // Remove transformApiData and fetchBalanceData functions

  // useEffect(() => { fetchBalanceData() }, [])





  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

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

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Derive the selected day numbers for the currently viewed month/year
  const currentMonthSelectedDays = React.useMemo(() => {
    return selectedFullDates
      .filter(d => d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear())
      .map(d => d.getDate())
  }, [selectedFullDates, currentDate])

  // Dates from previous month and current month to display in the header chips
  const headerSelectedDates = React.useMemo(() => {
    const currMonth = currentDate.getMonth()
    const currYear = currentDate.getFullYear()
    const prevMonthDate = new Date(currYear, currMonth - 1, 1)
    const prevMonth = prevMonthDate.getMonth()
    const prevYear = prevMonthDate.getFullYear()
    return selectedFullDates
      .filter(d =>
        (d.getMonth() === currMonth && d.getFullYear() === currYear) ||
        (d.getMonth() === prevMonth && d.getFullYear() === prevYear)
      )
      .sort((a,b) => a.getTime() - b.getTime())
  }, [selectedFullDates, currentDate])

  const selectFullRange = (start: Date, end: Date) => {
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    const from = startDay.getTime() <= endDay.getTime() ? startDay : endDay
    const to = startDay.getTime() <= endDay.getTime() ? endDay : startDay
    const range: Date[] = []
    const cursor = new Date(from)
    while (cursor.getTime() <= to.getTime()) {
      // Skip dates that have already applied leave
      if (!hasAppliedLeave(cursor.getDate(), cursor.getMonth(), cursor.getFullYear())) {
        range.push(new Date(cursor))
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    setSelectedFullDates(range)
    if (preferredMultiDateMode === null && range.length > 1) {
      setShowMultiDatePrompt(true)
    }
  }

  // Helper function to check if dates form a continuous range
  const isContinuousRange = (dates: Date[]) => {
    if (dates.length <= 1) return true
    
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime())
    const start = sortedDates[0]
    const end = sortedDates[sortedDates.length - 1]
    
    // Calculate expected number of days in range
    const expectedDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return dates.length === expectedDays
  }

  // Helper function to expand selection to continuous range
  const expandToContinuousRange = (dates: Date[]) => {
    if (dates.length <= 1) return dates
    
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime())
    const start = new Date(sortedDates[0])
    const end = new Date(sortedDates[sortedDates.length - 1])
    
    return selectFullRange(start, end)
  }

  // Sync basic From/To pickers into selection
  useEffect(() => {
    if (isBasicRangeMode && fromDate && toDate) {
      selectFullRange(fromDate, toDate)
    }
  }, [isBasicRangeMode, fromDate, toDate])

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div 
          key={`empty-${i}`} 
          className="h-28 border-r border-b border-slate-100 bg-slate-25/30"
        ></div>
      )
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = currentMonthSelectedDays.includes(day)
      const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()
      const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6
      
      // Get leave data for this date
      const leaveData = getLeaveDataForDate(day, currentDate.getMonth(), currentDate.getFullYear())
      const hasAppliedLeaveOnDate = hasAppliedLeave(day, currentDate.getMonth(), currentDate.getFullYear())
      const hasFailedLeaveOnDate = hasFailedLeave(day, currentDate.getMonth(), currentDate.getFullYear())

      days.push(
        <div
          key={day}
          className={cn(
            "h-28 border-r border-b border-slate-100 p-3 transition-all duration-200 relative group",
            hasAppliedLeaveOnDate 
              ? "cursor-not-allowed bg-red-50/30 opacity-60" 
              : hasFailedLeaveOnDate
              ? "cursor-pointer hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 hover:shadow-sm bg-orange-50/20"
              : "cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:shadow-sm",
            isSelected && "bg-gradient-to-br from-blue-100 to-indigo-100 shadow-md",
            isWeekend && "bg-slate-25/50",
            isToday && !isSelected && "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
          )}
          onClick={() => {
            // Prevent selection if date has already applied leave
            if (hasAppliedLeaveOnDate) {
              return
            }
            
            const clicked = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
            const key = clicked.toDateString()
            const exists = selectedFullDates.find(d => d.toDateString() === key)
            
            if (exists) {
              // If clicking on an existing date, only allow deselection if it's the start or end of the range
              const sortedDates = [...selectedFullDates].sort((a, b) => a.getTime() - b.getTime())
              const isStartDate = sortedDates[0].toDateString() === key
              const isEndDate = sortedDates[sortedDates.length - 1].toDateString() === key
              
              // Only allow deselection of start or end dates
              if (isStartDate || isEndDate) {
                setSelectedFullDates(selectedFullDates.filter(d => d.toDateString() !== key))
              }
              // If clicking on a middle date, do nothing (prevent deselection)
            } else {
              // Add new date and expand to continuous range
              const next = [...selectedFullDates, clicked]
              setSelectedFullDates(next)
              
              // If we have 2 or more dates, expand to continuous range
              if (next.length >= 2) {
                expandToContinuousRange(next)
              }
              
              if (next.length === 2 && preferredMultiDateMode === null) {
                setShowMultiDatePrompt(true)
              }
            }
          }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
                  hasAppliedLeaveOnDate 
                    ? "text-red-400 bg-red-100 cursor-not-allowed" 
                    : hasFailedLeaveOnDate
                    ? "text-orange-600 bg-orange-100 group-hover:scale-110"
                    : "group-hover:scale-110",
                  isSelected && !hasAppliedLeaveOnDate && "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg",
                  isToday && !isSelected && !hasAppliedLeaveOnDate && "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md",
                  !isSelected && !isToday && !hasAppliedLeaveOnDate && !hasFailedLeaveOnDate && "text-slate-700 hover:bg-slate-200"
                )}
              >
                {day}
              </div>
              {isToday && (
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              )}
            </div>
            
            {/* Leave Information Display - show only APPROVED status */}
            {leaveData.filter(ld => ld.workflowState === 'APPROVED').length > 0 && (
              <div className="flex-1 space-y-1 overflow-y-auto max-h-16">
                {leaveData
                  .filter(leave => leave.workflowState === 'APPROVED')
                  .map((leave, index) => (
                  <div
                    key={`${leave.applicationId}-${index}`}
                    className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded border shadow-sm",
                      getLeaveStatusColor(leave.workflowState),
                      "truncate hover:shadow-md transition-all duration-200 cursor-help"
                    )}
                    title={`${leave.leaveCode} - ${getDurationDisplay(leave.duration)} (${leave.workflowState})`}
                  >
                    {/* First row: Leave Code and Duration */}
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-[11px]">{leave.leaveCode}</span>
                      <span className="text-[9px] opacity-75 font-medium">{getDurationDisplay(leave.duration)}</span>
                    </div>
                    
                    {/* Second row: Status */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[8px] font-bold uppercase tracking-wide",
                        leave.workflowState === 'APPROVED' && "text-green-700",
                        leave.workflowState === 'VALIDATED' && "text-teal-700",
                        leave.workflowState === 'INITIATED' && "text-blue-700",
                        leave.workflowState === 'REJECTED' && "text-red-700",
                        leave.workflowState === 'PENDING' && "text-yellow-700",
                        (!['APPROVED', 'VALIDATED', 'INITIATED', 'REJECTED', 'PENDING'].includes(leave.workflowState)) && "text-slate-700"
                      )}>
                        {leave.workflowState}
                      </span>
                      {/* Status indicator dot */}
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full shadow-sm",
                        leave.workflowState === 'APPROVED' && "bg-green-500",
                        leave.workflowState === 'VALIDATED' && "bg-teal-500",
                        leave.workflowState === 'INITIATED' && "bg-blue-500",
                        leave.workflowState === 'REJECTED' && "bg-red-500",
                        leave.workflowState === 'PENDING' && "bg-yellow-500",
                        (!['APPROVED', 'VALIDATED', 'INITIATED', 'REJECTED', 'PENDING'].includes(leave.workflowState)) && "bg-slate-500"
                      )}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Disabled indicator for dates with applied leave */}
            {hasAppliedLeaveOnDate && (
              <div className="absolute top-1 right-1">
                <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">×</span>
                </div>
              </div>
            )}
            
            {/* Failed leave indicator for dates with failed applications */}
            {hasFailedLeaveOnDate && !hasAppliedLeaveOnDate && (
              <div className="absolute top-1 right-1">
                <div className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">!</span>
                </div>
              </div>
            )}
            
            {/* Today indicator */}
            {isToday && leaveData.length === 0 && (
              <div className="absolute bottom-2 left-3">
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                  Today
                </span>
              </div>
            )}
            
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
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

  const handleSubmitRequest = () => {
    if (selectedFullDates.length > 1 && preferredMultiDateMode === null) {
      setShowMultiDatePrompt(true)
      return
    }
    setShowModal(true)
  }

  // Handle employee selection from EmpFilter
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    // Always close popup after selecting an employee
    setIsEmpFilterOpen(false)
    setForceEmpFilterOpen(false)
    // Clear selected dates when employee changes
    setSelectedFullDates([])
    setPreferredMultiDateMode(null)
    setFromDate(null)
    setToDate(null)
  }

  // Handle opening EmpFilter popup
  const handleOpenEmpFilter = () => {
    setIsEmpFilterOpen(true)
    // Clear selected dates when opening filter
    setSelectedFullDates([])
    setPreferredMultiDateMode(null)
    setFromDate(null)
    setToDate(null)
  }

  // Handle closing EmpFilter popup
  const handleCloseEmpFilter = () => {
    // If popup is forced open (all=true, self=false), navigate back instead of closing
    if (forceEmpFilterOpen) {
      onBack()
      return
    }
    setIsEmpFilterOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className="hover:bg-slate-100 transition-all duration-200"
                title="Refresh data"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <div className="flex items-center space-x-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">New Leave Request</h1>
                  <p className="text-sm text-slate-600">
                    Select dates for your time off
                    {selectedEmployeeId && (
                      <span className="text-blue-600 ml-2 font-medium">
                        - Employee ID: {selectedEmployeeId}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: filter buttons */}
            <div className="flex gap-3">
              {
                empStatues && (
                  <Button 
                    variant="outline" 
                    className="hover:bg-gray-50"
                    onClick={handleOpenEmpFilter}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Filter by Employee
                  </Button>
                )
              }
              {empStatues && (
                <Button 
                  variant="outline" 
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  onClick={() => {
                    setSelectedEmployeeId("")
                    // Clear selected dates when clearing filter
                    setSelectedFullDates([])
                    setPreferredMultiDateMode(null)
                    setFromDate(null)
                    setToDate(null)
                  }}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-full overflow-x-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigateMonth("prev")}
                      className="hover:bg-white/80 hover:shadow-sm transition-all duration-200"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-center">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">
                        {isBasicRangeMode ? "Choose From and To dates" : "Select your leave dates"}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigateMonth("next")}
                      className="hover:bg-white/80 hover:shadow-sm transition-all duration-200"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                    <Button
                      variant={isBasicRangeMode ? "default" : "outline"}
                      className="text-xs ml-4"
                      onClick={() => {
                        setIsBasicRangeMode(!isBasicRangeMode)
                      }}
                    >
                      {isBasicRangeMode ? "Basic: From/To" : "Basic: Off"}
                    </Button>
                  </div>
                  
                  {/* Selected Dates Section - Beside Month/Year (shows prev + current month) */}
                  {headerSelectedDates.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-3 min-w-64">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-semibold text-slate-900 flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          <span>Selected Dates</span>
                        </h3>
                        <Button
                          variant="outline"
                          className="h-6 px-2 py-0 text-[11px] leading-none border-blue-200 text-blue-700 hover:text-blue-800 hover:bg-white"
                          onClick={() => {
                            setSelectedFullDates([])
                            setPreferredMultiDateMode(null)
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                      <div className={`flex flex-wrap gap-1.5 justify-center ${headerSelectedDates.length > 15 ? 'max-h-28 overflow-y-auto pr-1' : ''}`}>
                        {headerSelectedDates.map((d, idx) => {
                          const sortedDates = [...selectedFullDates].sort((a, b) => a.getTime() - b.getTime())
                          const isStartDate = sortedDates[0].toDateString() === d.toDateString()
                          const isEndDate = sortedDates[sortedDates.length - 1].toDateString() === d.toDateString()
                          const canDeselect = isStartDate || isEndDate || selectedFullDates.length <= 1
                          
                          return (
                            <Badge 
                              key={`${d.toISOString()}-${idx}`}
                              variant="secondary" 
                              className={`bg-white/80 text-blue-800 px-2 py-1 text-xs font-medium shadow-sm border border-blue-200 hover:bg-white transition-all duration-200 ${
                                !canDeselect ? 'opacity-60' : ''
                              }`}
                            >
                              {monthNames[d.getMonth()]} {d.getDate()}
                              {canDeselect && (
                                <button
                                  onClick={() => {
                                    const toRemove = d.toDateString()
                                    setSelectedFullDates(selectedFullDates.filter(sd => sd.toDateString() !== toRemove))
                                  }}
                                  className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full w-3 h-3 flex items-center justify-center transition-all duration-200 text-xs"
                                >
                                  ×
                                </button>
                              )}
                            </Badge>
                          )
                        })}
                      </div>
                      <div className="text-center mt-1.5">
                        <p className="text-xs text-slate-600 font-medium">
                          Total: <span className="text-blue-600 font-bold">{selectedFullDates.length}</span> day{selectedFullDates.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Submit Request Button - Beside Selected Dates */}
                  {selectedFullDates.length > 0 && (
                    <Button
                      onClick={handleSubmitRequest}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 h-auto"
                    >
                      Submit Request ({selectedFullDates.length})
                    </Button>
                  )}
                  

                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isBasicRangeMode && (
                  <div className="p-4 border-b border-slate-200 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <DatePickerField
                        label="From date"
                        value={fromDate}
                        onChange={setFromDate}
                      />
                      <DatePickerField
                        label="To date"
                        value={toDate}
                        onChange={setToDate}
                        minDate={fromDate || undefined}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setFromDate(null)
                            setToDate(null)
                            setSelectedFullDates([])
                            setPreferredMultiDateMode(null)
                          }}
                          variant="outline"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Calendar Header */}
                <div className="grid grid-cols-7 bg-gradient-to-r from-slate-100 to-blue-100 border-b border-slate-200">
                  {dayNames.map((day) => (
                    <div 
                      key={day} 
                      className="p-4 text-center font-bold text-slate-700 text-sm uppercase tracking-wide"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 bg-white">
                  {renderCalendar()}
                </div>
                
                {/* Calendar Legend removed per request */}
              </CardContent>
            </Card>




          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <Card className="border border-slate-200 shadow-md bg-white rounded-2xl">
                <CardHeader className="pb-4 bg-white border-b border-slate-200 rounded-t-2xl">
                  <CardTitle className="text-base font-semibold text-slate-900 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                      <Calendar className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <div className="text-[15px] font-bold tracking-tight">Leave Overview</div>
                      <div className="text-[11px] text-slate-500 font-medium">Balances & Requests</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 rounded-b-2xl">
                  <div className="w-full overflow-hidden">
                    <Tabs defaultValue="balances" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mx-4 mb-4 h-10 bg-slate-50 rounded-full p-1 border border-slate-200">
                        <TabsTrigger 
                          value="balances" 
                          className="text-xs font-medium px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 rounded-full transition-all duration-200"
                        >
                          Balances
                        </TabsTrigger>
                        <TabsTrigger 
                          value="requests" 
                          className="text-xs font-medium px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 rounded-full transition-all duration-200"
                        >
                          All Requests
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="balances" className="px-4 pb-5">
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                          {/* Header with Date */}
                          <div className="relative bg-slate-50 rounded-xl border border-slate-200 p-4">
                            <div className="relative z-10 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                                  <Calendar className="w-5 h-5 text-slate-700" />
                                </div>
                                <div className="leading-tight">
                                  <p className="text-xs font-semibold text-slate-700">
                                    Balances as of <span className="text-[11px] font-medium text-slate-500">Current period</span>
                                    <span className="mx-2 text-slate-300">—</span>
                                    <span className="text-[11px] font-medium text-slate-500">{asOfPeriod ? formatDate(asOfPeriod) : "Loading..."}</span>
                                  </p>
                                </div>
                              </div>
                              <div></div>
                            </div>
                          </div>

                          {/* Loading State */}
                          {loading && (
                            <div className="space-y-4">
                              {[1, 2, 3, 4].map((index) => (
                                <div 
                                  key={index} 
                                  className="relative overflow-hidden bg-white rounded-xl border border-slate-100 animate-pulse shadow-sm"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                  <div className="relative p-5">
                                    <div className="flex justify-between items-center">
                                      <div className="flex-1">
                                        <div className="h-5 bg-slate-200 rounded-lg w-3/4 mb-3"></div>
                                        <div className="flex items-center space-x-3">
                                          <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                                          <div className="h-8 bg-slate-200 rounded-lg w-16"></div>
                                          <div className="h-5 bg-slate-200 rounded-lg w-12"></div>
                                        </div>
                                      </div>
                                      <div className="w-14 h-14 bg-slate-200 rounded-xl"></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Error State */}
                          {error && !loading && (
                            <div className="relative overflow-hidden bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-5">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-200/30 to-pink-200/30 rounded-full -translate-y-8 translate-x-8"></div>
                              <div className="relative z-10">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                                    <span className="text-white text-lg font-bold">!</span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-red-800">Failed to load balances</p>
                                    <p className="text-xs text-red-600">Please try again</p>
                                  </div>
                                </div>
                                <p className="text-sm text-red-700 mb-4 leading-relaxed">
                                  Error: {error}
                                </p>
                                <Button 
                                  onClick={fetchLeaveBalance}
                                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Retry
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Data State */}
                          {!loading && !error && (
                            <div className="space-y-4">
                              {balanceData.length > 0 ? (
                                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                                  {balanceData.map((item, index) => (
                                    <div 
                                      key={index} 
                                      className={`flex items-center justify-between px-4 py-3 border-l-2 ${['border-blue-300','border-emerald-300','border-purple-300','border-amber-300','border-rose-300'][index % 5]}`}
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className={`w-2 h-2 rounded-full ${['bg-blue-500','bg-emerald-500','bg-purple-500','bg-amber-500','bg-rose-500'][index % 5]}`}></span>
                                          <p className="text-sm font-medium text-slate-900 truncate">{item.type}</p>
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-slate-500">Code: {item.leaveCode}</div>
                                      </div>
                                      <div className="shrink-0 text-right">
                                        <div className="text-sm font-semibold text-slate-900">{item.balance} {item.unitOfTime}</div>
                                        <div className="text-[11px] text-slate-500">Available</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                  <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-8 text-center">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-200/30 to-gray-200/30 rounded-full -translate-y-10 translate-x-10"></div>
                                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-gray-200/30 to-slate-200/30 rounded-full translate-y-8 -translate-x-8"></div>
                                    <div className="relative z-10">
                                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-200 to-gray-300 rounded-full flex items-center justify-center shadow-lg">
                                        <Calendar className="h-8 w-8 text-slate-500" />
                                      </div>
                                      <h3 className="text-lg font-bold text-slate-800 mb-2">No balance data</h3>
                                      <p className="text-sm text-slate-600 mb-1">Unable to load leave balances</p>
                                      <p className="text-xs text-slate-500">Please check your connection and try again</p>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="requests" className="px-4 pb-5">
                        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                          {/* Enhanced Header */}
                          <div className="relative bg-slate-50 rounded-xl border border-slate-200 p-4">
                            <div className="relative z-10 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                                  <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </div>
                                <div className="leading-tight">
                                  <p className="text-xs font-bold text-slate-800">
                                    All Requests <span className="text-[11px] font-medium text-slate-500">Your leave applications</span>
                                    {applicationsLastUpdated && (
                                      <>
                                        <span className="mx-2 text-slate-300">—</span>
                                        <span className="text-[11px] font-medium text-slate-500">{applicationsLastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={fetchLeaveApplications}
                                  disabled={applicationsLoading}
                                  className="h-8 w-8 p-0 bg-white hover:bg-slate-50 shadow-sm border border-slate-200 rounded-lg transition-all duration-200"
                                >
                                  <svg className={`h-4 w-4 text-slate-700 ${applicationsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Enhanced Error State */}
                          {applicationsError && (
                            <div className="relative overflow-hidden bg-gradient-to-r from-red-50 via-pink-50 to-rose-50 border border-red-200 rounded-xl p-5">
                              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-200/30 to-pink-200/30 rounded-full -translate-y-8 translate-x-8"></div>
                              <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-br from-pink-200/30 to-rose-200/30 rounded-full translate-y-6 -translate-x-6"></div>
                              <div className="relative z-10">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-red-800">Failed to load requests</p>
                                    <p className="text-xs text-red-600">Please try again</p>
                                  </div>
                                </div>
                                <p className="text-sm text-red-700 mb-4 leading-relaxed">
                                  Unable to fetch leave requests. This might be due to network issues or server problems.
                                </p>
                                <Button 
                                  onClick={fetchLeaveApplications}
                                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Retry
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Enhanced Loading State */}
                          {applicationsLoading && (
                            <div className="space-y-4">
                              {[1, 2, 3].map((index) => (
                                <div 
                                  key={index} 
                                  className="relative overflow-hidden bg-white rounded-xl border border-slate-100 animate-pulse shadow-sm"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                  <div className="relative p-5">
                                    <div className="flex items-start space-x-4">
                                      <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                                      <div className="flex-1 space-y-3">
                                        <div className="h-4 bg-slate-200 rounded-lg w-3/4"></div>
                                        <div className="h-3 bg-slate-200 rounded-lg w-1/2"></div>
                                        <div className="flex items-center justify-between">
                                          <div className="h-6 bg-slate-200 rounded-lg w-20"></div>
                                          <div className="h-6 bg-slate-200 rounded-lg w-24"></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Enhanced Data State */}
                          {!applicationsLoading && !applicationsError && (
                            <div className="space-y-4">
                              {recentRequests.length > 0 ? (
                                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                                  {recentRequests.map((request: any, index: number) => (
                                    <div 
                                      key={request.id} 
                                      className={`px-4 py-3 flex items-center justify-between border-l-2 ${['border-blue-300','border-emerald-300','border-purple-300','border-amber-300','border-rose-300'][index % 5]}`}
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2" title={request.dates}>
                                          <span className={`w-2 h-2 rounded-full ${['bg-blue-500','bg-emerald-500','bg-purple-500','bg-amber-500','bg-rose-500'][index % 5]}`}></span>
                                          <p className="text-xs font-medium text-slate-700 truncate">
                                            {request.dates}
                                          </p>
                                        </div>
                                        <div className="mt-1 text-[11px] text-slate-500 truncate">{request.type}</div>
                                      </div>
                                      <div className="shrink-0 text-right flex items-center gap-3">
                                        <div className="text-right">
                                          <div className="text-sm font-semibold text-slate-900">{request.days} Day{request.days !== 1 ? 's' : ''}</div>
                                          <div className="text-[11px] text-slate-500">{request.status}</div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          className="h-7 px-3 text-[11px]"
                                          onClick={() => {
                                            const app = (leaveApplications || []).find((a: any) => (a._id || a.id) === request.id)
                                            if (app) {
                                              setSelectedApplicationForView(app)
                                              setShowRequestView(true)
                                            }
                                          }}
                                        >
                                          View
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-8 text-center">
                                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-200/30 to-gray-200/30 rounded-full -translate-y-10 translate-x-10"></div>
                                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-gray-200/30 to-slate-200/30 rounded-full translate-y-8 -translate-x-8"></div>
                                  <div className="relative z-10">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-200 to-gray-300 rounded-full flex items-center justify-center shadow-lg">
                                      <Calendar className="h-8 w-8 text-slate-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">No requests yet</h3>
                                    <p className="text-sm text-slate-600 mb-1">You haven't submitted any leave requests</p>
                                    <p className="text-xs text-slate-500">Your leave applications will appear here once submitted</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>


            </div>
          </div>
        </div>
      </div>

      {/* Request Absence Modal */}
      <RequestAbsenceModal
        selectedEmployeeId={selectedEmployeeId}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedDates={currentMonthSelectedDays}
        selectedFullDates={selectedFullDates}
        currentDate={currentDate}
        onDateDelete={(dateToDelete) => {
          const toRemove = new Date(currentDate.getFullYear(), currentDate.getMonth(), dateToDelete).toDateString()
          const sortedDates = [...selectedFullDates].sort((a, b) => a.getTime() - b.getTime())
          const isStartDate = sortedDates[0].toDateString() === toRemove
          const isEndDate = sortedDates[sortedDates.length - 1].toDateString() === toRemove
          const canDeselect = isStartDate || isEndDate || selectedFullDates.length <= 1

          if (canDeselect) {
            setSelectedFullDates(selectedFullDates.filter(d => d.toDateString() !== toRemove))
          }
        }}
        preferredMultiDateMode={preferredMultiDateMode || undefined}
      />

      {/* View Request Modal */}
      <Dialog open={showRequestView} onOpenChange={setShowRequestView}>
        <DialogContent className="sm:max-w-3xl p-0 gap-0 bg-white rounded-lg shadow-xl">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-slate-900">Request Details</DialogTitle>
          </div>
          <div className="p-4 max-h-[70vh] overflow-y-auto">
            {selectedApplicationForView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[11px] text-slate-500">From / To</div>
                    <div className="text-sm font-medium text-slate-900">
                      {formatDate(selectedApplicationForView.fromDate)} / {formatDate(selectedApplicationForView.toDate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Status</div>
                    <div className="text-sm font-medium text-slate-900">{selectedApplicationForView.workflowState || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Employee ID</div>
                    <div className="text-sm text-slate-900">{selectedApplicationForView.employeeID}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Applied Date</div>
                    <div className="text-sm text-slate-900">{formatDate(selectedApplicationForView.appliedDate || selectedApplicationForView.createdOn)}</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-700">Leaves</div>
                  <div className="divide-y divide-slate-200">
                    {(selectedApplicationForView.leaves || []).map((lv: any, idx: number) => (
                      <div key={idx} className="px-4 py-2 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 truncate">{lv.leaveCode}</div>
                          <div className="text-[11px] text-slate-500">{formatDate(lv.date)} · {lv.duration}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedApplicationForView.remarks && (
                  <div>
                    <div className="text-[11px] text-slate-500 mb-1">Remarks</div>
                    <div className="text-sm text-slate-900 whitespace-pre-wrap break-words bg-slate-50 border border-slate-200 rounded-lg p-3">
                      {selectedApplicationForView.remarks}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Multi-date choice prompt */}
      <Dialog open={showMultiDatePrompt} onOpenChange={setShowMultiDatePrompt}>
        <DialogContent className="sm:max-w-md p-0 gap-0 bg-white rounded-lg shadow-xl">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-base font-semibold text-slate-900">Multiple dates selected</DialogTitle>
            <DialogDescription className="sr-only">Apply your request to all selected dates</DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            <p className="text-sm text-slate-700">The same leave will be applied to all selected dates.</p>
            <div className="flex justify-center">
              <Button
                className="px-8"
                onClick={() => {
                  setPreferredMultiDateMode("all")
                  // Expand to full continuous range between earliest and latest selected dates across months/years
                  if (selectedFullDates.length >= 2) {
                    const sorted = [...selectedFullDates].sort((a,b) => a.getTime() - b.getTime())
                    const start = new Date(sorted[0].getFullYear(), sorted[0].getMonth(), sorted[0].getDate())
                    const end = new Date(sorted[sorted.length - 1].getFullYear(), sorted[sorted.length - 1].getMonth(), sorted[sorted.length - 1].getDate())
                    const range: Date[] = []
                    const cursor = new Date(start)
                    while (cursor.getTime() <= end.getTime()) {
                      // Skip dates that have already applied leave
                      if (!hasAppliedLeave(cursor.getDate(), cursor.getMonth(), cursor.getFullYear())) {
                        range.push(new Date(cursor))
                      }
                      cursor.setDate(cursor.getDate() + 1)
                    }
                    // De-duplicate with any existing selections outside the range if needed
                    setSelectedFullDates(range)
                  }
                  setShowMultiDatePrompt(false)
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EmpFilter Popup */}
      <EmpFilter
        isOpen={isEmpFilterOpen}
        onClose={handleCloseEmpFilter}
        onEmployeeSelect={handleEmployeeSelect}
        preSelectedEmployeeId={(() => {
          const selfAllowed = Boolean((permissions as any)?.self)
          const allAllowed = Boolean((permissions as any)?.all)
          // When only ALL is allowed (self=false), don't preselect but allow selection
          if (allAllowed && !selfAllowed) return undefined
          return undefined
        })()}
      />
    </div>
  )
}