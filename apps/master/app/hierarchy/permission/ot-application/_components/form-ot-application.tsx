"use client"

import React, { useEffect, useState } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { Shield } from "lucide-react"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useSearchParams } from "next/navigation"

interface OtPermissionData {
  otchApplicationsSelf?: boolean
  otApplicationsAll?: boolean
  otApplicationApprover?: boolean
  otApplicationsCancel?: boolean
  otApplicationsApprove?: boolean
  otApplicationsReject?: boolean
  otApplicationsSelfCancel?: boolean
  otApplicationsAllCancel?: boolean
}

interface OtFormApplicationProps {
  initialData?: OtPermissionData
  onSave?: (data: OtPermissionData) => void
  mode?: "add" | "edit" | "view"
}

export default function OtFormApplication({
  initialData,
  onSave,
  mode = "add",
}: OtFormApplicationProps) {
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

  const [permissions, setPermissions] = useState<OtPermissionData>({
    otchApplicationsSelf: false,
    otApplicationsAll: false,
    otApplicationApprover: false,
    otApplicationsCancel: false,
    otApplicationsApprove: false,
    otApplicationsReject: false,
    otApplicationsSelfCancel: false,
    otApplicationsAllCancel: false,
    ...initialData,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setPermissions({ ...initialData })
    }
  }, [initialData])

  const handlePermissionChange = (key: keyof OtPermissionData, value: boolean) => {
    const newPermissions = { ...permissions, [key]: value }

    // Make the two main toggles mutually exclusive
    if (key === "otchApplicationsSelf" && value) {
      newPermissions.otApplicationsAll = false
      newPermissions.otApplicationsAllCancel = false
      newPermissions.otApplicationsCancel = false
      newPermissions.otApplicationsApprove = false
      newPermissions.otApplicationsReject = false
      newPermissions.otApplicationApprover = false
    } else if (key === "otApplicationsAll" && value) {
      newPermissions.otchApplicationsSelf = false
      newPermissions.otApplicationsSelfCancel = false
    } else if (key === "otchApplicationsSelf" && !value) {
      newPermissions.otApplicationsSelfCancel = false
    } else if (key === "otApplicationsAll" && !value) {
      newPermissions.otApplicationsAllCancel = false
      newPermissions.otApplicationsCancel = false
      newPermissions.otApplicationsApprove = false
      newPermissions.otApplicationsReject = false
      newPermissions.otApplicationApprover = false
    }

    // If otApplicationApprover is unchecked, clear approve/reject/cancel actions
    if (key === "otApplicationApprover" && !value) {
      newPermissions.otApplicationsCancel = false
      newPermissions.otApplicationsApprove = false
      newPermissions.otApplicationsReject = false
    }

    setPermissions(newPermissions)
  }

  /**
   * Build payload so that only the current section's values are taken from the live form
   * and all other fields fall back to the last loaded values from `initialData`.
   */
  const buildSectionPayload = (section: "applicationManagement" | "approver") => {
    const base: OtPermissionData = {
      otchApplicationsSelf: initialData?.otchApplicationsSelf ?? false,
      otApplicationsAll: initialData?.otApplicationsAll ?? false,
      otApplicationApprover: initialData?.otApplicationApprover ?? false,
      otApplicationsCancel: initialData?.otApplicationsCancel ?? false,
      otApplicationsApprove: initialData?.otApplicationsApprove ?? false,
      otApplicationsReject: initialData?.otApplicationsReject ?? false,
      otApplicationsSelfCancel: initialData?.otApplicationsSelfCancel ?? false,
      otApplicationsAllCancel: initialData?.otApplicationsAllCancel ?? false,
    }

    if (section === "applicationManagement") {
      base.otchApplicationsSelf = !!permissions.otchApplicationsSelf
      base.otApplicationsAll = !!permissions.otApplicationsAll
      base.otApplicationsSelfCancel = !!permissions.otApplicationsSelfCancel
      base.otApplicationsAllCancel = !!permissions.otApplicationsAllCancel
    } else if (section === "approver") {
      base.otApplicationApprover = !!permissions.otApplicationApprover
      base.otApplicationsCancel = !!permissions.otApplicationsCancel
      base.otApplicationsApprove = !!permissions.otApplicationsApprove
      base.otApplicationsReject = !!permissions.otApplicationsReject
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
      console.error("Error saving OT application permissions:", error)
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
      console.error("Error saving OT application permissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatPermissionLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  // Custom Switch Toggle Component - blue
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
      {/* Sub-form 1: OT Application Management */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">OT Application Management</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Configure who can apply for OT applications
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  OT Applications Self
                </div>
                <Label className="text-sm font-normal text-gray-900">
                  Allow applying for self
                </Label>
              </div>
              <SwitchToggle
                id="otchApplicationsSelf"
                checked={!!permissions.otchApplicationsSelf}
                onCheckedChange={(checked) =>
                  handlePermissionChange("otchApplicationsSelf", checked)
                }
                disabled={isReadOnly}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  OT Applications All
                </div>
                <Label className="text-sm font-normal text-gray-900">
                  Allow applying for all employees
                </Label>
              </div>
              <SwitchToggle
                id="otApplicationsAll"
                checked={!!permissions.otApplicationsAll}
                onCheckedChange={(checked) =>
                  handlePermissionChange("otApplicationsAll", checked)
                }
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Cancel Application Permissions - Conditionally shown based on main toggle */}
          {(permissions.otchApplicationsSelf || permissions.otApplicationsAll) && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                Cancel Application Permissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissions.otchApplicationsSelf && (
                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.otApplicationsSelfCancel}
                      onChange={(e) =>
                        handlePermissionChange("otApplicationsSelfCancel", e.target.checked)
                      }
                      disabled={isReadOnly}
                      className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-sm font-normal text-gray-900">
                      Cancel Self Applications
                    </span>
                  </label>
                )}

                {permissions.otApplicationsAll && (
                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.otApplicationsAllCancel}
                      onChange={(e) =>
                        handlePermissionChange("otApplicationsAllCancel", e.target.checked)
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

      {/* Sub-form 2: OT Application Approver */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">OT Application Approver</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Enable to allow approval/rejection/cancellation of applications
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                OT Application Approver
              </div>
              <Label className="text-sm font-normal text-gray-900">
                Enable to allow approval/rejection/cancellation of applications
              </Label>
            </div>
            <SwitchToggle
              id="otApplicationApprover"
              checked={!!permissions.otApplicationApprover}
              onCheckedChange={(checked) =>
                handlePermissionChange("otApplicationApprover", checked)
              }
              disabled={isReadOnly}
            />
          </div>

          {/* Actions - Only shown when approver is enabled */}
          {permissions.otApplicationApprover && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                OT Application Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!permissions.otApplicationsCancel}
                    onChange={(e) =>
                      handlePermissionChange("otApplicationsCancel", e.target.checked)
                    }
                    disabled={isReadOnly}
                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-normal text-gray-900">
                    Cancel Applications
                  </span>
                </label>

                <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!permissions.otApplicationsApprove}
                    onChange={(e) =>
                      handlePermissionChange("otApplicationsApprove", e.target.checked)
                    }
                    disabled={isReadOnly}
                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-normal text-gray-900">
                    Approve Applications
                  </span>
                </label>

                <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!permissions.otApplicationsReject}
                    onChange={(e) =>
                      handlePermissionChange("otApplicationsReject", e.target.checked)
                    }
                    disabled={isReadOnly}
                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-normal text-gray-900">
                    Reject Applications
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


