"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Calendar, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  createDefaultWeekOffItemSchema,
  normalizeDefaultWeekOffConfig,
  type DefaultWeekOffConfig,
  type DefaultWeekOffFieldKey,
} from "../../schemas/default-week-off-form-schema"

export interface WeekOffItem {
  from: string
  to: string
  isActive: boolean
}

interface DoNotConsiderWeekOffFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: WeekOffItem | null
  onSubmit: (values: WeekOffItem[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeCollectionUrl?: string
  weekOffRanges: WeekOffItem[]
  editIndex: number | null
  refetchWeekOff?: () => Promise<void> | void
  disabled?: boolean
}

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function DoNotConsiderWeekOffFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeCollectionUrl = "contract_employee",
  weekOffRanges,
  editIndex,
  refetchWeekOff,
  disabled = false,
}: DoNotConsiderWeekOffFormPopupProps) {
  const [form, setForm] = useState<WeekOffItem>({ from: "", to: "", isActive: true })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingRanges, setPendingRanges] = useState<WeekOffItem[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const weekOffConfig = useMemo(
    () =>
      normalizeDefaultWeekOffConfig(
        ((formStructure as any)?.defaultWeekOff ??
          (formStructure as any)?.doNotConsiderWeekOff) as
          | DefaultWeekOffConfig
          | undefined
      ),
    [formStructure]
  )
  const weekOffSchema = useMemo(
    () => createDefaultWeekOffItemSchema(weekOffConfig),
    [weekOffConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = weekOffConfig.fields
    return (field: DefaultWeekOffFieldKey): boolean =>
      field === "from" || field === "to"
        ? fields[field]?.required ?? true
        : fields[field]?.required ?? false
  }, [weekOffConfig])
  const isVisible = useMemo(() => {
    const fields = weekOffConfig.fields
    return (field: DefaultWeekOffFieldKey): boolean => fields[field]?.visible ?? true
  }, [weekOffConfig])
  const getLabel = useMemo(() => {
    const fields = weekOffConfig.fields
    return (field: DefaultWeekOffFieldKey, fallback: string): string =>
      fields[field]?.label || fallback
  }, [weekOffConfig])
  const showWeekOffSection = isVisible("from") || isVisible("to") || isVisible("isActive")

  useEffect(() => {
    if (!open) return
    setForm(initialValue ?? { from: "", to: "", isActive: true })
    setErrors({})
    setPendingRanges(null)
    // intentionally omit initialValue — re-seeding on every parent render would overwrite user edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const { post: postWeekOff, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): DefaultWeekOffFieldKey | null => {
          const fieldMap: Record<string, DefaultWeekOffFieldKey> = {
            from: "from",
            to: "to",
            isActive: "isActive",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("doNotConsiderWeekOff.")) {
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

      toast.success("Week-off ranges saved successfully!")
      if (pendingRanges) {
        onSubmit(pendingRanges)
      }
      setPendingRanges(null)
      await refetchWeekOff?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving week-off ranges:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || disabled || postLoading) return
    const result = weekOffSchema.safeParse(form)
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
    const payloadRange = {
      ...(initialValue as Record<string, any> | null),
      ...result.data,
    } as WeekOffItem
    const parseId = (payloadRange as Record<string, any>)?.parseID
    const next =
      parseId
        ? weekOffRanges.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadRange : row
          )
        : editIndex !== null
          ? weekOffRanges.map((row, index) => (index === editIndex ? payloadRange : row))
          : [...weekOffRanges, payloadRange]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        doNotConsiderWeekOff: [payloadRange],
      },
      audit: auditPayload,
    }
    setPendingRanges(next)
    postWeekOff(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{initialValue ? "Edit Range" : "Add Range"}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Configure week-off exclusion range.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {shouldShowConfigLoader ? (
            <div className="py-8 text-center text-sm text-gray-600">
              Loading form configuration...
            </div>
          ) : (
            <>
              {showWeekOffSection && (
                <>
                  {isVisible("from") && (
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        {getLabel("from", "From Date")} {isRequired("from") && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        type="date"
                        value={form.from}
                        max={form.to || undefined}
                        disabled={disabled || postLoading}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, from: e.target.value }))
                          if (errors.from) setErrors((prev) => ({ ...prev, from: "" }))
                        }}
                        className={`${INPUT_CLASS} ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      />
                      {errors.from && <p className="text-xs text-red-600">{errors.from}</p>}
                    </div>
                  )}
                  {isVisible("to") && (
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        {getLabel("to", "To Date")} {isRequired("to") && <span className="text-red-500">*</span>}
                      </Label>
                      <Input
                        type="date"
                        value={form.to}
                        min={form.from || undefined}
                        disabled={disabled || postLoading}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, to: e.target.value }))
                          if (errors.to) setErrors((prev) => ({ ...prev, to: "" }))
                        }}
                        className={`${INPUT_CLASS} ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                      />
                      {errors.to && <p className="text-xs text-red-600">{errors.to}</p>}
                    </div>
                  )}
                  {isVisible("isActive") && (
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        {getLabel("isActive", "Status")} {isRequired("isActive") && <span className="text-red-500">*</span>}
                      </Label>
                      <label className="group relative flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          disabled={disabled || postLoading}
                          onChange={(e) => {
                            setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                            if (errors.isActive) setErrors((prev) => ({ ...prev, isActive: "" }))
                          }}
                          className="h-4 w-4 border-gray-300 rounded cursor-pointer accent-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <span className="text-sm font-normal text-gray-900">{getLabel("isActive", "Active")}</span>
                      </label>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={disabled || shouldShowConfigLoader || postLoading}>
            {initialValue ? "Save" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  )
}
