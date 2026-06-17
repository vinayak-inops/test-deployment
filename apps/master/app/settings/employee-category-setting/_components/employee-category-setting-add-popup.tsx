"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@repo/ui/components/ui/card"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { X, Settings2, Mail, Hash, ShieldCheck, Clock4 } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import NumericInput from "@/components/fields/input/number-input"
import SingleSelectField from "@/components/fields/single-select-field"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { toast } from "react-toastify"
import { Button } from "@repo/ui/components/ui/button"
import {
  defaultEmployeeCategorySettingValues,
  employeeCategorySettingSchema,
  type EmployeeCategorySettingFormValues,
} from "./schemas/employee-category-setting-form.schema"

// ─── Safe helpers ─────────────────────────────────────────────────────────────

function safeStr(value: any, fallback = ""): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value || fallback
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (typeof value === "object") {
    const first = Object.values(value).find((v) => typeof v === "string")
    return (first as string) || fallback
  }
  return fallback
}

function safeNum(value: any, fallback = 0): number {
  if (typeof value === "number") return value
  const n = parseFloat(value)
  return isNaN(n) ? fallback : n
}

// ─── Reusable field components ────────────────────────────────────────────────

function BooleanToggle({
  label, value, onChange, disabled,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer select-none ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen:    boolean
  mode?:     "add" | "edit" | "view"
  recordId?: string | null
  onClose:   () => void
  onSaved?:  () => Promise<void> | void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmpCategorySettingAddPopup({
  isOpen, mode = "add", recordId = null, onClose, onSaved,
}: Props) {
  const router         = useRouter()
  const tenantCode     = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const [loading, setLoading]         = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [showErrors, setShowErrors]   = useState(false)
  const [formData, setFormData]       = useState<EmployeeCategorySettingFormValues>(defaultEmployeeCategorySettingValues)
  const [errors, setErrors]           = useState<Record<string, string>>({})
  const [organizationData, setOrganizationData] = useState<any>({})
  const wasOpenRef    = useRef(false)
  const hasFetchedRef = useRef(false)

  const isViewMode = mode === "view"
  const isEditMode = mode === "edit"
  const isAddMode  = mode === "add"

  // ── Organization criteria ──────────────────────────────────────────────────

  const organizationCriteriaRequests = useMemo(
    () =>
      tenantCode
        ? [{ field: "tenantCode", operator: "is", value: tenantCode }]
        : [],
    [tenantCode]
  )

  // ── Organization data ──────────────────────────────────────────────────────

  const { arrayData: employeeCategoriesArray, loading: employeeCategoriesLoading } =
    useAggregateArrayFetch<any>({
      collection:       "organization",
      criteriaRequests: organizationCriteriaRequests,
      arrayField:       "employeeCategories",
      enabled:          Boolean(tenantCode) && isOpen,
      defaultValue:     [],
    })

  const isOrgLoading = employeeCategoriesLoading

  useEffect(() => {
    if (isOpen) {
      setOrganizationData({
        employeeCategories: employeeCategoriesArray || [],
      })
    }
  }, [isOpen, employeeCategoriesArray])

  // ── Fetch single record ────────────────────────────────────────────────────

  const { refetch: fetchRecord, loading: recordLoading } = useRequest<any>({
    url: recordId && (isEditMode || isViewMode) ? `employee_category_setting/${recordId}` : "",
    method: "GET",
    onSuccess: (data: any) => {
      if (data) {
        const g = data?.genericSettings    ?? {}
        const s = data?.shiftGraceSettings ?? {}
        const l = data?.levelOfApprovals   ?? {}
        setFormData({
          sourceEmailPassward:  safeStr(data?.sourceEmailPassward),
          sourceEmailAddess:    safeStr(data?.sourceEmailAddess),
          employeeCategoryCode: safeStr(data?.employeeCategoryCode),
          levelOfApprovals: {
            leaveApprovalLevel:   safeNum(l.leaveApprovalLevel),
            punchApprovalLevel:   safeNum(l.punchApprovalLevel),
            outDutyApprovalLevel: safeNum(l.outDutyApprovalLevel),
            shiftApprovalLevel:   safeNum(l.shiftApprovalLevel),
          },
          shiftGraceSettings: {
            lunchHourDeduction:  Boolean(s.lunchHourDeduction),
            outAboveMargin:      safeNum(s.outAboveMargin),
            lateInAllowedTime:   safeNum(s.lateInAllowedTime),
            inAboveMargin:       safeNum(s.inAboveMargin),
            inAheadMargin:       safeNum(s.inAheadMargin),
            outAheadMargin:      safeNum(s.outAheadMargin),
            graceIn:             safeNum(s.graceIn),
            graceOut:            safeNum(s.graceOut),
            earlyOutAllowedTime: safeNum(s.earlyOutAllowedTime),
          },
          genericSettings: {
            allowMobileApp:                          Boolean(g.allowMobileApp),
            includeHolidayInPresentDays:             Boolean(g.includeHolidayInPresentDays),
            allowAttendanceFromMobileApp:            Boolean(g.allowAttendanceFromMobileApp),
            autoMarkPresent:                         Boolean(g.autoMarkPresent),
            includeLeaveInPresentDays:               Boolean(g.includeLeaveInPresentDays),
            allowEmail:                              Boolean(g.allowEmail),
            ceilingLimitApplicableForPFContribution: Boolean(g.ceilingLimitApplicableForPFContribution),
            allowEmailNotification:                  Boolean(g.allowEmailNotification),
            temporaryEmployee:                       Boolean(g.temporaryEmployee),
            allowManualSwipesFromWeb:                Boolean(g.allowManualSwipesFromWeb),
            excludeWeekOffFromPayableDays:           Boolean(g.excludeWeekOffFromPayableDays),
          },
        })
      }
      setFetchingData(false)
    },
    onError: () => setFetchingData(false),
  })

  // ── Employee Category Options ───────────────────────────────────────────────

  const employeeCategoryOptions = useMemo(() => {
    const categories = organizationData.employeeCategories || []
    return categories
      .filter((cat: any) => {
        const hasCode =
          (cat.employeeCategoryCode || cat.categoryCode) &&
          (cat.employeeCategoryCode || cat.categoryCode).trim() !== ""
        return hasCode
      })
      .map((cat: any) => ({
        value: cat.employeeCategoryCode || cat.categoryCode,
        label: cat.employeeCategoryName || cat.categoryName || cat.employeeCategoryCode || cat.categoryCode,
      }))
  }, [organizationData.employeeCategories])

  // ── Open / close lifecycle ─────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      if ((isEditMode || isViewMode) && recordId) {
        if (!hasFetchedRef.current || !wasOpenRef.current) {
          setFetchingData(true)
          fetchRecord()
          hasFetchedRef.current = true
        }
      } else if (isAddMode) {
        setFormData(defaultEmployeeCategorySettingValues)
        hasFetchedRef.current = false
      }
      setErrors({})
      setShowErrors(false)
    } else {
      hasFetchedRef.current = false
      setFormData(defaultEmployeeCategorySettingValues)
    }
    wasOpenRef.current = isOpen
  }, [isOpen, mode, recordId, isEditMode, isViewMode, isAddMode])

  // ── ESC key ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading && !fetchingData) onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, loading, fetchingData])

  // ── POST ───────────────────────────────────────────────────────────────────

  const serverFieldMap: Record<string, string> = {
    "employeeCategoryCode":                                    "employeeCategoryCode",
    "sourceEmailAddess":                                       "sourceEmailAddess",
    "sourceEmailPassward":                                     "sourceEmailPassward",
    "levelOfApprovals.leaveApprovalLevel":                     "levelOfApprovals.leaveApprovalLevel",
    "levelOfApprovals.punchApprovalLevel":                     "levelOfApprovals.punchApprovalLevel",
    "levelOfApprovals.outDutyApprovalLevel":                   "levelOfApprovals.outDutyApprovalLevel",
    "levelOfApprovals.shiftApprovalLevel":                     "levelOfApprovals.shiftApprovalLevel",
    "shiftGraceSettings.outAboveMargin":                       "shiftGraceSettings.outAboveMargin",
    "shiftGraceSettings.lateInAllowedTime":                    "shiftGraceSettings.lateInAllowedTime",
    "shiftGraceSettings.inAboveMargin":                        "shiftGraceSettings.inAboveMargin",
    "shiftGraceSettings.inAheadMargin":                        "shiftGraceSettings.inAheadMargin",
    "shiftGraceSettings.outAheadMargin":                       "shiftGraceSettings.outAheadMargin",
    "shiftGraceSettings.graceIn":                              "shiftGraceSettings.graceIn",
    "shiftGraceSettings.graceOut":                             "shiftGraceSettings.graceOut",
    "shiftGraceSettings.earlyOutAllowedTime":                  "shiftGraceSettings.earlyOutAllowedTime",
    "shiftGraceSettings.lunchHourDeduction":                   "shiftGraceSettings.lunchHourDeduction",
    "genericSettings.allowMobileApp":                          "genericSettings.allowMobileApp",
    "genericSettings.includeHolidayInPresentDays":             "genericSettings.includeHolidayInPresentDays",
    "genericSettings.allowAttendanceFromMobileApp":            "genericSettings.allowAttendanceFromMobileApp",
    "genericSettings.autoMarkPresent":                         "genericSettings.autoMarkPresent",
    "genericSettings.includeLeaveInPresentDays":               "genericSettings.includeLeaveInPresentDays",
    "genericSettings.allowEmail":                              "genericSettings.allowEmail",
    "genericSettings.ceilingLimitApplicableForPFContribution": "genericSettings.ceilingLimitApplicableForPFContribution",
    "genericSettings.allowEmailNotification":                  "genericSettings.allowEmailNotification",
    "genericSettings.temporaryEmployee":                       "genericSettings.temporaryEmployee",
    "genericSettings.allowManualSwipesFromWeb":                "genericSettings.allowManualSwipesFromWeb",
    "genericSettings.excludeWeekOffFromPayableDays":           "genericSettings.excludeWeekOffFromPayableDays",
  }

  const { post } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const nextErrors: Record<string, string> = {}
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return

          const normalizedField =
            serverFieldMap[fieldName] ??
            serverFieldMap[fieldName.split(".").slice(-2).join(".")] ??
            serverFieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          nextErrors[normalizedField] = message
        })
        setErrors((prev) => ({ ...prev, ...nextErrors }))
        setLoading(false)
        return
      }

      toast.success(`Employee category setting ${isEditMode ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)

      const createdId = response?.data?._id ?? response?.data?.id ?? response?._id ?? response?.id
      if (createdId && !isEditMode) {
        router.push(`/settings/employee-category-setting?mode=edit&id=${encodeURIComponent(String(createdId))}`)
      } else {
        onClose()
      }
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} employee category setting`)
      setLoading(false)
    },
  })

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (isViewMode) return
    setShowErrors(true)
    const parsed = employeeCategorySettingSchema.safeParse(formData)
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
    setLoading(true)
    await post({
      tenant:         tenantCode,
      action:         isEditMode ? "update" : "insert",
      id:             isEditMode ? recordId : null,
      collectionName: "employee_category_setting",
      event:          "validate",
      ruleId:         "employeeCategorySettingValidator",
      data: {
        ...parsed.data,
        organizationCode: tenantCode,
        tenantCode,
        updatedBy: employeeId ?? null,
        updatedOn: new Date().toISOString(),
      },
    })
  }

  // ── Field helpers ──────────────────────────────────────────────────────────

  const clearError = (key: string) => {
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n })
  }

  const setTopField = (field: keyof EmployeeCategorySettingFormValues, value: any) => {
    if (isViewMode) return
    setFormData((prev) => ({ ...prev, [field]: value }))
    clearError(field)
  }

  const setLevelField = (field: string, value: number) => {
    if (isViewMode) return
    setFormData((prev) => ({
      ...prev,
      levelOfApprovals: { ...prev.levelOfApprovals, [field]: value },
    }))
    clearError(`levelOfApprovals.${field}`)
  }

  const setGraceField = (field: string, value: any) => {
    if (isViewMode) return
    setFormData((prev) => ({
      ...prev,
      shiftGraceSettings: { ...prev.shiftGraceSettings, [field]: value },
    }))
    clearError(`shiftGraceSettings.${field}`)
  }

  const setGenericField = (field: string, value: boolean) => {
    if (isViewMode) return
    setFormData((prev) => ({
      ...prev,
      genericSettings: { ...prev.genericSettings, [field]: value },
    }))
  }

  const handleEmployeeCategorySelect = (value: string) => {
    if (isViewMode) return
    setTopField("employeeCategoryCode", value)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && !fetchingData) onClose()
  }

  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  if (!isOpen) return null

  const isLoadingData = fetchingData || recordLoading || isOrgLoading

  const getTitle = () => {
    if (isViewMode) return "View Employee Category Setting"
    if (isEditMode) return "Edit Employee Category Setting"
    return "Add Employee Category Setting"
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-4xl max-h-[90vh] flex flex-col">
        <Card className="border border-gray-200 bg-white shadow-sm flex flex-col h-full overflow-hidden">

          {/* Header */}
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-blue-600" />
                Employee Category Setting — {getTitle()}
              </CardTitle>
              <button type="button" onClick={onClose} disabled={loading || isLoadingData}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50">
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          {/* Body */}
          <CardContent className="px-6 py-4 overflow-y-auto flex-1">
            {isLoadingData && (
              <div className="py-12 text-center text-sm text-gray-600">
                {isOrgLoading ? "Loading employee categories..." : "Loading record data..."}
              </div>
            )}

            {!isLoadingData && (
              <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-6">

                {/* ── Identity ──────────────────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Identity" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                    {/* Employee Category Code - Select Field */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Employee Category"
                        placeholder="Select Employee Category"
                        value={formData.employeeCategoryCode}
                        onChange={handleEmployeeCategorySelect}
                        options={employeeCategoryOptions}
                        required
                        disabled={isOrgLoading || isViewMode}
                      />
                      {showErrors && errors.employeeCategoryCode && (
                        <p className="text-xs text-red-600 mt-1">{errors.employeeCategoryCode}</p>
                      )}
                    </div>

                    {/* Source Email Address */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Source Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={formData.sourceEmailAddess}
                        onChange={(e) => setTopField("sourceEmailAddess", e.target.value)}
                        disabled={isViewMode}
                        placeholder="e.g. demouser@gmail.com"
                        className={`${fieldStyles} bg-white
                          ${showErrors && errors.sourceEmailAddess ? "border-red-500" : ""}
                          ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      />
                      {showErrors && errors.sourceEmailAddess && (
                        <p className="text-xs text-red-600">{errors.sourceEmailAddess}</p>
                      )}
                    </div>

                    {/* Source Email Password */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Source Email Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type={isViewMode ? "password" : "text"}
                        value={formData.sourceEmailPassward}
                        onChange={(e) => setTopField("sourceEmailPassward", e.target.value)}
                        disabled={isViewMode}
                        placeholder="Email account password"
                        className={`${fieldStyles} bg-white
                          ${showErrors && errors.sourceEmailPassward ? "border-red-500" : ""}
                          ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                      />
                      {showErrors && errors.sourceEmailPassward && (
                        <p className="text-xs text-red-600">{errors.sourceEmailPassward}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Level of Approvals ────────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Level of Approvals" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { field: "leaveApprovalLevel",   label: "Leave Approval Level" },
                      { field: "punchApprovalLevel",   label: "Punch Approval Level" },
                      { field: "outDutyApprovalLevel", label: "Out Duty Approval Level" },
                      { field: "shiftApprovalLevel",   label: "Shift Approval Level" },
                    ].map(({ field, label }) => (
                      <div key={field} className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {label}
                        </Label>
                        <NumericInput
                          value={(formData.levelOfApprovals as any)[field]}
                          onChange={(v) => setLevelField(field, v)}
                          disabled={isViewMode}
                          hasError={showErrors && !!errors[`levelOfApprovals.${field}`]}
                          className="border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
                        />
                        {showErrors && errors[`levelOfApprovals.${field}`] && (
                          <p className="text-xs text-red-600">{errors[`levelOfApprovals.${field}`]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* ── Shift Grace Settings ──────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Shift Grace Settings" />

                  {/* Numeric grace fields */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { field: "graceIn",             label: "Grace In (minutes)" },
                      { field: "graceOut",            label: "Grace Out (minutes)" },
                      { field: "lateInAllowedTime",   label: "Late In Allowed Time (minutes)" },
                      { field: "earlyOutAllowedTime", label: "Early Out Allowed Time (minutes)" },
                      { field: "inAboveMargin",       label: "In Above Margin (minutes)" },
                      { field: "outAboveMargin",      label: "Out Above Margin (minutes)" },
                      { field: "inAheadMargin",       label: "In Ahead Margin (minutes)" },
                      { field: "outAheadMargin",      label: "Out Ahead Margin (minutes)" },
                    ].map(({ field, label }) => (
                      <div key={field} className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                          <Clock4 className="h-3 w-3" />{label}
                        </Label>
                        <NumericInput
                          value={(formData.shiftGraceSettings as any)[field]}
                          onChange={(v) => setGraceField(field, v)}
                          disabled={isViewMode}
                          hasError={showErrors && !!errors[`shiftGraceSettings.${field}`]}
                          helperText={showErrors ? errors[`shiftGraceSettings.${field}`] : undefined}
                          className="border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Boolean grace field */}
                  <div className="pt-1">
                    <BooleanToggle
                      label="Deduct Lunch Hour for Grace"
                      value={formData.shiftGraceSettings.lunchHourDeduction}
                      onChange={(v) => setGraceField("lunchHourDeduction", v)}
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                <Separator />

                {/* ── Generic Settings ──────────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Generic Settings" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
                    {[
                      { field: "allowMobileApp",                          label: "Allow Mobile App" },
                      { field: "allowAttendanceFromMobileApp",            label: "Allow Attendance from Mobile App" },
                      { field: "allowEmail",                              label: "Allow Email" },
                      { field: "allowEmailNotification",                  label: "Allow Email Notification" },
                      { field: "allowManualSwipesFromWeb",                label: "Allow Manual Swipes from Web" },
                      { field: "autoMarkPresent",                         label: "Auto Mark Present" },
                      { field: "includeHolidayInPresentDays",             label: "Include Holiday in Present Days" },
                      { field: "includeLeaveInPresentDays",               label: "Include Leave in Present Days" },
                      { field: "excludeWeekOffFromPayableDays",           label: "Exclude Week Off from Payable Days" },
                      { field: "ceilingLimitApplicableForPFContribution", label: "Ceiling Limit Applicable for PF Contribution" },
                      { field: "temporaryEmployee",                       label: "Temporary Employee" },
                    ].map(({ field, label }) => (
                      <BooleanToggle
                        key={field}
                        label={label}
                        value={(formData.genericSettings as any)[field]}
                        onChange={(v) => setGenericField(field, v)}
                        disabled={isViewMode}
                      />
                    ))}
                  </div>
                </div>

              </form>
            )}
          </CardContent>

          {/* Footer */}
          <CardFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            {isViewMode ? (
              <Button type="button" onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">
                Close
              </Button>
            ) : (
              <ActionButtons
                layout="end"
                gap="gap-3"
                secondaryLabel="Cancel"
                onSecondary={onClose}
                primaryLabel="Save Changes"
                onPrimary={submit}
                primaryLoading={loading}
                primaryDisabled={loading || isLoadingData}
                secondaryDisabled={loading || isLoadingData}
                primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
                secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              />
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}