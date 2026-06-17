"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/fields/sidebar-local'
import ApproverEditHeader from './approver-edit-header'
import StepLeaveApprovers from './steps/step-leave-approvers'
import StepPunchApprovers from './steps/step-punch-approvers'
import StepShiftApprovers from './steps/step-shift-approvers'
import StepOutDutyApprovers from './steps/step-out-duty-approvers'
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode'
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray'

export interface ApproverFormData {
  _id?: string
  employeeID: string
  leaveApprover?: string[]
  punchApprover?: string[]
  shiftApprover?: string[]
  outDutyApprover?: string[]
  organizationCode?: string
  tenantCode?: string
}

interface ApproverEditFormPageProps {
  initialData?: ApproverFormData | null
  mode?: "add" | "edit" | "view"
  onBack?: () => void
  onDataChange?: () => void
}

export default function ApproverEditFormPage({
  initialData,
  mode: propMode = "edit",
  onBack,
  onDataChange,
}: ApproverEditFormPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()
  
  // Check role permissions
  const { responseData: rolePermissions, loading: loadingPermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName: "contractEmployeeApprover",
  })

  const hasEditPermission = rolePermissions?.edit || false
  const hasViewPermission = rolePermissions?.view || false

  // Get mode from searchParams if available, otherwise use prop
  const modeFromParams = searchParams.get('mode') as "add" | "edit" | "view" | null
  const requestedMode = modeFromParams || propMode

  // Determine effective mode based on permissions
  // If user only has view permission (no edit), force mode to "view"
  // If user has edit permission, allow the requested mode (but still respect explicit "view" from URL)
  const effectiveMode = useMemo(() => {
    // If explicitly "view" in URL, always respect it
    if (requestedMode === "view") {
      return "view"
    }
    // If user doesn't have edit permission, force to view
    if (!hasEditPermission) {
      return "view"
    }
    // If user has edit permission, allow the requested mode
    return requestedMode
  }, [requestedMode, hasEditPermission])
  const [activeId, setActiveId] = useState<string>('leaveApprovers')
  const [formData, setFormData] = useState<ApproverFormData>({
    employeeID: '',
    leaveApprover: [],
    punchApprover: [],
    shiftApprover: [],
    outDutyApprover: [],
    organizationCode: tenantCode || '',
    tenantCode: tenantCode || '',
  })

  // Fetch approver data if we have an ID
  const approverId = searchParams.get('id') || initialData?._id
  const { data: approverData, loading: loadingApprover, refetch: refetchApprover } = useRequest<any>({
    url: approverId ? `contract_employee_approver/search` : '',
    method: 'POST',
    data: approverId ? [
      {
        field: '_id',
        operator: 'is',
        value: approverId,
      },
      {
        field: 'tenantCode',
        operator: 'is',
        value: tenantCode,
      },
    ] : [],
    dependencies: [approverId, tenantCode],
    onSuccess: (data: any) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const item = data[0]
        setFormData({
          _id: item._id || '',
          employeeID: item.employeeID || '',
          leaveApprover: Array.isArray(item.leaveApprover) ? item.leaveApprover : [],
          punchApprover: Array.isArray(item.punchApprover) ? item.punchApprover : [],
          shiftApprover: Array.isArray(item.shiftApprover) ? item.shiftApprover : [],
          outDutyApprover: Array.isArray(item.outDutyApprover) ? item.outDutyApprover : [],
          organizationCode: item.organizationCode || tenantCode || '',
          tenantCode: item.tenantCode || tenantCode || '',
        })
      }
    },
    onError: () => {},
  })

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setActiveId('leaveApprovers')
    }
  }, [initialData])

  // Sidebar sections configuration
  const sidebarSections = [
    {
      title: 'Approvers',
      items: [
        { id: 'leaveApprovers', label: 'Leave Approvers', icon: 'calendar' },
        { id: 'punchApprovers', label: 'Punch Approvers', icon: 'clock' },
        { id: 'shiftApprovers', label: 'Shift Approvers', icon: 'timer' },
        { id: 'outDutyApprovers', label: 'Out Duty Approvers', icon: 'map-pin' },
      ],
    },
  ]

  useEffect(() => {
    refetchApprover()
  }, [approverId])

  // Handle sidebar item click
  const handleSidebarClick = (id: string) => {
    setActiveId(id)
  }

  // Render content based on active sidebar item
  const renderContent = () => {
    switch (activeId) {
      case 'leaveApprovers':
        return (
          <StepLeaveApprovers
            approvers={formData.leaveApprover || []}
            onAdd={(id: string) => setFormData(prev => ({
              ...prev,
              leaveApprover: [...(prev.leaveApprover || []), id]
            }))}
            onRemove={(id: string) => setFormData(prev => ({
              ...prev,
              leaveApprover: (prev.leaveApprover || []).filter(a => a !== id)
            }))}
            onSave={() => {
              onDataChange?.()
              refetchApprover?.()
            }}
            mode={effectiveMode}
            contextData={formData}
          />
        )
      case 'punchApprovers':
        return (
          <StepPunchApprovers
            approvers={formData.punchApprover || []}
            onAdd={(id) => setFormData(prev => ({
              ...prev,
              punchApprover: [...(prev.punchApprover || []), id]
            }))}
            onRemove={(id) => setFormData(prev => ({
              ...prev,
              punchApprover: (prev.punchApprover || []).filter(a => a !== id)
            }))}
            onSave={() => {
              onDataChange?.()
              refetchApprover?.()
            }}
            mode={effectiveMode}
            contextData={formData}
          />
        )
      case 'shiftApprovers':
        return (
          <StepShiftApprovers
            approvers={formData.shiftApprover || []}
            onAdd={(id: string) => setFormData(prev => ({
              ...prev,
              shiftApprover: [...(prev.shiftApprover || []), id]
            }))}
            onRemove={(id: string) => setFormData(prev => ({
              ...prev,
              shiftApprover: (prev.shiftApprover || []).filter(a => a !== id)
            }))}
            onSave={() => {
              onDataChange?.()
              refetchApprover?.()
            }}
            mode={effectiveMode}
            contextData={formData}
          />
        )
      case 'outDutyApprovers':
        return (
          <StepOutDutyApprovers
            approvers={formData.outDutyApprover || []}
            onAdd={(id) => setFormData(prev => ({
              ...prev,
              outDutyApprover: [...(prev.outDutyApprover || []), id]
            }))}
            onRemove={(id) => setFormData(prev => ({
              ...prev,
              outDutyApprover: (prev.outDutyApprover || []).filter(a => a !== id)
            }))}
            onSave={() => {
              onDataChange?.()
              refetchApprover?.()
            }}
            mode={effectiveMode}
            contextData={formData}
          />
        )
      default:
        return null
    }
  }

  // Ensure onBack always navigates to list view
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      // Fallback: navigate back to test page without query params
      router.push('/employee-management/contract-employee-approver')
    }
  }

  // Show loading state while checking permissions or loading approver data
  if (loadingPermissions || (loadingApprover && approverId)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-muted-foreground">
          {loadingPermissions ? 'Checking permissions...' : 'Loading approver data...'}
        </p>
      </div>
    )
  }

  // If user doesn't have view permission, they shouldn't be here (should be blocked at page level)
  // But as a safety check, if no permissions at all, show nothing
  if (!hasViewPermission && !hasEditPermission) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-red-600">You do not have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden relative">
      {/* Header */}
      <ApproverEditHeader 
        mode={effectiveMode} 
        onBack={handleBack} 
        employeeID={formData.employeeID || undefined}
      />

      {/* Main Content Area */}
      <div className="flex justify-center flex-1 overflow-hidden">
        <div className="w-full max-w-7xl h-full flex flex-col">
          <div className="flex w-full h-full overflow-hidden">
            {/* Left - Sidebar */}
            <div className="flex-shrink-0 h-full">
              <Sidebar
                sections={sidebarSections}
                activeId={activeId}
                onItemClick={handleSidebarClick}
              />
            </div>

            {/* Right - Form Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 pt-6 min-w-0">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>    
    </div>
  )
}

