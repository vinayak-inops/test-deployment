"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "react-toastify"
import { StepIndicator } from "./step-indicator"
import { Button } from "@repo/ui/components/ui/button"

import PolicyDetailsForm from "./policy-details-form"
import { RulesRestrictionsForm } from "./rules-restrictions-form"
import { AccrualSettingsForm } from "./accrual-settings-form"
import { BalanceManagementForm } from "./balance-management-form"
import { EncashmentForm } from "./encashment-form"
import { X } from "lucide-react"
import { OrganizationForm } from "./organization-form"

import {
  LeavePolicyWithOrganizationFormData,
  defaultLeavePolicyFormValues,
  defaultLeavePolicyValues,
  leavePolicyFormSchema,
} from "./schemas/leave-policy.schema"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { roleControlKeys } from "@/app/hierarchy/permission/role/_components/role-control-schema"

type SectionId =
  | "organization"
  | "policyDetails"
  | "rulesRestrictions"
  | "accrualSettings"
  | "balanceManagement"
  | "encashment"

export default function LeavePolicyController({ activeSection }: { activeSection?: SectionId }) {
  const tenantCode = useGetTenantCode()
  const searchParams = useSearchParams()
  const form = searchParams.get("form")

  const id = searchParams.get("id")
  const mode = (searchParams.get("mode") as any) || "add"
  const isViewMode = mode === "view"
  const isAddMode = mode === "add"
  const [showErrors, setShowErrors] = useState(false)
  const [feactApi, setFeactApi] = useState("draft/leave_policy/search")
  const [currentStep, setCurrentStep] = useState(1)
  const [visibleStepLabel, setVisibleStepLabel] = useState<number | null>(null)
  const [showStepErrors, setShowStepErrors] = useState(false)
  const [existingRecord, setExistingRecord] = useState<any | null>(null)
  const { employeeId } = useKeyclockRoleInfo()
  const router = useRouter()

  const handleCancel = () => {
    router.push("/policy-management/leave-policy")
  }

  useEffect(() => {
    setFeactApi("leave_policy/search")
  }, [form])

  type OptionItem = {
    code: string
    name: string
    subsidiaryCode?: string
  }

  const toOptions = (list: any[], codeKeys: string[], nameKeys: string[]): OptionItem[] =>
    (Array.isArray(list) ? list : [])
      .map((item: any) => {
        const code = codeKeys.map((k) => item?.[k]).find((v) => typeof v === "string" && v.trim()) || ""
        const name = nameKeys.map((k) => item?.[k]).find((v) => typeof v === "string" && v.trim()) || ""
        const subsidiaryCode =
          (typeof item?.subsidiaryCode === "string" && item.subsidiaryCode) ||
          (typeof item?.subsidiary_code === "string" && item.subsidiary_code) ||
          ""
        return { code, name, subsidiaryCode }
      })
      .filter((item) => item.code)

  // ─────────────────────────────────────────────
  // React Hook Form (FULL DATA)
  // ─────────────────────────────────────────────
  const {
    register,
    watch,
    setValue,
    reset,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<LeavePolicyWithOrganizationFormData>({
    resolver: zodResolver(leavePolicyFormSchema),
    mode: "onChange",
    defaultValues: defaultLeavePolicyFormValues,
  })

  // REGISTER ALL FIELDS (multi-tab fix)
  useEffect(() => {
    Object.keys(defaultLeavePolicyFormValues).forEach((key) => {
      register(key as keyof LeavePolicyWithOrganizationFormData)
    })
  }, [register])

  // ─────────────────────────────────────────────
  // Get watched values for step validation
  // ─────────────────────────────────────────────
  const watchedValues = watch()

  // Step 1 validation: Organization step
  const isStep1Valid = useMemo(() => {
    const hasSubsidiary =
      watchedValues.subsidiary?.subsidiaryCode && watchedValues.subsidiary.subsidiaryCode.trim() !== ""
    const hasLeaveCode = watchedValues.leaveCode && watchedValues.leaveCode.trim() !== ""
    const hasLeaveTitle = watchedValues.leaveTitle && watchedValues.leaveTitle.trim() !== ""

    return !!(hasSubsidiary && hasLeaveCode && hasLeaveTitle)
  }, [watchedValues.subsidiary, watchedValues.leaveCode, watchedValues.leaveTitle])

  // Step 2 validation: Policy Details
  const isStep2Valid = useMemo(() => {
    const hasEffectiveFrom = !!watchedValues.effectiveFrom && watchedValues.effectiveFrom.trim() !== ""
    const hasGenderAllowed = !!watchedValues.genderAllowed
    const hasLeaveType = !!watchedValues.leaveType
    const hasLeaveCategory = !!watchedValues.leaveCategory

    return !!(hasEffectiveFrom && hasGenderAllowed && hasLeaveType && hasLeaveCategory)
  }, [watchedValues.effectiveFrom, watchedValues.genderAllowed, watchedValues.leaveType, watchedValues.leaveCategory])

  // Step 3 validation: Rules & Restrictions
  const isStep3Valid = useMemo(() => {
    const hasPreAppLeaveDays =
      watchedValues.preApplication?.leaveDaysMoreThan !== undefined &&
      watchedValues.preApplication.leaveDaysMoreThan >= 0
    const hasPreAppApplyBefore =
      watchedValues.preApplication?.applyBeforeDays !== undefined && watchedValues.preApplication.applyBeforeDays >= 0
    const hasAutoApprovalDays =
      watchedValues.autoApproval?.daysForAutoApproval !== undefined &&
      watchedValues.autoApproval.daysForAutoApproval >= 0
    const hasReminderFrequency =
      watchedValues.reminderFrequencyToApprover !== undefined && watchedValues.reminderFrequencyToApprover >= 0
    const hasAlertManagerDays =
      watchedValues.alertManagerDaysBeforeLeaveStart !== undefined &&
      watchedValues.alertManagerDaysBeforeLeaveStart >= 0
    const hasMaxBackDays =
      watchedValues.maximumBackDaysApplicationAllowed !== undefined &&
      watchedValues.maximumBackDaysApplicationAllowed >= 0
    const hasMaxFutureDays =
      watchedValues.maximumFutureDaysApplicationAllowed !== undefined &&
      watchedValues.maximumFutureDaysApplicationAllowed >= 0
    const hasRequireDocs =
      watchedValues.requireDocsIfLeaveDaysExceeds !== undefined && watchedValues.requireDocsIfLeaveDaysExceeds >= 0

    return !!(
      hasPreAppLeaveDays &&
      hasPreAppApplyBefore &&
      hasAutoApprovalDays &&
      hasReminderFrequency &&
      hasAlertManagerDays &&
      hasMaxBackDays &&
      hasMaxFutureDays &&
      hasRequireDocs
    )
  }, [
    watchedValues.preApplication?.leaveDaysMoreThan,
    watchedValues.preApplication?.applyBeforeDays,
    watchedValues.autoApproval?.daysForAutoApproval,
    watchedValues.reminderFrequencyToApprover,
    watchedValues.alertManagerDaysBeforeLeaveStart,
    watchedValues.maximumBackDaysApplicationAllowed,
    watchedValues.maximumFutureDaysApplicationAllowed,
    watchedValues.requireDocsIfLeaveDaysExceeds,
  ])

  // Step 4 validation: Accrual Settings
  const isStep4Valid = useMemo(() => {
    const hasReminderFrequency =
      watchedValues.reminderFrequencyToApprover !== undefined && watchedValues.reminderFrequencyToApprover >= 0
    const hasAccrualType =
      watchedValues.leaveAccrual?.accrualType && watchedValues.leaveAccrual.accrualType.trim() !== ""
    const hasDayId = watchedValues.leaveAccrual?.dayId !== undefined && watchedValues.leaveAccrual.dayId >= 0
    const hasAccrualDays =
      watchedValues.leaveAccrual?.accrualPolicy?.accrualDays !== undefined &&
      watchedValues.leaveAccrual.accrualPolicy.accrualDays >= 0
    const hasWorkingDays =
      watchedValues.leaveAccrual?.accrualPolicy?.workingDays !== undefined &&
      watchedValues.leaveAccrual.accrualPolicy.workingDays >= 0
    const hasMaxBalanceCarried =
      watchedValues.leaveAccrual?.maximumBalanceCarriedForward !== undefined &&
      watchedValues.leaveAccrual.maximumBalanceCarriedForward >= 0

    return !!(hasReminderFrequency && hasAccrualType && hasDayId && hasAccrualDays && hasWorkingDays && hasMaxBalanceCarried)
  }, [
    watchedValues.reminderFrequencyToApprover,
    watchedValues.leaveAccrual?.accrualType,
    watchedValues.leaveAccrual?.dayId,
    watchedValues.leaveAccrual?.accrualPolicy?.accrualDays,
    watchedValues.leaveAccrual?.accrualPolicy?.workingDays,
    watchedValues.leaveAccrual?.maximumBalanceCarriedForward,
  ])

  // Step 5 validation: Balance Management
  const isStep5Valid = useMemo(() => {
    const hasAllowedNegativeBalance =
      watchedValues.balance?.allowedNegativeBalance !== undefined && watchedValues.balance.allowedNegativeBalance >= 0
    const hasMinServicePeriod =
      watchedValues.balance?.minServicePeriodRequired !== undefined &&
      watchedValues.balance.minServicePeriodRequired >= 0
    const hasMaxBalanceAllowed =
      watchedValues.balance?.maximumBalanceAllowed !== undefined && watchedValues.balance.maximumBalanceAllowed >= 0
    const hasLapseLeaveBalance = watchedValues.balance?.lapseLeaveBalanceAtYearEnd !== undefined

    return !!(hasAllowedNegativeBalance && hasMinServicePeriod && hasMaxBalanceAllowed && hasLapseLeaveBalance)
  }, [
    watchedValues.balance?.allowedNegativeBalance,
    watchedValues.balance?.minServicePeriodRequired,
    watchedValues.balance?.maximumBalanceAllowed,
    watchedValues.balance?.lapseLeaveBalanceAtYearEnd,
  ])

  // Step 6 validation: Encashment
  const isStep6Valid = useMemo(() => {
    const hasMinimumBalanceRequired =
      watchedValues.encashment?.minimumBalanceRequired !== undefined &&
      watchedValues.encashment.minimumBalanceRequired >= 0
    const hasMaximumAllowedEncashment =
      watchedValues.encashment?.maximumAllowedEncashment !== undefined &&
      watchedValues.encashment.maximumAllowedEncashment >= 0
    const hasMaxApplicationYearly =
      watchedValues.encashment?.maximumApplicationAllowedYearly !== undefined &&
      watchedValues.encashment.maximumApplicationAllowedYearly >= 0
    const hasMaxEncashmentPerApp =
      watchedValues.encashment?.maximumEncashmentPerApplication !== undefined &&
      watchedValues.encashment.maximumEncashmentPerApplication >= 0

    return !!(hasMinimumBalanceRequired && hasMaximumAllowedEncashment && hasMaxApplicationYearly && hasMaxEncashmentPerApp)
  }, [
    watchedValues.encashment?.minimumBalanceRequired,
    watchedValues.encashment?.maximumAllowedEncashment,
    watchedValues.encashment?.maximumApplicationAllowedYearly,
    watchedValues.encashment?.maximumEncashmentPerApplication,
  ])

  // Compute completed steps based on validation
  const completedSteps = useMemo(() => {
    const completed: number[] = []
    if (isStep1Valid) completed.push(1)
    if (isStep2Valid) completed.push(2)
    if (isStep3Valid) completed.push(3)
    if (isStep4Valid) completed.push(4)
    if (isStep5Valid) completed.push(5)
    if (isStep6Valid) completed.push(6)

    return completed
  }, [isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid, isStep5Valid, isStep6Valid])

  // Compute failed steps when showing errors
  const failedSteps = useMemo(() => {
    if (!showStepErrors && !showErrors) return []
    const hasStep1Errors = Boolean(
      errors.leaveCode ||
      errors.leaveTitle ||
      errors.subsidiary ||
      errors.location ||
      errors.designation ||
      errors.employeeCategory
    )
    const hasStep2Errors = Boolean(
      errors.effectiveFrom ||
      errors.genderAllowed ||
      errors.leaveType ||
      errors.leaveCategory ||
      errors.maritalStatus
    )
    const hasStep3Errors = Boolean(
      errors.minimumServicePeriodRequired ||
      errors.minimumDaysPerApplication ||
      errors.maximumDaysPerApplication ||
      errors.maximumLeaveAllowed ||
      errors.maximumApplicationAllowed ||
      errors.preApplication ||
      errors.autoApproval ||
      errors.reminderFrequencyToApprover ||
      errors.alertManagerDaysBeforeLeaveStart ||
      errors.maximumBackDaysApplicationAllowed ||
      errors.maximumFutureDaysApplicationAllowed ||
      errors.requireDocsIfLeaveDaysExceeds ||
      errors.sandwichHolidayAsLeave ||
      errors.sandwichWeekOffAsLeave
    )
    const hasStep4Errors = Boolean(errors.leaveAccrual)
    const hasStep5Errors = Boolean(errors.balance)
    const hasStep6Errors = Boolean(errors.encashment)

    const failed: number[] = []
    if (hasStep1Errors) failed.push(1)
    if (hasStep2Errors) failed.push(2)
    if (hasStep3Errors) failed.push(3)
    if (hasStep4Errors) failed.push(4)
    if (hasStep5Errors) failed.push(5)
    if (hasStep6Errors) failed.push(6)

    return failed
  }, [showStepErrors, showErrors, errors])

  // Handle next step navigation
  const handleNextStep = () => {
    if (isViewMode) return

    let currentStepValid = false
    let errorMessage = ""

    switch (currentStep) {
      case 1:
        currentStepValid = isStep1Valid
        errorMessage = "Please complete Organization details before continuing."
        break
      case 2:
        currentStepValid = isStep2Valid
        errorMessage = "Please complete Policy Details before continuing."
        break
      case 3:
        currentStepValid = isStep3Valid
        errorMessage = "Please complete Rules & Restrictions before continuing."
        break
      case 4:
        currentStepValid = isStep4Valid
        errorMessage = "Please complete Accrual Settings before continuing."
        break
      case 5:
        currentStepValid = isStep5Valid
        errorMessage = "Please complete Balance Management before continuing."
        break
      case 6:
        if (isStep6Valid) {
          handleSave()
        } else {
          setShowErrors(true)
          setShowStepErrors(true)
        }
        return
      default:
        currentStepValid = true
    }

    if (!currentStepValid) {
      setShowErrors(true)
      setShowStepErrors(true)
      return
    }

    const nextStep = Math.min(currentStep + 1, 6)
    setShowStepErrors(false)
    setCurrentStep(nextStep)
  }

  // Handle step change from StepIndicator
  const handleStepChange = (step: number) => {
    if (isViewMode) {
      setCurrentStep(step)
      return
    }

    // Allow going back freely
    if (step < currentStep) {
      setCurrentStep(step)
      setShowStepErrors(false)
      return
    }

    // For forward navigation, check if current step is valid
    if (step > currentStep) {
      // In add mode allow only one-step forward to avoid skipping.
      if (isAddMode && step !== currentStep + 1) {
        setShowErrors(true)
        setShowStepErrors(true)
        return
      }

      let currentStepValid = false
      switch (currentStep) {
        case 1:
          currentStepValid = isStep1Valid
          break
        case 2:
          currentStepValid = isStep2Valid
          break
        case 3:
          currentStepValid = isStep3Valid
          break
        case 4:
          currentStepValid = isStep4Valid
          break
        case 5:
          currentStepValid = isStep5Valid
          break
        case 6:
          currentStepValid = isStep6Valid
          break
      }

      if (currentStepValid) {
        setShowStepErrors(false)
        setCurrentStep(step)
      } else {
        setShowErrors(true)
        setShowStepErrors(true)
      }
    }
  }

  // ─────────────────────────────────────────────
  // Fetch (GET) - Only fetch if NOT in add mode
  // ─────────────────────────────────────────────
  const { refetch, loading: fetchLoading } = useRequest<any>({
    url: feactApi,
    method: "POST",
    data: [{ field: "_id", value: id, operator: "eq" }],
    onSuccess: (res) => {
      const isEmptyObjectArray =
        Array.isArray(res) && res.length === 1 && res[0] && Object.keys(res[0]).length === 0

      if (isEmptyObjectArray) {
        return
      }

      if (res?.[0] && Object.keys(res[0]).length > 0) {
        const record = res[0]
        setExistingRecord(record)
        const p = record.leavePolicy || record

        // Populate all leave policy fields first (includes leaveCode and leaveTitle)
        Object.keys(defaultLeavePolicyValues).forEach((key) => {
          setValue(
            key as keyof LeavePolicyWithOrganizationFormData,
            (p?.[key] ?? defaultLeavePolicyValues[key as keyof typeof defaultLeavePolicyValues]) as any,
            { shouldDirty: false }
          )
        })

        setValue("subsidiary", record.subsidiary || { subsidiaryCode: "", subsidiaryName: "" }, { shouldDirty: false })
        setValue("location", record.location || { locationCode: "", locationName: "" }, { shouldDirty: false })
        setValue("designation", record.designation || { designationCode: "", designationName: "" }, {
          shouldDirty: false,
        })
        setValue("employeeCategory", Array.isArray(record.employeeCategory) ? record.employeeCategory : [], {
          shouldDirty: false,
        })
      } else {
        setExistingRecord(null)
        toast.info("No data found")
        reset(defaultLeavePolicyFormValues as LeavePolicyWithOrganizationFormData)
      }
    },
    onError: (err) => {
      console.error(err)
      setExistingRecord(null)
      reset(defaultLeavePolicyFormValues as LeavePolicyWithOrganizationFormData)
    },
  })

  useEffect(() => {
    if (id && mode !== "add") {
      void refetch()
    } else {
      reset(defaultLeavePolicyFormValues as LeavePolicyWithOrganizationFormData)
    }
  }, [])

  const organizationCriteriaRequests = useMemo(
    () => [
      {
        field: "tenantCode",
        operator: "is",
        value: tenantCode,
      },
    ],
    [tenantCode]
  )

  const {
    arrayData: subsidiariesArray,
    loading: subsidiariesLoading,
    error: subsidiariesError,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const {
    arrayData: designationsArray,
    loading: designationsLoading,
    error: designationsError,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "designations",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const {
    arrayData: employeeCategoriesArray,
    loading: employeeCategoriesLoading,
    error: employeeCategoriesError,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "employeeCategories",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const {
    arrayData: locationsArray,
    loading: locationsLoading,
    error: locationsError,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "location",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const subsidiaries = useMemo(
    () => toOptions(subsidiariesArray, ["subsidiaryCode", "code", "id"], ["subsidiaryName", "name", "title"]),
    [subsidiariesArray]
  )

  const designations = useMemo(
    () => toOptions(designationsArray, ["designationCode", "code", "id"], ["designationName", "name", "title"]),
    [designationsArray]
  )

  const locations = useMemo(
    () => toOptions(locationsArray, ["locationCode", "code", "id"], ["locationName", "name", "title"]),
    [locationsArray]
  )

  const employeeCategories = useMemo(
    () =>
      toOptions(
        employeeCategoriesArray,
        ["employeeCategoryCode", "categoryCode", "code", "id"],
        ["employeeCategoryName", "categoryName", "name", "title"]
      ),
    [employeeCategoriesArray]
  )

  const orgLoading = subsidiariesLoading || designationsLoading || employeeCategoriesLoading || locationsLoading
  const orgError = subsidiariesError || designationsError || employeeCategoriesError || locationsError

  useEffect(() => {
    if (!activeSection) return
    const stepMap: Record<SectionId, number> = {
      organization: 1,
      policyDetails: 2,
      rulesRestrictions: 3,
      accrualSettings: 4,
      balanceManagement: 5,
      encashment: 6,
    }
    setCurrentStep(stepMap[activeSection])
  }, [activeSection])

  // ─────────────────────────────────────────────
  // Save (POST) - Only called from step 6
  // ─────────────────────────────────────────────
  const { post, loading } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      const responseData =
        response?.data && typeof response.data === "object" ? response.data : response
      const businessStatus =
        responseData && typeof responseData === "object" ? (responseData as any).status : undefined

      if (businessStatus === false) {
        setShowErrors(true)
        setShowStepErrors(true)

        const applyFieldError = (fieldName: string, message: string) => {
          const normalized = fieldName.trim()
          if (!normalized || !message.trim()) return
          setError(normalized as any, {
            type: "server",
            message,
          })
        }

        const applyNestedErrors = (prefix: string, value: unknown) => {
          if (typeof value === "string") {
            applyFieldError(prefix, value)
            return
          }
          if (!value || typeof value !== "object") return

          Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
            const nextPrefix = prefix ? `${prefix}.${childKey}` : childKey
            applyNestedErrors(nextPrefix, childValue)
          })
        }

        let firstErrorMessage = ""
        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return

            if (typeof message === "string") {
              if (!firstErrorMessage) firstErrorMessage = message
              applyFieldError(fieldName, message)
              return
            }

            if (!firstErrorMessage && message && typeof message === "object") {
              const firstLeaf = Object.values(message as Record<string, unknown>).find((v) => typeof v === "string")
              if (typeof firstLeaf === "string") firstErrorMessage = firstLeaf
            }
            applyNestedErrors(fieldName, message)
          })
        }

        toast.error(firstErrorMessage || "Please fix highlighted fields.")
        return
      }
      
      toast.success("Saved successfully")
      router.push("/policy-management/leave-policy")
    },
  })

  const handleSave = async () => {
    setShowErrors(true)
    clearErrors()
    const valid = await trigger()
    if (!valid) return

    const formData = watch() as any
    const now = new Date().toISOString()
    const isEdit = Boolean(id)
    const existing = existingRecord
    const leavePolicyData = Object.keys(defaultLeavePolicyValues).reduce(
      (acc, key) => {
        acc[key] = formData[key]
        return acc
      },
      {} as Record<string, any>
    )

    post({
      tenant: tenantCode,
      action: id ? "update" : "insert",
      id: id || undefined,
      collectionName: "leave_policy",
      event: "validate",
      ruleId: "leavePolicyValidator",
      data: {
        leavePolicy: leavePolicyData,
        subsidiary: formData.subsidiary || { subsidiaryCode: "", subsidiaryName: "" },
        location: formData.location || { locationCode: "", locationName: "" },
        designation: formData.designation || { designationCode: "", designationName: "" },
        employeeCategory: Array.isArray(formData.employeeCategory) ? formData.employeeCategory : [],
        tenantCode,
        organizationCode: tenantCode,
        createdBy: existing?.created_by ?? employeeId ?? "",
        createdOn: existing?.created_at ?? now,
        updatedBy: isEdit ? employeeId ?? null : null,
        updatedOn: isEdit ? now : null,
        isVerified: true
      },
    })
  }

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  const steps = [
    { number: 1, label: "Organization" },
    { number: 2, label: "Policy Details" },
    { number: 3, label: "Rules & Restrictions" },
    { number: 4, label: "Accrual Settings" },
    { number: 5, label: "Balance Management" },
    { number: 6, label: "Encashment" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white shadow-xl border-l border-gray-200 w-full max-w-6xl h-full overflow-hidden flex flex-col rounded-l-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-8 w-8 rounded-full hover:bg-gray-100 absolute top-4 right-4 z-50 ml-auto"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex-1 overflow-hidden bg-gray-50">
          <div className="flex h-full overflow-hidden relative">
            <StepIndicator
              currentStep={currentStep}
              visibleStepLabel={visibleStepLabel}
              completedSteps={completedSteps}
              failedSteps={failedSteps}
              steps={steps}
              isAddMode={isAddMode}  
              onStepChange={handleStepChange}
              onStepLabelToggle={(step) => setVisibleStepLabel(visibleStepLabel === step ? null : step)}
              onStepLabelClose={() => setVisibleStepLabel(null)}
            />
            <div className="flex-1 overflow-y-auto">
              <div className="w-full h-full">
                {currentStep === 1 && (
                  <OrganizationForm
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    isValid={isValid}
                    isViewMode={isViewMode}
                    onSave={handleNextStep}
                    showErrors={showErrors}
                    hasStepErrors={Boolean(
                      errors.leaveCode ||
                      errors.leaveTitle ||
                      errors.subsidiary ||
                      errors.location ||
                      errors.designation ||
                      errors.employeeCategory
                    )}
                    postLoading={loading}
                    isAddMode={isAddMode}
                    subsidiaries={subsidiaries}
                    locations={locations}
                    designations={designations}
                    employeeCategories={employeeCategories}
                    orgLoading={orgLoading}
                  />
                )}
                {currentStep === 2 && (
                  <PolicyDetailsForm
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    isValid={isValid}
                    isViewMode={isViewMode}
                    onSave={handleNextStep}
                    showErrors={showErrors}
                    hasStepErrors={Boolean(
                      errors.effectiveFrom ||
                      errors.genderAllowed ||
                      errors.leaveType ||
                      errors.leaveCategory ||
                      errors.maritalStatus ||
                      errors.minimumServicePeriodRequired ||
                      errors.minimumDaysPerApplication ||
                      errors.maximumDaysPerApplication ||
                      errors.alertManagerDaysBeforeLeaveStart ||
                      errors.halfDayAllowed ||
                      errors.maximumLeaveAllowed ||
                      errors.maximumApplicationAllowed
                    )}
                    postLoading={loading}
                  />
                )}
                {currentStep === 3 && (
                  <RulesRestrictionsForm
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    isValid={isValid}
                    isViewMode={isViewMode}
                    onSave={handleNextStep}
                    showErrors={showErrors}
                    hasStepErrors={Boolean(
                      errors.sandwichHolidayAsLeave ||
                      errors.sandwichWeekOffAsLeave ||
                      errors.canStartOrEndOnHoliday ||
                      errors.canStartOrEndOnWeekOff ||
                      errors.preApplication ||
                      errors.autoApproval ||
                      errors.cannotCombineWith ||
                      errors.allowedInNoticePeriod ||
                      errors.alertManagerAfterApproval ||
                      errors.delegateApplicable ||
                      errors.reminderFrequencyToApprover ||
                      errors.alertManagerDaysBeforeLeaveStart ||
                      errors.maximumBackDaysApplicationAllowed ||
                      errors.maximumFutureDaysApplicationAllowed ||
                      errors.requireDocsIfLeaveDaysExceeds
                    )}
                    postLoading={loading}
                  />
                )}
                {currentStep === 4 && (
                  <AccrualSettingsForm
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    isValid={isValid}
                    isViewMode={isViewMode}
                    onSave={handleNextStep}
                    showErrors={showErrors}
                    hasStepErrors={Boolean(
                      errors.leaveAccrual ||
                      errors.reminderFrequencyToApprover
                    )}
                    postLoading={loading}
                  />
                )}
                {currentStep === 5 && (
                  <BalanceManagementForm
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    isValid={isValid}
                    isViewMode={isViewMode}
                    onSave={handleNextStep}
                    showErrors={showErrors}
                    hasStepErrors={Boolean(errors.balance)}
                    postLoading={loading}
                  />
                )}
                {currentStep === 6 && (
                  <EncashmentForm
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    isValid={isValid}
                    isViewMode={isViewMode}
                    onSave={handleSave}
                    showErrors={showErrors}
                    hasStepErrors={Boolean(errors.encashment)}
                    postLoading={loading}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
