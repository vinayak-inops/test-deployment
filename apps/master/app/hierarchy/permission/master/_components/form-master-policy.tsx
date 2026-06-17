"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { Shield } from "lucide-react"
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
  createDefaultMasterPolicyData,
  createMasterPolicySchema,
  masterPolicyKeys,
  type CrudPermission,
  type MasterPolicyKey,
  type MasterPolicyPayload,
  type MasterPolicyRecord,
} from "./master-policy-schema"

interface MasterPolicyFormProps {
  initialData?: MasterPolicyPayload
  onSave?: (data: MasterPolicyPayload) => void
  mode?: "add" | "edit" | "view"
}

type PermissionVisibilityConfig = {
  visible?: boolean
}

type PermissionSectionConfig = {
  label?: string
  visible?: boolean
  permissions?: Record<string, PermissionVisibilityConfig>
  fields?: {
    permissions?: {
      fields?: Record<string, PermissionVisibilityConfig>
    }
  }
}

type MasterPolicyFormStructure = {
  label?: string
  visible?: boolean
  title?: string
  subtitle?: string
  confirmTitle?: string
  confirmDescription?: string
  confirmBody?: string
  fields?: Record<string, PermissionSectionConfig>
  modules?: Record<string, PermissionSectionConfig>
}

const MASTER_POLICY_SCREENS: {
  key: MasterPolicyKey
  label: string
}[] = [
  { key: "overTime", label: "Over Time" },
  { key: "holiday", label: "Holiday" },
  { key: "shiftPolicy", label: "Shift Policy" },
  { key: "leavePolicy", label: "Leave Policy" },
  { key: "shiftsLists", label: "Shifts Lists" },
  { key: "compoff", label: "Comp Off" },
  { key: "outduty", label: "Out Duty" },
  { key: "wfhPolicy", label: "WFH Policy" },
]

type MasterPermissionState = Record<MasterPolicyKey, CrudPermission>
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

const normalizeMasterPolicyFormStructure = (raw: unknown): MasterPolicyFormStructure => {
  const root = getObjectValue(raw)
  if (!root) return {}

  const candidate =
    pickFirstObject(
      root.masterPolicy,
      root.policy,
      getObjectValue(root.master)?.policy,
    ) || root

  return candidate as MasterPolicyFormStructure
}

export default function MasterPolicyForm({
  initialData,
  onSave,
  mode = "add",
}: MasterPolicyFormProps) {
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()
  const modeView = searchParams.get("mode")
  const entitlementCode = searchParams.get("entitlementCode") || undefined
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "role_permission_form_structure",
  })

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName: "rolePermissions",
  })

  const editMode = modeView !== "permissionview" ? rolePermissions?.edit : false
  const addMode = modeView !== "permissionview" ? rolePermissions?.add : false
  const resolvedFormStructure = useMemo(
    () => normalizeMasterPolicyFormStructure(formStructure),
    [formStructure],
  )
  const moduleConfigs = resolvedFormStructure.fields || resolvedFormStructure.modules || {}
  const getModuleConfig = (key: MasterPolicyKey) => moduleConfigs[key] || EMPTY_PERMISSION_CONFIG
  const hasModuleConfig = (key: MasterPolicyKey) => Boolean(moduleConfigs[key])
  const getModuleLabel = (key: MasterPolicyKey, fallback: string) =>
    getModuleConfig(key).label || fallback
  const isModuleVisible = (key: MasterPolicyKey) =>
    hasModuleConfig(key) && getModuleConfig(key).visible === true
  const getPermissionConfigs = (sectionConfig: PermissionSectionConfig | undefined) =>
    sectionConfig?.fields?.permissions?.fields || sectionConfig?.permissions || {}
  const isPermissionVisible = (sectionConfig: PermissionSectionConfig | undefined, field: CrudField) =>
    field in getPermissionConfigs(sectionConfig)
  const visibleScreens = MASTER_POLICY_SCREENS.filter(({ key }) => isModuleVisible(key))
  const visibleCrudFields = CRUD_FIELDS.filter((field) =>
    visibleScreens.some(({ key }) => isPermissionVisible(getModuleConfig(key), field)),
  )
  const showModulePermissions = visibleScreens.length > 0
  const shouldShowConfigLoader = formStructureLoading && !formStructure
  const isReadOnly = mode === "view" || (!editMode && !addMode)

  const { post: postMasterPolicy, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: () => {
      toast.success("Master policy permissions saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving master policy permissions:", error)
      toast.error("Failed to save master policy permissions!")
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

  const [fetchedPolicy, setFetchedPolicy] = useState<MasterPolicyRecord | null>(null)
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(null)

  const { refetch: refetchMasterPolicy } = useRequest<any>({
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
        setFetchedPolicy(null)
        setFetchedRecordId(null)
        return
      }

      setFetchedRecordId(normalizeRecordId(raw?._id))
      if (raw?.policy && typeof raw.policy === "object") {
        setFetchedPolicy(raw.policy as MasterPolicyRecord)
        return
      }
      setFetchedPolicy(null)
    },
    onError: (error) => {
      console.error("Error fetching master policy permissions:", error)
    },
  })

  const sourcePolicy = useMemo(() => {
    if (fetchedPolicy) return fetchedPolicy
    if (initialData?.policy) return initialData.policy
    return null
  }, [fetchedPolicy, initialData?.policy])

  const buildInitialState = (policyData?: MasterPolicyRecord | null): MasterPermissionState => {
    const defaults = createDefaultMasterPolicyData().policy
    const base = masterPolicyKeys.reduce((acc, key) => {
      acc[key] = { ...defaults[key].permissions }
      return acc
    }, {} as MasterPermissionState)

    if (!policyData) return base
    masterPolicyKeys.forEach((key) => {
      const entry = policyData[key]
      if (!entry?.permissions) return
      base[key] = {
        ...base[key],
        ...entry.permissions,
      }
    })
    return base
  }

  const [permissions, setPermissions] = useState<MasterPermissionState>(() => buildInitialState(sourcePolicy))
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setPermissions(buildInitialState(sourcePolicy))
  }, [sourcePolicy])

  const handleToggle = (screenKey: MasterPolicyKey, field: keyof CrudPermission, value: boolean) => {
    setPermissions((prev) => {
      const currentScreen = prev[screenKey] || { view: false, edit: false, add: false, delete: false }
      if (field === "view" && value === false) {
        return {
          ...prev,
          [screenKey]: { view: false, edit: false, add: false, delete: false },
        }
      }
      if ((field === "edit" || field === "add" || field === "delete") && value === true) {
        return {
          ...prev,
          [screenKey]: {
            ...currentScreen,
            view: true,
            [field]: true,
          },
        }
      }
      return {
        ...prev,
        [screenKey]: {
          ...currentScreen,
          [field]: value,
        },
      }
    })
  }

  const handleSave = async () => {
    const modules = masterPolicyKeys.reduce((acc, key) => {
      const permission = permissions[key]
      const isActive = !!(permission.view || permission.edit || permission.add || permission.delete)
      acc[key] = {
        isActive,
        permissions: {
          view: !!permission.view,
          edit: !!permission.edit,
          add: !!permission.add,
          delete: !!permission.delete,
        },
      }
      return acc
    }, {} as Record<MasterPolicyKey, { isActive: boolean; permissions: CrudPermission }>)

    const isActive = Object.values(modules).some((entry) => entry.isActive)
    const resolvedRecordId = fetchedRecordId || null
    const isEditMode = Boolean(resolvedRecordId)

    const schema = createMasterPolicySchema()
    const validated = schema.safeParse({
      ...(resolvedRecordId ? { _id: resolvedRecordId } : {}),
      policy: {
        isActive,
        ...modules,
      },
      isActive,
    })

    if (!validated.success) {
      toast.error("Invalid master policy payload")
      return
    }

    const requestPayload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedRecordId } : {}),
      collectionName: "role_permissions",
      data: {
        ...(entitlementCode ? { entitlementCode } : {}),
        tenantCode: tenantCode || "",
        policy: {
          isActive,
          ...modules,
        },
        isActive,
      },
    }

    await postMasterPolicy(requestPayload)
    await refetchMasterPolicy?.()
    await onSave?.(validated.data)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={postLoading}
        title={resolvedFormStructure.confirmTitle || "Confirm Master Policy Change"}
        description={
          resolvedFormStructure.confirmDescription ||
          "You are updating master policy permissions. This can impact user access."
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
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Master</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {resolvedFormStructure.label || resolvedFormStructure.subtitle || "Policy"}
            </p>
          </div>
        </div>

        {/* Row-style permissions: labels left, all checkboxes grouped on the right side */}
        <div className="px-6 py-4">
          {shouldShowConfigLoader ? (
            <div className="py-10 text-center text-sm text-gray-600">Loading form configuration...</div>
          ) : (
            <>
              {showModulePermissions && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      {resolvedFormStructure.title || "Module"}
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
                    {visibleScreens.map(({ key, label }) => {
                      const p = permissions[key]
                      const moduleConfig = getModuleConfig(key)
                      return (
                        <div key={key} className="flex items-center justify-between py-3">
                          <Label className="text-sm font-normal text-gray-900">
                            {getModuleLabel(key, label)}
                          </Label>
                          <div className="flex items-center justify-end gap-6 min-w-[220px]">
                            {visibleCrudFields.map((field) =>
                              isPermissionVisible(moduleConfig, field) ? (
                                <div key={field} className="w-10 flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={!!p?.[field]}
                                    onChange={(e) => handleToggle(key, field, e.target.checked)}
                                    disabled={isReadOnly}
                                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
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
                onSecondary={() => setPermissions(buildInitialState(sourcePolicy))}
                primaryLabel="Save Master Policy"
                onPrimary={() => setShowConfirm(true)}
                primaryLoading={postLoading}
                primaryDisabled={postLoading}
                className="w-full md:w-auto"
                primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
                secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


