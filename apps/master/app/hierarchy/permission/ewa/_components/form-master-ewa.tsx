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
import { createEwaPermissionSchema, type EwaPermissionPayload } from "./ewa-permission-schema"

type CrudPermission = { view: boolean; edit: boolean; add: boolean; delete: boolean }

type PermissionVisibilityConfig = { visible?: boolean }
type PermissionSectionConfig = {
  label?: string
  visible?: boolean
  permissions?: Record<string, PermissionVisibilityConfig>
  fields?: { permissions?: { fields?: Record<string, PermissionVisibilityConfig> } }
}
type MasterEwaFormStructure = {
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

const EWA_SCREENS = [
  { key: "EWAEmployeeSettings", label: "EWA Employee Settings" },
  { key: "EWAWithdrawalCategory", label: "EWA Withdrawal Category" },
  { key: "EWAAllowedWithdrawal", label: "EWA Allowed Withdrawal" },
  { key: "ewaTenantOutstanding", label: "EWA Tenant Outstanding" },
  { key: "ewaContractorOutstanding", label: "EWA Contractor Outstanding" },
] as const

type EwaKey = (typeof EWA_SCREENS)[number]["key"]
type MasterPermissionState = Record<EwaKey, CrudPermission>
type CrudField = keyof CrudPermission

const CRUD_FIELDS: CrudField[] = ["view", "edit", "add", "delete"]
const EMPTY_PERMISSION_CONFIG: PermissionSectionConfig = {}

const getObjectValue = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const normalizeMasterEwaFormStructure = (raw: unknown): MasterEwaFormStructure => {
  const root = getObjectValue(raw)
  if (!root) return {}
  return ((root.masterEwa || root.ewa || getObjectValue(root.master)?.ewa || root) as MasterEwaFormStructure)
}

export default function MasterEwaForm({ initialData, onSave, mode = "add" }: { initialData?: EwaPermissionPayload; onSave?: (data: EwaPermissionPayload) => void; mode?: "add" | "edit" | "view" }) {
  const searchParams = useSearchParams()
  const modeView = searchParams.get("mode")
  const tenantCode = useGetTenantCode()
  const entitlementCode = searchParams.get("entitlementCode") || undefined
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({ collectionName: "role_permission_form_structure" })
  const { responseData: rolePermissions } = useRolePermissions({ serviceName: "roleControl", screenName: "rolePermissions" })
  const editMode = modeView !== "permissionview" ? rolePermissions?.edit : false
  const addMode = modeView !== "permissionview" ? rolePermissions?.add : false
  const isReadOnly = mode === "view" || (!editMode && !addMode)

  const resolvedFormStructure = useMemo(() => normalizeMasterEwaFormStructure(formStructure), [formStructure])
  const moduleConfigs = resolvedFormStructure.fields || resolvedFormStructure.modules || {}
  const getModuleConfig = (key: EwaKey) => moduleConfigs[key] || EMPTY_PERMISSION_CONFIG
  const hasModuleConfig = (key: EwaKey) => Boolean(moduleConfigs[key])
  const getModuleLabel = (key: EwaKey, fallback: string) => getModuleConfig(key).label || fallback
  const isModuleVisible = (key: EwaKey) => hasModuleConfig(key) && getModuleConfig(key).visible === true
  const getPermissionConfigs = (sectionConfig: PermissionSectionConfig | undefined) => sectionConfig?.fields?.permissions?.fields || sectionConfig?.permissions || {}
  const isPermissionVisible = (sectionConfig: PermissionSectionConfig | undefined, field: CrudField) => field in getPermissionConfigs(sectionConfig)
  const visibleScreens = EWA_SCREENS.filter(({ key }) => isModuleVisible(key))
  const visibleCrudFields = CRUD_FIELDS.filter((field) => visibleScreens.some(({ key }) => isPermissionVisible(getModuleConfig(key), field)))

  const [fetchedPayload, setFetchedPayload] = useState<EwaPermissionPayload | null>(null)
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(null)
  const normalizeRecordId = (value: unknown): string | null => {
    if (!value) return null
    if (typeof value === "string") return value
    if (typeof value === "object" && value !== null && "$oid" in value) return String((value as { $oid: string }).$oid)
    return String(value)
  }

  const { refetch: refetchEwa } = useRequest<any>({
    url: "role_permissions/search",
    method: "POST",
    data: [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      { field: "entitlementCode", value: entitlementCode, operator: "eq" },
      { field: "createdOn", value: "", operator: "desc" },
    ],
    dependencies: [tenantCode, entitlementCode],
    onSuccess: (response) => {
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [response]
      const raw = list[0]
      if (!raw) {
        setFetchedPayload(null)
        setFetchedRecordId(null)
        return
      }
      setFetchedRecordId(normalizeRecordId(raw?._id))
      if (raw?.ewa && typeof raw.ewa === "object") {
        setFetchedPayload(raw as EwaPermissionPayload)
        return
      }
      const ewaPayload = raw?.setting?.ewa || null
      setFetchedPayload(ewaPayload && typeof ewaPayload === "object" ? { ewa: ewaPayload } : null)
    },
  })

  const sourceData = fetchedPayload || initialData || null
  const buildInitialState = (data?: EwaPermissionPayload | null): MasterPermissionState => {
    const base = EWA_SCREENS.reduce((acc, { key }) => {
      acc[key] = { view: false, edit: false, add: false, delete: false }
      return acc
    }, {} as MasterPermissionState)
    if (!data?.ewa) return base
    EWA_SCREENS.forEach(({ key }) => {
      const p = data.ewa[key]?.permissions
      if (!p) return
      base[key] = { view: !!p.view, edit: !!p.edit, add: !!p.add, delete: !!p.delete }
    })
    return base
  }

  const [permissions, setPermissions] = useState<MasterPermissionState>(() => buildInitialState(sourceData))
  const [showConfirm, setShowConfirm] = useState(false)
  useEffect(() => { setPermissions(buildInitialState(sourceData)) }, [sourceData])

  const { post: postEwaPermissions, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: () => toast.success("EWA permissions saved successfully!"),
    onError: () => toast.error("Failed to save EWA permissions!"),
  })

  const handleToggle = (screenKey: EwaKey, field: CrudField, value: boolean) => {
    setPermissions((prev) => {
      const current = prev[screenKey]
      if (field === "view" && value === false) return { ...prev, [screenKey]: { view: false, edit: false, add: false, delete: false } }
      if ((field === "edit" || field === "add" || field === "delete") && value === true) return { ...prev, [screenKey]: { ...current, view: true, [field]: true } }
      return { ...prev, [screenKey]: { ...current, [field]: value } }
    })
  }

  const handleSave = async () => {
    const ewaModules = EWA_SCREENS.reduce((acc, { key }) => {
      const p = permissions[key]
      const isActive = !!(p.view || p.edit || p.add || p.delete)
      acc[key] = { isActive, permissions: { view: !!p.view, edit: !!p.edit, add: !!p.add, delete: !!p.delete } }
      return acc
    }, {} as Record<EwaKey, { isActive: boolean; permissions: CrudPermission }>)

    const ewaIsActive = Object.values(ewaModules).some((entry) => entry.isActive)
    const payload: EwaPermissionPayload = { ewa: { ...ewaModules, isActive: ewaIsActive } }
    const validated = createEwaPermissionSchema().safeParse(payload)
    if (!validated.success) return toast.error("Invalid EWA payload")

    const resolvedRecordId = fetchedRecordId || null
    const isEditMode = Boolean(resolvedRecordId)
    await postEwaPermissions({
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedRecordId } : {}),
      collectionName: "role_permissions",
      data: { ...(entitlementCode ? { entitlementCode } : {}), tenantCode: tenantCode || "", ...validated.data },
    })
    await refetchEwa?.()
    await onSave?.(validated.data)
  }

  const shouldShowConfigLoader = formStructureLoading && !formStructure

  return <div className="w-full max-w-5xl mx-auto space-y-6">
    <RolePermissionConfirmModal
      open={showConfirm}
      isReadOnly={isReadOnly}
      postLoading={postLoading}
      title={resolvedFormStructure.confirmTitle || "Confirm Master EWA Change"}
      description={
        resolvedFormStructure.confirmDescription ||
        "You are updating EWA permissions. This can impact user access."
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm"><div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3"><div className="p-1.5 bg-gray-100 rounded-lg"><Shield className="h-4 w-4 text-gray-600" /></div><div><h2 className="text-sm font-semibold text-gray-900">Master</h2><p className="text-[11px] text-gray-500 mt-0.5">{resolvedFormStructure.label || resolvedFormStructure.subtitle || "EWA"}</p></div></div><div className="px-6 py-4 space-y-4">{shouldShowConfigLoader ? <div className="py-10 text-center text-sm text-gray-600">Loading form configuration...</div> : <><div className="flex items-center justify-between pb-2 border-b border-gray-100"><span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{resolvedFormStructure.title || "Module"}</span><div className="flex items-center justify-end gap-6 min-w-[220px] text-[11px] font-medium text-gray-500 uppercase tracking-wide">{visibleCrudFields.map((field) => <span key={field} className="w-10 text-center">{field[0].toUpperCase() + field.slice(1)}</span>)}</div></div><div className="divide-y divide-gray-100">{visibleScreens.map(({ key, label }) => { const p = permissions[key]; const moduleConfig = getModuleConfig(key); return <div key={key} className="flex items-center justify-between py-3"><Label className="text-sm font-normal text-gray-900">{getModuleLabel(key, label)}</Label><div className="flex items-center justify-end gap-6 min-w-[220px]">{visibleCrudFields.map((field) => isPermissionVisible(moduleConfig, field) ? <div key={field} className="w-10 flex justify-center"><input type="checkbox" checked={!!p?.[field]} onChange={(e) => handleToggle(key, field, e.target.checked)} disabled={isReadOnly} className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0" /></div> : <div key={field} className="w-10" />)}</div></div>})}</div></>} {!isReadOnly && <div className="flex justify-end mt-4"><ActionButtons layout="end" gap="gap-3" secondaryLabel="Reset" onSecondary={() => setPermissions(buildInitialState(sourceData))} primaryLabel="Save EWA" onPrimary={() => setShowConfirm(true)} primaryLoading={postLoading} primaryDisabled={postLoading} className="w-full md:w-auto" primaryClassName="bg-blue-600 hover:bg-blue-700 text-white" secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300" /></div>}</div></div></div>
}