"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { Heart, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_GRATUITY_NOMINEE,
  createGratuityNomineeSchema,
  normalizeGratuityNomineeConfig,
  type GratuityNomineeFieldKey,
  type GratuityNominee,
  type GratuityNomineeConfig,
} from "../../schemas/gratuity-nominee-form-schema"

const RELATION_OPTIONS = [
  "Spouse", "Child", "Parent", "Sibling", "Father", "Mother", "Son", "Daughter", "Brother", "Sister"
]
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

interface GratuityNomineeFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: GratuityNominee | null
  onSubmit: (values: GratuityNominee[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  gratuityNominees: GratuityNominee[]
  editIndex: number | null
  refetchGratuityNominees?: () => Promise<void> | void
  disabled?: boolean
}

export function GratuityNomineeFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  gratuityNominees,
  editIndex,
  refetchGratuityNominees,
  disabled = false,
}: GratuityNomineeFormPopupProps) {
  const [form, setForm] = useState<GratuityNominee>({ ...EMPTY_GRATUITY_NOMINEE })
  const [errors, setErrors] = useState<Partial<Record<GratuityNomineeFieldKey, string>>>({})
  const [pendingGratuityNominees, setPendingGratuityNominees] = useState<GratuityNominee[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const gratuityNomineeConfig = useMemo(
    () =>
      normalizeGratuityNomineeConfig(
        formStructure?.gratuityNominees as GratuityNomineeConfig | undefined
      ),
    [formStructure]
  )
  const gratuityNomineeSchema = useMemo(
    () => createGratuityNomineeSchema(gratuityNomineeConfig),
    [gratuityNomineeConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = gratuityNomineeConfig.fields
    return (field: keyof GratuityNominee): boolean => {
      if (field === "memberName") return fields.memberName?.required ?? true
      if (field === "relation") return fields.relation?.required ?? true
      if (field === "birthDate") return Boolean(fields.birthDate?.required)
      return Boolean(fields.percentage?.required)
    }
  }, [gratuityNomineeConfig])
  const isVisible = useMemo(() => {
    const fields = gratuityNomineeConfig.fields
    return (field: GratuityNomineeFieldKey): boolean => fields[field]?.visible ?? true
  }, [gratuityNomineeConfig])
  const getLabel = useMemo(() => {
    const fields = gratuityNomineeConfig.fields
    return (field: GratuityNomineeFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [gratuityNomineeConfig])
  const showNomineeSection =
    isVisible("memberName") ||
    isVisible("relation") ||
    isVisible("birthDate") ||
    isVisible("percentage")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_GRATUITY_NOMINEE })
      setErrors({})
      setPendingGratuityNominees(null)
    }
  }, [open, initialValue])

  const update = (field: keyof GratuityNominee, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    const fieldKey = field as GratuityNomineeFieldKey
    if (errors[fieldKey]) setErrors((prev) => ({ ...prev, [fieldKey]: "" }))
  }

  const { post: postGratuityNominees, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const normalizeServerField = (fieldName: string): GratuityNomineeFieldKey | null => {
          const fieldMap: Record<string, GratuityNomineeFieldKey> = {
            memberName: "memberName",
            relation: "relation",
            birthDate: "birthDate",
            percentage: "percentage",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("gratuityNominee.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Partial<Record<GratuityNomineeFieldKey, string>> = {}
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

      toast.success("Gratuity nominees saved successfully!")
      if (pendingGratuityNominees) {
        onSubmit(pendingGratuityNominees)
      }
      setPendingGratuityNominees(null)
      await refetchGratuityNominees?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving gratuity nominees:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || disabled || postLoading) return
    const result = gratuityNomineeSchema.safeParse(form)
    if (!result.success) {
      const err: Partial<Record<GratuityNomineeFieldKey, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".") as GratuityNomineeFieldKey
        if (!err[key]) {
          err[key] = issue.message
        }
      })
      setErrors(err)
      return
    }
    setErrors({})

    const payloadNominee = {
      ...(initialValue as Record<string, any> | null),
      ...EMPTY_GRATUITY_NOMINEE,
      ...result.data,
    } as GratuityNominee

    const parseId = (payloadNominee as Record<string, any>)?.parseID
    const next =
      parseId
        ? gratuityNominees.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadNominee : row
          )
        : editIndex !== null
          ? gratuityNominees.map((row, index) => (index === editIndex ? payloadNominee : row))
          : [...gratuityNominees, payloadNominee]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetGratuityNomineesTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        gratuityNominee: [payloadNominee],
        ...(shouldSetGratuityNomineesTab ? { gratuityNomineestab: true } : {}),
      },
      audit: auditPayload,
    }

    setPendingGratuityNominees(next)
    postGratuityNominees(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Heart className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialValue !== null ? "Edit Gratuity Nominee" : "Add Gratuity Nominee"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Enter nominee details.</p>
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
          {showNomineeSection && (
          <div className="space-y-3">
            <SubFormTitle title="Nominee Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isVisible("memberName") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("memberName", "Nominee Name")}
                {isRequired("memberName") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.memberName}
                onChange={(e) => update("memberName", e.target.value)}
                className={INPUT_CLASS}
                placeholder="Enter nominee name"
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
            {isVisible("percentage") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("percentage", "Percentage")}
                {isRequired("percentage") && <span className="text-red-500"> *</span>}
              </Label>
              <Input
                value={form.percentage || ""}
                onChange={(e) => update("percentage", e.target.value)}
                className={INPUT_CLASS}
                placeholder="e.g., 100%"
                disabled={disabled || postLoading}
              />
              {errors.percentage && <p className="text-red-500 text-xs">{errors.percentage}</p>}
            </div>
            )}
            </div>
          </div>
          )}
          {showNomineeSection && <Separator />}
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
            {initialValue !== null ? "Save" : "Add Nominee"}
          </Button>
        </div>
      </div>
    </div>
  )
}
