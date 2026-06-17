"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
// Reuse existing role-permissions hook (shared signature) from leave app
import { useRolePermissions } from "@/hooks/role-control/useRolePermissions"
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

function ServiceName() {
  const router = useRouter()
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

  // Screen identification for permissions
  const pageName = "ot-application"

  // Load role permissions for OT Management
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "OT",
    screenName: pageName,
  })

  // Derived permissions (based on requested keys)
  const canOtPolicy = !!rolePermissions?.otPolicy
  const canOtSelfApplications = !!rolePermissions?.otchApplicationsSelf
  const canOtAllApplications = !!rolePermissions?.otApplicationsAll
  const canOtApplications = canOtSelfApplications || canOtAllApplications

  // Navigation helpers
  const goToOtPolicy = () => {
    router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/master/policy/over-time`)
  }

  const goToOtApplications = () => {
    const scope = canOtAllApplications ? "all" : "self"
    router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/application/ot-management/ot-application`)
  }

  return (
    <div className="">
      <div className="flex justify-center px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
          <div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold text-gray-700">OT Management</h2>
              <span className="text-blue-600 text-sm cursor-help">?</span>
            </div>
            <div className="space-y-3">
              {canOtPolicy && (
                <button
                  onClick={goToOtPolicy}
                  className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">OT Policy</h3>
                      <p className="text-sm text-gray-600">View and manage overtime policy configuration</p>
                    </div>
                  </div>
                </button>
              )}

              {canOtApplications && (
                <button
                  onClick={goToOtApplications}
                  className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">OT Applications</h3>
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

 