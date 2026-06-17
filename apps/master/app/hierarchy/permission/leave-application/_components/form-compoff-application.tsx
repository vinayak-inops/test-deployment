"use client"

import React, { useEffect, useState } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { Shield } from "lucide-react"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useSearchParams } from "next/navigation"

interface CompOffPermissionData {
  // leaveManagement screen
  compOffSelf?: boolean
  compOffAll?: boolean
  compOffApplicationsApprover?: boolean
  compOffApplicationsSelfCancel?: boolean
  compOffApplicationsAllCancel?: boolean
  // compoffApplication screen
  compOffApplicationsCancel?: boolean
  compOffApplicationsApprove?: boolean
  compOffApplicationsReject?: boolean
}

interface CompOffFormProps {
  initialData?: CompOffPermissionData
  onSave?: (data: CompOffPermissionData) => void
  mode?: "add" | "edit" | "view"
}

export default function CompOffFormApplication({
  initialData,
  onSave,
  mode = "add",
}: CompOffFormProps) {
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

  const [permissions, setPermissions] = useState<CompOffPermissionData>({
    compOffSelf: false,
    compOffAll: false,
    compOffApplicationsApprover: false,
    compOffApplicationsSelfCancel: false,
    compOffApplicationsAllCancel: false,
    compOffApplicationsCancel: false,
    compOffApplicationsApprove: false,
    compOffApplicationsReject: false,
    ...initialData,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setPermissions({ ...initialData })
    }
  }, [initialData])

  const handlePermissionChange = (
    key: keyof CompOffPermissionData,
    value: boolean,
  ) => {
    const newPermissions: CompOffPermissionData = { ...permissions, [key]: value }

    // Make the two main toggles mutually exclusive
    if (key === "compOffSelf" && value) {
      newPermissions.compOffAll = false
      newPermissions.compOffApplicationsAllCancel = false
      newPermissions.compOffApplicationsCancel = false
      newPermissions.compOffApplicationsApprove = false
      newPermissions.compOffApplicationsReject = false
      newPermissions.compOffApplicationsApprover = false
    } else if (key === "compOffAll" && value) {
      newPermissions.compOffSelf = false
      newPermissions.compOffApplicationsSelfCancel = false
    } else if (key === "compOffSelf" && !value) {
      newPermissions.compOffApplicationsSelfCancel = false
    } else if (key === "compOffAll" && !value) {
      newPermissions.compOffApplicationsAllCancel = false
      newPermissions.compOffApplicationsCancel = false
      newPermissions.compOffApplicationsApprove = false
      newPermissions.compOffApplicationsReject = false
      newPermissions.compOffApplicationsApprover = false
    }

    // If compOffApplicationsApprover is unchecked, clear approve/reject/cancel actions
    if (key === "compOffApplicationsApprover" && !value) {
      newPermissions.compOffApplicationsCancel = false
      newPermissions.compOffApplicationsApprove = false
      newPermissions.compOffApplicationsReject = false
    }

    setPermissions(newPermissions)
  }

  /**
   * Build payload so that only the current section's values are taken from the live form
   * and all other fields fall back to the last loaded values from `initialData`.
   */
  const buildSectionPayload = (section: "applicationManagement" | "approver") => {
    const base: CompOffPermissionData = {
      compOffSelf: initialData?.compOffSelf ?? false,
      compOffAll: initialData?.compOffAll ?? false,
      compOffApplicationsApprover: initialData?.compOffApplicationsApprover ?? false,
      compOffApplicationsSelfCancel: initialData?.compOffApplicationsSelfCancel ?? false,
      compOffApplicationsAllCancel: initialData?.compOffApplicationsAllCancel ?? false,
      compOffApplicationsCancel: initialData?.compOffApplicationsCancel ?? false,
      compOffApplicationsApprove: initialData?.compOffApplicationsApprove ?? false,
      compOffApplicationsReject: initialData?.compOffApplicationsReject ?? false,
    }

    if (section === "applicationManagement") {
      base.compOffSelf = !!permissions.compOffSelf
      base.compOffAll = !!permissions.compOffAll
      base.compOffApplicationsSelfCancel = !!permissions.compOffApplicationsSelfCancel
      base.compOffApplicationsAllCancel = !!permissions.compOffApplicationsAllCancel
    } else if (section === "approver") {
      base.compOffApplicationsApprover = !!permissions.compOffApplicationsApprover
      base.compOffApplicationsCancel = !!permissions.compOffApplicationsCancel
      base.compOffApplicationsApprove = !!permissions.compOffApplicationsApprove
      base.compOffApplicationsReject = !!permissions.compOffApplicationsReject
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
      console.error("Error saving comp-off application permissions:", error)
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
      console.error("Error saving comp-off application permissions:", error)
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
      {/* Sub-form 1: Comp-Off Application Management */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Comp-Off Application Management</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Configure who can apply for comp-off applications
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Comp-Off Self
                </div>
                <Label className="text-sm font-normal text-gray-900">
                  Allow applying for self
                </Label>
              </div>
              <SwitchToggle
                id="compOffSelf"
                checked={!!permissions.compOffSelf}
                onCheckedChange={(checked) =>
                  handlePermissionChange("compOffSelf", checked)
                }
                disabled={isReadOnly}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Comp-Off All
                </div>
                <Label className="text-sm font-normal text-gray-900">
                  Allow applying for all employees
                </Label>
              </div>
              <SwitchToggle
                id="compOffAll"
                checked={!!permissions.compOffAll}
                onCheckedChange={(checked) =>
                  handlePermissionChange("compOffAll", checked)
                }
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Cancel Application Permissions - Conditionally shown based on main toggle */}
          {(permissions.compOffSelf || permissions.compOffAll) && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                Cancel Application Permissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissions.compOffSelf && (
                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.compOffApplicationsSelfCancel}
                      onChange={(e) =>
                        handlePermissionChange("compOffApplicationsSelfCancel", e.target.checked)
                      }
                      disabled={isReadOnly}
                      className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-sm font-normal text-gray-900">
                      Cancel Self Applications
                    </span>
                  </label>
                )}

                {permissions.compOffAll && (
                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.compOffApplicationsAllCancel}
                      onChange={(e) =>
                        handlePermissionChange("compOffApplicationsAllCancel", e.target.checked)
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

      {/* Sub-form 2: Comp-Off Application Approver */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Comp-Off Application Approver</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Enable to allow approval/rejection/cancellation of comp-off applications
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Comp-Off Application Approver
              </div>
              <Label className="text-sm font-normal text-gray-900">
                Enable to allow approval/rejection/cancellation of comp-off applications
              </Label>
            </div>
            <SwitchToggle
              id="compOffApplicationsApprover"
              checked={!!permissions.compOffApplicationsApprover}
              onCheckedChange={(checked) =>
                handlePermissionChange("compOffApplicationsApprover", checked)
              }
              disabled={isReadOnly}
            />
          </div>

          {/* Actions - Only shown when approver is enabled */}
          {permissions.compOffApplicationsApprover && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                Comp-Off Application Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!permissions.compOffApplicationsCancel}
                    onChange={(e) =>
                      handlePermissionChange("compOffApplicationsCancel", e.target.checked)
                    }
                    disabled={isReadOnly}
                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-normal text-gray-900">
                    Cancel Comp-Off Requests
                  </span>
                </label>

                <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!permissions.compOffApplicationsApprove}
                    onChange={(e) =>
                      handlePermissionChange("compOffApplicationsApprove", e.target.checked)
                    }
                    disabled={isReadOnly}
                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-normal text-gray-900">
                    Approve Comp-Off Requests
                  </span>
                </label>

                <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!permissions.compOffApplicationsReject}
                    onChange={(e) =>
                      handlePermissionChange("compOffApplicationsReject", e.target.checked)
                    }
                    disabled={isReadOnly}
                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-sm font-normal text-gray-900">
                    Reject Comp-Off Requests
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



