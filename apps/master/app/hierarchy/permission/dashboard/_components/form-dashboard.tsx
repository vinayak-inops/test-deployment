"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Shield } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import RolePermissionConfirmModal from "../../_components/role-permission-confirm-modal"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useSearchParams } from "next/navigation"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { toast } from "react-toastify"
import {
  createDashboardPermissionSchema,
  type DashboardPermissionPayload,
} from "./dashboard-permission-schema"

type DashboardPermissionState = {
  totalCount: boolean
  workOrderCount: boolean
  contractorCount: boolean
  departmentCount: boolean
}

interface DashboardFormProps {
  initialData?: DashboardPermissionPayload | DashboardPermissionState
  onSave?: (data: DashboardPermissionPayload) => void
  mode?: "add" | "edit" | "view"
}

type PermissionVisibilityConfig = {
  label?: string
  visible?: boolean
}

type DashboardFormStructure = {
  label?: string
  title?: string
  subtitle?: string
  description?: string
  sectionTitle?: string
  confirmTitle?: string
  confirmDescription?: string
  confirmBody?: string
  liveDashboard?: {
    label?: string
    rowLabel?: string
    permissions?: Record<string, PermissionVisibilityConfig>
  }
  fields?: {
    liveDashboard?: {
      label?: string
      rowLabel?: string
      fields?: {
        permissions?: {
          fields?: Record<string, PermissionVisibilityConfig>
        }
      }
    }
  }
}

const getObjectValue = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const pickFirstObject = (...values: unknown[]): Record<string, unknown> | null => {
  for (const value of values) {
    const resolved = getObjectValue(value)
    if (resolved) return resolved
  }
  return null
}

export default function DashboardForm({
  initialData,
  onSave,
  mode = "add",
}: DashboardFormProps) {
  const searchParams = useSearchParams()
  const modeView = searchParams.get("mode")
  const tenantCode = useGetTenantCode()
  const entitlementCode = searchParams.get("entitlementCode") || undefined
  const { formStructure } = useCollectionFormStructure({
    collectionName: "role_permission_form_structure",
  })
  // Role-based permissions for this page (managed under Role & Permissions)
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName: "rolePermissions",
  })

  const editMode = modeView != "permissionview" ? rolePermissions?.edit : false
  const addMode = modeView != "permissionview" ? rolePermissions?.add : false
  const resolvedFormStructure = useMemo(() => {
    const root = getObjectValue(formStructure)
    if (!root) return {} as DashboardFormStructure

    const candidate =
      pickFirstObject(
        root.dashboard,
        getObjectValue(root.setting)?.dashboard,
      ) || root

    return candidate as DashboardFormStructure
  }, [formStructure])

  const liveDashboardConfig =
    resolvedFormStructure.fields?.liveDashboard || resolvedFormStructure.liveDashboard
  const fields =
    resolvedFormStructure.fields?.liveDashboard?.fields?.permissions?.fields ||
    resolvedFormStructure.liveDashboard?.permissions ||
    {}
  const hasLiveDashboardConfig = Boolean(liveDashboardConfig)
  const getFieldLabel = (key: keyof DashboardPermissionState, fallback: string) =>
    fields[key]?.label || fallback
  const isFieldVisible = (key: keyof DashboardPermissionState) =>
    hasLiveDashboardConfig && !!fields[key] && fields[key]?.visible === true

  // If user only has view (or no edit/add), treat form as read-only
  const isReadOnly = mode === "view" || (!editMode && !addMode)

  const { post: postDashboardPermissions, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: () => {
      toast.success("Dashboard permissions saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving dashboard permissions:", error)
      toast.error("Failed to save dashboard permissions!")
    },
  })

  const normalizeRecordId = (value: unknown): string | null => {
    if (!value) return null
    if (typeof value === "string") return value
    if (typeof value === "object" && value !== null && "$oid" in value) {
      return String((value as { $oid: string }).$oid)
    }
    return String(value)
  }

  const [fetchedPayload, setFetchedPayload] = useState<DashboardPermissionPayload | null>(
    null
  )
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(null)

  const { refetch: refetchDashboard } = useRequest<any>({
    url: "role_permissions/search",
    method: "POST",
    data: [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      { field: "entitlementCode", value: entitlementCode, operator: "eq" },
      { field: "createdOn", value: "", operator: "desc" },
    ],
    dependencies: [tenantCode, entitlementCode],
    onSuccess: (response) => {
      const list = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [response]

      const raw = list[0]
      if (!raw) {
        setFetchedPayload(null)
        setFetchedRecordId(null)
        return
      }

      setFetchedRecordId(normalizeRecordId(raw?._id))

      if (raw?.dashboard && typeof raw.dashboard === "object") {
        setFetchedPayload(raw as DashboardPermissionPayload)
        return
      }

      const dashboardPayload = raw?.setting?.dashboard || null
      if (dashboardPayload && typeof dashboardPayload === "object") {
        setFetchedPayload({ dashboard: dashboardPayload })
        return
      }

      setFetchedPayload(null)
    },
    onError: (error) => {
      console.error("Error fetching dashboard permissions:", error)
    },
  })

  const buildStateFromInitial = (
    data?: DashboardPermissionPayload | DashboardPermissionState | null
  ): DashboardPermissionState => {
    const base: DashboardPermissionState = {
      totalCount: false,
      workOrderCount: false,
      contractorCount: false,
      departmentCount: false,
    }

    if (!data) return base

    if ("dashboard" in data && data.dashboard) {
      const liveDashboard =
        data.dashboard.liveDashboard ||
        (data.dashboard as unknown as { permissions?: Record<string, boolean> })?.permissions ||
        (data.dashboard as unknown as { liveDashboard?: { permissions?: Record<string, boolean> } })
          ?.liveDashboard ||
        null

      const permissions =
        (liveDashboard as { permissions?: Record<string, boolean> })?.permissions ??
        (data.dashboard as unknown as { permissions?: Record<string, boolean> })?.permissions ??
        (data.dashboard as unknown as Record<string, boolean>)

      return {
        ...base,
        totalCount: !!permissions?.totalCount,
        workOrderCount: !!permissions?.workOrderCount,
        contractorCount: !!permissions?.contractorCount,
        departmentCount: !!permissions?.departmentCount,
      }
    }

    return {
      ...base,
      ...(data as DashboardPermissionState),
    }
  }

  const sourceData = useMemo(() => {
    if (fetchedPayload) return fetchedPayload
    return null
  }, [fetchedPayload])

  const [permissions, setPermissions] = useState<DashboardPermissionState>(() =>
    buildStateFromInitial(sourceData)
  )

  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setPermissions(buildStateFromInitial(sourceData))
  }, [sourceData])

  const handlePermissionChange = (key: keyof DashboardPermissionState, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const isActive =
        !!permissions.totalCount ||
        !!permissions.workOrderCount ||
        !!permissions.contractorCount ||
        !!permissions.departmentCount

      const payload: DashboardPermissionPayload = {
        dashboard: {
          isActive,
          liveDashboard: {
            isActive,
            permissions: {
              totalCount: !!permissions.totalCount,
              workOrderCount: !!permissions.workOrderCount,
              contractorCount: !!permissions.contractorCount,
              departmentCount: !!permissions.departmentCount,
            },
          },
        },
      }

      const schema = createDashboardPermissionSchema()
      const validated = schema.safeParse(payload)

      if (!validated.success) {
        toast.error("Invalid dashboard payload")
        return
      }

      const resolvedRecordId = fetchedRecordId || null
      const isEditMode = Boolean(resolvedRecordId)

      const requestPayload = {
        tenant: tenantCode,
        action: isEditMode ? "update" : "insert",
        ...(isEditMode ? { id: resolvedRecordId } : {}),
        collectionName: "role_permissions",
        data: {
          ...(entitlementCode ? { entitlementCode } : {}),
          tenantCode: tenantCode || "",
          ...validated.data,
        },
      }

      await postDashboardPermissions(requestPayload)
      await refetchDashboard?.()
      await onSave?.(validated.data)
    } catch (error) {
      console.error("Error saving dashboard permissions:", error)
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
    <div className="w-full max-w-4xl mx-auto">
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={loading || postLoading}
        title={resolvedFormStructure.confirmTitle || "Confirm Dashboard Permission Change"}
        description={
          resolvedFormStructure.confirmDescription ||
          "You are updating dashboard permissions. This can impact user access."
        }
        body={
          resolvedFormStructure.confirmBody ||
          "Please review your changes carefully. Proceed only if you are sure about this update."
        }
        onCancel={() => setShowConfirm(false)}
        onConfirm={async () => {
          await handleSave()
          setShowConfirm(false)
        }}
      />

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Shield className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {resolvedFormStructure.label || "Dashboard Permissions"}
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {resolvedFormStructure.description ||
                  resolvedFormStructure.subtitle ||
                  "Manage dashboard view permissions and access controls"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSave()
            }}
            className="space-y-6"
          >
            {/* Dashboard Management Section */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                  {resolvedFormStructure.sectionTitle ||
                    resolvedFormStructure.title ||
                    liveDashboardConfig?.label ||
                    "Live Dashboard"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Total Count */}
                  {isFieldVisible("totalCount") && (
                  <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {getFieldLabel("totalCount", formatPermissionLabel("totalCount"))}
                      </div>
                      <label
                        htmlFor="totalCount"
                        className="text-sm font-normal text-gray-900 cursor-pointer block"
                      >
                        Allow viewing total count
                      </label>
                    </div>
                    <SwitchToggle
                      id="totalCount"
                      checked={!!permissions.totalCount}
                      onCheckedChange={(checked) =>
                        handlePermissionChange("totalCount", checked)
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                  )}

                  {/* Work Order Count */}
                  {isFieldVisible("workOrderCount") && (
                  <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {getFieldLabel("workOrderCount", formatPermissionLabel("workOrderCount"))}
                      </div>
                      <label
                        htmlFor="workOrderCount"
                        className="text-sm font-normal text-gray-900 cursor-pointer block"
                      >
                        Allow viewing work order count
                      </label>
                    </div>
                    <SwitchToggle
                      id="workOrderCount"
                      checked={!!permissions.workOrderCount}
                      onCheckedChange={(checked) =>
                        handlePermissionChange("workOrderCount", checked)
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                  )}

                  {/* Contractor Count */}
                  {isFieldVisible("contractorCount") && (
                  <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {getFieldLabel("contractorCount", formatPermissionLabel("contractorCount"))}
                      </div>
                      <label
                        htmlFor="contractorCount"
                        className="text-sm font-normal text-gray-900 cursor-pointer block"
                      >
                        Allow viewing contractor count
                      </label>
                    </div>
                    <SwitchToggle
                      id="contractorCount"
                      checked={!!permissions.contractorCount}
                      onCheckedChange={(checked) =>
                        handlePermissionChange("contractorCount", checked)
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                  )}

                  {/* Department Count */}
                  {isFieldVisible("departmentCount") && (
                  <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {getFieldLabel("departmentCount", formatPermissionLabel("departmentCount"))}
                      </div>
                      <label
                        htmlFor="departmentCount"
                        className="text-sm font-normal text-gray-900 cursor-pointer block"
                      >
                        Allow viewing department count
                      </label>
                    </div>
                    <SwitchToggle
                      id="departmentCount"
                      checked={!!permissions.departmentCount}
                      onCheckedChange={(checked) =>
                        handlePermissionChange("departmentCount", checked)
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        {!isReadOnly && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <ActionButtons
              layout="end"
              gap="gap-3"
              secondaryLabel="Reset"
              onSecondary={() => {
                setPermissions({
                  totalCount: false,
                  workOrderCount: false,
                  contractorCount: false,
                  departmentCount: false,
                })
              }}
              primaryLabel="Save Changes"
              onPrimary={() => setShowConfirm(true)}
              primaryLoading={loading || postLoading}
              primaryDisabled={loading || postLoading}
              className="w-full"
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            />
          </div>
        )}
      </div>
    </div>
  )
}
