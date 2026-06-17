"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, gql } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'
import { Check, ChevronsUpDown, Shield } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Label } from '@repo/ui/components/ui/label'
import { Checkbox } from '@repo/ui/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/components/ui/command'
import ActionButtons from '@/components/fields/buttons/action-buttons'
import { usePostRequest } from '@repo/ui/hooks/api/usePostRequest'
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode'
import { toast } from 'react-toastify'
import { getCurrentTimeIST } from '@/utils/time/time-control'

interface StepEmployeeRoleProps {
  employeeID: string
  roleID: string
  employeesData: any[]
  employeesLoading: boolean
  onEmployeeChange: (employeeID: string) => void
  onRoleChange: (roleID: string) => void
  onSave?: (created?: any) => void
  loading?: boolean
  mode?: "add" | "edit" | "view"
  // Full context from parent (includes _id and other fields for edit)
  contextData?: any
}

// GraphQL query for fetching role permissions
const FETCH_ROLE_PERMISSIONS_QUERY = gql`
  query FetchRolePermissions(
    $criteriaRequests: [CriteriaRequest!]!
    $collection: String!
  ) {
    fetchRolePermissions(
      criteriaRequests: $criteriaRequests
      collection: $collection
    ) {
      _id
      entitlementCode
      entitlementName
    }
  }
`

export default function StepEmployeeRole({
  employeeID,
  roleID,
  employeesData,
  employeesLoading,
  onEmployeeChange,
  onRoleChange,
  onSave,
  loading = false,
  mode = "add",
  contextData,
}: StepEmployeeRoleProps) {
  const [searchQueryEmployee, setSearchQueryEmployee] = useState('')
  const [searchQueryRole, setSearchQueryRole] = useState('')
  const [popoverOpenEmployee, setPopoverOpenEmployee] = useState(false)
  const [popoverOpenRole, setPopoverOpenRole] = useState(false)
  const [employeeError, setEmployeeError] = useState<string | null>(null)
  const [rolePermissionsData, setRolePermissionsData] = useState<any[]>([])
  const [isEndUser, setIsEndUser] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [detailData, setDetailData] = useState<any>(null)

  const tenantCode = useGetTenantCode()

  // Build query variables for role permissions
  const rolePermissionsVariables = useMemo(() => ({
    criteriaRequests: [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode || '',
      },
    ],
    collection: 'role_permissions',
  }), [tenantCode])

  // Fetch role permissions using GraphQL
  const {
    data: rolePermissionsResponse,
    loading: rolePermissionsLoading,
  } = useQuery(FETCH_ROLE_PERMISSIONS_QUERY, {
    client,
    variables: rolePermissionsVariables,
    fetchPolicy: 'network-only',
    skip: !tenantCode,
  })

  // Update state when GraphQL response changes
  useEffect(() => {
    const responseData = rolePermissionsResponse?.fetchRolePermissions
    if (responseData && Array.isArray(responseData)) {
      const mappedData = responseData.map((role: any) => ({
        _id: role._id,
        roleID: role.entitlementCode,
        roleName: role.entitlementName,
        entitlementCode: role.entitlementCode,
        entitlementName: role.entitlementName,
      }))
      setRolePermissionsData(mappedData)
    } else if (rolePermissionsResponse && !rolePermissionsLoading) {
      // Only clear if query completed but no data
      setRolePermissionsData([])
    }
  }, [rolePermissionsResponse, rolePermissionsLoading])

  // Use GraphQL data directly
  const rolesData = rolePermissionsData
  const rolesLoading = rolePermissionsLoading

  const detailId =
    (typeof contextData?._id === "object" && contextData?._id?.$oid)
      ? String(contextData?._id?.$oid)
      : (contextData?._id ? String(contextData?._id) : "")

  useRequest<any>({
    url: "userEntitlements/search",
    method: "POST",
    data: detailId
      ? [
          { field: "tenantCode", value: tenantCode, operator: "eq" },
          { field: "_id", value: detailId, operator: "eq" },
        ]
      : undefined,
    dependencies: [detailId, tenantCode],
    onSuccess: (data) => {
      if (!detailId) return
      let responseData = data
      if (Array.isArray(data)) {
        responseData = data
      } else if (data?.data && Array.isArray(data.data)) {
        responseData = data.data
      } else if (data?.data && !Array.isArray(data.data)) {
        responseData = [data.data]
      }
      const item = (responseData || [])[0]
      if (!item) return
      setDetailData(item)
    },
  })

  const effectiveEmployeeID =
    employeeID ||
    detailData?.employeeID ||
    detailData?.employeeId ||
    contextData?.employeeID ||
    ""

  const effectiveRoleID =
    roleID ||
    detailData?.roleID ||
    detailData?.entitlementCode ||
    contextData?.roleID ||
    ""

  useEffect(() => {
    setIsEndUser(Boolean(contextData?.isEndUser ?? detailData?.isEndUser))
    setIsManager(Boolean(contextData?.isManager ?? detailData?.isManager))
  }, [contextData?.isEndUser, contextData?.isManager, detailData?.isEndUser, detailData?.isManager])

  const {
    post: postUserEntitlement,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "userEntitlements",
    onSuccess: (data) => {
      // Merge the saved employeeID and roleID into the response data
      // The backend response might not include these fields, so we add them
      let enrichedData = data
      if (Array.isArray(data)) {
        enrichedData = data.map((item: any) => ({
          ...item,
          employeeID: item.employeeID || effectiveEmployeeID,
          roleID: item.roleID || effectiveRoleID,
        }))
      } else if (data?.data && Array.isArray(data.data)) {
        enrichedData = {
          ...data,
          data: data.data.map((item: any) => ({
            ...item,
            employeeID: item.employeeID || effectiveEmployeeID,
            roleID: item.roleID || effectiveRoleID,
          }))
        }
      } else if (data) {
        enrichedData = {
          ...data,
          employeeID: data.employeeID || effectiveEmployeeID,
          roleID: data.roleID || effectiveRoleID,
        }
      }
      
      // Ensure we pass the enriched response correctly to onSave
      // Response is typically [{ _id: "...", employeeID: "...", roleID: "...", ... }]
      onSave?.(enrichedData)
      toast.success("Entitlement assignment saved successfully")
    },
    onError: (error) => {
      toast.error("Failed to save entitlement assignment")
    },
  })

  const isReadOnly = mode === "view"
  const isEmployeeLocked = mode !== "add"
  const isRoleEditable = mode === "add" || mode === "edit"

  const getFilteredData = (data: any[], query: string) => {
    if (!query.trim()) return data
    const lowerQuery = query.toLowerCase()
    return data.filter((item: any) =>
      item.name?.toLowerCase().includes(lowerQuery) ||
      item.code?.toLowerCase().includes(lowerQuery) ||
      item.employeeID?.toLowerCase().includes(lowerQuery) ||
      item.roleID?.toLowerCase().includes(lowerQuery) ||
      item.roleName?.toLowerCase().includes(lowerQuery) ||
      item.entitlementCode?.toLowerCase().includes(lowerQuery) ||
      item.entitlementName?.toLowerCase().includes(lowerQuery)
    )
  }

  const filteredEmployees = getFilteredData(employeesData, searchQueryEmployee)
  const filteredRoles = getFilteredData(rolesData, searchQueryRole)
  const selectedEmployee = employeesData.find((e: any) => e.employeeID === effectiveEmployeeID)

  const handleSave = async () => {
    if (!effectiveEmployeeID) {
      setEmployeeError('Employee ID is required.')
      return
    }
    setEmployeeError(null)

    const base: any = contextData && typeof contextData === 'object' ? contextData : {}
    const isUpdate = !!(base?._id)

    // Prepare payload with proper createdBy/updatedBy handling
    const payload: any = {
      _id: base?._id,
      roleID: effectiveRoleID,
      isEndUser,
      isManager
    }

    const json = {
      tenant: tenantCode,
      action:"update",
      id: base?._id,
      collectionName: "userEntitlements",
      data: payload,
    }


    await postUserEntitlement(json)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Shield className="h-4 w-4 text-gray-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Employee & Role
            {employeeID ? <span className="ml-2 font-mono text-[11px] text-gray-500">({employeeID})</span> : null}
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Select employee and role assignment
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        {effectiveEmployeeID ? (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-700">Employee Information</h3>
            </div>
            <div className="w-full space-y-0">
              <div className="flex items-center border-b border-gray-100 pb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Name</label>
                <span className="text-sm text-gray-900 font-medium">
                  {selectedEmployee?.name || detailData?.employeeName || effectiveEmployeeID}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
          <div className="space-y-2 lg:col-span-2">
            <Label>Role ID *</Label>
            <Popover open={popoverOpenRole} onOpenChange={setPopoverOpenRole}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  disabled={rolesLoading || !isRoleEditable}
                >
                  {(() => {
                    // If roleID exists, try to find and display it
                    if (effectiveRoleID) {
                      // Normalize roleID for comparison (trim and convert to string)
                      const normalizedRoleID = String(effectiveRoleID).trim()
                      
                      const selectedRole = rolesData.find((r: any) => {
                        const rRoleID = String(r.roleID || r.entitlementCode || '').trim()
                        const rRoleName = String(r.roleName || r.entitlementName || '').trim()
                        const rId = String(r._id || '').trim()
                        
                        return rRoleID === normalizedRoleID || 
                               rRoleName === normalizedRoleID ||
                               rId === normalizedRoleID ||
                               rRoleID.toLowerCase() === normalizedRoleID.toLowerCase() ||
                               rRoleName.toLowerCase() === normalizedRoleID.toLowerCase()
                      })
                      
                      if (selectedRole) {
                        const displayName = selectedRole.roleName || selectedRole.entitlementName || ''
                        const displayCode = selectedRole.roleID || selectedRole.entitlementCode || effectiveRoleID
                        return displayName ? `${displayName} (${displayCode})` : displayCode
                      }
                      // If roleID exists but not found in data yet, show the roleID
                      return effectiveRoleID
                    }
                    // If no roleID and still loading, show loading
                    if (rolesLoading) {
                      return 'Loading...'
                    }
                    // Otherwise show select prompt
                    return 'Select Role'
                  })()}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search role..."
                    value={searchQueryRole}
                    onValueChange={setSearchQueryRole}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {rolesLoading ? 'Loading roles...' : 'No roles found.'}
                    </CommandEmpty>
                    {filteredRoles.length > 0 ? (
                      <CommandGroup>
                        {filteredRoles.map((role: any) => {
                          const roleValue = role.roleID || role.entitlementCode || role._id
                          const roleDisplayName = role.roleName || role.entitlementName || ''
                          
                          // Normalize for comparison
                          const normalizedRoleID = effectiveRoleID ? String(effectiveRoleID).trim() : ''
                          const normalizedRoleValue = String(roleValue).trim()
                          const normalizedRoleName = String(roleDisplayName).trim()
                          const normalizedRoleId = String(role._id || '').trim()
                          
                          const isSelected = normalizedRoleID && (
                            normalizedRoleValue === normalizedRoleID ||
                            normalizedRoleName === normalizedRoleID ||
                            normalizedRoleId === normalizedRoleID ||
                            normalizedRoleValue.toLowerCase() === normalizedRoleID.toLowerCase() ||
                            normalizedRoleName.toLowerCase() === normalizedRoleID.toLowerCase()
                          )
                          
                          return (
                            <CommandItem
                              key={role._id || roleValue}
                              value={`${roleDisplayName} ${roleValue}`}
                              onSelect={() => {
                                onRoleChange(roleValue)
                                setPopoverOpenRole(false)
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  isSelected ? 'opacity-100' : 'opacity-0'
                                }`}
                              />
                              {roleDisplayName ? `${roleDisplayName} (${roleValue})` : roleValue}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    ) : null}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <label className="lg:col-span-1 flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 shrink-0">
            <Checkbox
              checked={isEndUser}
              onCheckedChange={(checked) => setIsEndUser(!!checked)}
              disabled={isReadOnly}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">End User</span>
          </label>
          <label className="lg:col-span-1 flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 cursor-pointer hover:bg-gray-50 shrink-0">
            <Checkbox
              checked={isManager}
              onCheckedChange={(checked) => setIsManager(!!checked)}
              disabled={isReadOnly}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Manager</span>
          </label>
        </div>
      </div>

      {/* Footer */}
      {!isReadOnly && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end">
          <ActionButtons
            primaryLabel="Save Employee & Role"
            secondaryLabel=""
            onPrimary={handleSave}
            primaryLoading={loading || postLoading}
            primaryDisabled={loading || postLoading}
            primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
          />
        </div>
      )}
    </div>
  )
}

