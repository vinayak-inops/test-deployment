"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { AlertTriangle, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_PENALTY,
  createPenaltyItemSchema,
  normalizePenaltyConfig,
  type PenaltyConfig,
  type PenaltyFieldKey,
  type PenaltyItem,
} from "../../schemas/penalty-form-schema"

interface PenaltySectionFormProps {
  open: boolean
  onClose: () => void
  initialValue: PenaltyItem | null
  onSubmit: (values: PenaltyItem[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  penalties: PenaltyItem[]
  editIndex: number | null
  refetchPenalties?: () => Promise<void> | void
  isViewMode?: boolean
}
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function PenaltySectionForm({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  penalties,
  editIndex,
  refetchPenalties,
  isViewMode,
}: PenaltySectionFormProps) {
  const [form, setForm] = useState<PenaltyItem>({ ...EMPTY_PENALTY })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingPenalties, setPendingPenalties] = useState<PenaltyItem[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const penaltyConfig = useMemo(
    () =>
      normalizePenaltyConfig(
        ((formStructure as any)?.penalty ?? (formStructure as any)?.penalties) as
          | PenaltyConfig
          | undefined
      ),
    [formStructure]
  )
  const penaltyItemSchema = useMemo(
    () => createPenaltyItemSchema(penaltyConfig),
    [penaltyConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = penaltyConfig.fields
    return (field: PenaltyFieldKey): boolean => {
      if (
        field === "dateOfOffence" ||
        field === "offenceDescription" ||
        field === "actionTaken" ||
        field === "fineImposed" ||
        field === "month"
      ) {
        return fields[field]?.required ?? true
      }
      return Boolean(fields[field]?.required)
    }
  }, [penaltyConfig])
  const isVisible = useMemo(() => {
    const fields = penaltyConfig.fields
    return (field: PenaltyFieldKey): boolean => fields[field]?.visible ?? true
  }, [penaltyConfig])
  const getLabel = useMemo(() => {
    const fields = penaltyConfig.fields
    return (field: PenaltyFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [penaltyConfig])
  const showInfoBanner = isVisible("dateOfOffence") && isVisible("fineRealisedDate")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_PENALTY })
      setErrors({})
      setPendingPenalties(null)
    }
  }, [open, initialValue])

  const { post: postPenalty, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const normalizeServerField = (fieldName: string): PenaltyFieldKey | null => {
          const fieldMap: Record<string, PenaltyFieldKey> = {
            dateOfOffence: "dateOfOffence",
            offenceDescription: "offenceDescription",
            actionTaken: "actionTaken",
            fineImposed: "fineImposed",
            month: "month",
            isCauseShownAgainstFine: "isCauseShownAgainstFine",
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

      toast.success("Penalties saved successfully!")
      if (pendingPenalties) {
        onSubmit(pendingPenalties)
      }
      setPendingPenalties(null)
      await refetchPenalties?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving penalties:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || isViewMode || postLoading) return
    const result = penaltyItemSchema.safeParse(form)
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

    const payloadPenalty = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_PENALTY,
      ...result.data,
    } as PenaltyItem

    const parseId = (payloadPenalty as Record<string, any>)?.parseID
    const next =
      parseId
        ? penalties.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadPenalty : row
          )
        : editIndex !== null
          ? penalties.map((row, index) => (index === editIndex ? payloadPenalty : row))
          : [...penalties, payloadPenalty]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetPenaltyTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        penalty: [payloadPenalty],
        ...(shouldSetPenaltyTab ? { penaltytab: true } : {}),
      },
      audit: auditPayload,
    }

    setPendingPenalties(next)
    postPenalty(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{initialValue !== null ? "Edit Penalty" : "Add Penalty"}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Fill penalty details.</p>
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
          <div className="space-y-3">
            <SubFormTitle title="Penalty Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isVisible("dateOfOffence") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("dateOfOffence", "Date of Offence")} {isRequired("dateOfOffence") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                type="date"
                value={form.dateOfOffence || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, dateOfOffence: e.target.value }))}
                max={form.fineRealisedDate || undefined}
                className={INPUT_CLASS}
                disabled={isViewMode || postLoading}
              />
              {errors.dateOfOffence && <p className="text-red-500 text-xs">{errors.dateOfOffence}</p>}
            </div>
            )}

            {isVisible("fineImposed") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("fineImposed", "Fine Amount")} {isRequired("fineImposed") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                type="number"
                value={form.fineImposed}
                onChange={(e) => setForm((prev) => ({ ...prev, fineImposed: Number(e.target.value || 0) }))}
                className={INPUT_CLASS}
                disabled={isViewMode || postLoading}
              />
              {errors.fineImposed && <p className="text-red-500 text-xs">{errors.fineImposed}</p>}
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
                onValueChange={(value) => setForm((prev) => ({ ...prev, month: Number(value) }))}
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

            {isVisible("offenceDescription") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("offenceDescription", "Offence Description")} {isRequired("offenceDescription") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                value={form.offenceDescription || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, offenceDescription: e.target.value }))}
                className={INPUT_CLASS}
                disabled={isViewMode || postLoading}
                placeholder="Enter offence description"
              />
              {errors.offenceDescription && <p className="text-red-500 text-xs">{errors.offenceDescription}</p>}
            </div>
            )}

            {isVisible("actionTaken") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("actionTaken", "Action Taken")} {isRequired("actionTaken") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                value={form.actionTaken || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, actionTaken: e.target.value }))}
                className={INPUT_CLASS}
                disabled={isViewMode || postLoading}
                placeholder="Enter action taken"
              />
              {errors.actionTaken && <p className="text-red-500 text-xs">{errors.actionTaken}</p>}
            </div>
            )}

            {isVisible("witnessName") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("witnessName", "Witness Name")} {isRequired("witnessName") && <span className="text-red-500">*</span>}
              </Label>
              <Input
                value={form.witnessName || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, witnessName: e.target.value }))}
                className={INPUT_CLASS}
                disabled={isViewMode || postLoading}
                placeholder="Enter witness name"
              />
              {errors.witnessName && <p className="text-red-500 text-xs">{errors.witnessName}</p>}
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
                min={form.dateOfOffence || undefined}
                onChange={(e) => setForm((prev) => ({ ...prev, fineRealisedDate: e.target.value }))}
                className={INPUT_CLASS}
                disabled={isViewMode || postLoading}
              />
              {errors.fineRealisedDate && <p className="text-red-500 text-xs">{errors.fineRealisedDate}</p>}
            </div>
            )}

            {isVisible("isCauseShownAgainstFine") && (
            <div className="space-y-2 md:col-span-2 lg:col-span-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("isCauseShownAgainstFine", "Cause Shown Against Fine")} {isRequired("isCauseShownAgainstFine") && <span className="text-red-500">*</span>}
              </Label>
              <div className="flex items-center space-x-2 pt-3">
                <Checkbox
                  checked={Boolean(form.isCauseShownAgainstFine)}
                  disabled={isViewMode || postLoading}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isCauseShownAgainstFine: !!checked }))}
                />
                <Label className="text-sm text-gray-700">Cause shown against fine</Label>
              </div>
            </div>
            )}

            {showInfoBanner && form.dateOfOffence && form.fineRealisedDate && (
              <div
                className={`md:col-span-2 lg:col-span-3 mt-1 p-2 rounded-lg text-xs ${
                  new Date(form.dateOfOffence) <= new Date(form.fineRealisedDate)
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {new Date(form.dateOfOffence) <= new Date(form.fineRealisedDate)
                  ? "Date of Offence is valid (on or before Fine Realised Date)"
                  : "Date of Offence must be on or before Fine Realised Date"}
              </div>
            )}
          </div>
          </div>
          <Separator />
            </>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={isViewMode || shouldShowConfigLoader || postLoading}>
            {initialValue !== null ? "Save" : "Add Penalty"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PenaltySectionForm
