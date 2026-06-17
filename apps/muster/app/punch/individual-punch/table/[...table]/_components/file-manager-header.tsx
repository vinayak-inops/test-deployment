"use client"

import { MoreHorizontal, Download, Calendar, Users, Clock, FileText, Settings } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover"
import { useEffect, useState } from "react"
import { useAdminRole } from "@inops/store/src/hooks/useAdminRole"

interface FileManagerHeaderProps {
  title?: string
  description?: string
  onPunchApplication?: () => void
  onRequestPunch?: () => void
  onDownloadPDF?: () => void
  isUploading?: boolean
  showSimpleTasks?: boolean // New prop to show only Punch In/Out options
}

export default function FileManagerHeader({
  title = "Attendance Records",
  description = "View and manage employee punch records and attendance data",
  onPunchApplication,
  onRequestPunch,
  onDownloadPDF,
  isUploading = false,
  showSimpleTasks = false
}: FileManagerHeaderProps) {
  const [isTaskManagerOpen, setIsTaskManagerOpen] = useState(false)
  const [excelService, setExcelService] = useState<any>(null);
  const [addNewPunch, setAddNewPunch] = useState<any>(null);
  const [applyApplication, setApplyApplication] = useState<any>(null);
  const [knowStatus, setKnowStatus] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [allowedServices, setAllowedServices] = useState<string[]>([]);
  
  const contractorEmployee = "muster-punch-table"

  // Get admin role data from Redux
  const { adminRole } = useAdminRole();

  // Load allowed services from Redux only
  useEffect(() => {
    setIsClient(true);

    if (adminRole?.screenPermissions) {
      setAllowedServices(adminRole.screenPermissions);
    } else {
      setAllowedServices([]);
    }
  }, [adminRole]);

  // Set excel service from allowed services
  useEffect(() => {
    if (!isClient) return;

    const muster = allowedServices.find((service: any) => service.serviceName === "muster");
    setExcelService(muster);
    // silently ignore when not found
  }, [isClient, allowedServices]);

  // Get permissions for each task
  useEffect(() => {
    if (!excelService) return;

    const musterScreen = excelService.screens.find((screen: any) => screen.screenName === contractorEmployee);

    if (musterScreen) {
      const addNewPunch = musterScreen?.permissions[`addNewPunch`];
      const applyApplication = musterScreen?.permissions[`applyApplication`];
      const knowStatus = musterScreen?.permissions[`knowStatusOfApplication`];
      setAddNewPunch(addNewPunch);
      setApplyApplication(applyApplication);
      setKnowStatus(knowStatus);
    }
  }, [contractorEmployee, excelService]);

  // No cookie-based role detection; permissions are driven by screen tasks (applyApplication, knowStatus, addNewPunch)

  const handleDownloadPDF = () => {
    if (onDownloadPDF) {
      onDownloadPDF()
    } else {
    }
    setIsTaskManagerOpen(false)
  }

  const handlePunchApplication = () => {
    if (onPunchApplication) {
      onPunchApplication()
    } else {
    }
    setIsTaskManagerOpen(false)
  }

  const handleRequestPunch = () => {
    if (onRequestPunch) {
      onRequestPunch()
    } else {
    }
    setIsTaskManagerOpen(false)
  }

  const handleAddNewPunch = () => {
    setIsTaskManagerOpen(false)
  }

  const handlePunchIn = () => {
    setIsTaskManagerOpen(false)
  }

  const handlePunchOut = () => {
    setIsTaskManagerOpen(false)
  }



  return (
    <div className="mb-6">
      {/* Main Header */}
      <div className="flex items-center justify-between mb-4 group">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 border border-blue-200 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
              <Calendar className="w-5 h-5 text-blue-700 transition-colors duration-300 group-hover:text-blue-900" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-sm animate-pulse"></div>
          </div>
          <div className="transform transition-all duration-300 group-hover:translate-x-1">
            <h1 className="text-xl font-semibold text-gray-900">
              {title}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 transition-colors duration-300 group-hover:text-gray-600">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsTaskManagerOpen(!isTaskManagerOpen)}
            className="bg-[#0061ff] hover:bg-[#0052d9] text-white text-sm font-medium px-4 h-9 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105"
          >
            <Settings className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
            Manage Tasks
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-9 w-9 p-0 transition-all duration-300 hover:scale-110 hover:rotate-90"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            {/* <PopoverContent className="w-56 p-0 rounded-xl shadow-xl border border-gray-100 bg-white/95 backdrop-blur-md">
              <div className="px-4 py-3 border-b border-gray-100 text-xs font-semibold text-gray-500 tracking-wider uppercase bg-gradient-to-r from-gray-50 to-white rounded-t-xl">
                Actions
              </div>
              <button
                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition rounded-b-xl group"
                onClick={handleDownloadPDF}
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 group-hover:from-blue-200 group-hover:to-indigo-200">
                  <Download className="w-4 h-4 text-blue-500" />
                </span>
                Download PDF
              </button>
            </PopoverContent> */}
          </Popover>
        </div>
      </div>

      {/* Task Management Dropdown */}
      {isTaskManagerOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setIsTaskManagerOpen(false)}>
          <div
            className="absolute right-4 top-32 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dropdown Header - Sidebar Style */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Manage Tasks</h2>
              <button
                onClick={() => setIsTaskManagerOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Menu */}
            <div className="p-4">
              <div className="space-y-2">
                {showSimpleTasks ? (
                  // Simple Punch In/Out Options
                  <div className="space-y-1">
                    {/* Punch In */}
                    <div
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                      onClick={handlePunchIn}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 text-gray-600 group-hover:text-green-600">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          Punch In
                        </span>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>

                    {/* Punch Out */}
                    <div
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                      onClick={handlePunchOut}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 text-gray-600 group-hover:text-red-600">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                          Punch Out
                        </span>
                      </div>
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>

                    {/* Punch Application (permission-gated) */}
                    {applyApplication && (
                      <div
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={handlePunchApplication}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 text-gray-600 group-hover:text-blue-600">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                            Punch Application
                          </span>
                        </div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}

                    {/* Request for Punch (permission-gated) */}
                    {knowStatus && (
                      <div
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={handleRequestPunch}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 text-gray-600 group-hover:text-orange-600">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                            Request for Punch
                          </span>
                        </div>
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      </div>
                    )}

                    {/* Add New Punch (permission-gated) */}
                    {addNewPunch && (
                      <div
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={handleAddNewPunch}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 text-gray-600 group-hover:text-blue-600">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                            Add New Punch
                          </span>
                        </div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                      {addNewPunch && (
                        <div
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                          onClick={handleAddNewPunch}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 text-gray-600 group-hover:text-blue-600">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                              Add New Punch
                            </span>
                          </div>
                          <button className="w-5 h-5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      )}

                  </div>
                ) : (
                  // Original Complex Options
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      <span>ATTENDANCE</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1">
                      {/* Punch Application (hidden for user role) */}
                        {
                          applyApplication && (
                            <div
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                          onClick={() => {
                            handlePunchApplication()
                            setIsTaskManagerOpen(false)
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 text-gray-600 group-hover:text-blue-600">
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                              Punch Application
                            </span>
                          </div>
                          <button className="w-5 h-5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                          )
                        }

                      {/* Request for Punch */}
                      {
                        knowStatus && (
                          <div
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                        onClick={() => {
                          handleRequestPunch()
                          setIsTaskManagerOpen(false)
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 text-gray-600 group-hover:text-blue-600">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                            Request for Punch
                          </span>
                        </div>
                        <button className="w-5 h-5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                        )
                      }

                      
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dropdown Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm">
                Quick Actions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 