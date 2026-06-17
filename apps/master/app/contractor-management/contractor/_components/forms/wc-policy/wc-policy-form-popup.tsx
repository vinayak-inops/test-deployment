"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { FileCheck, X } from "lucide-react"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import {
  EMPTY_WC_POLICY,
  createWCPolicySchema,
  normalizeWCPolicyConfig,
  type WCPolicy,
  type WCPolicyFieldsConfig,
  type WCPolicyRootConfig,
  convertToInputDate,
  convertToBackendDate,
} from "../../schemas/wc-policy-form-schema"
import { useDynamicSchemaConfig } from "../../hooks/useDynamicSchemaConfig"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

interface WCPolicyFormPopupProps {
  open: boolean
  onClose: () => void
  initialPolicy: WCPolicy | null
  onSubmit: (policies: WCPolicy[]) => void
  onSaved?: () => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  policies: WCPolicy[]
  editIndex: number | null
  refetchPolicies?: () => Promise<void> | void
  disabled?: boolean
}
type WCPolicyFormField =
  | "policyNumber"
  | "policyStartDate"
  | "policyExpiryDate"
  | "policyCompanyName"
  | "maximumWorkmen"

function toPayloadPolicy(row: WCPolicy) {
  return {
    parseID: row.parseID || undefined,
    policyNumber: row.policyNumber || "",
    policyStartDate: convertToBackendDate(row.policyStartDate),
    policyExpiryDate: convertToBackendDate(row.policyExpiryDate),
    policyCompanyName: row.policyCompanyName || "",
    maximumWorkmen: Number(row.maximumWorkmen || 0),
  }
}

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function WCPolicyFormPopup({
  open,
  onClose,
  initialPolicy,
  onSubmit,
  onSaved,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  policies,
  editIndex,
  refetchPolicies,
  disabled = false,
}: WCPolicyFormPopupProps) {
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contractor_form_strcture",
  })

  const wcPolicyTabConfig = useMemo(
    () =>
      normalizeWCPolicyConfig(
        formStructure?.wcPolicy as WCPolicyFieldsConfig | WCPolicyRootConfig | undefined
      ),
    [formStructure]
  )

  const wcPolicySchemaDef = useMemo(
    () => createWCPolicySchema(wcPolicyTabConfig),
    [wcPolicyTabConfig]
  )

  const { schema: wcPolicySchema, isRequired, isVisible, getLabel } = useDynamicSchemaConfig({
    schema: wcPolicySchemaDef,
    fieldConfig: wcPolicyTabConfig,
    emptyValues: EMPTY_WC_POLICY,
    defaultRequired: {
      policyNumber: true,
      policyStartDate: true,
      policyExpiryDate: true,
      policyCompanyName: true,
      maximumWorkmen: true,
    },
  })
  const [form, setForm] = useState<WCPolicy>({ ...EMPTY_WC_POLICY })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingPolicies, setPendingPolicies] = useState<WCPolicy[] | null>(null)
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const showPolicyInformationSection =
    isVisible("policyNumber") ||
    isVisible("policyCompanyName") ||
    isVisible("policyStartDate") ||
    isVisible("policyExpiryDate")
  const showCoverageDetailsSection = isVisible("maximumWorkmen")

  useEffect(() => {
    if (open) {
      const initial = initialPolicy
        ? {
            parseID: initialPolicy.parseID || undefined,
            policyNumber: initialPolicy.policyNumber || "",
            policyStartDate: convertToInputDate(initialPolicy.policyStartDate) || initialPolicy.policyStartDate,
            policyExpiryDate: convertToInputDate(initialPolicy.policyExpiryDate) || initialPolicy.policyExpiryDate,
            policyCompanyName: initialPolicy.policyCompanyName || "",
            maximumWorkmen: initialPolicy.maximumWorkmen ?? 0,
          }
        : { ...EMPTY_WC_POLICY }
      setForm(initial)
      setErrors({})
      setPendingPolicies(null)
    }
  }, [open, initialPolicy])

  const { post: postContractor, loading: postLoading } = usePostRequest<any>({
    url: contractorCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): WCPolicyFormField | null => {
          const fieldMap: Record<string, WCPolicyFormField> = {
            policyNumber: "policyNumber",
            policyStartDate: "policyStartDate",
            policyExpiryDate: "policyExpiryDate",
            policyCompanyName: "policyCompanyName",
            maximumWorkmen: "maximumWorkmen",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("wcPolicies.")) {
            const key = fieldName.split(".").pop() ?? ""
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

      toast.success("Contractor data saved successfully!")
      if (pendingPolicies) {
        onSubmit(pendingPolicies)
      }
      setPendingPolicies(null)
      await refetchPolicies?.()
      onSaved?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving contractor data:", error)
    },
  })

  const update = (field: keyof WCPolicy, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleSubmit = () => {
    if (shouldShowConfigLoader || postLoading) return
    const result = wcPolicySchema.safeParse(form)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>
      const err: Record<string, string> = {}
      Object.entries(fieldErrors).forEach(([k, v]) => {
        err[k] = Array.isArray(v) ? v[0] : String(v)
      })
      setErrors(err)
      return
    }
    setErrors({})
    const payload: WCPolicy = {
      ...EMPTY_WC_POLICY,
      parseID: (initialPolicy as Record<string, any> | null)?.parseID,
      ...result.data,
      maximumWorkmen: result.data.maximumWorkmen ?? 0,
    }
    const payloadPolicy = toPayloadPolicy(payload) as WCPolicy
    const parseId = (payloadPolicy as Record<string, any>)?.parseID
    const next =
      parseId
        ? policies.map((policy) =>
            (policy as Record<string, any>)?.parseID === parseId ? payloadPolicy : policy
          )
        : editIndex !== null
          ? policies.map((policy, index) => (index === editIndex ? payloadPolicy : policy))
          : [...policies, payloadPolicy]
    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetWCPolicyTab = employeeSearchUrl === "draft/contractor/search"
    const postPayload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      event: "validate",
      ruleId: "contractorWCPolicy",
      collectionName: "contractor",
      data: {
        wcPolicies: [payloadPolicy],
        ...(shouldSetWCPolicyTab ? { wcPolicytab: true } : {}),
      },
    }
    setPendingPolicies(next)
    postContractor?.(postPayload)
  }

  const handleClose = () => {
    setErrors({})
    setPendingPolicies(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <FileCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialPolicy !== null ? "Edit WC Policy" : "Add WC Policy"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter workmen compensation policy details.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {shouldShowConfigLoader ? (
            <div className="py-12 text-center text-sm text-gray-600">
              Loading form configuration...
            </div>
          ) : (
            <>
          {showPolicyInformationSection && (
            <div className="space-y-3">
              <SubFormTitle title="Policy Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isVisible("policyNumber") && (
                <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("policyNumber", "Policy Number")} {isRequired("policyNumber") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.policyNumber}
                  onChange={(e) => update("policyNumber", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter policy number"
                  disabled={disabled}
                />
                {errors.policyNumber && (
                  <p className="text-red-500 text-xs">{errors.policyNumber}</p>
                )}
              </div>
              )}
              {isVisible("policyCompanyName") && (
                <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("policyCompanyName", "Policy Company Name")} {isRequired("policyCompanyName") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.policyCompanyName}
                  onChange={(e) => update("policyCompanyName", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter company name"
                  disabled={disabled}
                />
                {errors.policyCompanyName && (
                  <p className="text-red-500 text-xs">{errors.policyCompanyName}</p>
                )}
              </div>
              )}
              {isVisible("policyStartDate") && (
                <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("policyStartDate", "Policy Start Date")} {isRequired("policyStartDate") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="date"
                  value={form.policyStartDate}
                  onChange={(e) => update("policyStartDate", e.target.value)}
                  className={INPUT_CLASS}
                  disabled={disabled}
                />
                {errors.policyStartDate && (
                  <p className="text-red-500 text-xs">{errors.policyStartDate}</p>
                )}
              </div>
              )}
              {isVisible("policyExpiryDate") && (
                <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("policyExpiryDate", "Policy Expiry Date")} {isRequired("policyExpiryDate") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="date"
                  value={form.policyExpiryDate}
                  min={form.policyStartDate || undefined}
                  onChange={(e) => update("policyExpiryDate", e.target.value)}
                  className={INPUT_CLASS}
                  disabled={disabled}
                />
                {errors.policyExpiryDate && (
                  <p className="text-red-500 text-xs">{errors.policyExpiryDate}</p>
                )}
              </div>
              )}
            </div>
          </div>
          )}

          {showPolicyInformationSection && showCoverageDetailsSection && <Separator />}

          {showCoverageDetailsSection && (
            <div className="space-y-3">
              <SubFormTitle title="Coverage Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isVisible("maximumWorkmen") && (
                <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("maximumWorkmen", "Maximum Workmen")} {isRequired("maximumWorkmen") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="number"
                  value={form.maximumWorkmen ?? ""}
                  onChange={(e) => update("maximumWorkmen", e.target.value === "" ? undefined : Number(e.target.value))}
                  className={INPUT_CLASS}
                  placeholder="0"
                  disabled={disabled}
                />
                {errors.maximumWorkmen && (
                  <p className="text-red-500 text-xs">{errors.maximumWorkmen}</p>
                )}
              </div>
              )}
            </div>
          </div>
          )}
            </>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
            disabled={disabled || shouldShowConfigLoader || postLoading}
          >
            {initialPolicy !== null ? "Save" : "Add WC Policy"}
          </Button>
        </div>
      </div>
    </div>
  )
}
