"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, User, ChevronDown, RefreshCw } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
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
import 'react-toastify/dist/ReactToastify.css';
import { useAdminRole } from '@inops/store/src/hooks/useAdminRole'
import { useMessage } from "../../../hooks/useMessage";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"

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
  const tenantCode = useGetTenantCode()
  const { employeeIds, employeesLite, loading: employeesLoading } = useEmpHierarchy()

  const contractorEmployee = "leaveManagement"

  // Tab state
  const [activeTab, setActiveTab] = useState<'all' | 'self' | 'individual'>("all")

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
    // Role permissions are now derived via useRolePermissions; clear any Redux-provided services
    setAllowedServices([])
  }, [adminRole]);

  // If leave not allowed, softly redirect to launchdesk
  useEffect(() => {
    if (!isClient) return;
    // No redirect logic; permissions handled via useRolePermissions
    setleaveService(null)
  }, [isClient, allowedServices]);

  // Emp filter availability is set later based on role permissions

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
  const [hasUserSelectedEmployee, setHasUserSelectedEmployee] = useState<boolean>(false)

  // State for all employees data
  const [allEmployeesData, setAllEmployeesData] = useState<LeaveOfAbsenceApplication[]>([])
  const [isLoadingAllEmployees, setIsLoadingAllEmployees] = useState(false)
  
  // State for employee dropdown in All tab
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false)
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("")

  // Column filter states
  const [columnFilters, setColumnFilters] = useState({
    employeeID: '',
    typeOfAbsence: '',
    lastDayOfWork: '',
    firstDayOfAbsence: '',
    estimatedLastDayOfAbsence: '',
    appliedDate: '',
    status: ''
  })

  // Sort state
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc' | null;
  }>({
    key: null,
    direction: null
  })

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
      ...(selectedEmployeeId ? [{
        field: "employeeID",
        operator: "eq",
        value: selectedEmployeeId
      }] : [])
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
        } else if (data.data && typeof data.data === 'object') {
          // Only wrap in array if it's a valid object with meaningful data
          // Check if it has required fields to determine if it's a real application
          if (data.data._id || data.data.id || data.data.employeeID || data.data.employeeId) {
            // Additional validation: check if the object has meaningful content
            const hasContent = Object.values(data.data).some(value => 
              value !== null && value !== undefined && value !== '' && 
              !(Array.isArray(value) && value.length === 0)
            )
            if (hasContent) {
              apiData = [data.data]
            } else {
              apiData = []
            }
          } else {
            // If it's an empty object or doesn't have meaningful data, treat as empty
            apiData = []
          }
        } else {
          apiData = []
        }
      }
      // If the response has applications property
      else if (data.applications && Array.isArray(data.applications)) {
        apiData = data.applications
      }
      // If response is null, undefined, or empty object, treat as empty array
      else if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        apiData = []
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
    dependencies: [selectedEmployeeId]
  });

  // API call for all employees leave of absence applications data
  const {
    data: allEmployeesLeaveResponse,
    loading: isLoadingAllEmployeesLeave,
    error: allEmployeesLeaveError,
    refetch: fetchAllEmployeesLeave
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
        operator: "in",
        value: employeeIds
      }
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
        } else if (data.data && typeof data.data === 'object') {
          // Only wrap in array if it's a valid object with meaningful data
          // Check if it has required fields to determine if it's a real application
          if (data.data._id || data.data.id || data.data.employeeID || data.data.employeeId) {
            // Additional validation: check if the object has meaningful content
            const hasContent = Object.values(data.data).some(value => 
              value !== null && value !== undefined && value !== '' && 
              !(Array.isArray(value) && value.length === 0)
            )
            if (hasContent) {
              apiData = [data.data]
            } else {
              apiData = []
            }
          } else {
            // If it's an empty object or doesn't have meaningful data, treat as empty
            apiData = []
          }
        } else {
          apiData = []
        }
      }
      // If the response has applications property
      else if (data.applications && Array.isArray(data.applications)) {
        apiData = data.applications
      }
      // If response is null, undefined, or empty object, treat as empty array
      else if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        apiData = []
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


      setAllEmployeesData(normalizedData)
      setIsLoadingAllEmployees(false)
    },
    onError: (error: Error) => {
      console.error("Error fetching all employees leave of absence applications data:", error);
      setIsLoadingAllEmployees(false)
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

  // Clear data when selectedEmployeeId is empty
  useEffect(() => {
    if (!selectedEmployeeId && activeTab === 'individual') {
      setData([])
      setLoading(false)
    }
  }, [selectedEmployeeId, activeTab])

  // Trigger loading all employees data when switching to All tab first time
  useEffect(() => {
    if (activeTab === 'all' && allEmployeesData.length === 0 && !isLoadingAllEmployees) {
      setIsLoadingAllEmployees(true)
      fetchAllEmployeesLeave()
    }
  }, [activeTab])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.employee-dropdown-container')) {
        setIsEmployeeDropdownOpen(false)
        setEmployeeSearchTerm("") // Clear search when dropdown closes
      }
    }

    if (isEmployeeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEmployeeDropdownOpen])

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
    // Permission guard
    if (!canCancel) {
      toast.error('You do not have permission to cancel leave applications.')
      return
    }

    // Prevent cancelling if already in final state
    const application = data.find(app => app._id === applicationId) || allEmployeesData.find(app => app._id === applicationId)
    if (application) {
      const state = application.workflowState?.toUpperCase()
      if (["APPROVED", "REJECTED", "CANCELLED", "FAILED"].includes(state || '')) {
        toast.error(`Cannot cancel application with status: ${application.workflowState}`)
        return
      }
    }

    setSelectedApplicationId(applicationId)
    setCancelComment("")
    setIsCancelModalOpen(true)
  }

  // Handle submit cancel with comment
  const handleSubmitCancel = async () => {
    // Permission guard
    if (!canCancel) {
      toast.error('You do not have permission to cancel leave applications.')
      return
    }
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

  // --- New: Search/filter state ---
  const [search, setSearch] = useState("")
  
  // Role permissions
  const { responseData: permissions } = useRolePermissions({ serviceName: 'leave', screenName: contractorEmployee })
  const canSeeSelf = Boolean((permissions as any)?.leaveApplicationsOfLeaveOfAbsenceSelf)
  const canSeeAll = Boolean((permissions as any)?.leaveApplicationsOfLeaveOfAbsenceAll)

  // Get role permissions for approve/reject/cancel
       const { responseData: rolePermissions } = useRolePermissions({
           serviceName: 'applicationApplier',
           screenName: 'specialLeave'
       });
       const { responseData: roleApprover } = useRolePermissions({
           serviceName: 'applicationApprover',
           screenName: 'specialLeave'
       });
  const canApprove = !!rolePermissions?.approve || !!roleApprover?.approve
  const canReject = !!rolePermissions?.reject || !!roleApprover?.reject
  const canCancel = !!rolePermissions?.cancel || !!roleApprover?.cancel

  // Compute tab layout to ensure one row layout
  const tabCount = useMemo(() => {
    let count = 0
    if (canSeeAll) count += 2 // all + individual
    if (canSeeSelf) count += 1 // self
    return count
  }, [canSeeAll, canSeeSelf])
  const gridColsClass = tabCount === 3 ? 'grid-cols-3' : tabCount === 2 ? 'grid-cols-2' : 'grid-cols-1'
  
  // Apply role-based visibility similar to time-off-balance-page
  useEffect(() => {
    setEmpStatues(canSeeAll)
    if (canSeeAll) {
      setActiveTab(prev => (prev === 'all' || prev === 'self' || prev === 'individual' ? prev : 'all'))
    } else if (canSeeSelf) {
      setActiveTab('self')
    }
  }, [canSeeAll, canSeeSelf])
  
  // Get current data based on active tab
  const currentData = activeTab === 'all' ? allEmployeesData : data

  const filteredData = currentData?.filter(app => {
    // Apply search filter only for individual tab
    const matchesSearch = activeTab === 'individual' ? 
      ((app.employeeID?.toLowerCase() || '').includes(search.toLowerCase()) ||
       (app.typeOfAbsence?.toLowerCase() || '').includes(search.toLowerCase()) ||
       (app.reason?.toLowerCase() || '').includes(search.toLowerCase())) : 
      true
    
    // Apply employee filter based on tab
    let matchesEmployee = true
    if (activeTab === 'individual') {
      matchesEmployee = !selectedEmployeeId || app.employeeID === selectedEmployeeId
    } else if (activeTab === 'all') {
      matchesEmployee = selectedEmployees.length === 0 || selectedEmployees.includes(app.employeeID)
    }
    
    // Apply column filters
    const matchesColumnFilters = 
      (!columnFilters.employeeID || (app.employeeID?.toLowerCase() || '').includes(columnFilters.employeeID.toLowerCase())) &&
      (!columnFilters.typeOfAbsence || (app.typeOfAbsence?.toLowerCase() || '').includes(columnFilters.typeOfAbsence.toLowerCase())) &&
      (!columnFilters.lastDayOfWork || formatDate(app.lastDayOfWork).includes(columnFilters.lastDayOfWork)) &&
      (!columnFilters.firstDayOfAbsence || formatDate(app.firstDayOfAbsence).includes(columnFilters.firstDayOfAbsence)) &&
      (!columnFilters.estimatedLastDayOfAbsence || formatDate(app.estimatedLastDayOfAbsence).includes(columnFilters.estimatedLastDayOfAbsence)) &&
      (!columnFilters.appliedDate || formatDate(app.appliedDate).includes(columnFilters.appliedDate)) &&
      (!columnFilters.status || (app.workflowState?.toLowerCase() || '').includes(columnFilters.status.toLowerCase()))
    
    return matchesSearch && matchesEmployee && matchesColumnFilters
  }) || []

  // Apply sorting to filtered data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key || !sortConfig.direction) return 0

    let aValue: any
    let bValue: any

    switch (sortConfig.key) {
      case 'employeeID':
        aValue = a.employeeID || ''
        bValue = b.employeeID || ''
        break
      case 'typeOfAbsence':
        aValue = a.typeOfAbsence || ''
        bValue = b.typeOfAbsence || ''
        break
      case 'lastDayOfWork':
        aValue = new Date(a.lastDayOfWork)
        bValue = new Date(b.lastDayOfWork)
        break
      case 'firstDayOfAbsence':
        aValue = new Date(a.firstDayOfAbsence)
        bValue = new Date(b.firstDayOfAbsence)
        break
      case 'estimatedLastDayOfAbsence':
        aValue = new Date(a.estimatedLastDayOfAbsence)
        bValue = new Date(b.estimatedLastDayOfAbsence)
        break
      case 'appliedDate':
        aValue = new Date(a.appliedDate)
        bValue = new Date(b.appliedDate)
        break
      case 'status':
        aValue = a.workflowState || ''
        bValue = b.workflowState || ''
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  // Pagination calculations
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = sortedData.slice(startIndex, endIndex)

  // Reset to first page when search changes (only for individual tab)
  useEffect(() => {
    if (activeTab === 'individual') {
      setCurrentPage(1)
    }
  }, [search, activeTab])

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
    setHasUserSelectedEmployee(true)
    setIsEmpFilterOpen(false)
    setActiveTab('individual')
  }

  // Handle opening EmpFilter popup
  const handleOpenEmpFilter = () => {
    setIsEmpFilterOpen(true)
  }

  // Handle closing EmpFilter popup
  const handleCloseEmpFilter = () => {
    setIsEmpFilterOpen(false)
    if (!selectedEmployeeId && canSeeAll) {
      setActiveTab('all')
    }
  }

  // Handle employee selection in dropdown for All tab
  const handleEmployeeToggle = (employeeId: string) => {

    setSelectedEmployees(prev => {
      const newSelection = prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
      return newSelection
    })
  }

  // Handle select all employees for All tab
  const handleSelectAllEmployees = () => {
    if (selectedEmployees.length === uniqueEmployees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(uniqueEmployees.map(app => app.employeeID))
    }
  }

  // Get unique employees first, then filter based on search term
  const uniqueEmployees = allEmployeesData.reduce((acc, app) => {
    if (app.employeeID && !acc.find(emp => emp.employeeID === app.employeeID)) {
      acc.push(app);
    }
    return acc;
  }, [] as LeaveOfAbsenceApplication[]);

  const filteredEmployees = uniqueEmployees.filter(app => {
    if (!app.employeeID) return false;
    const matches = app.employeeID.toLowerCase().includes(employeeSearchTerm.toLowerCase());
    return matches;
  })

  // Handle column filter changes
  const handleColumnFilterChange = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }))
  }

  // Handle sort changes
  const handleSortChange = (column: string) => {
    setSortConfig(prev => {
      if (prev.key === column) {
        // If same column, cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { key: column, direction: 'desc' }
        } else if (prev.direction === 'desc') {
          return { key: null, direction: null }
        } else {
          return { key: column, direction: 'asc' }
        }
      } else {
        // If different column, start with asc
        return { key: column, direction: 'asc' }
      }
    })
  }

  // Clear all column filters
  const clearAllColumnFilters = () => {
    setColumnFilters({
      employeeID: '',
      typeOfAbsence: '',
      lastDayOfWork: '',
      firstDayOfAbsence: '',
      estimatedLastDayOfAbsence: '',
      appliedDate: '',
      status: ''
    })
    setSortConfig({
      key: null,
      direction: null
    })
  }

  const isLoading = activeTab === 'all' ? isLoadingAllEmployees : loading

  if (isLoading) {
    return (
      <div className="max-w-full overflow-x-auto p-4 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leave of absence applications...</p>
        </div>
      </div>
    )
  }

  const currentError = activeTab === 'all' ? allEmployeesLeaveError : error
  const hasData = activeTab === 'all' ? (allEmployeesData && allEmployeesData.length > 0) : (data && data.length > 0)

  if (currentError && !hasData) {
    return (
      <div className="max-w-full overflow-x-auto p-4">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
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
              <p className="text-red-600 mb-4">Error: {currentError instanceof Error ? currentError.message : String(currentError)}</p>
              <p className="text-gray-600 mb-4">Unable to load leave of absence applications. Please try again.</p>
              <Button onClick={activeTab === 'all' ? fetchAllEmployeesLeave : fetchLeaveOfAbsenceApplications} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    )
  }

  const totalApplications = filteredData?.length || 0;
  const totalDays = filteredData?.reduce((sum, app) => {
    const days = app.totalDays || calculateTotalDays(app.firstDayOfAbsence, app.estimatedLastDayOfAbsence);
    return sum + (isNaN(days) ? 0 : days);
  }, 0) || 0;
  const uniqueAbsenceTypes = filteredData ? Array.from(new Set(filteredData.map(app => app.typeOfAbsence).filter(type => type && type.trim() !== ''))).length : 0;
  const mostRecentAppliedDate = filteredData && filteredData.length > 0 ? 
    filteredData.reduce((latestApp, app) => {
      const currentDate = new Date(app.appliedDate);
      const latestDate = new Date(latestApp.appliedDate);
      // Handle invalid dates
      if (isNaN(currentDate.getTime())) return latestApp;
      if (isNaN(latestDate.getTime())) return app;
      return currentDate > latestDate ? app : latestApp;
    }, filteredData[0]).appliedDate : null;

  return (
    <div className="max-w-full overflow-x-auto p-4 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
                {activeTab === 'individual' && hasUserSelectedEmployee && selectedEmployeeId && (
                  <span className="text-blue-600 ml-2 font-medium">
                    - Employee ID: {selectedEmployeeId}
                  </span>
                )}
              </p>
            </div>
          </div>
          {/* Right side: filter/export buttons */}
          <div className="flex gap-3">
            {activeTab === 'individual' && canSeeAll && (
              <>
                <Button 
                  variant="outline" 
                  className="hover:bg-gray-50"
                  onClick={handleOpenEmpFilter}
                >
                  <User className="h-4 w-4 mr-2" />
                  Filter by Employee
                </Button>
                <Button 
                  variant="outline" 
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  onClick={() => { setSelectedEmployeeId(""); setHasUserSelectedEmployee(false) }}
                >
                  Clear Filter
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => {
          const val = v as 'all' | 'self' | 'individual'
          if (val === 'all' && !canSeeAll) return
          if (val === 'self' && !canSeeSelf) return
          if (val === 'individual') {
            if (!canSeeAll) return
            // Clear any pre-filled employee when opening Individual filter
            setSelectedEmployeeId("")
            setHasUserSelectedEmployee(false)
            setIsEmpFilterOpen(true)
            if (!selectedEmployeeId) return
          }
          if (val === 'self' && storedRoleInfo?.employeeId) {
            setSelectedEmployeeId(storedRoleInfo.employeeId)
          }
          setActiveTab(val)
        }} className="w-full">
          <TabsList className={`grid w-full ${gridColsClass} mx-0 mb-2 h-10 bg-slate-50 rounded-full p-1 border border-slate-200`}>
            {canSeeAll && (
              <TabsTrigger 
                value="all" 
                className={"text-sm rounded-full transition-colors text-slate-700 hover:bg-white data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm"}
              >
                All Employees Leave of Absence Applications
              </TabsTrigger>
            )}
            {canSeeSelf && (
              <TabsTrigger 
                value="self" 
                className={"text-sm rounded-full transition-colors text-slate-700 hover:bg-white data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm"}
              >
                Check Self Info
              </TabsTrigger>
            )}
            {canSeeAll && (
              <TabsTrigger 
                value="individual" 
                className={"text-sm rounded-full transition-colors text-slate-700 hover:bg-white data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm"}
              >
                Individual Leave of Absence Applications
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB 1: All Employees Leave of Absence Applications */}
          <TabsContent value="all" className="m-0">
            {/* Employee Filter Dropdown */}
            <div className="relative">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative employee-dropdown-container">
                      <Button 
                        variant="outline" 
                        className="w-[300px] justify-between"
                        onClick={() => {
                          setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)
                        }}
                      >
                        <span>
                          {selectedEmployees.length === 0 
                            ? "Select Employees" 
                            : selectedEmployees.length === allEmployeesData.length 
                              ? "All Employees Selected" 
                              : `${selectedEmployees.length} Employee(s) Selected`
                          }
                        </span>
                        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isEmployeeDropdownOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                    
                    {selectedEmployees.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedEmployees([])}
                        className="text-red-600 hover:text-red-700"
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Dropdown positioned outside the card */}
              {isEmployeeDropdownOpen && (
                <div className="absolute top-full left-6 mt-1 w-[300px] bg-white border border-gray-200 rounded-md shadow-lg z-[99999] employee-dropdown-container">
                  <div className="max-h-[300px] overflow-y-auto">
                    {/* Search Input */}
                    <div className="p-2 border-b bg-gray-50 employee-dropdown-container">
                      <div className="relative">
                        <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search employees..."
                          className="pl-8 pr-8 py-1 w-full text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={employeeSearchTerm}
                          onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {employeeSearchTerm && (
                          <button
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEmployeeSearchTerm("")
                            }}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Select All */}
                    <div className="p-2 border-b bg-gray-50 employee-dropdown-container">
                      <div 
                        className="flex items-center space-x-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSelectAllEmployees()
                        }}
                      >
                        <Checkbox
                          id="select-all"
                          checked={selectedEmployees.length === uniqueEmployees.length && uniqueEmployees.length > 0}
                          onCheckedChange={handleSelectAllEmployees}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                          Select All ({uniqueEmployees.length})
                        </label>
                      </div>
                    </div>
                    
                    {/* Employee List */}
                    {isLoadingAllEmployees ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Loading employees...
                      </div>
                    ) : filteredEmployees.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {employeeSearchTerm ? 'No employees found matching your search' : 'No employees found'}
                      </div>
                    ) : (
                      filteredEmployees.map((application) => (
                        <div 
                          key={application.employeeID} 
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 employee-dropdown-container"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEmployeeToggle(application.employeeID)
                          }}
                        >
                          <Checkbox
                            id={application.employeeID}
                            checked={selectedEmployees.includes(application.employeeID)}
                            onCheckedChange={() => handleEmployeeToggle(application.employeeID)}
                          />
                          <label htmlFor={application.employeeID} className="text-sm flex-1 cursor-pointer">
                            <div className="font-medium">{application.employeeID}</div>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Table Section */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">All Employees Leave of Absence Applications</CardTitle>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAllEmployeesLeave}
                      disabled={isLoadingAllEmployees}
                      className="h-8 px-3 text-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAllEmployees ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {sortedData.length} Records
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
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                        <option value={500}>500</option>
                        <option value={1000}>1,000</option>
                        <option value={5000}>5,000</option>
                        <option value={10000}>10,000</option>
                        <option value={50000}>50,000</option>
                        <option value={100000}>100,000</option>
                        <option value={500000}>500,000</option>
                        <option value={1000000}>1,000,000</option>
                      </select>
                      <span className="text-sm text-gray-600">per page</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Column Filters */}
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Column Filters</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearAllColumnFilters}
                      className="text-xs h-7 px-2"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    <input
                      type="text"
                      placeholder="Filter Employee ID..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.employeeID}
                      onChange={(e) => handleColumnFilterChange('employeeID', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter Absence Type..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.typeOfAbsence}
                      onChange={(e) => handleColumnFilterChange('typeOfAbsence', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter Last Work Day..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.lastDayOfWork}
                      onChange={(e) => handleColumnFilterChange('lastDayOfWork', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter First Absence Day..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.firstDayOfAbsence}
                      onChange={(e) => handleColumnFilterChange('firstDayOfAbsence', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter Last Absence Day..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.estimatedLastDayOfAbsence}
                      onChange={(e) => handleColumnFilterChange('estimatedLastDayOfAbsence', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter Applied Date..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.appliedDate}
                      onChange={(e) => handleColumnFilterChange('appliedDate', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter Status..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.status}
                      onChange={(e) => handleColumnFilterChange('status', e.target.value)}
                    />
                    <div className="px-2 py-1 text-xs text-gray-400 border border-gray-300 rounded bg-gray-50">
                      Actions
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('employeeID')}
                        >
                          <div className="flex items-center gap-1">
                            Employee ID
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'employeeID' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('typeOfAbsence')}
                        >
                          <div className="flex items-center gap-1">
                            Type of Absence
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'typeOfAbsence' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('lastDayOfWork')}
                        >
                          <div className="flex items-center gap-1">
                            Last Day of Work
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'lastDayOfWork' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('firstDayOfAbsence')}
                        >
                          <div className="flex items-center gap-1">
                            Absence Period
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'firstDayOfAbsence' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">Total Days</TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('appliedDate')}
                        >
                          <div className="flex items-center gap-1">
                            Applied Date
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'appliedDate' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'status' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((application) => (
                        <TableRow key={application._id} className="hover:bg-gray-50/50 transition-all duration-200 group">
                          <TableCell className="font-medium text-gray-900 text-sm w-[120px]">
                            {application.employeeID || '-'}
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm w-[150px]">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {application.typeOfAbsence || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm w-[120px]">
                            {formatDate(application.lastDayOfWork)}
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm w-[200px]">
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
                          <TableCell className="text-gray-700 text-sm w-[100px]">
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              {application.totalDays || calculateTotalDays(application.firstDayOfAbsence, application.estimatedLastDayOfAbsence)} days
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm w-[120px]">
                            {formatDate(application.appliedDate)}
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm w-[100px]">
                            <Badge variant={getStatusBadgeVariant(application.workflowState)}>
                              {application.workflowState || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStatus(application)}
                              className="h-8 px-3 text-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                            >
                              View Status
                            </Button>
                          </TableCell>
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
                        Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} results
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
          </TabsContent>

          {/* TAB 2: Self Leave of Absence Applications (same view as Individual) */}
          {canSeeSelf && (
          <TabsContent value="self" className="m-0">
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

            {/* Table Section */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">My Leave of Absence Applications</CardTitle>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchLeaveOfAbsenceApplications}
                      disabled={loading}
                      className="h-8 px-3 text-sm hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {sortedData.length} Records
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="text-gray-800 w-[150px] text-sm tracking-wide">Absence Type</TableHead>
                        <TableHead className="text-gray-800 text-center text-sm tracking-wide">Last Day of Work</TableHead>
                        <TableHead className="text-gray-800 text-center text-sm tracking-wide">Absence Period</TableHead>
                        <TableHead className="text-gray-800 text-center text-sm tracking-wide">Total Days</TableHead>
                        <TableHead className="text-gray-800 text-center text-sm tracking-wide">Applied Date</TableHead>
                        <TableHead className="text-gray-800 text-center text-sm tracking-wide">Status</TableHead>
                        <TableHead className="text-gray-800 text-center text-sm tracking-wide">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((application) => (
                        <TableRow key={application._id} className="hover:bg-gray-50/50 transition-all duration-200 group">
                          <TableCell className="text-gray-700 text-sm w-[150px]">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {application.typeOfAbsence || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-gray-700 text-sm">{formatDate(application.lastDayOfWork)}</TableCell>
                          <TableCell className="text-center text-gray-700 text-sm">{formatDate(application.firstDayOfAbsence)} - {formatDate(application.estimatedLastDayOfAbsence)}</TableCell>
                          <TableCell className="text-center text-gray-700 text-sm">
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              {application.totalDays || calculateTotalDays(application.firstDayOfAbsence, application.estimatedLastDayOfAbsence)} days
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-gray-700 text-sm">{formatDate(application.appliedDate)}</TableCell>
                          <TableCell className="text-center text-gray-700 text-sm">
                            <Badge variant={getStatusBadgeVariant(application.workflowState)}>
                              {application.workflowState || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-gray-700 text-sm">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStatus(application)}
                              className="h-8 px-3 text-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                            >
                              View Status
                            </Button>
                          </TableCell>
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
                        Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} results
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1} className="h-8 w-8 p-0">
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1} className="h-8 w-8 p-0">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((page) => (
                          <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => goToPage(page)} className="h-8 w-8 p-0 text-sm">
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* TAB 3: Individual Leave of Absence Applications */}
          {canSeeAll && (
          <TabsContent value="individual" className="m-0">
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
                  <CardTitle className="text-lg font-semibold text-gray-900">Individual Leave of Absence Applications</CardTitle>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchLeaveOfAbsenceApplications}
                      disabled={loading}
                      className="h-8 px-3 text-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {sortedData.length} Records
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
                        <option value={100}>100</option>
                        <option value={200}>200</option>
                        <option value={500}>500</option>
                        <option value={1000}>1,000</option>
                        <option value={5000}>5,000</option>
                        <option value={10000}>10,000</option>
                        <option value={50000}>50,000</option>
                        <option value={100000}>100,000</option>
                        <option value={500000}>500,000</option>
                        <option value={1000000}>1,000,000</option>
                      </select>
                      <span className="text-sm text-gray-600">per page</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Column Filters */}
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Column Filters</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearAllColumnFilters}
                      className="text-xs h-7 px-2"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-8 gap-2">
                    <input
                      type="text"
                      placeholder="Filter Employee ID..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.employeeID}
                      onChange={(e) => handleColumnFilterChange('employeeID', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter Absence Type..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.typeOfAbsence}
                      onChange={(e) => handleColumnFilterChange('typeOfAbsence', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter Last Work Day..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.lastDayOfWork}
                      onChange={(e) => handleColumnFilterChange('lastDayOfWork', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter First Absence Day..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.firstDayOfAbsence}
                      onChange={(e) => handleColumnFilterChange('firstDayOfAbsence', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter Last Absence Day..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.estimatedLastDayOfAbsence}
                      onChange={(e) => handleColumnFilterChange('estimatedLastDayOfAbsence', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter Applied Date..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.appliedDate}
                      onChange={(e) => handleColumnFilterChange('appliedDate', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Filter Status..."
                      className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                      value={columnFilters.status}
                      onChange={(e) => handleColumnFilterChange('status', e.target.value)}
                    />
                    <div className="px-2 py-1 text-xs text-gray-400 border border-gray-300 rounded bg-gray-50">
                      Actions
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('employeeID')}
                        >
                          <div className="flex items-center gap-1">
                            Employee ID
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'employeeID' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('typeOfAbsence')}
                        >
                          <div className="flex items-center gap-1">
                            Type of Absence
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'typeOfAbsence' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('lastDayOfWork')}
                        >
                          <div className="flex items-center gap-1">
                            Last Day of Work
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'lastDayOfWork' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('firstDayOfAbsence')}
                        >
                          <div className="flex items-center gap-1">
                            Absence Period
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'firstDayOfAbsence' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">Total Days</TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('appliedDate')}
                        >
                          <div className="flex items-center gap-1">
                            Applied Date
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'appliedDate' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSortChange('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            <span className="text-gray-400 text-xs">
                              {sortConfig.key === 'status' ? (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              ) : '↕'}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((application) => (
                        <TableRow key={application._id} className="hover:bg-gray-50/50 transition-all duration-200 group">
                          <TableCell className="font-medium text-gray-900 text-sm w-[120px]">
                            {application.employeeID || '-'}
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm w-[150px]">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {application.typeOfAbsence || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm w-[120px]">
                            {formatDate(application.lastDayOfWork)}
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm w-[200px]">
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
                          <TableCell className="text-gray-700 text-sm w-[100px]">
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              {application.totalDays || calculateTotalDays(application.firstDayOfAbsence, application.estimatedLastDayOfAbsence)} days
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm w-[120px]">
                            {formatDate(application.appliedDate)}
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm w-[100px]">
                            <Badge variant={getStatusBadgeVariant(application.workflowState)}>
                              {application.workflowState || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-700 text-sm">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewStatus(application)}
                              className="h-8 px-3 text-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                            >
                              View Status
                            </Button>
                          </TableCell>
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
                        Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} results
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
          </TabsContent>
          )}
        </Tabs>
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
        leaveOfAbsenceApplications={currentData}
        initialSelectedApplication={selectedApplicationForPopup}
        showOnlySelected={true}
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