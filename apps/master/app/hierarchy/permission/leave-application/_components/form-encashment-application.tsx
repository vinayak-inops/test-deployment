"use client"

import React, { useEffect, useState } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { Shield } from "lucide-react"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useSearchParams } from "next/navigation"

interface LeaveEncashmentPermissionData {
  // leaveManagement screen
  leaveEncashmentSelf?: boolean
  leaveEncashmentAll?: boolean
  leaveManagementApplicationApprover?: boolean
  leaveManagementApplicationsSelfCancel?: boolean
  leaveManagementApplicationsAllCancel?: boolean
  // encashmentManagement screen
  encashmentManagementCancel?: boolean
  encashmentManagementApprove?: boolean
  encashmentManagementReject?: boolean
}

interface LeaveEncashmentFormProps {
  initialData?: LeaveEncashmentPermissionData
  onSave?: (data: LeaveEncashmentPermissionData) => void
  mode?: "add" | "edit" | "view"
}

export default function LeaveEncashmentFormApplication({
  initialData,
  onSave,
  mode = "add",
}: LeaveEncashmentFormProps) {
  const searchParams = useSearchParams()
  const modeView = searchParams.get('mode');
  // Role-based permissions for this page (centralized under Role & Permissions)
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName: "rolePermissions",
  })

  const editMode = modeView != "permissionview"? rolePermissions?.edit : false
  const addMode = modeView != "permissionview"? rolePermissions?.add : false

  const isReadOnly = mode === "view" || (!editMode && !addMode)

  const [permissions, setPermissions] = useState<LeaveEncashmentPermissionData>({
    leaveEncashmentSelf: false,
    leaveEncashmentAll: false,
    leaveManagementApplicationApprover: false,
    leaveManagementApplicationsSelfCancel: false,
    leaveManagementApplicationsAllCancel: false,
    encashmentManagementCancel: false,
    encashmentManagementApprove: false,
    encashmentManagementReject: false,
    ...initialData,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setPermissions({ ...initialData })
    }
  }, [initialData])

  const handlePermissionChange = (
    key: keyof LeaveEncashmentPermissionData,
    value: boolean,
  ) => {
    const newPermissions: LeaveEncashmentPermissionData = { ...permissions, [key]: value }

    // Make the two main toggles mutually exclusive
    if (key === "leaveEncashmentSelf" && value) {
      newPermissions.leaveEncashmentAll = false
      newPermissions.leaveManagementApplicationsAllCancel = false
      newPermissions.encashmentManagementCancel = false
      newPermissions.encashmentManagementApprove = false
      newPermissions.encashmentManagementReject = false
      newPermissions.leaveManagementApplicationApprover = false
    } else if (key === "leaveEncashmentAll" && value) {
      newPermissions.leaveEncashmentSelf = false
      newPermissions.leaveManagementApplicationsSelfCancel = false
    } else if (key === "leaveEncashmentSelf" && !value) {
      newPermissions.leaveManagementApplicationsSelfCancel = false
    } else if (key === "leaveEncashmentAll" && !value) {
      newPermissions.leaveManagementApplicationsAllCancel = false
      newPermissions.encashmentManagementCancel = false
      newPermissions.encashmentManagementApprove = false
      newPermissions.encashmentManagementReject = false
      newPermissions.leaveManagementApplicationApprover = false
    }

    // If leaveManagementApplicationApprover is unchecked, clear approve/reject/cancel actions
    if (key === "leaveManagementApplicationApprover" && !value) {
      newPermissions.encashmentManagementCancel = false
      newPermissions.encashmentManagementApprove = false
      newPermissions.encashmentManagementReject = false
    }

    setPermissions(newPermissions)
  }

  /**
   * Build payload so that only the current section's values are taken from the live form
   * and all other fields fall back to the last loaded values from `initialData`.
   */
  const buildSectionPayload = (section: "applicationManagement" | "approver") => {
    const base: LeaveEncashmentPermissionData = {
      leaveEncashmentSelf: initialData?.leaveEncashmentSelf ?? false,
      leaveEncashmentAll: initialData?.leaveEncashmentAll ?? false,
      leaveManagementApplicationApprover: initialData?.leaveManagementApplicationApprover ?? false,
      leaveManagementApplicationsSelfCancel: initialData?.leaveManagementApplicationsSelfCancel ?? false,
      leaveManagementApplicationsAllCancel: initialData?.leaveManagementApplicationsAllCancel ?? false,
      encashmentManagementCancel: initialData?.encashmentManagementCancel ?? false,
      encashmentManagementApprove: initialData?.encashmentManagementApprove ?? false,
      encashmentManagementReject: initialData?.encashmentManagementReject ?? false,
    }

    if (section === "applicationManagement") {
      base.leaveEncashmentSelf = !!permissions.leaveEncashmentSelf
      base.leaveEncashmentAll = !!permissions.leaveEncashmentAll
      base.leaveManagementApplicationsSelfCancel = !!permissions.leaveManagementApplicationsSelfCancel
      base.leaveManagementApplicationsAllCancel = !!permissions.leaveManagementApplicationsAllCancel
    } else if (section === "approver") {
      base.leaveManagementApplicationApprover = !!permissions.leaveManagementApplicationApprover
      base.encashmentManagementCancel = !!permissions.encashmentManagementCancel
      base.encashmentManagementApprove = !!permissions.encashmentManagementApprove
      base.encashmentManagementReject = !!permissions.encashmentManagementReject
    }

    return base
  }

  const handleSectionSave = async (section: "applicationManagement" | "approver") => {
    if (!onSave) return

    setLoading(true)
    try {
      const payload = buildSectionPayload(section)
      await onSave(payload)
    } catch (error) {
      console.error("Error saving leave encashment application permissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (onSave) {
        await onSave({ ...permissions })
      }
    } catch (error) {
      console.error("Error saving leave encashment application permissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const SwitchToggle = ({
    id,
    checked,
    onCheckedChange,
    disabled = false,
  }: {
    id: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    disabled?: boolean
  }) => {
    return (
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          ${checked ? "bg-blue-600" : "bg-gray-200"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out
            ${checked ? "translate-x-4" : "translate-x-0.5"}
          `}
        />
      </button>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Sub-form 1: Leave Encashment Application Management */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Leave Encashment Application Management</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Configure who can apply for leave encashment applications
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Leave Encashment Self
                </div>
                <Label className="text-sm font-normal text-gray-900">
                  Allow applying for self
                </Label>
              </div>
              <SwitchToggle
                id="leaveEncashmentSelf"
                checked={!!permissions.leaveEncashmentSelf}
                onCheckedChange={(checked) =>
                  handlePermissionChange("leaveEncashmentSelf", checked)
                }
                disabled={isReadOnly}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Leave Encashment All
                </div>
                <Label className="text-sm font-normal text-gray-900">
                  Allow applying for all employees
                </Label>
              </div>
              <SwitchToggle
                id="leaveEncashmentAll"
                checked={!!permissions.leaveEncashmentAll}
                onCheckedChange={(checked) =>
                  handlePermissionChange("leaveEncashmentAll", checked)
                }
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Cancel Application Permissions - Conditionally shown based on main toggle */}
          {(permissions.leaveEncashmentSelf || permissions.leaveEncashmentAll) && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                Cancel Application Permissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissions.leaveEncashmentSelf && (
                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.leaveManagementApplicationsSelfCancel}
                      onChange={(e) =>
                        handlePermissionChange("leaveManagementApplicationsSelfCancel", e.target.checked)
                      }
                      disabled={isReadOnly}
                      className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-sm font-normal text-gray-900">
                      Cancel Self Applications
                    </span>
                  </label>
                )}

                {permissions.leaveEncashmentAll && (
                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.leaveManagementApplicationsAllCancel}
                      onChange={(e) =>
                        handlePermissionChange("leaveManagementApplicationsAllCancel", e.target.checked)
                      }
                      disabled={isReadOnly}
                      className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-sm font-normal text-gray-900">
                      Cancel All Applications
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {!isReadOnly && onSave && (
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => handleSectionSave("applicationManagement")}
                disabled={loading}
                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Application Management"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-form 2: Leave Encashment Application Approver */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Leave Encashment Application Approver</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Enable to allow approval/rejection/cancellation of encashment applications
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Leave Management Application Approver
              </div>
              <Label className="text-sm font-normal text-gray-900">
                Enable to allow approval/rejection/cancellation of encashment applications
              </Label>
            </div>
            <SwitchToggle
              id="leaveManagementApplicationApprover"
              checked={!!permissions.leaveManagementApplicationApprover}
              onCheckedChange={(checked) =>
                handlePermissionChange("leaveManagementApplicationApprover", checked)
              }
              disabled={isReadOnly}
            />
          </div>

          {/* Actions - Only shown when approver is enabled */}
          {permissions.leaveManagementApplicationApprover && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                Encashment Management Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!permissions.encashmentManagementCancel}
                    onChange={(e) =>
                      handlePermissionChange("encashmentManagementCancel", e.target.checked)
                    }
                    disabled={isReadOnly}
                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-normal text-gray-900">
                    Cancel Encashment Requests
                  </span>
                </label>

                <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!permissions.encashmentManagementApprove}
                    onChange={(e) =>
                      handlePermissionChange("encashmentManagementApprove", e.target.checked)
                    }
                    disabled={isReadOnly}
                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-normal text-gray-900">
                    Approve Encashment Requests
                  </span>
                </label>

                <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!permissions.encashmentManagementReject}
                    onChange={(e) =>
                      handlePermissionChange("encashmentManagementReject", e.target.checked)
                    }
                    disabled={isReadOnly}
                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-normal text-gray-900">
                    Reject Encashment Requests
                  </span>
                </label>
              </div>
            </div>
          )}

          {!isReadOnly && onSave && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSectionSave("approver")}
                disabled={loading}
                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Approver"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


