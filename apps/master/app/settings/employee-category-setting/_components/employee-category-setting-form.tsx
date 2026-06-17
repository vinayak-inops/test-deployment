"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { Settings } from "lucide-react"
import { toast } from "react-toastify"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import NumericInput from "@/components/fields/input/number-input"
import SingleSelectField from "@/components/fields/single-select-field"
import { GradientFormHeader } from "@/components/header/form-header"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import {
  defaultEmployeeCategorySettingValues,
  employeeCategorySettingSchema,
  type EmployeeCategorySettingFormValues,
} from "./schemas/employee-category-setting-form.schema"
import type { NotificationSettingItem } from "./form/notification/notification-settings-form-popup"
import type { DefaultWeekOffItem } from "./form/default-week-offs/default-week-offs-form-popup"

type Mode = "add" | "edit" | "view"

type Props = {
  mode: Mode
  rowId?: string | null
  tenantCode?: string
  employeeId?: string
  onClose: () => void
  onSaved?: () => Promise<void> | void
  notificationSettings?: NotificationSettingItem[]
  defaultWeekOffs?: DefaultWeekOffItem[]
  onNotificationLoad?: (items: NotificationSettingItem[]) => void
  onDefaultWeekOffsLoad?: (items: DefaultWeekOffItem[]) => void
}

function safeStr(value: any, fallback = "") {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value || fallback
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return fallback
}

function safeNumber(value: any, fallback = 0) {
  if (typeof value === "number") return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeSetting(value: any): EmployeeCategorySettingFormValues {
  return {
    sourceEmailPassward: safeStr(value?.sourceEmailPassward),
    sourceEmailAddess: safeStr(value?.sourceEmailAddess),
    employeeCategoryCode: safeStr(value?.employeeCategoryCode || value?.employeeCategory),
    levelOfApprovals: {
      leaveApprovalLevel: safeNumber(value?.levelOfApprovals?.leaveApprovalLevel),
      punchApprovalLevel: safeNumber(value?.levelOfApprovals?.punchApprovalLevel),
      outDutyApprovalLevel: safeNumber(value?.levelOfApprovals?.outDutyApprovalLevel),
      shiftApprovalLevel: safeNumber(value?.levelOfApprovals?.shiftApprovalLevel),
    },
    shiftGraceSettings: {
      lunchHourDeduction: !!value?.shiftGraceSettings?.lunchHourDeduction,
      outAboveMargin: safeNumber(value?.shiftGraceSettings?.outAboveMargin),
      lateInAllowedTime: safeNumber(value?.shiftGraceSettings?.lateInAllowedTime),
      inAboveMargin: safeNumber(value?.shiftGraceSettings?.inAboveMargin),
      inAheadMargin: safeNumber(value?.shiftGraceSettings?.inAheadMargin),
      outAheadMargin: safeNumber(value?.shiftGraceSettings?.outAheadMargin),
      graceIn: safeNumber(value?.shiftGraceSettings?.graceIn),
      graceOut: safeNumber(value?.shiftGraceSettings?.graceOut),
      earlyOutAllowedTime: safeNumber(value?.shiftGraceSettings?.earlyOutAllowedTime),
    },
    genericSettings: {
      allowMobileApp: !!value?.genericSettings?.allowMobileApp,
      includeHolidayInPresentDays: !!value?.genericSettings?.includeHolidayInPresentDays,
      allowAttendanceFromMobileApp: !!value?.genericSettings?.allowAttendanceFromMobileApp,
      autoMarkPresent: !!value?.genericSettings?.autoMarkPresent,
      includeLeaveInPresentDays: !!value?.genericSettings?.includeLeaveInPresentDays,
      allowEmail: !!value?.genericSettings?.allowEmail,
      ceilingLimitApplicableForPFContribution: !!value?.genericSettings?.ceilingLimitApplicableForPFContribution,
      allowEmailNotification: !!value?.genericSettings?.allowEmailNotification,
      temporaryEmployee: !!value?.genericSettings?.temporaryEmployee,
      allowManualSwipesFromWeb: !!value?.genericSettings?.allowManualSwipesFromWeb,
      excludeWeekOffFromPayableDays: !!value?.genericSettings?.excludeWeekOffFromPayableDays,
    },
  }
}

function ToggleField({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className={`flex items-center gap-2 text-sm text-gray-700 ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  )
}

export default function EmpCategorySettingForm({
  mode,
  rowId,
  tenantCode: propTenantCode,
  employeeId: propEmployeeId,
  onClose,
  onSaved,
  notificationSettings,
  defaultWeekOffs,
  onNotificationLoad,
  onDefaultWeekOffsLoad,
}: Props) {
  const router = useRouter()
  const hookTenantCode = useGetTenantCode()
  const hookEmployeeInfo = useKeyclockRoleInfo()
  const tenantCode = propTenantCode || hookTenantCode
  const employeeId = propEmployeeId || hookEmployeeInfo?.employeeId

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [formData, setFormData] = useState<EmployeeCategorySettingFormValues>(defaultEmployeeCategorySettingValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showErrors, setShowErrors] = useState(false)
  const [orgData, setOrgData] = useState<any[]>([])

  const isViewMode = mode === "view"
  const isEditMode = mode === "edit"
  const isAddMode = mode === "add"

  // ── API Criteria for fetching single record ────────────────────────────────────
  const searchApiCriteria = useMemo(() => {
    if (!rowId || (!isEditMode && !isViewMode)) return null
    
    const criteria: Array<{ field: string; operator: string; value: any }> = [
      { field: "_id", operator: "eq", value: rowId },
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
    ]
    return criteria
  }, [rowId, isEditMode, isViewMode, tenantCode])

  // ── Fetch single record using POST search ────────────────────────────────────
  const { loading: recordLoading, refetch: fetchRecord } = useRequest<any[]>({
    url: "employee_category_setting/search",
    method: "POST",
    data: searchApiCriteria || [],
    dependencies: [searchApiCriteria],
    enabled: Boolean(searchApiCriteria),
    onSuccess: (data) => {
      const item = Array.isArray(data) && data.length > 0 ? data[0] : null
      if (item) {
        setFormData(normalizeSetting(item))
        onNotificationLoad?.(Array.isArray(item?.notificationSettings) ? item.notificationSettings : [])
        onDefaultWeekOffsLoad?.(Array.isArray(item?.defaultWeekOffs) ? item.defaultWeekOffs : [])
      } else if (rowId) {
        toast.error("Record not found")
        onClose()
      }
      setFetchingData(false)
    },
    onError: () => {
      toast.error("Failed to load employee category setting data")
      setFetchingData(false)
      onClose()
    },
  })

  // ── Fetch organization data using POST search ─────────────────────────────────
  const orgSearchCriteria = useMemo(() => {
    return tenantCode 
      ? [{ field: "tenantCode", operator: "eq", value: tenantCode }]
      : []
  }, [tenantCode])

  const { refetch: fetchOrgData, loading: orgLoading } = useRequest<any[]>({
    url: "organization/search",
    method: "POST",
    data: orgSearchCriteria,
    dependencies: [tenantCode],
    enabled: Boolean(tenantCode),
    onSuccess: (data) => setOrgData(Array.isArray(data) ? data : []),
    onError: () => setOrgData([]),
  })

  useEffect(() => {
    if (tenantCode) fetchOrgData()
  }, [tenantCode])

  useEffect(() => {
    if ((isEditMode || isViewMode) && rowId && searchApiCriteria) {
      setFetchingData(true)
      fetchRecord()
    } else if (isAddMode) {
      setFormData(defaultEmployeeCategorySettingValues)
      setFetchingData(false)
    }
    setErrors({})
    setShowErrors(false)
    // fetchRecord is intentionally omitted because useRequest returns a new refetch function each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowId, isEditMode, isViewMode, isAddMode, searchApiCriteria])

  const categoryOptions = useMemo(() => {
    const categories = orgData[0]?.employeeCategories || []
    return Array.isArray(categories)
      ? categories
          .map((item: any) => {
            const code = safeStr(item?.employeeCategoryCode || item?.categoryCode)
            const name = safeStr(item?.employeeCategoryName || item?.categoryName || code)
            return code ? { value: code, label: name } : null
          })
          .filter(Boolean)
      : []
  }, [orgData])

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
      }
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} employee category setting`)
      setLoading(false)
    },
  })

  const clearError = (key: string) => {
    if (!errors[key]) return
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const updateRoot = (field: keyof EmployeeCategorySettingFormValues, value: any) => {
    if (isViewMode) return
    setFormData((prev) => ({ ...prev, [field]: value }))
    clearError(field)
  }

  const updateSection = <T extends "levelOfApprovals" | "shiftGraceSettings" | "genericSettings">(
    section: T,
    field: keyof EmployeeCategorySettingFormValues[T],
    value: any
  ) => {
    if (isViewMode) return
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }))
    clearError(`${section}.${String(field)}`)
  }

  const submit = async () => {
    if (isViewMode) {
      onClose()
      return
    }

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
      id:             isEditMode ? rowId : null,
      collectionName: "employee_category_setting",
      event:          "validate",
      ruleId:         "employeeCategorySettingValidator",
      data: {
        ...parsed.data,
        notificationSettings: notificationSettings ?? [],
        defaultWeekOffs:      defaultWeekOffs ?? [],
        organizationCode: tenantCode,
        tenantCode,
        updatedBy: employeeId ?? null,
        updatedOn: new Date().toISOString(),
      },
    })
  }

  const isLoading = fetchingData || recordLoading || orgLoading
  const disabledFieldStyles = isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"

  const getTitle = () => {
    if (isViewMode) return "View Employee Category Setting"
    if (isEditMode) return "Edit Employee Category Setting"
    return "Add Employee Category Setting"
  }

  return (
    <div className="w-full space-y-6">
      <Card className="w-full mx-auto border border-gray-200 bg-white shadow-sm">
        <GradientFormHeader
          icon={Settings}
          title={getTitle()}
          description="Configure attendance, approval, and notification settings for an employee category"
        />
        <CardContent className="px-6 py-4 space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-600">Loading setting data...</div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-6">
              {showErrors && Object.keys(errors).length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Please correct the highlighted fields before saving.
                </div>
              )}

              <div className="space-y-3">
                <SubFormTitle title="Basic Details" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SingleSelectField
                    label="Employee Category"
                    placeholder="Select Category"
                    value={formData.employeeCategoryCode}
                    onChange={(value) => updateRoot("employeeCategoryCode", value)}
                    options={categoryOptions as any}
                    required
                    disabled={isViewMode || isEditMode}
                    errorMessage={showErrors ? errors.employeeCategoryCode : undefined}
                  />
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Source Email</Label>
                    <Input
                      value={formData.sourceEmailAddess}
                      onChange={(e) => updateRoot("sourceEmailAddess", e.target.value)}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${disabledFieldStyles} ${errors.sourceEmailAddess ? "border-red-500" : ""}`}
                    />
                    {showErrors && errors.sourceEmailAddess && <p className="text-xs text-red-600">{errors.sourceEmailAddess}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Source Email Password</Label>
                    <Input
                      type="password"
                      value={formData.sourceEmailPassward}
                      onChange={(e) => updateRoot("sourceEmailPassward", e.target.value)}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${disabledFieldStyles} ${errors.sourceEmailPassward ? "border-red-500" : ""}`}
                    />
                    {showErrors && errors.sourceEmailPassward && <p className="text-xs text-red-600">{errors.sourceEmailPassward}</p>}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Approval Levels" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    ["leaveApprovalLevel", "Leave Approval"],
                    ["punchApprovalLevel", "Punch Approval"],
                    ["outDutyApprovalLevel", "Out Duty Approval"],
                    ["shiftApprovalLevel", "Shift Approval"],
                  ].map(([field, label]) => (
                    <NumericInput
                      key={field}
                      label={label}
                      value={(formData.levelOfApprovals as any)[field]}
                      onChange={(value) => updateSection("levelOfApprovals", field as any, value)}
                      disabled={isViewMode}
                      hasError={!!(showErrors && errors[`levelOfApprovals.${field}`])}
                      helperText={showErrors ? errors[`levelOfApprovals.${field}`] : undefined}
                      className="border-gray-300 px-3 py-1.5 text-sm"
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Shift Grace Settings" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    ["outAboveMargin", "Out Above Margin"],
                    ["lateInAllowedTime", "Late In Allowed"],
                    ["inAboveMargin", "In Above Margin"],
                    ["inAheadMargin", "In Ahead Margin"],
                    ["outAheadMargin", "Out Ahead Margin"],
                    ["graceIn", "Grace In"],
                    ["graceOut", "Grace Out"],
                    ["earlyOutAllowedTime", "Early Out Allowed"],
                  ].map(([field, label]) => (
                    <NumericInput
                      key={field}
                      label={label}
                      value={(formData.shiftGraceSettings as any)[field]}
                      onChange={(value) => updateSection("shiftGraceSettings", field as any, value)}
                      disabled={isViewMode}
                      hasError={!!(showErrors && errors[`shiftGraceSettings.${field}`])}
                      helperText={showErrors ? errors[`shiftGraceSettings.${field}`] : undefined}
                      className="border-gray-300 px-3 py-1.5 text-sm"
                    />
                  ))}
                </div>
                <ToggleField
                  label="Lunch Hour Deduction"
                  checked={formData.shiftGraceSettings.lunchHourDeduction}
                  onChange={(value) => updateSection("shiftGraceSettings", "lunchHourDeduction", value)}
                  disabled={isViewMode}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Generic Settings" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    ["allowMobileApp", "Allow Mobile App"],
                    ["includeHolidayInPresentDays", "Include Holiday In Present Days"],
                    ["allowAttendanceFromMobileApp", "Allow Attendance From Mobile App"],
                    ["autoMarkPresent", "Auto Mark Present"],
                    ["includeLeaveInPresentDays", "Include Leave In Present Days"],
                    ["allowEmail", "Allow Email"],
                    ["ceilingLimitApplicableForPFContribution", "PF Ceiling Limit Applicable"],
                    ["allowEmailNotification", "Allow Email Notification"],
                    ["temporaryEmployee", "Temporary Employee"],
                    ["allowManualSwipesFromWeb", "Allow Manual Swipes From Web"],
                    ["excludeWeekOffFromPayableDays", "Exclude Week Off From Payable Days"],
                  ].map(([field, label]) => (
                    <ToggleField
                      key={field}
                      label={label}
                      checked={(formData.genericSettings as any)[field]}
                      onChange={(value) => updateSection("genericSettings", field as any, value)}
                      disabled={isViewMode}
                    />
                  ))}
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