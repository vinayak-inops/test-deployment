"use client"

import React, { useState, useEffect, useMemo } from "react"
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, User } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { cn } from "@repo/ui/lib/utils"  
import { RequestAbsenceModal } from "./request-absence-modal"
import EmpFilter from "./emp-filter"
import { useLeaveApplications } from "../../../hooks/useLeaveApplications"
import { useLeaveBalances } from "../../../hooks/useLeaveBalances"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useAdminRole } from '@inops/store/src/hooks/useAdminRole'
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
  const [selectedDates, setSelectedDates] = useState<number[]>([])
  const [showModal, setShowModal] = useState(false)
  const [empStatues, setEmpStatues] = useState(false)
  const [isClient, setIsClient] = useState(false);
  const [allowedServices, setAllowedServices] = useState<any[]>([]);
  const [leaveService, setleaveService] = useState<any>(null);
  const  tenantCode  = useGetTenantCode();
  const contractorEmployee = "leaveManagement"

  // If leave not allowed, softly redirect to launchdesk
  const { adminRole, adminUser, setAdminRoleData, setAdminUserData } = useAdminRole();

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

  // Load allowed services from Redux only
  useEffect(() => {
    setIsClient(true);

    if (adminRole?.screenPermissions) {
      setAllowedServices(adminRole.screenPermissions);
    } else {
      setAllowedServices([]);
    }
  }, [adminRole]);

  // If leave not allowed, softly redirect to launchdesk
  useEffect(() => {
    if (!isClient) return;

    const leave = allowedServices.find((service: any) => service.serviceName === 'leave');
    setleaveService(leave);
    if (!leave) {
      // router.replace('/launchdesk');
    }
  }, [isClient, allowedServices]);

  useEffect(() => {
    const empStatues = leaveService?.screens.find((screen: any) => screen.screenName === `${contractorEmployee}`)?.permissions[`empFilterNewLeaveRequest`];
    
    setEmpStatues(empStatues)
    
    // If empStatues is true, automatically open the EmpFilter popup
    if (empStatues) {
      setIsEmpFilterOpen(true)
    }
    // If empStatues is undefined, automatically set the employee ID from storedRoleInfo
    else if (!empStatues && storedRoleInfo?.employeeId) {
      setSelectedEmployeeId(storedRoleInfo.employeeId)
    }
  }, [contractorEmployee, leaveService, storedRoleInfo])

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
    dependencies: []
  });

  useEffect(() => {
    setApplicationsLoadingState(true)
    fetchLeaveApplications()
  }, [])

  // Update loading state based on API call
  useEffect(() => {
    setApplicationsLoadingState(isLoadingLeaveApplications)
  }, [isLoadingLeaveApplications])

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
  const recentRequests = leaveApplications.slice(0, 5).map((app: any, index: number) => ({
    id: app._id || index,
    type: getLeaveSummary(app.leaves),
    dates: `${formatDate(app.fromDate)} - ${formatDate(app.toDate)}`,
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
      const isSelected = selectedDates.includes(day)
      const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()
      const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6
      
      // Get leave data for this date
      const leaveData = getLeaveDataForDate(day, currentDate.getMonth(), currentDate.getFullYear())

      days.push(
        <div
          key={day}
          className={cn(
            "h-28 border-r border-b border-slate-100 p-3 cursor-pointer transition-all duration-200 relative group",
            "hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:shadow-sm",
            isSelected && "bg-gradient-to-br from-blue-100 to-indigo-100 shadow-md",
            isWeekend && "bg-slate-25/50",
            isToday && !isSelected && "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
          )}
          onClick={() => {
            if (isSelected) {
              setSelectedDates(selectedDates.filter((d) => d !== day))
            } else {
              setSelectedDates([...selectedDates, day])
            }
          }}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <div
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
                  "group-hover:scale-110",
                  isSelected && "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg",
                  isToday && !isSelected && "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md",
                  !isSelected && !isToday && "text-slate-700 hover:bg-slate-200"
                )}
              >
                {day}
              </div>
              {isToday && (
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              )}
            </div>
            
            {/* Leave Information Display */}
            {leaveData.length > 0 && (
              <div className="flex-1 space-y-1 overflow-y-auto max-h-16">
                {leaveData.map((leave, index) => (
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
    setShowModal(true)
  }

  // Handle employee selection from EmpFilter
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    setIsEmpFilterOpen(false)
  }

  // Handle opening EmpFilter popup
  const handleOpenEmpFilter = () => {
    setIsEmpFilterOpen(true)
  }

  // Handle closing EmpFilter popup
  const handleCloseEmpFilter = () => {
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
                  onClick={() => setSelectedEmployeeId("")}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      <p className="text-sm text-slate-600 mt-1">Select your leave dates</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => navigateMonth("next")}
                      className="hover:bg-white/80 hover:shadow-sm transition-all duration-200"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Selected Dates Section - Beside Month/Year */}
                  {selectedDates.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-3 min-w-64">
                      <div className="text-center mb-2">
                        <h3 className="text-xs font-semibold text-slate-900 flex items-center justify-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          <span>Selected Dates</span>
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {selectedDates
                          .sort((a, b) => a - b)
                          .map((date) => (
                            <Badge 
                              key={date} 
                              variant="secondary" 
                              className="bg-white/80 text-blue-800 px-2 py-1 text-xs font-medium shadow-sm border border-blue-200 hover:bg-white transition-all duration-200"
                            >
                              {monthNames[currentDate.getMonth()]} {date}
                              <button
                                onClick={() => setSelectedDates(selectedDates.filter((d) => d !== date))}
                                className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full w-3 h-3 flex items-center justify-center transition-all duration-200 text-xs"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                      </div>
                      <div className="text-center mt-1.5">
                        <p className="text-xs text-slate-600 font-medium">
                          Total: <span className="text-blue-600 font-bold">{selectedDates.length}</span> day{selectedDates.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Submit Request Button - Beside Selected Dates */}
                  {selectedDates.length > 0 && (
                    <Button
                      onClick={handleSubmitRequest}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 text-sm shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 h-auto"
                    >
                      Submit Request ({selectedDates.length})
                    </Button>
                  )}
                  

                </div>
              </CardHeader>
              <CardContent className="p-0">
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
                
                {/* Calendar Legend */}
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <div className="flex flex-col space-y-3">
                    {/* Calendar indicators */}
                    <div className="flex items-center justify-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded border border-blue-200"></div>
                        <span className="text-slate-600">Selected</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded border border-amber-200"></div>
                        <span className="text-slate-600">Today</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-slate-25/50 rounded border border-slate-200"></div>
                        <span className="text-slate-600">Weekend</span>
                      </div>
                    </div>
                    
                    {/* Leave status indicators */}
                    <div className="flex items-center justify-center space-x-4 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-50 border border-green-200 rounded shadow-sm"></div>
                        <span className="text-slate-600">Approved</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded shadow-sm"></div>
                        <span className="text-slate-600">Initiated</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-teal-50 border border-teal-200 rounded shadow-sm"></div>
                        <span className="text-slate-600">Validated</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-50 border border-red-200 rounded shadow-sm"></div>
                        <span className="text-slate-600">Rejected</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded shadow-sm"></div>
                        <span className="text-slate-600">Pending</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>




          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-100">
                  <CardTitle className="text-lg font-semibold text-slate-900 flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-base font-bold">Leave Overview</div>
                      <div className="text-xs text-slate-600 font-normal">Balances & Requests</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full overflow-hidden">
                    <Tabs defaultValue="balances" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mx-6 mb-6 h-12 bg-slate-100 rounded-lg p-1">
                        <TabsTrigger 
                          value="balances" 
                          className="text-sm font-medium px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-md transition-all duration-200"
                        >
                          Balances
                        </TabsTrigger>
                        <TabsTrigger 
                          value="requests" 
                          className="text-sm font-medium px-3 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-md transition-all duration-200"
                        >
                          Requests
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="balances" className="px-6 pb-6">
                        <div className="space-y-4">
                          {/* Header with Date */}
                          <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-100 p-4">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full -translate-y-10 translate-x-10"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full translate-y-8 -translate-x-8"></div>
                            <div className="relative z-10 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                                  <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">Balances as of</p>
                                  <p className="text-xs text-slate-600">Current period</p>
                                </div>
                              </div>
                              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-blue-200">
                                <span className="text-sm font-bold text-blue-700">
                                  {asOfPeriod ? formatDate(asOfPeriod) : "Loading..."}
                                </span>
                              </div>
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
                                balanceData.map((item, index) => {
                                  // Define color schemes for different leave types
                                  const colorSchemes = [
                                    { bg: 'from-blue-500 to-indigo-600', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
                                    { bg: 'from-green-500 to-emerald-600', badge: 'bg-green-50 text-green-700 border-green-200' },
                                    { bg: 'from-purple-500 to-violet-600', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
                                    { bg: 'from-orange-500 to-amber-600', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
                                    { bg: 'from-pink-500 to-rose-600', badge: 'bg-pink-50 text-pink-700 border-pink-200' }
                                  ];
                                  
                                  const colorScheme = colorSchemes[index % colorSchemes.length];
                                  
                                  return (
                                    <div 
                                      key={index} 
                                      className="group relative overflow-hidden bg-white rounded-xl border border-slate-100 hover:shadow-xl transition-all duration-300 hover:border-blue-200 transform hover:scale-[1.02]"
                                    >
                                      {/* Background decoration */}
                                      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colorScheme.bg} opacity-5 rounded-full -translate-y-10 translate-x-10 group-hover:opacity-10 transition-opacity duration-300`}></div>
                                      
                                      <div className="relative p-5">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-3 mb-3">
                                              <p className="text-sm font-bold text-slate-900 leading-tight truncate">{item.type}</p>
                                              <Badge variant="outline" className={`text-xs font-semibold ${colorScheme.badge} shadow-sm`}>
                                                {item.leaveCode}
                                              </Badge>
                                            </div>
                                            
                                            <div className="space-y-2">
                                              <div className="flex items-center space-x-3">
                                                <div className={`w-3 h-3 bg-gradient-to-br ${colorScheme.bg} rounded-full shadow-sm`}></div>
                                                <div className="flex items-baseline space-x-2">
                                                  <span className="text-2xl font-bold text-slate-900">{item.balance}</span>
                                                  <span className="text-sm font-medium text-slate-600">{item.unitOfTime}</span>
                                                </div>
                                              </div>
                                              
                                              {/* Progress bar for visual appeal */}
                                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div 
                                                  className={`h-full bg-gradient-to-r ${colorScheme.bg} rounded-full transition-all duration-500 ease-out`}
                                                  style={{ width: `${Math.min((item.balance / 20) * 100, 100)}%` }}
                                                ></div>
                                              </div>
                                              
                                              {/* Additional info */}
                                              <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span>Available balance</span>
                                                <span className="font-medium">{item.balance} {item.unitOfTime}</span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Right side icon */}
                                          <div className={`w-16 h-16 bg-gradient-to-br ${colorScheme.bg} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                                            <span className="text-xl font-bold text-white">{item.balance}</span>
                                          </div>
                                        </div>
                                        
                                        {/* Hover effect overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                      </div>
                                    </div>
                                  );
                                })
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

                      <TabsContent value="requests" className="px-6 pb-6">
                        <div className="space-y-4">
                          {/* Enhanced Header */}
                          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-xl border border-emerald-100 p-4">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-200/30 to-teal-200/30 rounded-full -translate-y-10 translate-x-10"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full translate-y-8 -translate-x-8"></div>
                            <div className="relative z-10 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800">Recent Requests</p>
                                  <p className="text-xs text-slate-600">Your leave applications</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {applicationsLastUpdated && (
                                  <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-emerald-200">
                                    <span className="text-xs font-medium text-emerald-700">
                                      {applicationsLastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={fetchLeaveApplications}
                                  disabled={applicationsLoading}
                                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white shadow-sm border border-emerald-200 rounded-lg transition-all duration-200 hover:scale-105"
                                >
                                  <svg className={`h-4 w-4 text-emerald-600 ${applicationsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                recentRequests.map((request: any) => {
                                  // Define status configurations
                                  const statusConfig = {
                                    APPROVED: {
                                      bg: 'from-green-500 to-emerald-600',
                                      badge: 'bg-green-50 text-green-700 border-green-200',
                                      icon: '✓',
                                      iconBg: 'from-green-500 to-emerald-600'
                                    },
                                    VALIDATED: {
                                      bg: 'from-teal-500 to-cyan-600',
                                      badge: 'bg-teal-50 text-teal-700 border-teal-200',
                                      icon: '✓',
                                      iconBg: 'from-teal-500 to-cyan-600'
                                    },
                                    INITIATED: {
                                      bg: 'from-blue-500 to-indigo-600',
                                      badge: 'bg-blue-50 text-blue-700 border-blue-200',
                                      icon: '⏳',
                                      iconBg: 'from-blue-500 to-indigo-600'
                                    },
                                    REJECTED: {
                                      bg: 'from-red-500 to-pink-600',
                                      badge: 'bg-red-50 text-red-700 border-red-200',
                                      icon: '✗',
                                      iconBg: 'from-red-500 to-pink-600'
                                    }
                                  };
                                  
                                  const config = statusConfig[request.status as keyof typeof statusConfig] || {
                                    bg: 'from-slate-500 to-gray-600',
                                    badge: 'bg-slate-50 text-slate-700 border-slate-200',
                                    icon: '?',
                                    iconBg: 'from-slate-500 to-gray-600'
                                  };
                                  
                                  return (
                                    <div 
                                      key={request.id} 
                                      className="group relative overflow-hidden bg-white rounded-xl border border-slate-100 hover:shadow-xl transition-all duration-300 hover:border-emerald-200 transform hover:scale-[1.02]"
                                    >
                                      {/* Background decoration */}
                                      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${config.bg} opacity-5 rounded-full -translate-y-10 translate-x-10 group-hover:opacity-10 transition-opacity duration-300`}></div>
                                      
                                      <div className="relative p-5">
                                        <div className="flex items-start space-x-4">
                                          {/* Status Icon */}
                                          <div className={`w-12 h-12 bg-gradient-to-br ${config.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                                            <span className="text-white font-bold text-lg">{config.icon}</span>
                                          </div>
                                          
                                          <div className="flex-1 min-w-0">
                                            {/* Date Range */}
                                            <div className="flex items-center space-x-2 mb-2">
                                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                              <p className="text-sm font-bold text-slate-900 truncate">{request.dates}</p>
                                            </div>
                                            
                                            {/* Leave Type */}
                                            <p className="text-sm text-slate-600 mb-3 leading-relaxed">{request.type}</p>
                                            
                                            {/* Bottom Row */}
                                            <div className="flex items-center justify-between">
                                              {/* Days Badge */}
                                              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                                                <span className="text-xs font-bold text-slate-700">
                                                  {request.days} Day{request.days !== 1 ? "s" : ""}
                                                </span>
                                              </div>
                                              
                                              {/* Status Badge */}
                                              <Badge 
                                                variant="outline"
                                                className={`text-xs font-bold border-2 transition-all duration-300 shadow-sm ${config.badge}`}
                                              >
                                                {request.status}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Hover effect overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                      </div>
                                    </div>
                                  );
                                })
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
        selectedDates={selectedDates}
        currentDate={currentDate}
        onDateDelete={(dateToDelete) => setSelectedDates(selectedDates.filter((d) => d !== dateToDelete))}
      />

      {/* EmpFilter Popup */}
      <EmpFilter
        isOpen={isEmpFilterOpen}
        onClose={handleCloseEmpFilter}
        onEmployeeSelect={handleEmployeeSelect}
        preSelectedEmployeeId={empStatues ? undefined : undefined}
      />
    </div>
  )
}
