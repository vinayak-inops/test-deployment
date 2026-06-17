"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { CreditCard, X } from "lucide-react"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import {
  EMPTY_BANK_DETAIL,
  createBankDetailSchema,
  normalizeBankDetailConfig,
  type BankDetailFieldsConfig,
  type BankDetailRootConfig,
  type BankDetail,
} from "../../schemas/bank-detail-form-schema"
import { useDynamicSchemaConfig } from "../../hooks/useDynamicSchemaConfig"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

interface BankDetailFormPopupProps {
  open: boolean
  onClose: () => void
  initialBankDetail: BankDetail | null
  onSubmit: (banks: BankDetail[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  bankDetails: BankDetail[]
  editIndex: number | null
  refetchBankDetails?: () => Promise<void> | void
  disabled?: boolean
  onSaved?: () => void
}
type BankDetailFormField = "bankName" | "branchName" | "micrNo" | "ifscNo" | "bankAccountNo"

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function BankDetailFormPopup({
  open,
  onClose,
  initialBankDetail,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  bankDetails,
  editIndex,
  refetchBankDetails,
  disabled = false,
  onSaved,
}: BankDetailFormPopupProps) {
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contractor_form_strcture",
  })

  const normalizedBankConfig = useMemo(
    () =>
      normalizeBankDetailConfig(
        (formStructure?.bankDetail as BankDetailFieldsConfig | BankDetailRootConfig | undefined) ??
          undefined
      ),
    [formStructure]
  )

  const bankDetailSchema = useMemo(
    () =>
      createBankDetailSchema({
        tabRequired: normalizedBankConfig.tabRequired,
        meta: normalizedBankConfig.meta,
        fields: normalizedBankConfig.fields,
      }),
    [normalizedBankConfig]
  )

  const { isRequired, isVisible, getLabel } = useDynamicSchemaConfig({
    schema: bankDetailSchema,
    fieldConfig: {
      tabRequired: normalizedBankConfig.tabRequired,
      fields: normalizedBankConfig.fields,
    },
    emptyValues: EMPTY_BANK_DETAIL,
    defaultRequired: {
      bankName: true,
      branchName: true,
      micrNo: true,
      ifscNo: true,
      bankAccountNo: true,
    },
  })
  const showBankInformation = isVisible("bankName") || isVisible("branchName")
  const showAccountInformation =
    isVisible("micrNo") || isVisible("ifscNo") || isVisible("bankAccountNo")
  const [form, setForm] = useState<BankDetail>({ ...EMPTY_BANK_DETAIL })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingBanks, setPendingBanks] = useState<BankDetail[] | null>(null)

  useEffect(() => {
    if (open) {
      setForm(initialBankDetail ? { ...initialBankDetail } : { ...EMPTY_BANK_DETAIL })
      setErrors({})
      setPendingBanks(null)
    }
  }, [open, initialBankDetail])

  const { post: postContractor, loading: postLoading } = usePostRequest<any>({
    url: contractorCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): BankDetailFormField | null => {
          const fieldMap: Record<string, BankDetailFormField> = {
            bankName: "bankName",
            branchName: "branchName",
            micrNo: "micrNo",
            ifscNo: "ifscNo",
            bankAccountNo: "bankAccountNo",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("bankDetails.")) {
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
      if (pendingBanks) onSubmit(pendingBanks)
      setPendingBanks(null)
      await refetchBankDetails?.()
      onSaved?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving contractor data:", error)
    },
  })

  const update = (field: keyof BankDetail, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const shouldShowConfigLoader = formStructureLoading || !formStructure

  const handleSubmit = () => {
    if (shouldShowConfigLoader || postLoading) return
    const result = bankDetailSchema.safeParse(form)
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
    const payloadBank: BankDetail = {
      ...EMPTY_BANK_DETAIL,
      parseID: (initialBankDetail as Record<string, any> | null)?.parseID,
      ...result.data,
    }
    const parseId = (payloadBank as Record<string, any>)?.parseID
    const next =
      parseId
        ? bankDetails.map((bank) =>
            (bank as Record<string, any>)?.parseID === parseId ? payloadBank : bank
          )
        : editIndex !== null
          ? bankDetails.map((bank, index) => (index === editIndex ? payloadBank : bank))
          : [...bankDetails, payloadBank]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetBankDetailTab = employeeSearchUrl === "draft/contractor/search"
    const postPayload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      event: "validate",
      ruleId: "",
      collectionName: "contractor",
      data: {
        bankDetails: [payloadBank],
        ...(shouldSetBankDetailTab ? { bankDetailtab: true } : {}),
      },
    }
    setPendingBanks(next)
    postContractor?.(postPayload)
  }

  const handleClose = () => {
    setErrors({})
    setPendingBanks(null)
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
                {initialBankDetail !== null ? "Edit Bank Detail" : "Add Bank Detail"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter bank details.</p>
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
          {showBankInformation && (
          <div className="space-y-3">
            <SubFormTitle title="Bank Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isVisible("bankName") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("bankName", "Bank Name")} {isRequired("bankName") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.bankName}
                  onChange={(e) => update("bankName", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter bank name"
                  disabled={disabled}
                />
                {errors.bankName && <p className="text-red-500 text-xs">{errors.bankName}</p>}
              </div>
              )}
              {isVisible("branchName") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("branchName", "Branch Name")} {isRequired("branchName") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.branchName}
                  onChange={(e) => update("branchName", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter branch name"
                  disabled={disabled}
                />
                {errors.branchName && <p className="text-red-500 text-xs">{errors.branchName}</p>}
              </div>
              )}
            </div>
          </div>
          )}

          {showBankInformation && showAccountInformation && <Separator />}

          {showAccountInformation && (
          <div className="space-y-3">
            <SubFormTitle title="Account Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isVisible("micrNo") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("micrNo", "MICR Number")} {isRequired("micrNo") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.micrNo}
                  onChange={(e) => update("micrNo", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter MICR number"
                  disabled={disabled}
                />
              </div>
              )}
              {isVisible("ifscNo") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("ifscNo", "IFSC Code")} {isRequired("ifscNo") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.ifscNo}
                  onChange={(e) => update("ifscNo", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter IFSC code"
                  disabled={disabled}
                />
                {errors.ifscNo && <p className="text-red-500 text-xs">{errors.ifscNo}</p>}
              </div>
              )}
              {isVisible("bankAccountNo") && (
              <div className="md:col-span-2 space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("bankAccountNo", "Bank Account Number")} {isRequired("bankAccountNo") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.bankAccountNo}
                  onChange={(e) => update("bankAccountNo", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter bank account number"
                  disabled={disabled}
                />
                {errors.bankAccountNo && <p className="text-red-500 text-xs">{errors.bankAccountNo}</p>}
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
            {initialBankDetail !== null ? "Save" : "Add Bank Detail"}
          </Button>
        </div>
      </div>
    </div>
  )
}
