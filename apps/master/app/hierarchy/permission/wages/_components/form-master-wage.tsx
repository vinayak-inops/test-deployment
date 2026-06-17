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
  createWagePermissionSchema,
  type WagePermissionPayload,
} from "./wage-permission-schema"

type CrudPermission = {
  view: boolean
  edit: boolean
  add: boolean
  delete: boolean
}

type ApplicationPermission = {
  view: boolean
  apply: boolean
}

interface MasterWageFormProps {
  initialData?: WagePermissionPayload
  onSave?: (data: WagePermissionPayload) => void
  mode?: "add" | "edit" | "view"
}

type PermissionVisibilityConfig = {
  visible?: boolean
}

type PermissionSectionConfig = {
  label?: string
  visible?: boolean
  rowLabel?: string
  permissions?: Record<string, PermissionVisibilityConfig>
  fields?: {
    permissions?: {
      fields?: Record<string, PermissionVisibilityConfig>
    }
  }
}

type MasterWageFormStructure = {
  label?: string
  visible?: boolean
  title?: string
  subtitle?: string
  confirmTitle?: string
  confirmDescription?: string
  confirmBody?: string
  fields?: Record<string, PermissionSectionConfig>
  modules?: Record<string, PermissionSectionConfig>
  wageCalculationApplication?: PermissionSectionConfig
}

const WAGE_SCREENS = [
  { key: "wageMinimumWages", label: "Minimum Wages", defaults: { view: false, edit: false, add: false, delete: false } },
  { key: "wageProfessionalTax", label: "Professional Tax", defaults: { view: false, edit: false, add: false, delete: false } },
  { key: "wageSalaryHeads", label: "Salary Heads", defaults: { view: false, edit: false, add: false, delete: false } },
  { key: "wageSalaryTemplates", label: "Salary Templates", defaults: { view: false, edit: false, add: false, delete: false } },
  { key: "employeeAdvances", label: "Employee Advances", defaults: { view: false, edit: false, add: false, delete: false } },
  { key: "employeePenalties", label: "Employee Penalties", defaults: { view: false, edit: false, add: false, delete: false } },
  { key: "wageEmployerContributions", label: "Employer Contributions", defaults: { view: false, edit: false, add: false, delete: false } },
  { key: "employeeWageTemplate", label: "Employee Wage Template", defaults: { view: false, edit: false, add: false, delete: false } },
]

type WageKey = (typeof WAGE_SCREENS)[number]["key"]

type MasterPermissionState = Record<string, CrudPermission | ApplicationPermission>
type CrudField = keyof CrudPermission
type AppField = keyof ApplicationPermission

const CRUD_FIELDS: CrudField[] = ["view", "edit", "add", "delete"]
const APP_FIELDS: AppField[] = ["view", "apply"]
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

const normalizeMasterWageFormStructure = (raw: unknown): MasterWageFormStructure => {
  const root = getObjectValue(raw)
  if (!root) return {}

  const candidate =
    pickFirstObject(
      root.masterWage,
      root.wage,
      getObjectValue(root.master)?.wage,
    ) || root

  return candidate as MasterWageFormStructure
}

export default function MasterWageForm({
  initialData,
  onSave,
  mode = "add",
}: MasterWageFormProps) {
  const searchParams = useSearchParams()
  const modeView = searchParams.get("mode")
  const tenantCode = useGetTenantCode()
  const entitlementCode = searchParams.get("entitlementCode") || undefined
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
    () => normalizeMasterWageFormStructure(formStructure),
    [formStructure],
  )
  const moduleConfigs = resolvedFormStructure.fields || resolvedFormStructure.modules || {}
  const calcConfig = resolvedFormStructure.wageCalculationApplication || EMPTY_PERMISSION_CONFIG
  const getModuleConfig = (key: WageKey) => moduleConfigs[key] || EMPTY_PERMISSION_CONFIG
  const hasModuleConfig = (key: WageKey) => Boolean(moduleConfigs[key])
  const getModuleLabel = (key: WageKey, fallback: string) =>
    getModuleConfig(key).label || fallback
  const isModuleVisible = (key: WageKey) =>
    hasModuleConfig(key) && getModuleConfig(key).visible === true
  const getPermissionConfigs = (sectionConfig: PermissionSectionConfig | undefined) =>
    sectionConfig?.fields?.permissions?.fields || sectionConfig?.permissions || {}
  const isCrudPermissionVisible = (sectionConfig: PermissionSectionConfig | undefined, field: CrudField) =>
    field in getPermissionConfigs(sectionConfig)
  const isAppPermissionVisible = (sectionConfig: PermissionSectionConfig | undefined, field: AppField) =>
    field in getPermissionConfigs(sectionConfig)
  const visibleWageScreens = WAGE_SCREENS.filter(({ key }) => isModuleVisible(key))
  const visibleCrudFields = CRUD_FIELDS.filter((field) =>
    visibleWageScreens.some(({ key }) => isCrudPermissionVisible(getModuleConfig(key), field)),
  )
  const visibleCalcFields = APP_FIELDS.filter((field) => isAppPermissionVisible(calcConfig, field))
  const showCrudPermissions = visibleWageScreens.length > 0
  const showCalcSection =
    Boolean(resolvedFormStructure.wageCalculationApplication) &&
    calcConfig.visible === true &&
    visibleCalcFields.length > 0
  const shouldShowConfigLoader = formStructureLoading && !formStructure

  const isReadOnly = mode === "view" || (!editMode && !addMode)

  const { post: postWagePermissions, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: () => {
      toast.success("Wage permissions saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving wage permissions:", error)
      toast.error("Failed to save wage permissions!")
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

  const [fetchedPayload, setFetchedPayload] = useState<WagePermissionPayload | null>(null)
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const { refetch: refetchWage } = useRequest<any>({
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

      if (raw?.wage && typeof raw.wage === "object") {
        setFetchedPayload(raw as WagePermissionPayload)
        return
      }

      const wagePayload = raw?.setting?.wage || null
      if (wagePayload && typeof wagePayload === "object") {
        setFetchedPayload({ wage: wagePayload })
        return
      }

      setFetchedPayload(null)
    },
    onError: (error) => {
      console.error("Error fetching wage permissions:", error)
    },
  })

  const buildInitialState = (
    data?: WagePermissionPayload  | null
  ): MasterPermissionState => {
    const base: MasterPermissionState = {}
    // Initialize all screens to false (don't use defaults from WAGE_SCREENS)
    WAGE_SCREENS.forEach(({ key }) => {
      base[key] = { view: false, edit: false, add: false, delete: false }
    })

    // Initialize wageCalculationApplication with view/apply permissions
    base["wageCalculationApplication"] = { view: false, apply: false }

    if (!data) return base

    if ("wage" in data && data.wage) {
      const wage = data.wage
      const wageModules = wage as unknown as Partial<Record<WageKey, { permissions?: Partial<CrudPermission> }>>
      WAGE_SCREENS.forEach(({ key }) => {
        const entry = wageModules[key]
        if (!entry?.permissions) return
        base[key] = {
          view: !!entry.permissions.view,
          edit: !!entry.permissions.edit,
          add: !!entry.permissions.add,
          delete: !!entry.permissions.delete,
        }
      })

      const wageCalc = wage?.wageCalculationApplication as
        | { permissions?: Partial<ApplicationPermission> }
        | undefined
      if (wageCalc?.permissions) {
        base["wageCalculationApplication"] = {
          view: !!wageCalc.permissions.view,
          apply: !!wageCalc.permissions.apply,
        }
      }

      return base
    }

    return base
  }

  const sourceData = useMemo(() => {
    if (fetchedPayload) return fetchedPayload
    return null
  }, [fetchedPayload])

  const [permissions, setPermissions] = useState<MasterPermissionState>(() =>
    buildInitialState(sourceData)
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPermissions(buildInitialState(sourceData))
  }, [sourceData])

  const handleToggle = (screenKey: string, field: string, value: boolean) => {
    setPermissions((prev) => {
      const currentScreen = prev[screenKey]
      
      // Handle CRUD permissions (for regular wage screens)
      if (screenKey !== "wageCalculationApplication") {
        const crudScreen = currentScreen as CrudPermission || { view: false, edit: false, add: false, delete: false }
        
        // If view is being set to false, automatically set all other permissions to false
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
        
        // If edit/add/delete is being set to true, automatically set view to true
        if ((field === "edit" || field === "add" || field === "delete") && value === true) {
          return {
            ...prev,
            [screenKey]: {
              ...crudScreen,
              view: true,
              [field]: true,
            },
          }
        }
        
        // Normal toggle behavior for other cases
        return {
          ...prev,
          [screenKey]: {
            ...crudScreen,
            [field]: value,
          },
        }
      }
      
      // Handle Application permissions (for wageCalculationApplication)
      if (screenKey === "wageCalculationApplication") {
        const appScreen = currentScreen as ApplicationPermission || { view: false, apply: false }
        
        // If view is being set to false, automatically set apply to false
        if (field === "view" && value === false) {
          return {
            ...prev,
            [screenKey]: {
              view: false,
              apply: false,
            },
          }
        }
        
        // If apply is being set to true, automatically set view to true
        if (field === "apply" && value === true) {
          return {
            ...prev,
            [screenKey]: {
              ...appScreen,
              view: true,
              apply: true,
            },
          }
        }
        
        // Normal toggle behavior for other cases
        return {
          ...prev,
          [screenKey]: {
            ...appScreen,
            [field]: value,
          },
        }
      }
      
      // Fallback (shouldn't reach here)
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
    setLoading(true)
    try {
      const wagePayloadModules = WAGE_SCREENS.reduce((acc, { key }) => {
        const crudPerms = permissions[key] as CrudPermission
        const isActive = !!(crudPerms?.view || crudPerms?.edit || crudPerms?.add || crudPerms?.delete)
        acc[key] = {
          isActive,
          permissions: {
            view: !!crudPerms?.view,
            edit: !!crudPerms?.edit,
            add: !!crudPerms?.add,
            delete: !!crudPerms?.delete,
          },
        }
        return acc
      }, {} as Record<WageKey, { isActive: boolean; permissions: CrudPermission }>)

      const calcPerms = permissions["wageCalculationApplication"] as ApplicationPermission
      const calcIsActive = !!(calcPerms?.view || calcPerms?.apply)

      const wageIsActive = Object.values(wagePayloadModules).some((entry) => {
        if (!entry || typeof entry !== "object") return false
        if ("permissions" in entry && entry.permissions) {
          return Object.values(entry.permissions as Record<string, boolean>).some(Boolean)
        }
        return false
      }) || !!(calcPerms?.view || calcPerms?.apply)

      const wagePayload: any = {
        ...wagePayloadModules,
        wageCalculationApplication: {
          isActive: calcIsActive,
          permissions: {
            view: !!calcPerms?.view,
            apply: !!calcPerms?.apply,
          },
        },
        isActive: wageIsActive,
      }

      const payload: WagePermissionPayload = {
        wage: wagePayload,
      }

      const schema = createWagePermissionSchema()
      const validated = schema.safeParse(payload)

      if (!validated.success) {
        toast.error("Invalid wage payload")
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

      await postWagePermissions(requestPayload)
      await refetchWage?.()
      await onSave?.(validated.data)
      setShowConfirm(false)
    } catch (error) {
      console.error("Error saving master wage permissions:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Confirmation Modal */}
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={loading || postLoading}
        title={resolvedFormStructure.confirmTitle || "Confirm Master Wage Change"}
        description={
          resolvedFormStructure.confirmDescription ||
          "You are updating wage permissions. This can impact wage calculation and approval workflows."
        }
        body={
          resolvedFormStructure.confirmBody ||
          "Please review your changes carefully. Proceed only if you are sure about this update."
        }
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleSave}
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
              {resolvedFormStructure.label || resolvedFormStructure.subtitle || "Wage"}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {shouldShowConfigLoader ? (
            <div className="py-10 text-center text-sm text-gray-600">Loading form configuration...</div>
          ) : (
            <>
              {showCrudPermissions && (
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
                    {visibleWageScreens.map(({ key, label }) => {
                      const p = permissions[key] as CrudPermission
                      const moduleConfig = getModuleConfig(key)
                      return (
                        <div key={key} className="flex items-center justify-between py-3">
                          <Label className="text-sm font-normal text-gray-900">
                            {getModuleLabel(key, label)}
                          </Label>
                          <div className="flex items-center justify-end gap-6 min-w-[220px]">
                            {visibleCrudFields.map((field) =>
                              isCrudPermissionVisible(moduleConfig, field) ? (
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

              {showCalcSection && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      {resolvedFormStructure.title || "Module"}
                    </span>
                    <div className="flex items-center justify-end gap-6 min-w-[120px] text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                      {visibleCalcFields.map((field) => (
                        <span key={field} className="w-10 text-center">
                          {field[0].toUpperCase() + field.slice(1)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <Label className="text-sm font-normal text-gray-900">
                      {calcConfig.rowLabel || calcConfig.label || "Wage Calculation Application"}
                    </Label>
                    <div className="flex items-center justify-end gap-6 min-w-[120px]">
                      {visibleCalcFields.map((field) => {
                        const appPerm = permissions["wageCalculationApplication"] as ApplicationPermission
                        return (
                          <div key={field} className="w-10 flex justify-center">
                            <input
                              type="checkbox"
                              checked={!!appPerm?.[field]}
                              onChange={(e) => handleToggle("wageCalculationApplication", field, e.target.checked)}
                              disabled={isReadOnly}
                              className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
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
                primaryLabel="Save Master Wage"
                onPrimary={() => setShowConfirm(true)}
                primaryLoading={loading || postLoading}
                primaryDisabled={loading || postLoading}
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