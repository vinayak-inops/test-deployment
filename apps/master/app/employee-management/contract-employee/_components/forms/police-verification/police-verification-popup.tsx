"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Shield, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import DocumentUploadField from "../../../../../../components/fields/document-upload-field"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_POLICE_VERIFICATION,
  createPoliceVerificationItemSchema,
  normalizePoliceVerificationConfig,
  type PoliceVerificationConfig,
  type PoliceVerificationFieldKey,
  type PoliceVerification,
} from "../../schemas/police-verification-form-schema"

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export type UploadDocumentFn = (file: File, fileName?: string) => Promise<{ success: boolean; serverPath?: string }>
export type PreviewDocumentFn = (doc: { path?: string; mime?: string; title?: string }) => void

interface PoliceVerificationPopupProps {
  open: boolean
  onClose: () => void
  initialValue: PoliceVerification | null
  onSubmit: (values: PoliceVerification[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  policeVerifications: PoliceVerification[]
  editIndex: number | null
  refetchPoliceVerifications?: () => Promise<void> | void
  disabled?: boolean
  uploadDocument: UploadDocumentFn
  employeeID: string
  onPreviewDocument?: PreviewDocumentFn
}

export function PoliceVerificationPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  policeVerifications,
  editIndex,
  refetchPoliceVerifications,
  disabled = false,
  uploadDocument: _uploadDocument,
  employeeID,
  onPreviewDocument: _onPreviewDocument,
}: PoliceVerificationPopupProps) {
  const [form, setForm] = useState<PoliceVerification>({ ...EMPTY_POLICE_VERIFICATION })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingPoliceVerifications, setPendingPoliceVerifications] = useState<PoliceVerification[] | null>(null)
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const policeVerificationConfig = useMemo(
    () =>
      normalizePoliceVerificationConfig(
        formStructure?.policeVerification as PoliceVerificationConfig | undefined
      ),
    [formStructure]
  )
  const policeVerificationItemSchema = useMemo(
    () => createPoliceVerificationItemSchema(policeVerificationConfig),
    [policeVerificationConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = policeVerificationConfig.fields
    return (field: PoliceVerificationFieldKey): boolean => {
      switch (field) {
        case "verificationDate":
          return fields.verificationDate?.required ?? true
        case "nextVerificationDate":
          return fields.nextVerificationDate?.required ?? true
        case "description":
          return fields.description?.required ?? true
        case "policeStationDetail":
          return fields.policeStationDetail?.required ?? true
        case "policeStationPinCode":
          return Boolean(fields.policeStationPinCode?.required)
        case "documentPath":
          return Boolean(fields.documentPath?.required)
        default:
          return false
      }
    }
  }, [policeVerificationConfig])
  const isVisible = useMemo(() => {
    const fields = policeVerificationConfig.fields
    return (field: PoliceVerificationFieldKey): boolean => fields[field]?.visible ?? true
  }, [policeVerificationConfig])
  const getLabel = useMemo(() => {
    const fields = policeVerificationConfig.fields
    return (field: PoliceVerificationFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [policeVerificationConfig])
  const showDetailsSection =
    isVisible("verificationDate") ||
    isVisible("nextVerificationDate") ||
    isVisible("description") ||
    isVisible("policeStationDetail") ||
    isVisible("policeStationPinCode") ||
    isVisible("isActive")
  const showDocumentSection = isVisible("documentPath")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_POLICE_VERIFICATION })
      setErrors({})
      setPendingPoliceVerifications(null)
    }
  }, [open, initialValue])

  const update = (field: keyof PoliceVerification, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as string]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const { post: postPoliceVerification, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const normalizeServerField = (fieldName: string): PoliceVerificationFieldKey | null => {
          const fieldMap: Record<string, PoliceVerificationFieldKey> = {
            verificationDate: "verificationDate",
            nextVerificationDate: "nextVerificationDate",
            description: "description",
            policeStationDetail: "policeStationDetail",
            policeStationPinCode: "policeStationPinCode",
            documentPath: "documentPath",
            isActive: "isActive",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("policeVerification.")) {
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

      toast.success("Police verification records saved successfully!")
      if (pendingPoliceVerifications) {
        onSubmit(pendingPoliceVerifications)
      }
      setPendingPoliceVerifications(null)
      await refetchPoliceVerifications?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving police verification records:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || disabled || postLoading) return
    const result = policeVerificationItemSchema.safeParse(form)
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

    const payloadPoliceVerification = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_POLICE_VERIFICATION,
      ...result.data,
    } as PoliceVerification

    const parseId = (payloadPoliceVerification as Record<string, any>)?.parseID
    const next =
      parseId
        ? policeVerifications.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadPoliceVerification : row
          )
        : editIndex !== null
          ? policeVerifications.map((row, index) => (index === editIndex ? payloadPoliceVerification : row))
          : [...policeVerifications, payloadPoliceVerification]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetPoliceVerificationTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        policeVerification: [payloadPoliceVerification],
        ...(shouldSetPoliceVerificationTab ? { policeVerificationtab: true } : {}),
      },
    }

    setPendingPoliceVerifications(next)
    postPoliceVerification(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialValue !== null ? "Edit Police Verification" : "Add Police Verification"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter police verification details.</p>
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
          {showDetailsSection && (
          <div className="space-y-3">
            <SubFormTitle title="Police Verification Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isVisible("verificationDate") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("verificationDate", "Verification Date")} {isRequired("verificationDate") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="date"
                  value={form.verificationDate}
                  onChange={(e) => update("verificationDate", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className={INPUT_CLASS}
                  disabled={disabled || postLoading}
                />
                {errors.verificationDate && <p className="text-red-500 text-xs">{errors.verificationDate}</p>}
              </div>
              )}

              {isVisible("nextVerificationDate") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("nextVerificationDate", "Expiry Date")} {isRequired("nextVerificationDate") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="date"
                  min={form.verificationDate || undefined}
                  value={form.nextVerificationDate}
                  onChange={(e) => update("nextVerificationDate", e.target.value)}
                  className={INPUT_CLASS}
                  disabled={disabled || postLoading}
                />
                {errors.nextVerificationDate && <p className="text-red-500 text-xs">{errors.nextVerificationDate}</p>}
              </div>
              )}

              {isVisible("description") && (
              <div className="space-y-2 md:col-span-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("description", "Description")} {isRequired("description") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter verification description"
                  disabled={disabled || postLoading}
                />
                {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
              </div>
              )}

              {isVisible("policeStationDetail") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("policeStationDetail", "Police Jurisdiction")} {isRequired("policeStationDetail") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.policeStationDetail}
                  onChange={(e) => update("policeStationDetail", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter police station detail"
                  disabled={disabled || postLoading}
                />
                {errors.policeStationDetail && <p className="text-red-500 text-xs">{errors.policeStationDetail}</p>}
              </div>
              )}

              {isVisible("policeStationPinCode") && (
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("policeStationPinCode", "Police Station Pin Code")} {isRequired("policeStationPinCode") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={form.policeStationPinCode || ""}
                  onChange={(e) => update("policeStationPinCode", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter pin code"
                  disabled={disabled || postLoading}
                />
                {errors.policeStationPinCode && <p className="text-red-500 text-xs">{errors.policeStationPinCode}</p>}
              </div>
              )}

              {isVisible("isActive") && (
              <div className="space-y-2 md:col-span-2 border border-gray-200 rounded-lg p-3">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getLabel("isActive", "Active Status")}
                </Label>
                <div className="h-9 flex items-center gap-2">
                  <Checkbox
                    checked={form.isActive}
                    onCheckedChange={(checked) => update("isActive", !!checked)}
                    disabled={disabled || postLoading}
                  />
                  <Label className="text-sm text-gray-700">{form.isActive ? "Active" : "Inactive"}</Label>
                </div>
              </div>
              )}
            </div>
          </div>
          )}

          {showDetailsSection && showDocumentSection ? <Separator /> : null}

          {showDocumentSection && (
          <div className="space-y-2">
            <SubFormTitle title="Verification Document" />
            <DocumentUploadField
              id="popup-policeverification-file"
              label={`${getLabel("documentPath", "Police Verification Document")}${isRequired("documentPath") ? " *" : ""}`}
              isViewMode={disabled || postLoading}
              employeeID={employeeID}
              value={{ documentPath: form.documentPath || "", documentType: "" }}
              onChange={(doc) => update("documentPath", doc.documentPath || "")}
              uploadPrefix="policeverification"
              wrapperClassName="space-y-2"
              labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
              uploadButtonText="Upload Document"
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
            disabled={disabled || shouldShowConfigLoader || postLoading}
          >
            {initialValue !== null ? "Save" : "Add Verification"}
          </Button>
        </div>
      </div>
    </div>
  )
}
