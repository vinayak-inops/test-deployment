"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { UserCheck, X } from "lucide-react"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import {
  EMPTY_PF_NOMINEE,
  createPfNomineeSchema,
  normalizePfNomineeConfig,
  type PfNominee,
  type PfNomineeConfig,
  type PfNomineeFieldKey,
} from "../../schemas/pf-nominee-form-schema"

const RELATION_OPTIONS = [
  "Spouse", "Child", "Parent", "Sibling", "Father", "Mother", "Son", "Daughter", "Brother", "Sister"
]
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

interface PfNomineeFormPopupProps {
  open: boolean
  onClose: () => void
  initialValue: PfNominee | null
  onSubmit: (values: PfNominee[]) => void
  mode?: "add" | "edit" | "view"
  employeeRecordId?: string | null
  tenantCode?: string
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  pfNominees: PfNominee[]
  editIndex: number | null
  refetchPfNominees?: () => Promise<void> | void
  disabled?: boolean
}

export function PfNomineeFormPopup({
  open,
  onClose,
  initialValue,
  onSubmit,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  pfNominees,
  editIndex,
  refetchPfNominees,
  disabled = false,
}: PfNomineeFormPopupProps) {
  const [form, setForm] = useState<PfNominee>({ ...EMPTY_PF_NOMINEE })
  const [errors, setErrors] = useState<Partial<Record<PfNomineeFieldKey, string>>>({})
  const [pendingPfNominees, setPendingPfNominees] = useState<PfNominee[] | null>(null)
  const auditEntityId = String(employeeRecordId || "")
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const pfNomineeConfig = useMemo(
    () =>
      normalizePfNomineeConfig(
        formStructure?.pfNominees as PfNomineeConfig | undefined
      ),
    [formStructure]
  )
  const pfNomineeSchema = useMemo(
    () => createPfNomineeSchema(pfNomineeConfig),
    [pfNomineeConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const isRequired = useMemo(() => {
    const fields = pfNomineeConfig.fields
    return (field: PfNomineeFieldKey): boolean => {
      if (field === "memberName") return fields.memberName?.required ?? true
      if (field === "relation") return fields.relation?.required ?? true
      if (field === "birthDate") return Boolean(fields.birthDate?.required)
      return Boolean(fields.percentage?.required)
    }
  }, [pfNomineeConfig])
  const isVisible = useMemo(() => {
    const fields = pfNomineeConfig.fields
    return (field: PfNomineeFieldKey): boolean => fields[field]?.visible ?? true
  }, [pfNomineeConfig])
  const getLabel = useMemo(() => {
    const fields = pfNomineeConfig.fields
    return (field: PfNomineeFieldKey, fallback: string): string => fields[field]?.label || fallback
  }, [pfNomineeConfig])
  const showNomineeSection =
    isVisible("memberName") ||
    isVisible("relation") ||
    isVisible("birthDate") ||
    isVisible("percentage")

  useEffect(() => {
    if (open) {
      setForm(initialValue ? { ...initialValue } : { ...EMPTY_PF_NOMINEE })
      setErrors({})
      setPendingPfNominees(null)
    }
  }, [open, initialValue])

  const update = (field: keyof PfNominee, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    const fieldKey = field as PfNomineeFieldKey
    if (errors[fieldKey]) setErrors((prev) => ({ ...prev, [fieldKey]: "" }))
  }

  const { post: postPfNominees, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const normalizeServerField = (fieldName: string): PfNomineeFieldKey | null => {
          const fieldMap: Record<string, PfNomineeFieldKey> = {
            memberName: "memberName",
            relation: "relation",
            birthDate: "birthDate",
            percentage: "percentage",
          }
          if (fieldMap[fieldName]) return fieldMap[fieldName]
          if (fieldName.startsWith("pfNominee.")) {
            const key = fieldName.split(".").pop() ?? ""
            return fieldMap[key] ?? null
          }
          return null
        }

        const nextErrors: Partial<Record<PfNomineeFieldKey, string>> = {}
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

      toast.success("PF nominees saved successfully!")
      if (pendingPfNominees) {
        onSubmit(pendingPfNominees)
      }
      setPendingPfNominees(null)
      await refetchPfNominees?.()
      onClose()
    },
    onError: (error) => {
      console.error("Error saving PF nominees:", error)
    },
  })

  const handleSubmit = () => {
    if (shouldShowConfigLoader || disabled || postLoading) return
    const result = pfNomineeSchema.safeParse(form)
    if (!result.success) {
      const err: Partial<Record<PfNomineeFieldKey, string>> = {}
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".") as PfNomineeFieldKey
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
      ...EMPTY_PF_NOMINEE,
      ...result.data,
    } as PfNominee

    const parseId = (payloadNominee as Record<string, any>)?.parseID
    const next =
      parseId
        ? pfNominees.map((row) =>
            (row as Record<string, any>)?.parseID === parseId ? payloadNominee : row
          )
        : editIndex !== null
          ? pfNominees.map((row, index) => (index === editIndex ? payloadNominee : row))
          : [...pfNominees, payloadNominee]

    const isEditMode = mode === "edit" && Boolean(employeeRecordId)
    const shouldSetPfNomineesTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        pfNominee: [payloadNominee],
        ...(shouldSetPfNomineesTab ? { pfNomineestab: true } : {}),
      },
      audit: auditPayload,
    }

    setPendingPfNominees(next)
    postPfNominees(payload)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <UserCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialValue !== null ? "Edit PF Nominee" : "Add PF Nominee"}
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
          <Separator />
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
