"use client"

import React, { useMemo } from 'react'
import NewLeaveApplicationPage from './_components/new-leave-application-page'
import { useRolePermissions } from '@/hooks/role-control/useRolePermissions'

export default function Page() {
  // Screen/service identifiers
  const serviceName = 'leave'
  const screenName = 'leaveManagement'

  // Fetch role permissions
  const { responseData: permissions, loading } = useRolePermissions({ serviceName, screenName })

  // Determine access: allow if either self or all is granted
  const isAllowed = useMemo(() => {
    if (!permissions) return false
    // Align with contractor page permission keys
    return Boolean((permissions as any)?.newLeaveRequestSelf || (permissions as any)?.newLeaveRequestAll)
  }, [permissions])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">Loading permissions...</div>
    )
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="rounded-md border border-gray-200 bg-white px-6 py-4 text-center shadow-sm">
          <div className="text-base font-semibold text-gray-800">Access denied</div>
          <div className="mt-1 text-sm text-gray-600">You do not have permission to create a new leave application.</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <NewLeaveApplicationPage />
    </div>
  )
}