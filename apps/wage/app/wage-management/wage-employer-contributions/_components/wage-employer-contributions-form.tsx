"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import type { ChangeEvent } from "react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { Shield, TrendingUp, Briefcase, Users, Building2, DollarSign } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { GradientFormHeader } from "@/components/header/form-header"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-toastify"
import {
  defaultWageEmployerContributionsValues,
  wageEmployerContributionsSchema,
  type WageEmployerContributionsFormValues,
} from "./schemas/wage-employer-contributions-form.schema"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"

// ── NumericInput ───────────────────────────────────────────────────────────────

function NumericInput({
  value,
  onChange,
  disabled,
  placeholder,
  hasError,
  className = "",
  label,
  helperText,
  step = "0.01",
}: {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  placeholder?: string
  hasError?: boolean
  className?: string
  label?: string
  helperText?: string
  step?: string
}) {
  const [inputValue, setInputValue] = useState<string>(value?.toString() || "")

  useEffect(() => {
    setInputValue(value?.toString() || "")
  }, [value])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === "") {
      setInputValue("")
      onChange(0)
      return
    }
    const num = parseFloat(raw)
    if (!isNaN(num)) {
      setInputValue(raw)
      onChange(num)
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
          {label}
        </Label>
      )}
      <Input
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        step={step}
        className={`h-9 ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${
          hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
        } px-3 py-1.5 text-sm transition ${className}`}
      />
      {helperText && <p className={`text-xs ${hasError ? "text-red-600" : "text-gray-500"}`}>{helperText}</p>}
    </div>
  )
}

// ── Types & helpers ────────────────────────────────────────────────────────────

type Mode = "add" | "edit" | "view"

type Props = {
  mode: Mode
  rowId?: string | null
  tenantCode?: string
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

const salaryHeadOptions = [
  { value: "Basic", label: "Basic", icon: DollarSign },
  { value: "DA", label: "Dearness Allowance (DA)", icon: TrendingUp },
  { value: "HRA", label: "House Rent Allowance (HRA)", icon: Building2 },
  { value: "Conveyance", label: "Conveyance", icon: Briefcase },
  { value: "Special Allowance", label: "Special Allowance", icon: Users },
]

function safeStr(value: any, fallback = ""): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value || fallback
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return fallback
}

function safeNumber(value: any, fallback = 0): number {
  if (typeof value === "number") return value
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeValues(value: any): WageEmployerContributionsFormValues {
  return {
    _id: value?._id,
    organizationCode: safeStr(value?.organizationCode),
    tenantCode: safeStr(value?.tenantCode),
    pf: {
      enabled: value?.pf?.enabled ?? false,
      applicableSalaryHeads: Array.isArray(value?.pf?.applicableSalaryHeads) ? value.pf.applicableSalaryHeads : [],
      maxWageLimit: safeNumber(value?.pf?.maxWageLimit),
      employee: { contributionRate: safeNumber(value?.pf?.employee?.contributionRate) },
      employer: {
        totalContributionRate: safeNumber(value?.pf?.employer?.totalContributionRate),
        breakdown: {
          eps: { rate: safeNumber(value?.pf?.employer?.breakdown?.eps?.rate) },
          epf: {
            rate: safeNumber(value?.pf?.employer?.breakdown?.epf?.rate),
            description: safeStr(value?.pf?.employer?.breakdown?.epf?.description),
          },
        },
        adminCharges: {
          rate: safeNumber(value?.pf?.employer?.adminCharges?.rate),
          appliedOn: safeStr(value?.pf?.employer?.adminCharges?.appliedOn),
        },
      },
      edli: {
        enabled: value?.pf?.edli?.enabled ?? false,
        contributionRate: safeNumber(value?.pf?.edli?.contributionRate),
        maxWages: safeNumber(value?.pf?.edli?.maxWages),
        maxContribution: safeNumber(value?.pf?.edli?.maxContribution),
        adminCharges: { rate: safeNumber(value?.pf?.edli?.adminCharges?.rate) },
      },
    },
    esi: {
      enabled: value?.esi?.enabled ?? false,
      maxGrossSalaryLimit: safeNumber(value?.esi?.maxGrossSalaryLimit),
      employee: { contributionRate: safeNumber(value?.esi?.employee?.contributionRate) },
      employer: { contributionRate: safeNumber(value?.esi?.employer?.contributionRate) },
      applicableSalaryHeads: Array.isArray(value?.esi?.applicableSalaryHeads) ? value.esi.applicableSalaryHeads : [],
    },
    lwf: {
      employer: Array.isArray(value?.lwf?.employer) ? value.lwf.employer : [],
      employee: Array.isArray(value?.lwf?.employee) ? value.lwf.employee : [],
    },
  }
}

function updateNestedValue(source: any, path: string[], value: any): any {
  if (path.length === 0) return value
  const [key, ...rest] = path
  return { ...source, [key]: updateNestedValue(source?.[key] ?? {}, rest, value) }
}

const serverFieldMap: Record<string, string> = {
  "pf.maxWageLimit": "pf.maxWageLimit",
  "pf.applicableSalaryHeads": "pf.applicableSalaryHeads",
  "pf.employee.contributionRate": "pf.employee.contributionRate",
  "pf.employer.totalContributionRate": "pf.employer.totalContributionRate",
  "pf.employer.breakdown.eps.rate": "pf.employer.breakdown.eps.rate",
  "pf.employer.breakdown.epf.rate": "pf.employer.breakdown.epf.rate",
  "pf.employer.adminCharges.rate": "pf.employer.adminCharges.rate",
  "pf.employer.adminCharges.appliedOn": "pf.employer.adminCharges.appliedOn",
  "pf.edli.contributionRate": "pf.edli.contributionRate",
  "pf.edli.maxWages": "pf.edli.maxWages",
  "pf.edli.maxContribution": "pf.edli.maxContribution",
  "pf.edli.adminCharges.rate": "pf.edli.adminCharges.rate",
  "esi.maxGrossSalaryLimit": "esi.maxGrossSalaryLimit",
  "esi.applicableSalaryHeads": "esi.applicableSalaryHeads",
  "esi.employee.contributionRate": "esi.employee.contributionRate",
  "esi.employer.contributionRate": "esi.employer.contributionRate",
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function WageEmployerContributionsForm({
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
  const [formData, setFormData] = useState<WageEmployerContributionsFormValues>(defaultWageEmployerContributionsValues)
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
    url: "wageEmployerContributions/search",
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
      toast.error("Failed to load wage employer contributions data")
      setFetchingData(false)
      onClose()
    },
  })

  useEffect(() => {
    if ((isEditMode || isViewMode) && rowId && searchApiCriteria) {
      setFetchingData(true)
      fetchRecord()
    } else if (isAddMode) {
      setFormData(defaultWageEmployerContributionsValues)
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
          const normalizedField =
            serverFieldMap[fieldName] ??
            serverFieldMap[fieldName.split(".").slice(-2).join(".")] ??
            serverFieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) {
            unmapped.push(message)
            return
          }
          nextErrors[normalizedField] = message
        })
        setErrors((prev) => ({ ...prev, ...nextErrors }))
        if (unmapped.length > 0) setGeneralErrors(unmapped)
        setLoading(false)
        return
      }
      toast.success(`Wage Employer Contributions ${isEditMode ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)
      onClose()
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} wage employer contributions`)
      setLoading(false)
    },
  })

  const submit = useCallback(async () => {
    if (isViewMode) { onClose(); return }
    setShowErrors(true)

    const parsed = wageEmployerContributionsSchema.safeParse(formData)
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

    const { _id, tenantCode: parsedTenantCode, organizationCode: parsedOrganizationCode, ...contributionData } = parsed.data
    const resolvedTenantCode = parsedTenantCode ?? tenantCode
    const resolvedOrganizationCode = parsedOrganizationCode ?? resolvedTenantCode
    const resolvedRecordId = isEditMode ? rowId ?? (typeof _id === "string" ? _id : (_id as any)?.$oid) : null

    await post({
      tenant: resolvedTenantCode,
      action: isEditMode ? "update" : "insert",
      id: resolvedRecordId,
      collectionName: "wageEmployerContributions",
      event: "validate",
      ruleId: "wageEmployerContributionsPFAndESIValidator",
      data: {
        ...contributionData,
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

  const updatePfField = useCallback((path: string[], value: any) => {
    if (isViewMode) return
    setFormData((prev) => ({ ...prev, pf: updateNestedValue(prev.pf, path, value) }))
    clearError(`pf.${path.join(".")}`)
  }, [isViewMode, clearError])

  const updateEsiField = useCallback((field: string, value: any) => {
    if (isViewMode) return
    setFormData((prev) => ({ ...prev, esi: { ...prev.esi, [field]: value } }))
    clearError(`esi.${field}`)
  }, [isViewMode, clearError])

  const updateEsiNestedField = useCallback((path: string[], value: any) => {
    if (isViewMode) return
    setFormData((prev) => ({ ...prev, esi: updateNestedValue(prev.esi, path, value) }))
    clearError(`esi.${path.join(".")}`)
  }, [isViewMode, clearError])

  const totalEmployerContribution = useMemo(() => {
    const pfRate = formData.pf.enabled ? (formData.pf.employer.totalContributionRate || 0) : 0
    const esiRate = formData.esi.enabled ? (formData.esi.employer.contributionRate || 0) : 0
    return pfRate + esiRate
  }, [formData.pf.enabled, formData.pf.employer.totalContributionRate, formData.esi.enabled, formData.esi.employer.contributionRate])

  const formatRate = (value: number) => Number(value.toFixed(2)).toString()

  const labelStyles = "block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1"
  const isLoading = fetchingData || recordLoading

  const fieldError = (key: string) => (showErrors ? errors[key] : undefined)
  const hasError = (key: string) => showErrors && !!errors[key]

  const getTitle = () => {
    if (isViewMode) return "View Wage Employer Contributions"
    if (isEditMode) return "Edit Wage Employer Contributions"
    return "Add Wage Employer Contributions"
  }

  return (
    <div className="w-full space-y-6">
      <Card className="w-full mx-auto border border-gray-200 bg-white shadow-sm">
        <GradientFormHeader
          icon={Shield}
          title={getTitle()}
          description="Define PF and ESI employer contribution settings, wage limits, rates, and salary head applicability."
        />

        <CardContent className="px-6 py-6 space-y-8">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-600">Loading configuration data...</div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-8">
              {generalErrors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 space-y-1">
                  {generalErrors.map((msg, i) => (
                    <p key={i}>{msg}</p>
                  ))}
                </div>
              )}
              {showErrors && Object.keys(errors).length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Please correct the highlighted fields before saving.
                </div>
              )}

              {/* ── PF Section ─────────────────────────────────────────────── */}
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <SubFormTitle title="Provident Fund (PF)" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="pf-enabled"
                      checked={formData.pf.enabled}
                      disabled={isViewMode}
                      onCheckedChange={(checked: any) => updatePfField(["enabled"], checked)}
                    />
                    <Label htmlFor="pf-enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Enable PF
                    </Label>
                  </div>
                </div>

                {formData.pf.enabled && (
                  <div className="space-y-6 md:pl-6">
                    {/* Basic Settings */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        Basic Settings
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <NumericInput
                          label="Max Wage Limit (Rs.)"
                          step="1"
                          value={formData.pf.maxWageLimit}
                          onChange={(v) => updatePfField(["maxWageLimit"], v)}
                          disabled={isViewMode}
                          placeholder="Enter max wage limit"
                          hasError={hasError("pf.maxWageLimit")}
                          helperText={fieldError("pf.maxWageLimit")}
                        />
                        <div className="space-y-2">
                          <Label className={labelStyles}>Applicable Salary Heads</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border bg-gray-50/40 p-3">
                            {salaryHeadOptions.map((head) => (
                              <div key={head.value} className="flex items-center gap-2">
                                <Checkbox
                                  checked={formData.pf.applicableSalaryHeads.includes(head.value)}
                                  disabled={isViewMode}
                                  onCheckedChange={(checked) => {
                                    const current = formData.pf.applicableSalaryHeads
                                    const updated = checked
                                      ? [...current, head.value]
                                      : current.filter((h: string) => h !== head.value)
                                    updatePfField(["applicableSalaryHeads"], updated)
                                  }}
                                />
                                <Label className="text-sm text-gray-700">{head.label}</Label>
                              </div>
                            ))}
                          </div>
                          {showErrors && errors["pf.applicableSalaryHeads"] && (
                            <p className="text-xs text-red-600">{errors["pf.applicableSalaryHeads"]}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Employee Contribution */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        Employee Contribution
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <NumericInput
                          label="Contribution Rate (%)"
                          value={formData.pf.employee.contributionRate}
                          onChange={(v) => updatePfField(["employee", "contributionRate"], v)}
                          disabled={isViewMode}
                          placeholder="Enter contribution rate"
                          hasError={hasError("pf.employee.contributionRate")}
                          helperText={fieldError("pf.employee.contributionRate")}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Employer Contribution */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        Employer Contribution
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <NumericInput
                          label="Total Contribution Rate (%)"
                          value={formData.pf.employer.totalContributionRate}
                          onChange={(v) => updatePfField(["employer", "totalContributionRate"], v)}
                          disabled={isViewMode}
                          placeholder="Enter total contribution rate"
                          hasError={hasError("pf.employer.totalContributionRate")}
                          helperText={fieldError("pf.employer.totalContributionRate")}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <NumericInput
                          label="EPS Rate (%)"
                          value={formData.pf.employer.breakdown.eps.rate}
                          onChange={(v) => updatePfField(["employer", "breakdown", "eps", "rate"], v)}
                          disabled={isViewMode}
                          placeholder="Enter EPS rate"
                          hasError={hasError("pf.employer.breakdown.eps.rate")}
                          helperText={fieldError("pf.employer.breakdown.eps.rate")}
                        />
                        <NumericInput
                          label="EPF Rate (%)"
                          value={formData.pf.employer.breakdown.epf.rate}
                          onChange={(v) => updatePfField(["employer", "breakdown", "epf", "rate"], v)}
                          disabled={isViewMode}
                          placeholder="Enter EPF rate"
                          hasError={hasError("pf.employer.breakdown.epf.rate")}
                          helperText={fieldError("pf.employer.breakdown.epf.rate")}
                        />
                        <div className="space-y-2">
                          <Label className={labelStyles}>EPF Description</Label>
                          <Input
                            placeholder="Description"
                            disabled={isViewMode}
                            value={formData.pf.employer.breakdown.epf.description}
                            onChange={(e) => updatePfField(["employer", "breakdown", "epf", "description"], e.target.value)}
                            className={`h-9 px-3 py-1.5 text-sm border-gray-300 transition ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <NumericInput
                          label="Admin Charges Rate (%)"
                          value={formData.pf.employer.adminCharges.rate}
                          onChange={(v) => updatePfField(["employer", "adminCharges", "rate"], v)}
                          disabled={isViewMode}
                          placeholder="Enter admin charges rate"
                          hasError={hasError("pf.employer.adminCharges.rate")}
                          helperText={fieldError("pf.employer.adminCharges.rate")}
                        />
                        <div className="space-y-2">
                          <Label className={labelStyles}>Applied On</Label>
                          <Input
                            disabled={isViewMode}
                            value={formData.pf.employer.adminCharges.appliedOn}
                            onChange={(e) => updatePfField(["employer", "adminCharges", "appliedOn"], e.target.value)}
                            placeholder="employer_total_contribution"
                            className={`h-9 px-3 py-1.5 text-sm border-gray-300 transition ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${hasError("pf.employer.adminCharges.appliedOn") ? "border-red-500" : ""}`}
                          />
                          {showErrors && errors["pf.employer.adminCharges.appliedOn"] && (
                            <p className="text-xs text-red-600">{errors["pf.employer.adminCharges.appliedOn"]}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* EDLI */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-800">EDLI (Employee Deposit Linked Insurance)</h4>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="edli-enabled"
                            checked={formData.pf.edli.enabled}
                            disabled={isViewMode}
                            onCheckedChange={(checked: any) => updatePfField(["edli", "enabled"], checked)}
                          />
                          <Label htmlFor="edli-enabled" className="text-sm text-gray-600 cursor-pointer">
                            Enable EDLI
                          </Label>
                        </div>
                      </div>
                      {formData.pf.edli.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                          <NumericInput
                            label="Contribution Rate (%)"
                            value={formData.pf.edli.contributionRate}
                            onChange={(v) => updatePfField(["edli", "contributionRate"], v)}
                            disabled={isViewMode}
                            placeholder="Enter contribution rate"
                            hasError={hasError("pf.edli.contributionRate")}
                            helperText={fieldError("pf.edli.contributionRate")}
                          />
                          <NumericInput
                            label="Max Wages (Rs.)"
                            step="1"
                            value={formData.pf.edli.maxWages}
                            onChange={(v) => updatePfField(["edli", "maxWages"], v)}
                            disabled={isViewMode}
                            placeholder="Enter max wages"
                            hasError={hasError("pf.edli.maxWages")}
                            helperText={fieldError("pf.edli.maxWages")}
                          />
                          <NumericInput
                            label="Max Contribution (Rs.)"
                            step="1"
                            value={formData.pf.edli.maxContribution}
                            onChange={(v) => updatePfField(["edli", "maxContribution"], v)}
                            disabled={isViewMode}
                            placeholder="Enter max contribution"
                            hasError={hasError("pf.edli.maxContribution")}
                            helperText={fieldError("pf.edli.maxContribution")}
                          />
                          <NumericInput
                            label="Admin Charges Rate (%)"
                            value={formData.pf.edli.adminCharges.rate}
                            onChange={(v) => updatePfField(["edli", "adminCharges", "rate"], v)}
                            disabled={isViewMode}
                            placeholder="Enter admin charges rate"
                            hasError={hasError("pf.edli.adminCharges.rate")}
                            helperText={fieldError("pf.edli.adminCharges.rate")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* ── ESI Section ────────────────────────────────────────────── */}
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <SubFormTitle title="Employee State Insurance (ESI)" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="esi-enabled"
                      checked={formData.esi.enabled}
                      disabled={isViewMode}
                      onCheckedChange={(checked: any) => updateEsiField("enabled", checked)}
                    />
                    <Label htmlFor="esi-enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Enable ESI
                    </Label>
                  </div>
                </div>

                {formData.esi.enabled && (
                  <div className="space-y-5 md:pl-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <NumericInput
                        label="Max Gross Salary Limit (Rs.)"
                        step="1"
                        value={formData.esi.maxGrossSalaryLimit}
                        onChange={(v) => updateEsiField("maxGrossSalaryLimit", v)}
                        disabled={isViewMode}
                        placeholder="Enter max gross salary limit"
                        hasError={hasError("esi.maxGrossSalaryLimit")}
                        helperText={fieldError("esi.maxGrossSalaryLimit")}
                      />
                      <div className="space-y-2">
                        <Label className={labelStyles}>Applicable Salary Heads</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border bg-gray-50/40 p-3">
                          {salaryHeadOptions.map((head) => (
                            <div key={head.value} className="flex items-center gap-2">
                              <Checkbox
                                checked={formData.esi.applicableSalaryHeads.includes(head.value)}
                                disabled={isViewMode}
                                onCheckedChange={(checked) => {
                                  const current = formData.esi.applicableSalaryHeads
                                  const updated = checked
                                    ? [...current, head.value]
                                    : current.filter((h: string) => h !== head.value)
                                  updateEsiField("applicableSalaryHeads", updated)
                                }}
                              />
                              <Label className="text-sm text-gray-700">{head.label}</Label>
                            </div>
                          ))}
                        </div>
                        {showErrors && errors["esi.applicableSalaryHeads"] && (
                          <p className="text-xs text-red-600">{errors["esi.applicableSalaryHeads"]}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <NumericInput
                        label="Employee Contribution Rate (%)"
                        value={formData.esi.employee.contributionRate}
                        onChange={(v) => updateEsiNestedField(["employee", "contributionRate"], v)}
                        disabled={isViewMode}
                        placeholder="Enter employee contribution rate"
                        hasError={hasError("esi.employee.contributionRate")}
                        helperText={fieldError("esi.employee.contributionRate")}
                      />
                      <NumericInput
                        label="Employer Contribution Rate (%)"
                        value={formData.esi.employer.contributionRate}
                        onChange={(v) => updateEsiNestedField(["employer", "contributionRate"], v)}
                        disabled={isViewMode}
                        placeholder="Enter employer contribution rate"
                        hasError={hasError("esi.employer.contributionRate")}
                        helperText={fieldError("esi.employer.contributionRate")}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Summary ────────────────────────────────────────────────── */}
              <div className="flex items-center justify-between px-5 py-3 rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">Total Employer Contribution</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-700">{formatRate(totalEmployerContribution)}</span>
                  <span className="text-sm font-medium text-gray-600">%</span>
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
            primaryLabel={isViewMode ? "Close" : "Save Changes"}
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
