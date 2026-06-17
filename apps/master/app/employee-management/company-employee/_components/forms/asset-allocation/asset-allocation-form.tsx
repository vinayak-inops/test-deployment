"use client"

import { useEffect, useMemo, useState } from "react"
import { gql, useQuery } from "@apollo/client"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { X, Package } from "lucide-react"
import { SingleSelectField } from "@/components/fields/single-select-field"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_ASSET_ALLOCATION,
  createAssetAllocationItemSchema,
  normalizeAssetAllocationConfig,
  type AssetAllocationAssetFieldKey,
  type AssetAllocationConfig,
  type AssetAllocationRootFieldKey,
  type AssetAllocationItem,
} from "../../schemas/asset-allocation-form-schema"

interface AssetAllocationFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: AssetAllocationItem | null
  onSubmit: (values: AssetAllocationItem[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  assetAllocated: AssetAllocationItem[]
  editIndex: number | null
  refetchAssets?: () => Promise<void> | void
  isViewMode?: boolean
}

type AssetMasterOption = {
  assetCode?: string
  assetName?: string
}
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

const FETCH_ORGANIZATION_ASSET_MASTER_QUERY = gql`
  query FetchOrganizationAssetMaster($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      assetMaster {
        assetTypes
        assets {
          assetCode
          assetName
          assetType
        }
      }
    }
  }
`

export function AssetAllocationFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode: tenantCodeProp,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  assetAllocated,
  editIndex,
  refetchAssets,
  isViewMode = false,
}: AssetAllocationFormPopupProps) {
  const [form, setForm] = useState<AssetAllocationItem>({ ...EMPTY_ASSET_ALLOCATION })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingAssets, setPendingAssets] = useState<AssetAllocationItem[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const tenantCodeHook = useGetTenantCode()
  const tenantCode = tenantCodeProp || tenantCodeHook
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const assetAllocationConfig = useMemo(
    () =>
      normalizeAssetAllocationConfig(
        formStructure?.assetAllocations as AssetAllocationConfig | undefined
      ),
    [formStructure]
  )
  const assetAllocationItemSchema = useMemo(
    () => createAssetAllocationItemSchema(assetAllocationConfig),
    [assetAllocationConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = assetAllocationConfig.fields
    const assetFields = assetAllocationConfig.asset.fields
    return (fieldPath: string): boolean => {
      switch (fieldPath) {
        case "asset.assetCode":
          return assetFields.assetCode?.required ?? true
        case "asset.assetName":
          return assetFields.assetName?.required ?? true
        case "asset.assetType.assetTypeTitle":
          return Boolean(assetFields.assetTypeTitle?.required)
        case "issueDate":
          return Boolean(fields.issueDate?.required)
        case "returnDate":
          return Boolean(fields.returnDate?.required)
        default:
          return false
      }
    }
  }, [assetAllocationConfig])
  const isRootVisible = useMemo(() => {
    const fields = assetAllocationConfig.fields
    return (field: AssetAllocationRootFieldKey): boolean => fields[field]?.visible ?? true
  }, [assetAllocationConfig])
  const isAssetVisible = useMemo(() => {
    const fields = assetAllocationConfig.asset.fields
    return (field: AssetAllocationAssetFieldKey): boolean => fields[field]?.visible ?? true
  }, [assetAllocationConfig])
  const getRootLabel = useMemo(() => {
    const fields = assetAllocationConfig.fields
    return (field: AssetAllocationRootFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [assetAllocationConfig])
  const getAssetLabel = useMemo(() => {
    const fields = assetAllocationConfig.asset.fields
    return (field: AssetAllocationAssetFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [assetAllocationConfig])
  const showAssetInfoSection =
    isAssetVisible("assetCode") ||
    isAssetVisible("assetName") ||
    isAssetVisible("assetTypeTitle") ||
    isRootVisible("issueDate") ||
    isRootVisible("returnDate")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_ASSET_ALLOCATION })
      setErrors({})
      setPendingAssets(null)
    }
  }, [open, initialValue])

  const { data: organizationResponse } = useQuery(FETCH_ORGANIZATION_ASSET_MASTER_QUERY, {
    variables: {
      criteriaRequests: [{ field: "tenantCode", operator: "eq", value: tenantCode }],
      collection: "organization",
    },
    skip: !tenantCode,
    client,
  })

  const { assets, assetTypes } = useMemo(() => {
    const organizations = organizationResponse?.fetchOrganization
    const firstOrganization = Array.isArray(organizations) && organizations.length > 0 ? organizations[0] : null
    const firstMaster = firstOrganization?.assetMaster || null
    return {
      assets: Array.isArray(firstMaster?.assets) ? firstMaster.assets : [],
      assetTypes: Array.isArray(firstMaster?.assetTypes) ? firstMaster.assetTypes : [],
    }
  }, [organizationResponse])

  const assetOptions = useMemo(
    () =>
      assets.map((item: AssetMasterOption) => ({
        value: item.assetCode || "",
        label: `${item.assetCode || ""} - ${item.assetName || ""}`,
        tooltip: `${item.assetCode || ""} - ${item.assetName || ""}`,
      })),
    [assets]
  )
  const { post: postAssetAllocation, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): string | null => {
          const fieldMap: Record<string, string> = {
            issueDate: "issueDate",
            returnDate: "returnDate",
            asset: "asset",
            assetCode: "asset.assetCode",
            assetName: "asset.assetName",
            assetTypeCode: "asset.assetType.assetTypeCode",
            assetTypeTitle: "asset.assetType.assetTypeTitle",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("assetAllocated.")) {
            const parts = fieldName.split(".")
            const idx = parts.findIndex((p) => p === "asset")
            if (idx >= 0) {
              return parts.slice(idx).join(".")
            }
            const key = parts[parts.length - 1] ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Record<string, string> = {}
        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
            if (typeof message !== "string" || !message.trim()) return
            const normalizedField = normalizeServerField(fieldName)
            if (!normalizedField) return
            nextErrors[normalizedField] = message
          })
        }
        setErrors(nextErrors)
        return
      }

      toast.success("Asset allocation saved successfully!")
      if (pendingAssets) {
        onSubmit(pendingAssets)
      }
      setPendingAssets(null)
      await refetchAssets?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving asset allocation:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || isViewMode || postLoading) return
    const result = assetAllocationItemSchema.safeParse(form)
    if (!result.success) {
      const err: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".")
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})
    const payloadAsset = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_ASSET_ALLOCATION,
      ...result.data,
    } as AssetAllocationItem
    const parseId = (payloadAsset as Record<string, any>)?.parseID
    const next =
      parseId
        ? assetAllocated.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadAsset : row
          )
        : editIndex !== null
          ? assetAllocated.map((row, index) => (index === editIndex ? payloadAsset : row))
          : [...assetAllocated, payloadAsset]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetAssetAllocationTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        assetAllocated: [payloadAsset],
        ...(shouldSetAssetAllocationTab ? { assetAllocationstab: true } : {}),
      },
      audit: auditPayload,
    }
    setPendingAssets(next)
    postAssetAllocation(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialValue !== null ? "Edit Asset Allocation" : "Allocate Asset"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Fill asset details and allocation dates.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {shouldShowConfigLoader ? (
            <div className="py-8 text-center text-sm text-gray-600">
              Loading form configuration...
            </div>
          ) : (
            <>
          {showAssetInfoSection && (
            <div className="space-y-3">
              <SubFormTitle title="Asset Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isAssetVisible("assetCode") && (
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <SingleSelectField
                      id="asset-code"
                      label={`${getAssetLabel("assetCode", "Asset Code")}${isRequired("asset.assetCode") ? " *" : ""}`}
                      placeholder="Search Asset Code"
                      disabled={isViewMode || postLoading}
                      value={form.asset?.assetCode || ""}
                      onChange={(value) => {
                        const selected = assets.find((item: AssetMasterOption) => item.assetCode === value)
                        setForm((prev) => ({
                          ...prev,
                          asset: {
                            ...prev.asset,
                            assetCode: value,
                            assetName: selected?.assetName || "",
                          },
                        }))
                        if (errors["asset.assetCode"]) {
                          setErrors((prev) => ({ ...prev, "asset.assetCode": "" }))
                        }
                        if (errors["asset.assetName"]) {
                          setErrors((prev) => ({ ...prev, "asset.assetName": "" }))
                        }
                        if (errors.asset) {
                          setErrors((prev) => ({ ...prev, asset: "" }))
                        }
                      }}
                      options={assetOptions}
                      showOnlyValueInTrigger
                      allowOnlyProvidedOptions
                      className="space-y-2"
                      errorMessage={errors["asset.assetCode"]}
                    />
                    {(errors["asset.assetCode"] || errors["asset.assetName"] || errors.asset) && (
                      <p className="text-red-500 text-xs">
                        {errors["asset.assetCode"] || errors["asset.assetName"] || errors.asset}
                      </p>
                    )}
                  </div>
                )}

                {isAssetVisible("assetName") && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getAssetLabel("assetName", "Asset Name")} {isRequired("asset.assetName") && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="h-9 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 flex items-center">
                      {form.asset?.assetName || "Will auto-fill from asset code"}
                    </div>
                  </div>
                )}

                {isAssetVisible("assetTypeTitle") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getAssetLabel("assetTypeTitle", "Asset Type")} {isRequired("asset.assetType.assetTypeTitle") && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={form.asset?.assetType?.assetTypeTitle || ""}
                      disabled={isViewMode || postLoading}
                      onValueChange={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          asset: {
                            ...prev.asset,
                            assetType: { ...prev.asset.assetType, assetTypeTitle: value },
                          },
                        }))
                        if (errors["asset.assetType.assetTypeTitle"]) {
                          setErrors((prev) => ({ ...prev, "asset.assetType.assetTypeTitle": "" }))
                        }
                      }}
                    >
                      <SelectTrigger className={INPUT_CLASS}>
                        <SelectValue placeholder="Select Asset Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetTypes.length > 0 ? (
                          assetTypes.map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-data" disabled>
                            No asset types available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors["asset.assetType.assetTypeTitle"] && (
                      <p className="text-red-500 text-xs">{errors["asset.assetType.assetTypeTitle"]}</p>
                    )}
                  </div>
                )}

                {isRootVisible("issueDate") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getRootLabel("issueDate", "Issue Date")} {isRequired("issueDate") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="date"
                      value={form.issueDate || ""}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, issueDate: e.target.value }))
                        if (errors.issueDate) setErrors((prev) => ({ ...prev, issueDate: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={isViewMode || postLoading}
                    />
                    {errors.issueDate && <p className="text-red-500 text-xs">{errors.issueDate}</p>}
                  </div>
                )}

                {isRootVisible("returnDate") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getRootLabel("returnDate", "Return Date")} {isRequired("returnDate") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="date"
                      value={form.returnDate || ""}
                      min={form.issueDate || undefined}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, returnDate: e.target.value }))
                        if (errors.returnDate) setErrors((prev) => ({ ...prev, returnDate: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={isViewMode || postLoading}
                    />
                    {errors.returnDate && <p className="text-red-500 text-xs">{errors.returnDate}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
          {showAssetInfoSection && <Separator />}
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
            disabled={isViewMode || shouldShowConfigLoader || postLoading}
          >
            {initialValue !== null ? "Save" : "Allocate Asset"}
          </Button>
        </div>
      </div>
    </div>
  )
}
