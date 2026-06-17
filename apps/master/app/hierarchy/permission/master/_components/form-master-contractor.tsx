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
  createDefaultMasterContractorData,
  createMasterContractorSchema,
  masterContractorModuleKeys,
  type CrudPermission,
  type MasterContractorModuleKey,
  type MasterContractorPayload,
  type MasterContractorRecord,
} from "./master-contractor-schema"

interface MasterContractorFormProps {
  initialData?: MasterContractorPayload
  onSave?: (data: MasterContractorPayload) => void
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

type MasterContractorFormStructure = {
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

const MASTER_CONTRACTOR_SCREENS: {
  key: MasterContractorModuleKey
  label: string
}[] = [
  { key: "contractorEmployee", label: "Contractor Employee" },
  { key: "contractor", label: "Contractor" },
  { key: "companyEmployee", label: "Company Employee" },
  { key: "companyEmployeeHris", label: "Company Employee HRIS" },
]

type MasterPermissionState = Record<MasterContractorModuleKey, CrudPermission>
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

const normalizeMasterContractorFormStructure = (raw: unknown): MasterContractorFormStructure => {
  const root = getObjectValue(raw)
  if (!root) return {}

  const candidate =
    pickFirstObject(
      root.masterContractor,
      root.user,
      root.contractor,
      getObjectValue(root.master)?.contractor,
      getObjectValue(root.master)?.user,
    ) || root

  return candidate as MasterContractorFormStructure
}

export default function MasterContractorForm({
  initialData,
  onSave,
  mode = "add",
}: MasterContractorFormProps) {
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
    () => normalizeMasterContractorFormStructure(formStructure),
    [formStructure],
  )
  const moduleConfigs = resolvedFormStructure.fields || resolvedFormStructure.modules || {}
  const getModuleConfig = (key: MasterContractorModuleKey) => moduleConfigs[key] || EMPTY_PERMISSION_CONFIG
  const hasModuleConfig = (key: MasterContractorModuleKey) => Boolean(moduleConfigs[key])
  const getModuleLabel = (key: MasterContractorModuleKey, fallback: string) =>
    getModuleConfig(key).label || fallback
  const isModuleVisible = (key: MasterContractorModuleKey) =>
    hasModuleConfig(key) && getModuleConfig(key).visible === true
  const getPermissionConfigs = (sectionConfig: PermissionSectionConfig | undefined) =>
    sectionConfig?.fields?.permissions?.fields || sectionConfig?.permissions || {}
  const isPermissionVisible = (sectionConfig: PermissionSectionConfig | undefined, field: CrudField) =>
    field in getPermissionConfigs(sectionConfig)
  const visibleScreens = MASTER_CONTRACTOR_SCREENS.filter(({ key }) => isModuleVisible(key))
  const visibleCrudFields = CRUD_FIELDS.filter((field) =>
    visibleScreens.some(({ key }) => isPermissionVisible(getModuleConfig(key), field)),
  )
  const showModulePermissions = visibleScreens.length > 0
  const shouldShowConfigLoader = formStructureLoading && !formStructure

  const { post: postMasterContractor, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: () => {
      toast.success("Master contractor permissions saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving master contractor permissions:", error)
      toast.error("Failed to save master contractor permissions!")
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

  const [fetchedContractor, setFetchedContractor] = useState<MasterContractorPayload | null>(null)
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(null)

  const { refetch: refetchMasterContractor } = useRequest<any>({
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
        setFetchedContractor(null)
        setFetchedRecordId(null)
        return
      }

      setFetchedRecordId(normalizeRecordId(raw?._id))
      const normalizedFromUser = raw?.user && typeof raw.user === "object"
        ? (() => {
            const rawUser = raw.user
            const modules = masterContractorModuleKeys.reduce((acc, key) => {
              const p = rawUser?.[key]?.permissions || {}
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
            }, {} as Record<MasterContractorModuleKey, { isActive: boolean; permissions: CrudPermission }>)
            return {
              isActive: Object.values(modules).some((entry) => entry.isActive),
              ...modules,
            } as MasterContractorRecord
          })()
        : null

      const normalizedFromScreens = (() => {
        const masterScreens = raw?.screenPermissions?.find((sp: any) => sp?.serviceName === "master")?.screens ?? []
        if (!Array.isArray(masterScreens)) return null
        const modules = masterContractorModuleKeys.reduce((acc, key) => {
          const screen = masterScreens.find((s: any) => s?.screenName === key && s?.permissions)
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
        }, {} as Record<MasterContractorModuleKey, { isActive: boolean; permissions: CrudPermission }>)
        return {
          isActive: Object.values(modules).some((entry) => entry.isActive),
          ...modules,
        } as MasterContractorRecord
      })()

      const user = normalizedFromUser || normalizedFromScreens || createDefaultMasterContractorData().user
      const isActive =
        user?.isActive ??
        masterContractorModuleKeys.some((key) => {
          const entry = user?.[key]
          return !!entry?.isActive
        })

      setFetchedContractor({ user, isActive })
    },
    onError: (error) => {
      console.error("Error fetching master contractor permissions:", error)
    },
  })

  const sourceContractor = useMemo(() => {
    if (fetchedContractor) return fetchedContractor
    return null
  }, [fetchedContractor])

  const buildInitialState = (contractorData?: MasterContractorPayload | null): MasterPermissionState => {
    const defaults = createDefaultMasterContractorData().user
    const base = masterContractorModuleKeys.reduce((acc, key) => {
      acc[key] = { ...defaults[key].permissions }
      return acc
    }, {} as MasterPermissionState)

    if (contractorData?.user) {
      masterContractorModuleKeys.forEach((key) => {
        const entry = contractorData.user[key]
        if (!entry?.permissions) return
        base[key] = {
          ...base[key],
          ...entry.permissions,
        }
      })
    }

    return base
  }

  const [permissions, setPermissions] = useState<MasterPermissionState>(() => buildInitialState(sourceContractor))
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setPermissions(buildInitialState(sourceContractor))
  }, [sourceContractor])

  const handleToggle = (screenKey: MasterContractorModuleKey, field: keyof CrudPermission, value: boolean) => {
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

  const handleSave = async () => {
    const modules = masterContractorModuleKeys.reduce((acc, key) => {
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
    }, {} as Record<MasterContractorModuleKey, { isActive: boolean; permissions: CrudPermission }>)

    const isActive = Object.values(modules).some((entry) => entry.isActive)

    const schema = createMasterContractorSchema()
    const validated = schema.safeParse({
      user: {
        isActive,
        ...modules,
      },
      isActive,
    })

    if (!validated.success) {
      toast.error("Invalid master contractor payload")
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
        user: validated.data.user,
        isActive: validated.data.isActive,
      },
    }

    await postMasterContractor(requestPayload)
    await refetchMasterContractor?.()
    await onSave?.(validated.data)
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={postLoading}
        title={resolvedFormStructure.confirmTitle || "Confirm Master Contractor Change"}
        description={
          resolvedFormStructure.confirmDescription ||
          "You are updating master contractor permissions. This can impact user access."
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
              {resolvedFormStructure.label || resolvedFormStructure.subtitle || "Contractor"}
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

          {!isReadOnly && onSave && (
            <div className="flex justify-end mt-4">
              <ActionButtons
                layout="end"
                gap="gap-3"
                secondaryLabel="Reset"
                onSecondary={() => setPermissions(buildInitialState(sourceContractor))}
                primaryLabel="Save Master Contractor"
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


