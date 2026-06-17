"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, User } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table"
import { Badge } from "@repo/ui/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@repo/ui/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Label } from "@repo/ui/components/ui/label"
import BigPopupWrapper from "@repo/ui/components/popupwrapper/big-popup-wrapper"
import LeaveOfAbsencePopup from "./leave-of-absence-popup"
import EmpFilter from "./emp-filter"
import { usePostRequest } from '@repo/ui/hooks/api/usePostRequest';
import { useRequest } from '@repo/ui/hooks/api/useGetRequest';
import { useSession } from 'next-auth/react';
import { ToastContainer, toast } from 'react-toastify';
import { useAdminRole } from '@inops/store/src/hooks/useAdminRole'
import { useMessage } from "../../../hooks/useMessage";
import { useGetTenantCode } from '@/hooks/api/serach/useGetTenantCode'

// Type definitions for the leave of absence application data
interface LeaveOfAbsenceApplication {
  _id: string
  tenantCode: string
  workflowName: string
  uploadedBy: string
  createdOn: string
  employeeID: string
  typeOfAbsence: string
  lastDayOfWork: string
  firstDayOfAbsence: string
  estimatedLastDayOfAbsence: string
  actualReturnDate?: string
  uploadTime: string
  organizationCode: string
  appliedDate: string
  workflowState: string
  commentToApprover: string
  reason: string
  childsBirthDate?: string
  adoptionPlacementDate?: string
  totalDays: number
}

interface ViewLeaveOfAbsenceProps {
  data?: LeaveOfAbsenceApplication[]
  onBack?: () => void
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

const ViewLeaveOfAbsence: React.FC<ViewLeaveOfAbsenceProps> = ({ data: propData, onBack }) => {
  const [data, setData] = useState<LeaveOfAbsenceApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
    const empStatues = leaveService?.screens.find((screen: any) => screen.screenName === `${contractorEmployee}`)?.permissions[`empFilterLeaveApplicationsOfLeaveOfAbsence`];
    
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Popup state
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedApplicationForPopup, setSelectedApplicationForPopup] = useState<LeaveOfAbsenceApplication | null>(null)

  // Cancel modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("")
  const [cancelComment, setCancelComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // EmpFilter popup state
  const [isEmpFilterOpen, setIsEmpFilterOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")

  // Get session for authentication
  const { data: session } = useSession();


  // Use the post request hook for cancel submissions
  const {
    post: postCancel,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "specialLeaveApplication", // Relative URL, base URL handled by hook
    onSuccess: (data) => {
      toast.success('Leave of absence application cancelled successfully!');
      
      // Update the local state to reflect the cancellation
      setData(prevData => 
        prevData.map(app => 
          app._id === selectedApplicationId 
            ? { ...app, workflowState: 'CANCELLED' }
            : app
        )
      )

      // Close modal and reset state
      setIsCancelModalOpen(false)
      setCancelComment("")
      setSelectedApplicationId("")
    },
    onError: (error) => {
      console.error("Cancel submission failed:", error);
      let errorMessage = "Failed to cancel leave of absence application. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error: Unable to connect to the server. Please check your internet connection.";
        } else if (error.message.includes('CORS')) {
          errorMessage = "CORS error: The server is not allowing requests from this origin.";
        } else if (error.message.includes('401')) {
          errorMessage = "Authentication error: Your session may have expired. Please log in again.";
        } else if (error.message.includes('403')) {
          errorMessage = "Authorization error: You don't have permission to perform this action.";
        } else if (error.message.includes('500')) {
          errorMessage = "Server error: The server encountered an internal error. Please try again later.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    },
  });

  // API call for leave of absence applications data
  const {
    data: leaveOfAbsenceResponse,
    loading: isLoadingLeaveOfAbsence,
    error: leaveOfAbsenceError,
    refetch: fetchLeaveOfAbsenceApplications
  } = useRequest<any>({
    url: 'specialLeaveApplication/search',
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
      },
    ],
    onSuccess: (data: any) => {
      
      // Handle different possible response structures
      let apiData: any[]
      
      // If the response is directly an array of leave of absence applications
      if (Array.isArray(data)) {
        apiData = data
      }
      // If the response is wrapped in a data property (single object or array)
      else if (data.data) {
        if (Array.isArray(data.data)) {
          apiData = data.data
        } else {
          // If data is a single object, wrap it in an array
          apiData = [data.data]
        }
      }
      // If the response has applications property
      else if (data.applications && Array.isArray(data.applications)) {
        apiData = data.applications
      }
      // If none of the above, throw error
      else {
        throw new Error('API response does not contain expected leave of absence application data')
      }

      // Normalize the data to match our interface based on the actual API structure
      const normalizedData: LeaveOfAbsenceApplication[] = apiData.map((item: any) => {
        
        return {
          _id: item._id || item.id || '',
          tenantCode: item.tenantCode || item.tenant || '',
          workflowName: item.workflowName || item.workflow || 'Leave Application',
          uploadedBy: item.uploadedBy || item.createdBy || item.user || '',
          createdOn: item.createdOn || item.createdAt || item.dateCreated || '',
          employeeID: item.employeeID || item.employeeId || item.empId || item.employee || '',
          typeOfAbsence: item.leaveTitle || item.typeOfAbsence || item.absenceType || item.leaveType || item.type || '',
          lastDayOfWork: item.lastDayOfWork || item.lastWorkingDay || item.lastWorkDay || '',
          firstDayOfAbsence: item.fromDate || item.firstDayOfAbsence || item.absenceStartDate || item.startDate || '',
          estimatedLastDayOfAbsence: item.toDate || item.estimatedLastDayOfAbsence || item.absenceEndDate || item.endDate || '',
          actualReturnDate: item.actualReturnDate || item.returnDate || item.actualEndDate || undefined,
          uploadTime: item.uploadTime || item.uploadedAt || item.createdAt || '',
          organizationCode: item.organizationCode || item.orgCode || item.organization || '',
          appliedDate: item.appliedDate || item.applicationDate || item.dateApplied || '',
          workflowState: item.workflowState || item.status || item.state || '',
          commentToApprover: item.approverComment || item.commentToApprover || item.comments || item.remarks || '',
          reason: item.remarks || item.reason || item.purpose || item.description || '',
          childsBirthDate: item.DOBOfChild || item.childsBirthDate || item.childBirthDate || item.birthDate || undefined,
          adoptionPlacementDate: item.AdoptionPlacementDate || item.adoptionPlacementDate || item.adoptionDate || undefined,
          totalDays: parseInt(item.noOfDays) || item.totalDays || item.days || item.duration || 0
        }
      })

      setData(normalizedData)
      setLoading(false)
    },
    onError: (error: Error) => {
      console.error("Error fetching leave of absence applications data:", error);
      setError(error.message)
      setLoading(false)
    },
    dependencies: []
  });

  const { showMessage } = useMessage();

  useEffect(() => {
    // If prop data is provided, use it; otherwise fetch from API
    if (propData && propData.length > 0) {
      setData(propData)
      setLoading(false)
    } else {
      fetchLeaveOfAbsenceApplications()
    }
  }, [propData])

  const getStatusBadgeVariant = (status: string | undefined) => {
    if (!status) return 'outline';
    
    switch (status.toUpperCase()) {
      case 'INITIATED':
        return 'default'
      case 'PENDING':
        return 'secondary'
      case 'APPROVED':
        return 'secondary'
      case 'REJECTED':
        return 'destructive'
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Handle cancel application
  const handleCancelApplication = async (applicationId: string) => {
    setSelectedApplicationId(applicationId)
    setCancelComment("")
    setIsCancelModalOpen(true)
  }

  // Handle submit cancel with comment
  const handleSubmitCancel = async () => {
    if (!cancelComment.trim()) {
      toast.error('Please enter a comment before cancelling.');
      return;
    }

    setIsSubmitting(true)
    try {
      // Find the selected application
      const selectedApplication = data.find(app => app._id === selectedApplicationId);

      if (!selectedApplication) {
        toast.error('Application not found');
        setIsSubmitting(false);
        return;
      }

      // Create the cancel payload following the same structure as managerApprovals.tsx
      const cancelPayload = {
        tenant: tenantCode,
        action: "update",
        collectionName: "specialLeaveApplication",
        id: selectedApplicationId,
        event: "applicationFinal",
        data: {
          ...selectedApplication,
          _id: selectedApplicationId,
          approvalComment: cancelComment.trim(),
          workflowState: "CANCELLED",
          approvedBy: session?.user?.name || "user",
          approvedOn: new Date().toISOString(),
          stateEvent: "USERCANCEL"
        }
      };


      // Submit the cancel using the hook
      await postCancel(cancelPayload);

    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel leave of absence application. Please try again.');
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle cancel modal close
  const handleCancelModalClose = () => {
    setIsCancelModalOpen(false)
    setCancelComment("")
    setSelectedApplicationId("")
  }



  const formatDate = (dateString: string) => {
    try {
      // Handle dd-mm-yyyy format (like "18-06-2025")
      if (dateString.includes('-') && dateString.split('-').length === 3 && dateString.length === 10) {
        const parts = dateString.split('-')
        // Check if it's dd-mm-yyyy format (first part is day)
        if (parseInt(parts[0]) <= 31) {
          const [day, month, year] = parts
          return `${day}-${month}-${year}`
        }
        // Check if it's yyyy-mm-dd format (first part is year)
        else if (parseInt(parts[0]) > 2000) {
          const [year, month, day] = parts
          return `${day}-${month}-${year}`
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

  const calculateTotalDays = (firstDay: string, lastDay: string) => {
    try {
      const start = new Date(firstDay)
      const end = new Date(lastDay)
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0
      }
      
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays + 1 // Include both start and end dates
    } catch {
      return 0
    }
  }

  // --- Stats for beautification ---
  const totalApplications = data?.length || 0;
  const totalDays = data?.reduce((sum, app) => sum + (app.totalDays || 0), 0) || 0;
  const uniqueAbsenceTypes = data ? Array.from(new Set(data.map(app => app.typeOfAbsence))).length : 0;
  const mostRecentAppliedDate = data && data.length > 0 ? 
    data.reduce((latestApp, app) => {
      const currentDate = new Date(app.appliedDate);
      const latestDate = new Date(latestApp.appliedDate);
      return currentDate > latestDate ? app : latestApp;
    }, data[0]).appliedDate : null;

  // --- Search/filter state ---
  const [search, setSearch] = useState("")
  const filteredData = data?.filter(app => {
    // Apply search filter
    const matchesSearch = (app.employeeID?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (app.typeOfAbsence?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (app.reason?.toLowerCase() || '').includes(search.toLowerCase())
    
    // Apply employee filter if selected
    const matchesEmployee = !selectedEmployeeId || app.employeeID === selectedEmployeeId
    
    return matchesSearch && matchesEmployee
  }) || []

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show pages around current page
      const start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      const end = Math.min(totalPages, start + maxVisiblePages - 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  const handleViewStatus = (application: LeaveOfAbsenceApplication) => {
    setSelectedApplicationForPopup(application)
    setIsPopupOpen(true)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex items-center justify-center" style={{ width: '1200px', margin: '0 auto' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leave of absence applications...</p>
        </div>
      </div>
    )
  }

  if (error && (!data || data.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6" style={{ width: '1200px', margin: '0 auto' }}>
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-gray-100">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Leave Applications of Leave of Absence
                </h1>
                <p className="text-gray-600 mt-1 text-base">
                  View all leave of absence applications
                  {selectedEmployeeId && (
                    <span className="text-blue-600 ml-2 font-medium">
                      - Employee ID: {selectedEmployeeId}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {/* Right side: filter/export buttons */}
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
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <p className="text-gray-600 mb-4">Using sample data for demonstration</p>
              <Button onClick={fetchLeaveOfAbsenceApplications} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6" style={{ width: '1200px', margin: '0 auto' }}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Leave Applications of Leave of Absence
              </h1>
              <p className="text-gray-600 mt-1 text-base">View all leave of absence applications</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">Total Applications</p>
                  <p className="text-2xl font-bold">{totalApplications}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs font-medium">Total Days Applied</p>
                  <p className="text-2xl font-bold">{totalDays}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs font-medium">Unique Absence Types</p>
                  <p className="text-2xl font-bold">{uniqueAbsenceTypes}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs font-medium">Most Recent Applied</p>
                  <p className="text-base font-bold">{mostRecentAppliedDate ? formatDate(mostRecentAppliedDate) : '-'}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input
                  type="text"
                  placeholder="Search by Employee ID, Absence Type, or Reason..."
                  className="pl-10 h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-md w-full"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {selectedEmployeeId && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">
                    Filtered by: {selectedEmployeeId}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Leave of Absence Applications</CardTitle>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentData.length > 0) {
                      handleViewStatus(currentData[0])
                    }
                  }}
                  className="h-8 px-3 text-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                >
                  View Status
                </Button>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {filteredData.length} Records
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="font-semibold text-gray-700 w-[200px] text-sm">Employee ID</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm">Type of Absence</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm">Last Day of Work</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm">Absence Period</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm">Total Days</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm">Applied Date</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-sm">Reason</TableHead>
                    {/* <TableHead className="font-semibold text-gray-700 text-sm">Actions</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((application) => (
                    <TableRow key={application._id} className="hover:bg-gray-50/50 transition-all duration-200 group">
                      <TableCell className="font-medium text-gray-900 text-sm">
                        {application.employeeID || '-'}
                      </TableCell>
                      <TableCell className="text-gray-700 text-sm">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {application.typeOfAbsence || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 text-sm">
                        {formatDate(application.lastDayOfWork)}
                      </TableCell>
                      <TableCell className="text-gray-700 text-sm">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {formatDate(application.firstDayOfAbsence)} - {formatDate(application.estimatedLastDayOfAbsence)}
                          </div>
                          {application.actualReturnDate && (
                            <div className="text-xs text-green-600">
                              Actual Return: {formatDate(application.actualReturnDate)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 text-sm">
                        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                          {application.totalDays || calculateTotalDays(application.firstDayOfAbsence, application.estimatedLastDayOfAbsence)} days
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 text-sm">
                        {formatDate(application.appliedDate)}
                      </TableCell>
                      <TableCell className="text-gray-700 text-sm">
                        <Badge variant={getStatusBadgeVariant(application.workflowState)}>
                          {application.workflowState || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-700 text-sm">
                        {application.reason || '-'}
                      </TableCell>
                      {/* <TableCell className="text-gray-700 text-sm">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelApplication(application._id)}
                            disabled={application.workflowState?.toUpperCase() === 'APPROVED' || application.workflowState?.toUpperCase() === 'CANCELLED'}
                            className={`h-8 px-3 text-xs ${
                              application.workflowState?.toUpperCase() === 'APPROVED' || application.workflowState?.toUpperCase() === 'CANCELLED'
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300'
                            }`}
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* First Page Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Previous Page Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="h-8 w-8 p-0 text-sm"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Next Page Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  {/* Last Page Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Leave of Absence Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this leave of absence application? Please provide a reason for cancellation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cancel-comment" className="text-right">
                Comment
              </Label>
              <Textarea
                id="cancel-comment"
                placeholder="Enter reason for cancellation..."
                value={cancelComment}
                onChange={(e) => setCancelComment(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelModalClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmitCancel}
              disabled={isSubmitting || !cancelComment.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave of Absence Popup */}
      <LeaveOfAbsencePopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false)
          setSelectedApplicationForPopup(null)
        }}
        leaveOfAbsenceApplications={data}
        initialSelectedApplication={selectedApplicationForPopup}
      />

      {/* EmpFilter Popup */}
      <EmpFilter
        isOpen={isEmpFilterOpen}
        onClose={handleCloseEmpFilter}
        onEmployeeSelect={handleEmployeeSelect}
        preSelectedEmployeeId={empStatues ? undefined : undefined}
      />

      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}

export default ViewLeaveOfAbsence 