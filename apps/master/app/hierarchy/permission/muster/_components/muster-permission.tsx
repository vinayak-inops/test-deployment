"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Shield } from "lucide-react"
import RolePermissionConfirmModal from "../../_components/role-permission-confirm-modal"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useSearchParams } from "next/navigation"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { toast } from "react-toastify"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { createMusterPermissionSchema, type MusterPermissionPayload } from "./muster-permission-schema"

type MusterPermissionFormState = {
  musterRollSelf: boolean
  musterRollAll: boolean
  rawPunchSelf: boolean
  rawPunchAll: boolean
  suspectedPunchAll: boolean
  approve: boolean
  viewNewPunchSelf: boolean
  viewNewPunchAll: boolean
  addNewPunchSelf: boolean
  addNewPunchAll: boolean
}

type MusterPermissionLegacy = Partial<{
  musterRollSelf: boolean
  musterRollAll: boolean
  rawPunchSelf: boolean
  rawPunchAll: boolean
  suspectedPunchAll: boolean
  approve: boolean
  viewNewPunchSelf: boolean
  viewNewPunchAll: boolean
  addNewPunchSelf: boolean
  addNewPunchAll: boolean
}>

interface MusterPermissionFormProps {
  onSave?: (data: MusterPermissionPayload) => void
  onSaveAddNewPunch?: (data: MusterPermissionPayload) => void
  mode?: "add" | "edit" | "view"
}

type PermissionVisibilityConfig = {
  label?: string
  visible?: boolean
}

type MusterSectionConfig = {
  label?: string
  visible?: boolean
  description?: string
  fields?: {
    permissions?: {
      fields?: Record<string, PermissionVisibilityConfig>
    }
  }
  permissions?: Record<string, PermissionVisibilityConfig>
}

type MusterFormStructure = {
  label?: string
  title?: string
  subtitle?: string
  description?: string
  sectionTitle?: string
  confirmTitle?: string
  confirmDescription?: string
  confirmBody?: string
  fields?: {
    musterPunch?: MusterSectionConfig
    rawPunch?: MusterSectionConfig
    addNewPunch?: MusterSectionConfig
    suspectedPunches?: MusterSectionConfig
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

export default function MusterPermissionForm({
  onSave,
  onSaveAddNewPunch,
  mode = "add",
}: MusterPermissionFormProps) {
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()
  const modeView = searchParams.get('mode');
  const entitlementCode = searchParams.get("entitlementCode") || undefined
  const { formStructure } = useCollectionFormStructure({
    collectionName: "role_permission_form_structure",
  })
  // Role-based permissions for this page (centralized under Role & Permissions)
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName: "rolePermissions",
  })

  const editMode = modeView != "permissionview"? rolePermissions?.edit : false
  const addMode = modeView != "permissionview"? rolePermissions?.add : false

  const resolvedFormStructure = useMemo(() => {
    const root = getObjectValue(formStructure)
    if (!root) return {} as MusterFormStructure

    const candidate =
      pickFirstObject(
        root.muster,
        getObjectValue(root.setting)?.muster,
      ) || root

    return candidate as MusterFormStructure
  }, [formStructure])

  const getSectionConfig = (key: keyof NonNullable<MusterFormStructure["fields"]>) =>
    resolvedFormStructure.fields?.[key]
  const getPermissionConfig = (
    sectionKey: keyof NonNullable<MusterFormStructure["fields"]>,
    fieldKey: string,
  ) =>
    getSectionConfig(sectionKey)?.fields?.permissions?.fields?.[fieldKey] ||
    getSectionConfig(sectionKey)?.permissions?.[fieldKey]
  const getPermissionLabel = (
    sectionKey: keyof NonNullable<MusterFormStructure["fields"]>,
    fieldKey: string,
    fallback: string,
  ) => getPermissionConfig(sectionKey, fieldKey)?.label || fallback
  const isPermissionVisible = (
    sectionKey: keyof NonNullable<MusterFormStructure["fields"]>,
    fieldKey: string,
  ) =>
    !!getPermissionConfig(sectionKey, fieldKey) &&
    getPermissionConfig(sectionKey, fieldKey)?.visible === true
  const isSectionVisible = (key: keyof NonNullable<MusterFormStructure["fields"]>) =>
    Boolean(getSectionConfig(key)) && getSectionConfig(key)?.visible === true

  const isReadOnly = mode === "view" || (!editMode && !addMode)

  const { post: postMusterPermissions, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: () => {
      toast.success("Muster permissions saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving muster permissions:", error)
      toast.error("Failed to save muster permissions!")
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

  const [fetchedPayload, setFetchedPayload] = useState<MusterPermissionPayload | null>(null)
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(null)

  const { refetch: refetchMuster } = useRequest<any>({
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

      const musterPayload = raw?.muster || raw?.setting?.muster || null
      if (musterPayload && typeof musterPayload === "object") {
        setFetchedPayload({ muster: musterPayload })
        return
      }

      setFetchedPayload(null)
    },
    onError: (error) => {
      console.error("Error fetching muster permissions:", error)
    },
  })

  const buildStateFromInitial = (data?: MusterPermissionPayload | MusterPermissionLegacy): MusterPermissionFormState => {
    const base: MusterPermissionFormState = {
      musterRollSelf: false,
      musterRollAll: false,
      rawPunchSelf: false,
      rawPunchAll: false,
      suspectedPunchAll: false,
      approve: false,
      viewNewPunchSelf: false,
      viewNewPunchAll: false,
      addNewPunchSelf: false,
      addNewPunchAll: false,
    }

    if (!data) return base

    if ("muster" in data && data.muster) {
      const musterPunch = data.muster.musterPunch?.permissions
      const rawPunch = data.muster.rawPunch?.permissions
      const addNewPunch = data.muster.addNewPunch?.permissions
      const suspectedPunches = data.muster.suspectedPunches?.permissions

      return {
        ...base,
        musterRollSelf: !!musterPunch?.self,
        musterRollAll: !!musterPunch?.all,
        rawPunchSelf: !!rawPunch?.self,
        rawPunchAll: !!rawPunch?.all,
        viewNewPunchSelf: !!addNewPunch?.self,
        viewNewPunchAll: !!addNewPunch?.all,
        addNewPunchSelf: !!addNewPunch?.addPunchSelf,
        addNewPunchAll: !!addNewPunch?.addPunchAll,
        suspectedPunchAll: !!suspectedPunches?.all,
        approve: !!suspectedPunches?.approve,
      }
    }

    const legacy = data as MusterPermissionLegacy
    return {
      ...base,
      ...legacy,
    }
  }

  const sourceData = useMemo(() => {
    if (fetchedPayload) return fetchedPayload
    return null
  }, [fetchedPayload])

  const [permissions, setPermissions] = useState<MusterPermissionFormState>(() =>
    buildStateFromInitial(sourceData || undefined)
  )

  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    setPermissions(buildStateFromInitial(sourceData || undefined))
  }, [sourceData])

  const handlePermissionChange = (key: keyof MusterPermissionFormState, value: boolean) => {
    const next = { ...permissions, [key]: value }

    // Mutual exclusivity for *_Self vs *_All
    if (key === "musterRollSelf" && value) {
      next.musterRollAll = false
    } else if (key === "musterRollAll" && value) {
      next.musterRollSelf = false
    }

    if (key === "rawPunchSelf" && value) {
      next.rawPunchAll = false
    } else if (key === "rawPunchAll" && value) {
      next.rawPunchSelf = false
    }

    // Mutual exclusivity for viewNewPunchSelf vs viewNewPunchAll
    // When switching view between Self and All, add permissions should reset to false
    if (key === "viewNewPunchSelf" && value) {
      next.viewNewPunchAll = false
      // Reset add permissions when view changes
      next.addNewPunchSelf = false
      next.addNewPunchAll = false
    } else if (key === "viewNewPunchAll" && value) {
      next.viewNewPunchSelf = false
      // Reset add permissions when view changes
      next.addNewPunchSelf = false
      next.addNewPunchAll = false
    } else if (key === "viewNewPunchSelf" && !value) {
      // When view is turned off, reset add permissions
      next.addNewPunchSelf = false
    } else if (key === "viewNewPunchAll" && !value) {
      // When view is turned off, reset add permissions
      next.addNewPunchAll = false
    }

    // Mutual exclusivity for addNewPunchSelf vs addNewPunchAll
    if (key === "addNewPunchSelf" && value) {
      next.addNewPunchAll = false
      // Ensure view matches add (Self)
      next.viewNewPunchSelf = true
      next.viewNewPunchAll = false
    } else if (key === "addNewPunchAll" && value) {
      next.addNewPunchSelf = false
      // Ensure view matches add (All)
      next.viewNewPunchAll = true
      next.viewNewPunchSelf = false
    }

    // Parent-child: if viewNewPunch is false, then addNewPunch must also be false
    const hasViewNewPunch = !!next.viewNewPunchSelf || !!next.viewNewPunchAll
    if (!hasViewNewPunch) {
      next.addNewPunchSelf = false
      next.addNewPunchAll = false
    }

    // Parent-child: if Suspected Punches master is false, child approve must also be false
    if (key === "suspectedPunchAll" && !value) {
      next.approve = false
    }

    setPermissions(next)
  }

  const buildFullPayload = (): MusterPermissionPayload => {
    const musterPunchPermissions = {
      self: !!permissions.musterRollSelf,
      all: !!permissions.musterRollAll,
    }

    const rawPunchPermissions = {
      self: !!permissions.rawPunchSelf,
      all: !!permissions.rawPunchAll,
    }

    const addNewPunchPermissions = {
      self: !!permissions.viewNewPunchSelf,
      all: !!permissions.viewNewPunchAll,
      addPunchSelf: !!permissions.addNewPunchSelf,
      addPunchAll: !!permissions.addNewPunchAll,
    }

    const suspectedPunchPermissions = {
      approve: !!permissions.approve,
      all: !!permissions.suspectedPunchAll,
      self: false,
    }

    const musterPunchActive =
      musterPunchPermissions.self || musterPunchPermissions.all

    const rawPunchActive = rawPunchPermissions.self || rawPunchPermissions.all

    const addNewPunchActive =
      addNewPunchPermissions.self ||
      addNewPunchPermissions.all ||
      addNewPunchPermissions.addPunchSelf ||
      addNewPunchPermissions.addPunchAll

    const suspectedPunchActive =
      suspectedPunchPermissions.all || suspectedPunchPermissions.self || suspectedPunchPermissions.approve

    const isActive =
      musterPunchActive || rawPunchActive || addNewPunchActive || suspectedPunchActive

    return {
      muster: {
        isActive,
        musterPunch: {
          isActive: musterPunchActive,
          permissions: musterPunchPermissions,
        },
        rawPunch: {
          isActive: rawPunchActive,
          permissions: rawPunchPermissions,
        },
        addNewPunch: {
          isActive: addNewPunchActive,
          permissions: addNewPunchPermissions,
        },
        suspectedPunches: {
          isActive: suspectedPunchActive,
          permissions: suspectedPunchPermissions,
        },
      },
    }
  }

  const handleSaveAll = async () => {
    setLoading(true)
    try {
      const payload = buildFullPayload()
      const schema = createMusterPermissionSchema()
      const validated = schema.safeParse(payload)

      if (!validated.success) {
        toast.error("Invalid muster payload")
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

      await postMusterPermissions(requestPayload)
      await refetchMuster?.()
      await onSave?.(validated.data)
    } catch (error) {
      console.error("Error saving muster permissions:", error)
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

  const CheckboxRow = ({
    id,
    label,
    value,
    onChange,
  }: {
    id: string
    label: string
    value?: boolean
    onChange: (checked: boolean) => void
  }) => (
    <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        disabled={isReadOnly}
        className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <span className="text-sm font-normal text-gray-900">{label}</span>
    </label>
  )

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={loading || postLoading}
        title={resolvedFormStructure.confirmTitle || "Confirm Muster Permission Change"}
        description={
          resolvedFormStructure.confirmDescription ||
          "You are updating muster permissions. This can impact user access and approval actions."
        }
        body={
          resolvedFormStructure.confirmBody ||
          "Please review your changes carefully. Proceed only if you are sure about this update."
        }
        onCancel={() => setShowConfirm(false)}
        onConfirm={async () => {
          await handleSaveAll()
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
              {resolvedFormStructure.label || "Muster Permissions"}
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {resolvedFormStructure.description ||
                resolvedFormStructure.subtitle ||
                "Configure muster roll, raw punch, added punch, and suspected punch permissions"}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {isSectionVisible("musterPunch") && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {getSectionConfig("musterPunch")?.label || "Muster Punch"}
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isPermissionVisible("musterPunch", "self") && (
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {getPermissionLabel("musterPunch", "self", "Muster Roll")}
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    Only this employee&apos;s muster roll
                  </Label>
                </div>
                <SwitchToggle
                  id="musterRollSelf"
                  checked={!!permissions.musterRollSelf}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("musterRollSelf", checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
              )}
              {isPermissionVisible("musterPunch", "all") && (
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {getPermissionLabel("musterPunch", "all", "Muster Roll")}
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    All employees in the accessible scope
                  </Label>
                </div>
                <SwitchToggle
                  id="musterRollAll"
                  checked={!!permissions.musterRollAll}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("musterRollAll", checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
              )}
            </div>

            </div>
          </div>
          )}

          {isSectionVisible("rawPunch") && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {getSectionConfig("rawPunch")?.label || "Raw Punch"}
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isPermissionVisible("rawPunch", "self") && (
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {getPermissionLabel("rawPunch", "self", "Raw Punch")}
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    View only this employee&apos;s raw punches
                  </Label>
                </div>
                <SwitchToggle
                  id="rawPunchSelf"
                  checked={!!permissions.rawPunchSelf}
                  onCheckedChange={(checked) => handlePermissionChange("rawPunchSelf", checked)}
                  disabled={isReadOnly}
                />
              </div>
              )}
              {isPermissionVisible("rawPunch", "all") && (
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {getPermissionLabel("rawPunch", "all", "Raw Punch")}
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    View raw punches for all employees in scope
                  </Label>
                </div>
                <SwitchToggle
                  id="rawPunchAll"
                  checked={!!permissions.rawPunchAll}
                  onCheckedChange={(checked) => handlePermissionChange("rawPunchAll", checked)}
                  disabled={isReadOnly}
                />
              </div>
              )}
            </div>
            </div>
          </div>
          )}

          {isSectionVisible("addNewPunch") && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {getSectionConfig("addNewPunch")?.label || "Add New Punch"}
              </div>
            </div>
            <div className="px-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isPermissionVisible("addNewPunch", "self") && (
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {getPermissionLabel("addNewPunch", "self", "View Added Punches Self")}
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    Allow viewing added punches for self
                  </Label>
                </div>
                <SwitchToggle
                  id="viewNewPunchSelf"
                  checked={!!permissions.viewNewPunchSelf}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("viewNewPunchSelf", checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
              )}
              {isPermissionVisible("addNewPunch", "all") && (
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {getPermissionLabel("addNewPunch", "all", "View Added Punches All")}
                  </div>
                  <Label className="text-sm font-normal text-gray-900">
                    Allow viewing added punches for all employees
                  </Label>
                </div>
                <SwitchToggle
                  id="viewNewPunchAll"
                  checked={!!permissions.viewNewPunchAll}
                  onCheckedChange={(checked) =>
                    handlePermissionChange("viewNewPunchAll", checked)
                  }
                  disabled={isReadOnly}
                />
              </div>
              )}
            </div>

            {(permissions.viewNewPunchSelf || permissions.viewNewPunchAll) && (
              <div className="pt-4 border-t border-gray-100 mt-4">
                <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                  Add New Punch Permissions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions.viewNewPunchSelf && isPermissionVisible("addNewPunch", "addPunchSelf") && (
                    <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.addNewPunchSelf}
                        onChange={(e) =>
                          handlePermissionChange("addNewPunchSelf", e.target.checked)
                        }
                        disabled={isReadOnly}
                        className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="text-sm font-normal text-gray-900">
                        {getPermissionLabel("addNewPunch", "addPunchSelf", "Add New Punch for Self")}
                      </span>
                    </label>
                  )}

                  {permissions.viewNewPunchAll && isPermissionVisible("addNewPunch", "addPunchAll") && (
                    <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!permissions.addNewPunchAll}
                        onChange={(e) =>
                          handlePermissionChange("addNewPunchAll", e.target.checked)
                        }
                        disabled={isReadOnly}
                        className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <span className="text-sm font-normal text-gray-900">
                        {getPermissionLabel("addNewPunch", "addPunchAll", "Add New Punch for All Employees")}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
          )}

          {isSectionVisible("suspectedPunches") && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {getSectionConfig("suspectedPunches")?.label || "Suspected Punches"}
              </div>
            </div>
            <div className="px-4 py-4">
              {isPermissionVisible("suspectedPunches", "all") && (
              <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  {getPermissionLabel("suspectedPunches", "all", "Suspected Punches")}
                </div>
                <Label className="text-sm font-normal text-gray-900">
                  Allow access to all suspected punches
                </Label>
              </div>
              <SwitchToggle
                id="suspectedPunchAll"
                checked={!!permissions.suspectedPunchAll}
                onCheckedChange={(checked) =>
                  handlePermissionChange("suspectedPunchAll", checked)
                }
                disabled={isReadOnly}
              />
            </div>
              )}

            {permissions.suspectedPunchAll && (
              <div className="pt-4 border-t border-gray-100 mt-4">
                <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                  Suspected Punches Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {isPermissionVisible("suspectedPunches", "approve") && (
                    <CheckboxRow
                      id="approve"
                      label={getPermissionLabel("suspectedPunches", "approve", "Approve suspected punches")}
                      value={permissions.approve}
                      onChange={(checked) => handlePermissionChange("approve", checked)}
                    />
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
          )}

          {!isReadOnly && (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={() =>
                  setPermissions({
                    musterRollSelf: false,
                    musterRollAll: false,
                    rawPunchSelf: false,
                    rawPunchAll: false,
                    suspectedPunchAll: false,
                    approve: false,
                    viewNewPunchSelf: false,
                    viewNewPunchAll: false,
                    addNewPunchSelf: false,
                    addNewPunchAll: false,
                  })
                }
                disabled={loading || postLoading}
                className="h-8 px-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs"
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={loading || postLoading}
                className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                {loading || postLoading ? "Saving..." : "Save Permissions"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
