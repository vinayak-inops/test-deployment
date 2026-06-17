"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { Label } from "@repo/ui/components/ui/label"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

interface RolePermission {
  _id?: string
  entitlementCode: string
  entitlementName: string
  entitlementDescription: string
  applicableOption?: string
}

interface CreateRoleFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialData?: RolePermission | null
  mode?: "create" | "edit"
}

export default function CreateRoleForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  mode = "create",
}: CreateRoleFormProps) {
  const tenantCode = useGetTenantCode()
  const [formData, setFormData] = useState<{
    _id?: string
    entitlementCode: string
    entitlementName: string
    entitlementDescription: string
    applicableOption: string
    organizationCode: string
    tenantCode: string
    entitlementStatus: string
    level: number
  }>({
    entitlementCode: "",
    entitlementName: "",
    entitlementDescription: "",
    applicableOption: "",
    organizationCode: tenantCode,
    tenantCode: tenantCode,
    entitlementStatus: "inactive",
    level: 1,
  })

  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    entitlementCode?: string
    entitlementName?: string
  }>({})

  // Fetch full role data when editing
  const {
    loading: isLoadingRole,
    refetch: fetchRoleData,
  } = useRequest<any>({
    url: "role_permissions/search",
    method: "POST",
    data: [
      { field: "_id", value: initialData?._id || "", operator: "eq" },
    ],
    onSuccess: (data) => {
      if (mode === "edit" && data) {
        let responseData = data
        if (Array.isArray((data as any)?.data)) {
          responseData = (data as any).data[0]
        } else if (Array.isArray(data)) {
          responseData = data[0]
        } else if ((data as any)?.data) {
          responseData = (data as any).data
        }

        if (responseData) {
          setFormData({
            _id: responseData._id || undefined,
            entitlementCode: responseData.entitlementCode || "",
            entitlementName: responseData.entitlementName || "",
            entitlementDescription: responseData.entitlementDescription || "",
            applicableOption: responseData.applicableOption || "",
            organizationCode: responseData.organizationCode || tenantCode,
            tenantCode: responseData.tenantCode || tenantCode,
            entitlementStatus: responseData.entitlementStatus || "inactive",
            level: responseData.level || 1,
          })
        }
      }
    },
    onError: (error) => {
      console.error("Error fetching role data:", error)
    },
    dependencies: [], // Don't auto-fetch
  })

  // Fetch role data when form opens in edit mode
  useEffect(() => {
    if (isOpen && mode === "edit" && initialData?._id) {
      fetchRoleData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, initialData?._id])

  const {
    post: postRole,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: (data) => {
      toast.success(
        mode === "edit"
          ? "Role permissions updated successfully!"
          : "Role permissions created successfully!"
      )
      onSuccess?.()
      onClose()
      // Reset form
      setFormData({
        entitlementCode: "",
        entitlementName: "",
        entitlementDescription: "",
        applicableOption: "",
        organizationCode: tenantCode,
        tenantCode: tenantCode,
        entitlementStatus: "inactive",
        level: 1,
      })
      setFormErrors({})
    },
    onError: (error) => {
      console.error(`Error ${mode === "edit" ? "updating" : "creating"} role permissions:`, error)
      toast.error(
        `Failed to ${mode === "edit" ? "update" : "create"} role permissions!`
      )
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        // For edit mode, data will be loaded from API
        // Form will be populated in the useRequest onSuccess
      } else {
        // Reset form when opened for create mode
        setFormData({
          entitlementCode: "",
          entitlementName: "",
          entitlementDescription: "",
          applicableOption: "",
          organizationCode: tenantCode,
          tenantCode: tenantCode,
          entitlementStatus: "inactive",
          level: 1,
        })
        setFormErrors({})
      }
    }
  }, [isOpen, mode, initialData])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear field error on change
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const submitForm = async () => {
    // Basic validation
    const errors: { entitlementCode?: string; entitlementName?: string } = {}
    if (!formData.entitlementCode.trim()) {
      errors.entitlementCode = "Entitlement Code is required"
    }
    if (!formData.entitlementName.trim()) {
      errors.entitlementName = "Entitlement Name is required"
    }
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)

    // Prepare data payload - only include _id in edit mode
    const payloadData: any = { ...formData,  createdOn: new Date().toISOString() }
    if (mode === "edit" && formData._id) {
      payloadData._id = formData._id
    } else {
      // Remove _id if it exists in create mode
      delete payloadData._id
    }

    const data = {
      tenant: tenantCode,
      action: mode === "edit" ? "update" : "insert",
      id: mode === "edit" && formData._id ? formData._id : null,
      event: "save",
      collectionName: "role_permissions",
      data: payloadData,
    }

    postRole(data)
    setLoading(false)
  }

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden" // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  // Input styles
  const fieldStyles =
    "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  if (!isOpen) return null

  if (mode === "edit" && isLoadingRole) {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-700">Loading role data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-4xl flex flex-col">
        <Card className="w-full max-h-[90vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">
                {mode === "edit" ? "Edit Role Permissions" : "Create Role Permissions"}
              </CardTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          {/* Form Content */}
          <CardContent className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void submitForm()
              }}
              className="space-y-6"
            >
              {/* Basic Information */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Entitlement Code <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      id="entitlementCode"
                      type="text"
                      value={formData.entitlementCode}
                      onChange={(e) => handleInputChange("entitlementCode", e.target.value)}
                      className={fieldStyles}
                      placeholder="e.g., ECT-CHT-IT"
                    />
                    {formErrors.entitlementCode && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.entitlementCode}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Entitlement Name <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      id="entitlementName"
                      type="text"
                      value={formData.entitlementName}
                      onChange={(e) => handleInputChange("entitlementName", e.target.value)}
                      className={fieldStyles}
                      placeholder="e.g., ITIT"
                    />
                    {formErrors.entitlementName && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.entitlementName}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Applicable Option
                  </Label>
                  <Select
                    value={formData.applicableOption}
                    onValueChange={(value) => handleInputChange("applicableOption", value)}
                  >
                    <SelectTrigger className={fieldStyles}>
                      <SelectValue placeholder="Select applicable option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract_employee">Employee</SelectItem>
                      <SelectItem value="company_employee">Company Employee</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Entitlement Description
                  </Label>
                  <textarea
                    id="entitlementDescription"
                    value={formData.entitlementDescription}
                    onChange={(e) => handleInputChange("entitlementDescription", e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 shadow-sm resize-none transition"
                    placeholder="Enter description for this role permission..."
                    rows={3}
                  />
                </div>
              </div>
            </form>
          </CardContent>

          {/* Footer */}
          <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel={mode === "edit" ? "UPDATE" : "CREATE"}
              onPrimary={submitForm}
              primaryLoading={loading || postLoading}
              className="w-full"
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

