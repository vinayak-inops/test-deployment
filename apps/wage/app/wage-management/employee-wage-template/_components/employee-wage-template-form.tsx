"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { User } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { GradientFormHeader } from "@/components/header/form-header"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"
import EmployeeSearchField from "@/components/fields/employee-search"
import {
  employeeWageTemplateSchema,
  defaultEmployeeWageTemplateValues,
  type EmployeeWageTemplateFormValues,
} from "./schemas/employee-wage-template-form.schema"

// ─── Types ────────────────────────────────────────────────────────────────────

type Mode = "add" | "edit" | "view"

type Props = {
  mode: Mode
  rowId?: string | null
  tenantCode?: string
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeStr(value: any, fallback = ""): string {
  if (value === null || value === undefined) return fallback
  return typeof value === "string" ? value || fallback : String(value)
}

function normalizeValues(value: any): EmployeeWageTemplateFormValues {
  return {
    _id: value?._id,
    organizationCode: safeStr(value?.organizationCode),
    tenantCode: safeStr(value?.tenantCode),
    employeeID: safeStr(value?.employeeID),
    effectiveFrom: safeStr(value?.effectiveFrom),
    effectiveTo: safeStr(value?.effectiveTo),
    remark: safeStr(value?.remark),
    dependentSalaryHeads: Array.isArray(value?.dependentSalaryHeads) ? value.dependentSalaryHeads : [],
    independentSalaryHeads: [],
  }
}

const serverFieldMap: Record<string, string> = {
  employeeID: "employeeID",
  effectiveFrom: "effectiveFrom",
  effectiveTo: "effectiveTo",
  remark: "remark",
  dependentSalaryHeads: "dependentSalaryHeads",
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmployeeWageTemplateForm({
  mode,
  rowId,
  tenantCode: propTenantCode,
  onClose,
  onSaved,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const tenantCode = propTenantCode || hookTenantCode

  const isViewMode = mode === "view"
  const isEditMode = mode === "edit"
  const isAddMode = mode === "add"

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [formData, setFormData] = useState<EmployeeWageTemplateFormValues>(defaultEmployeeWageTemplateValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalErrors, setGeneralErrors] = useState<string[]>([])

  const searchApiCriteria = useMemo(() => {
    if (!rowId || isAddMode) return null
    return [
      { field: "_id", operator: "eq", value: rowId },
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
    ]
  }, [rowId, isAddMode, tenantCode])

  const { loading: recordLoading, refetch: fetchRecord } = useRequest<any[]>({
    url: "employeeWageTemplate/search",
    method: "POST",
    data: searchApiCriteria || [],
    dependencies: [searchApiCriteria],
    enabled: Boolean(searchApiCriteria),
    onSuccess: (data: any[]) => {
      const record = Array.isArray(data) && data.length > 0 ? data[0] : null
      if (record) {
        setFormData(normalizeValues(record))
      } else if (rowId) {
        toast.error("Record not found")
        onClose()
      }
      setFetchingData(false)
    },
    onError: () => {
      toast.error("Failed to load employee wage template data")
      setFetchingData(false)
      onClose()
    },
  })

  useEffect(() => {
    if ((isEditMode || isViewMode) && rowId && searchApiCriteria) {
      setFetchingData(true)
      fetchRecord()
    } else if (isAddMode) {
      setFormData(defaultEmployeeWageTemplateValues)
      setFetchingData(false)
    }
    setErrors({})
    setShowErrors(false)
  }, [rowId, isEditMode, isViewMode, isAddMode, searchApiCriteria])

  const { post } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const nextErrors: Record<string, string> = {}
        const unmapped: string[] = []
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const mapped =
            serverFieldMap[fieldName] ??
            serverFieldMap[fieldName.split(".").slice(-2).join(".")] ??
            serverFieldMap[fieldName.split(".").pop() || ""]
          if (!mapped) { unmapped.push(message); return }
          nextErrors[mapped] = message
        })
        setErrors((prev) => ({ ...prev, ...nextErrors }))
        if (unmapped.length > 0) setGeneralErrors(unmapped)
        setLoading(false)
        return
      }
      toast.success(`Employee Wage Template ${isEditMode ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)
      onClose()
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} employee wage template`)
      setLoading(false)
    },
  })

  const submit = useCallback(async () => {
    if (isViewMode) { onClose(); return }
    setShowErrors(true)

    const parsed = employeeWageTemplateSchema.safeParse(formData)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".")
        if (!nextErrors[key]) nextErrors[key] = issue.message
      }
      setErrors(nextErrors)
      toast.error("Please fix the validation errors before saving")
      return
    }

    setErrors({})
    setGeneralErrors([])
    setLoading(true)

    const { _id, tenantCode: parsedTenantCode, organizationCode: parsedOrganizationCode, ...rest } = parsed.data
    const resolvedTenantCode = parsedTenantCode ?? tenantCode
    const resolvedOrganizationCode = parsedOrganizationCode ?? resolvedTenantCode
    const resolvedRecordId = isEditMode
      ? rowId ?? (typeof _id === "string" ? _id : (_id as any)?.$oid)
      : null

    await post({
      tenant: resolvedTenantCode,
      action: isEditMode ? "update" : "insert",
      id: resolvedRecordId,
      collectionName: "employeeWageTemplate",
      event: "validate",
      ruleId: "employeeWageTemplateValidator",
      data: {
        ...rest,
        tenantCode: resolvedTenantCode,
        organizationCode: resolvedOrganizationCode,
        updatedBy: employeeId ?? null,
        updatedOn: new Date().toISOString(),
      },
    })
  }, [formData, isViewMode, isEditMode, tenantCode, employeeId, rowId, post, onClose])

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const n = { ...prev }
      delete n[key]
      return n
    })
  }, [])

  const setField = useCallback(
    (key: keyof EmployeeWageTemplateFormValues, value: any) => {
      if (isViewMode) return
      setFormData((prev) => {
        const next = { ...prev, [key]: value }
        const from = key === "effectiveFrom" ? value : next.effectiveFrom
        const to = key === "effectiveTo" ? value : next.effectiveTo
        if (from && to) {
          if (to < from) {
            setErrors((e) => ({ ...e, effectiveTo: "Effective To must be on or after Effective From" }))
          } else {
            setErrors((e) => { const n = { ...e }; delete n.effectiveTo; return n })
          }
        }
        return next
      })
      if (key !== "effectiveFrom" && key !== "effectiveTo") clearError(key)
    },
    [isViewMode, clearError],
  )

  const labelStyles = "block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1"
  const inputStyles = (key: string) =>
    `h-9 px-3 py-1.5 text-sm transition border-gray-300 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white focus:ring-1 focus:ring-gray-900 focus:border-gray-900"} ${showErrors && errors[key] ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`

  const DATE_CROSS_FIELDS = new Set(["effectiveTo"])
  const fieldError = (key: string) =>
    errors[key] && (showErrors || DATE_CROSS_FIELDS.has(key)) ? errors[key] : undefined
  const isLoading = fetchingData || recordLoading

  const getTitle = () => {
    if (isViewMode) return "View Employee Wage Template"
    if (isEditMode) return "Edit Employee Wage Template"
    return "Add Employee Wage Template"
  }

  return (
    <div className="w-full space-y-6">
      <Card className="w-full mx-auto border border-gray-200 bg-white shadow-sm">
        <GradientFormHeader
          icon={User}
          title={getTitle()}
          description="Define employee wage template with effective dates and salary configuration."
        />

        <CardContent className="px-6 py-6 space-y-8">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-600">Loading template data...</div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-8">
              {generalErrors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 space-y-1">
                  {generalErrors.map((msg, i) => <p key={i}>{msg}</p>)}
                </div>
              )}
              {showErrors && Object.keys(errors).length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Please correct the highlighted fields before saving.
                </div>
              )}

              {/* ── Employee Details ──────────────────────────────────────── */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <User className="h-5 w-5 text-blue-600" />
                  <SubFormTitle title="Employee Details" />
                </div>

                {/* Employee Search */}
                <div>
                  {isViewMode ? (
                    <div className="space-y-1">
                      <Label className={labelStyles}>Employee ID</Label>
                      <Input
                        value={formData.employeeID}
                        disabled
                        className="h-9 px-3 py-1.5 text-sm bg-gray-100 cursor-not-allowed border-gray-300"
                      />
                    </div>
                  ) : (
                    <EmployeeSearchField
                      label="Employee"
                      required
                      isOpen={true}
                      preSelectedEmployeeId={formData.employeeID || undefined}
                      errorText={fieldError("employeeID")}
                      onSelect={(emp) => setField("employeeID", emp.employeeID)}
                      onClear={() => setField("employeeID", "")}
                    />
                  )}
                </div>

                {/* Effective From / To */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className={labelStyles}>
                      Effective From <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.effectiveFrom}
                      onChange={(e) => setField("effectiveFrom", e.target.value)}
                      disabled={isViewMode}
                      className={inputStyles("effectiveFrom")}
                    />
                    {fieldError("effectiveFrom") && (
                      <p className="text-xs text-red-600">{fieldError("effectiveFrom")}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className={labelStyles}>
                      Effective To <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.effectiveTo}
                      onChange={(e) => setField("effectiveTo", e.target.value)}
                      disabled={isViewMode}
                      className={inputStyles("effectiveTo")}
                    />
                    {fieldError("effectiveTo") && (
                      <p className="text-xs text-red-600">{fieldError("effectiveTo")}</p>
                    )}
                  </div>
                </div>

                {/* Remark */}
                <div className="space-y-2">
                  <Label className={labelStyles}>Remark</Label>
                  <Input
                    value={formData.remark ?? ""}
                    onChange={(e) => setField("remark", e.target.value)}
                    disabled={isViewMode}
                    placeholder="Optional remark"
                    className={inputStyles("remark")}
                  />
                </div>
              </div>

            </form>
          )}
        </CardContent>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <ActionButtons
            layout="end"
            gap="gap-3"
            secondaryLabel="Cancel"
            onSecondary={onClose}
            primaryLabel={isViewMode ? "Close" : isEditMode ? "Update" : "Save"}
            onPrimary={isViewMode ? onClose : submit}
            primaryLoading={loading}
            primaryDisabled={loading || isLoading}
            secondaryDisabled={loading || isLoading}
            primaryClassName={isViewMode ? "bg-gray-600 hover:bg-gray-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          />
        </div>
      </Card>
    </div>
  )
}
