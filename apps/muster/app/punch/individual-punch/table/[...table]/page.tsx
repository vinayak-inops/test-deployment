"use client"

import React, { useEffect } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import AttendanceCalendar from "../../calendar/[...calender]/_components/attendance-calendar"
import EmployeeCard from "../../calendar/[...calender]/_components/employee-info-panel"
import FileManager from "./_components/file-manager"

export default function Home() {
  const [contractEmp, setContractEmp] = React.useState<any>(null)
  const [employeeIdFromUrl, setEmployeeIdFromUrl] = React.useState<string | undefined>(undefined)

  // Read employeeId from URL on client only
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const id = params.get("employeeId") || undefined
      setEmployeeIdFromUrl(id)
    }
  }, [])

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

  return (
    <div className="px-12 flex justify-center pb-6">
      <div className="w-full max-w-7xl">
        <div className="w-full overflow-y-auto scrollbar-hide">
          {/* Only render EmployeeCard once contractEmp is loaded */}
          {loading && (
            <div className="w-full mx-auto my-4 rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
              Loading employee details...
            </div>
          )}

          {!loading && !contractEmp && (
            <div className="w-full mx-auto my-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No employee found for the provided Employee ID.
            </div>
          )}

          {contractEmp && (
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
                contractEmp.workOrder?.find((e: any) => e.isActive)?.workOrderNumber ?? ""
              }
              gender={contractEmp.gender ?? ""}
            />
          )}
        </div>

        <FileManager />
      </div>
    </div>
  )
}