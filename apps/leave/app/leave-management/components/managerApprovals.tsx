"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Plus, TrendingUp, User, Bell, Settings, LogOut, RefreshCw, CheckCircle, XCircle, AlertCircle, Eye, ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@repo/ui/components/ui/select"
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
import ViewLeaveApplied from "./viewLeaveapplied"
import ViewLeaveOfAbsence from "./viewLeaveOfAbsence"
import { useLeaveApplications } from "../../../hooks/useLeaveApplications"
import { useLeaveOfAbsence } from "../../../hooks/useLeaveOfAbsence"
import { usePostRequest } from '@repo/ui/hooks/api/usePostRequest';
import { useRequest } from '@repo/ui/hooks/api/useGetRequest';
import { useSession } from 'next-auth/react';
import { ToastContainer, toast } from 'react-toastify';
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
// import { useMessage } from "../hooks/useMessage";

interface ManagerApprovalsProps {
    onBack?: () => void
}

export default function ManagerApprovals({ onBack }: ManagerApprovalsProps) {
    const [selectedTimeOffType, setSelectedTimeOffType] = useState("vacation")
    const [currentPage, setCurrentPage] = useState("dashboard")

    // Pagination state for Leave Applications table
    const [leaveApplicationsPage, setLeaveApplicationsPage] = useState(1)
    const [leaveApplicationsPageSize, setLeaveApplicationsPageSize] = useState(5)

    // Pagination state for Leave of Absence table
    const [absencePage, setAbsencePage] = useState(1)
    const [absencePageSize, setAbsencePageSize] = useState(5)

    // Approval modal state
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
    const [selectedApplicationId, setSelectedApplicationId] = useState<string>("")
    const [approvalComment, setApprovalComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [actionType, setActionType] = useState<"approve" | "reject" | "cancel">("approve")
    const  tenantCode  = useGetTenantCode();

    // Get session for authentication
    const { data: session } = useSession();

    // Use the post request hook for approval submissions
    const {
        post: postApproval,
        loading: postLoading,
        error: postError,
        data: postData,
    } = usePostRequest<any>({
        url: "leaveApplication", // Relative URL, base URL handled by hook
        onSuccess: (data) => {
            const actionText = actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "cancelled";
            toast.success(`Leave application ${actionText} successfully!`);
            
            // Close modal and reset state
            setIsApprovalModalOpen(false)
            setApprovalComment("")
            setSelectedApplicationId("")
            setActionType("approve")

            // Refresh the data after approval
            refetchApplications();
            refetchAbsence();
        },
        onError: (error) => {
            console.error("Approval submission failed:", error);
            let errorMessage = "Failed to submit approval. Please try again.";
            
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

    // API call for leave of absence data
    const {
        data: leaveOfAbsenceResponse,
        loading: isLoadingLeaveOfAbsence,
        error: leaveOfAbsenceError,
        refetch: fetchLeaveOfAbsence
    } = useRequest<any>({
        url: 'specialLeaveApplication/search',
        method: 'POST',
        data: [
            {
                field: "tenantCode",
                operator: "eq",
                value: tenantCode
            },
        ],
        onSuccess: (data: any) => {
        },
        onError: (error: Error) => {
            console.error("Error fetching leave of absence data:", error);
        },
        dependencies: []
    });

    // Use the leave applications hook
    const { 
        applicationsData: leaveApplicationsRaw, 
        loading: applicationsLoading, 
        error: applicationsError, 
        lastUpdated: applicationsLastUpdated, 
        updateApplicationsData, 
        setLoadingState: setApplicationsLoadingState, 
        setErrorState: setApplicationsErrorState,
        refetch: refetchApplications 
    } = useLeaveApplications()

    // Use the leave of absence hook
    const { 
        absenceData: leaveOfAbsenceData, 
        loading: absenceLoading, 
        error: absenceError, 
        lastUpdated: absenceLastUpdated, 
        refetch: refetchAbsence 
    } = useLeaveOfAbsence(leaveOfAbsenceResponse)

    // Update loading states based on API calls
    useEffect(() => {
        setApplicationsLoadingState(isLoadingLeaveApplications)
    }, [isLoadingLeaveApplications])

    useEffect(() => {
        fetchLeaveApplications()
    }, [])

    useEffect(() => {
        fetchLeaveOfAbsence()
    }, [])

    // Filter out applications with stateEvent === 'USERCANCEL' for manager view
    const leaveApplications = leaveApplicationsRaw.filter(app => app.stateEvent !== 'USERCANCEL')

    // Use the encashment hook
    // const { encashmentData, loading: encashmentLoading, error: encashmentError, lastUpdated: encashmentLastUpdated, refetch: refetchEncashment } = useEncashment()

    // const { showMessage } = useMessage();

    // Calculate approval requests from all three types of applications
    const pendingLeaveApplications = leaveApplications.filter(app => app.workflowState === 'INITIATED')
    const pendingAbsenceApplications = leaveOfAbsenceData.filter(app => app.workflowState === 'INITIATED')
    const approvalRequests = [...pendingLeaveApplications, ...pendingAbsenceApplications]

    // Helper function to format dates
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) {
            return 'N/A'
        }
        
        try {
            // Handle dd-mm-yyyy format (like "18-06-2025")
            if (dateString.includes('-') && dateString.split('-').length === 3) {
                const [day, month, year] = dateString.split('-')
                return `${day}-${month}-${year}`
            }

            // Handle ISO date strings or other formats
            const date = new Date(dateString)
            if (isNaN(date.getTime())) {
                return dateString
            }

            const day = date.getDate().toString().padStart(2, '0')
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            const year = date.getFullYear()

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

    // Transform leave applications data for Recent Requests
    const recentRequests = leaveApplications.slice(0, 3).map((app, index) => ({
        id: app._id || index,
        type: getLeaveSummary(app.leaves),
        dates: `${formatDate(app.fromDate)} - ${formatDate(app.toDate)}`,
        status: app.workflowState || 'Unknown',
        days: app.leaves?.length || 0
    }))



    // Get status badge
    const getStatusBadge = (status: string | undefined | null) => {
        if (!status) {
            return <Badge variant="secondary">Unknown</Badge>
        }
        
        switch (status.toLowerCase()) {
            case 'pending':
            case 'initiated':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
            case 'validated':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Validated</Badge>
            case 'approved':
                return <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>
            case 'rejected':
                return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    // Handle approve leave application
    const handleApproveLeave = async (applicationId: string) => {
        setSelectedApplicationId(applicationId)
        setApprovalComment("")
        setActionType("approve")
        setIsApprovalModalOpen(true)
    }

    // Handle reject leave application
    const handleRejectLeave = async (applicationId: string) => {
        setSelectedApplicationId(applicationId)
        setApprovalComment("")
        setActionType("reject")
        setIsApprovalModalOpen(true)
    }

    // Handle cancel leave application
    const handleCancelLeave = async (applicationId: string) => {
        setSelectedApplicationId(applicationId)
        setApprovalComment("")
        setActionType("cancel")
        setIsApprovalModalOpen(true)
    }

    // Handle submit approval with comment
    const handleSubmitApproval = async () => {
        if (!approvalComment.trim()) {
            const actionText = actionType === "approve" ? "approving" : actionType === "reject" ? "rejecting" : "canceling";
            toast.error(`Please enter a comment before ${actionText}.`);
            return;
        }

        setIsSubmitting(true)
        try {
            // Find the selected application from all three types of applications
            const selectedApplication = [
                ...leaveApplications,
                ...leaveOfAbsenceData
            ].find(app => app._id === selectedApplicationId);

            if (!selectedApplication) {
                toast.error('Application not found');
                setIsSubmitting(false);
                return;
            }

            // Determine workflow state based on action type
            let stateEvent = "NEXT";
            
            if (actionType === "reject") {
                stateEvent = "REJECT";
            } else if (actionType === "cancel") {
                stateEvent = "CANCEL";
            }

            // Create the final JSON payload with the comment merged
            const approvalPayload = {
                tenant: tenantCode,
                action: "update",
                collectionName: "leaveApplication",
                id: selectedApplicationId,
                event: "application",
                data: {
                    ...selectedApplication,
                    _id: selectedApplicationId,
                    approvalComment: approvalComment.trim(),
                    approvedBy: session?.user?.name || "manager",
                    approvedOn: new Date().toISOString(),
                    stateEvent: stateEvent
                }
            };

            // Submit the approval using the hook
            await postApproval(approvalPayload);

        } catch (error) {
            console.error('Approval error:', error);
            const actionText = actionType === "approve" ? "approve" : actionType === "reject" ? "reject" : "cancel";
            toast.error(`Failed to ${actionText} leave application. Please try again.`);
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle cancel approval
    const handleCancelApproval = () => {
        setIsApprovalModalOpen(false)
        setApprovalComment("")
        setSelectedApplicationId("")
        setActionType("approve")
    }

    // Pagination helper functions
    const getPaginatedData = (data: any[], page: number, pageSize: number) => {
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        return data.slice(startIndex, endIndex)
    }

    const getTotalPages = (totalItems: number, pageSize: number) => {
        return Math.ceil(totalItems / pageSize)
    }

    // Get paginated data for all three tables
    const paginatedLeaveApplications = getPaginatedData(leaveApplications, leaveApplicationsPage, leaveApplicationsPageSize)
    const paginatedAbsenceData = getPaginatedData(leaveOfAbsenceData, absencePage, absencePageSize)
    // const paginatedEncashmentData = getPaginatedData(encashmentData, encashmentPage, encashmentPageSize)

    // Pagination component
    const Pagination = ({
        currentPage,
        totalPages,
        onPageChange,
        pageSize,
        onPageSizeChange,
        totalItems
    }: {
        currentPage: number
        totalPages: number
        onPageChange: (page: number) => void
        pageSize: number
        onPageSizeChange: (size: number) => void
        totalItems: number
    }) => {
        const startItem = (currentPage - 1) * pageSize + 1
        const endItem = Math.min(currentPage * pageSize, totalItems)

        return (
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex items-center space-x-2">
                    <p className="text-sm text-muted-foreground">
                        Showing {startItem} to {endItem} of {totalItems} results
                    </p>
                    <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[5, 10, 20, 50].map((size) => (
                                <SelectItem key={size} value={size.toString()}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (currentPage <= 3) {
                                pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = currentPage - 2 + i
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => onPageChange(pageNum)}
                                    className="h-8 w-8 p-0"
                                >
                                    {pageNum}
                                </Button>
                            )
                        })}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )
    }


    if (currentPage === "view-requests") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <ViewLeaveApplied onBack={() => setCurrentPage("dashboard")} />
                </main>
            </div>
        )
    }

    if (currentPage === "view-leave-of-absence") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <ViewLeaveOfAbsence onBack={() => setCurrentPage("dashboard")} />
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6" style={{ width: '1200px', margin: '0 auto' }}>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />

            {/* Approval Comment Modal */}
            <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === "approve" ? "Approve" : actionType === "reject" ? "Reject" : "Cancel"} Leave Application
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a comment for this {actionType === "approve" ? "approval" : actionType === "reject" ? "rejection" : "cancellation"}. This comment will be visible to the employee.
                        </DialogDescription>
                    </DialogHeader>
                    {/* Show the selected application's reason here */}
                    {(() => {
                        const selectedApplication = [
                            ...leaveApplications,
                            ...leaveOfAbsenceData
                        ].find(app => app._id === selectedApplicationId);
                        if (!selectedApplication) return null;

                        // Type-safe extraction of reason/remarks/description
                        let reason: string = 'No reason provided';
                        if ("reason" in selectedApplication && selectedApplication.reason) {
                            reason = typeof selectedApplication.reason === "string"
                                ? selectedApplication.reason
                                : String(selectedApplication.reason);
                        } else if ("remarks" in selectedApplication && selectedApplication.remarks) {
                            reason = typeof selectedApplication.remarks === "string"
                                ? selectedApplication.remarks
                                : String(selectedApplication.remarks);
                        } else if ("description" in selectedApplication && selectedApplication.description) {
                            reason = typeof selectedApplication.description === "string"
                                ? selectedApplication.description
                                : String(selectedApplication.description);
                        }

                        return (
                            <div className="mb-2 p-2 bg-slate-100 rounded text-sm text-gray-700">
                                <strong>Reason:</strong> {reason}
                            </div>
                        );
                    })()}
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="comment" className="text-right">
                                Comment
                            </Label>
                            <Textarea
                                id="comment"
                                value={approvalComment}
                                onChange={(e) => setApprovalComment(e.target.value)}
                                placeholder="Enter your approval comment..."
                                className="col-span-3"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancelApproval}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitApproval}
                            disabled={isSubmitting || !approvalComment.trim()}
                            className={
                                actionType === "approve" ? "bg-green-600 hover:bg-green-700" :
                                actionType === "reject" ? "bg-red-600 hover:bg-red-700" :
                                "bg-gray-600 hover:bg-gray-700"
                            }
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    {actionType === "approve" ? "Approving..." : actionType === "reject" ? "Rejecting..." : "Cancelling..."}
                                </>
                            ) : (
                                <>
                                    {actionType === "approve" ? <CheckCircle className="h-4 w-4 mr-2" /> :
                                     actionType === "reject" ? <XCircle className="h-4 w-4 mr-2" /> :
                                     <AlertCircle className="h-4 w-4 mr-2" />}
                                    {actionType === "approve" ? "Approve" : actionType === "reject" ? "Reject" : "Cancel"}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm mb-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            {onBack && (
                                <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-slate-100">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            )}
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-8 w-8 text-blue-600" />
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Manager Dashboard</h1>
                                    <p className="text-base text-slate-600 mt-1">Manage your team's leave requests and your own time off</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Button variant="ghost" size="icon">
                                <Bell className="h-5 w-5" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="" alt="Manager" />
                                            <AvatarFallback>MN</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">Manager Name</p>
                                            <p className="text-xs leading-none text-muted-foreground">manager@company.com</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <User className="mr-2 h-4 w-4" />
                                        <span>Profile</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back, Manager!</h2>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white">Pending Approvals</CardTitle>
                            <FileText className="h-4 w-4 text-yellow-200" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {approvalRequests.filter(req => req.workflowState === 'INITIATED').length}
                            </div>
                            <p className="text-xs text-yellow-100">
                                Require your attention
                            </p>
                        </CardContent>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400 rounded-full opacity-20 -translate-y-8 translate-x-8"></div>
                    </Card>

                    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white">Approved This Month</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-200" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {leaveApplications.filter(req => req.workflowState === 'APPROVED').length +
                                    leaveOfAbsenceData.filter(req => req.workflowState === 'APPROVED').length}
                            </div>
                            <p className="text-xs text-green-100">
                                Leave requests approved
                            </p>
                        </CardContent>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-green-400 rounded-full opacity-20 -translate-y-8 translate-x-8"></div>
                    </Card>
                </div>



                {/* Leave Applications Table */}
                <div className="mb-8">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-gray-900">Leave Applications</CardTitle>
                                    <CardDescription className="text-base text-gray-600">All leave applications from team members</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={refetchApplications}
                                    disabled={applicationsLoading}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${applicationsLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table className="text-sm">
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/80">
                                            <TableHead className="font-semibold text-gray-700 w-[200px] text-sm">Employee ID</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Leave Type</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Dates</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Days</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Reason</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Status</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Applied Date</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {applicationsLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-4">
                                                    <div className="flex items-center justify-center text-sm">
                                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                                        Loading leave applications...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : applicationsError ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-4">
                                                    <div className="flex items-center justify-center text-red-600 text-sm">
                                                        <AlertCircle className="h-4 w-4 mr-2" />
                                                        Error loading data: {applicationsError}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedLeaveApplications.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-4">
                                                    <div className="flex items-center justify-center text-gray-500 text-sm">
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        No leave applications found
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedLeaveApplications.map((application) => (
                                                <TableRow key={application._id} className="hover:bg-gray-50/50 transition-all duration-200 group">
                                                    <TableCell className="font-medium text-gray-900 text-sm">
                                                        {application.employeeID}
                                                    </TableCell>
                                                    <TableCell className="max-w-[150px] truncate text-gray-700 text-sm" title={getLeaveSummary(application.leaves)}>
                                                        {getLeaveSummary(application.leaves)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-gray-700 text-sm">
                                                        {formatDate(application.fromDate)} - {formatDate(application.toDate)}
                                                    </TableCell>
                                                    <TableCell className="text-center text-gray-700 text-sm">
                                                        {application.leaves?.length || 0}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate text-gray-700 text-sm" title={application.remarks || 'No reason provided'}>
                                                        {application.remarks || 'No reason provided'}
                                                    </TableCell>
                                                    <TableCell className="text-gray-700 text-sm">
                                                        <div className="scale-75 origin-left">
                                                            {getStatusBadge(application.workflowState)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-gray-700 text-sm">
                                                        {formatDate(application.appliedDate)}
                                                    </TableCell>
                                                    <TableCell className="text-gray-700 text-sm">
                                                        {(application.workflowState === 'INITIATED' || application.workflowState === 'VALIDATED') && (
                                                            <div className="flex flex-col gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                                                                    onClick={() => handleApproveLeave(application._id)}
                                                                >
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 px-3 text-xs bg-red-600 hover:bg-red-700"
                                                                    onClick={() => handleRejectLeave(application._id)}
                                                                >
                                                                    <XCircle className="h-3 w-3 mr-1" />
                                                                    Reject
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 px-3 text-xs bg-gray-600 hover:bg-gray-700"
                                                                    onClick={() => handleCancelLeave(application._id)}
                                                                >
                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {application.workflowState === 'APPROVED' && (
                                                            <div className="flex flex-col gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 px-3 text-xs bg-gray-600 hover:bg-gray-700"
                                                                    onClick={() => handleCancelLeave(application._id)}
                                                                >
                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {application.workflowState !== 'INITIATED' && application.workflowState !== 'VALIDATED' && application.workflowState !== 'APPROVED' && (
                                                            <span className="text-xs text-gray-500">No action needed</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination for Leave Applications */}
                            <Pagination
                                currentPage={leaveApplicationsPage}
                                totalPages={getTotalPages(leaveApplications.length, leaveApplicationsPageSize)}
                                onPageChange={setLeaveApplicationsPage}
                                pageSize={leaveApplicationsPageSize}
                                onPageSizeChange={(size) => {
                                    setLeaveApplicationsPageSize(size)
                                    setLeaveApplicationsPage(1) // Reset to first page when changing page size
                                }}
                                totalItems={leaveApplications.length}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Leave of Absence Table */}
                <div className="mb-8">
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-gray-900">Leave of Absence Applications</CardTitle>
                                    <CardDescription className="text-base text-gray-600">Special leave applications including maternity, paternity, and medical leave</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={refetchAbsence}
                                    disabled={absenceLoading}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${absenceLoading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table className="text-sm">
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/80">
                                            <TableHead className="font-semibold text-gray-700 w-[200px] text-sm">Employee ID</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Type of Absence</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Absence Period</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Total Days</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Reason</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Status</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Applied Date</TableHead>
                                            <TableHead className="font-semibold text-gray-700 text-sm">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {absenceLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-4">
                                                    <div className="flex items-center justify-center text-sm">
                                                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                                        Loading leave of absence applications...
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : absenceError ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-4">
                                                    <div className="flex items-center justify-center text-red-600 text-sm">
                                                        <AlertCircle className="h-4 w-4 mr-2" />
                                                        Error loading data: {absenceError}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : paginatedAbsenceData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-4">
                                                    <div className="flex items-center justify-center text-gray-500 text-sm">
                                                        <Calendar className="h-4 w-4 mr-2" />
                                                        No leave of absence applications found
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedAbsenceData.map((absence) => (
                                                <TableRow key={absence._id} className="hover:bg-gray-50/50 transition-all duration-200 group">
                                                    <TableCell className="font-medium text-gray-900 text-sm">
                                                        {absence.employeeID}
                                                    </TableCell>
                                                    <TableCell className="max-w-[150px] truncate text-gray-700 text-sm" title={absence.typeOfAbsence}>
                                                        {absence.typeOfAbsence}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-gray-700 text-sm">
                                                        {formatDate(absence.firstDayOfAbsence)} - {formatDate(absence.estimatedLastDayOfAbsence)}
                                                    </TableCell>
                                                    <TableCell className="text-center text-gray-700 text-sm">
                                                        {absence.totalDays}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate text-gray-700 text-sm" title={absence.reason}>
                                                        {absence.reason}
                                                    </TableCell>
                                                    <TableCell className="text-gray-700 text-sm">
                                                        <div className="scale-75 origin-left">
                                                            {getStatusBadge(absence.workflowState)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-gray-700 text-sm">
                                                        {formatDate(absence.appliedDate)}
                                                    </TableCell>
                                                    <TableCell className="text-gray-700 text-sm">
                                                        {(absence.workflowState === 'INITIATED' || absence.workflowState === 'VALIDATED') && (
                                                            <div className="flex flex-col gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                                                                    onClick={() => handleApproveLeave(absence._id)}
                                                                >
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 px-3 text-xs bg-red-600 hover:bg-red-700"
                                                                    onClick={() => handleRejectLeave(absence._id)}
                                                                >
                                                                    <XCircle className="h-3 w-3 mr-1" />
                                                                    Reject
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 px-3 text-xs bg-gray-600 hover:bg-gray-700"
                                                                    onClick={() => handleCancelLeave(absence._id)}
                                                                >
                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {absence.workflowState === 'APPROVED' && (
                                                            <div className="flex flex-col gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    className="h-7 px-3 text-xs bg-gray-600 hover:bg-gray-700"
                                                                    onClick={() => handleCancelLeave(absence._id)}
                                                                >
                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {absence.workflowState !== 'INITIATED' && absence.workflowState !== 'VALIDATED' && absence.workflowState !== 'APPROVED' && (
                                                            <span className="text-xs text-gray-500">No action needed</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination for Leave of Absence */}
                            <Pagination
                                currentPage={absencePage}
                                totalPages={getTotalPages(leaveOfAbsenceData.length, absencePageSize)}
                                onPageChange={setAbsencePage}
                                pageSize={absencePageSize}
                                onPageSizeChange={(size) => {
                                    setAbsencePageSize(size)
                                    setAbsencePage(1) // Reset to first page when changing page size
                                }}
                                totalItems={leaveOfAbsenceData.length}
                            />
                        </CardContent>
                    </Card>
                </div>



                {/* Additional Manager Features */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
                    {/* <Card>
                        <CardHeader>
                            <CardTitle>Team Leave Overview</CardTitle>
                            <CardDescription>
                                Summary of your team's leave patterns
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span>On Leave Today</span>
                                    <Badge variant="secondary">
                                        {(() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            const todayFormatted = today.split('-').reverse().join('-'); // Convert to dd-mm-yyyy format

                                            // Count employees on leave today from both tables
                                            const onLeaveToday = [
                                                ...leaveApplications.filter(app =>
                                                    app.workflowState === 'APPROVED' &&
                                                    app.leaves?.some((leave: any) =>
                                                        leave.date === todayFormatted ||
                                                        (new Date(leave.date) >= new Date(app.fromDate) &&
                                                            new Date(leave.date) <= new Date(app.toDate))
                                                    )
                                                ),
                                                ...leaveOfAbsenceData.filter(absence =>
                                                    absence.workflowState === 'APPROVED' &&
                                                    new Date(absence.firstDayOfAbsence) <= new Date() &&
                                                    new Date(absence.estimatedLastDayOfAbsence) >= new Date()
                                                )
                                            ];

                                            // Get unique employee IDs
                                            const uniqueEmployees = new Set([
                                                ...onLeaveToday.map(app => app.employeeID)
                                            ]);

                                            return uniqueEmployees.size;
                                        })()}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Pending Approvals</span>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                        {approvalRequests.length}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>This Month's Approvals</span>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                        {(() => {
                                            const currentMonth = new Date().getMonth();
                                            const currentYear = new Date().getFullYear();

                                            const approvedThisMonth = [
                                                ...leaveApplications.filter(app => {
                                                    if (app.workflowState !== 'APPROVED') return false;
                                                    const appliedDate = new Date(app.appliedDate);
                                                    return appliedDate.getMonth() === currentMonth &&
                                                        appliedDate.getFullYear() === currentYear;
                                                }),
                                                ...leaveOfAbsenceData.filter(absence => {
                                                    if (absence.workflowState !== 'APPROVED') return false;
                                                    const appliedDate = new Date(absence.appliedDate);
                                                    return appliedDate.getMonth() === currentMonth &&
                                                        appliedDate.getFullYear() === currentYear;
                                                })
                                            ];

                                            return approvedThisMonth.length;
                                        })()}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Total Leave Days This Month</span>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                        {(() => {
                                            const currentMonth = new Date().getMonth();
                                            const currentYear = new Date().getFullYear();

                                            const leaveDays = leaveApplications.filter(app => {
                                                if (app.workflowState !== 'APPROVED') return false;
                                                const appliedDate = new Date(app.appliedDate);
                                                return appliedDate.getMonth() === currentMonth &&
                                                    appliedDate.getFullYear() === currentYear;
                                            }).reduce((total, app) => total + (app.leaves?.length || 0), 0);

                                            const absenceDays = leaveOfAbsenceData.filter(absence => {
                                                if (absence.workflowState !== 'APPROVED') return false;
                                                const appliedDate = new Date(absence.appliedDate);
                                                return appliedDate.getMonth() === currentMonth &&
                                                    appliedDate.getFullYear() === currentYear;
                                            }).reduce((total, absence) => total + (absence.totalDays || 0), 0);

                                            return leaveDays + absenceDays;
                                        })()}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Rejected This Month</span>
                                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                                        {(() => {
                                            const currentMonth = new Date().getMonth();
                                            const currentYear = new Date().getFullYear();

                                            const rejectedThisMonth = [
                                                ...leaveApplications.filter(app => {
                                                    if (app.workflowState !== 'REJECTED') return false;
                                                    const appliedDate = new Date(app.appliedDate);
                                                    return appliedDate.getMonth() === currentMonth &&
                                                        appliedDate.getFullYear() === currentYear;
                                                }),
                                                ...leaveOfAbsenceData.filter(absence => {
                                                    if (absence.workflowState !== 'REJECTED') return false;
                                                    const appliedDate = new Date(absence.appliedDate);
                                                    return appliedDate.getMonth() === currentMonth &&
                                                        appliedDate.getFullYear() === currentYear;
                                                })
                                            ];

                                            return rejectedThisMonth.length;
                                        })()}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card> */}

                    {/* <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>
                                Common manager tasks
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-start">
                                    <User className="h-4 w-4 mr-2" />
                                    View Team Calendar
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Leave Policy Settings
                                </Button>
                                <Button variant="outline" className="w-full justify-start">
                                    <Bell className="h-4 w-4 mr-2" />
                                    Notification Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card> */}
                {/* </div> */}
            </main>
        </div>
    )
} 