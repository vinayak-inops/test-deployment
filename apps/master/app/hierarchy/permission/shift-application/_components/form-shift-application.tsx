"use client"

import React, { useState, useEffect } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { Shield } from "lucide-react"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useSearchParams } from "next/navigation"

interface ShiftPermissionData {
  shiftchApplicationsSelf?: boolean
  shiftApplicationsAll?: boolean
  shiftApplicationApprover?: boolean
  shiftApplicationsCancel?: boolean
  shiftApplicationsApprove?: boolean
  shiftApplicationsReject?: boolean
  shiftApplicationsSelfCancel?: boolean
  shiftApplicationsAllCancel?: boolean
}

interface ShiftFormApplicationProps {
  initialData?: ShiftPermissionData
  onSave?: (data: ShiftPermissionData) => void
  mode?: "add" | "edit" | "view"
}

export default function ShiftFormApplication({
  initialData,
  onSave,
  mode = "add",
}: ShiftFormApplicationProps) {
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

  const [permissions, setPermissions] = useState<ShiftPermissionData>({
    shiftchApplicationsSelf: false,
    shiftApplicationsAll: false,
    shiftApplicationApprover: false,
    shiftApplicationsCancel: false,
    shiftApplicationsApprove: false,
    shiftApplicationsReject: false,
    shiftApplicationsSelfCancel: false,
    shiftApplicationsAllCancel: false,
    ...initialData,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setPermissions({ ...initialData })
    }
  }, [initialData])

  const handlePermissionChange = (key: keyof ShiftPermissionData, value: boolean) => {
    const newPermissions = { ...permissions, [key]: value }

    // Make the two main toggles mutually exclusive
    if (key === "shiftchApplicationsSelf" && value) {
      newPermissions.shiftApplicationsAll = false
      newPermissions.shiftApplicationsAllCancel = false
      newPermissions.shiftApplicationsCancel = false
      newPermissions.shiftApplicationsApprove = false
      newPermissions.shiftApplicationsReject = false
      newPermissions.shiftApplicationApprover = false
    } else if (key === "shiftApplicationsAll" && value) {
      newPermissions.shiftchApplicationsSelf = false
      newPermissions.shiftApplicationsSelfCancel = false
    } else if (key === "shiftchApplicationsSelf" && !value) {
      newPermissions.shiftApplicationsSelfCancel = false
    } else if (key === "shiftApplicationsAll" && !value) {
      newPermissions.shiftApplicationsAllCancel = false
      newPermissions.shiftApplicationsCancel = false
      newPermissions.shiftApplicationsApprove = false
      newPermissions.shiftApplicationsReject = false
      newPermissions.shiftApplicationApprover = false
    }

    // If shiftApplicationApprover is unchecked, clear approve/reject/cancel actions
    if (key === "shiftApplicationApprover" && !value) {
      newPermissions.shiftApplicationsCancel = false
      newPermissions.shiftApplicationsApprove = false
      newPermissions.shiftApplicationsReject = false
    }

    setPermissions(newPermissions)
  }

  /**
   * Build payload so that only the current section's values are taken from the live form
   * and all other fields fall back to the last loaded values from `initialData`.
   */
  const buildSectionPayload = (section: "applicationManagement" | "approver") => {
    const base: ShiftPermissionData = {
      shiftchApplicationsSelf: initialData?.shiftchApplicationsSelf ?? false,
      shiftApplicationsAll: initialData?.shiftApplicationsAll ?? false,
      shiftApplicationApprover: initialData?.shiftApplicationApprover ?? false,
      shiftApplicationsCancel: initialData?.shiftApplicationsCancel ?? false,
      shiftApplicationsApprove: initialData?.shiftApplicationsApprove ?? false,
      shiftApplicationsReject: initialData?.shiftApplicationsReject ?? false,
      shiftApplicationsSelfCancel: initialData?.shiftApplicationsSelfCancel ?? false,
      shiftApplicationsAllCancel: initialData?.shiftApplicationsAllCancel ?? false,
    }

    if (section === "applicationManagement") {
      base.shiftchApplicationsSelf = !!permissions.shiftchApplicationsSelf
      base.shiftApplicationsAll = !!permissions.shiftApplicationsAll
      base.shiftApplicationsSelfCancel = !!permissions.shiftApplicationsSelfCancel
      base.shiftApplicationsAllCancel = !!permissions.shiftApplicationsAllCancel
    } else if (section === "approver") {
      base.shiftApplicationApprover = !!permissions.shiftApplicationApprover
      base.shiftApplicationsCancel = !!permissions.shiftApplicationsCancel
      base.shiftApplicationsApprove = !!permissions.shiftApplicationsApprove
      base.shiftApplicationsReject = !!permissions.shiftApplicationsReject
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
      console.error("Error saving shift application permissions:", error)
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
      console.error("Error saving shift application permissions:", error)
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
      {/* Sub-form 1: Shift Application Management */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Shift Application Management</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Configure who can apply for shift applications
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Shift Applications Self
                </div>
                <Label className="text-sm font-normal text-gray-900">
                  Allow applying for self
                </Label>
              </div>
              <SwitchToggle
                id="shiftchApplicationsSelf"
                checked={!!permissions.shiftchApplicationsSelf}
                onCheckedChange={(checked) =>
                  handlePermissionChange("shiftchApplicationsSelf", checked)
                }
                disabled={isReadOnly}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Shift Applications All
                </div>
                <Label className="text-sm font-normal text-gray-900">
                  Allow applying for all employees
                </Label>
              </div>
              <SwitchToggle
                id="shiftApplicationsAll"
                checked={!!permissions.shiftApplicationsAll}
                onCheckedChange={(checked) =>
                  handlePermissionChange("shiftApplicationsAll", checked)
                }
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Cancel Application Permissions - Conditionally shown based on main toggle */}
          {(permissions.shiftchApplicationsSelf || permissions.shiftApplicationsAll) && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                Cancel Application Permissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissions.shiftchApplicationsSelf && (
                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.shiftApplicationsSelfCancel}
                      onChange={(e) =>
                        handlePermissionChange("shiftApplicationsSelfCancel", e.target.checked)
                      }
                      disabled={isReadOnly}
                      className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-sm font-normal text-gray-900">
                      Cancel Self Applications
                    </span>
                  </label>
                )}

                {permissions.shiftApplicationsAll && (
                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.shiftApplicationsAllCancel}
                      onChange={(e) =>
                        handlePermissionChange("shiftApplicationsAllCancel", e.target.checked)
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

      {/* Sub-form 2: Shift Application Approver */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Shift Application Approver</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Enable to allow approval/rejection/cancellation of applications
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Shift Application Approver
              </div>
              <Label className="text-sm font-normal text-gray-900">
                Enable to allow approval/rejection/cancellation of applications
              </Label>
            </div>
            <SwitchToggle
              id="shiftApplicationApprover"
              checked={!!permissions.shiftApplicationApprover}
              onCheckedChange={(checked) =>
                handlePermissionChange("shiftApplicationApprover", checked)
              }
              disabled={isReadOnly}
            />
          </div>

          {/* Actions - Only shown when approver is enabled */}
          {permissions.shiftApplicationApprover && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                Shift Application Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!permissions.shiftApplicationsCancel}
                    onChange={(e) =>
                      handlePermissionChange("shiftApplicationsCancel", e.target.checked)
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
                    checked={!!permissions.shiftApplicationsApprove}
                    onChange={(e) =>
                      handlePermissionChange("shiftApplicationsApprove", e.target.checked)
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
                    checked={!!permissions.shiftApplicationsReject}
                    onChange={(e) =>
                      handlePermissionChange("shiftApplicationsReject", e.target.checked)
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


