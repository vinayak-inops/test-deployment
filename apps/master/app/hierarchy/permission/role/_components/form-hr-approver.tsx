"use client"

import React, { useEffect, useState } from "react"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Label } from "@repo/ui/components/ui/label"
import { Shield } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import RolePermissionConfirmModal from "../../_components/role-permission-confirm-modal"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { useSearchParams } from "next/navigation"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { toast } from "react-toastify"
import {
  createDefaultHrApproverData,
  createHrApproverSchema,
  normalizeHrApproverConfig,
  type FieldConfig,
  type HrApproverData,
  type HrApproverFieldsConfig,
  type HrApproverTabConfig,
} from "./hr-approver-schema"

interface HrApproverFormProps {
  initialData?: HrApproverData
  recordId?: string | null
  entitlementCode?: string
  config?: HrApproverFieldsConfig | HrApproverTabConfig
  onSave?: () => void
  mode?: "add" | "edit" | "view"
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

export default function HrApproverForm({
  initialData,
  recordId,
  entitlementCode,
  config,
  onSave,
  mode = "add",
}: HrApproverFormProps) {
  const searchParams = useSearchParams()
  const tenantCode = useGetTenantCode()
  const modeView = searchParams.get("mode")
  const { formStructure } = useCollectionFormStructure({
    collectionName: "role_permission_form_structure",
  })
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName: "rolePermissions",
  })

  const editMode = modeView !== "permissionview" ? rolePermissions?.edit : false
  const addMode = modeView !== "permissionview" ? rolePermissions?.add : false
  const isReadOnly = mode === "view" || (!editMode && !addMode)
  const { post: postHrApprover, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: async (response) => {
      toast.success("Hr approver permissions saved successfully!")
      await onSave?.()
    },
    onError: (error) => {
      console.error("Error saving Hr Approver permissions:", error)
      toast.error("Failed to save Hr approver permissions!")
    },
  })

  const emptyValues = useMemo(() => createDefaultHrApproverData(), [])
  const resolvedStructureObject = useMemo(() => {
    const root = getObjectValue(formStructure)
    if (!root) return null

    const candidate =
      pickFirstObject(
        root.hrApprover,
        root.hrapprover,
        getObjectValue(root.role)?.hrApprover,
        getObjectValue(root.role)?.hrapprover,
      ) || null

    return candidate
  }, [formStructure])
  const resolvedStructureConfig = useMemo(
    () => resolvedStructureObject as HrApproverFieldsConfig | HrApproverTabConfig | undefined,
    [resolvedStructureObject],
  )
  const normalizedConfig = useMemo(
    () => normalizeHrApproverConfig(config ?? resolvedStructureConfig),
    [config, resolvedStructureConfig],
  )
  const schema = useMemo(() => createHrApproverSchema(normalizedConfig), [normalizedConfig])
  const { refetch: refetchHrApprover } = useRequest<any>({
    url: "role_permissions/search",
    method: "POST",
    data: [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      { field: "entitlementCode", value: entitlementCode, operator: "eq" },
      { field: "createdOn", value: "", operator: "desc" },
    ],
    dependencies: [tenantCode, entitlementCode],
    onSuccess: () => {},
    onError: (error) => {
      console.error("Error fetching hr approver permissions:", error)
    },
  })

  const {
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = useForm<HrApproverData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...emptyValues,
      ...(recordId ? { _id: recordId } : {}),
      ...initialData,
    },
    mode: "onChange",
  })

  const permissions = watch()
  const [showErrors, setShowErrors] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const fields = normalizedConfig.fields ?? {}
  const hasHrApproverConfig = Boolean(resolvedStructureObject)
  const getFieldConfig = (
    key: "contractEmployeeApproverApprove" | "companyEmployeeApproverApprove" | "contracerApproverApprove"
  ) => fields[key] as FieldConfig | undefined
  const isVisible = (
    key: "contractEmployeeApproverApprove" | "companyEmployeeApproverApprove" | "contracerApproverApprove"
  ) => hasHrApproverConfig && getFieldConfig(key)?.visible === true
  const isRequired = (
    key: "contractEmployeeApproverApprove" | "companyEmployeeApproverApprove" | "contracerApproverApprove"
  ) => getFieldConfig(key)?.required ?? false
  const getLabel = (
    key: "contractEmployeeApproverApprove" | "companyEmployeeApproverApprove" | "contracerApproverApprove",
    fallback: string
  ) => getFieldConfig(key)?.label || fallback

  const normalizeInitialData = (data?: HrApproverData | null): HrApproverData | undefined => {
    if (!data?.hrapprover) return data ?? undefined
    if (
      data.hrapprover.contractEmployeeApprover ||
      data.hrapprover.companyEmployeeApprover ||
      data.hrapprover.contracerApprover
    )
      return data
    const legacy = data.hrapprover as any
    return {
      ...data,
      hrapprover: {
        isActive: !!legacy.isActive,
        contractEmployeeApprover: legacy.contractEmployeeApprover,
        companyEmployeeApprover: legacy.companyEmployeeApprover,
        contracerApprover: legacy.contracerApprover,
      },
    }
  }

  useEffect(() => {
    reset({
      ...emptyValues,
      ...(recordId ? { _id: recordId } : {}),
      ...(normalizeInitialData(initialData) ?? {}),
    })
  }, [emptyValues, initialData, recordId, reset])

  const handleSave = async () => {
    setShowErrors(true)
    const contractEmployeeApproverApprove =
      !!permissions.hrapprover?.contractEmployeeApprover?.permissions?.approve
    const companyEmployeeApproverApprove =
      !!permissions.hrapprover?.companyEmployeeApprover?.permissions?.approve
    const contracerApproverApprove =
      !!permissions.hrapprover?.contracerApprover?.permissions?.approve
    const approverIsActive =
      contractEmployeeApproverApprove || companyEmployeeApproverApprove || contracerApproverApprove

    setValue("hrapprover.isActive" as any, approverIsActive)

    const valid = await trigger()
    if (!valid) return

    const resolvedEmployeeRecordId = permissions._id || recordId || ""
    const isEditMode = Boolean(resolvedEmployeeRecordId)

    const requestPayload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "role_permissions",
      data: {
        ...(entitlementCode ? { entitlementCode } : {}),
        tenantCode: tenantCode || "",
        hrapprover: {
          isActive: approverIsActive,
          contractEmployeeApprover: {
            permissions: {
              approve: contractEmployeeApproverApprove,
            },
            isActive: contractEmployeeApproverApprove,
          },
          companyEmployeeApprover: {
            permissions: {
              approve: companyEmployeeApproverApprove,
            },
            isActive: companyEmployeeApproverApprove,
          },
          contracerApprover: {
            permissions: {
              approve: contracerApproverApprove,
            },
            isActive: contracerApproverApprove,
          },
        },
      },
    }
    await postHrApprover(requestPayload)
    await refetchHrApprover?.()
  }

  const handlePermissionChange = (
    key: "contractEmployeeApprover" | "companyEmployeeApprover" | "contracerApprover",
    value: boolean
  ) => {
    setValue(`hrapprover.${key}.permissions.approve` as any, value)
    setValue(`hrapprover.${key}.isActive` as any, value)
    const nextContract =
      key === "contractEmployeeApprover"
        ? value
        : !!permissions.hrapprover?.contractEmployeeApprover?.permissions?.approve
    const nextCompany =
      key === "companyEmployeeApprover"
        ? value
        : !!permissions.hrapprover?.companyEmployeeApprover?.permissions?.approve
    const nextContracer =
      key === "contracerApprover"
        ? value
        : !!permissions.hrapprover?.contracerApprover?.permissions?.approve
    setValue("hrapprover.isActive" as any, nextContract || nextCompany || nextContracer)
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
  }) => (
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={postLoading}
        title={(resolvedStructureObject?.confirmTitle as string) || "Confirm HR Approver Change"}
        description={
          (resolvedStructureObject?.confirmDescription as string) ||
          "You are updating HR approver permissions. This can impact approval workflows."
        }
        body={
          (resolvedStructureObject?.confirmBody as string) ||
          "Please review your changes carefully. Proceed only if you are sure about this update."
        }
        onCancel={() => setShowConfirm(false)}
        onConfirm={async () => {
          await handleSave()
          setShowConfirm(false)
        }}
      />

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Shield className="h-4 w-4 text-gray-600" />
              </div>
              <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {(resolvedStructureObject?.label as string) || "Hr Approver Permissions"}
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {(resolvedStructureObject?.subtitle as string) || "Manage HR contract employee approval access"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSave()
            }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-medium text-gray-900 mb-3 tracking-wide">
                  {(resolvedStructureObject?.title as string) || "HR Approver Permissions"}
                </h3>
                <div className="grid gap-4">
                  {showErrors && errors.hrapprover?.contractEmployeeApprover?.permissions?.approve && (
                    <p className="text-xs text-red-600">
                      {typeof errors.hrapprover.contractEmployeeApprover.permissions.approve.message === "string"
                        ? errors.hrapprover.contractEmployeeApprover.permissions.approve.message
                        : ""}
                    </p>
                  )}
                  {showErrors && errors.hrapprover?.companyEmployeeApprover?.permissions?.approve && (
                    <p className="text-xs text-red-600">
                      {typeof errors.hrapprover.companyEmployeeApprover.permissions.approve.message === "string"
                        ? errors.hrapprover.companyEmployeeApprover.permissions.approve.message
                        : ""}
                    </p>
                  )}
                  {showErrors && errors.hrapprover?.contracerApprover?.permissions?.approve && (
                    <p className="text-xs text-red-600">
                      {typeof errors.hrapprover.contracerApprover.permissions.approve.message === "string"
                        ? errors.hrapprover.contracerApprover.permissions.approve.message
                        : ""}
                    </p>
                  )}
                  {isVisible("contractEmployeeApproverApprove") && (
                  <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {getLabel("contractEmployeeApproverApprove", "Contract Employee Approver")}
                        {isRequired("contractEmployeeApproverApprove") && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <Label
                        htmlFor="contractEmployeeApprover"
                        className="text-sm font-normal text-gray-900 cursor-pointer block"
                      >
                        Allow approving Employee applications
                      </Label>
                    </div>
                    <SwitchToggle
                      id="contractEmployeeApprover"
                      checked={!!permissions.hrapprover?.contractEmployeeApprover?.permissions?.approve}
                      onCheckedChange={(checked) =>
                        handlePermissionChange("contractEmployeeApprover", checked)
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                  )}
                  {isVisible("companyEmployeeApproverApprove") && (
                  <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {getLabel("companyEmployeeApproverApprove", "Company Employee Approver")}
                        {isRequired("companyEmployeeApproverApprove") && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <Label
                        htmlFor="companyEmployeeApprover"
                        className="text-sm font-normal text-gray-900 cursor-pointer block"
                      >
                        Allow approving company employee applications
                      </Label>
                    </div>
                    <SwitchToggle
                      id="companyEmployeeApprover"
                      checked={!!permissions.hrapprover?.companyEmployeeApprover?.permissions?.approve}
                      onCheckedChange={(checked) =>
                        handlePermissionChange("companyEmployeeApprover", checked)
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                  )}
                  {isVisible("contracerApproverApprove") && (
                  <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {getLabel("contracerApproverApprove", "Contracer Approver")}
                        {isRequired("contracerApproverApprove") && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <Label
                        htmlFor="contracerApprover"
                        className="text-sm font-normal text-gray-900 cursor-pointer block"
                      >
                        Allow approving contractor applications
                      </Label>
                    </div>
                    <SwitchToggle
                      id="contracerApprover"
                      checked={!!permissions.hrapprover?.contracerApprover?.permissions?.approve}
                      onCheckedChange={(checked) =>
                        handlePermissionChange("contracerApprover", checked)
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {!isReadOnly && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <ActionButtons
              layout="end"
              gap="gap-3"
              secondaryLabel="Reset"
              onSecondary={() => {
                reset({ ...emptyValues })
              }}
              primaryLabel="Save Changes"
              onPrimary={() => setShowConfirm(true)}
              primaryLoading={postLoading}
              primaryDisabled={postLoading}
              className="w-full"
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            />
          </div>
        )}
      </div>
    </div>
  )
}
