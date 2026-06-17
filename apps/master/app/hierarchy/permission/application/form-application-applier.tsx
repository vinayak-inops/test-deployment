"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { Shield } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import RolePermissionConfirmModal from "../_components/role-permission-confirm-modal"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useSearchParams } from "next/navigation"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { toast } from "react-toastify"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import {
  applicationApplierKeys,
  createApplicationApplierSchema,
  createDefaultApplicationApplierData,
  type ApplicationApplierKey,
  type ApplicationApplierPayload,
  type ApplicationApplierRecord,
  type ApplicationPermission,
} from "./application-applier-schema"

interface ApplicationApplierFormProps {
  initialData?: ApplicationApplierPayload
  onSave?: (data: ApplicationApplierPayload) => void
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

type ApplicationApplierFormStructure = {
  label?: string
  visible?: boolean
  title?: string
  subtitle?: string
  description?: string
  confirmTitle?: string
  confirmDescription?: string
  confirmBody?: string
  fields?: Record<string, PermissionSectionConfig>
  modules?: Record<string, PermissionSectionConfig>
}

const APPLICATION_MODULES: { key: ApplicationApplierKey; label: string }[] = [
  { key: "punch", label: "Punch" },
  { key: "editPunchApplication", label: "Edit Punch Application" },
  { key: "outDuty", label: "Out Duty" },
  { key: "leave", label: "Leave" },
  { key: "shiftChange", label: "Shift Change" },
  { key: "overtime", label: "Overtime" },
  { key: "encashment", label: "Encashment" },
  { key: "compOff", label: "Comp Off" },
  { key: "specialLeave", label: "Special Leave" },
  { key: "wfh", label: "WFH" },
]

type PermissionState = Record<ApplicationApplierKey, ApplicationPermission>
type ActionField = keyof ApplicationPermission

const ACTION_FIELDS: ActionField[] = ["self", "all", "approve", "reject", "cancel"]
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

const normalizeApplicationApplierFormStructure = (raw: unknown): ApplicationApplierFormStructure => {
  const root = getObjectValue(raw)
  if (!root) return {}

  const candidate =
    pickFirstObject(
      root.applicationApplier,
      root.applier,
      getObjectValue(root.application)?.applier,
      getObjectValue(root.application)?.applicationApplier,
    ) || root

  return candidate as ApplicationApplierFormStructure
}

export default function ApplicationApplierForm({
  initialData,
  onSave,
  mode = "add",
}: ApplicationApplierFormProps) {
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
  const isReadOnly = mode === "view" || (!editMode && !addMode)
  const resolvedFormStructure = useMemo(
    () => normalizeApplicationApplierFormStructure(formStructure),
    [formStructure],
  )
  const moduleConfigs = resolvedFormStructure.fields || resolvedFormStructure.modules || {}
  const getModuleConfig = (key: ApplicationApplierKey) => moduleConfigs[key] || EMPTY_PERMISSION_CONFIG
  const hasModuleConfig = (key: ApplicationApplierKey) => Boolean(moduleConfigs[key])
  const getModuleLabel = (key: ApplicationApplierKey, fallback: string) =>
    getModuleConfig(key).label || fallback
  const isModuleVisible = (key: ApplicationApplierKey) =>
    hasModuleConfig(key) && getModuleConfig(key).visible === true
  const getPermissionConfigs = (sectionConfig: PermissionSectionConfig | undefined) =>
    sectionConfig?.fields?.permissions?.fields || sectionConfig?.permissions || {}
  const isPermissionVisible = (sectionConfig: PermissionSectionConfig | undefined, field: ActionField) =>
    field in getPermissionConfigs(sectionConfig)
  const visibleModules = APPLICATION_MODULES.filter(({ key }) => isModuleVisible(key))
  const visibleActionFields = ACTION_FIELDS.filter((field) =>
    visibleModules.some(({ key }) => isPermissionVisible(getModuleConfig(key), field)),
  )
  const showModulePermissions = visibleModules.length > 0
  const shouldShowConfigLoader = formStructureLoading && !formStructure

  const { post: postApplicationApplier, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: () => {
      toast.success("Application applier permissions saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving application applier permissions:", error)
      toast.error("Failed to save application applier permissions!")
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

  const [fetchedApplier, setFetchedApplier] = useState<ApplicationApplierRecord | null>(null)
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(null)

  const { refetch: refetchApplicationApplier } = useRequest<any>({
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
        setFetchedApplier(null)
        setFetchedRecordId(null)
        return
      }

      setFetchedRecordId(normalizeRecordId(raw?._id))
      if (raw?.applicationApplier && typeof raw.applicationApplier === "object") {
        setFetchedApplier(raw.applicationApplier as ApplicationApplierRecord)
        return
      }
      setFetchedApplier(null)
    },
    onError: (error) => {
      console.error("Error fetching application applier permissions:", error)
    },
  })

  const sourceApplier = useMemo(() => {
    if (fetchedApplier) return fetchedApplier
    if (initialData?.applicationApplier) return initialData.applicationApplier
    return null
  }, [fetchedApplier, initialData?.applicationApplier])

  const buildInitialState = (applierData?: ApplicationApplierRecord | null): PermissionState => {
    const defaults = createDefaultApplicationApplierData().applicationApplier
    const base = applicationApplierKeys.reduce((acc, key) => {
      acc[key] = { ...defaults[key].permissions }
      return acc
    }, {} as PermissionState)

    if (!applierData) return base
    applicationApplierKeys.forEach((key) => {
      const entry = applierData[key]
      if (!entry?.permissions) return
      base[key] = {
        ...base[key],
        ...entry.permissions,
      }
    })
    return base
  }

  const [permissions, setPermissions] = useState<PermissionState>(() => buildInitialState(sourceApplier))
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setPermissions(buildInitialState(sourceApplier))
  }, [sourceApplier])

  const handleToggle = (moduleKey: ApplicationApplierKey, field: keyof ApplicationPermission, value: boolean) => {
    setPermissions((prev) => {
      const nextModule = {
        ...prev[moduleKey],
        [field]: value,
      }

      // Keep self/all mutually exclusive per module
      if (field === "self" && value) {
        nextModule.all = false
      } else if (field === "all" && value) {
        nextModule.self = false
      }

      return {
        ...prev,
        [moduleKey]: nextModule,
      }
    })
  }

  const handleSave = async () => {
    const applicationApplier = applicationApplierKeys.reduce((acc, key) => {
      const permission = permissions[key]
      const isActive = !!(
        permission.cancel ||
        permission.reject ||
        permission.approve ||
        permission.self ||
        permission.all
      )

      acc[key] = {
        permissions: {
          cancel: !!permission.cancel,
          reject: !!permission.reject,
          approve: !!permission.approve,
          self: !!permission.self,
          all: !!permission.all,
        },
        isActive,
      }
      return acc
    }, { isActive: false } as ApplicationApplierRecord)

    applicationApplier.isActive = applicationApplierKeys.some((key) => {
      const entry = applicationApplier[key]
      if (!entry?.permissions) return false
      return Object.values(entry.permissions).some(Boolean)
    })

    const resolvedRecordId = fetchedRecordId || null
    const isEditMode = Boolean(resolvedRecordId)
    const schema = createApplicationApplierSchema()
    const validated = schema.safeParse({
      ...(resolvedRecordId ? { _id: resolvedRecordId } : {}),
      applicationApplier,
    })

    if (!validated.success) {
      toast.error("Invalid application applier payload")
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
        applicationApplier,
      },
    }

    await postApplicationApplier(requestPayload)
    await refetchApplicationApplier?.()
    await onSave?.(validated.data)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={postLoading}
        title={resolvedFormStructure.confirmTitle || "Confirm Application Applier Change"}
        description={
          resolvedFormStructure.confirmDescription ||
          "You are updating application applier permissions. This can impact user actions and approvals."
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
        <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {resolvedFormStructure.label || "Application Applier"}
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {resolvedFormStructure.description ||
                resolvedFormStructure.subtitle ||
                "Configure apply and action permissions for all application modules"}
            </p>
          </div>
        </div>

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
                    <div className="flex items-center justify-end gap-6 min-w-[290px] text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      {visibleActionFields.map((field) => (
                        <span key={field} className="w-12 text-center">
                          {field === "self"
                            ? "Self"
                            : field === "all"
                              ? "All"
                              : field[0].toUpperCase() + field.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {visibleModules.map(({ key, label }) => {
                      const p = permissions[key]
                      const moduleConfig = getModuleConfig(key)
                      return (
                        <div key={key} className="flex items-center justify-between py-3">
                          <Label className="text-sm font-normal text-gray-900">
                            {getModuleLabel(key, label)}
                          </Label>
                          <div className="flex items-center justify-end gap-6 min-w-[290px]">
                            {visibleActionFields.map((field) =>
                              isPermissionVisible(moduleConfig, field) ? (
                                <div key={field} className="w-12 flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={!!p?.[field]}
                                    onChange={(e) => handleToggle(key, field, e.target.checked)}
                                    disabled={isReadOnly}
                                    className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
                                  />
                                </div>
                              ) : (
                                <div key={field} className="w-12" />
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
                onSecondary={() => setPermissions(buildInitialState(sourceApplier))}
                primaryLabel="Save Application Applier"
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
