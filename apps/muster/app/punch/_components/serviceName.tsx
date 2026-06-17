import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MusterSearchPopup from "../muster-punch/_components/muster-search-popup";
import AttendancePopup from "./attendance-popup";
import PunchRequestsPopup from "./punch-requests-popup";
import PunchFormPopup from "./punch-form-popup";
import { useRolePermissions as useRolePermissionsByScreenArray } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useGetTenantCode } from "@/hooks/useGetTenantCode";

function ServiceName() {
    const router = useRouter();
    const [showPunchRequestsPopup, setShowPunchRequestsPopup] = useState(false);
    const [isPunchApplicationOpen, setIsPunchApplicationOpen] = useState(false);
    const [isEditPunchApplicationOpen, setIsEditPunchApplicationOpen] = useState(false);
    const [showMusterSearchPopup, setShowMusterSearchPopup] = useState(false);
    const [preSelectedEmployeeId, setPreSelectedEmployeeId] = useState<string | undefined>(undefined);
    const [showAttendancePopup, setShowAttendancePopup] = useState(false);
    const [punchRequestsEmployeeId, setPunchRequestsEmployeeId] = useState<string | undefined>(undefined);
    const [editApplicationData, setEditApplicationData] = useState<any>(null);
    
    // Filter states for edit punch applications
    const [activeTab, setActiveTab] = useState<string>("pending");
    const [searchField, setSearchField] = useState("employeeID");
    const [searchValue, setSearchValue] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    
    const tenantCode = useGetTenantCode();
    const pageName = "muster-punch";

    // Get role permissions for approve/reject/cancel (Punch Applications)
    const { responseData: rolePermission } = useRolePermissionsByScreenArray({
        serviceName: 'applicationApplier',
        screenName: 'punch'
    });
    const { responseData: roleApprover } = useRolePermissionsByScreenArray({
        serviceName: 'applicationApprover',
        screenName: 'punch'
    });

    // Get role permissions for Edit Punch Application (Applier)
    const { responseData: editPunchApplierPermissions } = useRolePermissionsByScreenArray({
        serviceName: "applicationApplier",
        screenName: "editPunchApplication",
    });

    // Get role permissions for Edit Punch Application (Approver)
    const { responseData: editPunchApproverPermissions } = useRolePermissionsByScreenArray({
        serviceName: "applicationApprover",
        screenName: "editPunchApplication",
      })
    
    const { responseData: roleApproverAddNewPunch } = useRolePermissionsByScreenArray({
        serviceName: 'muster',
        screenName: 'addNewPunch'
    });

    const canRoleApproverAddNewPunch = !!roleApproverAddNewPunch?.addPunchAll || !!roleApproverAddNewPunch?.addPunchSelf || roleApproverAddNewPunch?.all || roleApproverAddNewPunch?.self;

    const { responseData: roleApproverMusterPunch } = useRolePermissionsByScreenArray({
        serviceName: 'muster',
        screenName: 'musterPunch'
    });
    const canRoleApproverMusterPunch = !!roleApproverMusterPunch?.editPunchAll || !!roleApproverMusterPunch?.editPunchSelf || roleApproverMusterPunch?.all || roleApproverMusterPunch?.self;

    const { responseData: roleApproverRawPunch } = useRolePermissionsByScreenArray({
        serviceName: 'muster',
        screenName: 'rawPunch'
    });
    const canRoleApproverRawPunch = !!roleApproverRawPunch?.all || !!roleApproverRawPunch?.self;

    const { responseData: roleApproverSuspectedPunches } = useRolePermissionsByScreenArray({
        serviceName: 'muster',
        screenName: 'suspectedPunches'
    });
    const canRoleApproverSuspectedPunches = !!roleApproverSuspectedPunches?.all || !!roleApproverSuspectedPunches?.self || roleApproverSuspectedPunches?.approve;

    const selfPunchApplications = !!rolePermission?.self;
    const allPunchApplications = !!rolePermission?.all;
    const canPunchApplications = selfPunchApplications || allPunchApplications || roleApprover?.approve || roleApprover?.reject || roleApprover?.cancel;

    // Edit Punch Application permissions
    const selfEditPunchApplications = !!editPunchApplierPermissions?.self;
    const allEditPunchApplications = !!editPunchApplierPermissions?.all;
    const canEditPunchApplications =
        selfEditPunchApplications ||
        allEditPunchApplications ||
        !!editPunchApproverPermissions?.approve ||
        !!editPunchApproverPermissions?.reject ||
        !!editPunchApproverPermissions?.cancel;

    // Use the role permissions hook for muster-punch screen
    const { 
        responseData: rolePermissions, 
    } = useRolePermissionsByScreenArray({
        serviceName: "muster",
        screenName: pageName
    });

    // Use separate role permissions hook for add-new-punch screen
    const { 
        responseData: addNewPunchPermissions, 
    } = useRolePermissionsByScreenArray({
        serviceName: "muster",
        screenName: "add-new-punch"
    });

    // Derive permissions from rolePermissions (muster-punch screen)
    const canMuster = !!(rolePermissions?.musterRollSelf || rolePermissions?.musterRollAll);
    const canRawPunch = !!(rolePermissions?.rawPunchSelf || rolePermissions?.rawPunchAll);
    const canPunchApps = !!(rolePermissions?.punchApplicationsSelf || rolePermissions?.punchApplicationsAll || rolePermissions?.punchApplicationApprover);
    const canSuspected = !!rolePermissions?.suspectedPunchAll;
    
    // Derive permissions from addNewPunchPermissions (add-new-punch screen)
    const canAddNewPunch = !!(addNewPunchPermissions?.addNewPunchAll || addNewPunchPermissions?.addNewPunchSelf);

    // Define tabs for edit punch applications
    const editPunchTabs = [
        { key: "pending", label: "Pending", activeBg: "bg-blue-100", activeText: "text-blue-800", activeBorder: "border-blue-400", hoverBg: "border-blue-400", hoverText: "hover:text-blue-700" },
        { key: "approved", label: "Approved", activeBg: "bg-green-100", activeText: "text-green-800", activeBorder: "border-green-400", hoverBg: "border-green-400", hoverText: "hover:text-green-700" },
        { key: "rejected", label: "Rejected", activeBg: "bg-red-100", activeText: "text-red-800", activeBorder: "border-red-400", hoverBg: "border-red-400", hoverText: "hover:text-red-700" },
        { key: "cancelled", label: "Cancelled", activeBg: "bg-gray-100", activeText: "text-gray-800", activeBorder: "border-gray-400", hoverBg: "border-gray-400", hoverText: "hover:text-gray-700" },
    ];

    // Navigation function for muster punch page
    const navigateToMusterPunch = () => {
        router.push('/punch/muster-punch');
    };

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

    // Get stored role information from cookies
    const storedRoleInfo = useMemo(() => {
        try {
            const keyclockroleinfo = getCookie("keyclockroleinfo");
            if (keyclockroleinfo) {
                return JSON.parse(keyclockroleinfo);
            }
        } catch {
            // ignore
        }
        return null as any;
    }, []);

    // Navigate with employee id for Muster Individual
    const openMusterSearchPopupWithId = () => {
        const id = storedRoleInfo?.employeeId || "";
        setPreSelectedEmployeeId(id);
        setShowMusterSearchPopup(true);
    };

    const closeMusterSearchPopup = () => {
        setShowMusterSearchPopup(false);
        setPreSelectedEmployeeId(undefined);
    };

    // Open Attendance popup with pre-selected employee id
    const openAttendancePopupWithId = () => {
        const id = storedRoleInfo?.employeeId || "";
        setPreSelectedEmployeeId(id);
        setShowAttendancePopup(true);
    };

    const closeAttendancePopup = () => {
        setShowAttendancePopup(false);
        setPreSelectedEmployeeId(undefined);
    };

    // Navigation function for individual punch page
    const navigateToIndividualPunch = () => {
        router.push('/punch/individual-punch');
    };

    // Function to open punch requests popup
    const openPunchRequestsPopup = () => {
        setShowPunchRequestsPopup(true);
    };
    
    const openPunchRequestsPopupWithId = (id: any) => {
        setPunchRequestsEmployeeId(id);
        setShowPunchRequestsPopup(true);
    };

    // Function to close punch requests popup
    const closePunchRequestsPopup = () => {
        setShowPunchRequestsPopup(false);
    };

    // Navigate to Add New Punch page
    const navigateToAddNewPunch = () => {
        router.push('/punch/added-punch');
    };

    // Punch Applications popup
    const openPunchApplicationPopup = () => {
        const id = storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || "";
        setPreSelectedEmployeeId(id || undefined);
        setIsPunchApplicationOpen(true);
    };
    
    const closePunchApplicationPopup = () => {
        setIsPunchApplicationOpen(false);
        setPreSelectedEmployeeId(undefined);
    };

    // Edit Punch Application popup
    const openEditPunchApplicationPopup = (applicationData?: any) => {
        if (applicationData) {
            setEditApplicationData(applicationData);
        } else {
            const id = storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || "";
            setPreSelectedEmployeeId(id || undefined);
            setEditApplicationData(null);
        }
        setIsEditPunchApplicationOpen(true);
    };
    
    const closeEditPunchApplicationPopup = () => {
        setIsEditPunchApplicationOpen(false);
        setPreSelectedEmployeeId(undefined);
        setEditApplicationData(null);
    };

    // Handle form submission for new punch application
    const handlePunchFormSubmit = async (data: any) => {
        try {
            // Basic validation
            if (!data.employeeID || !data.punchedTime || !data.attendanceDate) {
                console.error("Please fill in all required fields");
                return false;
            }

            // Format the data according to the required JSON structure
            const formattedData = {
                tenant: tenantCode,
                action: "insert",
                collectionName: "forgotPunchApplication",
                id: "",
                event: "reportGeneration",
                data: {
                    tenantCode: "tenant1",
                    workflowName: "EditPunch Application",
                    uploadedBy: "user",
                    createdOn: new Date().toISOString(),
                    employeeID: data.employeeID,
                    punchedTime: data.punchedTime,
                    transactionTime: data.transactionTime,
                    inOut: data.inOut,
                    typeOfMovement: data.typeOfMovement,
                    uploadTime: data.uploadTime,
                    attendanceDate: data.attendanceDate,
                    previosAttendanceDate: data.previosAttendanceDate,
                    Status: data.Status,
                    organizationCode: "ALL",
                    isDeleted: data.isDeleted,
                    appliedDate: new Date().toISOString().split('T')[0],
                    workflowState: "INITIATED",
                    remarks: data.remarks
                }
            };

            
            // Close the popup after successful submission
            closePunchApplicationPopup();
            
            return true;
        } catch (error) {
            console.error("Error submitting punch application:", error);
            return false;
        }
    };

    // Handle form submission for edit punch application
    const handleEditPunchFormSubmit = async (data: any) => {
        try {
            // Basic validation
            if (!data.employeeID || !data.punchedTime || !data.attendanceDate) {
                console.error("Please fill in all required fields");
                return false;
            }

            // Close the popup after successful submission
            closeEditPunchApplicationPopup();
            
            return true;
        } catch (error) {
            console.error("Error submitting edit punch application:", error);
            return false;
        }
    };

    // Navigation to Edit Punch Applications page/list
    const navigateToEditPunchApplications = () => {
        router.push('/punch/edit-punch-application');
    };

    return (
        <div className="">
            {/* Main Content Area - Centered */}
            <div className="flex justify-center px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
                    {/* Attendance Management Section */}
                    <div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-base font-semibold text-gray-700">Attendance Management & Review</h2>
                            <span className="text-blue-600 text-sm cursor-help">?</span>
                        </div>
                        <div className="space-y-3">
                            {/* Muster Card */}
                            {canRoleApproverMusterPunch && (
                                <button 
                                    onClick={navigateToMusterPunch}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Muster</h3>
                                            <p className="text-sm text-gray-600">Manage muster roll and employee attendance records</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {/* Raw Punch Card */}
                            {canRoleApproverRawPunch && (
                                <button 
                                    onClick={navigateToIndividualPunch}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Raw Punch Records</h3>
                                            <p className="text-sm text-gray-600">View individual punch records from date range</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {/* Suspected Punches Card */}
                            {canRoleApproverSuspectedPunches && (
                                <button 
                                    onClick={() => router.push('/punch/suspectedPunches')}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-red-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Suspected Punches</h3>
                                            <p className="text-sm text-gray-600">Review and manage suspected punch records that need attention</p>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Applications & Data Entry Section */}
                    <div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-base font-semibold text-gray-700">Applications & Data Entry</h2>
                            <span className="text-blue-600 text-sm cursor-help">?</span>
                        </div>
                        <div className="space-y-3">
                            {/* Punch Applications Card */}
                            {canPunchApplications && (
                                <button 
                                    onClick={() => router.push('/punch/punch-application')}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Punch Applications</h3>
                                            <p className="text-sm text-gray-600">View and manage all punch change applications</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {/* Edit Punch Applications Card */}
                            {canEditPunchApplications && (
                                <button 
                                    onClick={navigateToEditPunchApplications}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Edit Punch Applications</h3>
                                            <p className="text-sm text-gray-600">View, edit and manage punch change requests</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {/* Add New Punch Card */}
                            {canRoleApproverAddNewPunch && (
                                <button 
                                    onClick={navigateToAddNewPunch}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Add New Punch</h3>
                                            <p className="text-sm text-gray-600">Manually add a new punch entry into the system</p>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Punch Requests Popup */}
            <PunchRequestsPopup
                isOpen={showPunchRequestsPopup}
                onClose={closePunchRequestsPopup}
                initialSelectedRequest={null}
                selectedRequestId={null}
                employeeId={punchRequestsEmployeeId}
            />

            {/* Punch Application Popup */}
            <PunchFormPopup
                isOpen={isPunchApplicationOpen}
                onClose={closePunchApplicationPopup}
                initialValues={{
                    employeeID: preSelectedEmployeeId || "",
                    punchedTime: new Date().toTimeString().slice(0, 5),
                    transactionTime: new Date().toTimeString().slice(0, 5),
                    inOut: "I",
                    typeOfMovement: "",
                    attendanceDate: new Date().toISOString().split("T")[0],
                    remarks: "Manual punch change request",
                }}
                onSubmit={handlePunchFormSubmit}
                refetch={()=>{}}
            />

            {/* Edit Punch Application Popup */}
            {/* Punch Application Popup */}
            <PunchFormPopup
                isOpen={isPunchApplicationOpen}
                onClose={closePunchApplicationPopup}
                initialValues={{
                    employeeID: preSelectedEmployeeId || "",
                    punchedTime: new Date().toTimeString().slice(0, 5),
                    transactionTime: new Date().toTimeString().slice(0, 5),
                    inOut: "I",
                    typeOfMovement: "",
                    attendanceDate: new Date().toISOString().split("T")[0],
                    remarks: "Manual punch change request",
                  }}
                onSubmit={handlePunchFormSubmit}
                refetch={()=>{}}
            />

            {/* Muster Search Popup */}
            <MusterSearchPopup
                isOpen={showMusterSearchPopup}
                onClose={closeMusterSearchPopup}
                preSelectedEmployeeId={preSelectedEmployeeId}
            />

            {/* Attendance Popup */}
            <AttendancePopup
                isOpen={showAttendancePopup}
                onClose={closeAttendancePopup}
                preSelectedEmployeeId={preSelectedEmployeeId}
                onSubmit={() => {}}
            />
        </div>
    );
}

export default ServiceName;
