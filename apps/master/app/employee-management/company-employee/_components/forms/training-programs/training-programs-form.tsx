"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Upload, FileCheck, X, GraduationCap } from "lucide-react"
import DocumentPreview from "@/components/popup/document-preview"
import { SingleSelectField } from "@/components/fields/single-select-field"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  createTrainingProgramItemSchema,
  EMPTY_TRAINING_PROGRAM,
  normalizeTrainingProgramsConfig,
  type TrainingProgramFieldKey,
  type TrainingProgramItem,
  type TrainingProgramsConfig,
} from "../../schemas/training-programs-form-schema"

interface TrainingProgramsFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: TrainingProgramItem | null
  onSubmit: (values: TrainingProgramItem[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeCollectionUrl?: string
  trainings: TrainingProgramItem[]
  editIndex: number | null
  refetchTrainings?: () => Promise<void> | void
  isViewMode?: boolean
  employeeID?: string
  uploadDocument: (file: File, fileName?: string) => Promise<any>
}

type TrainingProgramMasterOption = {
  trainingProgramCode?: string
  trainingProgramTitle?: string
}

export function TrainingProgramsFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeCollectionUrl = "contract_employee",
  trainings,
  editIndex,
  refetchTrainings,
  isViewMode = false,
  employeeID,
  uploadDocument,
}: TrainingProgramsFormPopupProps) {
  const [form, setForm] = useState<TrainingProgramItem>({ ...EMPTY_TRAINING_PROGRAM })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingTrainings, setPendingTrainings] = useState<TrainingProgramItem[] | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const localTenantCode = useGetTenantCode()
  const effectiveTenantCode = tenantCode || localTenantCode
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const trainingProgramsConfig = useMemo(
    () =>
      normalizeTrainingProgramsConfig(
        ((formStructure as any)?.trainingProgram ?? (formStructure as any)?.trainingPrograms) as
          | TrainingProgramsConfig
          | undefined
      ),
    [formStructure]
  )
  const trainingProgramItemSchema = useMemo(
    () => createTrainingProgramItemSchema(trainingProgramsConfig),
    [trainingProgramsConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = trainingProgramsConfig.fields
    return (field: TrainingProgramFieldKey): boolean => {
      if (field === "trainingProgramCode" || field === "trainingProgramTitle") {
        return fields[field]?.required ?? true
      }
      return Boolean(fields[field]?.required)
    }
  }, [trainingProgramsConfig])
  const isVisible = useMemo(() => {
    const fields = trainingProgramsConfig.fields
    return (field: TrainingProgramFieldKey): boolean => fields[field]?.visible ?? true
  }, [trainingProgramsConfig])
  const getLabel = useMemo(() => {
    const fields = trainingProgramsConfig.fields
    return (field: TrainingProgramFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [trainingProgramsConfig])
  const showProgramSection = isVisible("trainingProgramCode") || isVisible("trainingProgramTitle")
  const showCertificateSection = isVisible("filePath")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_TRAINING_PROGRAM })
      setErrors({})
      setPendingTrainings(null)
    }
  }, [open, initialValue])

  const organizationCriteriaRequests = useMemo(() => {
    if (!effectiveTenantCode) return []
    return [{ field: "tenantCode", operator: "eq", value: effectiveTenantCode }]
  }, [effectiveTenantCode])

  const { arrayData: trainingMasterArray } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "trainingMaster",
    enabled: Boolean(effectiveTenantCode),
    defaultValue: [],
  })

  const trainingPrograms = useMemo<TrainingProgramMasterOption[]>(() => {
    const firstMaster = Array.isArray(trainingMasterArray) && trainingMasterArray.length > 0 ? trainingMasterArray[0] : null
    return Array.isArray(firstMaster?.trainingPrograms) ? firstMaster.trainingPrograms : []
  }, [trainingMasterArray])

  const programOptions = useMemo(
    () =>
      trainingPrograms.map((item: TrainingProgramMasterOption) => ({
        value: item.trainingProgramCode || "",
        label: `${item.trainingProgramCode || ""} - ${item.trainingProgramTitle || ""}`,
        tooltip: `${item.trainingProgramCode || ""} - ${item.trainingProgramTitle || ""}`,
      })),
    [trainingPrograms]
  )

  const guessMimeFromPath = (path: string): string => {
    const lower = (path || "").toLowerCase()
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
    if (lower.endsWith(".png")) return "image/png"
    if (lower.endsWith(".gif")) return "image/gif"
    if (lower.endsWith(".webp")) return "image/webp"
    if (lower.endsWith(".pdf")) return "application/pdf"
    if (lower.endsWith(".doc")) return "application/msword"
    if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    return "application/octet-stream"
  }

  const { post: postTrainings, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const nextErrors: Record<string, string> = {}
        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
            if (typeof message !== "string" || !message.trim()) return
            if (fieldName.includes("trainingProgramCode") || fieldName.includes("trainingProgramTitle")) {
              nextErrors.trainingProgram = message
              return
            }
            if (fieldName.includes("fromDate")) nextErrors.fromDate = message
            else if (fieldName.includes("toDate")) nextErrors.toDate = message
            else if (fieldName.includes("totalDays")) nextErrors.totalDays = message
            else if (fieldName.includes("totalHours")) nextErrors.totalHours = message
            else if (fieldName.includes("validUpto")) nextErrors.validUpto = message
            else if (fieldName.includes("conductedByFaculty")) nextErrors.conductedByFaculty = message
            else if (fieldName.includes("conductedByCompany")) nextErrors.conductedByCompany = message
            else if (fieldName.includes("filePath")) nextErrors.filePath = message
          })
        }
        setErrors(nextErrors)
        return
      }

      toast.success("Training programs saved successfully!")
      if (pendingTrainings) {
        onSubmit(pendingTrainings)
      }
      setPendingTrainings(null)
      await refetchTrainings?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving training programs:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || isViewMode || postLoading) return
    const result = trainingProgramItemSchema.safeParse(form)
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

    const payloadTraining = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_TRAINING_PROGRAM,
      ...result.data,
    } as TrainingProgramItem

    const parseId = (payloadTraining as Record<string, any>)?.parseID
    const next =
      parseId
        ? trainings.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadTraining : row
          )
        : editIndex !== null
          ? trainings.map((row, index) => (index === editIndex ? payloadTraining : row))
          : [...trainings, payloadTraining]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const payload = {
      tenant: effectiveTenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        trainings: [payloadTraining],
      },
      audit: auditPayload,
    }

    setPendingTrainings(next)
    postTrainings(payload)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <GraduationCap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {initialValue !== null ? "Edit Training Program" : "Add Training Program"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Fill training details and upload certificate.</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {showProgramSection && (
              <div className="md:col-span-2 lg:col-span-1">
                <SingleSelectField
                  id="training-program-code"
                  label={getLabel("trainingProgramCode", "Training Program Code")}
                  required={isRequired("trainingProgramCode")}
                  placeholder="Search Training Program Code"
                  disabled={isViewMode || postLoading || !isVisible("trainingProgramCode")}
                  value={form.trainingProgram?.trainingProgramCode || ""}
                  onChange={(value) => {
                    const selected = trainingPrograms.find((item: TrainingProgramMasterOption) => item.trainingProgramCode === value)
                    setForm((prev) => ({
                      ...prev,
                      trainingProgram: {
                        trainingProgramCode: value,
                        trainingProgramTitle: selected?.trainingProgramTitle || "",
                      },
                    }))
                    setErrors((prev) => ({ ...prev, trainingProgram: "" }))
                  }}
                  options={programOptions}
                  showOnlyValueInTrigger
                  allowOnlyProvidedOptions
                />
                {errors.trainingProgram && <p className="text-red-500 text-xs mt-0.5">{errors.trainingProgram}</p>}
              </div>
              )}

              {isVisible("trainingProgramTitle") && (
              <div className="md:col-span-2">
                <Label className="text-xs font-medium text-gray-700">
                  {getLabel("trainingProgramTitle", "Training Program Title")} {isRequired("trainingProgramTitle") && <span className="text-red-500">*</span>}
                </Label>
                <div className="h-9 mt-1 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800 flex items-center">
                  {form.trainingProgram?.trainingProgramTitle || "Will auto-fill from code"}
                </div>
              </div>
              )}

              {isVisible("fromDate") && (
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  {getLabel("fromDate", "From Date")} {isRequired("fromDate") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="date"
                  value={form.fromDate || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, fromDate: e.target.value }))}
                  className="h-9 mt-1 border border-gray-300 rounded-md"
                  disabled={isViewMode || postLoading}
                />
                {errors.fromDate && <p className="text-red-500 text-xs mt-0.5">{errors.fromDate}</p>}
              </div>
              )}

              {isVisible("toDate") && (
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  {getLabel("toDate", "To Date")} {isRequired("toDate") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="date"
                  value={form.toDate || ""}
                  min={form.fromDate || undefined}
                  onChange={(e) => setForm((prev) => ({ ...prev, toDate: e.target.value }))}
                  className="h-9 mt-1 border border-gray-300 rounded-md"
                  disabled={isViewMode || postLoading}
                />
                {errors.toDate && <p className="text-red-500 text-xs mt-0.5">{errors.toDate}</p>}
              </div>
              )}

              {isVisible("totalDays") && (
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  {getLabel("totalDays", "Total Days")} {isRequired("totalDays") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="number"
                  value={form.totalDays ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value
                    setForm((prev) => ({ ...prev, totalDays: raw === "" ? undefined : Number(raw) }))
                  }}
                  className="h-9 mt-1 border border-gray-300 rounded-md"
                  disabled={isViewMode || postLoading}
                  placeholder="Enter total days"
                />
                {errors.totalDays && <p className="text-red-500 text-xs mt-0.5">{errors.totalDays}</p>}
              </div>
              )}

              {isVisible("totalHours") && (
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  {getLabel("totalHours", "Total Hours")} {isRequired("totalHours") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.totalHours || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalHours: e.target.value }))}
                  className="h-9 mt-1 border border-gray-300 rounded-md"
                  disabled={isViewMode || postLoading}
                  placeholder="Enter total hours"
                />
                {errors.totalHours && <p className="text-red-500 text-xs mt-0.5">{errors.totalHours}</p>}
              </div>
              )}

              {isVisible("validUpto") && (
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  {getLabel("validUpto", "Valid Until")} {isRequired("validUpto") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="date"
                  value={form.validUpto || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, validUpto: e.target.value }))}
                  className="h-9 mt-1 border border-gray-300 rounded-md"
                  disabled={isViewMode || postLoading}
                />
                {errors.validUpto && <p className="text-red-500 text-xs mt-0.5">{errors.validUpto}</p>}
              </div>
              )}

              {isVisible("conductedByFaculty") && (
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  {getLabel("conductedByFaculty", "Conducted By Faculty")} {isRequired("conductedByFaculty") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.conductedByFaculty || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, conductedByFaculty: e.target.value }))}
                  className="h-9 mt-1 border border-gray-300 rounded-md"
                  disabled={isViewMode || postLoading}
                  placeholder="Enter faculty name"
                />
                {errors.conductedByFaculty && <p className="text-red-500 text-xs mt-0.5">{errors.conductedByFaculty}</p>}
              </div>
              )}

              {isVisible("conductedByCompany") && (
              <div>
                <Label className="text-xs font-medium text-gray-700">
                  {getLabel("conductedByCompany", "Conducted By Company")} {isRequired("conductedByCompany") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.conductedByCompany || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, conductedByCompany: e.target.value }))}
                  className="h-9 mt-1 border border-gray-300 rounded-md"
                  disabled={isViewMode || postLoading}
                  placeholder="Enter company name"
                />
                {errors.conductedByCompany && <p className="text-red-500 text-xs mt-0.5">{errors.conductedByCompany}</p>}
              </div>
              )}

              {showCertificateSection && (
              <div className="md:col-span-2 lg:col-span-3">
                <Label className="text-xs font-medium text-gray-700">
                  {getLabel("filePath", "Training Certificate")} {isRequired("filePath") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  disabled={isViewMode || postLoading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const now = new Date()
                    const isoTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
                    const fileExtension = file.name.split(".").pop()
                    const code = employeeID || "unknown"
                    const newFileName = `${code}_training_${isoTime}.${fileExtension}`
                    const renamedFile = new File([file], newFileName, { type: file.type })
                    const res = await uploadDocument(renamedFile, newFileName)
                    const filePath = res?.success && res?.serverPath ? res.serverPath : file.name
                    setForm((prev) => ({ ...prev, filePath }))
                    setErrors((prev) => ({ ...prev, filePath: "" }))
                  }}
                />

                {form.filePath ? (
                  <div className="mt-2 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <FileCheck className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">Certificate uploaded</p>
                      <p className="text-xs text-green-600">{form.filePath}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewOpen(true)}
                        className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                      >
                        Preview
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isViewMode || postLoading}
                        onClick={() => setForm((prev) => ({ ...prev, filePath: "" }))}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    disabled={isViewMode || postLoading}
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full flex items-center justify-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors bg-gray-50/50"
                  >
                    <Upload className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Upload Training Certificate</span>
                  </Button>
                )}
                {errors.filePath && <p className="text-red-500 text-xs mt-0.5">{errors.filePath}</p>}
              </div>
              )}
            </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={isViewMode || shouldShowConfigLoader || postLoading}>
              {initialValue !== null ? "Save" : "Add Training"}
            </Button>
          </div>
        </div>
      </div>

      <DocumentPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentPath={form.filePath}
        mimeType={guessMimeFromPath(form.filePath || "")}
        title={form.trainingProgram?.trainingProgramTitle || "Training Certificate"}
      />
    </>
  )
}
