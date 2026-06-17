"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
// Reuse existing role-permissions hook (shared signature) from leave app
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"

function ServiceName() {
  const router = useRouter()

  // Get role permissions for approve/reject/cancel
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: 'applicationApplier',
    screenName: 'outDuty'
  });
  const { responseData: roleApprover } = useRolePermissions({
    serviceName: 'applicationApprover',
    screenName: 'outDuty'
  });

  // Derived permissions (based on requested keys)
  const canOutDutyPolicy = !!rolePermissions?.outDutyPolicy
  const canOutDutySelfApplications = !!rolePermissions?.self
  const canOutDutyAllApplications = !!rolePermissions?.all
  const canOutDutyApplications = canOutDutySelfApplications || canOutDutyAllApplications || roleApprover?.approve || roleApprover?.reject || roleApprover?.cancel

  

  const goToOtPolicy = () => {
    // router.push(`/master/policy/over-time`)
  }

  const goToOtApplications = () => {
    const scope = canOutDutyAllApplications ? "all" : "self"
    router.push(`/out-duty-management/out-duty-application`)
  }

  return (
    <div className="">
      <div className="flex justify-center px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
          <div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold text-gray-700">Out Duty Management</h2>
              <span className="text-blue-600 text-sm cursor-help">?</span>
            </div>
            <div className="space-y-3">
              {canOutDutyPolicy && (
                <button
                  onClick={goToOtPolicy}
                  className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {/* Shield Check icon */}
                      <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">OT Policy</h3>
                      <p className="text-sm text-gray-600">View and manage overtime policy configuration</p>
                    </div>
                  </div>
                </button>
              )}

              {canOutDutyApplications && (
                <button
                  onClick={goToOtApplications}
                  className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {/* Clock icon */}
                      <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Out Duty Applications</h3>
                      <p className="text-sm text-gray-600">Submit, track, and review overtime applications</p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceName

 