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
  createDefaultMasterEmployeeData,
  createMasterEmployeeSchema,
  masterEmployeeModuleKeys,
  type CrudPermission,
  type MasterEmployeeManagement,
  type MasterEmployeeModuleKey,
  type MasterEmployeePayload,
} from "./master-employee-schema"
type ManualComputationPermission = {
  view: boolean
  apply: boolean
}

type PermissionVisibilityConfig = {
  label?: string
  visible?: boolean
}

type PermissionSectionConfig = {
  label?: string
  visible?: boolean
  description?: string
  rowLabel?: string
  fields?: Record<string, PermissionVisibilityConfig>
  permissions?: Record<string, PermissionVisibilityConfig>
  sections?: {
    permissions?: {
      fields?: Record<string, PermissionVisibilityConfig>
    }
  }
  config?: {
    permissions?: {
      fields?: Record<string, PermissionVisibilityConfig>
    }
  }
}

type MasterEmployeeFormStructure = {
  label?: string
  visible?: boolean
  title?: string
  subtitle?: string
  confirmTitle?: string
  confirmDescription?: string
  confirmBody?: string
  manualComputation?: PermissionSectionConfig
  fields?: Record<string, PermissionSectionConfig>
  modules?: Record<string, PermissionSectionConfig>
}

interface MasterEmployeeFormProps {
  initialData?: MasterEmployeePayload
  onSave?: (data: MasterEmployeePayload) => void
  mode?: "add" | "edit" | "view"
}

const MASTER_EMPLOYEE_SCREENS: {
  key: MasterEmployeeModuleKey
  label: string
}[] = [
  { key: "securityPass", label: "Security Pass" },
  { key: "employeeShift", label: "Employee Shift" },
  { key: "weekOffChanges", label: "Week Off Changes" },
  { key: "bestEmployeeNomination", label: "Best Employee Nomination" },
  { key: "employeeBalance", label: "Employee Balance" },
  { key: "employeeCategoryTrainingDetails", label: "Employee Category Training Details" },
  { key: "employeeTrainingCompletion", label: "Employee Training Completion" },
]

type MasterPermissionState = Record<MasterEmployeeModuleKey, CrudPermission>
type CrudField = keyof CrudPermission

const CRUD_FIELDS: CrudField[] = ["view", "edit", "add", "delete"]
const MANUAL_FIELDS: (keyof ManualComputationPermission)[] = ["view", "apply"]
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

const normalizeMasterEmployeeFormStructure = (raw: unknown): MasterEmployeeFormStructure => {
  const root = getObjectValue(raw)
  if (!root) return {}

  const candidate =
    pickFirstObject(
      root.masterEmployee,
      root.employeeManagement,
      root.employee,
      getObjectValue(root.master)?.employee,
      getObjectValue(root.master)?.employeeManagement,
    ) || root

  return candidate as MasterEmployeeFormStructure
}

export default function MasterEmployeeForm({
  initialData,
  onSave,
  mode = "add",
}: MasterEmployeeFormProps) {
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
    () => normalizeMasterEmployeeFormStructure(formStructure),
    [formStructure],
  )
  const moduleConfigs = resolvedFormStructure.fields || resolvedFormStructure.modules || {}
  const manualComputationConfig = resolvedFormStructure.manualComputation || EMPTY_PERMISSION_CONFIG

  const getModuleConfig = (key: MasterEmployeeModuleKey) => moduleConfigs[key] || EMPTY_PERMISSION_CONFIG
  const hasModuleConfig = (key: MasterEmployeeModuleKey) => Boolean(moduleConfigs[key])
  const getModuleLabel = (key: MasterEmployeeModuleKey, fallback: string) =>
    getModuleConfig(key).label || fallback
  const isModuleVisible = (key: MasterEmployeeModuleKey) =>
    hasModuleConfig(key) && getModuleConfig(key).visible === true

  const getPermissionConfig = (
    sectionConfig: PermissionSectionConfig | undefined,
    field: string,
  ): PermissionVisibilityConfig =>
    sectionConfig?.sections?.permissions?.fields?.[field] ||
    sectionConfig?.config?.permissions?.fields?.[field] ||
    sectionConfig?.permissions?.[field] ||
    sectionConfig?.fields?.[field] ||
    {}

  const getPermissionLabel = (
    sectionConfig: PermissionSectionConfig | undefined,
    field: string,
    fallback: string,
  ) => getPermissionConfig(sectionConfig, field).label || fallback

  const isPermissionVisible = (sectionConfig: PermissionSectionConfig | undefined, field: string) =>
    field in {
      ...(sectionConfig?.sections?.permissions?.fields || {}),
      ...(sectionConfig?.config?.permissions?.fields || {}),
      ...(sectionConfig?.permissions || {}),
      ...(sectionConfig?.fields || {}),
    }

  const visibleScreens = MASTER_EMPLOYEE_SCREENS.filter(({ key }) => isModuleVisible(key))
  const visibleCrudFields = CRUD_FIELDS.filter((field) =>
    visibleScreens.some(({ key }) => isPermissionVisible(getModuleConfig(key), field)),
  )
  const visibleManualFields = MANUAL_FIELDS.filter((field) =>
    isPermissionVisible(manualComputationConfig, field),
  )
  const showManualComputation =
    Boolean(resolvedFormStructure.manualComputation) &&
    manualComputationConfig.visible === true &&
    visibleManualFields.length > 0
  const showModulePermissions = visibleScreens.length > 0
  const shouldShowConfigLoader = formStructureLoading && !formStructure

  const { post: postMasterEmployee, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: () => {
      toast.success("Employee permissions saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving employee permissions:", error)
      toast.error("Failed to save employee permissions!")
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

  const [fetchedEmployee, setFetchedEmployee] = useState<MasterEmployeeManagement | null>(null)
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(null)

  const { refetch: refetchMasterEmployee } = useRequest<any>({
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
        setFetchedEmployee(null)
        setFetchedRecordId(null)
        return
      }

      setFetchedRecordId(normalizeRecordId(raw?._id))
      if (raw?.employeeManagement && typeof raw.employeeManagement === "object") {
        setFetchedEmployee(raw.employeeManagement as MasterEmployeeManagement)
        return
      }
      setFetchedEmployee(null)
    },
    onError: (error) => {
      console.error("Error fetching employee permissions:", error)
    },
  })

  const sourceEmployee = useMemo(() => {
    if (fetchedEmployee) return fetchedEmployee
    if (initialData?.employeeManagement) return initialData.employeeManagement
    return null
  }, [fetchedEmployee, initialData?.employeeManagement])

  const buildInitialState = (employeeData?: MasterEmployeeManagement | null): MasterPermissionState => {
    const defaults = createDefaultMasterEmployeeData().employeeManagement
    const base = masterEmployeeModuleKeys.reduce((acc, key) => {
      acc[key] = { ...defaults[key].permissions }
      return acc
    }, {} as MasterPermissionState)

    if (employeeData) {
      masterEmployeeModuleKeys.forEach((key) => {
        const entry = employeeData[key]
        if (!entry?.permissions) return
        base[key] = {
          ...base[key],
          ...entry.permissions,
        }
      })
    }

    return base
  }

  const getInitialManualComputation = (
    employeeData?: MasterEmployeeManagement | null,
  ): ManualComputationPermission => {
    return {
      view: !!employeeData?.manualComputation?.permissions?.view,
      apply: !!employeeData?.manualComputation?.permissions?.apply,
    }
  }

  const [permissions, setPermissions] = useState<MasterPermissionState>(() => buildInitialState(sourceEmployee))
  const [manualComputation, setManualComputation] = useState<ManualComputationPermission>(() =>
    getInitialManualComputation(sourceEmployee),
  )
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setPermissions(buildInitialState(sourceEmployee))
    setManualComputation(getInitialManualComputation(sourceEmployee))
  }, [sourceEmployee])

  const handleToggle = (screenKey: MasterEmployeeModuleKey, field: keyof CrudPermission, value: boolean) => {
    setPermissions((prev) => {
      const currentScreen = prev[screenKey] || { view: false, edit: false, add: false, delete: false }

      if (field === "view" && value === false) {
        return {
          ...prev,
          [screenKey]: {
            view: false,
            edit: false,
            add: false,
            delete: false,
          },
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

  const handleManualComputationToggle = (field: keyof ManualComputationPermission, value: boolean) => {
    setManualComputation((prev) => {
      if (field === "view" && value === false) {
        return { view: false, apply: false }
      }
      if (field === "apply" && value === true) {
        return { ...prev, view: true, apply: true }
      }
      return { ...prev, [field]: value }
    })
  }

  const handleSave = async () => {
    const modules = masterEmployeeModuleKeys.reduce((acc, key) => {
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
    }, {} as Record<MasterEmployeeModuleKey, { isActive: boolean; permissions: CrudPermission }>)

    const employeeManagement: MasterEmployeeManagement = {
      isActive: false,
      ...modules,
      manualComputation: {
        isActive: !!(manualComputation.view || manualComputation.apply),
        permissions: {
          view: !!manualComputation.view,
          apply: !!manualComputation.apply,
        },
      },
    }

    const isActive =
      !!(manualComputation.view || manualComputation.apply) ||
      Object.values(modules).some((entry) => entry.isActive)
    employeeManagement.isActive = isActive
    const resolvedRecordId = fetchedRecordId || null
    const isEditMode = Boolean(resolvedRecordId)

    const schema = createMasterEmployeeSchema()
    const validated = schema.safeParse({
      employeeManagement,
      isActive,
    })

    if (!validated.success) {
      toast.error("Invalid employee management payload")
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
        employeeManagement,
        isActive,
      },
    }

    await postMasterEmployee(requestPayload)
    await refetchMasterEmployee?.()
    await onSave?.(validated.data)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={postLoading}
        title={resolvedFormStructure.confirmTitle || "Confirm Master Employee Change"}
        description={
          resolvedFormStructure.confirmDescription ||
          "You are updating master employee permissions. This can impact user access."
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
            <h2 className="text-sm font-semibold text-gray-900">Master</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {resolvedFormStructure.label || resolvedFormStructure.subtitle || "Employee"}
            </p>
          </div>
        </div>

        <div className="px-6 py-4">
          {shouldShowConfigLoader ? (
            <div className="py-10 text-center text-sm text-gray-600">Loading form configuration...</div>
          ) : (
            <>
              {showManualComputation && (
                <div className="group relative p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {manualComputationConfig.label || "Manual Computation"}
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      {resolvedFormStructure.title || "Module"}
                    </span>
                    <div className="flex items-center justify-end gap-6 min-w-[120px] text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      {visibleManualFields.map((field) => (
                        <span key={field} className="w-10 text-center">
                          {getPermissionLabel(
                            manualComputationConfig,
                            field,
                            field === "apply" ? "Apply" : "View",
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3">
                    <Label className="text-sm font-normal text-gray-900">
                      {manualComputationConfig.rowLabel || "Allow manual computation for all applicable employees"}
                    </Label>
                    <div className="flex items-center justify-end gap-6 min-w-[120px]">
                      {visibleManualFields.map((field) => (
                        <div key={field} className="w-10 flex justify-center">
                          <input
                            type="checkbox"
                            checked={!!manualComputation?.[field]}
                            onChange={(e) => handleManualComputationToggle(field, e.target.checked)}
                            disabled={isReadOnly}
                            className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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

          {!isReadOnly && onSave && (
            <div className="flex justify-end mt-4">
              <ActionButtons
                layout="end"
                gap="gap-3"
                secondaryLabel="Reset"
                onSecondary={() => {
                  setPermissions(buildInitialState(sourceEmployee))
                  setManualComputation(getInitialManualComputation(sourceEmployee))
                }}
                primaryLabel="Save Employee"
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
