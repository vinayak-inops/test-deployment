"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Building2, MapPin, Settings, Users, Briefcase, Layers } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useSearchParams } from "next/navigation"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info"

interface DeploymentFormProps {
  mode?: "view"
  activeTab?: string
}

export function DeploymentForm({
  mode = "view",
  activeTab,
}: DeploymentFormProps) {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const {employeeId} = useKeyclockRoleInfo()
  const tenantCode = useGetTenantCode()

  const [deploymentData, setDeploymentData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [managerData, setManagerData] = useState<any>({})

  // Fetch employee deployment data
  const {
    data: employeeDataResponse,
    loading: isLoadingEmployeeData,
    error: employeeDataError,
    refetch: fetchEmployeeData
  } = useRequest<any>({
    url: 'company_employee/search',
    method: 'POST',
    data: [
      {
        field: "employeeID",
        value: employeeId,
        operator: "eq",
      },
      {
        field:"tenantCode",
        value:tenantCode,
        operator:"eq"
      }
    ],
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const employeeData = data[0]
        
        // Extract deployment data
        const deployment = employeeData.deployment || {}
        setDeploymentData(deployment)
        
        // Extract manager data
        setManagerData({
          manager: employeeData.manager || "",
          managerName: employeeData.managerName || "",
        })
        
        setLoading(false)
      } else {
        setError("No employee data found")
        setLoading(false)
      }
    },
    onError: (error) => {
      setError("Failed to load employee data")
      setLoading(false)
    },
    dependencies: [employeeId]
  })

  // Trigger fetch when employeeId is available
  useEffect(() => {
      fetchEmployeeData()
  }, [employeeId])

  // Helper function to format data display
  const formatField = (value: any) => {
    if (!value || value === "") return "-"
    return value
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Deployment Information Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Users className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Deployment Information</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Employee organizational placement and job details
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* 1. Organizational Structure */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <Layers className="h-4 w-4 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Organizational Structure</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {/* Subsidiary */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subsidiary</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(deploymentData.subsidiary?.subsidiaryName)}
                  </span>
                  {deploymentData.subsidiary?.subsidiaryCode && (
                    <span className="text-xs text-gray-500">
                      ({formatField(deploymentData.subsidiary?.subsidiaryCode)})
                    </span>
                  )}
                </div>
              </div>

              {/* Division */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Division</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(deploymentData.division?.divisionName)}
                  </span>
                  {deploymentData.division?.divisionCode && (
                    <span className="text-xs text-gray-500">
                      ({formatField(deploymentData.division?.divisionCode)})
                    </span>
                  )}
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(deploymentData.department?.departmentName)}
                  </span>
                  {deploymentData.department?.departmentCode && (
                    <span className="text-xs text-gray-500">
                      ({formatField(deploymentData.department?.departmentCode)})
                    </span>
                  )}
                </div>
              </div>

              {/* Sub Department */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sub Department</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(deploymentData.subDepartment?.subDepartmentName)}
                  </span>
                  {deploymentData.subDepartment?.subDepartmentCode && (
                    <span className="text-xs text-gray-500">
                      ({formatField(deploymentData.subDepartment?.subDepartmentCode)})
                    </span>
                  )}
                </div>
              </div>

              {/* Section */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(deploymentData.section?.sectionName)}
                  </span>
                  {deploymentData.section?.sectionCode && (
                    <span className="text-xs text-gray-500">
                      ({formatField(deploymentData.section?.sectionCode)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Job Details */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <Briefcase className="h-4 w-4 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Job Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {/* Employee Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee Category</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(deploymentData.employeeCategory?.employeeCategoryTitle)}
                  </span>
                  {deploymentData.employeeCategory?.employeeCategoryCode && (
                    <span className="text-xs text-gray-500">
                      ({formatField(deploymentData.employeeCategory?.employeeCategoryCode)})
                    </span>
                  )}
                </div>
              </div>

              {/* Designation */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(deploymentData.designation?.designationName)}
                  </span>
                  {deploymentData.designation?.designationCode && (
                    <span className="text-xs text-gray-500">
                      ({formatField(deploymentData.designation?.designationCode)})
                    </span>
                  )}
                </div>
              </div>

              {/* Grade */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(deploymentData.grade?.gradeTitle)}
                  </span>
                  {deploymentData.grade?.gradeCode && (
                    <span className="text-xs text-gray-500">
                      ({formatField(deploymentData.grade?.gradeCode)})
                    </span>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(deploymentData.location?.locationName)}
                  </span>
                  {deploymentData.location?.locationCode && (
                    <span className="text-xs text-gray-500">
                      ({formatField(deploymentData.location?.locationCode)})
                    </span>
                  )}
                </div>
              </div>

              {/* Skill Level */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Skill Level</label>
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(deploymentData.skillLevel?.skillLevelTitle)}
                  </span>
                  {deploymentData.skillLevel?.skillLevelDescription && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-500">
                        {formatField(deploymentData.skillLevel?.skillLevelDescription)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Management Hierarchy */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Management Hierarchy</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {/* Manager */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager ID</label>
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(managerData.manager)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager Name</label>
                <div>
                  <span className="text-sm text-gray-900">
                    {formatField(managerData.managerName)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Settings & Remarks */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <Settings className="h-4 w-4 text-gray-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Settings & Remarks</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {/* Effective Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Effective From</label>
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatField(deploymentData.effectiveFrom)}
                  </span>
                </div>
              </div>

              {/* Contract Status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contract Status</label>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${deploymentData.wasContractEmployee ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium text-gray-900">
                    {deploymentData.wasContractEmployee 
                      ? "Previously worked as contractor" 
                      : "Not a contract employee"}
                  </span>
                </div>
              </div>

              {/* Remarks - Full width if exists */}
              {deploymentData.remark && (
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</label>
                  <div>
                    <span className="text-sm text-gray-900">
                      {formatField(deploymentData.remark)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}