"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { Briefcase, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import DocumentUploadField from "../../../../../../components/fields/document-upload-field"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_EXPERIENCE,
  createExperienceSchema,
  normalizeExperienceConfig,
  type Experience,
  type ExperienceConfig,
  type ExperienceFieldKey,
} from "../../schemas/experience-form-schema"
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export type UploadDocumentFn = (file: File, fileName?: string) => Promise<{ success: boolean; serverPath?: string }>
export type PreviewDocumentFn = (doc: { path?: string; mime?: string; title?: string }) => void

interface ExperienceFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: Experience | null
  onSubmit: (values: Experience[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  experiences: Experience[]
  editIndex: number | null
  refetchExperience?: () => Promise<void> | void
  disabled?: boolean
  uploadDocument: UploadDocumentFn
  employeeID: string
  onPreviewDocument?: PreviewDocumentFn
}

export function ExperienceFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  experiences,
  editIndex,
  refetchExperience,
  disabled = false,
  uploadDocument: _uploadDocument,
  employeeID,
  onPreviewDocument: _onPreviewDocument,
}: ExperienceFormPopupProps) {
  const [form, setForm] = useState<Experience>({ ...EMPTY_EXPERIENCE })
  const [errors, setErrors] = useState<Partial<Record<ExperienceFieldKey, string>>>({})
  const [pendingExperiences, setPendingExperiences] = useState<Experience[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const experienceConfig = useMemo(
    () =>
      normalizeExperienceConfig(
        formStructure?.experiences as ExperienceConfig | undefined
      ),
    [formStructure]
  )
  const experienceSchema = useMemo(
    () => createExperienceSchema(experienceConfig),
    [experienceConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = experienceConfig.fields
    return (field: keyof Experience): boolean => Boolean(fields[field]?.required)
  }, [experienceConfig])
  const isVisible = useMemo(() => {
    const fields = experienceConfig.fields
    return (field: ExperienceFieldKey): boolean => fields[field]?.visible ?? true
  }, [experienceConfig])
  const getLabel = useMemo(() => {
    const fields = experienceConfig.fields
    return (field: ExperienceFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [experienceConfig])
  const showExperienceSection =
    isVisible("companyName") ||
    isVisible("designation") ||
    isVisible("fromDate") ||
    isVisible("toDate")
  const showExperienceDocumentSection = isVisible("filePath")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_EXPERIENCE })
      setErrors({})
      setPendingExperiences(null)
    }
  }, [open, initialValue])

  const update = (field: keyof Experience, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    const fieldKey = field as ExperienceFieldKey
    if (errors[fieldKey]) setErrors((prev) => ({ ...prev, [fieldKey]: "" }))
  }

  const { post: postExperience, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const normalizeServerField = (fieldName: string): ExperienceFieldKey | null => {
          const fieldMap: Record<string, ExperienceFieldKey> = {
            companyName: "companyName",
            designation: "designation",
            fromDate: "fromDate",
            toDate: "toDate",
            filePath: "filePath",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("experience.") || fieldName.startsWith("experiences.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Partial<Record<ExperienceFieldKey, string>> = {}
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

      toast.success("Experience data saved successfully!")
      if (pendingExperiences) {
        onSubmit(pendingExperiences)
      }
      setPendingExperiences(null)
      await refetchExperience?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving experience data:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || disabled || postLoading) return
    const result = experienceSchema.safeParse(form)
    if (!result.success) {
      const err: Partial<Record<ExperienceFieldKey, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".") as ExperienceFieldKey
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})

    const payloadExperience = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_EXPERIENCE,
      ...result.data,
    } as Experience

    const parseId = (payloadExperience as Record<string, any>)?.parseID
    const next =
      parseId
        ? experiences.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadExperience : row
          )
        : editIndex !== null
          ? experiences.map((row, index) => (index === editIndex ? payloadExperience : row))
          : [...experiences, payloadExperience]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetExperienceTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        experience: [payloadExperience],
        ...(shouldSetExperienceTab ? { experiencestab: true } : {}),
      },
      audit: auditPayload,
    }

    setPendingExperiences(next)
    postExperience(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Briefcase className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialValue !== null ? "Edit Work Experience" : "Add Work Experience"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter work experience details.</p>
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
          {showExperienceSection && (
          <div className="space-y-3">
            <SubFormTitle title="Experience Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible("companyName") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("companyName", "Company Name")}
                {isRequired("companyName") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.companyName || ""}
                onChange={(e) => update("companyName", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter company name"
                disabled={disabled || postLoading}
              />
              {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName}</p>}
            </div>
            )}
            {isVisible("designation") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("designation", "Designation")}
                {isRequired("designation") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.designation || ""}
                onChange={(e) => update("designation", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter designation"
                disabled={disabled || postLoading}
              />
              {errors.designation && <p className="text-red-500 text-xs">{errors.designation}</p>}
            </div>
            )}
            {isVisible("fromDate") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("fromDate", "From Date")}
                {isRequired("fromDate") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                type="date"
                value={form.fromDate || ""}
                onChange={(e) => update("fromDate", e.target.value)}
                className={INPUT_CLASS}
                disabled={disabled || postLoading}
              />
              {errors.fromDate && <p className="text-red-500 text-xs">{errors.fromDate}</p>}
            </div>
            )}
            {isVisible("toDate") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("toDate", "To Date")}
                {isRequired("toDate") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                type="date"
                min={form.fromDate || undefined}
                value={form.toDate || ""}
                onChange={(e) => update("toDate", e.target.value)}
                className={INPUT_CLASS}
                disabled={disabled || postLoading}
              />
              {errors.toDate && <p className="text-red-500 text-xs">{errors.toDate}</p>}
            </div>
            )}
            </div>
          </div>
          )}

          {(showExperienceSection && showExperienceDocumentSection) && <Separator />}

          {showExperienceDocumentSection && (
          <div className="space-y-2">
            <SubFormTitle title="Experience Document" />
            <DocumentUploadField
              id="popup-experience-file"
              label={`${getLabel("filePath", "Experience Document")}${isRequired("filePath") ? " *" : ""}`}
              isViewMode={disabled || postLoading}
              employeeID={employeeID}
              value={{ documentPath: form.filePath || "", documentType: "" }}
              onChange={(doc) => update("filePath", doc.documentPath || "")}
              uploadPrefix="experience"
              wrapperClassName="space-y-2"
              labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
              uploadButtonText="Upload Document"
            />
            {errors.filePath && <p className="text-red-500 text-xs">{errors.filePath}</p>}
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
            {initialValue !== null ? "Save" : "Add Experience"}
          </Button>
        </div>
      </div>
    </div>
  )
}
