"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { AlertTriangle } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import RolePermissionConfirmModal from "../../_components/role-permission-confirm-modal"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useSearchParams } from "next/navigation"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { toast } from "react-toastify"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import {
  createDefaultRoleControlData,
  createRoleControlSchema,
  roleControlKeys,
  type CrudPermission,
  type RoleControlData,
  type RoleControlEntry,
  type RoleControlKey,
} from "./role-control-schema"

interface RolePermissionFormProps {
  initialData?: RoleControlData
  recordId?: string | null
  entitlementCode?: string
  onSave?: () => void
  mode?: "add" | "edit" | "view"
}

type PermissionVisibilityConfig = {
  visible?: boolean
}

type NestedPermissionConfig = {
  fields?: {
    permissions?: {
      fields?: Record<string, PermissionVisibilityConfig>
    }
  }
}

type PermissionSectionConfig = {
  label?: string
  description?: string
  visible?: boolean
  permissions?: Record<string, PermissionVisibilityConfig>
  fields?: {
    permissions?: {
      fields?: Record<string, PermissionVisibilityConfig>
    }
  }
}

type RolePermissionFormStructure = {
  label?: string
  visible?: boolean
  title?: string
  subtitle?: string
  description?: string
  sectionTitle?: string
  confirmTitle?: string
  confirmDescription?: string
  confirmBody?: string
  fields?: Record<string, PermissionSectionConfig>
  modules?: Record<string, PermissionSectionConfig>
}

const ROLE_SCREENS: {
  key: RoleControlKey
  label: string
  description: string
}[] = [
  {
    key: "rolePermissions",
    label: "Role Permissions",
    description: "Control who can configure and assign role-based access for all modules.",
  },
  {
    key: "userEntitlements",
    label: "User Entitlements",
    description: "Control who can manage user-to-role mapping and entitlement assignments.",
  },
  {
    key: "userEntitlementsHris",
    label: "Company User Entitlements",
    description: "Control who can manage company employee entitlement assignments.",
  },
  {
    key: "contractEmployeeApprover",
    label: "Contract Employee Approver",
    description: "Control who can manage contract employee approvers.",
  },
  {
    key: "contractEmployeeApproverHris",
    label: "Company Employee Approver",
    description: "Control who can manage company employee approvers.",
  },
]

type RolePermissionState = Record<RoleControlKey, CrudPermission>
type CrudField = keyof CrudPermission

const CRUD_FIELDS: CrudField[] = ["view", "edit", "add", "delete"]
const EMPTY_PERMISSION_CONFIG: PermissionSectionConfig = {}

const getObjectValue = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const pickFirstObject = (...values: unknown[]): Record<string, unknown> | null => {
  for (const value of values) {
    const resolved = getObjectValue(value)
    if (resolved) return resolved
  }
  return null
}

const normalizeRolePermissionFormStructure = (raw: unknown): RolePermissionFormStructure => {
  const root = getObjectValue(raw)
  if (!root) return {}

  const candidate =
    pickFirstObject(
      root.roleControl,
      root.rolePermissions,
      getObjectValue(root.role)?.rolePermissions,
      getObjectValue(root.role)?.roleControl,
    ) || root

  return candidate as RolePermissionFormStructure
}

export default function RolePermissionForm({
  initialData,
  recordId,
  entitlementCode,
  onSave,
  mode = "add",
}: RolePermissionFormProps) {
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()
  const modeView = searchParams.get('mode');
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "role_permission_form_structure",
  })
  // Role-based permissions for this page (centralized under Role & Permissions)
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName: "rolePermissions",
  })

  const editMode = modeView != "permissionview"? rolePermissions?.edit : false
  const addMode = modeView != "permissionview"? rolePermissions?.add : false
  const resolvedFormStructure = useMemo(
    () => normalizeRolePermissionFormStructure(formStructure),
    [formStructure],
  )
  const moduleConfigs = resolvedFormStructure.fields || resolvedFormStructure.modules || {}
  const getModuleConfig = (key: RoleControlKey) => moduleConfigs[key] || EMPTY_PERMISSION_CONFIG
  const hasModuleConfig = (key: RoleControlKey) => Boolean(moduleConfigs[key])
  const getModuleLabel = (key: RoleControlKey, fallback: string) =>
    getModuleConfig(key).label || fallback
  const getModuleDescription = (key: RoleControlKey, fallback: string) =>
    getModuleConfig(key).description || fallback
  const isModuleVisible = (key: RoleControlKey) =>
    hasModuleConfig(key) && getModuleConfig(key).visible === true
  const getPermissionConfigs = (sectionConfig: PermissionSectionConfig | undefined) =>
    sectionConfig?.fields?.permissions?.fields || sectionConfig?.permissions || {}
  const isPermissionVisible = (sectionConfig: PermissionSectionConfig | undefined, field: CrudField) =>
    field in getPermissionConfigs(sectionConfig)
  const visibleModules = ROLE_SCREENS.filter(({ key }) => isModuleVisible(key))
  const visibleCrudFields = CRUD_FIELDS.filter((field) =>
    visibleModules.some(({ key }) => isPermissionVisible(getModuleConfig(key), field)),
  )
  const showModulePermissions = visibleModules.length > 0
  const shouldShowConfigLoader = formStructureLoading && !formStructure

  const isReadOnly = mode === "view" || (!editMode && !addMode)
  const { post: postRoleControl, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: async () => {
      toast.success("Role & permissions saved successfully!")
      setShowConfirm(false)
      await onSave?.()
    },
    onError: (error) => {
      console.error("Error saving role & permissions:", error)
      toast.error("Failed to save role & permissions!")
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

  const [fetchedInitialData, setFetchedInitialData] = useState<RoleControlData | null>(null)
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(recordId ?? null)

  const { refetch: refetchRoleControl } = useRequest<any>({
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
        setFetchedInitialData(null)
        setFetchedRecordId(null)
        return
      }

      setFetchedRecordId(normalizeRecordId(raw?._id))
      setFetchedInitialData({
        _id: normalizeRecordId(raw?._id) ?? undefined,
        roleControl:
          raw?.roleControl && typeof raw.roleControl === "object"
            ? raw.roleControl
            : createDefaultRoleControlData().roleControl,
        isActive: !!raw?.isActive,
      })
    },
    onError: (error) => {
      console.error("Error fetching role permissions:", error)
    },
  })

  const sourceData = fetchedInitialData ?? initialData ?? null

  const buildInitialState = (dataSource?: RoleControlData | null): RolePermissionState => {
    const schemaDefaults = createDefaultRoleControlData().roleControl
    const base: RolePermissionState = roleControlKeys.reduce((acc, key) => {
      acc[key] = { ...schemaDefaults[key].permissions }
      return acc
    }, {} as RolePermissionState)

    if (dataSource?.roleControl && typeof dataSource.roleControl === "object") {
      roleControlKeys.forEach((key) => {
        const entry = dataSource.roleControl[key]
        if (!entry?.permissions) return
        base[key] = {
          ...base[key],
          ...entry.permissions,
        } as CrudPermission
      })
      return base
    }

    return base
  }

  const [permissions, setPermissions] = useState<RolePermissionState>(() => buildInitialState(sourceData))
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setPermissions(buildInitialState(sourceData))
  }, [sourceData])

  const handleToggle = (screenKey: RoleControlKey, field: keyof CrudPermission, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [screenKey]: {
        ...prev[screenKey],
        // If view is turned OFF, force all other permissions to false as well
        ...(field === "view" && value === false
          ? { view: false, edit: false, add: false, delete: false }
          : { [field]: value }),
      },
    }))
  }

  const handleSave = async () => {
    try {
      const modules = {} as Record<RoleControlKey, RoleControlEntry>
      roleControlKeys.forEach((key) => {
        const p = permissions[key]
        const entryIsActive = !!(p?.view || p?.edit || p?.add || p?.delete)
        modules[key] = {
          permissions: { ...permissions[key] },
          isActive: entryIsActive,
        }
      })

      const isActive = Object.values(modules).some((entry) => {
        const p = entry.permissions || {}
        return !!(p.view || p.edit || p.add || p.delete)
      })

      const schema = createRoleControlSchema()
      const validated = schema.safeParse({
        _id: recordId || undefined,
        roleControl: {
          isActive,
          rolePermissions: modules.rolePermissions,
          userEntitlements: modules.userEntitlements,
          userEntitlementsHris: modules.userEntitlementsHris,
          contractEmployeeApprover: modules.contractEmployeeApprover,
          contractEmployeeApproverHris: modules.contractEmployeeApproverHris,
        },
        isActive,
      })
      if (!validated.success) {
        toast.error("Invalid role control payload")
        return
      }

      const resolvedRecordId = fetchedRecordId || recordId || ""
      const isEditMode = Boolean(resolvedRecordId)
      const requestPayload = {
        tenant: tenantCode,
        action: isEditMode ? "update" : "insert",
        ...(isEditMode ? { id: resolvedRecordId } : {}),
        collectionName: "role_permissions",
        data: {
        ...(entitlementCode ? { entitlementCode } : {}),
        tenantCode: tenantCode || "",
        roleControl: {
          isActive,
          ...modules,
        },
        isActive,
      },
    }

      await postRoleControl(requestPayload)
      await refetchRoleControl?.()
    } catch (error) {
      console.error("Error saving role & permissions:", error)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 relative">
      {/* Centered confirmation alert overlay */}
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={postLoading}
        title={resolvedFormStructure.confirmTitle}
        description={resolvedFormStructure.confirmDescription}
        body={resolvedFormStructure.confirmBody}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleSave}
      />

      <div className="bg-white border border-red-300 rounded-lg shadow-sm">
        {/* Header with alert styling */}
        <div className="px-6 pt-4 pb-3 border-b border-red-100 flex items-center gap-3 bg-red-50">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-red-900">
              {resolvedFormStructure.label || "Role & Permissions"}
            </h2>
            <p className="text-[11px] text-red-600 mt-0.5">
              {resolvedFormStructure.description ||
                resolvedFormStructure.subtitle ||
                "High impact area - changes here affect access across the entire application."}
            </p>
          </div>
        </div>

        {/* Table-style permissions */}
        <div className="px-6 py-4">
          {shouldShowConfigLoader ? (
            <div className="py-10 text-center text-sm text-gray-600">Loading form configuration...</div>
          ) : (
            <>
              {showModulePermissions && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      {resolvedFormStructure.sectionTitle || resolvedFormStructure.title || "Critical Modules"}
                    </span>
                    <div className="flex items-center justify-end gap-6 min-w-[220px] text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      {visibleCrudFields.map((field) => (
                        <span key={field} className="w-10 text-center">
                          {field[0].toUpperCase() + field.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {visibleModules.map(({ key, label, description }) => {
                      const p = permissions[key]
                      const moduleConfig = getModuleConfig(key)
                      return (
                        <div key={key} className="flex items-center justify-between py-3">
                          <div className="flex flex-col pr-4 max-w-md">
                            <Label className="text-sm font-medium text-gray-900">
                              {getModuleLabel(key, label)}
                            </Label>
                            <span className="text-xs text-gray-500 mt-0.5">
                              {getModuleDescription(key, description)}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-6 min-w-[220px]">
                            {visibleCrudFields.map((field) =>
                              isPermissionVisible(moduleConfig, field) ? (
                                <div key={field} className="w-10 flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={!!p?.[field]}
                                    onChange={(e) => handleToggle(key, field, e.target.checked)}
                                    disabled={isReadOnly}
                                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-red-600 focus:ring-2 focus:ring-red-600 focus:ring-offset-0"
                                  />
                                </div>
                              ) : (
                                <div key={field} className="w-10" />
                              ),
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {!isReadOnly && (
            <div className="flex justify-end mt-4">
              <ActionButtons
                layout="end"
                gap="gap-3"
                secondaryLabel="Reset"
                onSecondary={() => setPermissions(buildInitialState(sourceData))}
                primaryLabel="Save Role & Permissions"
                onPrimary={() => setShowConfirm(true)}
                primaryLoading={postLoading}
                primaryDisabled={postLoading}
                className="w-full md:w-auto"
                primaryClassName="bg-red-600 hover:bg-red-700 text-white"
                secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


