"use client";

import React, { useEffect, useState, useMemo } from "react"
import { Shield, Plus, Edit, Trash2, MoreVertical, ChevronRight, ChevronLeft, Edit2 } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import CreateRoleForm from "./create-role-form"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";

interface RolePermission {
  _id?: string
  entitlementCode: string
  entitlementName: string
  entitlementDescription: string
}

interface RoleTableProps {
  onCreate?: () => void
  onEdit?: (role: RolePermission) => void
  onDelete?: (role: RolePermission) => void
  onViewMore?: (role: RolePermission) => void
}

export default function RoleTable({ onCreate, onEdit, onDelete, onViewMore }: RoleTableProps) {
  const [roles, setRoles] = useState<RolePermission[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RolePermission | null>(null)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [autoNavigated, setAutoNavigated] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10
  const { entitlementCode } = useKeyclockRoleInfo()

  // Centralized role-permissions for managing this page itself
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName: "rolePermissions",
  })

  const viewMode = rolePermissions?.view || false
  const editMode = rolePermissions?.edit || false
  const addMode = rolePermissions?.add || false
  const deleteMode = rolePermissions?.delete || false
  const tenantCode = useGetTenantCode()

  // Calculate offset and limit based on current page
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
  const limit = itemsPerPage

  // Count API call to get total collection length
  const {
    data: countData,
    loading: countLoading,
    refetch: refetchCount,
  } = useRequest<any>({
    url: 'role_permissions/count',
    method: 'POST',
    data: [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
    ],
    onSuccess: (data: any) => {
      if (data !== null && data !== undefined) {
        setTotalCount(data || 0)
      }
    },
    onError: (error: any) => {
      console.error("Error fetching role permissions count:", error)
    },
    dependencies: [] // Empty dependencies - only fetch manually
  })

  // Fetch roles data with pagination
  const {
    loading: isLoading,
    refetch: fetchRole,
  } = useRequest<any>({
    url: `role_permissions/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
    ],
    dependencies: [], // Empty dependencies - only fetch manually
    onSuccess: (data) => {
      let responseData = data
      if (Array.isArray(data)) {
        responseData = data
      } else if (data?.data && Array.isArray(data.data)) {
        responseData = data.data
      } else if (data?.data && !Array.isArray(data.data)) {
        responseData = [data.data]
      }

      const mappedRoles: RolePermission[] = (responseData || []).map((item: any) => ({
        _id: item._id,
        entitlementCode: item.entitlementCode || "",
        entitlementName: item.entitlementName || "",
        entitlementDescription: item.entitlementDescription || "",
      }))

      setRoles(mappedRoles)
    },
    onError: (error) => {
      console.error("Error fetching role data:", error)
    },
  })

  // Initial fetch when component mounts
  useEffect(() => {
    if (tenantCode) {
      fetchRole()
      refetchCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  // Fetch when page changes
  useEffect(() => {
    if (tenantCode) {
      fetchRole()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, tenantCode])

  // When user has no view permission for rolePermissions, automatically open side-form
  // using entitlementCode from keyclock info instead of showing the table.
  useEffect(() => {
    // Wait until rolePermissions are loaded; avoids auto-navigation flicker
    if (!rolePermissions) return

    if (!viewMode && entitlementCode && onViewMore && !autoNavigated) {
      onViewMore({
        _id: undefined,
        entitlementCode,
        entitlementName: "",
        entitlementDescription: "",
      })
      setAutoNavigated(true)
    }
  }, [
    rolePermissions,
    viewMode,
    entitlementCode,
    onViewMore,
    autoNavigated,
  ])

  const handleCreate = () => {
    if (!addMode) return
    setEditingRole(null)
    setFormMode("create")
    setIsFormOpen(true)
    onCreate?.()
  }

  const handleEdit = (role: RolePermission) => {
    if (!editMode) return
    setEditingRole(role)
    setFormMode("edit")
    setIsFormOpen(true)
    onEdit?.(role)
  }

  const handleFormSuccess = () => {
    fetchRole()
    refetchCount()
    setEditingRole(null)
    setFormMode("create")
  }

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingRole(null)
    setFormMode("create")
  }

  // If user has no view permission, let the auto-navigation effect
  // send them directly to the side permissions form instead of showing the table.
  if (!viewMode) {
    return null
  }

  return (
    <>
      <div className="w-full max-w-5xl mx-auto py-6">
        {/* Header Section */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-0">
            Create role permissions
          </h1>
          <p className="text-base text-gray-600">
            Set up role permissions to manage access controls and entitlements
          </p>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Role Permissions
          </h2>
          {addMode && (
            <Button
              onClick={handleCreate}
              className="px-3 py-1.5 h-8 text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create
            </Button>
          )}
        </div>

        {/* Card-based List */}
        {(isLoading || countLoading) ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No role permissions found</div>
        ) : (
          <>
            <div className="space-y-2">
              {roles.map((role, index) => {
                const words = (role.entitlementDescription || "").split(" ")
                const truncatedDescription =
                  words.length > 25
                    ? words.slice(0, 25).join(" ") + "..."
                    : role.entitlementDescription || ""

                return (
                  <div
                    key={role._id || index}
                    className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      {/* Left side: Icon and Content */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                            {role.entitlementCode}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-1">
                            {truncatedDescription}
                          </p>
                        </div>
                      </div>

                      {/* Right side: Actions */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {editMode && (
                          <button
                            onClick={() => handleEdit(role)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {deleteMode && (
                          <button
                            onClick={() => onDelete?.(role)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {viewMode && (
                          <button
                            onClick={() => onViewMore?.(role)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="View More"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {endIndex} of {totalCount} results
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={currentPage === 1}
                      className="h-8 px-3 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className={`h-8 w-8 p-0 ${
                              currentPage === pageNumber 
                                ? 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600' 
                                : 'hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Role Form Modal */}
      <CreateRoleForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        initialData={editingRole}
        mode={formMode}
      />
    </>
  )
}
