"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { Gift, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_BONUS,
  createBonusItemSchema,
  normalizeBonusConfig,
  type BonusConfig,
  type BonusFieldKey,
  type BonusItem,
} from "../../schemas/bonus-form-schema"

interface BonusSectionFormProps {
  open: boolean
  onClose: () => void
  initialValue: BonusItem | null
  onSubmit: (values: BonusItem[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  bonuses: BonusItem[]
  editIndex: number | null
  refetchBonus?: () => Promise<void> | void
  isViewMode?: boolean
}
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function BonusSectionForm({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  bonuses,
  editIndex,
  refetchBonus,
  isViewMode,
}: BonusSectionFormProps) {
  const [form, setForm] = useState<BonusItem>({ ...EMPTY_BONUS })
  const [errors, setErrors] = useState<Partial<Record<BonusFieldKey, string>>>({})
  const [pendingBonuses, setPendingBonuses] = useState<BonusItem[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const bonusConfig = useMemo(
    () =>
      normalizeBonusConfig(
        ((formStructure as any)?.bonus ?? (formStructure as any)?.bonuses) as BonusConfig | undefined
      ),
    [formStructure]
  )
  const bonusItemSchema = useMemo(() => createBonusItemSchema(bonusConfig), [bonusConfig])
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = bonusConfig.fields
    return (field: keyof BonusItem): boolean => {
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
  }, [bonusConfig])
  const isVisible = useMemo(() => {
    const fields = bonusConfig.fields
    return (field: BonusFieldKey): boolean => fields[field]?.visible ?? true
  }, [bonusConfig])
  const getLabel = useMemo(() => {
    const fields = bonusConfig.fields
    return (field: BonusFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [bonusConfig])
  const showBonusSection =
    isVisible("date") ||
    isVisible("amount") ||
    isVisible("month") ||
    isVisible("year") ||
    isVisible("bonusDescription")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_BONUS })
      setErrors({})
      setPendingBonuses(null)
    }
    // intentionally omit initialValue — re-seeding on every parent render would overwrite user edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const { post: postBonus, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const normalizeServerField = (fieldName: string): BonusFieldKey | null => {
          const fieldMap: Record<string, BonusFieldKey> = {
            date: "date",
            amount: "amount",
            month: "month",
            year: "year",
            bonusDescription: "bonusDescription",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("bonus.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Partial<Record<BonusFieldKey, string>> = {}
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

      toast.success("Bonus data saved successfully!")
      if (pendingBonuses) {
        onSubmit(pendingBonuses)
      }
      setPendingBonuses(null)
      await refetchBonus?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving bonus data:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || isViewMode || postLoading) return
    const result = bonusItemSchema.safeParse(form)
    if (!result.success) {
      const err: Partial<Record<BonusFieldKey, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".") as BonusFieldKey
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})
    const payloadBonus = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_BONUS,
      ...result.data,
    } as BonusItem
    const parseId = (payloadBonus as Record<string, any>)?.parseID
    const next =
      parseId
        ? bonuses.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadBonus : row
          )
        : editIndex !== null
          ? bonuses.map((row, index) => (index === editIndex ? payloadBonus : row))
          : [...bonuses, payloadBonus]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetBonusTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        bonus: [payloadBonus],
        ...(shouldSetBonusTab ? { bonustab: true } : {}),
      },
      audit: auditPayload,
    }
    setPendingBonuses(next)
    postBonus(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Gift className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{initialValue !== null ? "Edit Bonus" : "Add Bonus"}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Fill bonus details.</p>
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
          {showBonusSection && (
            <div className="space-y-3">
              <SubFormTitle title="Bonus Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isVisible("date") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("date", "Bonus Date")} {isRequired("date") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="date"
                      value={form.date || ""}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, date: e.target.value }))
                        if (errors.date) setErrors((prev) => ({ ...prev, date: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={isViewMode || postLoading}
                    />
                    {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
                  </div>
                )}

                {isVisible("amount") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("amount", "Bonus Amount")} {isRequired("amount") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))
                        if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={isViewMode || postLoading}
                    />
                    {errors.amount && <p className="text-red-500 text-xs">{errors.amount}</p>}
                  </div>
                )}

                {isVisible("month") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("month", "Month")} {isRequired("month") && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={String(form.month ?? 1)}
                      disabled={isViewMode || postLoading}
                      onValueChange={(value) => {
                        setForm((prev) => ({ ...prev, month: Number(value) }))
                        if (errors.month) setErrors((prev) => ({ ...prev, month: "" }))
                      }}
                    >
                      <SelectTrigger className={INPUT_CLASS}>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      disabled={isViewMode || postLoading}
                    />
                    {errors.year && <p className="text-red-500 text-xs">{errors.year}</p>}
                  </div>
                )}

                {isVisible("bonusDescription") && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("bonusDescription", "Bonus Description")} {isRequired("bonusDescription") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      value={form.bonusDescription || ""}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, bonusDescription: e.target.value }))
                        if (errors.bonusDescription) setErrors((prev) => ({ ...prev, bonusDescription: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={isViewMode || postLoading}
                      placeholder="Enter bonus description"
                    />
                    {errors.bonusDescription && <p className="text-red-500 text-xs">{errors.bonusDescription}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
          {showBonusSection && <Separator />}
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
            {initialValue !== null ? "Save" : "Add Bonus"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BonusSectionForm
