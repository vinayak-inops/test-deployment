"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Separator } from "@repo/ui/components/ui/separator"
import { Calendar, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import DocumentUploadField from "@/components/fields/document-upload-field"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_ACCIDENT_REGISTER,
  createAccidentRegisterSchema,
  normalizeAccidentRegisterConfig,
  type AccidentRegisterConfig,
  type AccidentRegister,
  type AccidentRegisterFieldKey,
} from "../../schemas/accident-register-form-schema"

interface AccidentRegisterFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: AccidentRegister | null
  onSubmit: (values: AccidentRegister[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  accidentRegisters: AccidentRegister[]
  editIndex: number | null
  refetchAccidents?: () => Promise<void> | void
  disabled?: boolean
}
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function AccidentRegisterFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  accidentRegisters,
  editIndex,
  refetchAccidents,
  disabled = false,
}: AccidentRegisterFormPopupProps) {
  const [form, setForm] = useState<AccidentRegister>({ ...EMPTY_ACCIDENT_REGISTER })
  const [errors, setErrors] = useState<Partial<Record<AccidentRegisterFieldKey, string>>>({})
  const [pendingAccidents, setPendingAccidents] = useState<AccidentRegister[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const accidentRegisterConfig = useMemo(
    () =>
      normalizeAccidentRegisterConfig(
        formStructure?.accidentRegisters as AccidentRegisterConfig | undefined
      ),
    [formStructure]
  )
  const accidentRegisterSchema = useMemo(
    () => createAccidentRegisterSchema(accidentRegisterConfig),
    [accidentRegisterConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = accidentRegisterConfig.fields
    return (field: keyof AccidentRegister): boolean => fields[field]?.required ?? true
  }, [accidentRegisterConfig])
  const isVisible = useMemo(() => {
    const fields = accidentRegisterConfig.fields
    return (field: AccidentRegisterFieldKey): boolean => fields[field]?.visible ?? true
  }, [accidentRegisterConfig])
  const getLabel = useMemo(() => {
    const fields = accidentRegisterConfig.fields
    return (field: AccidentRegisterFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [accidentRegisterConfig])
  const showAccidentInfoSection =
    isVisible("dateOfAccident") ||
    isVisible("dateOfReport") ||
    isVisible("dateOfReturn") ||
    isVisible("accidentDescription") ||
    isVisible("severity") ||
    isVisible("relatedDocument")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_ACCIDENT_REGISTER })
      setErrors({})
      setPendingAccidents(null)
    }
  }, [open, initialValue])

  const update = (field: keyof AccidentRegister, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }
  const { post: postAccidentRegister, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): AccidentRegisterFieldKey | null => {
          const fieldMap: Record<string, AccidentRegisterFieldKey> = {
            dateOfAccident: "dateOfAccident",
            dateOfReport: "dateOfReport",
            dateOfReturn: "dateOfReturn",
            accidentDescription: "accidentDescription",
            severity: "severity",
            relatedDocument: "relatedDocument",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("accidentRegister.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Partial<Record<AccidentRegisterFieldKey, string>> = {}
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

      toast.success("Accident register saved successfully!")
      if (pendingAccidents) {
        onSubmit(pendingAccidents)
      }
      setPendingAccidents(null)
      await refetchAccidents?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving accident register:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || postLoading || disabled) return
    const result = accidentRegisterSchema.safeParse(form)
    if (!result.success) {
      const err: Partial<Record<AccidentRegisterFieldKey, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".") as AccidentRegisterFieldKey
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})
    const payloadAccident = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_ACCIDENT_REGISTER,
      ...result.data,
    } as AccidentRegister
    const parseId = (payloadAccident as Record<string, any>)?.parseID
    const next =
      parseId
        ? accidentRegisters.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadAccident : row
          )
        : editIndex !== null
          ? accidentRegisters.map((row, index) => (index === editIndex ? payloadAccident : row))
          : [...accidentRegisters, payloadAccident]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetAccidentRegisterTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        accidentRegister: [payloadAccident],
        ...(shouldSetAccidentRegisterTab ? { accidentRegisterstab: true } : {}),
      },
      audit: auditPayload,
    }
    setPendingAccidents(next)
    postAccidentRegister(payload)
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
              <h3 className="text-sm font-semibold text-gray-900">
                {initialValue !== null ? "Edit Accident Record" : "Add Accident Record"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter accident register details.</p>
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
          {showAccidentInfoSection && (
            <div className="space-y-3">
              <SubFormTitle title="Accident Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isVisible("dateOfAccident") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("dateOfAccident", "Date of Accident")}
                      {isRequired("dateOfAccident") && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={form.dateOfAccident}
                      onChange={(e) => update("dateOfAccident", e.target.value)}
                      className={INPUT_CLASS}
                      disabled={disabled || postLoading}
                    />
                    {errors.dateOfAccident && <p className="text-red-500 text-xs">{errors.dateOfAccident}</p>}
                  </div>
                )}
                {isVisible("dateOfReport") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("dateOfReport", "Date of Report")}
                      {isRequired("dateOfReport") && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      type="date"
                      min={form.dateOfAccident || undefined}
                      value={form.dateOfReport}
                      onChange={(e) => update("dateOfReport", e.target.value)}
                      className={INPUT_CLASS}
                      disabled={disabled || postLoading}
                    />
                    {errors.dateOfReport && <p className="text-red-500 text-xs">{errors.dateOfReport}</p>}
                  </div>
                )}
                {isVisible("dateOfReturn") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("dateOfReturn", "Date of Return")}
                      {isRequired("dateOfReturn") && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      type="date"
                      min={form.dateOfAccident || undefined}
                      value={form.dateOfReturn}
                      onChange={(e) => update("dateOfReturn", e.target.value)}
                      className={INPUT_CLASS}
                      disabled={disabled || postLoading}
                    />
                    {errors.dateOfReturn && <p className="text-red-500 text-xs">{errors.dateOfReturn}</p>}
                  </div>
                )}
                {isVisible("accidentDescription") && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("accidentDescription", "Accident Description")}
                      {isRequired("accidentDescription") && <span className="text-red-500"> *</span>}
                    </Label>
                    <Textarea
                      value={form.accidentDescription}
                      onChange={(e) => update("accidentDescription", e.target.value)}
                      className="min-h-[72px] border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                      rows={3}
                      placeholder="Enter accident description"
                      disabled={disabled || postLoading}
                    />
                    {errors.accidentDescription && <p className="text-red-500 text-xs">{errors.accidentDescription}</p>}
                  </div>
                )}
                {isVisible("severity") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("severity", "Severity")}
                      {isRequired("severity") && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      value={form.severity}
                      onChange={(e) => update("severity", e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Enter severity"
                      disabled={disabled || postLoading}
                    />
                    {errors.severity && <p className="text-red-500 text-xs">{errors.severity}</p>}
                  </div>
                )}
                {isVisible("relatedDocument") && (
                  <div className="space-y-2 md:col-span-2">
                    <DocumentUploadField
                      id="accident-related-document"
                      label={`${getLabel("relatedDocument", "Related Document")}${isRequired("relatedDocument") ? " *" : ""}`}
                      isViewMode={disabled || postLoading}
                      value={{ documentPath: form.relatedDocument || "", documentType: "" }}
                      onChange={(doc) => update("relatedDocument", doc.documentPath || "")}
                      uploadPrefix="accidentRegister"
                      uploadButtonText="Upload Related Document"
                      successTitle="Related Document"
                      successSubtitle="Document uploaded successfully"
                      wrapperClassName="space-y-2"
                      labelClassName="text-xs font-medium text-gray-700 uppercase tracking-wide"
                    />
                    {errors.relatedDocument && <p className="text-red-500 text-xs">{errors.relatedDocument}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
          {showAccidentInfoSection && <Separator />}
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
            {initialValue !== null ? "Save" : "Add Record"}
          </Button>
        </div>
      </div>
    </div>
  )
}
