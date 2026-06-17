"use client"

import React, { useState } from "react"
import { Plus, TrendingUp, CheckCircle, Wallet, Gift, Home } from "lucide-react"

import { NewRequestPage } from "./components/new-request-page"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useRouter } from "next/navigation"

export default function LeaveDashboard() {
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState("dashboard")

    // Get role permissions for approve/reject/cancel
    const { responseData: rolePermissionCompOff } = useRolePermissions({
        serviceName: "applicationApplier",
        screenName: "compOff",
    })
    const { responseData: roleApproverCompOff } = useRolePermissions({
        serviceName: "applicationApprover",
        screenName: "compOff",
    })

    const selfCompOffApplications = !!rolePermissionCompOff?.self
    const allCompOffApplications = !!rolePermissionCompOff?.all
    const canPunchApplications =
        selfCompOffApplications ||
        allCompOffApplications ||
        roleApproverCompOff?.approve ||
        roleApproverCompOff?.reject ||
        roleApproverCompOff?.cancel

    // Get role permissions for approve/reject/cancel
    const { responseData: rolePermissionEncashment } = useRolePermissions({
        serviceName: "applicationApplier",
        screenName: "encashment",
    })
    const { responseData: roleApproverEncashment } = useRolePermissions({
        serviceName: "applicationApprover",
        screenName: "encashment",
    })

    const selfEncashmentApplications = !!rolePermissionEncashment?.self
    const allEncashmentApplications = !!rolePermissionEncashment?.all
    const canEncashmentApplications =
        selfEncashmentApplications ||
        allEncashmentApplications ||
        roleApproverEncashment?.approve ||
        roleApproverEncashment?.reject ||
        roleApproverEncashment?.cancel

    // Get role permissions for approve/reject/cancel
    const { responseData: rolePermissionLeave } = useRolePermissions({
        serviceName: "applicationApplier",
        screenName: "leave",
    })
    const { responseData: roleApproverLeave } = useRolePermissions({
        serviceName: "applicationApprover",
        screenName: "leave",
    })

    const selfLeaveApplications = !!rolePermissionLeave?.self
    const allLeaveApplications = !!rolePermissionLeave?.all
    const canLeaveApplications =
        selfLeaveApplications ||
        allLeaveApplications ||
        roleApproverLeave?.approve ||
        roleApproverLeave?.reject ||
        roleApproverLeave?.cancel

    // Get role permissions for approve/reject/cancel
    const { responseData: rolePermissionSpecialLeave } = useRolePermissions({
        serviceName: "applicationApplier",
        screenName: "specialLeave",
    })
    const { responseData: roleApproverSpecialLeave } = useRolePermissions({
        serviceName: "applicationApprover",
        screenName: "specialLeave",
    })
    const { responseData: rolePermissionWfh } = useRolePermissions({
        serviceName: "applicationApplier",
        screenName: "wfh",
    })
    const { responseData: roleApproverWfh } = useRolePermissions({
        serviceName: "applicationApprover",
        screenName: "wfh",
    })

    const selfSpecialLeaveApplications = !!rolePermissionSpecialLeave?.self
    const allSpecialLeaveApplications = !!rolePermissionSpecialLeave?.all
    const canSpecialLeaveApplications =
        selfSpecialLeaveApplications ||
        allSpecialLeaveApplications ||
        roleApproverSpecialLeave?.approve ||
        roleApproverSpecialLeave?.reject ||
        roleApproverSpecialLeave?.cancel
    const selfWfhApplications = !!rolePermissionWfh?.self
    const allWfhApplications = !!rolePermissionWfh?.all
    const canWfhApplications =
        selfWfhApplications ||
        allWfhApplications ||
        roleApproverWfh?.approve ||
        roleApproverWfh?.reject ||
        roleApproverWfh?.cancel

    const { responseData: roleApproverEmployeeManagement } = useRolePermissions({
        serviceName: "employeeManagement",
        screenName: "employeeBalance",
    })

    const canEmployeeManagement = !!roleApproverEmployeeManagement?.view

    if (currentPage === "new-request") {
        return (
            <div className=" flex justify-center items-center">
                <div className="max-w-7xl w-full mx-auto">
                    <NewRequestPage onBack={() => setCurrentPage("dashboard")} />
                </div>
            </div>
        )
    }

    if (currentPage === "encashment") {
        router.push("/leave-management/encashment-management")
    }

    // NEW: Handle Comp Off Application navigation
    if (currentPage === "comp-off") {
        router.push("/leave-management/compoff-application")
    }

    if (currentPage === "manager-approvals") {
        router.push("/leave-management/leave-application")
    }
    if (currentPage === "wfh") {
        router.push("/leave-management/wfh-application")
    }

    return (
        <div className="min-h-screen 0">
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {/* Main Action Cards */}
                <div className="flex justify-center px-4 py-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
                        {/* Leave Management Section */}
                        <div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-base font-semibold text-gray-700">Leave Management</h2>
                                <span className="text-blue-600 text-sm cursor-help">?</span>
                            </div>
                            <div className="space-y-3">
                                {/* New Leave Request Card */}
                                {(allSpecialLeaveApplications ||
                                    selfSpecialLeaveApplications ||
                                    allLeaveApplications ||
                                    selfLeaveApplications) && (
                                    <button
                                        onClick={() => setCurrentPage("new-request")}
                                        className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Plus className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">New Leave Request</h3>
                                                <p className="text-sm text-gray-600">
                                                    Submit new leave applications and time off requests
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )}

                                {/* Time Off Balance Card */}
                                {canEmployeeManagement && (
                                    <button
                                        onClick={() => router.push("/leave-management/employee-balance")}
                                        className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">Time Off Balance</h3>
                                                <p className="text-sm text-gray-600">
                                                    View your available leave balances and usage summary
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Applications & View Requests Section */}
                        <div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-base font-semibold text-gray-700">Applications & View Requests</h2>
                                <span className="text-blue-600 text-sm cursor-help">?</span>
                            </div>
                            <div className="space-y-3">
                                {/* Leave Encashment Card */}
                                {canEncashmentApplications && (
                                    <button
                                        onClick={() => setCurrentPage("encashment")}
                                        className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Wallet className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">Leave Encashment</h3>
                                                <p className="text-sm text-gray-600">
                                                    Handle leave encashment and convert unused days to cash.
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )}

                                {/* NEW: Comp Off Application Card */}
                                {canPunchApplications && (
                                    <button
                                        onClick={() => setCurrentPage("comp-off")}
                                        className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Gift className="w-6 h-6 text-amber-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">Comp Off Application</h3>
                                                <p className="text-sm text-gray-600">
                                                    Apply for compensatory off for overtime work
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )}
                                {canWfhApplications && (
                                    <button
                                        onClick={() => setCurrentPage("wfh")}
                                        className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Home className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">WFH Application</h3>
                                                <p className="text-sm text-gray-600">
                                                    Apply and manage work from home requests.
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )}

                                {/* Approval Request Card */}
                                {(canSpecialLeaveApplications || canLeaveApplications) && (
                                    <button
                                        onClick={() => setCurrentPage("manager-approvals")}
                                        className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">Approval Request</h3>
                                                <p className="text-sm text-gray-600">
                                                    Review and approve team leave requests
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
