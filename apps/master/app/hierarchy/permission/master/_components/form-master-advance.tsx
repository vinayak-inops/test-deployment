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
  createDefaultMasterAdvanceData,
  createMasterAdvanceSchema,
  masterAdvanceModuleKeys,
  type CrudPermission,
  type MasterAdvanceEntry,
  type MasterAdvanceModuleKey,
  type MasterAdvancePayload,
  type MasterAdvanceRecord,
} from "./master-advance-schema"

interface MasterAdvanceFormProps {
  initialData?: MasterAdvancePayload
  onSave?: (data: MasterAdvancePayload) => void
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

type MasterAdvanceFormStructure = {
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

const MASTER_ADVANCE_SCREENS: { key: MasterAdvanceModuleKey; label: string }[] = [
  { key: "employeeCategorySetting", label: "Employee Category Setting" },
  { key: "workOrderCompletion", label: "Work Order Completion" },
  { key: "mailGroupAssociation", label: "Mail Group Association" },
  { key: "mailGroupAssociationHris", label: "Mail Group Association HRIS" },
  { key: "emailTemplates", label: "Email Templates" },
  { key: "apiIntegrationConfig", label: "API Integration Config" },
  { key: "reportTask", label: "Report Task" },
  { key: "continuousDaysBlocking", label: "Continuous Days Blocking" },
  { key: "schedulerConfigurationsHris", label: "Scheduler Configurations HRIS" },
  { key: "schedulerConfigurations", label: "Scheduler Configurations" },
  { key: "Notification", label: "Notification" },
]

type MasterAdvanceState = Record<MasterAdvanceModuleKey, CrudPermission>
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

const normalizeMasterAdvanceFormStructure = (raw: unknown): MasterAdvanceFormStructure => {
  const root = getObjectValue(raw)
  if (!root) return {}

  const candidate =
    pickFirstObject(
      root.masterAdvance,
      root.setting,
      root.advance,
      getObjectValue(root.master)?.advance,
      getObjectValue(root.master)?.setting,
    ) || root

  return candidate as MasterAdvanceFormStructure
}

export default function MasterAdvanceForm({
  initialData,
  onSave,
  mode = "add",
}: MasterAdvanceFormProps) {
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
    () => normalizeMasterAdvanceFormStructure(formStructure),
    [formStructure],
  )
  const moduleConfigs = resolvedFormStructure.fields || resolvedFormStructure.modules || {}
  const getModuleConfig = (key: MasterAdvanceModuleKey) => moduleConfigs[key] || EMPTY_PERMISSION_CONFIG
  const hasModuleConfig = (key: MasterAdvanceModuleKey) => Boolean(moduleConfigs[key])
  const getModuleLabel = (key: MasterAdvanceModuleKey, fallback: string) =>
    getModuleConfig(key).label || fallback
  const isModuleVisible = (key: MasterAdvanceModuleKey) =>
    hasModuleConfig(key) && getModuleConfig(key).visible === true
  const getPermissionConfigs = (sectionConfig: PermissionSectionConfig | undefined) =>
    sectionConfig?.fields?.permissions?.fields || sectionConfig?.permissions || {}
  const isPermissionVisible = (sectionConfig: PermissionSectionConfig | undefined, field: CrudField) =>
    field in getPermissionConfigs(sectionConfig)
  const visibleScreens = MASTER_ADVANCE_SCREENS.filter(({ key }) => isModuleVisible(key))
  const visibleCrudFields = CRUD_FIELDS.filter((field) =>
    visibleScreens.some(({ key }) => isPermissionVisible(getModuleConfig(key), field)),
  )
  const showModulePermissions = visibleScreens.length > 0
  const shouldShowConfigLoader = formStructureLoading && !formStructure
  const { post: postMasterAdvance, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: () => {
      toast.success("Master advance permissions saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving master advance permissions:", error)
      toast.error("Failed to save master advance permissions!")
    },
  })

  const isReadOnly = mode === "view" || (!editMode && !addMode)

  const normalizeRecordId = (value: unknown): string | null => {
    if (!value) return null
    if (typeof value === "string") return value
    if (typeof value === "object" && value !== null && "$oid" in value) {
      return String((value as { $oid: string }).$oid)
    }
    return String(value)
  }

  const [fetchedAdvance, setFetchedAdvance] = useState<MasterAdvancePayload | null>(null)
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(null)

  const { refetch: refetchMasterAdvance } = useRequest<any>({
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
        setFetchedAdvance(null)
        setFetchedRecordId(null)
        return
      }

      setFetchedRecordId(normalizeRecordId(raw?._id))
      if (raw?.setting && typeof raw.setting === "object") {
        const rawModules = raw.setting?.modules ?? raw.setting
        const modules = masterAdvanceModuleKeys.reduce((acc, key) => {
          const p = rawModules?.[key]?.permissions || {}
          acc[key] = {
            isActive: !!(p.view || p.edit || p.add || p.delete),
            permissions: {
              view: !!p.view,
              edit: !!p.edit,
              add: !!p.add,
              delete: !!p.delete,
            },
          }
          return acc
        }, {} as Record<MasterAdvanceModuleKey, MasterAdvanceEntry>)
        const isActive = Object.values(modules).some((entry) => entry.isActive)
        setFetchedAdvance({
          setting: {
            isActive,
            ...modules,
          },
          isActive,
        })
        return
      }

      const masterScreens = raw?.screenPermissions?.find((sp: any) => sp?.serviceName === "master")?.screens ?? []
      if (Array.isArray(masterScreens)) {
        const modules = masterAdvanceModuleKeys.reduce((acc, key) => {
          const screen = masterScreens.find(
            (s: any) => (s?.screenName === key || (key === "Notification" && s?.screenName === "notification")) && s?.permissions,
          )
          const p = screen?.permissions || {}
          acc[key] = {
            isActive: !!(p.view || p.edit || p.add || p.delete),
            permissions: {
              view: !!p.view,
              edit: !!p.edit,
              add: !!p.add,
              delete: !!p.delete,
            },
          }
          return acc
        }, {} as Record<MasterAdvanceModuleKey, MasterAdvanceEntry>)
        const isActive = Object.values(modules).some((entry) => entry.isActive)
        setFetchedAdvance({
          setting: {
            isActive,
            ...modules,
          },
          isActive,
        })
        return
      }

      setFetchedAdvance(null)
    },
    onError: (error) => {
      console.error("Error fetching master advance permissions:", error)
    },
  })

  const sourceAdvance = useMemo(() => {
    if (fetchedAdvance) return fetchedAdvance
    if (initialData) return initialData
    return null
  }, [fetchedAdvance, initialData])

  const buildInitialState = (advanceData?: MasterAdvancePayload | null): MasterAdvanceState => {
    const defaults = createDefaultMasterAdvanceData().setting
    const base = masterAdvanceModuleKeys.reduce((acc, key) => {
      acc[key] = { ...defaults[key].permissions }
      return acc
    }, {} as MasterAdvanceState)

    if (!advanceData?.setting) return base
    masterAdvanceModuleKeys.forEach((key) => {
      const entry = advanceData.setting[key]
      if (!entry?.permissions) return
      base[key] = {
        ...base[key],
        ...entry.permissions,
      }
    })
    return base
  }

  const [state, setState] = useState<MasterAdvanceState>(() => buildInitialState(sourceAdvance))
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setState(buildInitialState(sourceAdvance))
  }, [sourceAdvance])

  const handleCrudToggle = (key: keyof MasterAdvanceState, field: keyof CrudPermission, value: boolean) => {
    setState((prev) => {
      const currentScreen = (prev[key] as CrudPermission) || { view: false, edit: false, add: false, delete: false }
      
      // If view is being set to false, automatically set all other permissions to false
      if (field === "view" && value === false) {
        return {
          ...prev,
          [key]: {
            view: false,
            edit: false,
            add: false,
            delete: false,
          },
        }
      }
      
      // If edit/add/delete is being set to true, automatically set view to true
      if ((field === "edit" || field === "add" || field === "delete") && value === true) {
        return {
          ...prev,
          [key]: {
            ...currentScreen,
            view: true,
            [field]: true,
          },
        }
      }
      
      // Normal toggle behavior for other cases
      return {
        ...prev,
        [key]: {
          ...currentScreen,
          [field]: value,
        },
      }
    })
  }

  const handleSave = async () => {
    const modules = masterAdvanceModuleKeys.reduce((acc, key) => {
      const permission = state[key]
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
    }, {} as Record<MasterAdvanceModuleKey, { isActive: boolean; permissions: CrudPermission }>)

    const isActive = Object.values(modules).some((entry) => entry.isActive)
    const resolvedRecordId = fetchedRecordId || null
    const isEditMode = Boolean(resolvedRecordId)

    const schema = createMasterAdvanceSchema()
    const validated = schema.safeParse({
      setting: {
        isActive,
        ...modules,
      },
      isActive,
    })

    if (!validated.success) {
      toast.error("Invalid master advance payload")
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
        setting: validated.data.setting,
        isActive: validated.data.isActive,
      },
    }

    await postMasterAdvance(requestPayload)
    await refetchMasterAdvance?.()
    await onSave?.(validated.data)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={postLoading}
        title={resolvedFormStructure.confirmTitle || "Confirm Master Advance Change"}
        description={
          resolvedFormStructure.confirmDescription ||
          "You are updating master advance permissions. This can impact user access."
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
              {resolvedFormStructure.label || resolvedFormStructure.subtitle || "Advance"}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
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
                      const p = state[key] as CrudPermission
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
                                    onChange={(e) => handleCrudToggle(key, field, e.target.checked)}
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
                onSecondary={() => setState(buildInitialState(sourceAdvance))}
                primaryLabel="Save Master Advance"
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


