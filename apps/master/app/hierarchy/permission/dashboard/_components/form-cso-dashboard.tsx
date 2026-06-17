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
  createCsoDashboardPermissionSchema,
  type CsoDashboardPermissionPayload,
} from "./cso-dashboard-permission-schema"

type CsoDashboardPermissionState = {
  view: boolean
}

interface CsoDashboardFormProps {
  initialData?: CsoDashboardPermissionPayload | CsoDashboardPermissionState
  onSave?: (data: CsoDashboardPermissionPayload) => void
  mode?: "add" | "edit" | "view"
}

type PermissionVisibilityConfig = {
  label?: string
  visible?: boolean
}

type CsoDashboardFormStructure = {
  label?: string
  title?: string
  subtitle?: string
  description?: string
  sectionTitle?: string
  confirmTitle?: string
  confirmDescription?: string
  confirmBody?: string
  csoDashboard?: {
    label?: string
    rowLabel?: string
    fields?: {
      permissions?: {
        fields?: Record<string, PermissionVisibilityConfig>
      }
    }
  }
  fields?: {
    csoDashboard?: {
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

export default function CsoDashboardForm({
  initialData,
  onSave,
  mode = "add",
}: CsoDashboardFormProps) {
  const searchParams = useSearchParams()
  const modeView = searchParams.get("mode")
  const tenantCode = useGetTenantCode()
  const entitlementCode = searchParams.get("entitlementCode") || undefined
  const { formStructure } = useCollectionFormStructure({
    collectionName: "role_permission_form_structure",
  })
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName: "rolePermissions",
  })

  const editMode = modeView != "permissionview" ? rolePermissions?.edit : false
  const addMode = modeView != "permissionview" ? rolePermissions?.add : false
  const isReadOnly = mode === "view" || (!editMode && !addMode)

  const resolvedFormStructure = useMemo(() => {
    const root = getObjectValue(formStructure)
    if (!root) return {} as CsoDashboardFormStructure

    const candidate =
      pickFirstObject(
        root.csoDashboard,
        getObjectValue(root.setting)?.csoDashboard,
      ) || root

    return candidate as CsoDashboardFormStructure
  }, [formStructure])

  const csoDashboardConfig =
    resolvedFormStructure.fields?.csoDashboard || resolvedFormStructure.csoDashboard
  const fields =
    resolvedFormStructure.fields?.csoDashboard?.fields?.permissions?.fields ||
    resolvedFormStructure.csoDashboard?.fields?.permissions?.fields ||
    {}
  const hasConfig = Boolean(csoDashboardConfig)
  const getFieldLabel = (key: keyof CsoDashboardPermissionState, fallback: string) =>
    fields[key]?.label || fallback
  const isFieldVisible = (key: keyof CsoDashboardPermissionState) =>
    hasConfig && !!fields[key] && fields[key]?.visible === true

  const { post: postCsoDashboardPermissions, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: () => {
      toast.success("CSO dashboard permissions saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving CSO dashboard permissions:", error)
      toast.error("Failed to save CSO dashboard permissions!")
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

  const [fetchedPayload, setFetchedPayload] = useState<CsoDashboardPermissionPayload | null>(
    null
  )
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(null)

  const { refetch: refetchCsoDashboard } = useRequest<any>({
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

      if (raw?.csoDashboard && typeof raw.csoDashboard === "object") {
        setFetchedPayload(raw as CsoDashboardPermissionPayload)
        return
      }

      const csoDashboardPayload = raw?.setting?.csoDashboard || null
      if (csoDashboardPayload && typeof csoDashboardPayload === "object") {
        setFetchedPayload({ csoDashboard: csoDashboardPayload })
        return
      }

      setFetchedPayload(null)
    },
    onError: (error) => {
      console.error("Error fetching CSO dashboard permissions:", error)
    },
  })

  const buildStateFromInitial = (
    data?: CsoDashboardPermissionPayload | CsoDashboardPermissionState | null
  ): CsoDashboardPermissionState => {
    const base: CsoDashboardPermissionState = {
      view: false,
    }

    if (!data) return base

    if ("csoDashboard" in data && data.csoDashboard) {
      const nestedCsoDashboard = data.csoDashboard.csoDashboard

      return {
        ...base,
        view: !!nestedCsoDashboard?.permissions?.view,
      }
    }

    return {
      ...base,
      ...(data as CsoDashboardPermissionState),
    }
  }

  const sourceData = useMemo(() => {
    if (fetchedPayload) return fetchedPayload
    if (initialData && "csoDashboard" in initialData) return initialData
    return initialData || null
  }, [fetchedPayload, initialData])

  const [permissions, setPermissions] = useState<CsoDashboardPermissionState>(() =>
    buildStateFromInitial(sourceData)
  )

  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setPermissions(buildStateFromInitial(sourceData))
  }, [sourceData])

  const handlePermissionChange = (key: keyof CsoDashboardPermissionState, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const isActive = !!permissions.view

      const payload: CsoDashboardPermissionPayload = {
        csoDashboard: {
          isActive,
          csoDashboard: {
            isActive,
            permissions: {
              view: !!permissions.view,
            },
          },
        },
      }

      const schema = createCsoDashboardPermissionSchema()
      const validated = schema.safeParse(payload)

      if (!validated.success) {
        toast.error("Invalid CSO dashboard payload")
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

      await postCsoDashboardPermissions(requestPayload)
      await refetchCsoDashboard?.()
      await onSave?.(validated.data)
    } catch (error) {
      console.error("Error saving CSO dashboard permissions:", error)
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
    <div className="w-full max-w-4xl mx-auto">
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={loading || postLoading}
        title={resolvedFormStructure.confirmTitle || "Confirm CSO Dashboard Permission Change"}
        description={
          resolvedFormStructure.confirmDescription ||
          "You are updating CSO dashboard permissions. This can impact user access."
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
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Shield className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {resolvedFormStructure.label || "CSO Dashboard Permissions"}
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {resolvedFormStructure.description ||
                  resolvedFormStructure.subtitle ||
                  "Manage CSO dashboard view permissions and access controls"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSave()
            }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                  {resolvedFormStructure.sectionTitle ||
                    resolvedFormStructure.title ||
                    csoDashboardConfig?.label ||
                    "CSO Dashboard"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isFieldVisible("view") && (
                    <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex-1 pr-4">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                          {getFieldLabel("view", "View")}
                        </div>
                        <label
                          htmlFor="view"
                          className="text-sm font-normal text-gray-900 cursor-pointer block"
                        >
                          Allow viewing CSO dashboard
                        </label>
                      </div>
                      <SwitchToggle
                        id="view"
                        checked={!!permissions.view}
                        onCheckedChange={(checked) => handlePermissionChange("view", checked)}
                        disabled={isReadOnly}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {!isReadOnly && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <ActionButtons
              layout="end"
              gap="gap-3"
              secondaryLabel="Reset"
              onSecondary={() => {
                setPermissions({
                  view: false,
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
