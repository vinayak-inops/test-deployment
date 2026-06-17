"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { Calendar, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_ADVANCE_PAYMENT,
  createAdvancePaymentItemSchema,
  normalizeAdvancePaymentConfig,
  type AdvancePaymentConfig,
  type AdvancePaymentFieldKey,
  type AdvancePaymentItem,
} from "../../schemas/advance-payment-form-schema"

interface AdvancePaymentSectionFormProps {
  open: boolean
  onClose: () => void
  initialValue: AdvancePaymentItem | null
  onSubmit: (values: AdvancePaymentItem[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  advances: AdvancePaymentItem[]
  editIndex: number | null
  refetchAdvancePayments?: () => Promise<void> | void
  disabled?: boolean
}
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function AdvancePaymentSectionForm({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  advances,
  editIndex,
  refetchAdvancePayments,
  disabled = false,
}: AdvancePaymentSectionFormProps) {
  const [form, setForm] = useState<AdvancePaymentItem>({ ...EMPTY_ADVANCE_PAYMENT })
  const [errors, setErrors] = useState<Partial<Record<AdvancePaymentFieldKey, string>>>({})
  const [pendingAdvances, setPendingAdvances] = useState<AdvancePaymentItem[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const advancePaymentConfig = useMemo(
    () =>
      normalizeAdvancePaymentConfig(
        ((formStructure as any)?.advancePayment ?? (formStructure as any)?.advancePayments) as
          | AdvancePaymentConfig
          | undefined
      ),
    [formStructure]
  )
  const advancePaymentItemSchema = useMemo(
    () => createAdvancePaymentItemSchema(advancePaymentConfig),
    [advancePaymentConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = advancePaymentConfig.fields
    return (field: keyof AdvancePaymentItem): boolean => {
      switch (field) {
        case "date":
          return fields.date?.required ?? true
        case "amount":
          return fields.amount?.required ?? true
        case "month":
          return fields.month?.required ?? true
        case "year":
          return fields.year?.required ?? true
        case "bonusDescription":
          return fields.bonusDescription?.required ?? true
        default:
          return false
      }
    }
  }, [advancePaymentConfig])
  const isVisible = useMemo(() => {
    const fields = advancePaymentConfig.fields
    return (field: AdvancePaymentFieldKey): boolean => fields[field]?.visible ?? true
  }, [advancePaymentConfig])
  const getLabel = useMemo(() => {
    const fields = advancePaymentConfig.fields
    return (field: AdvancePaymentFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [advancePaymentConfig])
  const showAdvancePaymentSection =
    isVisible("date") ||
    isVisible("amount") ||
    isVisible("month") ||
    isVisible("year") ||
    isVisible("bonusDescription")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_ADVANCE_PAYMENT })
      setErrors({})
      setPendingAdvances(null)
    }
    // intentionally omit initialValue — re-seeding on every parent render would overwrite user edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const { post: postAdvance, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): AdvancePaymentFieldKey | null => {
          const fieldMap: Record<string, AdvancePaymentFieldKey> = {
            date: "date",
            month: "month",
            year: "year",
            amount: "amount",
            bonusDescription: "bonusDescription",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("advance.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Partial<Record<AdvancePaymentFieldKey, string>> = {}
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

      toast.success("Advance payment saved successfully!")
      if (pendingAdvances) {
        onSubmit(pendingAdvances)
      }
      setPendingAdvances(null)
      await refetchAdvancePayments?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving advance payment:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || postLoading || disabled) return
    const result = advancePaymentItemSchema.safeParse(form)
    if (!result.success) {
      const err: Partial<Record<AdvancePaymentFieldKey, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".") as AdvancePaymentFieldKey
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})
    const payloadAdvance = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_ADVANCE_PAYMENT,
      ...result.data,
    } as AdvancePaymentItem
    const parseId = (payloadAdvance as Record<string, any>)?.parseID
    const next =
      parseId
        ? advances.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadAdvance : row
          )
        : editIndex !== null
          ? advances.map((row, index) => (index === editIndex ? payloadAdvance : row))
          : [...advances, payloadAdvance]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetAdvancePaymentTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        advance: [payloadAdvance],
        ...(shouldSetAdvancePaymentTab ? { advancePaymenttab: true } : {}),
      },
      audit: auditPayload,
    }
    setPendingAdvances(next)
    postAdvance(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{initialValue !== null ? "Edit Advance Payment" : "Add Advance Payment"}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Fill advance details.</p>
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
          {showAdvancePaymentSection && (
            <div className="space-y-3">
              <SubFormTitle title="Advance Payment Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isVisible("date") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("date", "Advance Date")} {isRequired("date") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="date"
                      value={form.date || ""}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, date: e.target.value }))
                        if (errors.date) setErrors((prev) => ({ ...prev, date: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={disabled || postLoading}
                    />
                    {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
                  </div>
                )}
                {isVisible("amount") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("amount", "Amount")} {isRequired("amount") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))
                        if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={disabled || postLoading}
                    />
                    {errors.amount && <p className="text-red-500 text-xs">{errors.amount}</p>}
                  </div>
                )}
                {isVisible("month") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("month", "Month")} {isRequired("month") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={form.month}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, month: Number(e.target.value || 1) }))
                        if (errors.month) setErrors((prev) => ({ ...prev, month: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={disabled || postLoading}
                    />
                    {errors.month && <p className="text-red-500 text-xs">{errors.month}</p>}
                  </div>
                )}
                {isVisible("year") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("year", "Year")} {isRequired("year") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={form.year}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, year: Number(e.target.value || new Date().getFullYear()) }))
                        if (errors.year) setErrors((prev) => ({ ...prev, year: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={disabled || postLoading}
                    />
                    {errors.year && <p className="text-red-500 text-xs">{errors.year}</p>}
                  </div>
                )}
                {isVisible("bonusDescription") && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("bonusDescription", "Description")} {isRequired("bonusDescription") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      value={form.bonusDescription || ""}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, bonusDescription: e.target.value }))
                        if (errors.bonusDescription) setErrors((prev) => ({ ...prev, bonusDescription: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={disabled || postLoading}
                      placeholder="Enter description"
                    />
                    {errors.bonusDescription && <p className="text-red-500 text-xs">{errors.bonusDescription}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
          {showAdvancePaymentSection && <Separator />}
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
            disabled={disabled || shouldShowConfigLoader || postLoading}
          >
            {initialValue !== null ? "Save" : "Add Advance"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AdvancePaymentSectionForm
