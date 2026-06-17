"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import EmployeeTrainingCompletionEditHeader from './employee-training-completion-edit-header'
import StepTrainings from './steps/step-trainings'
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode'
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray'

export interface TrainingCompletionFormData {
  _id?: string
  employeeID: string
  trainingsCompleted?: string[]
  organizationCode?: string
  tenantCode?: string
}

interface EmployeeTrainingCompletionEditFormPageProps {
  initialData?: TrainingCompletionFormData | null
  mode?: "add" | "edit" | "view"
  onBack?: () => void
  onDataChange?: () => void
}

export default function EmployeeTrainingCompletionEditFormPage({
  initialData,
  mode: propMode = "edit",
  onBack,
  onDataChange,
}: EmployeeTrainingCompletionEditFormPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()
  
  // Check role permissions
  const { responseData: rolePermissions, loading: loadingPermissions } = useRolePermissions({
    serviceName: "employeeManagement",
    screenName: "employeeTrainingCompletion",
  })

  const hasEditPermission = rolePermissions?.edit || false
  const hasViewPermission = rolePermissions?.view || false

  // Get mode from searchParams if available, otherwise use prop
  const modeFromParams = searchParams.get('mode') as "add" | "edit" | "view" | null
  const requestedMode = modeFromParams || propMode

  // Determine effective mode based on permissions
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

  const [formData, setFormData] = useState<TrainingCompletionFormData>({
    employeeID: '',
    trainingsCompleted: [],
    organizationCode: tenantCode || '',
    tenantCode: tenantCode || '',
  })

  // Fetch training completion data if we have an ID
  const recordId = searchParams.get('id') || initialData?._id
  const { data: recordData, loading: loadingRecord, refetch: refetchRecord } = useRequest<any>({
    url: recordId ? `employee_training_completion/search` : '',
    method: 'POST',
    data: recordId ? [
      {
        field: '_id',
        operator: 'is',
        value: recordId,
      },
      {
        field: 'tenantCode',
        operator: 'is',
        value: tenantCode,
      },
    ] : [],
    dependencies: [recordId, tenantCode],
    onSuccess: (data: any) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const item = data[0]
        setFormData({
          _id: item._id || '',
          employeeID: item.employeeID || '',
          trainingsCompleted: Array.isArray(item.trainingsCompleted) ? item.trainingsCompleted : [],
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
    }
  }, [initialData])

  useEffect(() => {
    refetchRecord()
  }, [recordId])

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      // Fallback: navigate back to list view
      router.push('/employee-management/employee-training-completion')
    }
  }

  // Show loading state while checking permissions or loading record data
  if (loadingPermissions || (loadingRecord && recordId)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-muted-foreground">
          {loadingPermissions ? 'Checking permissions...' : 'Loading record data...'}
        </p>
      </div>
    )
  }

  // If user doesn't have view permission, they shouldn't be here (should be blocked at page level)
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
      <EmployeeTrainingCompletionEditHeader 
        mode={effectiveMode} 
        onBack={handleBack} 
        employeeID={formData.employeeID || undefined}
      />

      {/* Main Content Area */}
      <div className="flex justify-center flex-1 overflow-hidden">
        <div className="w-full max-w-7xl h-full flex flex-col">
          <div className="flex w-full h-full overflow-hidden">
            {/* Form Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 pt-6 min-w-0">
              <StepTrainings
                trainings={formData.trainingsCompleted || []}
                onAdd={(code: string) => setFormData(prev => ({
                  ...prev,
                  trainingsCompleted: [...(prev.trainingsCompleted || []), code]
                }))}
                onRemove={(code: string) => setFormData(prev => ({
                  ...prev,
                  trainingsCompleted: (prev.trainingsCompleted || []).filter(c => c !== code)
                }))}
                onSave={() => {
                  onDataChange?.()
                  refetchRecord?.()
                }}
                mode={effectiveMode}
                contextData={formData}
              />
            </div>
          </div>
        </div>
      </div>    
    </div>
  )
}

