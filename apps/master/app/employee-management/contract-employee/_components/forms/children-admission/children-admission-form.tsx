"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { Users, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_CHILDREN_ADMISSION,
  createChildrenAdmissionSchema,
  normalizeChildrenAdmissionConfig,
  type ChildrenAdmission,
  type ChildrenAdmissionConfig,
  type ChildrenAdmissionFieldKey,
} from "../../schemas/children-admission-form-schema"

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"]
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

interface ChildrenAdmissionFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: ChildrenAdmission | null
  onSubmit: (values: ChildrenAdmission[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  childrenAdmissions: ChildrenAdmission[]
  editIndex: number | null
  refetchChildrenAdmissions?: () => Promise<void> | void
  disabled?: boolean
}

export function ChildrenAdmissionFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  childrenAdmissions,
  editIndex,
  refetchChildrenAdmissions,
  disabled = false,
}: ChildrenAdmissionFormPopupProps) {
  const [form, setForm] = useState<ChildrenAdmission>({ ...EMPTY_CHILDREN_ADMISSION })
  const [errors, setErrors] = useState<Partial<Record<ChildrenAdmissionFieldKey, string>>>({})
  const [pendingChildren, setPendingChildren] = useState<ChildrenAdmission[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const childrenAdmissionConfig = useMemo(
    () =>
      normalizeChildrenAdmissionConfig(
        formStructure?.childrenAdmissions as ChildrenAdmissionConfig | undefined
      ),
    [formStructure]
  )
  const childrenAdmissionSchema = useMemo(
    () => createChildrenAdmissionSchema(childrenAdmissionConfig),
    [childrenAdmissionConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = childrenAdmissionConfig.fields
    return (field: keyof ChildrenAdmission): boolean => {
      if (field === "name") return fields.name?.required ?? true
      if (field === "gender") return fields.gender?.required ?? true
      if (field === "dateOfBirth") return fields.dateOfBirth?.required ?? true
      if (field === "dateOfAdmission") return Boolean(fields.dateOfAdmission?.required)
      if (field === "nameOfSchool") return Boolean(fields.nameOfSchool?.required)
      return Boolean(fields.schoolAddress?.required)
    }
  }, [childrenAdmissionConfig])
  const isVisible = useMemo(() => {
    const fields = childrenAdmissionConfig.fields
    return (field: ChildrenAdmissionFieldKey): boolean => fields[field]?.visible ?? true
  }, [childrenAdmissionConfig])
  const getLabel = useMemo(() => {
    const fields = childrenAdmissionConfig.fields
    return (field: ChildrenAdmissionFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [childrenAdmissionConfig])
  const showChildInfoSection =
    isVisible("name") ||
    isVisible("gender") ||
    isVisible("dateOfBirth") ||
    isVisible("dateOfAdmission") ||
    isVisible("nameOfSchool") ||
    isVisible("schoolAddress")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_CHILDREN_ADMISSION })
      setErrors({})
      setPendingChildren(null)
    }
  }, [open, initialValue])

  const update = (field: keyof ChildrenAdmission, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }))
  }
  const { post: postChildrenAdmission, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): ChildrenAdmissionFieldKey | null => {
          const fieldMap: Record<string, ChildrenAdmissionFieldKey> = {
            name: "name",
            gender: "gender",
            dateOfBirth: "dateOfBirth",
            dateOfAdmission: "dateOfAdmission",
            nameOfSchool: "nameOfSchool",
            schoolAddress: "schoolAddress",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("childrenAdmission.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Partial<Record<ChildrenAdmissionFieldKey, string>> = {}
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

      toast.success("Children admission data saved successfully!")
      if (pendingChildren) {
        onSubmit(pendingChildren)
      }
      setPendingChildren(null)
      await refetchChildrenAdmissions?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving children admission data:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || disabled || postLoading) return
    const result = childrenAdmissionSchema.safeParse(form)
    if (!result.success) {
      const err: Partial<Record<ChildrenAdmissionFieldKey, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".") as ChildrenAdmissionFieldKey
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})
    const payloadChild = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_CHILDREN_ADMISSION,
      ...result.data,
    } as ChildrenAdmission
    const parseId = (payloadChild as Record<string, any>)?.parseID
    const next =
      parseId
        ? childrenAdmissions.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadChild : row
          )
        : editIndex !== null
          ? childrenAdmissions.map((row, index) => (index === editIndex ? payloadChild : row))
          : [...childrenAdmissions, payloadChild]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetChildrenAdmissionsTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        childrenAdmission: [payloadChild],
        ...(shouldSetChildrenAdmissionsTab ? { childrenAdmissionstab: true } : {}),
      },
      audit: auditPayload,
    }
    setPendingChildren(next)
    postChildrenAdmission(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialValue !== null ? "Edit Child Admission" : "Add Child Admission"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter child and school details.</p>
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
          {showChildInfoSection && (
            <div className="space-y-3">
              <SubFormTitle title="Child Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isVisible("name") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("name", "Child Name")}
                      {isRequired("name") && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Enter child name"
                      disabled={disabled || postLoading}
                    />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                  </div>
                )}
                {isVisible("gender") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("gender", "Gender")}
                      {isRequired("gender") && <span className="text-red-500"> *</span>}
                    </Label>
                    <Select value={form.gender} onValueChange={(v) => update("gender", v)} disabled={disabled || postLoading}>
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
                {isVisible("dateOfBirth") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("dateOfBirth", "Date of Birth")}
                      {isRequired("dateOfBirth") && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={form.dateOfBirth || ""}
                      onChange={(e) => update("dateOfBirth", e.target.value)}
                      className={INPUT_CLASS}
                      disabled={disabled || postLoading}
                    />
                    {errors.dateOfBirth && <p className="text-red-500 text-xs">{errors.dateOfBirth}</p>}
                  </div>
                )}
                {isVisible("dateOfAdmission") && (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("dateOfAdmission", "Date of Admission")}
                      {isRequired("dateOfAdmission") && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={form.dateOfAdmission || ""}
                      onChange={(e) => update("dateOfAdmission", e.target.value)}
                      className={INPUT_CLASS}
                      disabled={disabled || postLoading}
                    />
                    {errors.dateOfAdmission && <p className="text-red-500 text-xs">{errors.dateOfAdmission}</p>}
                  </div>
                )}
                {isVisible("nameOfSchool") && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("nameOfSchool", "School Name")}
                      {isRequired("nameOfSchool") && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      value={form.nameOfSchool || ""}
                      onChange={(e) => update("nameOfSchool", e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Enter school name"
                      disabled={disabled || postLoading}
                    />
                    {errors.nameOfSchool && <p className="text-red-500 text-xs">{errors.nameOfSchool}</p>}
                  </div>
                )}
                {isVisible("schoolAddress") && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getLabel("schoolAddress", "School Address")}
                      {isRequired("schoolAddress") && <span className="text-red-500"> *</span>}
                    </Label>
                    <Input
                      value={form.schoolAddress || ""}
                      onChange={(e) => update("schoolAddress", e.target.value)}
                      className={INPUT_CLASS}
                      placeholder="Enter school address"
                      disabled={disabled || postLoading}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {showChildInfoSection && <Separator />}
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
            {initialValue !== null ? "Save" : "Add Child"}
          </Button>
        </div>
      </div>
    </div>
  )
}
