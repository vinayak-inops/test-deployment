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
import { createBgmPermissionSchema, type BgmPermissionPayload } from "./bgm-permission-schema"

export default function MasterBgmForm({ initialData, onSave, mode = "add" }: { initialData?: BgmPermissionPayload; onSave?: (data: BgmPermissionPayload) => void; mode?: "add" | "edit" | "view" }) {
  const searchParams = useSearchParams(); const modeView = searchParams.get("mode"); const tenantCode = useGetTenantCode(); const entitlementCode = searchParams.get("entitlementCode") || undefined
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({ collectionName: "role_permission_form_structure" })
  const { responseData: rolePermissions } = useRolePermissions({ serviceName: "roleControl", screenName: "rolePermissions" })
  const editMode = modeView !== "permissionview" ? rolePermissions?.edit : false; const addMode = modeView !== "permissionview" ? rolePermissions?.add : false; const isReadOnly = mode === "view" || (!editMode && !addMode)
  const resolved = useMemo(() => ((formStructure as any)?.masterBgm || (formStructure as any)?.bgm || formStructure || {}), [formStructure])
  const config = ((resolved.fields || resolved.modules || {}).verfication || {}) as any
  const visible = config.visible === true
  const showApply = (config?.fields?.permissions?.fields?.apply || config?.permissions?.apply) !== undefined

  const normalizeRecordId = (value: unknown): string | null => { if (!value) return null; if (typeof value === "string") return value; if (typeof value === "object" && value !== null && "$oid" in value) return String((value as { $oid: string }).$oid); return String(value) }
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(null)
  const [fetchedPayload, setFetchedPayload] = useState<BgmPermissionPayload | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const { refetch } = useRequest<any>({ url: "role_permissions/search", method: "POST", data: [{ field: "tenantCode", value: tenantCode, operator: "eq" }, { field: "entitlementCode", value: entitlementCode, operator: "eq" }, { field: "createdOn", value: "", operator: "desc" }], dependencies: [tenantCode, entitlementCode], onSuccess: (response) => { const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [response]; const raw = list[0]; if (!raw) { setFetchedPayload(null); setFetchedRecordId(null); return } setFetchedRecordId(normalizeRecordId(raw?._id)); if (raw?.bgm && typeof raw.bgm === "object") return setFetchedPayload(raw as BgmPermissionPayload); const p = raw?.setting?.bgm; setFetchedPayload(p && typeof p === "object" ? { bgm: p } : null) } })
  const source = fetchedPayload || initialData || null
  const [apply, setApply] = useState<boolean>(!!source?.bgm?.verfication?.permissions?.apply)
  useEffect(() => { setApply(!!source?.bgm?.verfication?.permissions?.apply) }, [source])

  const { post, loading } = usePostRequest<any>({ url: "role_permissions", onSuccess: () => toast.success("BGV permissions saved successfully!"), onError: () => toast.error("Failed to save BGV permissions!") })
  const handleSave = async () => { const payload: BgmPermissionPayload = { bgm: { isActive: !!apply, verfication: { isActive: !!apply, permissions: { apply: !!apply } } } }; const validated = createBgmPermissionSchema().safeParse(payload); if (!validated.success) return toast.error("Invalid BGV payload"); const id = fetchedRecordId || null; const isEditMode = Boolean(id); await post({ tenant: tenantCode, action: isEditMode ? "update" : "insert", ...(isEditMode ? { id } : {}), collectionName: "role_permissions", data: { ...(entitlementCode ? { entitlementCode } : {}), tenantCode: tenantCode || "", ...validated.data } }); await refetch?.(); await onSave?.(validated.data) }

  const shouldShowConfigLoader = formStructureLoading && !formStructure
  return <div className="w-full max-w-5xl mx-auto space-y-6">
    <RolePermissionConfirmModal
      open={showConfirm}
      isReadOnly={isReadOnly}
      postLoading={loading}
      title="Confirm Master BGM Change"
      description="You are updating BGM permissions. This can impact user access."
      body="Please review your changes carefully. Proceed only if you are sure about this update."
      onCancel={() => setShowConfirm(false)}
      onConfirm={async () => {
        await handleSave()
        setShowConfirm(false)
      }}
    />
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm"><div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-center gap-3"><div className="p-1.5 bg-gray-100 rounded-lg"><Shield className="h-4 w-4 text-gray-600" /></div><div><h2 className="text-sm font-semibold text-gray-900">Master</h2><p className="text-[11px] text-gray-500 mt-0.5">{resolved.label || resolved.subtitle || "BGM"}</p></div></div><div className="px-6 py-4 space-y-4">{shouldShowConfigLoader ? <div className="py-10 text-center text-sm text-gray-600">Loading form configuration...</div> : visible && showApply ? <div className="divide-y divide-gray-100"><div className="flex items-center justify-between py-3"><Label className="text-sm font-normal text-gray-900">{config.label || "Verification"}</Label><div className="w-10 flex justify-center"><input type="checkbox" checked={apply} onChange={(e) => setApply(e.target.checked)} disabled={isReadOnly} className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0" /></div></div></div> : null}{!isReadOnly && <div className="flex justify-end mt-4"><ActionButtons layout="end" gap="gap-3" secondaryLabel="Reset" onSecondary={() => setApply(!!source?.bgm?.verfication?.permissions?.apply)} primaryLabel="Save BGM" onPrimary={() => setShowConfirm(true)} primaryLoading={loading} primaryDisabled={loading} className="w-full md:w-auto" primaryClassName="bg-blue-600 hover:bg-blue-700 text-white" secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300" /></div>}</div></div></div>
  
}
