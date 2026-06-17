"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { AlertTriangle, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import DocumentUploadField from "../../../../../../components/fields/document-upload-field"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_DISCIPLINARY_ACTION,
  createDisciplinaryActionItemSchema,
  normalizeDisciplinaryActionConfig,
  type DisciplinaryActionConfig,
  type DisciplinaryActionFieldKey,
  type DisciplinaryActionItem,
} from "../../schemas/disciplinary-action-form-schema"

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

interface DisciplinaryActionSectionFormProps {
  open: boolean
  onClose: () => void
  initialValue: DisciplinaryActionItem | null
  onSubmit: (values: DisciplinaryActionItem[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  disciplinaryActions: DisciplinaryActionItem[]
  editIndex: number | null
  refetchDisciplinaryActions?: () => Promise<void> | void
  isViewMode?: boolean
  uploadDocument: (file: File, fileName?: string) => Promise<any>
  employeeID?: string
}

export function DisciplinaryActionSectionForm({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  disciplinaryActions,
  editIndex,
  refetchDisciplinaryActions,
  isViewMode,
  uploadDocument: _uploadDocument,
  employeeID,
}: DisciplinaryActionSectionFormProps) {
  const [form, setForm] = useState<DisciplinaryActionItem>({ ...EMPTY_DISCIPLINARY_ACTION })
  const [errors, setErrors] = useState<Partial<Record<DisciplinaryActionFieldKey, string>>>({})
  const [pendingActions, setPendingActions] = useState<DisciplinaryActionItem[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const disciplinaryConfig = useMemo(
    () =>
      normalizeDisciplinaryActionConfig(
        formStructure?.disciplinaryAction as DisciplinaryActionConfig | undefined
      ),
    [formStructure]
  )
  const disciplinaryActionItemSchema = useMemo(
    () => createDisciplinaryActionItemSchema(disciplinaryConfig),
    [disciplinaryConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = disciplinaryConfig.fields
    return (field: keyof DisciplinaryActionItem): boolean => {
      switch (field) {
        case "issueReportedOn":
          return fields.issueReportedOn?.required ?? true
        case "actionTakenOn":
          return fields.actionTakenOn?.required ?? true
        case "status":
          return fields.status?.required ?? true
        case "issuedescription":
          return fields.issuedescription?.required ?? true
        case "actionDescription":
          return fields.actionDescription?.required ?? true
        case "remark":
          return Boolean(fields.remark?.required)
        case "documentPath":
          return Boolean(fields.documentPath?.required)
        default:
          return false
      }
    }
  }, [disciplinaryConfig])
  const isVisible = useMemo(() => {
    const fields = disciplinaryConfig.fields
    return (field: DisciplinaryActionFieldKey): boolean => fields[field]?.visible ?? true
  }, [disciplinaryConfig])
  const getLabel = useMemo(() => {
    const fields = disciplinaryConfig.fields
    return (field: DisciplinaryActionFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [disciplinaryConfig])
  const showActionDetailsSection =
    isVisible("issueReportedOn") ||
    isVisible("actionTakenOn") ||
    isVisible("status") ||
    isVisible("issuedescription") ||
    isVisible("actionDescription") ||
    isVisible("remark")
  const showDocumentSection = isVisible("documentPath")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_DISCIPLINARY_ACTION })
      setErrors({})
      setPendingActions(null)
    }
    // intentionally omit initialValue — re-seeding on every parent render would overwrite user edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
  const { post: postDisciplinaryAction, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): DisciplinaryActionFieldKey | null => {
          const fieldMap: Record<string, DisciplinaryActionFieldKey> = {
            issueReportedOn: "issueReportedOn",
            actionTakenOn: "actionTakenOn",
            status: "status",
            issuedescription: "issuedescription",
            actionDescription: "actionDescription",
            remark: "remark",
            documentPath: "documentPath",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("disciplinaryAction.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Partial<Record<DisciplinaryActionFieldKey, string>> = {}
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

      toast.success("Disciplinary actions saved successfully!")
      if (pendingActions) {
        onSubmit(pendingActions)
      }
      setPendingActions(null)
      await refetchDisciplinaryActions?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving disciplinary actions:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || isViewMode || postLoading) return
    const result = disciplinaryActionItemSchema.safeParse(form)
    if (!result.success) {
      const err: Partial<Record<DisciplinaryActionFieldKey, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".") as DisciplinaryActionFieldKey
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})
    const payloadAction = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_DISCIPLINARY_ACTION,
      ...result.data,
    } as DisciplinaryActionItem
    const parseId = (payloadAction as Record<string, any>)?.parseID
    const next =
      parseId
        ? disciplinaryActions.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadAction : row
          )
        : editIndex !== null
          ? disciplinaryActions.map((row, index) => (index === editIndex ? payloadAction : row))
          : [...disciplinaryActions, payloadAction]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetDisciplinaryActionTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        disciplinaryAction: [payloadAction],
        ...(shouldSetDisciplinaryActionTab ? { disciplinaryActiontab: true } : {}),
      },
      audit: auditPayload,
    }
    setPendingActions(next)
    postDisciplinaryAction(payload)
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
              <h3 className="text-sm font-semibold text-gray-900">{initialValue !== null ? "Edit Disciplinary Action" : "Add Disciplinary Action"}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Fill action details and upload document.</p>
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
          {showActionDetailsSection && (
            <div className="space-y-3">
              <SubFormTitle title="Action Details" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isVisible("issueReportedOn") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("issueReportedOn", "Issue Reported On")} {isRequired("issueReportedOn") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="date"
                      value={form.issueReportedOn || ""}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, issueReportedOn: e.target.value }))
                        if (errors.issueReportedOn) setErrors((prev) => ({ ...prev, issueReportedOn: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={isViewMode || postLoading}
                    />
                    {errors.issueReportedOn && <p className="text-red-500 text-xs">{errors.issueReportedOn}</p>}
                  </div>
                )}

                {isVisible("actionTakenOn") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("actionTakenOn", "Action Taken On")} {isRequired("actionTakenOn") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      type="date"
                      value={form.actionTakenOn || ""}
                      min={form.issueReportedOn || undefined}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, actionTakenOn: e.target.value }))
                        if (errors.actionTakenOn) setErrors((prev) => ({ ...prev, actionTakenOn: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={isViewMode || postLoading}
                    />
                    {errors.actionTakenOn && <p className="text-red-500 text-xs">{errors.actionTakenOn}</p>}
                  </div>
                )}

                {isVisible("status") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("status", "Status")} {isRequired("status") && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={form.status || "Open"}
                      disabled={isViewMode || postLoading}
                      onValueChange={(value) => {
                        setForm((prev) => ({ ...prev, status: value }))
                        if (errors.status) setErrors((prev) => ({ ...prev, status: "" }))
                      }}
                    >
                      <SelectTrigger className={INPUT_CLASS}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="text-red-500 text-xs">{errors.status}</p>}
                  </div>
                )}

                {isVisible("issuedescription") && (
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("issuedescription", "Issue Description")} {isRequired("issuedescription") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      value={form.issuedescription || ""}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, issuedescription: e.target.value }))
                        if (errors.issuedescription) setErrors((prev) => ({ ...prev, issuedescription: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={isViewMode || postLoading}
                      placeholder="Enter issue description"
                    />
                    {errors.issuedescription && <p className="text-red-500 text-xs">{errors.issuedescription}</p>}
                  </div>
                )}

                {isVisible("actionDescription") && (
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("actionDescription", "Action Description")} {isRequired("actionDescription") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      value={form.actionDescription || ""}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, actionDescription: e.target.value }))
                        if (errors.actionDescription) setErrors((prev) => ({ ...prev, actionDescription: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={isViewMode || postLoading}
                      placeholder="Enter action description"
                    />
                    {errors.actionDescription && <p className="text-red-500 text-xs">{errors.actionDescription}</p>}
                  </div>
                )}

                {isVisible("remark") && (
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("remark", "Remark")} {isRequired("remark") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      value={form.remark || ""}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, remark: e.target.value }))
                        if (errors.remark) setErrors((prev) => ({ ...prev, remark: "" }))
                      }}
                      className={INPUT_CLASS}
                      disabled={isViewMode || postLoading}
                      placeholder="Enter remark"
                    />
                    {errors.remark && <p className="text-red-500 text-xs">{errors.remark}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {(showActionDetailsSection && showDocumentSection) && <Separator />}

          {showDocumentSection && (
            <div className="space-y-2">
              <SubFormTitle title="Document" />
              <DocumentUploadField
                id="popup-disciplinary-file"
                label={`${getLabel("documentPath", "Disciplinary Document")}${isRequired("documentPath") ? " *" : ""}`}
                isViewMode={Boolean(isViewMode)}
                employeeID={employeeID}
                value={{ documentPath: form.documentPath || "", documentType: "" }}
                onChange={(doc) => {
                  setForm((prev) => ({ ...prev, documentPath: doc.documentPath || "" }))
                  if (errors.documentPath) setErrors((prev) => ({ ...prev, documentPath: "" }))
                }}
                uploadPrefix="disciplinary"
                wrapperClassName="space-y-2"
                labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                uploadButtonText="Upload Disciplinary Document"
              />
              {errors.documentPath && <p className="text-red-500 text-xs">{errors.documentPath}</p>}
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
            disabled={isViewMode || shouldShowConfigLoader || postLoading}
          >
            {initialValue !== null ? "Save" : "Add Action"}
          </Button>
        </div>
      </div>

    </div>
  )
}

export default DisciplinaryActionSectionForm
