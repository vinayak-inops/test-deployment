"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { AlertTriangle, X } from "lucide-react"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import {
  EMPTY_PENALTY,
  createPenaltySchema,
  normalizePenaltyConfig,
  type Penalty,
  type PenaltyFieldsConfig,
  type PenaltyRootConfig,
  convertToInputDate,
  convertToBackendDate,
} from "../../schemas/penalty-form-schema"
import { useDynamicSchemaConfig } from "../../hooks/useDynamicSchemaConfig"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

interface PenaltyFormPopupProps {
  open: boolean
  onClose: () => void
  initialPenalty: Penalty | null
  onSubmit: (penalties: Penalty[]) => void
  onSaved?: () => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  penalties: Penalty[]
  editIndex: number | null
  refetchPenalties?: () => Promise<void> | void
  disabled?: boolean
}
type PenaltyFormField =
  | "dateOfOffence"
  | "actOfMisconduct"
  | "actionTaken"
  | "amount"
  | "month"
  | "witnessName"
  | "fineRealisedDate"

function toPayloadPenalty(row: Penalty) {
  return {
    parseID: row.parseID || undefined,
    dateOfOffence: convertToBackendDate(row.dateOfOffence),
    actOfMisconduct: row.actOfMisconduct || "",
    actionTaken: row.actionTaken || "",
    amount: Number(row.amount || 0),
    month: Number(row.month || 1),
    witnessName: row.witnessName || "",
    fineRealisedDate: row.fineRealisedDate ? convertToBackendDate(row.fineRealisedDate) : "",
  }
}

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function PenaltyFormPopup({
  open,
  onClose,
  initialPenalty,
  onSubmit,
  onSaved,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  penalties,
  editIndex,
  refetchPenalties,
  disabled = false,
}: PenaltyFormPopupProps) {
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contractor_form_strcture",
  })

  const penaltyTabConfig = useMemo(
    () =>
      normalizePenaltyConfig(
        formStructure?.penalty as PenaltyFieldsConfig | PenaltyRootConfig | undefined
      ),
    [formStructure]
  )

  const penaltySchemaDef = useMemo(
    () => createPenaltySchema(penaltyTabConfig),
    [penaltyTabConfig]
  )

  const { schema: penaltySchema, isRequired, isVisible, getLabel } = useDynamicSchemaConfig({
    schema: penaltySchemaDef,
    fieldConfig: penaltyTabConfig,
    emptyValues: EMPTY_PENALTY,
    defaultRequired: {
      dateOfOffence: true,
      actOfMisconduct: true,
      actionTaken: true,
      amount: true,
      month: false,
      witnessName: true,
      fineRealisedDate: false,
    },
  })
  const [form, setForm] = useState<Penalty>({ ...EMPTY_PENALTY })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingPenalties, setPendingPenalties] = useState<Penalty[] | null>(null)
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const showPenaltyInfoSection =
    isVisible("dateOfOffence") ||
    isVisible("fineRealisedDate") ||
    isVisible("amount") ||
    isVisible("month")
  const showMisconductDetailsSection =
    isVisible("actOfMisconduct") || isVisible("actionTaken") || isVisible("witnessName")

  useEffect(() => {
    if (open) {
      const initial = initialPenalty
        ? {
            parseID: initialPenalty.parseID || undefined,
            dateOfOffence: convertToInputDate(initialPenalty.dateOfOffence) || initialPenalty.dateOfOffence,
            actOfMisconduct: initialPenalty.actOfMisconduct || "",
            actionTaken: initialPenalty.actionTaken || "",
            amount: initialPenalty.amount ?? 0,
            month: initialPenalty.month ?? 1,
            witnessName: initialPenalty.witnessName || "",
            fineRealisedDate: initialPenalty.fineRealisedDate
              ? convertToInputDate(initialPenalty.fineRealisedDate)
              : "",
          }
        : { ...EMPTY_PENALTY }
      setForm(initial)
      setErrors({})
      setPendingPenalties(null)
    }
  }, [open, initialPenalty])

  const { post: postPenalties, loading: postLoading } = usePostRequest<any>({
    url: contractorCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): PenaltyFormField | null => {
          const fieldMap: Record<string, PenaltyFormField> = {
            dateOfOffence: "dateOfOffence",
            actOfMisconduct: "actOfMisconduct",
            actionTaken: "actionTaken",
            amount: "amount",
            month: "month",
            witnessName: "witnessName",
            fineRealisedDate: "fineRealisedDate",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("penalty.")) {
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
      if (pendingPenalties) onSubmit(pendingPenalties)
      setPendingPenalties(null)
      await refetchPenalties?.()
      onSaved?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving contractor data:", error)
    },
  })

  const update = (field: keyof Penalty, value: string | number | undefined) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleSubmit = () => {
    if (shouldShowConfigLoader || postLoading) return
    const result = penaltySchema.safeParse(form)
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
    const payload: Penalty = {
      ...EMPTY_PENALTY,
      parseID: (initialPenalty as Record<string, any> | null)?.parseID,
      ...result.data,
      month: result.data.month ?? undefined,
    }
    const payloadPenalty = toPayloadPenalty(payload) as Penalty
    const parseId = (payloadPenalty as Record<string, any>)?.parseID
    const next =
      parseId
        ? penalties.map((penalty) =>
            (penalty as Record<string, any>)?.parseID === parseId ? payloadPenalty : penalty
          )
        : editIndex !== null
          ? penalties.map((penalty, index) => (index === editIndex ? payloadPenalty : penalty))
          : [...penalties, payloadPenalty]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetPenaltyTab = employeeSearchUrl === "draft/contractor/search"
    const postPayload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      event: "validate",
      ruleId: "",
      collectionName: "contractor",
      data: {
        penalty: [payloadPenalty],
        ...(shouldSetPenaltyTab ? { penaltytab: true } : {}),
      },
    }
    setPendingPenalties(next)
    postPenalties?.(postPayload)
  }

  const handleClose = () => {
    setErrors({})
    setPendingPenalties(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialPenalty !== null ? "Edit Penalty" : "Add Penalty"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter penalty details.</p>
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
          {showPenaltyInfoSection && (
            <div className="space-y-3">
              <SubFormTitle title="Penalty Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isVisible("dateOfOffence") && (
                <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("dateOfOffence", "Date of Offence")} {isRequired("dateOfOffence") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="date"
                  value={form.dateOfOffence}
                  onChange={(e) => update("dateOfOffence", e.target.value)}
                  className={INPUT_CLASS}
                  disabled={disabled}
                />
                {errors.dateOfOffence && (
                  <p className="text-red-500 text-xs">{errors.dateOfOffence}</p>
                )}
              </div>
              )}
              {isVisible("fineRealisedDate") && (
                <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("fineRealisedDate", "Fine Realised Date")} {isRequired("fineRealisedDate") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="date"
                  value={form.fineRealisedDate || ""}
                  onChange={(e) => update("fineRealisedDate", e.target.value)}
                  className={INPUT_CLASS}
                  disabled={disabled}
                />
                {errors.fineRealisedDate && (
                  <p className="text-red-500 text-xs">{errors.fineRealisedDate}</p>
                )}
              </div>
              )}
              {isVisible("amount") && (
                <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("amount", "Amount")} {isRequired("amount") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="number"
                  value={form.amount ?? ""}
                  onChange={(e) => update("amount", e.target.value === "" ? undefined : Number(e.target.value))}
                  className={INPUT_CLASS}
                  placeholder="0"
                  min={0}
                  disabled={disabled}
                />
                {errors.amount && <p className="text-red-500 text-xs">{errors.amount}</p>}
              </div>
              )}
              {isVisible("month") && (
                <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("month", "Month (1-12)")} {isRequired("month") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="number"
                  value={form.month ?? ""}
                  onChange={(e) => update("month", e.target.value === "" ? undefined : Number(e.target.value))}
                  className={INPUT_CLASS}
                  placeholder="1"
                  min={1}
                  max={12}
                  disabled={disabled}
                />
                {errors.month && <p className="text-red-500 text-xs">{errors.month}</p>}
              </div>
              )}
            </div>
          </div>
          )}

          {showPenaltyInfoSection && showMisconductDetailsSection && <Separator />}

          {showMisconductDetailsSection && (
            <div className="space-y-3">
              <SubFormTitle title="Misconduct Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isVisible("actOfMisconduct") && (
                <div className="space-y-2 md:col-span-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("actOfMisconduct", "Act of Misconduct")} {isRequired("actOfMisconduct") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.actOfMisconduct}
                  onChange={(e) => update("actOfMisconduct", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter act of misconduct"
                  disabled={disabled}
                />
                {errors.actOfMisconduct && (
                  <p className="text-red-500 text-xs">{errors.actOfMisconduct}</p>
                )}
              </div>
              )}
              {isVisible("actionTaken") && (
                <div className="space-y-2 md:col-span-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("actionTaken", "Action Taken")} {isRequired("actionTaken") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.actionTaken}
                  onChange={(e) => update("actionTaken", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter action taken"
                  disabled={disabled}
                />
                {errors.actionTaken && (
                  <p className="text-red-500 text-xs">{errors.actionTaken}</p>
                )}
              </div>
              )}
              {isVisible("witnessName") && (
                <div className="space-y-2 md:col-span-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("witnessName", "Witness Name")} {isRequired("witnessName") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.witnessName}
                  onChange={(e) => update("witnessName", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter witness name"
                  disabled={disabled}
                />
                {errors.witnessName && (
                  <p className="text-red-500 text-xs">{errors.witnessName}</p>
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
            {initialPenalty !== null ? "Save" : "Add Penalty"}
          </Button>
        </div>
      </div>
    </div>
  )
}
