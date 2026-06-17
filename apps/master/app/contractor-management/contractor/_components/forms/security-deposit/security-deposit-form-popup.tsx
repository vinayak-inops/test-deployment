"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { CreditCard, X } from "lucide-react"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import {
  EMPTY_SECURITY_DEPOSIT,
  createSecurityDepositSchema,
  normalizeSecurityDepositConfig,
  type SecurityDeposit,
  type SecurityDepositFieldsConfig,
  type SecurityDepositRootConfig,
  convertToInputDate,
  toBackendDeposit,
} from "../../schemas/security-deposit-form-schema"
import { useDynamicSchemaConfig } from "../../hooks/useDynamicSchemaConfig"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

interface SecurityDepositFormPopupProps {
  open: boolean
  onClose: () => void
  initialDeposit: SecurityDeposit | null
  onSubmit: (deposits: SecurityDeposit[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  securityDeposits: SecurityDeposit[]
  editIndex: number | null
  refetchDeposits?: () => Promise<void> | void
  disabled?: boolean
  onSaved?: () => void
}

type SecurityDepositFormField = "depositDate" | "depositDetail" | "depositAmount"

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function SecurityDepositFormPopup({
  open,
  onClose,
  initialDeposit,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  securityDeposits,
  editIndex,
  refetchDeposits,
  disabled = false,
  onSaved,
}: SecurityDepositFormPopupProps) {
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contractor_form_strcture",
  })

  const normalizedSecurityDepositConfig = useMemo(
    () =>
      normalizeSecurityDepositConfig(
        (formStructure?.securityDeposit as
          | SecurityDepositFieldsConfig
          | SecurityDepositRootConfig
          | undefined) ?? undefined
      ),
    [formStructure]
  )

  const securityDepositSchemaDef = useMemo(
    () =>
      createSecurityDepositSchema({
        tabRequired: normalizedSecurityDepositConfig.tabRequired,
        meta: normalizedSecurityDepositConfig.meta,
        fields: normalizedSecurityDepositConfig.fields,
      }),
    [normalizedSecurityDepositConfig]
  )

  const { schema: securityDepositSchema, isRequired, isVisible, getLabel } = useDynamicSchemaConfig({
    schema: securityDepositSchemaDef,
    fieldConfig: {
      tabRequired: normalizedSecurityDepositConfig.tabRequired,
      fields: normalizedSecurityDepositConfig.fields,
    },
    emptyValues: EMPTY_SECURITY_DEPOSIT,
    defaultRequired: {
      depositDate: true,
      depositDetail: true,
      depositAmount: true,
    },
  })

  const [form, setForm] = useState<SecurityDeposit>({ ...EMPTY_SECURITY_DEPOSIT })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingDeposits, setPendingDeposits] = useState<SecurityDeposit[] | null>(null)
  const showDepositInfoSection = isVisible("depositDate") || isVisible("depositAmount")
  const showAdditionalDetailsSection = isVisible("depositDetail")
  const shouldShowConfigLoader = formStructureLoading || !formStructure

  useEffect(() => {
    if (open) {
      const initial = initialDeposit
        ? {
            parseID: initialDeposit.parseID || undefined,
            depositDate: convertToInputDate(initialDeposit.depositDate) || initialDeposit.depositDate,
            depositDetail: initialDeposit.depositDetail || "",
            depositAmount: initialDeposit.depositAmount ?? 0,
          }
        : { ...EMPTY_SECURITY_DEPOSIT }
      setForm(initial)
      setErrors({})
      setPendingDeposits(null)
    }
  }, [open, initialDeposit])

  const { post: postContractor, loading: postLoading } = usePostRequest<any>({
    url: contractorCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): SecurityDepositFormField | null => {
          const fieldMap: Record<string, SecurityDepositFormField> = {
            depositDate: "depositDate",
            depositDetail: "depositDetail",
            depositAmount: "depositAmount",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("securityDeposit.")) {
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
      if (pendingDeposits) onSubmit(pendingDeposits)
      setPendingDeposits(null)
      await refetchDeposits?.()
      onSaved?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving contractor data:", error)
    },
  })

  const update = (field: keyof SecurityDeposit, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleSubmit = () => {
    if (shouldShowConfigLoader || postLoading) return
    const result = securityDepositSchema.safeParse(form)
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
    const payload: SecurityDeposit = {
      ...EMPTY_SECURITY_DEPOSIT,
      parseID: (initialDeposit as Record<string, any> | null)?.parseID,
      ...result.data,
      depositAmount: result.data.depositAmount ?? 0,
    }
    const payloadDeposit = toBackendDeposit(payload) as SecurityDeposit
    const parseId = (payloadDeposit as Record<string, any>)?.parseID
    const next =
      parseId
        ? securityDeposits.map((deposit) =>
            (deposit as Record<string, any>)?.parseID === parseId ? payloadDeposit : deposit
          )
        : editIndex !== null
          ? securityDeposits.map((deposit, index) => (index === editIndex ? payloadDeposit : deposit))
          : [...securityDeposits, payloadDeposit]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetSecurityDepositTab = employeeSearchUrl === "draft/contractor/search"
    const postPayload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      event: "validate",
      ruleId: "",
      collectionName: "contractor",
      data: {
        securityDeposit: [payloadDeposit],
        ...(shouldSetSecurityDepositTab ? { securityDeposittab: true } : {}),
      },
    }
    setPendingDeposits(next)
    postContractor?.(postPayload)
  }

  const handleClose = () => {
    setErrors({})
    setPendingDeposits(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialDeposit !== null ? "Edit Security Deposit" : "Add Security Deposit"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter deposit details.</p>
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
            <div className="py-12 text-center text-sm text-gray-600">Loading form configuration...</div>
          ) : (
            <>
              {showDepositInfoSection && (
                <div className="space-y-3">
                  <SubFormTitle title="Deposit Information" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isVisible("depositDate") && (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {getLabel("depositDate", "Deposit Date")}{" "}
                          {isRequired("depositDate") && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          type="date"
                          value={form.depositDate}
                          onChange={(e) => update("depositDate", e.target.value)}
                          className={INPUT_CLASS}
                          disabled={disabled}
                        />
                        {errors.depositDate && <p className="text-red-500 text-xs">{errors.depositDate}</p>}
                      </div>
                    )}
                    {isVisible("depositAmount") && (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {getLabel("depositAmount", "Deposit Amount")}{" "}
                          {isRequired("depositAmount") && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          type="number"
                          value={form.depositAmount ?? ""}
                          onChange={(e) =>
                            update("depositAmount", e.target.value === "" ? undefined : Number(e.target.value))
                          }
                          className={INPUT_CLASS}
                          placeholder="0"
                          disabled={disabled}
                        />
                        {errors.depositAmount && <p className="text-red-500 text-xs">{errors.depositAmount}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showDepositInfoSection && showAdditionalDetailsSection && <Separator />}

              {showAdditionalDetailsSection && (
                <div className="space-y-3">
                  <SubFormTitle title="Additional Details" />
                  <div className="grid grid-cols-1 gap-4">
                    {isVisible("depositDetail") && (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {getLabel("depositDetail", "Deposit Detail")}{" "}
                          {isRequired("depositDetail") && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          value={form.depositDetail}
                          onChange={(e) => update("depositDetail", e.target.value)}
                          className={INPUT_CLASS}
                          placeholder="Enter deposit detail"
                          disabled={disabled}
                        />
                        {errors.depositDetail && <p className="text-red-500 text-xs">{errors.depositDetail}</p>}
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
            {initialDeposit !== null ? "Save" : "Add Deposit"}
          </Button>
        </div>
      </div>
    </div>
  )
}
