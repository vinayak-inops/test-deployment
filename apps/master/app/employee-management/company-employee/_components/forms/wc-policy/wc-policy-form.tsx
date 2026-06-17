"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { X, Shield } from "lucide-react"
import { SingleSelectField } from "@/components/fields/single-select-field"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_WC_POLICY,
  createWCPolicyItemSchema,
  normalizeWCPolicyConfig,
  type WCPolicyConfig,
  type WCPolicyFieldKey,
  type WCPolicyItem,
} from "../../schemas/wc-policy-form-schema"
import { useWorkOrderContractorFromEmployee } from "../workorder/hooks/use-workorder-contractor-from-employee"

interface WCPolicyFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: WCPolicyItem | null
  onSubmit: (values: WCPolicyItem[]) => void
  isViewMode?: boolean
  disabled?: boolean
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  wcPolicies: WCPolicyItem[]
  editIndex: number | null
  refetchPolicies?: () => Promise<void> | void
}
type WCPolicyFormField =
  | "WCPolicyNumber"
  | "policyNumber"
  | "policyCompanyName"
  | "policyStartDate"
  | "policyExpiryDate"
  | "maximumWorkmen"
  | "isActive"

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function WCPolicyFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  isViewMode = false,
  disabled = false,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  wcPolicies,
  editIndex,
  refetchPolicies,
}: WCPolicyFormPopupProps) {
  const [form, setForm] = useState<WCPolicyItem>({ ...EMPTY_WC_POLICY })
  const [errors, setErrors] = useState<Partial<Record<WCPolicyFormField, string>>>({})
  const [pendingPolicies, setPendingPolicies] = useState<WCPolicyItem[] | null>(null)
  const auditEntityId = String(employeeRecordId)
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const wcPolicyConfig = useMemo(
    () =>
      normalizeWCPolicyConfig(
        formStructure?.wcPolicies as WCPolicyConfig | undefined
      ),
    [formStructure]
  )
  const wcPolicyItemSchema = useMemo(
    () => createWCPolicyItemSchema(wcPolicyConfig),
    [wcPolicyConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = wcPolicyConfig.fields
    return (field: WCPolicyFieldKey): boolean => {
      if (field === "WCPolicyNumber") return fields.WCPolicyNumber?.required ?? true
      if (field === "isActive") return Boolean(fields.isActive?.required)
      return Boolean(fields[field]?.required)
    }
  }, [wcPolicyConfig])
  const isVisible = useMemo(() => {
    const fields = wcPolicyConfig.fields
    return (field: WCPolicyFieldKey): boolean => fields[field]?.visible ?? true
  }, [wcPolicyConfig])
  const getLabel = useMemo(() => {
    const fields = wcPolicyConfig.fields
    return (field: WCPolicyFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [wcPolicyConfig])
  const showSelectionSection = isVisible("WCPolicyNumber") || isVisible("isActive")
  const showDetailsSection =
    isVisible("policyCompanyName") ||
    isVisible("maximumWorkmen") ||
    isVisible("policyStartDate") ||
    isVisible("policyExpiryDate")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_WC_POLICY })
      setErrors({})
      setPendingPolicies(null)
    }
  }, [open, initialValue])

  const { contractorCode } = useWorkOrderContractorFromEmployee({
    currentMode: mode,
    employeeRecordId,
  })

  const contractorCriteriaRequests = useMemo(
    () => [
      ...(contractorCode ? [{ field: "contractorCode", operator: "eq", value: contractorCode }] : []),
      ...(tenantCode ? [{ field: "tenantCode", operator: "eq", value: tenantCode }] : []),
    ],
    [contractorCode, tenantCode]
  )

  const { arrayData: wcPolicyData } = useAggregateArrayFetch<any>({
    collection: "contractor",
    criteriaRequests: contractorCriteriaRequests,
    arrayField: "wcPolicies",
    enabled: Boolean(contractorCode),
    defaultValue: [],
  })
  const { post: postWcPolicy, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): WCPolicyFormField | null => {
          const fieldMap: Record<string, WCPolicyFormField> = {
            WCPolicyNumber: "WCPolicyNumber",
            policyNumber: "policyNumber",
            policyCompanyName: "policyCompanyName",
            policyStartDate: "policyStartDate",
            policyExpiryDate: "policyExpiryDate",
            maximumWorkmen: "maximumWorkmen",
            isActive: "isActive",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("wcPolicies.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Partial<Record<WCPolicyFormField, string>> = {}
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

      toast.success("WC policy saved successfully!")
      if (pendingPolicies) {
        onSubmit(pendingPolicies)
      }
      setPendingPolicies(null)
      await refetchPolicies?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving WC policy:", error)
    },
  })

  const policyOptions = useMemo(
    () =>
      (wcPolicyData ?? []).map((policy: any) => ({
        value: policy.policyNumber || "",
        label: policy.policyNumber || "",
        tooltip: policy.policyNumber || "",
      })),
    [wcPolicyData]
  )

  const handleSubmit = () => {
    if (shouldShowConfigLoader || postLoading || disabled || isViewMode) return
    const result = wcPolicyItemSchema.safeParse(form)
    if (!result.success) {
      const err: Partial<Record<WCPolicyFormField, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".") as WCPolicyFormField
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})
    const normalized = {
      ...EMPTY_WC_POLICY,
      ...result.data,
    }
    const payloadPolicy = {
      ...(initialValue as Record<string, any> | null),
      ...normalized,
    } as WCPolicyItem

    const parseId = (payloadPolicy as Record<string, any>)?.parseID
    const next =
      parseId
        ? wcPolicies.map((policy) =>
            (policy as Record<string, any>)?.parseID === parseId ? payloadPolicy : policy
          )
        : editIndex !== null
          ? wcPolicies.map((policy, index) => (index === editIndex ? payloadPolicy : policy))
          : [...wcPolicies, payloadPolicy]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetWcPoliciesTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "contractEmployeeWCPolicy",
      audit: auditPayload,
      data: {
        wcPolicies: [payloadPolicy],
        ...(shouldSetWcPoliciesTab ? { wcPoliciestab: true } : {}),
      },
    }
    setPendingPolicies(next)
    postWcPolicy(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialValue !== null ? "Edit WC Policy" : "Add WC Policy"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Select policy and set status.</p>
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
          {showSelectionSection && (
          <div className="space-y-3">
            <SubFormTitle title="Policy Selection" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible("WCPolicyNumber") && (
            <SingleSelectField
              id="wc-policy-number"
              label={`${getLabel("WCPolicyNumber", "WC Policy Number")}${isRequired("WCPolicyNumber") ? " *" : ""}`}
              placeholder="Search WC Policy Number"
              disabled={isViewMode || disabled || postLoading}
              value={form.WCPolicyNumber || ""}
              onChange={(value) => {
                const selectedPolicy = wcPolicyData?.find((policy: any) => policy.policyNumber === value)
                if (!selectedPolicy) {
                  setForm((prev) => ({
                    ...prev,
                    WCPolicyNumber: value,
                    policyNumber: value,
                    policyCompanyName: "",
                    policyStartDate: "",
                    policyExpiryDate: "",
                    maximumWorkmen: 0,
                  }))
                  return
                }
                setForm((prev) => ({
                  ...prev,
                  WCPolicyNumber: value,
                  policyNumber: selectedPolicy.policyNumber ?? value,
                  policyCompanyName: selectedPolicy.companyName ?? selectedPolicy.policyCompanyName ?? "",
                  policyStartDate: selectedPolicy.policyStartDate ?? selectedPolicy.startDate ?? "",
                  policyExpiryDate: selectedPolicy.policyExpiryDate ?? selectedPolicy.expiryDate ?? "",
                  maximumWorkmen:
                    typeof selectedPolicy.maximumWorkmen === "string"
                      ? parseInt(selectedPolicy.maximumWorkmen, 10) || 0
                      : (selectedPolicy.maximumWorkmen ?? 0),
                  isActive: prev.isActive ?? true,
                }))
                if (errors.WCPolicyNumber) {
                  setErrors((prev) => ({ ...prev, WCPolicyNumber: "" }))
                }
              }}
              options={policyOptions}
              showOnlyValueInTrigger
              allowOnlyProvidedOptions
              className="space-y-2"
              errorMessage={errors.WCPolicyNumber}
            />
            )}

            {isVisible("isActive") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("isActive", "Status")}
                {isRequired("isActive") && <span className="text-red-500"> *</span>}
              </Label>
              <select
                className={`w-full rounded-md px-2 ${INPUT_CLASS}`}
                disabled={isViewMode || disabled || postLoading}
                value={form.isActive ? "active" : "inactive"}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, isActive: e.target.value === "active" }))
                  if (errors.isActive) {
                    setErrors((prev) => ({ ...prev, isActive: "" }))
                  }
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.isActive && <p className="text-red-500 text-xs">{errors.isActive}</p>}
            </div>
            )}
          </div>
          </div>
          )}

          {showSelectionSection && showDetailsSection ? <Separator /> : null}

          {showDetailsSection && (
          <div className="space-y-3">
            <SubFormTitle title="Policy Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible("policyCompanyName") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("policyCompanyName", "Company Name")}
              </Label>
              <Input value={form.policyCompanyName || ""} className={`${INPUT_CLASS} bg-gray-100 cursor-not-allowed`} disabled />
              {errors.policyCompanyName && <p className="text-red-500 text-xs">{errors.policyCompanyName}</p>}
            </div>
            )}
            {isVisible("maximumWorkmen") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("maximumWorkmen", "Maximum Workmen")}
              </Label>
              <Input value={form.maximumWorkmen ?? ""} className={`${INPUT_CLASS} bg-gray-100 cursor-not-allowed`} disabled />
              {errors.maximumWorkmen && <p className="text-red-500 text-xs">{errors.maximumWorkmen}</p>}
            </div>
            )}
            {isVisible("policyStartDate") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("policyStartDate", "Start Date")}
              </Label>
              <Input value={form.policyStartDate || ""} className={`${INPUT_CLASS} bg-gray-100 cursor-not-allowed`} disabled />
              {errors.policyStartDate && <p className="text-red-500 text-xs">{errors.policyStartDate}</p>}
            </div>
            )}
            {isVisible("policyExpiryDate") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("policyExpiryDate", "Expiry Date")}
              </Label>
              <Input value={form.policyExpiryDate || ""} className={`${INPUT_CLASS} bg-gray-100 cursor-not-allowed`} disabled />
              {errors.policyExpiryDate && <p className="text-red-500 text-xs">{errors.policyExpiryDate}</p>}
            </div>
            )}
          </div>
          </div>
          )}
            </>
          )}

          {errors.policyNumber && <p className="text-red-500 text-xs">{errors.policyNumber}</p>}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
            disabled={isViewMode || shouldShowConfigLoader || disabled || postLoading}
          >
            {initialValue !== null ? "Save" : "Add WC Policy"}
          </Button>
        </div>
      </div>
    </div>
  )
}
