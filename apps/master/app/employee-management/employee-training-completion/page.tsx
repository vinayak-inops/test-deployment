"use client"

import { useSearchParams } from "next/navigation"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import EmployeeTrainingCompletionApplication from "./_components/employee-training-completion-application"
import EmployeeTrainingCompletionEditFormPage from "./_components/employee-training-completion-edit-form-page"
import PageNotFound from "@/components/page-notfound"

export default function EmployeeTrainingCompletionPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') as "add" | "edit" | "view" | null
  const id = searchParams.get('id')

  // Check role permissions
  const { responseData: rolePermissions, loading } = useRolePermissions({
    serviceName: "employeeManagement",
    screenName: "employeeTrainingCompletion",
  })

  // Check if user has view permission (minimum required to access this page)
  const hasViewPermission = rolePermissions?.view || false

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // If no view permission, show access restricted page
  if (!hasViewPermission) {
    return <PageNotFound />
  }

  // If mode is edit/view and id is provided, show edit form
  if ((mode === 'edit' || mode === 'view') && id) {
    return <EmployeeTrainingCompletionEditFormPage mode={mode} />
  }

  // Default: show list view
  return (
    <div className="pb-6">
      <EmployeeTrainingCompletionApplication />
    </div>
  )
}
