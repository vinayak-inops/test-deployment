"use client"

import React, { useEffect, useMemo, useState } from "react"
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
  createDefaultExcelUploadData,
  createExcelUploadSchema,
  type ExcelUploadPermissionData,
} from "./excel-upload-schema"


interface ExcelUploadFormProps {
  onSave?: (data: ExcelUploadPermissionData) => void
  mode?: "add" | "edit" | "view"
  recordId?: string | null
}

type PermissionVisibilityConfig = {
  label?: string
  visible?: boolean
}

type ExcelUploadFormStructure = {
  label?: string
  title?: string
  subtitle?: string
  description?: string
  sectionTitle?: string
  confirmTitle?: string
  confirmDescription?: string
  confirmBody?: string
  excelFileManager?: {
    label?: string
    rowLabel?: string
    permissions?: Record<string, PermissionVisibilityConfig>
  }
  fields?: {
    excelFileManager?: {
      label?: string
      rowLabel?: string
      fields?: {
        permissions?: {
          fields?: Record<string, PermissionVisibilityConfig>
        }
      }
    }
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

export default function ExcelUploadForm({
  onSave,
  mode = "add",
  recordId = null,
}: ExcelUploadFormProps) {
  const searchParams = useSearchParams()
  const modeView = searchParams.get("mode")
  const formParam = searchParams.get("form")
  const isExcelUploadTabOpen = formParam === "excelUpload"
  const entitlementCode = searchParams.get("entitlementCode") || undefined
  const tenantCode = useGetTenantCode()
  const { formStructure } = useCollectionFormStructure({
    collectionName: "role_permission_form_structure",
  })
  // Role-based permissions for this page (centralized under Role & Permissions)
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName: "rolePermissions",
  })

  const editMode = modeView !== "permissionview" ? rolePermissions?.edit : false
  const addMode = modeView !== "permissionview" ? rolePermissions?.add : false

  const resolvedFormStructure = useMemo(() => {
    const root = getObjectValue(formStructure)
    if (!root) return {} as ExcelUploadFormStructure

    const candidate =
      pickFirstObject(
        root.excelUpload,
        getObjectValue(root.setting)?.excelUpload,
      ) || root

    return candidate as ExcelUploadFormStructure
  }, [formStructure])

  const excelFileManagerConfig =
    resolvedFormStructure.fields?.excelFileManager || resolvedFormStructure.excelFileManager
  const fields =
    resolvedFormStructure.fields?.excelFileManager?.fields?.permissions?.fields ||
    resolvedFormStructure.excelFileManager?.permissions ||
    {}
  const hasExcelFileManagerConfig = Boolean(excelFileManagerConfig)
  const getFieldLabel = (key: "excelUpload", fallback: string) =>
    fields[key]?.label || fallback
  const isFieldVisible = (key: "excelUpload") =>
    hasExcelFileManagerConfig && !!fields[key] && fields[key]?.visible === true
  const isReadOnly = mode === "view" || (!editMode && !addMode)

  const normalizeRecordId = (value: unknown): string | null => {
    if (!value) return null
    if (typeof value === "string") return value
    if (typeof value === "object" && value !== null && "$oid" in value) {
      return String((value as { $oid: string }).$oid)
    }
    return String(value)
  }

  const [permissions, setPermissions] = useState<ExcelUploadPermissionData>(createDefaultExcelUploadData())
  const [fetchedRecordId, setFetchedRecordId] = useState<string | null>(recordId ?? null)
  const [showConfirm, setShowConfirm] = useState(false)

  const normalizeExcelUpload = (source: any): ExcelUploadPermissionData => {
    const nested = source?.excelUpload?.excelFileManager ?? source?.excelUpload?.modules?.excelFileManager
    if (nested) {
      const value = !!nested?.permissions?.excelUpload
      return {
        excelUpload: {
          isActive: value,
          excelFileManager: {
            permissions: { excelUpload: value },
            isActive: value,
          },
        },
        isActive: value,
      }
    }

    if (typeof source?.excelUpload === "boolean") {
      const value = !!source.excelUpload
      return {
        excelUpload: {
          isActive: value,
          excelFileManager: {
            permissions: { excelUpload: value },
            isActive: value,
          },
        },
        isActive: value,
      }
    }

    const excelUploadScreens = source?.screenPermissions?.find((sp: any) => sp?.serviceName === "excel-upload")?.screens ?? []
    const excelFileManager = Array.isArray(excelUploadScreens)
      ? excelUploadScreens.find((s: any) => s?.screenName === "excelFileManager")?.permissions || {}
      : {}
    const screenValue = !!excelFileManager?.excelUpload
    return {
      excelUpload: {
        isActive: screenValue,
        excelFileManager: {
          permissions: { excelUpload: screenValue },
          isActive: screenValue,
        },
      },
      isActive: screenValue,
    }
  }

  useEffect(() => {
    setFetchedRecordId(recordId ?? null)
  }, [recordId])

  const [loading, setLoading] = useState(false)
  const { post: postExcelUpload, loading: postLoading } = usePostRequest<any>({
    url: "role_permissions",
    onSuccess: async () => {
      toast.success("Excel upload permissions saved successfully!")
      await onSave?.(permissions)
    },
    onError: (error) => {
      console.error("Error saving excel upload permissions:", error)
      toast.error("Failed to save excel upload permissions!")
    },
  })

  const searchPayload = recordId
    ? [
        { field: "_id", value: recordId, operator: "eq" },
      ]
    : [
        { field: "tenantCode", value: tenantCode, operator: "eq" },
        { field: "entitlementCode", value: entitlementCode, operator: "eq" },
        { field: "createdOn", value: "", operator: "desc" },
      ]

  const { refetch: refetchExcelUpload } = useRequest<any>({
    url: "role_permissions/search",
    method: "POST",
    data: searchPayload,
    dependencies: [tenantCode, entitlementCode, recordId, isExcelUploadTabOpen],
    onSuccess: (response) => {
      if (!isExcelUploadTabOpen) return
      const list = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [response]

      const raw = list[0]
      if (!raw) {
        setFetchedRecordId(null)
        return
      }

      setFetchedRecordId(normalizeRecordId(raw?._id))
      setPermissions(normalizeExcelUpload(raw))
    },
    onError: (error) => {
      if (!isExcelUploadTabOpen) return
      console.error("Error fetching excel upload permissions:", error)
    },
  })

  const handlePermissionChange = (value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      excelUpload: {
        isActive: value,
        excelFileManager: {
          permissions: { excelUpload: value },
          isActive: value,
        },
      },
      isActive: value,
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (!tenantCode || !entitlementCode) {
        toast.error("Missing tenantCode or entitlementCode")
        return
      }

      const isExcelUploadEnabled = !!permissions.excelUpload?.excelFileManager?.permissions?.excelUpload
      const isActive = isExcelUploadEnabled
      const payloadData: ExcelUploadPermissionData = {
        excelUpload: {
          isActive,
          excelFileManager: {
            permissions: { excelUpload: isExcelUploadEnabled },
            isActive,
          },
        },
        isActive,
      }

      const schema = createExcelUploadSchema()
      const validated = schema.safeParse(payloadData)
      if (!validated.success) {
        toast.error("Invalid excel upload payload")
        return
      }

      const resolvedRecordId = recordId || fetchedRecordId
      const isEditMode = Boolean(resolvedRecordId)
      await postExcelUpload({
        tenant: tenantCode,
        action: isEditMode ? "update" : "insert",
        ...(isEditMode ? { id: resolvedRecordId } : {}),
        collectionName: "role_permissions",
        data: {
          ...(entitlementCode ? { entitlementCode } : {}),
          tenantCode: tenantCode || "",
          excelUpload: validated.data.excelUpload,
          isActive: validated.data.isActive,
        },
      })
      await refetchExcelUpload?.()
    } catch (error) {
      console.error("Error saving excel upload permissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatPermissionLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  // Custom Switch Toggle Component - blue
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      <RolePermissionConfirmModal
        open={showConfirm}
        isReadOnly={isReadOnly}
        postLoading={loading || postLoading}
        title={resolvedFormStructure.confirmTitle || "Confirm Excel Upload Permission Change"}
        description={
          resolvedFormStructure.confirmDescription ||
          "You are updating excel upload permissions. This can impact user access."
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
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Shield className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {resolvedFormStructure.label || "Excel Upload Permissions"}
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {resolvedFormStructure.description ||
                  resolvedFormStructure.subtitle ||
                  "Manage excel file upload permissions and access controls"}
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
                  {resolvedFormStructure.sectionTitle ||
                    resolvedFormStructure.title ||
                    excelFileManagerConfig?.label ||
                    "Excel File Manager"}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {isFieldVisible("excelUpload") && (
                  <div className="group relative flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        {getFieldLabel("excelUpload", formatPermissionLabel("excelUpload"))}
                      </div>
                      <label
                        htmlFor="excelUpload"
                        className="text-sm font-normal text-gray-900 cursor-pointer block"
                      >
                        Allow uploading excel files
                      </label>
                    </div>
                    <SwitchToggle
                      id="excelUpload"
                      checked={!!permissions.excelUpload?.excelFileManager?.permissions?.excelUpload}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(checked)
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
                setPermissions({
                  excelUpload: {
                    isActive: false,
                    excelFileManager: {
                      permissions: { excelUpload: false },
                      isActive: false,
                    },
                  },
                  isActive: false,
                })
              }}
              primaryLabel="Save Changes"
              onPrimary={() => setShowConfirm(true)}
              primaryLoading={loading || postLoading}
              primaryDisabled={loading || postLoading}
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
