"use client"

import React, { useEffect, useState } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { Shield } from "lucide-react"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useSearchParams } from "next/navigation"

interface LeavePermissionData {
  // leaveManagement screen
  leaveApplicationsOfTimeAwaySelf?: boolean
  leaveApplicationsOfTimeAwayAll?: boolean
  leaveApplicationsOfLeaveOfAbsenceSelf?: boolean
  leaveApplicationsOfLeaveOfAbsenceAll?: boolean
  newLeaveRequestSelf?: boolean
  newLeaveRequestAll?: boolean
  timeOffBalanceSelf?: boolean
  timeOffBalanceAll?: boolean
  // leaveApplication screen
  leaveApplicationApprover?: boolean
  leaveApplicationSelfCancel?: boolean
  leaveApplicationAllCancel?: boolean
  leaveApplicationCancel?: boolean
  leaveApplicationApprove?: boolean
  leaveApplicationReject?: boolean
  // specialLeaveApplication screen
  specialLeaveApplicationApprover?: boolean
  specialLeaveApplicationSelfCancel?: boolean
  specialLeaveApplicationAllCancel?: boolean
  specialLeaveApplicationCancel?: boolean
  specialLeaveApplicationApprove?: boolean
  specialLeaveApplicationReject?: boolean
}

interface LeaveFormApplicationProps {
  initialData?: LeavePermissionData | {
    serviceName?: string
    screens?: Array<{
      screenName: string
      permissions: Record<string, boolean>
      isActive?: boolean
    }>
    isActive?: boolean
  }
  onSave?: (data: LeavePermissionData | {
    serviceName: string
    screens: Array<{
      screenName: string
      permissions: Record<string, boolean>
      isActive: boolean
    }>
    isActive: boolean
  }) => void
  mode?: "add" | "edit" | "view"
}

/**
 * Transform nested JSON structure (with screens) to flat structure for form
 */
const transformNestedToFlat = (data: LeaveFormApplicationProps["initialData"]): LeavePermissionData => {
  if (!data) return {} as LeavePermissionData

  // If it's already flat structure, return as is
  if ("leaveApplicationsOfTimeAwaySelf" in data || "leaveApplicationApprover" in data) {
    return data as LeavePermissionData
  }

  // Transform nested structure
  const flat: LeavePermissionData = {} as LeavePermissionData

  if ("screens" in data && Array.isArray(data.screens)) {
    data.screens.forEach((screen) => {
      if (screen.screenName === "leaveManagement") {
        Object.assign(flat, screen.permissions)
      } else if (screen.screenName === "leaveApplication") {
        Object.assign(flat, screen.permissions)
      } else if (screen.screenName === "specialLeaveApplication") {
        Object.assign(flat, screen.permissions)
      }
    })
  }

  return flat
}

/**
 * Transform flat structure to nested JSON structure (with screens)
 */
const transformFlatToNested = (
  flat: LeavePermissionData,
  section: "applicationManagement" | "leaveApprover" | "specialLeaveApprover"
): {
  serviceName: string
  screens: Array<{
    screenName: string
    permissions: Record<string, boolean>
    isActive: boolean
  }>
  isActive: boolean
} => {
  const screens: Array<{
    screenName: string
    permissions: Record<string, boolean>
    isActive: boolean
  }> = []

  // leaveManagement screen
  screens.push({
    screenName: "leaveManagement",
    permissions: {
      leaveApplicationsOfTimeAwaySelf: !!flat.leaveApplicationsOfTimeAwaySelf,
      leaveApplicationsOfTimeAwayAll: !!flat.leaveApplicationsOfTimeAwayAll,
      leaveApplicationsOfLeaveOfAbsenceSelf: !!flat.leaveApplicationsOfLeaveOfAbsenceSelf,
      leaveApplicationsOfLeaveOfAbsenceAll: !!flat.leaveApplicationsOfLeaveOfAbsenceAll,
      newLeaveRequestSelf: !!flat.newLeaveRequestSelf,
      newLeaveRequestAll: !!flat.newLeaveRequestAll,
      timeOffBalanceSelf: !!flat.timeOffBalanceSelf,
      timeOffBalanceAll: !!flat.timeOffBalanceAll,
    },
    isActive: true,
  })

  // leaveApplication screen
  screens.push({
    screenName: "leaveApplication",
    permissions: {
      leaveApplicationApprover: !!flat.leaveApplicationApprover,
      leaveApplicationCancel: !!flat.leaveApplicationCancel,
      leaveApplicationApprove: !!flat.leaveApplicationApprove,
      leaveApplicationReject: !!flat.leaveApplicationReject,
      leaveApplicationSelfCancel: !!flat.leaveApplicationSelfCancel,
      leaveApplicationAllCancel: !!flat.leaveApplicationAllCancel,
    },
    isActive: true,
  })

  // specialLeaveApplication screen
  screens.push({
    screenName: "specialLeaveApplication",
    permissions: {
      specialLeaveApplicationApprover: !!flat.specialLeaveApplicationApprover,
      specialLeaveApplicationCancel: !!flat.specialLeaveApplicationCancel,
      specialLeaveApplicationApprove: !!flat.specialLeaveApplicationApprove,
      specialLeaveApplicationReject: !!flat.specialLeaveApplicationReject,
      specialLeaveApplicationSelfCancel: !!flat.specialLeaveApplicationSelfCancel,
      specialLeaveApplicationAllCancel: !!flat.specialLeaveApplicationAllCancel,
    },
    isActive: true,
  })

  return {
    serviceName: "leave",
    screens,
    isActive: true,
  }
}

export default function LeaveFormApplication({
  initialData,
  onSave,
  mode = "add",
}: LeaveFormApplicationProps) {
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

  // Transform initial data from nested to flat structure
  const flatInitialData = transformNestedToFlat(initialData)

  const [permissions, setPermissions] = useState<LeavePermissionData>({
    leaveApplicationsOfTimeAwaySelf: false,
    leaveApplicationsOfTimeAwayAll: false,
    leaveApplicationsOfLeaveOfAbsenceSelf: false,
    leaveApplicationsOfLeaveOfAbsenceAll: false,
    newLeaveRequestSelf: false,
    newLeaveRequestAll: false,
    timeOffBalanceSelf: false,
    timeOffBalanceAll: false,
    leaveApplicationApprover: false,
    leaveApplicationSelfCancel: false,
    leaveApplicationAllCancel: false,
    leaveApplicationCancel: false,
    leaveApplicationApprove: false,
    leaveApplicationReject: false,
    specialLeaveApplicationApprover: false,
    specialLeaveApplicationSelfCancel: false,
    specialLeaveApplicationAllCancel: false,
    specialLeaveApplicationCancel: false,
    specialLeaveApplicationApprove: false,
    specialLeaveApplicationReject: false,
    ...flatInitialData,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      const flatData = transformNestedToFlat(initialData)
      setPermissions({ ...flatData })
    }
  }, [initialData])

  const handlePermissionChange = (key: keyof LeavePermissionData, value: boolean) => {
    const newPermissions: LeavePermissionData = { ...permissions, [key]: value }

    // Time Away self/all
    if (key === "leaveApplicationsOfTimeAwaySelf" && value) {
      newPermissions.leaveApplicationsOfTimeAwayAll = false
    } else if (key === "leaveApplicationsOfTimeAwayAll" && value) {
      newPermissions.leaveApplicationsOfTimeAwaySelf = false
    }

    // Leave of Absence self/all
    if (key === "leaveApplicationsOfLeaveOfAbsenceSelf" && value) {
      newPermissions.leaveApplicationsOfLeaveOfAbsenceAll = false
      // Clear both cancel checkboxes when switching - they should start as false
      newPermissions.specialLeaveApplicationSelfCancel = false
      newPermissions.specialLeaveApplicationAllCancel = false
    } else if (key === "leaveApplicationsOfLeaveOfAbsenceAll" && value) {
      newPermissions.leaveApplicationsOfLeaveOfAbsenceSelf = false
      // Clear both cancel checkboxes when switching - they should start as false
      newPermissions.specialLeaveApplicationSelfCancel = false
      newPermissions.specialLeaveApplicationAllCancel = false
    } else if (key === "leaveApplicationsOfLeaveOfAbsenceSelf" && !value) {
      newPermissions.specialLeaveApplicationSelfCancel = false
    } else if (key === "leaveApplicationsOfLeaveOfAbsenceAll" && !value) {
      newPermissions.specialLeaveApplicationAllCancel = false
    }

    // New Leave Request self/all
    if (key === "newLeaveRequestSelf" && value) {
      newPermissions.newLeaveRequestAll = false
      // Clear both cancel checkboxes when switching - they should start as false
      newPermissions.leaveApplicationSelfCancel = false
      newPermissions.leaveApplicationAllCancel = false
    } else if (key === "newLeaveRequestAll" && value) {
      newPermissions.newLeaveRequestSelf = false
      // Clear both cancel checkboxes when switching - they should start as false
      newPermissions.leaveApplicationSelfCancel = false
      newPermissions.leaveApplicationAllCancel = false
    } else if (key === "newLeaveRequestSelf" && !value) {
      newPermissions.leaveApplicationSelfCancel = false
    } else if (key === "newLeaveRequestAll" && !value) {
      newPermissions.leaveApplicationAllCancel = false
    }

    // Time Off Balance self/all
    if (key === "timeOffBalanceSelf" && value) {
      newPermissions.timeOffBalanceAll = false
    } else if (key === "timeOffBalanceAll" && value) {
      newPermissions.timeOffBalanceSelf = false
    }

    // Leave Application Approver controls dependent actions
    if (key === "leaveApplicationApprover" && !value) {
      newPermissions.leaveApplicationCancel = false
      newPermissions.leaveApplicationApprove = false
      newPermissions.leaveApplicationReject = false
      newPermissions.leaveApplicationSelfCancel = false
      newPermissions.leaveApplicationAllCancel = false
    }

    // Special Leave Application Approver controls dependent actions
    if (key === "specialLeaveApplicationApprover" && !value) {
      newPermissions.specialLeaveApplicationCancel = false
      newPermissions.specialLeaveApplicationApprove = false
      newPermissions.specialLeaveApplicationReject = false
      newPermissions.specialLeaveApplicationSelfCancel = false
      newPermissions.specialLeaveApplicationAllCancel = false
    }

    setPermissions(newPermissions)
  }

  /**
   * Build payload so that only the current section's values are taken from the live form
   * and all other fields fall back to the last loaded values from `initialData`.
   * This prevents unsaved changes in other sections from being sent to the backend.
   */
  const buildSectionPayload = (section: "applicationManagement" | "leaveApprover" | "specialLeaveApprover") => {
    // Use flat initial data
    const baseInitialData = transformNestedToFlat(initialData)
    
    const base: LeavePermissionData = {
      // leaveManagement screen
      leaveApplicationsOfTimeAwaySelf:
        baseInitialData?.leaveApplicationsOfTimeAwaySelf ?? false,
      leaveApplicationsOfTimeAwayAll:
        baseInitialData?.leaveApplicationsOfTimeAwayAll ?? false,
      leaveApplicationsOfLeaveOfAbsenceSelf:
        baseInitialData?.leaveApplicationsOfLeaveOfAbsenceSelf ?? false,
      leaveApplicationsOfLeaveOfAbsenceAll:
        baseInitialData?.leaveApplicationsOfLeaveOfAbsenceAll ?? false,
      newLeaveRequestSelf: baseInitialData?.newLeaveRequestSelf ?? false,
      newLeaveRequestAll: baseInitialData?.newLeaveRequestAll ?? false,
      timeOffBalanceSelf: baseInitialData?.timeOffBalanceSelf ?? false,
      timeOffBalanceAll: baseInitialData?.timeOffBalanceAll ?? false,
      // leaveApplication screen
      leaveApplicationApprover: baseInitialData?.leaveApplicationApprover ?? false,
      leaveApplicationSelfCancel: baseInitialData?.leaveApplicationSelfCancel ?? false,
      leaveApplicationAllCancel: baseInitialData?.leaveApplicationAllCancel ?? false,
      leaveApplicationCancel: baseInitialData?.leaveApplicationCancel ?? false,
      leaveApplicationApprove: baseInitialData?.leaveApplicationApprove ?? false,
      leaveApplicationReject: baseInitialData?.leaveApplicationReject ?? false,
      // specialLeaveApplication screen
      specialLeaveApplicationApprover: baseInitialData?.specialLeaveApplicationApprover ?? false,
      specialLeaveApplicationSelfCancel: baseInitialData?.specialLeaveApplicationSelfCancel ?? false,
      specialLeaveApplicationAllCancel: baseInitialData?.specialLeaveApplicationAllCancel ?? false,
      specialLeaveApplicationCancel: baseInitialData?.specialLeaveApplicationCancel ?? false,
      specialLeaveApplicationApprove: baseInitialData?.specialLeaveApplicationApprove ?? false,
      specialLeaveApplicationReject: baseInitialData?.specialLeaveApplicationReject ?? false,
    }

    if (section === "applicationManagement") {
      base.leaveApplicationsOfTimeAwaySelf = !!permissions.leaveApplicationsOfTimeAwaySelf
      base.leaveApplicationsOfTimeAwayAll = !!permissions.leaveApplicationsOfTimeAwayAll
      base.leaveApplicationsOfLeaveOfAbsenceSelf = !!permissions.leaveApplicationsOfLeaveOfAbsenceSelf
      base.leaveApplicationsOfLeaveOfAbsenceAll = !!permissions.leaveApplicationsOfLeaveOfAbsenceAll
      base.newLeaveRequestSelf = !!permissions.newLeaveRequestSelf
      base.newLeaveRequestAll = !!permissions.newLeaveRequestAll
      base.timeOffBalanceSelf = !!permissions.timeOffBalanceSelf
      base.timeOffBalanceAll = !!permissions.timeOffBalanceAll
      // Include cancel permissions that are displayed in this section
      base.leaveApplicationSelfCancel = !!permissions.leaveApplicationSelfCancel
      base.leaveApplicationAllCancel = !!permissions.leaveApplicationAllCancel
      base.specialLeaveApplicationSelfCancel = !!permissions.specialLeaveApplicationSelfCancel
      base.specialLeaveApplicationAllCancel = !!permissions.specialLeaveApplicationAllCancel
    } else if (section === "leaveApprover") {
      base.leaveApplicationApprover = !!permissions.leaveApplicationApprover
      base.leaveApplicationSelfCancel = !!permissions.leaveApplicationSelfCancel
      base.leaveApplicationAllCancel = !!permissions.leaveApplicationAllCancel
      base.leaveApplicationCancel = !!permissions.leaveApplicationCancel
      base.leaveApplicationApprove = !!permissions.leaveApplicationApprove
      base.leaveApplicationReject = !!permissions.leaveApplicationReject
    } else if (section === "specialLeaveApprover") {
      base.specialLeaveApplicationApprover = !!permissions.specialLeaveApplicationApprover
      base.specialLeaveApplicationSelfCancel = !!permissions.specialLeaveApplicationSelfCancel
      base.specialLeaveApplicationAllCancel = !!permissions.specialLeaveApplicationAllCancel
      base.specialLeaveApplicationCancel = !!permissions.specialLeaveApplicationCancel
      base.specialLeaveApplicationApprove = !!permissions.specialLeaveApplicationApprove
      base.specialLeaveApplicationReject = !!permissions.specialLeaveApplicationReject
    }

    return base
  }

  const handleSectionSave = async (
    section: "applicationManagement" | "leaveApprover" | "specialLeaveApprover",
  ) => {
    if (!onSave) return

    setLoading(true)
    try {
      const flatPayload = buildSectionPayload(section)
      // Transform to nested structure if initial data was nested
      const isNestedFormat = initialData && "screens" in initialData
      if (isNestedFormat) {
        // For nested format, we need to merge current section changes with all other sections
        // Get the full current state merged with the section payload
        const fullPayload: LeavePermissionData = {
          ...permissions,
          ...flatPayload,
        }
        const payload = transformFlatToNested(fullPayload, section)
        await onSave(payload)
      } else {
        await onSave(flatPayload)
      }
    } catch (error) {
      console.error("Error saving leave permissions:", error)
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
      {/* Sub-form 1: Leave Application Management */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Leave Application Management</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Configure which leave applications this user can apply for or view
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* New Leave Request */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              New Leave Request
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    New Leave Request (Self)
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    Allow creating new leave only for self
                  </Label>
                </div>
                <SwitchToggle
                  id="newLeaveRequestSelf"
                  checked={!!permissions.newLeaveRequestSelf}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("newLeaveRequestSelf", checked)
                  }
                  disabled={isReadOnly}
                />
              </div>

              <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    New Leave Request (All)
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    Allow creating new leave for all employees
                  </Label>
                </div>
                <SwitchToggle
                  id="newLeaveRequestAll"
                  checked={!!permissions.newLeaveRequestAll}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("newLeaveRequestAll", checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Cancel Application Permissions - Under New Leave Request (Related to Leave Application Approver) */}
            {(permissions.newLeaveRequestSelf || permissions.newLeaveRequestAll) && (
              <div className="pt-2 border-gray-100 pb-4 border-b border-gray-100">
                <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                  Cancel Application Permissions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions.newLeaveRequestSelf && (
                    <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.leaveApplicationSelfCancel}
                        onChange={(e) => {
                          e.stopPropagation()
                          handlePermissionChange("leaveApplicationSelfCancel", e.target.checked)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isReadOnly}
                        className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="text-sm font-normal text-gray-900">
                        Cancel Self Applications
                      </span>
                    </label>
                  )}

                  {permissions.newLeaveRequestAll && (
                    <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.leaveApplicationAllCancel}
                        onChange={(e) => {
                          e.stopPropagation()
                          handlePermissionChange("leaveApplicationAllCancel", e.target.checked)
                        }}
                        onClick={(e) => e.stopPropagation()}
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
          </div>

          {/* Time Away */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Time Away
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Time Away (Self)
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    View only this employee&apos;s time away applications
                  </Label>
                </div>
                <SwitchToggle
                  id="leaveApplicationsOfTimeAwaySelf"
                  checked={!!permissions.leaveApplicationsOfTimeAwaySelf}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("leaveApplicationsOfTimeAwaySelf", checked)
                  }
                  disabled={isReadOnly}
                />
              </div>

              <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Time Away (All)
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    View time away for all employees in scope
                  </Label>
                </div>
                <SwitchToggle
                  id="leaveApplicationsOfTimeAwayAll"
                  checked={!!permissions.leaveApplicationsOfTimeAwayAll}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("leaveApplicationsOfTimeAwayAll", checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Leave Of Absence */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Leave Of Absence
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Leave Of Absence (Self)
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    View only this employee&apos;s leave of absence requests
                  </Label>
                </div>
                <SwitchToggle
                  id="leaveApplicationsOfLeaveOfAbsenceSelf"
                  checked={!!permissions.leaveApplicationsOfLeaveOfAbsenceSelf}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("leaveApplicationsOfLeaveOfAbsenceSelf", checked)
                  }
                  disabled={isReadOnly}
                />
              </div>

              <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Leave Of Absence (All)
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    View leave of absence for all employees in scope
                  </Label>
                </div>
                <SwitchToggle
                  id="leaveApplicationsOfLeaveOfAbsenceAll"
                  checked={!!permissions.leaveApplicationsOfLeaveOfAbsenceAll}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("leaveApplicationsOfLeaveOfAbsenceAll", checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Cancel Application Permissions - Under Leave Of Absence (Related to Special Leave Application Approver) */}
            {(permissions.leaveApplicationsOfLeaveOfAbsenceSelf || permissions.leaveApplicationsOfLeaveOfAbsenceAll) && (
              <div className="pt-4 border-gray-100">
                <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                  Cancel Application Permissions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions.leaveApplicationsOfLeaveOfAbsenceSelf && (
                    <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.specialLeaveApplicationSelfCancel}
                        onChange={(e) => {
                          e.stopPropagation()
                          handlePermissionChange("specialLeaveApplicationSelfCancel", e.target.checked)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isReadOnly}
                        className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="text-sm font-normal text-gray-900">
                        Cancel Self Applications
                      </span>
                    </label>
                  )}

                  {permissions.leaveApplicationsOfLeaveOfAbsenceAll && (
                    <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.specialLeaveApplicationAllCancel}
                        onChange={(e) => {
                          e.stopPropagation()
                          handlePermissionChange("specialLeaveApplicationAllCancel", e.target.checked)
                        }}
                        onClick={(e) => e.stopPropagation()}
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
          </div>

          {/* Time Off Balance */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Time Off Balance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Time Off Balance (Self)
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    View only this employee&apos;s time-off balances
                  </Label>
                </div>
                <SwitchToggle
                  id="timeOffBalanceSelf"
                  checked={!!permissions.timeOffBalanceSelf}
                  onCheckedChange={(checked) => handlePermissionChange("timeOffBalanceSelf", checked)}
                  disabled={isReadOnly}
                />
              </div>

              <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Time Off Balance (All)
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    View time-off balances for all employees
                  </Label>
                </div>
                <SwitchToggle
                  id="timeOffBalanceAll"
                  checked={!!permissions.timeOffBalanceAll}
                  onCheckedChange={(checked) => handlePermissionChange("timeOffBalanceAll", checked)}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

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

      {/* Sub-form 2: Leave Application Approver */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Leave Application Approver</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Enable to allow approval/rejection/cancellation of leave applications
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Approver Toggle - Top */}
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Leave Application Approver
              </div>
              <Label className="text-sm font-normal text-gray-900">
                Enable to allow approval/rejection/cancellation of leave applications
              </Label>
            </div>
            <SwitchToggle
              id="leaveApplicationApprover"
              checked={!!permissions.leaveApplicationApprover}
              onCheckedChange={(checked) => handlePermissionChange("leaveApplicationApprover", checked)}
              disabled={isReadOnly}
            />
          </div>

          {permissions.leaveApplicationApprover && (
            <>
              {/* Approve/Reject Actions */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                  Leave Application Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.leaveApplicationCancel}
                      onChange={(e) =>
                        handlePermissionChange("leaveApplicationCancel", e.target.checked)
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
                      checked={!!permissions.leaveApplicationApprove}
                      onChange={(e) =>
                        handlePermissionChange("leaveApplicationApprove", e.target.checked)
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
                      checked={!!permissions.leaveApplicationReject}
                      onChange={(e) =>
                        handlePermissionChange("leaveApplicationReject", e.target.checked)
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
            </>
          )}

          {!isReadOnly && onSave && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSectionSave("leaveApprover")}
                disabled={loading}
                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Save Approver"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-form 3: Special Leave Application Approver */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Special Leave Application Approver</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Enable to allow approval/rejection/cancellation of special leave applications
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Approver Toggle - Top */}
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Special Leave Application Approver
              </div>
              <Label className="text-sm font-normal text-gray-900">
                Enable to allow approval/rejection/cancellation of special leave applications
              </Label>
            </div>
            <SwitchToggle
              id="specialLeaveApplicationApprover"
              checked={!!permissions.specialLeaveApplicationApprover}
              onCheckedChange={(checked) => handlePermissionChange("specialLeaveApplicationApprover", checked)}
              disabled={isReadOnly}
            />
          </div>

          {permissions.specialLeaveApplicationApprover && (
            <>
              {/* Approve/Reject Actions */}
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                  Special Leave Application Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.specialLeaveApplicationCancel}
                      onChange={(e) =>
                        handlePermissionChange("specialLeaveApplicationCancel", e.target.checked)
                      }
                      disabled={isReadOnly}
                      className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-sm font-normal text-gray-900">
                      Cancel Special Applications
                    </span>
                  </label>

                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.specialLeaveApplicationApprove}
                      onChange={(e) =>
                        handlePermissionChange("specialLeaveApplicationApprove", e.target.checked)
                      }
                      disabled={isReadOnly}
                      className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-sm font-normal text-gray-900">
                      Approve Special Applications
                    </span>
                  </label>

                  <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!permissions.specialLeaveApplicationReject}
                      onChange={(e) =>
                        handlePermissionChange("specialLeaveApplicationReject", e.target.checked)
                      }
                      disabled={isReadOnly}
                      className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-sm font-normal text-gray-900">
                      Reject Special Applications
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {!isReadOnly && onSave && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => handleSectionSave("specialLeaveApprover")}
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


