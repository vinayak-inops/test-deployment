"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Separator } from "@repo/ui/components/ui/separator"
import { Users, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import DocumentUploadField from "../../../../../../components/fields/document-upload-field"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_FAMILY_MEMBER,
  createFamilyMemberSchema,
  normalizeFamilyMemberConfig,
  type FamilyMemberAadharFieldKey,
  type FamilyMemberConfig,
  type FamilyMemberElectionFieldKey,
  type FamilyMember,
  type FamilyMemberPanFieldKey,
  type FamilyMemberRootFieldKey,
  formatAadharNumber,
  getUnformattedAadhar,
  formatPanNumber,
} from "../../schemas/family-member-form-schema"

const RELATION_OPTIONS = [
  "Spouse", "Child", "Parent", "Sibling", "Father", "Mother", "Son", "Daughter", "Brother", "Sister"
]
const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"]
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export type UploadDocumentFn = (file: File, fileName?: string) => Promise<{ success: boolean; serverPath?: string }>
export type PreviewDocumentFn = (doc: { path?: string; mime?: string; title?: string }) => void

interface FamilyMemberFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: FamilyMember | null
  onSubmit: (values: FamilyMember[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  familyMembers: FamilyMember[]
  editIndex: number | null
  refetchFamilyMembers?: () => Promise<void> | void
  disabled?: boolean
  uploadDocument: UploadDocumentFn
  employeeID: string
  onPreviewDocument?: PreviewDocumentFn
}

export function FamilyMemberFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  familyMembers,
  editIndex,
  refetchFamilyMembers,
  disabled = false,
  uploadDocument: _uploadDocument,
  employeeID,
  onPreviewDocument: _onPreviewDocument,
}: FamilyMemberFormPopupProps) {
  const [form, setForm] = useState<FamilyMember>({ ...EMPTY_FAMILY_MEMBER })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingFamilyMembers, setPendingFamilyMembers] = useState<FamilyMember[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const familyMemberConfig = useMemo(
    () =>
      normalizeFamilyMemberConfig(
        formStructure?.familyMembers as FamilyMemberConfig | undefined
      ),
    [formStructure]
  )
  const familyMemberSchema = useMemo(
    () => createFamilyMemberSchema(familyMemberConfig),
    [familyMemberConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = familyMemberConfig.fields
    const aadharFields = familyMemberConfig.aadharCard.fields
    const electionFields = familyMemberConfig.electionCard.fields
    const panFields = familyMemberConfig.panCard.fields

    return (fieldPath: string): boolean => {
      switch (fieldPath) {
        case "memberName":
          return fields.memberName?.required ?? true
        case "relation":
          return fields.relation?.required ?? true
        case "gender":
          return Boolean(fields.gender?.required)
        case "birthDate":
          return Boolean(fields.birthDate?.required)
        case "aadharCard.aadharCardNumber":
          return aadharFields.aadharCardNumber?.required ?? true
        case "aadharCard.aadharCardPath":
          return Boolean(aadharFields.aadharCardPath?.required)
        case "electionCard.electionCardNumber":
          return Boolean(electionFields.electionCardNumber?.required)
        case "electionCard.electionCardPath":
          return Boolean(electionFields.electionCardPath?.required)
        case "panCard.panCardNumber":
          return Boolean(panFields.panCardNumber?.required)
        case "panCard.panCardPath":
          return Boolean(panFields.panCardPath?.required)
        case "remark":
          return Boolean(fields.remark?.required)
        case "isDependent":
          return fields.isDependent?.required ?? true
        default:
          return false
      }
    }
  }, [familyMemberConfig])
  type FamilyMemberFieldPath =
    | "memberName"
    | "relation"
    | "gender"
    | "birthDate"
    | "remark"
    | "isDependent"
    | "aadharCard.aadharCardNumber"
    | "aadharCard.aadharCardPath"
    | "electionCard.electionCardNumber"
    | "electionCard.electionCardPath"
    | "panCard.panCardNumber"
    | "panCard.panCardPath"

  const getRootConfig = (field: FamilyMemberRootFieldKey) => familyMemberConfig.fields[field]
  const getAadharConfig = (field: FamilyMemberAadharFieldKey) => familyMemberConfig.aadharCard.fields[field]
  const getElectionConfig = (field: FamilyMemberElectionFieldKey) => familyMemberConfig.electionCard.fields[field]
  const getPanConfig = (field: FamilyMemberPanFieldKey) => familyMemberConfig.panCard.fields[field]

  const isVisible = useMemo(
    () => (fieldPath: FamilyMemberFieldPath): boolean => {
      switch (fieldPath) {
        case "memberName":
          return getRootConfig("memberName")?.visible ?? true
        case "relation":
          return getRootConfig("relation")?.visible ?? true
        case "gender":
          return getRootConfig("gender")?.visible ?? true
        case "birthDate":
          return getRootConfig("birthDate")?.visible ?? true
        case "remark":
          return getRootConfig("remark")?.visible ?? true
        case "isDependent":
          return getRootConfig("isDependent")?.visible ?? true
        case "aadharCard.aadharCardNumber":
          return getAadharConfig("aadharCardNumber")?.visible ?? true
        case "aadharCard.aadharCardPath":
          return getAadharConfig("aadharCardPath")?.visible ?? true
        case "electionCard.electionCardNumber":
          return getElectionConfig("electionCardNumber")?.visible ?? true
        case "electionCard.electionCardPath":
          return getElectionConfig("electionCardPath")?.visible ?? true
        case "panCard.panCardNumber":
          return getPanConfig("panCardNumber")?.visible ?? true
        case "panCard.panCardPath":
          return getPanConfig("panCardPath")?.visible ?? true
      }
    },
    [familyMemberConfig]
  )

  const getLabel = useMemo(
    () => (fieldPath: FamilyMemberFieldPath, fallback: string): string => {
      switch (fieldPath) {
        case "memberName":
          return getRootConfig("memberName")?.label || fallback
        case "relation":
          return getRootConfig("relation")?.label || fallback
        case "gender":
          return getRootConfig("gender")?.label || fallback
        case "birthDate":
          return getRootConfig("birthDate")?.label || fallback
        case "remark":
          return getRootConfig("remark")?.label || fallback
        case "isDependent":
          return getRootConfig("isDependent")?.label || fallback
        case "aadharCard.aadharCardNumber":
          return getAadharConfig("aadharCardNumber")?.label || fallback
        case "aadharCard.aadharCardPath":
          return getAadharConfig("aadharCardPath")?.label || fallback
        case "electionCard.electionCardNumber":
          return getElectionConfig("electionCardNumber")?.label || fallback
        case "electionCard.electionCardPath":
          return getElectionConfig("electionCardPath")?.label || fallback
        case "panCard.panCardNumber":
          return getPanConfig("panCardNumber")?.label || fallback
        case "panCard.panCardPath":
          return getPanConfig("panCardPath")?.label || fallback
      }
    },
    [familyMemberConfig]
  )

  const showBasicSection =
    isVisible("memberName") ||
    isVisible("relation") ||
    isVisible("gender") ||
    isVisible("birthDate")
  const showIdentitySection =
    isVisible("aadharCard.aadharCardNumber") ||
    isVisible("aadharCard.aadharCardPath") ||
    isVisible("electionCard.electionCardNumber") ||
    isVisible("electionCard.electionCardPath") ||
    isVisible("panCard.panCardNumber") ||
    isVisible("panCard.panCardPath")
  const showAdditionalSection =
    isVisible("remark") || isVisible("isDependent")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_FAMILY_MEMBER })
      setErrors({})
      setPendingFamilyMembers(null)
    }
  }, [open, initialValue])

  const update = (field: keyof FamilyMember, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const updateNested = (
    section: "aadharCard" | "electionCard" | "panCard",
    field: string,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }))
    const errKey = `${section}.${field}`
    if (errors[errKey] || errors[section]) {
      setErrors((prev) => ({ ...prev, [errKey]: "", [section]: "" }))
    }
  }

  const { post: postFamilyMembers, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const normalizeServerField = (fieldName: string): string | null => {
          const direct = new Set([
            "memberName",
            "relation",
            "gender",
            "birthDate",
            "remark",
            "isDependent",
            "aadharCard",
            "electionCard",
            "panCard",
            "aadharCard.aadharCardNumber",
            "aadharCard.aadharCardPath",
            "electionCard.electionCardNumber",
            "electionCard.electionCardPath",
            "panCard.panCardNumber",
            "panCard.panCardPath",
          ])
          if (direct.has(fieldName)) return fieldName
          if (fieldName.includes("aadharCardNumber")) return "aadharCard.aadharCardNumber"
          if (fieldName.includes("aadharCardPath")) return "aadharCard.aadharCardPath"
          if (fieldName.includes("electionCardNumber")) return "electionCard.electionCardNumber"
          if (fieldName.includes("electionCardPath")) return "electionCard.electionCardPath"
          if (fieldName.includes("panCardNumber")) return "panCard.panCardNumber"
          if (fieldName.includes("panCardPath")) return "panCard.panCardPath"
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

      toast.success("Family members saved successfully!")
      if (pendingFamilyMembers) {
        onSubmit(pendingFamilyMembers)
      }
      setPendingFamilyMembers(null)
      await refetchFamilyMembers?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving family members:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || disabled || postLoading) return
    const result = familyMemberSchema.safeParse(form)
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

    const payloadMember = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_FAMILY_MEMBER,
      ...result.data,
    } as FamilyMember

    const parseId = (payloadMember as Record<string, any>)?.parseID
    const next =
      parseId
        ? familyMembers.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadMember : row
          )
        : editIndex !== null
          ? familyMembers.map((row, index) => (index === editIndex ? payloadMember : row))
          : [...familyMembers, payloadMember]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetFamilyMembersTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        familyMember: [payloadMember],
        ...(shouldSetFamilyMembersTab ? { familyMemberstab: true } : {}),
      },
      audit: auditPayload,
    }

    setPendingFamilyMembers(next)
    postFamilyMembers(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialValue !== null ? "Edit Family Member" : "Add Family Member"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter member and document details.</p>
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
          {showBasicSection && (
          <div className="space-y-3">
            <SubFormTitle title="Basic Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible("memberName") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("memberName", "Member Name")}
                {isRequired("memberName") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.memberName}
                onChange={(e) => update("memberName", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter member name"
                disabled={disabled || postLoading}
              />
              {errors.memberName && <p className="text-red-500 text-xs">{errors.memberName}</p>}
            </div>
            )}
            {isVisible("relation") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("relation", "Relation")}
                {isRequired("relation") && <span className="text-red-500"> *</span>}
              </Label>
              <Select value={form.relation} onValueChange={(v) => update("relation", v)} disabled={disabled || postLoading}>
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.relation && <p className="text-red-500 text-xs">{errors.relation}</p>}
            </div>
            )}
            {isVisible("gender") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("gender", "Gender")}
                {isRequired("gender") && <span className="text-red-500"> *</span>}
              </Label>
              <Select value={form.gender || ""} onValueChange={(v) => update("gender", v)} disabled={disabled || postLoading}>
                <SelectTrigger className={INPUT_CLASS}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-red-500 text-xs">{errors.gender}</p>}
            </div>
            )}
            {isVisible("birthDate") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("birthDate", "Birth Date")}
                {isRequired("birthDate") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={form.birthDate || ""}
                onChange={(e) => update("birthDate", e.target.value)}
                className={INPUT_CLASS}
                disabled={disabled || postLoading}
              />
              {errors.birthDate && <p className="text-red-500 text-xs">{errors.birthDate}</p>}
            </div>
            )}
            </div>
          </div>
          )}

          {(showBasicSection && showIdentitySection) && <Separator />}

          {showIdentitySection && (
          <div className="space-y-3">
            <SubFormTitle title="Identity Documents" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible("aadharCard.aadharCardNumber") && (
            <div className="space-y-2">
            <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
              {getLabel("aadharCard.aadharCardNumber", "Aadhar Number")}
              {isRequired("aadharCard.aadharCardNumber") && <span className="text-red-500"> *</span>}
            </Label>
            <Input
              value={formatAadharNumber(form.aadharCard?.aadharCardNumber || "")}
              onChange={(e) => updateNested("aadharCard", "aadharCardNumber", getUnformattedAadhar(e.target.value))}
              className={INPUT_CLASS}
              placeholder="XXXX XXXX XXXX"
              maxLength={14}
              disabled={disabled || postLoading}
            />
            {(errors.aadharCard as string) || errors["aadharCard.aadharCardNumber"] ? (
              <p className="text-red-500 text-xs">{(errors.aadharCard as string) || errors["aadharCard.aadharCardNumber"]}</p>
            ) : null}
            </div>
            )}
            {isVisible("aadharCard.aadharCardPath") && (
            <DocumentUploadField
              id="popup-aadhar-file"
              label={`${getLabel("aadharCard.aadharCardPath", "Aadhar Document")}${isRequired("aadharCard.aadharCardPath") ? " *" : ""}`}
              isViewMode={disabled || postLoading}
              employeeID={employeeID}
              value={{
                documentPath: form.aadharCard?.aadharCardPath || "",
                documentType: "",
              }}
              onChange={(doc) => updateNested("aadharCard", "aadharCardPath", doc.documentPath || "")}
              uploadPrefix="aadhar"
              wrapperClassName="space-y-2"
              labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
            />
            )}
            {isVisible("electionCard.electionCardNumber") && (
            <div className="space-y-2">
            <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
              {getLabel("electionCard.electionCardNumber", "Election Card Number")}
              {isRequired("electionCard.electionCardNumber") && <span className="text-red-500"> *</span>}
            </Label>
            <Input
              value={form.electionCard?.electionCardNumber || ""}
              onChange={(e) => updateNested("electionCard", "electionCardNumber", e.target.value)}
              className={INPUT_CLASS}
              placeholder="Enter Election Card number"
              disabled={disabled || postLoading}
            />
            {(errors["electionCard.electionCardNumber"] || (errors.electionCard as string)) && (
              <p className="text-red-500 text-xs">{errors["electionCard.electionCardNumber"] || (errors.electionCard as string)}</p>
            )}
            </div>
            )}
            {isVisible("electionCard.electionCardPath") && (
            <DocumentUploadField
              id="popup-election-file"
              label={`${getLabel("electionCard.electionCardPath", "Election Card Document")}${isRequired("electionCard.electionCardPath") ? " *" : ""}`}
              isViewMode={disabled || postLoading}
              employeeID={employeeID}
              value={{
                documentPath: form.electionCard?.electionCardPath || "",
                documentType: "",
              }}
              onChange={(doc) => updateNested("electionCard", "electionCardPath", doc.documentPath || "")}
              uploadPrefix="election"
              wrapperClassName="space-y-2"
              labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
              uploadButtonText="Upload Election Card"
            />
            )}
            {isVisible("panCard.panCardNumber") && (
            <div className="space-y-2">
            <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
              {getLabel("panCard.panCardNumber", "PAN Card Number")}
              {isRequired("panCard.panCardNumber") && <span className="text-red-500"> *</span>}
            </Label>
            <Input
              value={formatPanNumber(form.panCard?.panCardNumber || "")}
              onChange={(e) => updateNested("panCard", "panCardNumber", formatPanNumber(e.target.value))}
              className={INPUT_CLASS}
              placeholder="ABCDE1234F"
              maxLength={10}
              disabled={disabled || postLoading}
            />
            {(errors["panCard.panCardNumber"] || (errors.panCard as string)) && (
              <p className="text-red-500 text-xs">{errors["panCard.panCardNumber"] || (errors.panCard as string)}</p>
            )}
            </div>
            )}
            {isVisible("panCard.panCardPath") && (
            <DocumentUploadField
              id="popup-pan-file"
              label={`${getLabel("panCard.panCardPath", "PAN Card Document")}${isRequired("panCard.panCardPath") ? " *" : ""}`}
              isViewMode={disabled || postLoading}
              employeeID={employeeID}
              value={{
                documentPath: form.panCard?.panCardPath || "",
                documentType: "",
              }}
              onChange={(doc) => updateNested("panCard", "panCardPath", doc.documentPath || "")}
              uploadPrefix="pan"
              wrapperClassName="space-y-2"
              labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
              uploadButtonText="Upload PAN Card"
            />
            )}
            </div>
          </div>
          )}

          {(showIdentitySection && showAdditionalSection) && <Separator />}

          {showAdditionalSection && (
          <div className="space-y-3">
            <SubFormTitle title="Additional Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible("remark") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("remark", "Remark")}
                {isRequired("remark") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.remark || ""}
                onChange={(e) => update("remark", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter remark"
                disabled={disabled || postLoading}
              />
              {errors.remark && <p className="text-red-500 text-xs">{errors.remark}</p>}
            </div>
            )}
            {isVisible("isDependent") && (
            <div className="space-y-1">
              <div className="flex items-center gap-3 pt-6">
                <Checkbox
                  checked={form.isDependent}
                  onCheckedChange={(checked) => update("isDependent", !!checked)}
                  disabled={disabled || postLoading}
                />
                <Label className="text-sm text-gray-700">
                  {getLabel("isDependent", "Mark as Dependent")}
                  {isRequired("isDependent") && <span className="text-red-500"> *</span>}
                </Label>
              </div>
              {errors.isDependent && <p className="text-red-500 text-xs">{errors.isDependent}</p>}
            </div>
            )}
            </div>
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
            {initialValue !== null ? "Save" : "Add Member"}
          </Button>
        </div>
      </div>
    </div>
  )
}
