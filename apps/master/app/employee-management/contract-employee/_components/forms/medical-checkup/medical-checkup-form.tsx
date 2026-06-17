"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { FileText, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import DocumentUploadField from "../../../../../../components/fields/document-upload-field"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_MEDICAL_CHECKUP,
  createMedicalCheckupSchema,
  normalizeMedicalCheckupConfig,
  type MedicalCheckupConfig,
  type MedicalCheckupFieldKey,
  type MedicalCheckup,
} from "../../schemas/medical-checkup-form-schema"
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export type UploadDocumentFn = (file: File, fileName?: string) => Promise<{ success: boolean; serverPath?: string }>
export type PreviewDocumentFn = (doc: { path?: string; mime?: string; title?: string }) => void

interface MedicalCheckupFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: MedicalCheckup | null
  onSubmit: (values: MedicalCheckup[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  medicalCheckups: MedicalCheckup[]
  editIndex: number | null
  refetchMedicalCheckups?: () => Promise<void> | void
  disabled?: boolean
  uploadDocument: UploadDocumentFn
  employeeID: string
  onPreviewDocument?: PreviewDocumentFn
}

export function MedicalCheckupFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  medicalCheckups,
  editIndex,
  refetchMedicalCheckups,
  disabled = false,
  uploadDocument: _uploadDocument,
  employeeID,
  onPreviewDocument: _onPreviewDocument,
}: MedicalCheckupFormPopupProps) {
  const [form, setForm] = useState<MedicalCheckup>({ ...EMPTY_MEDICAL_CHECKUP })
  const [errors, setErrors] = useState<Partial<Record<MedicalCheckupFieldKey, string>>>({})
  const [pendingMedicalCheckups, setPendingMedicalCheckups] = useState<MedicalCheckup[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const medicalCheckupConfig = useMemo(
    () =>
      normalizeMedicalCheckupConfig(
        formStructure?.medicalCheckups as MedicalCheckupConfig | undefined
      ),
    [formStructure]
  )
  const medicalCheckupSchema = useMemo(
    () => createMedicalCheckupSchema(medicalCheckupConfig),
    [medicalCheckupConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = medicalCheckupConfig.fields
    return (field: keyof MedicalCheckup): boolean => {
      if (field === "checkupDate") return fields.checkupDate?.required ?? true
      if (field === "nextCheckupDate") return fields.nextCheckupDate?.required ?? true
      if (field === "description") return fields.description?.required ?? true
      return Boolean(fields.documentPath?.required)
    }
  }, [medicalCheckupConfig])
  const isVisible = useMemo(() => {
    const fields = medicalCheckupConfig.fields
    return (field: MedicalCheckupFieldKey): boolean => fields[field]?.visible ?? true
  }, [medicalCheckupConfig])
  const getLabel = useMemo(() => {
    const fields = medicalCheckupConfig.fields
    return (field: MedicalCheckupFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [medicalCheckupConfig])
  const showMedicalDetailsSection =
    isVisible("checkupDate") ||
    isVisible("nextCheckupDate") ||
    isVisible("description")
  const showMedicalDocSection = isVisible("documentPath")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_MEDICAL_CHECKUP })
      setErrors({})
      setPendingMedicalCheckups(null)
    }
  }, [open, initialValue])

  const update = (field: keyof MedicalCheckup, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    const fieldKey = field as MedicalCheckupFieldKey
    if (errors[fieldKey]) setErrors((prev) => ({ ...prev, [fieldKey]: "" }))
  }

  const { post: postMedicalCheckup, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const normalizeServerField = (fieldName: string): MedicalCheckupFieldKey | null => {
          const fieldMap: Record<string, MedicalCheckupFieldKey> = {
            checkupDate: "checkupDate",
            nextCheckupDate: "nextCheckupDate",
            description: "description",
            documentPath: "documentPath",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("medicalCheckup.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Partial<Record<MedicalCheckupFieldKey, string>> = {}
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

      toast.success("Medical checkups saved successfully!")
      if (pendingMedicalCheckups) {
        onSubmit(pendingMedicalCheckups)
      }
      setPendingMedicalCheckups(null)
      await refetchMedicalCheckups?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving medical checkups:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || disabled || postLoading) return
    const result = medicalCheckupSchema.safeParse(form)
    if (!result.success) {
      const err: Partial<Record<MedicalCheckupFieldKey, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".") as MedicalCheckupFieldKey
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})

    const payloadMedicalCheckup = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_MEDICAL_CHECKUP,
      ...result.data,
    } as MedicalCheckup

    const parseId = (payloadMedicalCheckup as Record<string, any>)?.parseID
    const next =
      parseId
        ? medicalCheckups.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadMedicalCheckup : row
          )
        : editIndex !== null
          ? medicalCheckups.map((row, index) => (index === editIndex ? payloadMedicalCheckup : row))
          : [...medicalCheckups, payloadMedicalCheckup]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetMedicalCheckupsTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
            event: "validate",
            ruleId: "",
      data: {
        medicalCheckup: [payloadMedicalCheckup],
        ...(shouldSetMedicalCheckupsTab ? { medicalCheckupstab: true } : {}),
      },
      audit: auditPayload,
    }

    setPendingMedicalCheckups(next)
    postMedicalCheckup(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialValue !== null ? "Edit Medical Checkup" : "Add Medical Checkup"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter checkup details.</p>
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
          {showMedicalDetailsSection && (
          <div className="space-y-3">
            <SubFormTitle title="Medical Checkup Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible("checkupDate") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("checkupDate", "Checkup Date")}
                {isRequired("checkupDate") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                type="date"
                value={form.checkupDate}
                onChange={(e) => update("checkupDate", e.target.value)}
                className={INPUT_CLASS}
                disabled={disabled || postLoading}
              />
              {errors.checkupDate && <p className="text-red-500 text-xs">{errors.checkupDate}</p>}
            </div>
            )}
            {isVisible("nextCheckupDate") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("nextCheckupDate", "Next Checkup Date")}
                {isRequired("nextCheckupDate") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                type="date"
                min={form.checkupDate || undefined}
                value={form.nextCheckupDate}
                onChange={(e) => update("nextCheckupDate", e.target.value)}
                className={INPUT_CLASS}
                disabled={disabled || postLoading}
              />
              {errors.nextCheckupDate && <p className="text-red-500 text-xs">{errors.nextCheckupDate}</p>}
            </div>
            )}
            {isVisible("description") && (
            <div className="space-y-2 md:col-span-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("description", "Description")}
                {isRequired("description") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter checkup description"
                disabled={disabled || postLoading}
              />
              {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
            </div>
            )}
            </div>
          </div>
          )}

          {(showMedicalDetailsSection && showMedicalDocSection) && <Separator />}

          {showMedicalDocSection && (
          <div className="space-y-2">
            <SubFormTitle title="Medical Document" />
            <DocumentUploadField
              id="popup-medicalcheck-file"
              label={`${getLabel("documentPath", "Medical Checkup Document")}${isRequired("documentPath") ? " *" : ""}`}
              isViewMode={disabled || postLoading}
              employeeID={employeeID}
              value={{ documentPath: form.documentPath || "", documentType: "" }}
              onChange={(doc) => update("documentPath", doc.documentPath || "")}
              uploadPrefix="medicalcheck"
              wrapperClassName="space-y-2"
              labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
              uploadButtonText="Upload Document"
            />
          </div>
          )}
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
            {initialValue !== null ? "Save" : "Add Checkup"}
          </Button>
        </div>
      </div>
    </div>
  )
}
