"use client"
import { useState, useEffect } from "react";
import PunchCalender from "../../../individual-punch/calendar/[...calender]/_components/punch-calender";
import { VerticalSidebar } from "@/components/tab/vertica-sidebar-tab";
import MusterHeader from "./muster-header";
import EditPunchApplicationPage from "../../edit-punch-application/_components/edit-punch-application-page";
import EmployeeCard from "../../../individual-punch/calendar/[...calender]/_components/employee-info-panel";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";

function MusterPage() {
  const sampleAttendanceData = {
    employeeId: "",
    fromDate: "",
    toDate: "",
  }

  const [activeId, setActiveId] = useState<'monthlySummary' | 'editPunch'>("monthlySummary")
  const [employeeIdFromUrl, setEmployeeIdFromUrl] = useState<string | undefined>(undefined)
  const [contractEmp, setContractEmp] = useState<any>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Extract employeeId from URL on client side only
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const empId = params.get("employeeId") || undefined
      setEmployeeIdFromUrl(empId)
    }
  }, [])

  // Monitor when initial data is available
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 1000)

    if (employeeIdFromUrl) {
      setIsInitialLoading(false)
    }

    return () => clearTimeout(timer)
  }, [employeeIdFromUrl])

  // Fetch employee data
  const {
    data,
    error,
    loading,
    refetch,
  } = useRequest<any[]>({
    url: `map/contract_employee/search?employeeID=${employeeIdFromUrl ?? ""}`,
    method: "GET",
    onSuccess: (data: any) => {
      setContractEmp(data?.[0] ?? null)
    },
    onError: (error) => {
      console.error("Error fetching contract employee:", error)
      setContractEmp(null)
    },
  })

  useEffect(() => {
    if (employeeIdFromUrl) {
      refetch()
    }
  }, [employeeIdFromUrl])
  const sections = [
    {
      title: "Muster",
      items: [
        { id: "monthlySummary", label: "Monthly Summary", icon: "grid" },
        { id: "editPunch", label: "Edit Punch", icon: "book" },
      ],
    },
  ]
  return <div className='min-h-screen px-12'>
    <MusterHeader title="Muster Calendar" description="View monthly summary and edit punch records" />
    <div className='flex justify-center min-h-screen'>
      <div className="w-full max-w-7xl ">
        {/* Global header spanning sidebar and content */}

        <div className="flex w-full ">
          <VerticalSidebar
            sections={sections}
            activeId={activeId}
            onItemClick={(id) => setActiveId(id as 'monthlySummary' | 'editPunch')}
          />
          <div className="flex-1 overflow-auto p-8 pt-6">
            {/* Employee Information Panel - Show for both tabs */}
            {!isMounted || isInitialLoading || loading ? (
              <div className="bg-white mb-6 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 p-6">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <div className="text-lg font-medium text-gray-700">
                      {!isMounted
                        ? "Loading..."
                        : !employeeIdFromUrl
                          ? "Waiting for employee ID..."
                          : "Loading employee data..."}
                    </div>
                  </div>
                </div>
              </div>
            ) : contractEmp ? (
              <div className="mb-6">
                <EmployeeCard
                  name={`${contractEmp.firstName ?? ""} ${contractEmp.lastName ?? ""}`.trim() || "Unknown"}
                  department={
                    contractEmp.deployment?.department?.departmentName ??
                    contractEmp.deployment?.departmentName ??
                    "Not Assigned"
                  }
                  id={contractEmp.employeeID ?? ""}
                  managerId={contractEmp.manager ?? ""}
                  avatarUrl={contractEmp.photo ?? ""}
                  workOrderNumber={
                    contractEmp.workOrder?.find((e: any) => e.isActive === true)?.workOrderNumber ?? ""
                  }
                  gender={contractEmp.gender ?? ""}
                />
              </div>
            ) : (
              <div className="bg-white mb-6 rounded-xl shadow-lg border border-amber-200 bg-amber-50 overflow-hidden">
                <div className="p-4 text-sm text-amber-800">
                  No employee details found for the provided Employee ID.
                </div>
              </div>
            )}

            {/* Content based on active tab */}
            {activeId === 'monthlySummary' ? (
              <PunchCalender
                attendanceData={sampleAttendanceData}
                employeeId={employeeIdFromUrl}
                contractEmp={contractEmp}
              />
            ) : (
              <div className="-mt-4">
                <EditPunchApplicationPage employeeID={employeeIdFromUrl || ""} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
}

export default MusterPage