"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Separator } from "@repo/ui/components/ui/separator"
import { GraduationCap, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_EDUCATION,
  createEducationSchema,
  monthOptions,
  normalizeEducationConfig,
  type Education,
  type EducationConfig,
  type EducationFieldKey,
} from "../../schemas/education-form-schema"

interface EducationFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: Education | null
  onSubmit: (values: Education[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  educations: Education[]
  editIndex: number | null
  refetchEducations?: () => Promise<void> | void
  disabled?: boolean
}
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function EducationFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  educations,
  editIndex,
  refetchEducations,
  disabled = false,
}: EducationFormPopupProps) {
  const [form, setForm] = useState<Education>({ ...EMPTY_EDUCATION })
  const [errors, setErrors] = useState<Partial<Record<EducationFieldKey, string>>>({})
  const [pendingEducations, setPendingEducations] = useState<Education[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const educationConfig = useMemo(
    () =>
      normalizeEducationConfig(
        formStructure?.educations as EducationConfig | undefined
      ),
    [formStructure]
  )
  const educationSchema = useMemo(
    () => createEducationSchema(educationConfig),
    [educationConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = educationConfig.fields
    return (field: keyof Education): boolean => {
      if (field === "monthOfPassing") return Boolean(fields.monthOfPassing?.required)
      if (field === "isVerified") return Boolean(fields.isVerified?.required)
      return Boolean(fields[field]?.required)
    }
  }, [educationConfig])
  const isVisible = useMemo(() => {
    const fields = educationConfig.fields
    return (field: EducationFieldKey): boolean => fields[field]?.visible ?? true
  }, [educationConfig])
  const getLabel = useMemo(() => {
    const fields = educationConfig.fields
    return (field: EducationFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [educationConfig])
  const showEducationSection =
    isVisible("educationTitle") ||
    isVisible("courseTitle") ||
    isVisible("stream") ||
    isVisible("college") ||
    isVisible("yearOfPassing") ||
    isVisible("monthOfPassing") ||
    isVisible("percentage") ||
    isVisible("isVerified")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_EDUCATION })
      setErrors({})
      setPendingEducations(null)
    }
  }, [open, initialValue])

  const update = (field: keyof Education, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value as any }))
    const fieldKey = field as EducationFieldKey
    if (errors[fieldKey]) setErrors((prev) => ({ ...prev, [fieldKey]: "" }))
  }
  const { post: postEducation, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const normalizeServerField = (fieldName: string): EducationFieldKey | null => {
          const fieldMap: Record<string, EducationFieldKey> = {
            educationTitle: "educationTitle",
            courseTitle: "courseTitle",
            stream: "stream",
            college: "college",
            yearOfPassing: "yearOfPassing",
            monthOfPassing: "monthOfPassing",
            percentage: "percentage",
            isVerified: "isVerified",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("educations.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Partial<Record<EducationFieldKey, string>> = {}
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

      toast.success("Education data saved successfully!")
      if (pendingEducations) {
        onSubmit(pendingEducations)
      }
      setPendingEducations(null)
      await refetchEducations?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving education data:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || disabled || postLoading) return
    const result = educationSchema.safeParse(form)
    if (!result.success) {
      const err: Partial<Record<EducationFieldKey, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".") as EducationFieldKey
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})
    const payloadEducation = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_EDUCATION,
      ...result.data,
    } as Education
    const parseId = (payloadEducation as Record<string, any>)?.parseID
    const next =
      parseId
        ? educations.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadEducation : row
          )
        : editIndex !== null
          ? educations.map((row, index) => (index === editIndex ? payloadEducation : row))
          : [...educations, payloadEducation]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetEducationTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        educations: [payloadEducation],
        ...(shouldSetEducationTab ? { educationstab: true } : {}),
      },
      audit: auditPayload,
    }
    setPendingEducations(next)
    postEducation(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <GraduationCap className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialValue !== null ? "Edit Education" : "Add Education"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter education details.</p>
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
          {showEducationSection && (
          <div className="space-y-3">
            <SubFormTitle title="Education Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible("educationTitle") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("educationTitle", "Education Title")}
                {isRequired("educationTitle") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.educationTitle || ""}
                onChange={(e) => update("educationTitle", e.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g., B.Tech"
                disabled={disabled || postLoading}
              />
              {errors.educationTitle && <p className="text-red-500 text-xs">{errors.educationTitle}</p>}
            </div>
            )}
            {isVisible("courseTitle") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("courseTitle", "Course Title")}
                {isRequired("courseTitle") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.courseTitle || ""}
                onChange={(e) => update("courseTitle", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter course title"
                disabled={disabled || postLoading}
              />
              {errors.courseTitle && <p className="text-red-500 text-xs">{errors.courseTitle}</p>}
            </div>
            )}
            {isVisible("stream") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("stream", "Stream")}
                {isRequired("stream") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.stream || ""}
                onChange={(e) => update("stream", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter stream"
                disabled={disabled || postLoading}
              />
              {errors.stream && <p className="text-red-500 text-xs">{errors.stream}</p>}
            </div>
            )}
            {isVisible("college") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("college", "College/University")}
                {isRequired("college") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.college || ""}
                onChange={(e) => update("college", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter college/university name"
                disabled={disabled || postLoading}
              />
              {errors.college && <p className="text-red-500 text-xs">{errors.college}</p>}
            </div>
            )}
            {isVisible("yearOfPassing") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("yearOfPassing", "Year of Passing")}
                {isRequired("yearOfPassing") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.yearOfPassing || ""}
                onChange={(e) => update("yearOfPassing", e.target.value)}
                className={INPUT_CLASS}
                placeholder="YYYY"
                disabled={disabled || postLoading}
              />
              {errors.yearOfPassing && <p className="text-red-500 text-xs">{errors.yearOfPassing}</p>}
            </div>
            )}
            {isVisible("monthOfPassing") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("monthOfPassing", "Month of Passing")}
                {isRequired("monthOfPassing") && <span className="text-red-500"> *</span>}
              </Label>
              <select
                value={form.monthOfPassing ?? 1}
                onChange={(e) => update("monthOfPassing", Number(e.target.value) || 1)}
                className={`w-full rounded-md bg-white ${INPUT_CLASS}`}
                disabled={disabled || postLoading}
              >
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {errors.monthOfPassing && <p className="text-red-500 text-xs">{errors.monthOfPassing}</p>}
            </div>
            )}
            {isVisible("percentage") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("percentage", "Percentage/CGPA")}
                {isRequired("percentage") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.percentage || ""}
                onChange={(e) => update("percentage", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter percentage/CGPA"
                disabled={disabled || postLoading}
              />
              {errors.percentage && <p className="text-red-500 text-xs">{errors.percentage}</p>}
            </div>
            )}
            {isVisible("isVerified") && (
            <div className="flex items-center gap-3 pt-6">
              <Checkbox
                checked={Boolean(form.isVerified)}
                onCheckedChange={(checked) => update("isVerified", checked)}
                disabled={disabled || postLoading}
              />
              <Label className="text-sm text-gray-700">
                {getLabel("isVerified", "Mark as Verified")}
                {isRequired("isVerified") && <span className="text-red-500"> *</span>}
              </Label>
            </div>
            )}
          </div>
          </div>
          )}
          {showEducationSection && <Separator />}
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
            {initialValue !== null ? "Save" : "Add Education"}
          </Button>
        </div>
      </div>
    </div>
  )
}
